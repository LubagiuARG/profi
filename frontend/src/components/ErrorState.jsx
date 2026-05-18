import styles from './ErrorState.module.css'

export default function ErrorState({
  titulo = 'Algo salió mal',
  mensaje,
  onRetry,
  icono = '⚠️',
}) {
  return (
    <div className={styles.errorState} role="alert">
      <div className={styles.icono}>{icono}</div>
      <h3 className={styles.titulo}>{titulo}</h3>
      {mensaje && <p className={styles.mensaje}>{mensaje}</p>}
      {onRetry && (
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}
