import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PASSWORD_COMUN = 'profesional123'

const profesionales = [
  {
    nombre: 'Juan', apellido: 'Pérez',
    email: 'juan.electricista@profi.dev',
    telefono: '+541112345001',
    matricula: 'CABA-EL-1234',
    provincia: 'CABA', zona: 'Caballito',
    localidad: 'Caballito',
    descripcion: 'Electricista matriculado, 10 años de experiencia. Instalaciones, tableros, urgencias 24hs.',
    especialidades: ['Tableros', 'Iluminación LED', 'Urgencias'],
    plan: 'pro',
    verificado: true,
    rating: 4.8,
    reviews: 23,
    categoriaSlug: 'profesional',
  },
  {
    nombre: 'María', apellido: 'González',
    email: 'maria.plomera@profi.dev',
    telefono: '+541112345002',
    provincia: 'Buenos Aires', zona: 'Vicente López',
    localidad: 'Vicente López',
    descripcion: 'Plomera matriculada. Destapaciones, reparación de pérdidas, instalaciones nuevas.',
    especialidades: ['Destapaciones', 'Termotanques', 'Pérdidas'],
    plan: 'free',
    verificado: false,
    rating: 4.5,
    reviews: 7,
    categoriaSlug: 'plomero',
  },
  {
    nombre: 'Carlos', apellido: 'Rodríguez',
    email: 'carlos.gasista@profi.dev',
    telefono: '+541112345003',
    matricula: 'ENARGAS-456789',
    provincia: 'CABA', zona: 'Belgrano',
    localidad: 'Belgrano',
    descripcion: 'Gasista matriculado ENARGAS. Habilitaciones, conexiones, reparación de artefactos.',
    especialidades: ['Habilitaciones', 'Termotanques', 'Calefones'],
    plan: 'pro',
    verificado: true,
    rating: 4.9,
    reviews: 41,
    categoriaSlug: 'gasista',
  },
  {
    nombre: 'Lucía', apellido: 'Fernández',
    email: 'lucia.pintora@profi.dev',
    telefono: '+541112345004',
    provincia: 'Buenos Aires', zona: 'Quilmes',
    localidad: 'Quilmes',
    descripcion: 'Pintora profesional. Interior, exterior, frentes. Presupuestos sin cargo.',
    especialidades: ['Interior', 'Frentes', 'Empapelado'],
    plan: 'free',
    verificado: false,
    rating: 4.3,
    reviews: 12,
    categoriaSlug: 'pintor',
  },
  {
    nombre: 'Diego', apellido: 'Martínez',
    email: 'diego.albanil@profi.dev',
    telefono: '+541112345005',
    provincia: 'CABA', zona: 'Flores',
    localidad: 'Flores',
    descripcion: 'Albañil con 15 años. Ampliaciones, refacciones, contrapisos, revoques.',
    especialidades: ['Ampliaciones', 'Revoques', 'Contrapisos'],
    plan: 'free',
    verificado: false,
    rating: 4.6,
    reviews: 18,
    categoriaSlug: 'albanil',
  },
]

async function main() {
  console.log('Creando profesionales de prueba...')
  const hash = await bcrypt.hash(PASSWORD_COMUN, 10)

  for (const p of profesionales) {
    const cat = await prisma.categoria.findUnique({ where: { slug: p.categoriaSlug } })
    if (!cat) {
      console.warn(`  ⚠️  Categoría '${p.categoriaSlug}' no existe, salteo ${p.email}`)
      continue
    }

    const { categoriaSlug, ...resto } = p
    await prisma.profesional.upsert({
      where:  { email: p.email },
      update: {},
      create: { ...resto, password: hash, categoriaId: cat.id, radioKm: 20 },
    })
    console.log(`  ✅ ${p.nombre} ${p.apellido} — ${p.email} (${p.categoriaSlug}, ${p.plan})`)
  }

  console.log(`\n✅ Listo. Password común: ${PASSWORD_COMUN}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
