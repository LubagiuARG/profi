import { useEffect, useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { getStats, getCategorias } from '../../services/adminApi'
import AdminLayout from '../../components/admin/AdminLayout'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  const { getToken } = useAdmin()
  const [stats, setStats]   = useState(null)
  const [cats, setCats]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    const token = getToken()
    Promise.all([getStats(token), getCategorias(token)])
      .then(([s, c]) => { setStats(s); setCats(c) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Dashboard</h1>

        {loading && <p className={styles.info}>Cargando estadísticas...</p>}
        {error   && <p className={styles.errorMsg}>{error}</p>}

        {stats && (
          <>
            <div className={styles.statsGrid}>
              <StatCard label="Total profesionales" value={stats.total}        color="blue" />
              <StatCard label="Plan Free"            value={stats.free}         color="gray" />
              <StatCard label="Plan Pro"             value={stats.pro}          color="blue" badge="PRO" />
              <StatCard label="Verificados"          value={stats.verificados}  color="green" />
              <StatCard label="Pendientes"           value={stats.pendientes}   color="amber" />
            </div>

            {stats.ultimos?.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Últimos registros</h2>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Categoría</th>
                        <th>Plan</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.ultimos.map(p => (
                        <tr key={p.id}>
                          <td>{p.nombre}</td>
                          <td className={styles.muted}>{p.email}</td>
                          <td>{p.categoria || '—'}</td>
                          <td><Badge type={p.plan}>{p.plan?.toUpperCase()}</Badge></td>
                          <td className={styles.muted}>{formatDate(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        {cats.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Categorías</h2>
            <div className={styles.catStats}>
              <div className={styles.catStat}>
                <span className={styles.catNum}>{cats.filter(c => c.activa).length}</span>
                <span className={styles.catLabel}>Activas</span>
              </div>
              <div className={styles.catStat}>
                <span className={styles.catNum}>{cats.filter(c => !c.activa).length}</span>
                <span className={styles.catLabel}>Inactivas</span>
              </div>
              <div className={styles.catStat}>
                <span className={styles.catNum}>{cats.length}</span>
                <span className={styles.catLabel}>Total</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  )
}

function StatCard({ label, value, color, badge }) {
  return (
    <div className={`${styles.statCard} ${styles[`color_${color}`]}`}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        {badge && <span className={`${styles.badge} ${styles[`badge_${color}`]}`}>{badge}</span>}
      </div>
      <span className={styles.statValue}>{value ?? '—'}</span>
    </div>
  )
}

function Badge({ type, children }) {
  const map = { pro: 'blue', free: 'gray' }
  return <span className={`${styles.badge} ${styles[`badge_${map[type] || 'gray'}`]}`}>{children}</span>
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
