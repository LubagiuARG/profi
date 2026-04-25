import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [profesional, setProfesional] = useState(null)
  const [cargando, setCargando]       = useState(true)

  // Al arrancar, verificar si hay token guardado
  useEffect(() => {
    const token = localStorage.getItem('electro_token')
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.id) setProfesional(data)
          else localStorage.removeItem('electro_token')
        })
        .catch(() => localStorage.removeItem('electro_token'))
        .finally(() => setCargando(false))
    } else {
      setCargando(false)
    }
  }, [])

  const login = (token, datos) => {
    localStorage.setItem('electro_token', token)
    setProfesional(datos)
  }

  const logout = () => {
    localStorage.removeItem('electro_token')
    setProfesional(null)
  }

  const getToken = () => localStorage.getItem('electro_token')

  return (
    <AuthContext.Provider value={{ profesional, cargando, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}