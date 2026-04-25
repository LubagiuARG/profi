import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'electro-ar-secret-key'

export function generarTokenAdmin(id, rol) {
  return jwt.sign({ id, rol, tipo: 'admin' }, JWT_SECRET, { expiresIn: '12h' })
}

export function adminAuthMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado — token requerido' })
  }

  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (payload.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    req.adminId  = payload.id
    req.adminRol = payload.rol
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export function superAdminMiddleware(req, res, next) {
  adminAuthMiddleware(req, res, () => {
    if (req.adminRol !== 'superadmin') {
      return res.status(403).json({ error: 'Solo superadmin puede realizar esta acción' })
    }
    next()
  })
}
