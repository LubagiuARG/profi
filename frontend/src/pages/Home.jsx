import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BuscadorGeo from '../components/BuscadorGeo'
import styles from './Home.module.css'


const QUICK_TAGS_FALLBACK = ['Electricista', 'Plomero', 'Pintor', 'Gasista', 'Aire acond.', 'Cerrajero']

const CATEGORIAS_FALLBACK = [
  { emoji: '⚡', nombre: 'Electricista' },
  { emoji: '🔧', nombre: 'Plomero' },
  { emoji: '🔥', nombre: 'Gasista' },
  { emoji: '🧱', nombre: 'Albañil' },
  { emoji: '🖌️', nombre: 'Pintor' },
  { emoji: '❄️', nombre: 'Aire acondicionado' },
  { emoji: '🔑', nombre: 'Cerrajero' },
  { emoji: '🪵', nombre: 'Carpintero' },
  { emoji: '🌿', nombre: 'Jardinero' },
  { emoji: '☀️', nombre: 'Energía solar' },
  { emoji: '📷', nombre: 'CCTV' },
  { emoji: '📦', nombre: 'Mudanzas' },
  { emoji: '🧹', nombre: 'Limpieza' },
  { emoji: '⚙️', nombre: 'Herrero' },
  { emoji: '💻', nombre: 'Técnico PC' },
  { emoji: '🌡️', nombre: 'Calefacción' },
]

const STATS = [
  { value: '4.800+', label: 'Profesionales' },
  { value: '16+', label: 'Categorías' },
  { value: '98%', label: 'Satisfacción' },
  { value: '24hs', label: 'Respuesta media' },
]

const FEATURED = [
  { name: 'Carlos M.', role: 'Electricista matriculado', location: 'Buenos Aires', rating: 4.9, jobs: 312, avatar: '👷' },
  { name: 'Laura G.', role: 'Plomera profesional', location: 'Córdoba', rating: 4.8, jobs: 187, avatar: '🔧' },
  { name: 'Pablo R.', role: 'Gasista habilitado', location: 'Rosario', rating: 5.0, jobs: 94, avatar: '🔥' },
]

const STEPS = [
  { num: '01', title: 'Describí qué necesitás', desc: 'Contanos el trabajo y la zona. Nuestro asistente IA te ayuda a precisar los detalles.' },
  { num: '02', title: 'Recibí presupuestos', desc: 'Profesionales verificados de tu zona te responden en menos de 24 horas.' },
  { num: '03', title: 'Elegí con confianza', desc: 'Revisá perfiles, calificaciones y antecedentes antes de decidir.' },
]

export default function Home() {
  const navigate = useNavigate()
  const [categorias, setCategorias]     = useState([])
  const [cargandoCats, setCargandoCats] = useState(true)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/categorias`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setCategorias(Array.isArray(data) ? data.filter(c => c.activa !== false) : CATEGORIAS_FALLBACK))
      .catch(() => setCategorias(CATEGORIAS_FALLBACK))
      .finally(() => setCargandoCats(false))
  }, [])

  const quickTags = categorias.length > 0
    ? categorias.slice(0, 6).map(c => ({ label: `${c.emoji || ''} ${c.nombre}`.trim(), nombre: c.nombre }))
    : QUICK_TAGS_FALLBACK.map(t => ({ label: t, nombre: t }))

  const handleBuscar = ({ oficio, provinciaNombre, localidad }) => {
    const params = new URLSearchParams()
    if (oficio)         params.set('q',         oficio)
    if (provinciaNombre) params.set('provincia', provinciaNombre)
    if (localidad)      params.set('localidad',  localidad)
    navigate(`/profesionales?${params.toString()}`)
  }

  const handleTag = (nombre) => {
    navigate(`/profesionales?q=${encodeURIComponent(nombre)}`)
  }

  const handleCategory = (nombre) => {
    navigate(`/profesionales?q=${encodeURIComponent(nombre)}`)
  }

  return (
    <main>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroLeft}>
            <span className="badge">✦ Toda Argentina</span>
            <h1 className={styles.heroTitle}>
              El experto que<br />
              <em>buscabas,</em><br />
              a un mensaje
            </h1>
            <p className={styles.heroSub}>
              Conectamos clientes con profesionales verificados de todos los oficios. Rápido, confiable y con presupuesto IA.
            </p>

            <BuscadorGeo onBuscar={handleBuscar} />

            <div className={styles.quickTags}>
              {quickTags.map(t => (
                <button key={t.nombre} className={styles.tag} onClick={() => handleTag(t.nombre)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.statsGrid}>
              {STATS.map(s => (
                <div key={s.label} className={styles.statCard}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.featuredCards}>
              {FEATURED.map(pro => (
                <div key={pro.name} className={styles.proCard}>
                  <span className={styles.proAvatar}>{pro.avatar}</span>
                  <div className={styles.proInfo}>
                    <span className={styles.proName}>{pro.name}</span>
                    <span className={styles.proRole}>{pro.role}</span>
                    <span className={styles.proLocation}>📍 {pro.location}</span>
                  </div>
                  <div className={styles.proMeta}>
                    <span className={styles.proRating}>⭐ {pro.rating}</span>
                    <span className={styles.proJobs}>{pro.jobs} trabajos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className={styles.categories}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Encontrá el profesional ideal</h2>
          <p className={styles.sectionSub}>
            {cargandoCats ? 'Cargando categorías...' : `${categorias.length} categorías · Todo el país`}
          </p>
          <div className={styles.catGrid}>
            {cargandoCats
              ? Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={styles.catSkeleton} aria-hidden="true" />
                ))
              : categorias.map(cat => (
                  <button
                    key={cat.id ?? cat.nombre}
                    className={styles.catCard}
                    onClick={() => handleCategory(cat.nombre)}
                  >
                    <span className={styles.catIcon}>{cat.emoji}</span>
                    <span className={styles.catLabel}>{cat.nombre}</span>
                  </button>
                ))
            }
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={styles.howItWorks} id="como-funciona">
        <div className="container">
          <span className={styles.darkBadge}>¿Cómo funciona?</span>
          <h2 className={styles.darkTitle}>Tres pasos para resolver tu problema</h2>
          <div className={styles.stepsGrid}>
            {STEPS.map(step => (
              <div key={step.num} className={styles.step}>
                <span className={styles.stepNum}>{step.num}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Strip ── */}
      <section className={styles.aiStrip}>
        <div className={`container ${styles.aiInner}`}>
          <div className={styles.aiText}>
            <span className={`badge ${styles.aiBadge}`}>✦ Asistente IA</span>
            <h2 className={styles.aiTitle}>Presupuesto inteligente en segundos</h2>
            <p className={styles.aiDesc}>
              Describí tu proyecto y nuestro asistente IA calcula un presupuesto orientativo, detecta el profesional indicado y te conecta directamente.
            </p>
          </div>
          <div className={styles.aiActions}>
            <button className="btn btn-primary" onClick={() => navigate('/presupuesto')}>
              Calcular presupuesto
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/profesionales')}>
              Ver profesionales
            </button>
          </div>
        </div>
      </section>

      {/* ── Pro CTA ── */}
      <section className={styles.proCta}>
        <div className={`container ${styles.proCtaInner}`}>
          <div>
            <h2 className={styles.proCtaTitle}>¿Sos un profesional?</h2>
            <p className={styles.proCtaDesc}>Sumá tu perfil y recibí clientes de toda Argentina sin comisiones ocultas.</p>
          </div>
          <button className="btn btn-dark" onClick={() => navigate('/registro')}>
            Publicar mi servicio
          </button>
        </div>
      </section>
    </main>
  )
}
