import { useState, useRef, useEffect } from 'react'
import { useChat } from '../hooks/useChat'
import styles from './Presupuesto.module.css'

const API = import.meta.env.VITE_API_URL

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

// ── Card de profesional ──────────────────────────────────────────────────────
function ProCard({ pro, ultimaConsulta, ultimoTotal }) {
  const inicial = (pro.nombre || '?')[0].toUpperCase()

  const contactarWA = () => {
    const tel = (pro.telefono || '').replace(/\D/g, '')
    const msg = `Hola ${pro.nombre}! Te contacto desde TuProfesional. 🔧\n\nNecesito: ${ultimaConsulta}\n\n💰 Presupuesto orientativo que obtuve: ${ultimoTotal}\n\n¿Podés darme un presupuesto real para este trabajo?`
    window.open(`https://wa.me/54${tel}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className={styles.proCard}>
      <div className={styles.proAvatar} style={{ background: avatarColor(pro.nombre) }}>
        {inicial}
      </div>
      <div className={styles.proInfo}>
        <div className={styles.proNameRow}>
          <span className={styles.proName}>{pro.nombre} {pro.apellido}</span>
          {pro.plan === 'pro' && <span className={styles.proBadge}>PRO</span>}
        </div>
        <div className={styles.proZona}>{pro.zona || pro.provincia || '—'}</div>
        {pro.rating > 0 && (
          <div className={styles.proRating}>{'★'.repeat(Math.round(pro.rating))} {pro.rating.toFixed(1)}</div>
        )}
      </div>
      <button className={styles.waBtn} onClick={contactarWA}>
        💬 WhatsApp
      </button>
    </div>
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
  const { messages, loading, sendMessage, clearChat } = useChat()
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const [mostrarProfesionales, setMostrarProfesionales] = useState(false)
  const [profesionalesDisponibles, setProfesionalesDisponibles] = useState([])
  const [cargandoProfesionales, setCargandoProfesionales] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, mostrarProfesionales])

  useEffect(() => {
    if (!mostrarProfesionales) return
    setCargandoProfesionales(true)
    fetch(`${API}/api/electricistas?limit=6`)
      .then(r => r.json())
      .then(data => {
        const lista = Array.isArray(data) ? data : data.electricistas ?? []
        const sorted = [...lista].sort((a, b) => {
          if (a.plan === 'pro' && b.plan !== 'pro') return -1
          if (b.plan === 'pro' && a.plan !== 'pro') return  1
          return (b.rating || 0) - (a.rating || 0)
        })
        setProfesionalesDisponibles(sorted.slice(0, 3))
      })
      .catch(() => setProfesionalesDisponibles([]))
      .finally(() => setCargandoProfesionales(false))
  }, [mostrarProfesionales])

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

  // Última consulta del usuario y último total para el mensaje WhatsApp
  const userMessages = messages.filter(m => m.role === 'user')
  const ultimaConsulta = userMessages[userMessages.length - 1]?.ui?.text || ''

  const aiMessages = messages.filter(m => m.role === 'assistant' && m.ui?.type === 'budget')
  const ultimoTotal = aiMessages[aiMessages.length - 1]?.ui?.total || 'a calcular'

  // El botón "ver profesionales" aparece solo en el último mensaje IA con budget
  const lastBudgetIdx = messages.reduce((acc, m, i) =>
    m.role === 'assistant' && m.ui?.type === 'budget' && m.ui?.items?.length > 0 ? i : acc, -1)

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
          <button className="btn btn-ghost" onClick={() => { clearChat(); setMostrarProfesionales(false) }} title="Limpiar conversación">
            🗑️
          </button>
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
                <span className={styles.prosPanelTitle}>Profesionales disponibles</span>
                <button className={styles.prosPanelClose} onClick={() => setMostrarProfesionales(false)}>✕</button>
              </div>
              {cargandoProfesionales && <p className={styles.prosLoading}>Buscando profesionales...</p>}
              {!cargandoProfesionales && profesionalesDisponibles.length === 0 && (
                <p className={styles.prosLoading}>No hay profesionales disponibles en este momento.</p>
              )}
              {!cargandoProfesionales && profesionalesDisponibles.map(pro => (
                <ProCard
                  key={pro.id}
                  pro={pro}
                  ultimaConsulta={ultimaConsulta}
                  ultimoTotal={ultimoTotal}
                />
              ))}
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
