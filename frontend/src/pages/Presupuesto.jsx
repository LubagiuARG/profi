import { useState, useRef, useEffect } from 'react'
import { useChat } from '../hooks/useChat'
import { getSugerenciasSolicitud } from '../services/api'
import SolicitudWizard from '../components/SolicitudWizard'
import styles from './Presupuesto.module.css'

const API = import.meta.env.VITE_API_URL
const MAX_SELECCION = 3

const SUGGESTIONS = [
  'Cambiar tablero eléctrico',
  'Instalar tomas en local',
  'Pintar departamento 3 ambientes',
  'Reparar pérdida de agua',
  'Instalar aire acondicionado split',
  'Instalar cámara de seguridad',
]

// ── Avatar con color por inicial ─────────────────────────────────────────────
const AVATAR_COLORS = ['#2563eb','#059669','#d97706','#7c3aed','#db2777']
function avatarColor(nombre = '') {
  const code = (nombre.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[code]
}

// ── Card de profesional con checkbox de selección ────────────────────────────
function ProCard({ pro, seleccionado, onToggle, disabled }) {
  const inicial = (pro.nombre || '?')[0].toUpperCase()
  return (
    <label className={`${styles.proCard} ${seleccionado ? styles.proCardSel : ''} ${disabled ? styles.proCardDisabled : ''}`}>
      <input
        type="checkbox"
        className={styles.proCheck}
        checked={seleccionado}
        onChange={() => onToggle(pro.id)}
        disabled={disabled && !seleccionado}
      />
      <div className={styles.proAvatar} style={{ background: avatarColor(pro.nombre) }}>
        {inicial}
      </div>
      <div className={styles.proInfo}>
        <div className={styles.proNameRow}>
          <span className={styles.proName}>{pro.nombre} {pro.apellido}</span>
          {pro.plan === 'pro' && <span className={styles.proBadge}>PRO</span>}
          {pro.verificado && <span className={styles.proBadgeVer} title="Verificado">✓</span>}
        </div>
        <div className={styles.proZona}>{pro.zona || pro.provincia || '—'}</div>
        {pro.rating > 0 && (
          <div className={styles.proRating}>
            {'★'.repeat(Math.round(pro.rating))} {pro.rating.toFixed(1)}
            <span className={styles.proReviews}>({pro.reviews})</span>
          </div>
        )}
      </div>
    </label>
  )
}

// ── Burbuja de mensaje ───────────────────────────────────────────────────────
function MessageBubble({ msg, onVerProfesionales, mostrarBotonPros }) {
  const isUser = msg.role === 'user'
  const { ui } = msg
  const hasBudget = ui?.type === 'budget' && ui.items?.length > 0

  return (
    <div className={`${styles.msgRow} ${isUser ? styles.msgRowUser : ''}`}>
      <div className={`${styles.avatar} ${isUser ? styles.avatarUser : styles.avatarAi}`}>
        {isUser ? 'U' : 'IA'}
      </div>

      <div className={styles.msgBody}>
        <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : ''}`}>
          <p
            className={styles.bubbleText}
            dangerouslySetInnerHTML={{
              __html: (ui?.text || '')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br/>'),
            }}
          />

          {hasBudget && (
            <div className={styles.budgetCard}>
              <div className={styles.budgetHeader}>
                <span className={styles.budgetTitle}>PRESUPUESTO ORIENTATIVO</span>
              </div>
              <div className={styles.budgetItems}>
                {ui.items.map((item, i) => (
                  <div key={i} className={styles.budgetItem}>
                    <span className={styles.budgetLabel}>{item.label}</span>
                    <span className={styles.budgetVal}>{item.val}</span>
                  </div>
                ))}
              </div>
              {ui.total && (
                <div className={styles.budgetTotal}>
                  <span>TOTAL ESTIMADO</span>
                  <span className={styles.budgetTotalVal}>{ui.total}</span>
                </div>
              )}
              {ui.notas && (
                <div className={styles.budgetNotas}>💡 {ui.notas}</div>
              )}
              <p className={styles.budgetDisclaimer}>
                Valores orientativos. Consultá siempre con un profesional habilitado.
              </p>
            </div>
          )}
        </div>

        {hasBudget && mostrarBotonPros && (
          <div className={styles.findProCard}>
            <p className={styles.findProText}>¿Querés un presupuesto real de un profesional?</p>
            <button className={styles.findProBtn} onClick={onVerProfesionales}>
              Ver profesionales disponibles →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className={styles.msgRow}>
      <div className={`${styles.avatar} ${styles.avatarAi}`}>IA</div>
      <div className={styles.bubble}>
        <div className={styles.typing}>
          <span className={styles.typingDot} />
          <span className={styles.typingDot} />
          <span className={styles.typingDot} />
        </div>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Presupuesto() {
  const [input, setInput] = useState('')
  const [categorias, setCategorias] = useState([])
  const [categoriaSlug, setCategoriaSlug] = useState('profesional')
  const { messages, loading, sendMessage, clearChat } = useChat('particular', categoriaSlug)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const [mostrarProfesionales, setMostrarProfesionales] = useState(false)
  const [profesionalesDisponibles, setProfesionalesDisponibles] = useState([])
  const [cargandoProfesionales, setCargandoProfesionales] = useState(false)
  const [errorPros, setErrorPros] = useState('')
  const [seleccionados, setSeleccionados] = useState([])
  const [wizardAbierto, setWizardAbierto] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/categorias`)
      .then(r => r.json())
      .then(data => {
        const lista = Array.isArray(data) ? data : []
        setCategorias(lista)
        if (lista.length && !lista.find(c => c.slug === categoriaSlug)) {
          setCategoriaSlug(lista[0].slug)
        }
      })
      .catch(() => setCategorias([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading, mostrarProfesionales])

  useEffect(() => {
    if (!mostrarProfesionales) return
    setCargandoProfesionales(true)
    setErrorPros('')
    setSeleccionados([])
    getSugerenciasSolicitud(categoriaSlug)
      .then(data => {
        const lista = Array.isArray(data?.profesionales) ? data.profesionales : []
        setProfesionalesDisponibles(lista)
      })
      .catch(err => {
        setErrorPros(err.message)
        setProfesionalesDisponibles([])
      })
      .finally(() => setCargandoProfesionales(false))
  }, [mostrarProfesionales, categoriaSlug])

  const toggleSeleccion = (id) => {
    setSeleccionados(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length >= MAX_SELECCION ? prev : [...prev, id]
    )
  }

  const handleSend = () => {
    if (!input.trim() || loading) return
    setMostrarProfesionales(false)
    sendMessage(input.trim())
    setInput('')
  }

  const handleSuggestion = (text) => {
    setMostrarProfesionales(false)
    sendMessage(text)
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Última consulta del usuario y último presupuesto para mandar al wizard
  const userMessages = messages.filter(m => m.role === 'user')
  const ultimaConsulta = userMessages[userMessages.length - 1]?.ui?.text || ''

  const aiMessages = messages.filter(m => m.role === 'assistant' && m.ui?.type === 'budget')
  const ultimoBudget = aiMessages[aiMessages.length - 1]?.ui || null

  // El botón "ver profesionales" aparece solo en el último mensaje IA con budget
  const lastBudgetIdx = messages.reduce((acc, m, i) =>
    m.role === 'assistant' && m.ui?.type === 'budget' && m.ui?.items?.length > 0 ? i : acc, -1)

  const profesionalesSeleccionados = profesionalesDisponibles.filter(p => seleccionados.includes(p.id))
  const categoriaActual = categorias.find(c => c.slug === categoriaSlug)

  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        <span className="badge">✦ Asistente IA · Precios orientativos</span>
        <h1 className={styles.heroTitle}>
          Conocé el precio antes de contratar
        </h1>
        <p className={styles.heroDesc}>
          Describí el trabajo que necesitás y el asistente calcula un presupuesto orientativo basado en tarifas actualizadas.
        </p>
      </div>

      {/* Chat container */}
      <div className={styles.chatContainer}>

        {/* Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <span className={styles.aiDot} />
            <div className={styles.chatTitle}>Asistente TuProfesional</div>
          </div>
          <div className={styles.chatHeaderRight}>
            {categorias.length > 0 && (
              <label className={styles.rubroLabel}>
                <span className={styles.rubroLabelText}>Rubro:</span>
                <select
                  className={styles.rubroSelect}
                  value={categoriaSlug}
                  onChange={e => setCategoriaSlug(e.target.value)}
                  disabled={loading}
                >
                  {categorias.map(c => (
                    <option key={c.slug} value={c.slug}>
                      {c.emoji} {c.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button className="btn btn-ghost" onClick={() => { clearChat(); setMostrarProfesionales(false) }} title="Limpiar conversación">
              🗑️
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              msg={msg}
              mostrarBotonPros={i === lastBudgetIdx && !mostrarProfesionales}
              onVerProfesionales={() => setMostrarProfesionales(true)}
            />
          ))}
          {loading && <TypingIndicator />}

          {/* Panel de profesionales */}
          {mostrarProfesionales && (
            <div className={styles.prosPanel}>
              <div className={styles.prosPanelHeader}>
                <div>
                  <span className={styles.prosPanelTitle}>
                    {categoriaActual?.emoji} {categoriaActual?.nombre || 'Profesionales'} cerca tuyo
                  </span>
                  <p className={styles.prosPanelHint}>
                    Elegí hasta {MAX_SELECCION} para que reciban tu pedido.
                  </p>
                </div>
                <button className={styles.prosPanelClose} onClick={() => setMostrarProfesionales(false)}>✕</button>
              </div>
              {cargandoProfesionales && <p className={styles.prosLoading}>Buscando profesionales...</p>}
              {errorPros && !cargandoProfesionales && (
                <p className={styles.prosLoading}>⚠️ {errorPros}</p>
              )}
              {!cargandoProfesionales && !errorPros && profesionalesDisponibles.length === 0 && (
                <p className={styles.prosLoading}>
                  No hay profesionales registrados para {categoriaActual?.nombre || 'esta categoría'} todavía.
                </p>
              )}
              {!cargandoProfesionales && profesionalesDisponibles.map(pro => (
                <ProCard
                  key={pro.id}
                  pro={pro}
                  seleccionado={seleccionados.includes(pro.id)}
                  onToggle={toggleSeleccion}
                  disabled={seleccionados.length >= MAX_SELECCION}
                />
              ))}
              {profesionalesDisponibles.length > 0 && (
                <button
                  className={`btn btn-primary ${styles.solicitarBtn}`}
                  onClick={() => setWizardAbierto(true)}
                  disabled={seleccionados.length === 0}
                >
                  {seleccionados.length === 0
                    ? 'Elegí al menos un profesional'
                    : `Pedir presupuesto a ${seleccionados.length} ${seleccionados.length === 1 ? 'profesional' : 'profesionales'} →`}
                </button>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Sugerencias (solo chat vacío) */}
        {messages.length <= 1 && !loading && (
          <div className={styles.suggestions}>
            <span className={styles.suggestionsLabel}>Consultas frecuentes</span>
            <div className={styles.suggestionsList}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className={styles.suggestionBtn} onClick={() => handleSuggestion(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Wizard de solicitud */}
        <SolicitudWizard
          abierto={wizardAbierto}
          onCerrar={() => {
            setWizardAbierto(false)
            // si la solicitud se mandó OK, cerramos también el panel
            setMostrarProfesionales(false)
            setSeleccionados([])
          }}
          categoriaSlug={categoriaSlug}
          categoriaNombre={categoriaActual?.nombre}
          profesionales={profesionalesSeleccionados}
          presupuestoSnapshot={ultimoBudget}
          ultimaConsulta={ultimaConsulta}
        />

        {/* Input */}
        <div className={styles.inputArea}>
          <textarea
            ref={inputRef}
            className={styles.textarea}
            placeholder="Describí el trabajo que necesitás..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
            disabled={loading}
          />
          <button
            className={`btn btn-primary ${styles.sendBtn}`}
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? '...' : 'Consultar ↗'}
          </button>
        </div>
      </div>

    </div>
  )
}
