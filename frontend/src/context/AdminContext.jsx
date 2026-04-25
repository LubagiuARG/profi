import { createContext, useContext, useState, useEffect } from 'react'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [admin, setAdmin]       = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.id) setAdmin(data)
          else localStorage.removeItem('admin_token')
        })
        .catch(() => localStorage.removeItem('admin_token'))
        .finally(() => setCargando(false))
    } else {
      setCargando(false)
    }
  }, [])

  const login = (token, datos) => {
    localStorage.setItem('admin_token', token)
    setAdmin(datos)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setAdmin(null)
  }

  const getToken = () => localStorage.getItem('admin_token')

  return (
    <AdminContext.Provider value={{ admin, cargando, login, logout, getToken }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminContext)
}
