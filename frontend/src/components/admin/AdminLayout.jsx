import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import styles from './AdminLayout.module.css'

const NAV = [
  { to: '/admin/dashboard',     icon: '📊', label: 'Dashboard' },
  { to: '/admin/categorias',    icon: '🗂️', label: 'Categorías' },
  { to: '/admin/profesionales', icon: '👷', label: 'Profesionales' },
]

const NAV_SUPER = { to: '/admin/admins', icon: '👤', label: 'Administradores' }

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdmin()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin', { replace: true })
  }

  const navItems = admin?.rol === 'superadmin' ? [...NAV, NAV_SUPER] : NAV

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            <span className={styles.logoMain}>tuProfesional</span>
            <span className={styles.logoBadge}>Admin</span>
          </div>

          <nav className={styles.nav}>
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.adminInfo}>
            <span className={styles.adminName}>{admin?.nombre || admin?.email}</span>
            <span className={styles.adminRole}>
              {admin?.rol === 'superadmin' ? 'Superadmin' : 'Administrador'}
            </span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.burger}
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Menú"
          >
            ☰
          </button>
        </header>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
