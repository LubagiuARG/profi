import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /api/categorias — solo activas, ordenadas
router.get('/', async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where:   { activa: true },
      orderBy: { orden: 'asc' },
      select:  { id: true, nombre: true, slug: true, emoji: true, descripcion: true, orden: true },
    })
    return res.json(categorias)
  } catch (error) {
    console.error('[Categorias] Error:', error.message)
    return res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

export default router
