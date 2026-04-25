import { useState } from 'react'
import styles from './AdBanner.module.css'

/* 
  En producción: reemplazar con Google AdSense o banner de sponsor real.
  Estructura lista para rotar anuncios dinámicamente desde el backend.
*/
const ADS = [
  {
    id: 1,
    sponsor: 'Distribuidora Norte',
    text: 'Materiales eléctricos al mejor precio — Stock permanente en GBA y CABA',
    cta: 'Ver catálogo →',
    url: '#',
  },
  {
    id: 2,
    sponsor: 'Tableros Córdoba',
    text: 'Tableros industriales y domiciliarios — Envío a todo el país',
    cta: 'Consultar →',
    url: '#',
  },
  {
    id: 3,
    sponsor: 'CAME Eléctrico',
    text: 'Cables, llaves y accesorios con precio de mayorista — Membresía CAME',
    cta: 'Saber más →',
    url: '#',
  },
]

export default function AdBanner() {
  const [current] = useState(() => Math.floor(Math.random() * ADS.length))
  const ad = ADS[current]

  return (
    <div className={styles.banner}>
      <span className={styles.tag}>PUBLICIDAD</span>
      <span className={styles.sponsor}>{ad.sponsor}</span>
      <span className={styles.text}>{ad.text}</span>
      <a href={ad.url} className={styles.cta} onClick={e => e.preventDefault()}>
        {ad.cta}
      </a>
    </div>
  )
}
