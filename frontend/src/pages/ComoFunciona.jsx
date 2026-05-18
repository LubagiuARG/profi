import { useNavigate } from 'react-router-dom'
import styles from './ComoFunciona.module.css'

const PASOS_CLIENTE = [
  {
    num: '01',
    titulo: 'Describí qué necesitás',
    desc: 'Entrá a "Presupuesto IA", elegí el rubro y contale al asistente qué trabajo querés hacer. Podés ser tan específico como quieras: lugar, medidas, urgencia.',
  },
  {
    num: '02',
    titulo: 'Recibí un presupuesto orientativo',
    desc: 'La IA usa tarifas reales del mercado argentino para darte un rango de precios. Te muestra mano de obra y materiales por separado.',
  },
  {
    num: '03',
    titulo: 'Conectate con un profesional',
    desc: 'Mirá profesionales verificados en tu zona. Comparalos por calificación, especialidades y plan. Contactá directo por WhatsApp.',
  },
]

const PASOS_PROFESIONAL = [
  {
    num: '01',
    titulo: 'Creá tu perfil',
    desc: 'Registrate gratis con tus datos, especialidades y zona de cobertura. Sumá matrícula si la tenés — los clientes la ven y genera confianza.',
  },
  {
    num: '02',
    titulo: 'Recibí consultas reales',
    desc: 'Los clientes que cierran un presupuesto en la app te ven directamente. El plan PRO te pone primero en los listados y te activa el botón WhatsApp.',
  },
  {
    num: '03',
    titulo: 'Cerrá trabajos sin comisiones',
    desc: 'El contacto se hace por WhatsApp, sin intermediarios. TuProfesional cobra solo tu suscripción mensual — el precio del trabajo es 100% para vos.',
  },
]

export default function ComoFunciona() {
  const navigate = useNavigate()

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className="badge">✦ ¿Cómo funciona?</span>
        <h1 className={styles.titulo}>De la consulta al trabajo, en 3 pasos</h1>
        <p className={styles.sub}>
          TuProfesional combina presupuestos calculados por IA con un directorio de profesionales verificados de toda Argentina.
        </p>
      </section>

      <section className={styles.bloque}>
        <h2 className={styles.bloqueTitulo}>Si necesitás contratar un profesional</h2>
        <div className={styles.pasos}>
          {PASOS_CLIENTE.map(p => (
            <div key={p.num} className={styles.paso}>
              <span className={styles.pasoNum}>{p.num}</span>
              <h3 className={styles.pasoTitulo}>{p.titulo}</h3>
              <p className={styles.pasoDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
        <div className={styles.cta}>
          <button className="btn btn-primary" onClick={() => navigate('/presupuesto')}>
            Calcular un presupuesto
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/profesionales')}>
            Buscar profesionales
          </button>
        </div>
      </section>

      <section className={`${styles.bloque} ${styles.bloqueDark}`}>
        <h2 className={styles.bloqueTitulo}>Si sos profesional</h2>
        <div className={styles.pasos}>
          {PASOS_PROFESIONAL.map(p => (
            <div key={p.num} className={`${styles.paso} ${styles.pasoDark}`}>
              <span className={styles.pasoNum}>{p.num}</span>
              <h3 className={styles.pasoTitulo}>{p.titulo}</h3>
              <p className={styles.pasoDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
        <div className={styles.cta}>
          <button className="btn btn-primary" onClick={() => navigate('/registro')}>
            Publicar mi servicio
          </button>
        </div>
      </section>

      <section className={styles.faqHint}>
        <p>
          ¿Tenés más dudas? Escribinos a <a href="mailto:hola@tuprofesional.com" className={styles.link}>hola@tuprofesional.com</a>.
        </p>
      </section>
    </main>
  )
}
