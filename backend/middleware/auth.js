import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'electro-ar-secret-key'

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado — token requerido' })
  }

  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.electricistaId = payload.id
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export function generarToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })
}