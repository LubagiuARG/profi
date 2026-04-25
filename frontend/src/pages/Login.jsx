import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [cargando, setCargando] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
      login(data.token, data.electricista)
      navigate('/panel')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.bolt}>⚡</div>
          <h1 className={styles.title}>Accedé a tu panel</h1>
          <p className={styles.subtitle}>Ingresá con tu cuenta de profesional</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label className="input-label">Email</label>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className="input-label">Contraseña</label>
            <input
              className="input"
              type="password"
              name="password"
              placeholder="Tu contraseña"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '.75rem' }}
            disabled={cargando}
          >
            {cargando ? 'Ingresando...' : 'Ingresar al panel →'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>¿No tenés cuenta? <Link to="/registro" className={styles.link}>Registrate acá</Link></p>
        </div>
      </div>
    </div>
  )
}