import { useState, useEffect, useMemo } from 'react'
import styles from './Electricistas.module.css'
import { getElectricistas } from '../services/api'

const REGIONS = [
  { id: 'todos',     label: 'Todos'     },
  { id: 'caba',      label: 'CABA'      },
  { id: 'gba-norte', label: 'GBA Norte' },
  { id: 'gba-sur',   label: 'GBA Sur'   },
  { id: 'gba-oeste', label: 'GBA Oeste' },
]

const SORTS = [
  { id: 'rating',  label: 'Mejor puntuación' },
  { id: 'tarifa',  label: 'Menor tarifa'     },
  { id: 'reviews', label: 'Más reseñas'      },
]

function Stars({ rating }) {
  const full  = Math.floor(rating)
  const half  = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span className={styles.stars} aria-label={`${rating} estrellas`}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}
    </span>
  )
}

function ElecCard({ elec }) {
  const nombre = `${elec.nombre} ${elec.apellido}`
  const iniciales = `${elec.nombre[0]}${elec.apellido[0]}`
  const whatsappUrl = `https://wa.me/54${elec.telefono.replace(/\D/g,'')}?text=Hola%20${encodeURIComponent(nombre)}%2C%20te%20contacto%20desde%20DonVoltio.`

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>{iniciales.toUpperCase()}</div>
        <div>
          <div className={styles.nombre}>{nombre}</div>
          <div className={styles.zona}>📍 {elec.zona}</div>
        </div>
      </div>

      <div className={styles.badges}>
        {elec.verificado && <span className="badge badge-verified">✓ Verificado</span>}
        {elec.matricula  && <span className="badge badge-matricula">Mat. N°{elec.matricula}</span>}
        {elec.plan === 'pro' && <span className="badge badge-pro">PRO</span>}
      </div>

      {elec.especialidades?.length > 0 && (
        <div className={styles.especialidades}>
          {elec.especialidades.map((e, i) => (
            <span key={i} className={styles.esp}>{e}</span>
          ))}
        </div>
      )}

      <div className={styles.rating}>
        <Stars rating={elec.rating || 0} />
        <span className={styles.ratingNum}>{(elec.rating || 0).toFixed(1)}</span>
        <span className={styles.ratingCount}>({elec.reviews || 0} reseñas)</span>
      </div>

      <div className={styles.footer}>
        <div className={styles.tarifa}>
          {elec.plan === 'pro' ? 'Plan PRO' : 'Plan Free'}
        </div>
        
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className={`btn btn-outline ${styles.contactBtn}`}
        >
          WhatsApp
        </a>
      </div>
    </div>
  )
}

export default function Electricistas() {
  const [electricistas, setElectricistas] = useState([])
  const [cargando, setCargando]           = useState(true)
  const [region, setRegion]               = useState('todos')
  const [sort, setSort]                   = useState('rating')
  const [search, setSearch]               = useState('')

  useEffect(() => {
    getElectricistas()
      .then(data => {
        setElectricistas(data)
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [])

  const filtered = useMemo(() => {
    let list = electricistas

    if (region !== 'todos') {
      list = list.filter(e =>
        e.zona?.toLowerCase().includes(region.replace('gba-', 'gba '))
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.nombre?.toLowerCase().includes(q) ||
        e.apellido?.toLowerCase().includes(q) ||
        e.zona?.toLowerCase().includes(q) ||
        e.especialidades?.some(s => s.toLowerCase().includes(q))
      )
    }

    return [...list].sort((a, b) => {
      if (sort === 'rating')  return (b.rating  || 0) - (a.rating  || 0)
      if (sort === 'reviews') return (b.reviews || 0) - (a.reviews || 0)
      return 0
    })
  }, [electricistas, region, sort, search])

  return (
    <div className={styles.page}>

      <div className="section-head">
        <h1 className="display">Electricistas Verificados</h1>
        <p>Profesionales matriculados · GBA y CABA</p>
      </div>

      <div className={styles.controls}>
        <input
          className={`input ${styles.searchInput}`}
          placeholder="Buscar por nombre, zona o especialidad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.filters}>
          {REGIONS.map(r => (
            <button
              key={r.id}
              className={`${styles.filterBtn} ${region === r.id ? styles.filterBtnActive : ''}`}
              onClick={() => setRegion(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <select
          className={`input ${styles.sortSelect}`}
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          {SORTS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <div className={styles.empty}>
          <span>⚡</span>
          <p>Cargando electricistas...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span>🔍</span>
          <p>
            {electricistas.length === 0
              ? 'Todavía no hay electricistas registrados.'
              : 'No hay electricistas que coincidan con tu búsqueda.'}
          </p>
        </div>
      ) : (
        <>
          <p className={styles.resultCount}>
            {filtered.length} profesional{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className={styles.grid}>
            {filtered.map(e => <ElecCard key={e.id} elec={e} />)}
          </div>
        </>
      )}

      <div className={styles.ctaBanner}>
        <div>
          <strong>¿Sos electricista?</strong>
          <span> Publicá tus servicios y recibí consultas de clientes en tu zona.</span>
        </div>
        <a href="/registro" className="btn btn-primary">Registrarse →</a>
      </div>

    </div>
  )
}