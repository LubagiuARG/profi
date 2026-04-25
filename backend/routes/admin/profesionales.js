import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { adminAuthMiddleware } from '../../middleware/adminAuth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(adminAuthMiddleware)

// GET /api/admin/profesionales/stats — debe ir ANTES de /:id
router.get('/stats', async (req, res) => {
  try {
    const [total, porPlan, porCategoria] = await Promise.all([
      prisma.electricista.count(),
      prisma.electricista.groupBy({ by: ['plan'], _count: { id: true } }),
      prisma.electricista.groupBy({ by: ['categoriaId'], _count: { id: true } }),
    ])

    const categorias = await prisma.categoria.findMany({ select: { id: true, nombre: true, slug: true } })
    const catMap = Object.fromEntries(categorias.map(c => [c.id, c]))

    const porCategoriaConNombre = porCategoria.map(item => ({
      categoriaId: item.categoriaId,
      nombre: item.categoriaId ? catMap[item.categoriaId]?.nombre ?? 'Desconocida' : 'Sin categoría',
      cantidad: item._count.id,
    }))

    return res.json({
      total,
      porPlan: porPlan.map(p => ({ plan: p.plan, cantidad: p._count.id })),
      porCategoria: porCategoriaConNombre,
    })
  } catch (error) {
    console.error('[Admin/Profesionales] Error stats:', error.message)
    return res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

// GET /api/admin/profesionales — listar todos con paginación
router.get('/', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(100, parseInt(req.query.limit) || 20)
    const skip  = (page - 1) * limit

    const { plan, verificado, activo, search } = req.query
    const where = {}

    if (plan)      where.plan      = plan
    if (verificado !== undefined) where.verificado = verificado === 'true'
    if (activo     !== undefined) where.activo     = activo     === 'true'
    if (search) {
      where.OR = [
        { nombre:   { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email:    { contains: search, mode: 'insensitive' } },
      ]
    }

    const [profesionales, total] = await Promise.all([
      prisma.electricista.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creadoEn: 'desc' },
        select: {
          id: true, nombre: true, apellido: true, email: true,
          telefono: true, provincia: true, zona: true,
          localidad: true, localidadId: true, radioKm: true,
          plan: true, verificado: true, activo: true,
          rating: true, reviews: true, visitas: true,
          creadoEn: true, categoriaId: true,
          categoria: { select: { nombre: true, slug: true, emoji: true } },
        },
      }),
      prisma.electricista.count({ where }),
    ])

    return res.json({
      profesionales,
      paginacion: { total, page, limit, paginas: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[Admin/Profesionales] Error listar:', error.message)
    return res.status(500).json({ error: 'Error al obtener profesionales' })
  }
})

// PATCH /api/admin/profesionales/:id — aprobar, suspender, verificar
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { activo, verificado, plan, categoriaId, localidad, localidadId, radioKm } = req.body

    const profesional = await prisma.electricista.update({
      where: { id },
      data: {
        ...(activo      !== undefined && { activo }),
        ...(verificado  !== undefined && { verificado }),
        ...(plan        !== undefined && { plan }),
        ...(categoriaId !== undefined && { categoriaId }),
        ...(localidad   !== undefined && { localidad }),
        ...(localidadId !== undefined && { localidadId }),
        ...(radioKm     !== undefined && { radioKm }),
      },
    })
    return res.json(profesional)
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Profesional no encontrado' })
    return res.status(500).json({ error: 'Error al actualizar profesional' })
  }
})

export default router
