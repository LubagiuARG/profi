import { NavLink } from 'react-router-dom'
import styles from './Footer.module.css'

const year = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            tu<em>profesional</em>
          </span>
          <p className={styles.tagline}>
            Conectamos clientes con los mejores profesionales de Argentina.
          </p>
        </div>

        <div className={styles.links}>
          <div className={styles.col}>
            <span className={styles.colTitle}>Para clientes</span>
            <NavLink to="/profesionales" className={styles.link}>Buscar profesionales</NavLink>
            <NavLink to="/presupuesto" className={styles.link}>Presupuesto IA</NavLink>
            <NavLink to="/#como-funciona" className={styles.link}>Cómo funciona</NavLink>
          </div>
          <div className={styles.col}>
            <span className={styles.colTitle}>Para profesionales</span>
            <NavLink to="/registro" className={styles.link}>Publicar servicio</NavLink>
            <NavLink to="/panel" className={styles.link}>Mi panel</NavLink>
            <NavLink to="/login" className={styles.link}>Ingresar</NavLink>
          </div>
          <div className={styles.col}>
            <span className={styles.colTitle}>Legal</span>
            <a href="#" className={styles.link}>Términos de uso</a>
            <a href="#" className={styles.link}>Privacidad</a>
            <a href="#" className={styles.link}>Cookies</a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <span className={styles.copy}>
            © {year} TuProfesional · Hecho en Argentina 🇦🇷
          </span>
        </div>
      </div>
    </footer>
  )
}
