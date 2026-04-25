import { useEffect, useState, useCallback } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { getProfesionales, actualizarProfesional, getCategorias } from '../../services/adminApi'
import AdminLayout from '../../components/admin/AdminLayout'
import styles from './AdminProfesionales.module.css'

const PLANES   = ['', 'free', 'pro']
const ESTADOS  = ['', 'activo', 'inactivo', 'verificado']

export default function AdminProfesionales() {
  const { getToken } = useAdmin()
  const [pros, setPros]         = useState([])
  const [cats, setCats]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const PER_PAGE = 20

  const [filtros, setFiltros] = useState({ q: '', categoria: '', plan: '', estado: '' })

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, limit: PER_PAGE, ...filtros }
    Object.keys(params).forEach(k => !params[k] && delete params[k])
    getProfesionales(getToken(), params)
      .then(data => {
        setPros(Array.isArray(data) ? data : data.profesionales ?? [])
        setTotal(data.total ?? (Array.isArray(data) ? data.length : 0))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [page, filtros])

  useEffect(() => { load(); getCategorias(getToken()).then(setCats).catch(() => {}) }, [load])

  const handleFiltro = (k, v) => {
    setFiltros(f => ({ ...f, [k]: v }))
    setPage(1)
  }

  const handleAccion = async (id, accion) => {
    const map = {
      verificar:  { verificado: true, estado: 'activo' },
      suspender:  { estado: 'inactivo' },
      activar:    { estado: 'activo' },
    }
    try {
      await actualizarProfesional(getToken(), id, map[accion])
      load()
    } catch (err) { alert(err.message) }
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Profesionales</h1>

        {/* Filtros */}
        <div className={styles.filtros}>
          <input
            className={styles.search}
            type="text"
            placeholder="Buscar por nombre o email..."
            value={filtros.q}
            onChange={e => handleFiltro('q', e.target.value)}
          />
          <select className={styles.select} value={filtros.categoria} onChange={e => handleFiltro('categoria', e.target.value)}>
            <option value="">Todas las categorías</option>
            {cats.map(c => <option key={c.id} value={c.slug}>{c.nombre}</option>)}
          </select>
          <select className={styles.select} value={filtros.plan} onChange={e => handleFiltro('plan', e.target.value)}>
            <option value="">Todos los planes</option>
            {PLANES.filter(Boolean).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
          <select className={styles.select} value={filtros.estado} onChange={e => handleFiltro('estado', e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.filter(Boolean).map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
          </select>
        </div>

        {error   && <p className={styles.errorMsg}>{error}</p>}
        {loading && <p className={styles.info}>Cargando...</p>}

        {!loading && pros.length > 0 && (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Categoría</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pros.map(pro => (
                    <tr key={pro.id}>
                      <td className={styles.bold}>{pro.nombre}</td>
                      <td className={styles.muted}>{pro.email}</td>
                      <td>{pro.categoria || '—'}</td>
                      <td><PlanBadge plan={pro.plan} /></td>
                      <td><EstadoBadge pro={pro} /></td>
                      <td className={styles.muted}>{formatDate(pro.createdAt)}</td>
                      <td>
                        <div className={styles.actions}>
                          {!pro.verificado && (
                            <button className={styles.btnVerificar} onClick={() => handleAccion(pro.id, 'verificar')}>✓ Verificar</button>
                          )}
                          {pro.estado !== 'inactivo' && (
                            <button className={styles.btnSuspender} onClick={() => handleAccion(pro.id, 'suspender')}>Suspender</button>
                          )}
                          {pro.estado === 'inactivo' && (
                            <button className={styles.btnActivar} onClick={() => handleAccion(pro.id, 'activar')}>Activar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Anterior</button>
                <span className={styles.pageInfo}>{page} / {totalPages}</span>
                <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Siguiente →</button>
              </div>
            )}
          </>
        )}

        {!loading && pros.length === 0 && !error && (
          <div className={styles.empty}>No se encontraron profesionales con esos filtros.</div>
        )}
      </div>
    </AdminLayout>
  )
}

function PlanBadge({ plan }) {
  const map = { pro: styles.badgePro, free: styles.badgeFree }
  return <span className={`${styles.badge} ${map[plan] || styles.badgeFree}`}>{plan?.toUpperCase() || 'FREE'}</span>
}

function EstadoBadge({ pro }) {
  if (pro.verificado) return <span className={`${styles.badge} ${styles.badgeVerificado}`}>Verificado</span>
  if (pro.estado === 'inactivo') return <span className={`${styles.badge} ${styles.badgeSuspendido}`}>Suspendido</span>
  return <span className={`${styles.badge} ${styles.badgePendiente}`}>Pendiente</span>
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
