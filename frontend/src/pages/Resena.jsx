import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getResenaInfo, crearResena } from '../services/api'
import Loader from '../components/Loader'
import ErrorState from '../components/ErrorState'
import styles from './Resena.module.css'

export default function Resena() {
  const { token } = useParams()
  const navigate  = useNavigate()
  const [info, setInfo]         = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError]       = useState('')
  const [rating, setRating]     = useState(0)
  const [hover, setHover]       = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito]       = useState(false)

  useEffect(() => {
    setCargando(true)
    getResenaInfo(token)
      .then(setInfo)
      .catch(err => setError(err.message))
      .finally(() => setCargando(false))
  }, [token])

  const enviar = async () => {
    if (rating < 1) {
      setError('Elegí entre 1 y 5 estrellas')
      return
    }
    setError('')
    setEnviando(true)
    try {
      await crearResena(token, { rating, comentario })
      setExito(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <main className={styles.page}><Loader /></main>
  if (error && !info) return (
    <main className={styles.page}>
      <ErrorState
        titulo="No se pudo abrir la reseña"
        mensaje={error}
      />
    </main>
  )

  if (info?.yaReseñada) return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icono}>✓</div>
        <h1 className={styles.titulo}>Ya enviaste esta reseña</h1>
        <p className={styles.parrafo}>
          Gracias por compartir tu opinión sobre {info.profesional?.nombre} {info.profesional?.apellido}.
          No podés modificarla desde acá.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    </main>
  )

  if (exito) return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icono}>⭐</div>
        <h1 className={styles.titulo}>¡Gracias por tu reseña!</h1>
        <p className={styles.parrafo}>
          Tu opinión ayuda a otros clientes a elegir mejor y al profesional a crecer en la plataforma.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/profesionales')}>
          Ver más profesionales
        </button>
      </div>
    </main>
  )

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.contexto}>
          Hola {info?.clienteNombre} 👋 · {info?.categoria?.emoji} {info?.categoria?.nombre}
        </p>
        <h1 className={styles.titulo}>
          ¿Cómo fue tu experiencia con {info?.profesional?.nombre} {info?.profesional?.apellido}?
        </h1>
        <p className={styles.parrafo}>
          Tu opinión es anónima para otros clientes y ayuda al profesional a mejorar.
        </p>

        <div className={styles.estrellas}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              className={`${styles.estrella} ${n <= (hover || rating) ? styles.estrellaActiva : ''}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
        <p className={styles.ratingTexto}>
          {rating === 0 && 'Tocá las estrellas para puntuar'}
          {rating === 1 && '😞 Muy malo'}
          {rating === 2 && '🙁 Malo'}
          {rating === 3 && '😐 Aceptable'}
          {rating === 4 && '🙂 Bueno'}
          {rating === 5 && '🤩 Excelente'}
        </p>

        <label className={styles.label}>
          Contanos un poco más (opcional)
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="¿Cómo trabajó? ¿Llegó en hora? ¿Recomendarías al profesional?"
            value={comentario}
            onChange={e => setComentario(e.target.value.slice(0, 1000))}
          />
          <span className={styles.contador}>{comentario.length} / 1000</span>
        </label>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={`btn btn-primary ${styles.enviarBtn}`}
          onClick={enviar}
          disabled={enviando || rating < 1}
        >
          {enviando ? 'Enviando...' : 'Enviar reseña'}
        </button>
      </div>
    </main>
  )
}
