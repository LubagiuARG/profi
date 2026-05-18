import { useState } from 'react'
import { enviarOtpCliente, verificarOtpCliente, crearSolicitud } from '../services/api'
import styles from './SolicitudWizard.module.css'

const PASOS = ['Tus datos', 'Verificación', 'Confirmar']

export default function SolicitudWizard({
  abierto,
  onCerrar,
  categoriaSlug,
  categoriaNombre,
  profesionales,
  presupuestoSnapshot,
  ultimaConsulta,
}) {
  const [paso, setPaso]                 = useState(1)
  const [datos, setDatos]               = useState({ nombre: '', telefono: '', email: '', mensaje: '' })
  const [codigo, setCodigo]             = useState('')
  const [tokenCliente, setTokenCliente] = useState(null)
  const [cargando, setCargando]         = useState(false)
  const [error, setError]               = useState('')
  const [exito, setExito]               = useState(null)

  if (!abierto) return null

  const cerrar = () => {
    setPaso(1)
    setDatos({ nombre: '', telefono: '', email: '', mensaje: '' })
    setCodigo('')
    setTokenCliente(null)
    setError('')
    setExito(null)
    onCerrar()
  }

  const irAPaso2 = async () => {
    setError('')
    if (!datos.nombre.trim() || !datos.telefono.trim()) {
      setError('Nombre y teléfono son obligatorios.')
      return
    }
    if (datos.telefono.replace(/\D/g, '').length < 8) {
      setError('Teléfono inválido.')
      return
    }
    setCargando(true)
    try {
      await enviarOtpCliente(datos.telefono)
      setPaso(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const verificar = async () => {
    setError('')
    if (codigo.length !== 6) {
      setError('Ingresá los 6 dígitos.')
      return
    }
    setCargando(true)
    try {
      const r = await verificarOtpCliente(datos.telefono, codigo)
      setTokenCliente(r.tokenCliente)
      setPaso(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const reenviarCodigo = async () => {
    setError('')
    setCargando(true)
    try {
      await enviarOtpCliente(datos.telefono)
      setCodigo('')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const enviarSolicitud = async () => {
    setError('')
    setCargando(true)
    try {
      const r = await crearSolicitud({
        tokenCliente,
        nombre: datos.nombre,
        email:  datos.email || undefined,
        categoriaSlug,
        profesionalIds: profesionales.map(p => p.id),
        presupuestoSnapshot: {
          texto: presupuestoSnapshot?.texto || '',
          items: presupuestoSnapshot?.items || [],
          total: presupuestoSnapshot?.total || '',
          notas: presupuestoSnapshot?.notas || '',
          consulta: ultimaConsulta || '',
        },
        mensajeExtra: datos.mensaje || undefined,
      })
      setExito(r)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && cerrar()}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        <div className={styles.head}>
          <div>
            <h2 className={styles.titulo}>
              {exito ? 'Listo' : `Solicitá presupuesto · ${categoriaNombre || 'Profesional'}`}
            </h2>
            {!exito && (
              <p className={styles.sub}>
                {profesionales.length === 1
                  ? '1 profesional va a recibir tu pedido'
                  : `${profesionales.length} profesionales van a recibir tu pedido`}
              </p>
            )}
          </div>
          <button className={styles.cerrar} onClick={cerrar} aria-label="Cerrar">✕</button>
        </div>

        {!exito && (
          <div className={styles.pasos}>
            {PASOS.map((label, i) => (
              <div key={label} className={`${styles.pasoChip} ${paso === i + 1 ? styles.pasoActivo : ''} ${paso > i + 1 ? styles.pasoOk : ''}`}>
                <span className={styles.pasoNum}>{paso > i + 1 ? '✓' : i + 1}</span>
                {label}
              </div>
            ))}
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {/* ── Paso 1: datos ── */}
        {!exito && paso === 1 && (
          <div className={styles.contenido}>
            <label className={styles.label}>
              Tu nombre
              <input
                className={styles.input}
                placeholder="Ej: Lucía Pérez"
                value={datos.nombre}
                onChange={e => setDatos(d => ({ ...d, nombre: e.target.value }))}
                autoFocus
              />
            </label>
            <label className={styles.label}>
              Tu teléfono (WhatsApp)
              <input
                className={styles.input}
                placeholder="+54 11 0000-0000"
                value={datos.telefono}
                onChange={e => setDatos(d => ({ ...d, telefono: e.target.value }))}
              />
              <span className={styles.hint}>Te vamos a mandar un código para verificarlo.</span>
            </label>
            <label className={styles.label}>
              Email (opcional)
              <input
                className={styles.input}
                type="email"
                placeholder="vos@ejemplo.com"
                value={datos.email}
                onChange={e => setDatos(d => ({ ...d, email: e.target.value }))}
              />
              <span className={styles.hint}>Si lo dejás, te avisamos cuando el pro responda.</span>
            </label>
            <label className={styles.label}>
              Mensaje extra (opcional)
              <textarea
                className={styles.input}
                rows={3}
                placeholder="Algún detalle que quieras sumar al pedido"
                value={datos.mensaje}
                onChange={e => setDatos(d => ({ ...d, mensaje: e.target.value }))}
              />
            </label>
            <div className={styles.acciones}>
              <button className="btn btn-outline" onClick={cerrar} disabled={cargando}>Cancelar</button>
              <button className="btn btn-primary" onClick={irAPaso2} disabled={cargando}>
                {cargando ? 'Enviando código...' : 'Siguiente →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 2: OTP ── */}
        {!exito && paso === 2 && (
          <div className={styles.contenido}>
            <p className={styles.parrafo}>
              Te enviamos un código de 6 dígitos a <strong>{datos.telefono}</strong>.
            </p>
            {!import.meta.env.PROD && (
              <p className={styles.hintDev}>
                💡 <strong>Modo dev:</strong> el código aparece en la consola del backend (línea <code>[OTP DEV]</code>).
              </p>
            )}
            <label className={styles.label}>
              Código
              <input
                className={`${styles.input} ${styles.inputCodigo}`}
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
            </label>
            <button className={styles.linkBtn} onClick={reenviarCodigo} disabled={cargando}>
              Reenviar código
            </button>
            <div className={styles.acciones}>
              <button className="btn btn-outline" onClick={() => setPaso(1)} disabled={cargando}>← Atrás</button>
              <button className="btn btn-primary" onClick={verificar} disabled={cargando || codigo.length !== 6}>
                {cargando ? 'Verificando...' : 'Verificar →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 3: confirmar ── */}
        {!exito && paso === 3 && (
          <div className={styles.contenido}>
            <p className={styles.parrafo}>
              Revisá los datos antes de enviar:
            </p>
            <div className={styles.resumen}>
              <div><strong>Trabajo:</strong> {ultimaConsulta || '(sin descripción)'}</div>
              <div><strong>Presupuesto orientativo:</strong> {presupuestoSnapshot?.total || '—'}</div>
              <div><strong>Contacto:</strong> {datos.nombre} · {datos.telefono}{datos.email ? ` · ${datos.email}` : ''}</div>
              <div>
                <strong>Profesionales:</strong>{' '}
                {profesionales.map(p => `${p.nombre} ${p.apellido}`).join(', ')}
              </div>
              {datos.mensaje && <div><strong>Mensaje:</strong> {datos.mensaje}</div>}
            </div>
            <div className={styles.acciones}>
              <button className="btn btn-outline" onClick={() => setPaso(2)} disabled={cargando}>← Atrás</button>
              <button className="btn btn-primary" onClick={enviarSolicitud} disabled={cargando}>
                {cargando ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        )}

        {/* ── Éxito ── */}
        {exito && (
          <div className={styles.contenido}>
            <div className={styles.exitoIcono}>🎉</div>
            <h3 className={styles.exitoTitulo}>Tu solicitud está en camino</h3>
            <p className={styles.parrafo}>
              {profesionales.length === 1
                ? 'El profesional va a recibir tu pedido.'
                : `Los ${profesionales.length} profesionales van a recibir tu pedido.`}
              {' '}Te van a responder en su panel; si dejaste email, te avisamos cuando alguien acepte.
            </p>
            <p className={styles.parrafo}>
              <small>Tu solicitud expira el <strong>{new Date(exito.expiraEn).toLocaleDateString('es-AR')}</strong>.</small>
            </p>
            <div className={styles.acciones} style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={cerrar}>Cerrar</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
