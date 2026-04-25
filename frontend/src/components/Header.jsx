import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Header.module.css'

export default function Header() {
  const { profesional: user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          tu<span className={styles.logoAccent}>profesional</span>
        </NavLink>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <NavLink to="/profesionales" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={() => setMenuOpen(false)}>
            Profesionales
          </NavLink>
          <NavLink to="/presupuesto" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={() => setMenuOpen(false)}>
            Presupuesto IA
          </NavLink>
          <NavLink to="/#como-funciona" className={styles.navLink} onClick={() => setMenuOpen(false)}>
            Cómo funciona
          </NavLink>
        </nav>

        <div className={`${styles.actions} ${menuOpen ? styles.actionsOpen : ''}`}>
          {user ? (
            <>
              <NavLink to="/panel" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>
                Mi panel
              </NavLink>
              <button className="btn btn-outline" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-outline" onClick={() => setMenuOpen(false)}>
                Ingresar
              </NavLink>
              <NavLink to="/registro" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
                Publicar servicio
              </NavLink>
            </>
          )}
        </div>

        <button
          className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menú"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />}
    </header>
  )
}
