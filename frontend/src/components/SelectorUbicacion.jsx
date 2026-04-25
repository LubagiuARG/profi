import { useState, useEffect, useRef, useCallback } from 'react'
import { getProvincias, getLocalidades, buscarLocalidad } from '../services/georef'
import styles from './SelectorUbicacion.module.css'

const RADIOS = [
  { value: '0',    label: 'Solo mi localidad' },
  { value: '10',   label: 'Hasta 10 km' },
  { value: '20',   label: 'Hasta 20 km' },
  { value: '50',   label: 'Hasta 50 km' },
  { value: 'prov', label: 'Toda la provincia' },
]

export default function SelectorUbicacion({
  onChange,
  initialProvincia = '',
  initialLocalidad = '',
  initialRadio     = '20',
}) {
  const [provincias, setProvincias]           = useState([])
  const [provinciaId, setProvinciaId]         = useState('')
  const [provinciaNombre, setProvinciaNombre] = useState('')
  const [localidad, setLocalidad]             = useState(initialLocalidad)
  const [localidadId, setLocalidadId]         = useState('')
  const [radioKm, setRadioKm]                 = useState(String(initialRadio))
  const [sugerencias, setSugerencias]         = useState([])
  const [buscandoLoc, setBuscandoLoc]         = useState(false)
  const [cargandoProv, setCargandoProv]       = useState(true)
  const [dropdownOpen, setDropdownOpen]       = useState(false)

  // Evita disparar onChange durante la inicialización
  const skipNotify = useRef(true)
  const debounceRef = useRef(null)
  const wrapperRef  = useRef(null)

  // Cargar provincias y preseleccionar si hay initialProvincia
  useEffect(() => {
    getProvincias()
      .then(async (prov) => {
        setProvincias(prov)

        if (initialProvincia) {
          const match = prov.find(
            p => p.nombre.toLowerCase() === initialProvincia.toLowerCase()
          )
          if (match) {
            setProvinciaId(match.id)
            setProvinciaNombre(match.nombre)
            // Cargar localidades de esa provincia en background
            try {
              const locs = await getLocalidades(match.id)
              setSugerencias(locs)
            } catch { /* silent */ }
          }
        }
      })
      .catch(() => setProvincias([]))
      .finally(() => {
        setCargandoProv(false)
        // A partir de aquí ya notificamos cambios al padre
        setTimeout(() => { skipNotify.current = false }, 0)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Notificar al padre solo tras la inicialización
  useEffect(() => {
    if (skipNotify.current) return
    onChange?.({ provincia: provinciaNombre, provinciaId, localidad, localidadId, radioKm })
  }, [provinciaNombre, provinciaId, localidad, localidadId, radioKm])

  const handleProvinciaChange = async (e) => {
    const id  = e.target.value
    const sel = provincias.find(p => p.id === id)
    setProvinciaId(id)
    setProvinciaNombre(sel?.nombre || '')
    setLocalidad('')
    setLocalidadId('')
    setSugerencias([])

    if (id) {
      setBuscandoLoc(true)
      try {
        const locs = await getLocalidades(id)
        setSugerencias(locs)
        setDropdownOpen(false)
      } catch {
        setSugerencias([])
      } finally {
        setBuscandoLoc(false)
      }
    }
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

  const radioLabel = RADIOS.find(r => r.value === radioKm)?.label || ''
  const resumen = provinciaNombre
    ? `📍 ${provinciaNombre}${localidad ? ` › ${localidad}` : ''} · ${radioLabel}`
    : null

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {/* Provincia */}
        <div className={styles.field}>
          <label className={styles.label}>Provincia *</label>
          {cargandoProv ? (
            <div className={styles.skeleton} />
          ) : (
            <select
              className={styles.select}
              value={provinciaId}
              onChange={handleProvinciaChange}
            >
              <option value="">Seleccioná una provincia...</option>
              {provincias.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          )}
        </div>

        {/* Localidad */}
        <div className={styles.field} ref={wrapperRef}>
          <label className={styles.label}>Localidad</label>
          <div className={styles.locInput}>
            <input
              className={styles.select}
              type="text"
              placeholder={provinciaId ? 'Escribí tu ciudad...' : 'Primero elegí provincia'}
              value={localidad}
              onChange={e => handleLocalidadChange(e.target.value)}
              disabled={!provinciaId}
              onFocus={() => sugerencias.length > 0 && setDropdownOpen(true)}
            />
            {buscandoLoc && <span className={styles.spinner} />}
          </div>
          {dropdownOpen && sugerencias.length > 0 && (
            <ul className={styles.dropdown}>
              {sugerencias.map(loc => (
                <li
                  key={loc.id}
                  className={styles.dropdownItem}
                  onMouseDown={() => seleccionarSugerencia(loc)}
                >
                  {loc.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Radio */}
        <div className={styles.field}>
          <label className={styles.label}>Radio de cobertura</label>
          <select
            className={styles.select}
            value={radioKm}
            onChange={e => setRadioKm(e.target.value)}
          >
            {RADIOS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {resumen && (
        <div className={styles.resumen}>
          {resumen}
        </div>
      )}
    </div>
  )
}
