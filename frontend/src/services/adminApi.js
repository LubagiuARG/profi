const BASE = import.meta.env.VITE_API_URL

const h = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

const api = async (method, path, token, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h(token),
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.message || 'Error de servidor')
  return data
}

export const loginAdmin = async (email, password) => {
  const res = await fetch(`${BASE}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.message || 'Credenciales inválidas')
  return data
}

export const getMe            = (token)           => api('GET',    '/api/admin/auth/me',           token)
export const getStats         = (token)           => api('GET',    '/api/admin/profesionales/stats', token)

export const getCategorias    = (token)           => api('GET',    '/api/admin/categorias',         token)
export const crearCategoria   = (token, datos)    => api('POST',   '/api/admin/categorias',         token, datos)
export const editarCategoria  = (token, id, datos)=> api('PUT',    `/api/admin/categorias/${id}`,   token, datos)
export const eliminarCategoria= (token, id)       => api('DELETE', `/api/admin/categorias/${id}`,   token)
export const reordenarCategorias = (token, array) => api('PUT',    '/api/admin/categorias/reordenar', token, { orden: array })

export const getProfesionales   = (token, filtros = {}) => {
  const params = new URLSearchParams(filtros).toString()
  return api('GET', `/api/admin/profesionales${params ? `?${params}` : ''}`, token)
}
export const actualizarProfesional = (token, id, datos) => api('PUT', `/api/admin/profesionales/${id}`, token, datos)

export const getAdmins        = (token)           => api('GET',    '/api/admin/admins',             token)
export const crearAdmin       = (token, datos)    => api('POST',   '/api/admin/admins',             token, datos)
export const actualizarAdmin      = (token, id, datos) => api('PUT',   `/api/admin/admins/${id}`, token, datos)
export const cambiarPasswordAdmin = (token, id, datos) => api('PATCH', `/api/admin/admins/${id}`, token, datos)
