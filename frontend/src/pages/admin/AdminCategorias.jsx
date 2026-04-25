import { useEffect, useState } from 'react'
import { useAdmin } from '../../context/AdminContext'
import {
  getCategorias, crearCategoria, editarCategoria,
  eliminarCategoria, reordenarCategorias
} from '../../services/adminApi'
import AdminLayout from '../../components/admin/AdminLayout'
import styles from './AdminCategorias.module.css'

const EMPTY = { nombre: '', emoji: '', descripcion: '', orden: 0 }

function toSlug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminCategorias() {
  const { getToken } = useAdmin()
  const [cats, setCats]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState(null)   // null=cerrado, EMPTY=nueva, obj=editar
  const [saving, setSaving]   = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const load = () => {
    setLoading(true)
    getCategorias(getToken())
      .then(setCats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openNew  = () => setForm({ ...EMPTY, orden: cats.length + 1 })
  const openEdit = (c) => setForm({ ...c })
  const closeForm = () => setForm(null)

  const handleField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const token = getToken()
    const payload = { ...form, slug: toSlug(form.nombre) }
    try {
      if (form.id) await editarCategoria(token, form.id, payload)
      else         await crearCategoria(token, payload)
      closeForm()
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (cat) => {
    try {
      await editarCategoria(getToken(), cat.id, { activa: !cat.activa })
      setCats(cs => cs.map(c => c.id === cat.id ? { ...c, activa: !c.activa } : c))
    } catch (err) { alert(err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría? Esta acción no se puede deshacer.')) return
    try {
      await eliminarCategoria(getToken(), id)
      setCats(cs => cs.filter(c => c.id !== id))
    } catch (err) { alert(err.message) }
  }

  const move = async (idx, dir) => {
    const next = [...cats]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setCats(next)
    try {
      await reordenarCategorias(getToken(), next.map((c, i) => ({ id: c.id, orden: i + 1 })))
    } catch (err) { alert(err.message); load() }
  }

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Categorías</h1>
          <button className={styles.btnPrimary} onClick={openNew}>+ Nueva categoría</button>
        </div>

        {error   && <p className={styles.errorMsg}>{error}</p>}
        {loading && <p className={styles.info}>Cargando...</p>}

        {/* Form modal */}
        {form !== null && (
          <div className={styles.modalBackdrop} onClick={e => e.target === e.currentTarget && closeForm()}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{form.id ? 'Editar categoría' : 'Nueva categoría'}</h2>
                <button className={styles.closeBtn} onClick={closeForm}>✕</button>
              </div>
              <form className={styles.form} onSubmit={handleSave}>
                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Nombre *</label>
                    <input className={styles.input} value={form.nombre} onChange={e => handleField('nombre', e.target.value)} required placeholder="Electricista" />
                  </div>
                  <div className={styles.fieldSm}>
                    <label className={styles.label}>Emoji</label>
                    <input className={styles.input} value={form.emoji} onChange={e => handleField('emoji', e.target.value)} placeholder="⚡" maxLength={4} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Slug (auto)</label>
                  <input className={`${styles.input} ${styles.inputMuted}`} value={toSlug(form.nombre || '')} readOnly />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Descripción</label>
                  <textarea className={styles.textarea} value={form.descripcion} onChange={e => handleField('descripcion', e.target.value)} rows={2} placeholder="Breve descripción..." />
                </div>
                <div className={styles.fieldSm}>
                  <label className={styles.label}>Orden</label>
                  <input className={styles.input} type="number" min={1} value={form.orden} onChange={e => handleField('orden', +e.target.value)} />
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.btnOutline} onClick={closeForm}>Cancelar</button>
                  <button type="submit" className={styles.btnPrimary} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && cats.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Emoji</th>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Profesionales</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cats.map((cat, idx) => (
                  <tr key={cat.id}>
                    <td>
                      <div className={styles.orderBtns}>
                        <button className={styles.iconBtn} onClick={() => move(idx, -1)} disabled={idx === 0}>↑</button>
                        <span className={styles.muted}>{cat.orden ?? idx + 1}</span>
                        <button className={styles.iconBtn} onClick={() => move(idx, 1)} disabled={idx === cats.length - 1}>↓</button>
                      </div>
                    </td>
                    <td className={styles.emoji}>{cat.emoji || '—'}</td>
                    <td className={styles.bold}>{cat.nombre}</td>
                    <td><code className={styles.slug}>{cat.slug}</code></td>
                    <td className={styles.muted}>{cat.totalProfesionales ?? 0}</td>
                    <td>
                      <button
                        className={`${styles.toggleBtn} ${cat.activa ? styles.toggleOn : styles.toggleOff}`}
                        onClick={() => handleToggle(cat)}
                      >
                        {cat.activa ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionEdit} onClick={() => openEdit(cat)}>Editar</button>
                        <button
                          className={styles.actionDelete}
                          onClick={() => handleDelete(cat.id)}
                          disabled={(cat.totalProfesionales ?? 0) > 0}
                          title={(cat.totalProfesionales ?? 0) > 0 ? 'Tiene profesionales' : 'Eliminar'}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && cats.length === 0 && !error && (
          <div className={styles.empty}>No hay categorías aún. Creá la primera.</div>
        )}
      </div>
    </AdminLayout>
  )
}
