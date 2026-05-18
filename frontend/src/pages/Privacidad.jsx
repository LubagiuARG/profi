import styles from './LegalPage.module.css'

export default function Privacidad() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Política de privacidad</h1>
        <span className={styles.actualizado}>Última actualización: mayo 2026</span>
      </header>

      <div className={styles.aviso}>
        <strong>⚠️ Versión preliminar.</strong> Este texto es un borrador funcional, no fue revisado por un abogado. Debe ser validado conforme a la Ley 25.326 (Protección de Datos Personales) antes de lanzar a producción.
      </div>

      <div className={styles.contenido}>
        <h2>1. Responsable del tratamiento</h2>
        <p>
          <strong>TuProfesional</strong> es responsable del tratamiento de los datos personales que se recolectan al usar la Plataforma. Cumplimos con la <strong>Ley 25.326</strong> de Protección de Datos Personales de la República Argentina.
        </p>

        <h2>2. Datos que recolectamos</h2>
        <h3>De profesionales</h3>
        <ul>
          <li>Nombre, apellido, email, teléfono.</li>
          <li>Matrícula habilitante (si aplica).</li>
          <li>Provincia, localidad y zona de cobertura.</li>
          <li>Descripción de servicios y especialidades.</li>
          <li>Datos de pago procesados por MercadoPago (no almacenamos datos de tarjetas).</li>
        </ul>

        <h3>De clientes</h3>
        <ul>
          <li>Texto de las consultas al asistente de presupuestos.</li>
          <li>Cookies técnicas para mantener la sesión.</li>
          <li>Datos de uso anónimos para análisis.</li>
        </ul>

        <h2>3. Finalidad</h2>
        <p>Usamos los datos para:</p>
        <ul>
          <li>Operar la Plataforma y permitir el contacto entre clientes y profesionales.</li>
          <li>Procesar pagos del plan PRO.</li>
          <li>Mejorar el servicio con datos agregados y anónimos.</li>
          <li>Comunicarnos por email sobre tu cuenta o cambios importantes del servicio.</li>
        </ul>

        <h2>4. Conservación</h2>
        <p>
          Conservamos los datos mientras la cuenta esté activa. Si eliminás tu cuenta, los datos personales se borran dentro de los 30 días, salvo los que la ley nos obligue a conservar (por ejemplo, comprobantes fiscales).
        </p>

        <h2>5. Compartir con terceros</h2>
        <p>
          No vendemos datos personales. Los compartimos solamente con:
        </p>
        <ul>
          <li><strong>MercadoPago</strong> para procesar pagos del plan PRO.</li>
          <li><strong>Anthropic</strong> al consultar el asistente IA (el texto de la consulta).</li>
          <li>Autoridades cuando exista una orden judicial.</li>
        </ul>

        <h2>6. Tus derechos (ARCO)</h2>
        <p>Como titular de los datos tenés derecho a:</p>
        <ul>
          <li><strong>Acceso:</strong> saber qué datos tuyos tenemos.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
          <li><strong>Cancelación:</strong> pedir la eliminación de tus datos.</li>
          <li><strong>Oposición:</strong> oponerte a tratamientos específicos.</li>
        </ul>
        <p>
          Para ejercerlos, escribinos a <a href="mailto:privacidad@tuprofesional.com">privacidad@tuprofesional.com</a>. Respondemos dentro de los 10 días hábiles según establece la ley.
        </p>

        <h2>7. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger los datos: HTTPS en todas las comunicaciones, contraseñas hasheadas con bcrypt, acceso restringido a la base de datos. Aun así, ningún sistema es 100% seguro.
        </p>

        <h2>8. Cookies</h2>
        <p>
          Usamos cookies técnicas necesarias para el funcionamiento del sitio (sesión, preferencias). No usamos cookies de publicidad de terceros sin tu consentimiento explícito.
        </p>

        <h2>9. Cambios en esta política</h2>
        <p>
          Si modificamos esta política te avisaremos publicando una nueva versión con su fecha. Si los cambios son sustanciales te notificaremos también por email a la dirección registrada.
        </p>

        <h2>10. Contacto y autoridad de control</h2>
        <p>
          Para consultas sobre privacidad: <a href="mailto:privacidad@tuprofesional.com">privacidad@tuprofesional.com</a>.
        </p>
        <p>
          La autoridad de control en Argentina es la <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, ante la cual podés presentar reclamos: <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">argentina.gob.ar/aaip</a>.
        </p>
      </div>
    </main>
  )
}
