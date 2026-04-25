#!/usr/bin/env node
/**
 * Importa docs/backlog/backlog.csv al repositorio + GitHub Project.
 *
 * Crea:
 *  - Labels que falten (P0–P3 + temáticas: backend, frontend, leads, verificacion, …)
 *  - Issues en gonzalo2309/profi para tareas BE-* y FE-*
 *  - Draft items en el Project para tareas OP-* (producto, no técnicas)
 *  - Agrega todo al Project indicado
 *
 * Uso:
 *   node scripts/import-backlog.mjs <PROJECT_NUMBER>
 *
 * Pre-requisitos:
 *   - gh CLI instalado y autenticado (gh auth login)
 *   - Estar en la raíz del monorepo (donde vive docs/backlog/backlog.csv)
 *   - Project ya creado en github.com/users/gonzalo2309/projects/N
 */

import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const OWNER          = 'gonzalo2309'
const REPO           = `${OWNER}/profi`
const PROJECT_NUMBER = process.argv[2]
const CSV_PATH       = 'docs/backlog/backlog.csv'

// ─── Validaciones ─────────────────────────────────────────────────────────────
if (!PROJECT_NUMBER) {
  console.error('Uso: node scripts/import-backlog.mjs <PROJECT_NUMBER>')
  console.error('El PROJECT_NUMBER se ve en la URL del Project: .../projects/<N>')
  process.exit(1)
}

if (!existsSync(CSV_PATH)) {
  console.error(`No encuentro ${CSV_PATH}. Corré el script desde la raíz del monorepo.`)
  process.exit(1)
}

try {
  execSync('gh auth status', { stdio: 'pipe' })
} catch {
  console.error('gh CLI no autenticado. Corré: gh auth login')
  process.exit(1)
}

// ─── Parser CSV que respeta comillas dobles ───────────────────────────────────
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
const col = (name) => header.indexOf(name)

const I_ID       = col('ID')
const I_TITLE    = col('Title')
const I_REPO     = col('Repo')
const I_PRIORITY = col('Priority')
const I_LABELS   = col('Labels')
const I_DESC     = col('Description')

console.log(`Importando ${items.length} tareas a ${REPO} y al Project #${PROJECT_NUMBER}...\n`)

// ─── 1) Crear todas las labels (si ya existen, gh las reusa con --force) ──────
const COLORS = {
  P0: 'B60205', P1: 'D93F0B', P2: 'FBCA04', P3: '0E8A16',
  backend: '0052CC', frontend: '5319E7', producto: 'C2E0C6',
  bug: 'D93F0B', feature: '0E8A16', leads: 'BFD4F2',
  verificacion: 'BFDADC', rebranding: 'FBCA04', seguridad: 'B60205',
  infra: '5319E7', legal: 'C5DEF5', monetizacion: 'FBCA04',
  seo: 'D4C5F9', ux: 'FEF2C0', perf: 'BFDADC', i18n: 'C5DEF5',
  branding: 'FBCA04', medicion: 'C5DEF5', research: 'D4C5F9',
  growth: '0E8A16', refactor: 'BFD4F2', operaciones: 'C2E0C6',
  optim: 'BFDADC', compliance: 'C5DEF5', docs: 'C5DEF5',
  copy: 'FEF2C0', calidad: 'BFDADC', admin: '5319E7',
}

const allLabels = new Set(['P0', 'P1', 'P2', 'P3'])
for (const item of items) {
  for (const l of item[I_LABELS].split(',').map(s => s.trim()).filter(Boolean)) {
    allLabels.add(l)
  }
}

console.log(`Creando/actualizando ${allLabels.size} labels...`)
for (const label of allLabels) {
  const color = COLORS[label] || 'EDEDED'
  try {
    execSync(
      `gh label create "${label}" --repo ${REPO} --color "${color}" --force`,
      { stdio: 'pipe' }
    )
  } catch (err) {
    console.warn(`  (skip ${label})`)
  }
}
console.log('Labels OK.\n')

// ─── 2) Crear issues / draft items y agregar al project ───────────────────────
let ok = 0, fail = 0

for (const item of items) {
  const id       = item[I_ID]
  const title    = `[${id}] ${item[I_TITLE]}`
  const priority = item[I_PRIORITY]
  const labels   = [priority, ...item[I_LABELS].split(',').map(s => s.trim()).filter(Boolean)]
  const body     = [
    item[I_DESC],
    '',
    '---',
    `**Prioridad:** ${priority}`,
    `**Área:** ${item[I_REPO]}`,
    `**ID interno:** ${id}`,
  ].join('\n')

  try {
    if (id.startsWith('OP-')) {
      // Tareas de producto → draft en el Project (no issue del repo de código)
      execSync(
        `gh project item-create ${PROJECT_NUMBER} --owner ${OWNER} --title ${JSON.stringify(title)} --body ${JSON.stringify(body)}`,
        { stdio: 'pipe' }
      )
      console.log(`✓ ${id.padEnd(7)} (draft) ${item[I_TITLE]}`)
    } else {
      // BE-* o FE-* → issue real + agregar al project
      const labelArgs = labels.map(l => `--label ${JSON.stringify(l)}`).join(' ')
      const url = execSync(
        `gh issue create --repo ${REPO} --title ${JSON.stringify(title)} --body ${JSON.stringify(body)} ${labelArgs}`,
        { encoding: 'utf8' }
      ).trim()
      execSync(
        `gh project item-add ${PROJECT_NUMBER} --owner ${OWNER} --url ${url}`,
        { stdio: 'pipe' }
      )
      console.log(`✓ ${id.padEnd(7)} ${url}`)
    }
    ok++
  } catch (err) {
    const msg = err.message.split('\n')[0].slice(0, 200)
    console.error(`✗ ${id}: ${msg}`)
    fail++
  }
}

console.log(`\nResumen: ${ok} OK · ${fail} fallidos · total ${items.length}`)
if (fail > 0) {
  console.log('Si fallaron algunos por rate limit, esperá unos minutos y volvé a correrlo.')
  console.log('Los que ya se crearon NO se duplican: gh issue create no es idempotente, así que revisá manualmente y borrá duplicados si re-ejecutás.')
}
