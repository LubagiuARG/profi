import { useState, useEffect, useRef, useCallback } from 'react'
import { getProvincias, buscarLocalidad } from '../services/georef'
import styles from './BuscadorGeo.module.css'

export default function BuscadorGeo({ onBuscar }) {
  const [oficio, setOficio]           = useState('')
  const [provincias, setProvincias]   = useState([])
  const [provinciaId, setProvinciaId] = useState('')
  const [provinciaNombre, setProvinciaNombre] = useState('')
  const [localidad, setLocalidad]     = useState('')
  const [localidadId, setLocalidadId] = useState('')
  const [sugerencias, setSugerencias] = useState([])
  const [buscandoLoc, setBuscandoLoc] = useState(false)
  const [cargandoProv, setCargandoProv] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef  = useRef(null)

  useEffect(() => {
    getProvincias()
      .then(setProvincias)
      .catch(() => setProvincias([]))
      .finally(() => setCargandoProv(false))
  }, [])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleProvinciaChange = (e) => {
    const sel = provincias.find(p => p.id === e.target.value)
    setProvinciaId(e.target.value)
    setProvinciaNombre(sel?.nombre || '')
    setLocalidad('')
    setLocalidadId('')
    setSugerencias([])
  }

  const handleLocalidadChange = useCallback((texto) => {
    setLocalidad(texto)
    setLocalidadId('')
    setDropdownOpen(false)

    clearTimeout(debounceRef.current)
    if (texto.length < 2) { setSugerencias([]); return }

    debounceRef.current = setTimeout(async () => {
      setBuscandoLoc(true)
      try {
        const res = await buscarLocalidad(texto, provinciaId)
        setSugerencias(res)
        setDropdownOpen(res.length > 0)
      } catch {
        setSugerencias([])
      } finally {
        setBuscandoLoc(false)
      }
    }, 300)
  }, [provinciaId])

  const seleccionarSugerencia = (loc) => {
    setLocalidad(loc.nombre)
    setLocalidadId(loc.id)
    setSugerencias([])
    setDropdownOpen(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onBuscar?.({ oficio, provinciaId, provinciaNombre, localidad, localidadId })
  }

  return (
    <form className={styles.buscador} onSubmit={handleSubmit}>
      {/* Oficio */}
      <div className={styles.field}>
        <span className={styles.fieldIcon}>🔍</span>
        <input
          className={styles.input}
          type="text"
          placeholder="¿Qué servicio necesitás?"
          value={oficio}
          onChange={e => setOficio(e.target.value)}
        />
      </div>

      <div className={styles.divider} />

      {/* Provincia */}
      {cargandoProv ? (
        <div className={styles.skeletonSelect} />
      ) : (
        <select
          className={styles.select}
          value={provinciaId}
          onChange={handleProvinciaChange}
        >
          <option value="">Todas las provincias</option>
          {provincias.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      )}

      <div className={styles.divider} />

      {/* Localidad con autocompletado */}
      <div className={styles.locWrapper} ref={wrapperRef}>
        <span className={styles.fieldIcon}>📍</span>
        <input
          className={styles.input}
          type="text"
          placeholder={provinciaId ? 'Ciudad o localidad...' : 'Primero elegí provincia'}
          value={localidad}
          onChange={e => handleLocalidadChange(e.target.value)}
          disabled={!provinciaId}
        />
        {buscandoLoc && <span className={styles.spinner} />}
        {dropdownOpen && sugerencias.length > 0 && (
          <ul className={styles.dropdown}>
            {sugerencias.map(loc => (
              <li
                key={loc.id}
                className={styles.dropdownItem}
                onMouseDown={() => seleccionarSugerencia(loc)}
              >
                <span className={styles.locNombre}>{loc.nombre}</span>
                {loc.provincia?.nombre && (
                  <span className={styles.locProvincia}>{loc.provincia.nombre}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="submit" className={styles.btnBuscar}>
        Buscar
      </button>
    </form>
  )
}
