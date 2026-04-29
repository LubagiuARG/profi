import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { adminAuthMiddleware } from '../../middleware/adminAuth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(adminAuthMiddleware)

// GET /api/admin/categorias — listar todas (incluso inactivas)
router.get('/', async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { orden: 'asc' },
      include: { _count: { select: { profesionales: true } } },
    })
    return res.json(categorias)
  } catch (error) {
    console.error('[Admin/Categorias] Error listar:', error.message)
    return res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

// POST /api/admin/categorias — crear nueva
router.post('/', async (req, res) => {
  try {
    const { nombre, slug, emoji, descripcion, activa, orden } = req.body
    if (!nombre || !slug || !emoji) {
      return res.status(400).json({ error: 'nombre, slug y emoji son obligatorios' })
    }

    const categoria = await prisma.categoria.create({
      data: { nombre, slug, emoji, descripcion: descripcion || null, activa: activa ?? true, orden: orden ?? 0 },
    })
    return res.status(201).json(categoria)
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'El slug ya existe' })
    console.error('[Admin/Categorias] Error crear:', error.message)
    return res.status(500).json({ error: 'Error al crear categoría' })
  }
})

// PATCH /api/admin/categorias/reordenar — debe ir ANTES de /:id
router.patch('/reordenar', async (req, res) => {
  try {
    const items = req.body
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Se espera un array de {id, orden}' })
    }

    await prisma.$transaction(
      items.map(({ id, orden }) =>
        prisma.categoria.update({ where: { id }, data: { orden } })
      )
    )
    return res.json({ ok: true })
  } catch (error) {
    console.error('[Admin/Categorias] Error reordenar:', error.message)
    return res.status(500).json({ error: 'Error al reordenar' })
  }
})

// PATCH /api/admin/categorias/:id — editar
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { nombre, emoji, descripcion, activa, orden } = req.body

    const categoria = await prisma.categoria.update({
      where: { id },
      data:  {
        ...(nombre      !== undefined && { nombre }),
        ...(emoji       !== undefined && { emoji }),
        ...(descripcion !== undefined && { descripcion }),
        ...(activa      !== undefined && { activa }),
        ...(orden       !== undefined && { orden }),
      },
    })
    return res.json(categoria)
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Categoría no encontrada' })
    return res.status(500).json({ error: 'Error al editar categoría' })
  }
})

// DELETE /api/admin/categorias/:id — eliminar solo si no tiene profesionales
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)

    const count = await prisma.profesional.count({ where: { categoriaId: id } })
    if (count > 0) {
      return res.status(409).json({ error: `No se puede eliminar: tiene ${count} profesional(es) asignado(s)` })
    }

    await prisma.categoria.delete({ where: { id } })
    return res.json({ ok: true })
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Categoría no encontrada' })
    return res.status(500).json({ error: 'Error al eliminar categoría' })
  }
})

export default router
