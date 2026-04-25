#!/usr/bin/env node
/**
 * Completa el import del backlog de forma IDEMPOTENTE:
 *  - Lista issues existentes del repo y items existentes del Project
 *  - Para cada fila del CSV:
 *      · BE-* o FE-* sin issue → crea issue
 *      · BE-* o FE-* con issue pero sin Project → agrega al Project
 *      · OP-* sin draft → crea draft item en el Project
 *      · Si ya está todo, no hace nada
 *
 * Uso:
 *   node scripts/complete-import.mjs <PROJECT_NUMBER>
 *
 * Pre-requisitos:
 *   - gh CLI con scopes: repo, project
 *     (si te falta project, corré: gh auth refresh -s project --hostname github.com)
 */

import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const OWNER          = 'gonzalo2309'
const REPO           = `${OWNER}/profi`
const PROJECT_NUMBER = process.argv[2]
const CSV_PATH       = 'docs/backlog/backlog.csv'

if (!PROJECT_NUMBER) {
  console.error('Uso: node scripts/complete-import.mjs <PROJECT_NUMBER>')
  process.exit(1)
}
if (!existsSync(CSV_PATH)) {
  console.error(`No encuentro ${CSV_PATH}`)
  process.exit(1)
}

// ─── Verificar scopes del token ────────────────────────────────────────────────
let authStatus = ''
try {
  authStatus = execSync('gh auth status', { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] })
} catch (err) {
  authStatus = (err.stdout?.toString() || '') + (err.stderr?.toString() || '')
}
if (!/scopes:.*project/i.test(authStatus)) {
  console.error('❌ El token de gh NO tiene el scope "project".')
  console.error('   Corré:  gh auth refresh -s project --hostname github.com')
  console.error('   Después volvé a correr este script.')
  process.exit(1)
}

// ─── Parser CSV ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = []
  let row = [], cur = '', inQuote = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuote) {
      if (c === '"' && text[i+1] === '"') { cur += '"'; i++ }
      else if (c === '"') inQuote = false
      else cur += c
    } else {
      if (c === '"') inQuote = true
      else if (c === ',') { row.push(cur); cur = '' }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
      else if (c !== '\r') cur += c
    }
  }
  if (cur || row.length) { row.push(cur); rows.push(row) }
  return rows.filter(r => r.some(f => f.trim()))
}

const csv               = readFileSync(CSV_PATH, 'utf8')
const [header, ...items] = parseCSV(csv)
const col       = (name) => header.indexOf(name)
const I_ID      = col('ID')
const I_TITLE   = col('Title')
const I_REPO    = col('Repo')
const I_PRIO    = col('Priority')
const I_LABELS  = col('Labels')
const I_DESC    = col('Description')

console.log(`Procesando ${items.length} tareas del backlog\n`)

// ─── Issues existentes del repo (matching por título) ─────────────────────────
console.log('→ Listando issues del repo...')
const existingIssues = JSON.parse(execSync(
  `gh issue list --repo ${REPO} --state all --limit 500 --json number,title,url`,
  { encoding: 'utf8' }
))
const titleToIssue = new Map(existingIssues.map(i => [i.title, i]))
console.log(`  ${existingIssues.length} issues encontradas\n`)

// ─── Items existentes del Project ─────────────────────────────────────────────
console.log('→ Listando items del Project...')
const projectItemsJson = execSync(
  `gh project item-list ${PROJECT_NUMBER} --owner ${OWNER} --limit 500 --format json`,
  { encoding: 'utf8' }
)
const projectItems = (JSON.parse(projectItemsJson).items) || []
const projectIssueNumbers = new Set()
const projectDraftTitles  = new Set()
for (const it of projectItems) {
  if (it.content?.number) projectIssueNumbers.add(it.content.number)
  if (it.title && (it.content?.type === 'DraftIssue' || !it.content?.number)) {
    projectDraftTitles.add(it.title)
  }
}
console.log(`  ${projectItems.length} items en el project (${projectIssueNumbers.size} issues + ${projectDraftTitles.size} drafts)\n`)

// ─── Procesar cada item del CSV ───────────────────────────────────────────────
let issuesCreated = 0, issuesAdded = 0, draftsCreated = 0, skipped = 0, errors = 0

for (const row of items) {
  const id       = row[I_ID]
  const title    = `[${id}] ${row[I_TITLE]}`
  const priority = row[I_PRIO]
  const labels   = [priority, ...row[I_LABELS].split(',').map(s => s.trim()).filter(Boolean)]
  const body     = [
    row[I_DESC],
    '',
    '---',
    `**Prioridad:** ${priority}`,
    `**Área:** ${row[I_REPO]}`,
    `**ID interno:** ${id}`,
  ].join('\n')

  try {
    // ── OP-*: draft item en el Project ──
    if (id.startsWith('OP-')) {
      if (projectDraftTitles.has(title)) {
        console.log(`= ${id.padEnd(7)} draft ya existe`)
        skipped++; continue
      }
      execSync(
        `gh project item-create ${PROJECT_NUMBER} --owner ${OWNER} --title ${JSON.stringify(title)} --body ${JSON.stringify(body)}`,
        { stdio: 'pipe' }
      )
      console.log(`✓ ${id.padEnd(7)} draft creado`)
      draftsCreated++
      continue
    }

    // ── BE-* / FE-*: asegurar issue + asegurar en project ──
    let issue = titleToIssue.get(title)
    if (!issue) {
      const labelArgs = labels.map(l => `--label ${JSON.stringify(l)}`).join(' ')
      const url = execSync(
        `gh issue create --repo ${REPO} --title ${JSON.stringify(title)} --body ${JSON.stringify(body)} ${labelArgs}`,
        { encoding: 'utf8' }
      ).trim()
      const m = url.match(/issues\/(\d+)/)
      issue = { url, number: m ? Number(m[1]) : null }
      console.log(`✓ ${id.padEnd(7)} issue creada #${issue.number}`)
      issuesCreated++
    }

    if (issue.number && !projectIssueNumbers.has(issue.number)) {
      execSync(
        `gh project item-add ${PROJECT_NUMBER} --owner ${OWNER} --url ${issue.url}`,
        { stdio: 'pipe' }
      )
      console.log(`+ ${id.padEnd(7)} agregada al project (#${issue.number})`)
      issuesAdded++
    } else if (issue.number) {
      console.log(`= ${id.padEnd(7)} #${issue.number} ya está en el project`)
      skipped++
    }
  } catch (err) {
    const msg = (err.stderr?.toString() || err.message || '').split('\n')[0].slice(0, 200)
    console.error(`✗ ${id}: ${msg}`)
    errors++
  }
}

console.log('\n─── Resumen ───')
console.log(`  Issues creadas:    ${issuesCreated}`)
console.log(`  Issues agregadas:  ${issuesAdded}`)
console.log(`  Drafts creados:    ${draftsCreated}`)
console.log(`  Sin cambios:       ${skipped}`)
console.log(`  Errores:           ${errors}`)
console.log(`  Total procesado:   ${items.length}`)
