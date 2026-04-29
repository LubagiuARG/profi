import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const categorias = [
  { nombre: 'Profesional',         slug: 'profesional',        emoji: '⚡', orden: 1 },
  { nombre: 'Plomero',              slug: 'plomero',             emoji: '🔧', orden: 2 },
  { nombre: 'Gasista',              slug: 'gasista',             emoji: '🔥', orden: 3 },
  { nombre: 'Albañil',              slug: 'albanil',             emoji: '🧱', orden: 4 },
  { nombre: 'Pintor',               slug: 'pintor',              emoji: '🎨', orden: 5 },
  { nombre: 'Aire Acondicionado',   slug: 'aire-acondicionado',  emoji: '❄️', orden: 6 },
  { nombre: 'Cerrajero',            slug: 'cerrajero',           emoji: '🔒', orden: 7 },
  { nombre: 'Carpintero',           slug: 'carpintero',          emoji: '🪵', orden: 8 },
  { nombre: 'Jardinero',            slug: 'jardinero',           emoji: '🌿', orden: 9 },
  { nombre: 'Energía Solar',        slug: 'energia-solar',       emoji: '☀️', orden: 10 },
  { nombre: 'CCTV',                 slug: 'cctv',                emoji: '📹', orden: 11 },
  { nombre: 'Mudanzas',             slug: 'mudanzas',            emoji: '🚚', orden: 12 },
  { nombre: 'Limpieza',             slug: 'limpieza',            emoji: '🧹', orden: 13 },
  { nombre: 'Herrero',              slug: 'herrero',             emoji: '🔨', orden: 14 },
  { nombre: 'Técnico PC',           slug: 'tecnico-pc',          emoji: '🖥️', orden: 15 },
  { nombre: 'Calefacción',          slug: 'calefaccion',         emoji: '🌡️', orden: 16 },
]

async function main() {
  console.log('Insertando categorías...')
  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where:  { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  console.log(`✅ ${categorias.length} categorías insertadas`)

  console.log('Creando admin inicial...')
  const hash = await bcrypt.hash('Admin1234!', 10)
  await prisma.admin.upsert({
    where:  { email: 'admin@tuprofesional.com' },
    update: {},
    create: {
      nombre:   'Super Admin',
      email:    'admin@tuprofesional.com',
      password: hash,
      rol:      'superadmin',
    },
  })
  console.log('✅ Admin inicial creado — admin@tuprofesional.com / Admin1234!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
