import { useEffect, useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { getAdmins, crearAdmin, actualizarAdmin, cambiarPasswordAdmin } from '../../services/adminApi'
import AdminLayout from '../../components/admin/AdminLayout'
import styles from './AdminAdmins.module.css'

const EMPTY_FORM = { nombre: '', email: '', password: '', rol: 'admin' }
const EMPTY_PWD  = { password: '', confirm: '', error: '', success: '', saving: false }

export default function AdminAdmins() {
  const { admin: me, getToken } = useAdmin()
  const [admins, setAdmins]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [form, setForm]         = useState(null)
  const [saving, setSaving]     = useState(false)
  const [pwdModal, setPwdModal] = useState(null) // { id, nombre } del admin seleccionado
  const [pwd, setPwd]           = useState(EMPTY_PWD)

  const load = () => {
    setLoading(true)
    getAdmins(getToken())
      .then(setAdmins)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await crearAdmin(getToken(), form)
      setForm(null)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (a) => {
    if (a.id === me?.id) return
    try {
      await actualizarAdmin(getToken(), a.id, { activo: !a.activo })
      setAdmins(list => list.map(x => x.id === a.id ? { ...x, activo: !x.activo } : x))
    } catch (err) { alert(err.message) }
  }

  const openPwd = (a) => {
    setPwdModal({ id: a.id, nombre: a.nombre })
    setPwd(EMPTY_PWD)
  }

  const closePwd = () => {
    setPwdModal(null)
    setPwd(EMPTY_PWD)
  }

  const handlePwdSave = async (e) => {
    e.preventDefault()
    if (pwd.password.length < 8) {
      return setPwd(p => ({ ...p, error: 'La contraseña debe tener al menos 8 caracteres.' }))
    }
    if (pwd.password !== pwd.confirm) {
      return setPwd(p => ({ ...p, error: 'Las contraseñas no coinciden.' }))
    }
    setPwd(p => ({ ...p, saving: true, error: '', success: '' }))
    try {
      await cambiarPasswordAdmin(getToken(), pwdModal.id, { password: pwd.password })
      setPwd(p => ({ ...p, saving: false, success: 'Contraseña actualizada correctamente.' }))
      setTimeout(closePwd, 1500)
    } catch (err) {
      setPwd(p => ({ ...p, saving: false, error: err.message }))
    }
  }

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Administradores</h1>
          <button className={styles.btnPrimary} onClick={() => setForm({ ...EMPTY_FORM })}>+ Nuevo admin</button>
        </div>

        {error   && <p className={styles.errorMsg}>{error}</p>}
        {loading && <p className={styles.info}>Cargando...</p>}

        {/* Modal: nuevo admin */}
        {form && (
          <div className={styles.modalBackdrop} onClick={e => e.target === e.currentTarget && setForm(null)}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Nuevo administrador</h2>
                <button className={styles.closeBtn} onClick={() => setForm(null)}>✕</button>
              </div>
              <form className={styles.form} onSubmit={handleSave}>
                <div className={styles.field}>
                  <label className={styles.label}>Nombre</label>
                  <input className={styles.input} value={form.nombre} onChange={e => handleField('nombre', e.target.value)} required placeholder="Juan García" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input className={styles.input} type="email" value={form.email} onChange={e => handleField('email', e.target.value)} required placeholder="juan@tuprofesional.com" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Contraseña</label>
                  <input className={styles.input} type="password" value={form.password} onChange={e => handleField('password', e.target.value)} required placeholder="Mínimo 8 caracteres" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Rol</label>
                  <select className={styles.input} value={form.rol} onChange={e => handleField('rol', e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.btnOutline} onClick={() => setForm(null)}>Cancelar</button>
                  <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Creando...' : 'Crear admin'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: cambiar contraseña */}
        {pwdModal && (
          <div className={styles.modalBackdrop} onClick={e => e.target === e.currentTarget && closePwd()}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>Cambiar contraseña</h2>
                  <p className={styles.modalSub}>{pwdModal.nombre}</p>
                </div>
                <button className={styles.closeBtn} onClick={closePwd}>✕</button>
              </div>
              <form className={styles.form} onSubmit={handlePwdSave}>
                {pwd.error   && <div className={styles.pwdError}>{pwd.error}</div>}
                {pwd.success && <div className={styles.pwdSuccess}>{pwd.success}</div>}
                <div className={styles.field}>
                  <label className={styles.label}>Nueva contraseña</label>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={pwd.password}
                    onChange={e => setPwd(p => ({ ...p, password: e.target.value, error: '' }))}
                    required
                    autoFocus
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Repetir contraseña</label>
                  <input
                    className={`${styles.input} ${pwd.confirm && pwd.confirm !== pwd.password ? styles.inputError : ''}`}
                    type="password"
                    placeholder="Repetí la contraseña"
                    value={pwd.confirm}
                    onChange={e => setPwd(p => ({ ...p, confirm: e.target.value, error: '' }))}
                    required
                  />
                  {pwd.confirm && pwd.confirm !== pwd.password && (
                    <span className={styles.fieldHint}>Las contraseñas no coinciden</span>
                  )}
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.btnOutline} onClick={closePwd}>Cancelar</button>
                  <button type="submit" className={styles.btnPrimary} disabled={pwd.saving}>
                    {pwd.saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!loading && admins.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id} className={a.id === me?.id ? styles.meRow : ''}>
                    <td className={styles.bold}>
                      {a.nombre}
                      {a.id === me?.id && <span className={styles.youBadge}>Vos</span>}
                    </td>
                    <td className={styles.muted}>{a.email}</td>
                    <td>
                      <span className={`${styles.badge} ${a.rol === 'superadmin' ? styles.badgeSuper : styles.badgeAdmin}`}>
                        {a.rol === 'superadmin' ? 'Superadmin' : 'Admin'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${a.activo ? styles.badgeActivo : styles.badgeInactivo}`}>
                        {a.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.btnCambiarPwd}
                          onClick={() => openPwd(a)}
                        >
                          Cambiar contraseña
                        </button>
                        <button
                          className={a.activo ? styles.btnSuspender : styles.btnActivar}
                          onClick={() => handleToggle(a)}
                          disabled={a.id === me?.id}
                          title={a.id === me?.id ? 'No podés desactivarte a vos mismo' : ''}
                        >
                          {a.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
