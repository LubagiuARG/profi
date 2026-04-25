import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useAuth }             from '../context/AuthContext'
import SelectorUbicacion       from '../components/SelectorUbicacion'
import styles                  from './Panel.module.css'

const API = import.meta.env.VITE_API_URL

// ── Pestaña: Resumen ─────────────────────────────────────────────────────────
function TabResumen({ profesional, getToken }) {
  const [stats, setStats]       = useState(null)
  const [vacaciones, setVacaciones] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/panel/stats`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setVacaciones(data.vacaciones)
      })
  }, [])

  const toggleVacaciones = async () => {
    const nuevo = !vacaciones
    setVacaciones(nuevo)
    await fetch(`${API}/api/panel/vacaciones`, {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ vacaciones: nuevo }),
    })
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{stats?.visitas || 0}</div>
          <div className={styles.statLabel}>Visitas al perfil</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{stats?.reviews || 0}</div>
          <div className={styles.statLabel}>Reseñas</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{(stats?.rating || 0).toFixed(1)}</div>
          <div className={styles.statLabel}>Puntuación</div>
        </div>
        <div className={`${styles.statCard} ${styles[stats?.plan]}`}>
          <div className={styles.statNum}>{stats?.plan?.toUpperCase() || 'FREE'}</div>
          <div className={styles.statLabel}>Plan actual</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Modo vacaciones</h2>
            <p className={styles.sectionDesc}>
              {vacaciones
                ? '✈️ Tu perfil está oculto — los clientes no te ven'
                : '💼 Tu perfil está visible en el directorio'}
            </p>
          </div>
          <button
            className={`btn ${vacaciones ? 'btn-primary' : 'btn-outline'}`}
            onClick={toggleVacaciones}
          >
            {vacaciones ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>

      {profesional?.plan === 'free' && (
        <div className={styles.upgradeBanner}>
          <div>
            <strong>Mejorá a Plan PRO</strong>
            <span> — Aparecé primero y recibí más consultas</span>
          </div>
          <a href="/registro" className="btn btn-primary">Activar PRO →</a>
        </div>
      )}
    </div>
  )
}

// ── Pestaña: Presupuestos ────────────────────────────────────────────────────
function TabPresupuestos({ profesional, getToken }) {
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [resultado, setResultado] = useState(null)
  const [historial, setHistorial] = useState([])

  const generarPresupuesto = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setResultado(null)

    try {
      const res  = await fetch(`${API}/api/chat`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          messages:  [{ role: 'user', content: input }],
          userType:  'profesional',
          modo:      'presupuesto_profesional',
        }),
      })
      const data = await res.json()
      setResultado({ ...data, consulta: input })
      setHistorial(h => [{ ...data, consulta: input, fecha: new Date() }, ...h.slice(0, 4)])
    } catch {
      alert('Error al generar el presupuesto. Verificá tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  const formatoWhatsApp = (r) => {
    if (!r) return ''
    let texto = `⚡ *PRESUPUESTO ELECTRO - ${profesional?.nombre} ${profesional?.apellido}*\n`
    texto += `📋 *Trabajo:* ${r.consulta}\n\n`
    texto += `📝 *Detalle:*\n`
    r.items?.forEach(item => {
      texto += `• ${item.label}: ${item.val}\n`
    })
    texto += `\n💰 *TOTAL ESTIMADO: ${r.total}*\n`
    if (r.notas) texto += `\n⚠️ _${r.notas}_\n`
    texto += `\n📞 Contacto: ${profesional?.telefono}`
    texto += `\n🌐 Encontrame en ElectroAR`
    return texto
  }

  const compartirWhatsApp = () => {
    const texto = encodeURIComponent(formatoWhatsApp(resultado))
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  const descargarPDF = () => {
    const contenido = formatoWhatsApp(resultado)
      .replace(/\*/g, '')
      .replace(/_/g, '')

    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <html>
        <head>
          <title>Presupuesto - ${profesional?.nombre}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
            h1 { color: #f5c518; border-bottom: 2px solid #f5c518; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .total { font-size: 20px; font-weight: bold; color: #f5c518; margin-top: 16px; }
            .nota { color: #666; font-style: italic; margin-top: 12px; font-size: 14px; }
            .footer { margin-top: 32px; color: #999; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>⚡ Presupuesto ElectroAR</h1>
          <p><strong>Profesional:</strong> ${profesional?.nombre} ${profesional?.apellido}</p>
          <p><strong>Trabajo:</strong> ${resultado?.consulta}</p>
          <p><strong>Teléfono:</strong> ${profesional?.telefono}</p>
          <hr/>
          <h3>Detalle</h3>
          ${resultado?.items?.map(i => `
            <div class="item">
              <span>${i.label}</span>
              <span><strong>${i.val}</strong></span>
            </div>
          `).join('')}
          <div class="total">TOTAL ESTIMADO: ${resultado?.total}</div>
          ${resultado?.notas ? `<p class="nota">⚠️ ${resultado.notas}</p>` : ''}
          <div class="footer">
            <p>Presupuesto generado con ElectroAR · Valores orientativos según CMO ElectroInstalador.com</p>
            <p>No incluye materiales salvo indicación. Válido por 7 días.</p>
          </div>
        </body>
      </html>
    `)
    ventana.document.close()
    ventana.print()
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Generador de presupuestos IA</h2>
        <p className={styles.sectionDesc} style={{ marginBottom: '1rem' }}>
          Describí el trabajo y el asistente calcula el presupuesto con precios actualizados de ElectroInstalador.
        </p>

        <textarea
          className="input"
          rows={3}
          placeholder="Ej: instalar tablero trifásico de 12 circuitos en local comercial de 80m²..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), generarPresupuesto())}
          style={{ resize: 'vertical', marginBottom: '.75rem' }}
        />

        <button
          className="btn btn-primary"
          onClick={generarPresupuesto}
          disabled={loading || !input.trim()}
          style={{ width: '100%', padding: '.75rem' }}
        >
          {loading ? 'Calculando...' : '⚡ Generar presupuesto'}
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className={styles.section}>
          <div className={styles.presupuestoHeader}>
            <h3 className={styles.sectionTitle}>Presupuesto generado</h3>
            <div className={styles.presupuestoAcciones}>
              <button className="btn btn-outline" onClick={compartirWhatsApp}>
                📱 WhatsApp
              </button>
              <button className="btn btn-outline" onClick={descargarPDF}>
                📄 PDF
              </button>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '1rem' }}>
            {resultado.texto}
          </p>

          <div className={styles.presupuestoItems}>
            {resultado.items?.map((item, i) => (
              <div key={i} className={styles.presupuestoItem}>
                <span className={styles.itemLabel}>{item.label}</span>
                <span className={styles.itemVal}>{item.val}</span>
              </div>
            ))}
          </div>

          <div className={styles.presupuestoTotal}>
            <span>TOTAL ESTIMADO</span>
            <span className={styles.totalVal}>{resultado.total}</span>
          </div>

          {resultado.notas && (
            <p className={styles.presupuestoNota}>⚠️ {resultado.notas}</p>
          )}

          <p className={styles.presupuestoFuente}>
            Valores según CMO ElectroInstalador.com · Solo mano de obra · No incluye materiales salvo indicación
          </p>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Últimos presupuestos</h3>
          <div className={styles.historialList}>
            {historial.map((h, i) => (
              <div key={i} className={styles.historialItem} onClick={() => setResultado(h)}>
                <div className={styles.historialConsulta}>{h.consulta}</div>
                <div className={styles.historialTotal}>{h.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pestaña: Mi perfil ───────────────────────────────────────────────────────
function TabPerfil({ profesional, getToken }) {
  const [form, setForm]       = useState({})
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (profesional) {
      setForm({
        nombre:      profesional.nombre      || '',
        apellido:    profesional.apellido    || '',
        telefono:    profesional.telefono    || '',
        matricula:   profesional.matricula   || '',
        provincia:   profesional.provincia   || '',
        localidad:   profesional.localidad   || '',
        localidadId: profesional.localidadId || '',
        radioKm:     String(profesional.radioKm ?? '20'),
        descripcion: profesional.descripcion || '',
      })
    }
  }, [profesional])

  const guardar = async () => {
    setGuardando(true)
    try {
      const res = await fetch(`${API}/api/panel/perfil`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setMensaje('✅ Perfil actualizado correctamente')
        setTimeout(() => setMensaje(''), 3000)
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={styles.tabContent}>
      {mensaje && <div className={styles.successMsg}>{mensaje}</div>}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Mis datos</h2>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className="input-label">Nombre</label>
            <input className="input" value={form.nombre || ''}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label className="input-label">Apellido</label>
            <input className="input" value={form.apellido || ''}
              onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label className="input-label">Teléfono / WhatsApp</label>
            <input className="input" value={form.telefono || ''}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label className="input-label">N° Matrícula</label>
            <input className="input" value={form.matricula || ''}
              onChange={e => setForm(f => ({ ...f, matricula: e.target.value }))} />
          </div>
        </div>

        <div className={styles.formGroup} style={{ marginTop: '.75rem' }}>
          <label className="input-label">Ubicación y zona de cobertura</label>
          <SelectorUbicacion
            initialProvincia={form.provincia}
            initialLocalidad={form.localidad}
            initialRadio={form.radioKm}
            onChange={({ provincia, localidad, localidadId, radioKm }) =>
              setForm(f => ({ ...f, provincia, localidad, localidadId, radioKm }))
            }
          />
        </div>

        <div className={styles.formGroup} style={{ marginTop: '.75rem' }}>
          <label className="input-label">Descripción de servicios</label>
          <textarea className="input" rows={3} value={form.descripcion || ''}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            style={{ resize: 'vertical' }} />
        </div>

        <button
          className="btn btn-primary"
          onClick={guardar}
          disabled={guardando}
          style={{ marginTop: '1rem', width: '100%' }}
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// ── Pestaña: Cuenta ──────────────────────────────────────────────────────────
function TabCuenta({ logout, getToken, navigate }) {
  const [confirmando, setConfirmando] = useState(false)

  const darDeBaja = async () => {
    await fetch(`${API}/api/panel/cuenta`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    logout()
    navigate('/')
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Mi suscripción</h2>
        <p className={styles.sectionDesc}>
          Para cancelar tu suscripción PRO hacelo directamente desde MercadoPago.
        </p>
        <a
          href="https://www.mercadopago.com.ar/subscriptions"
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline"
          style={{ marginTop: '.75rem', display: 'inline-flex' }}
        >
          Gestionar en MercadoPago →
        </a>
      </div>

      <div className={`${styles.section} ${styles.dangerSection}`}>
        <h2 className={styles.dangerTitle}>Zona de peligro</h2>
        <p className={styles.sectionDesc}>
          Al darte de baja tu perfil será desactivado permanentemente y dejarás de aparecer en el directorio.
        </p>

        {!confirmando ? (
          <button
            className={`btn ${styles.dangerBtn}`}
            onClick={() => setConfirmando(true)}
            style={{ marginTop: '.75rem' }}
          >
            Darme de baja
          </button>
        ) : (
          <div className={styles.confirmBox}>
            <p>¿Estás seguro? Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '.75rem' }}>
              <button className={`btn ${styles.dangerBtn}`} onClick={darDeBaja}>
                Sí, darme de baja
              </button>
              <button className="btn btn-outline" onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Panel principal ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'resumen',       label: '📊 Resumen'       },
  { id: 'presupuestos',  label: '💰 Presupuestos'  },
  { id: 'perfil',        label: '👤 Mi perfil'     },
  { id: 'cuenta',        label: '⚙️ Cuenta'         },
]

export default function Panel() {
  const { profesional, logout, getToken } = useAuth()
  const navigate                          = useNavigate()
  const [tabActiva, setTabActiva]         = useState('resumen')

  if (!profesional) return null

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.panelHeader}>
        <div>
          <h1 className={styles.title}>
            Hola, <span className={styles.nombre}>{profesional.nombre}</span> ⚡
          </h1>
          <p className={styles.subtitle}>
            {profesional.plan === 'pro'
              ? '⭐ Plan PRO activo'
              : 'Plan Free · Actualizá a PRO para más visibilidad'}
          </p>
        </div>
        <button className="btn btn-outline" onClick={() => { logout(); navigate('/') }}>
          Cerrar sesión
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${tabActiva === tab.id ? styles.tabActive : ''}`}
            onClick={() => setTabActiva(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de cada tab */}
      {tabActiva === 'resumen'      && <TabResumen      profesional={profesional} getToken={getToken} />}
      {tabActiva === 'presupuestos' && <TabPresupuestos profesional={profesional} getToken={getToken} />}
      {tabActiva === 'perfil'       && <TabPerfil       profesional={profesional} getToken={getToken} />}
      {tabActiva === 'cuenta'       && <TabCuenta       logout={logout} getToken={getToken} navigate={navigate} />}

    </div>
  )
}