import styles from './Loader.module.css'

export default function Loader({ texto = 'Cargando...', inline = false, size = 'md' }) {
  const cls = `${styles.loader} ${inline ? styles.inline : ''} ${styles[size] || ''}`.trim()
  return (
    <div className={cls} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      {texto && <span className={styles.texto}>{texto}</span>}
    </div>
  )
}
