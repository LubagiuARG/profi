import styles from './LegalPage.module.css'

export default function Terminos() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Términos y condiciones</h1>
        <span className={styles.actualizado}>Última actualización: mayo 2026</span>
      </header>

      <div className={styles.aviso}>
        <strong>⚠️ Versión preliminar.</strong> Este texto es un borrador funcional, no fue revisado por un abogado. Antes de lanzar a producción debe ser validado conforme a la Ley 24.240 (Defensa del Consumidor) y la Ley 25.326 (Protección de Datos Personales).
      </div>

      <div className={styles.contenido}>
        <h2>1. Aceptación de los términos</h2>
        <p>
          Al usar <strong>TuProfesional</strong> (sitio web, aplicaciones y servicios relacionados, en adelante "la Plataforma") aceptás estos términos en su totalidad. Si no estás de acuerdo, no uses la Plataforma.
        </p>

        <h2>2. Descripción del servicio</h2>
        <p>
          TuProfesional es una plataforma argentina que pone en contacto a <strong>clientes</strong> que necesitan trabajos de distintos oficios (electricidad, plomería, gas, pintura, etc.) con <strong>profesionales</strong> que ofrecen esos servicios. Adicionalmente brindamos un asistente con inteligencia artificial que calcula presupuestos orientativos.
        </p>

        <h3>2.1 Lo que no somos</h3>
        <ul>
          <li>No somos parte del contrato entre cliente y profesional.</li>
          <li>No garantizamos la calidad, oportunidad o resultado de los trabajos.</li>
          <li>No procesamos pagos por los trabajos. El acuerdo económico ocurre directamente entre las partes.</li>
          <li>Los presupuestos generados por la IA son <strong>orientativos</strong>. No constituyen una oferta vinculante.</li>
        </ul>

        <h2>3. Registro y cuentas</h2>
        <p>
          Para publicarse como profesional es necesario registrarse con datos reales y verificables. El usuario es responsable de mantener la confidencialidad de su contraseña.
        </p>
        <p>
          Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos, presenten información falsa o reciban reclamos reiterados.
        </p>

        <h2>4. Plan PRO y suscripción</h2>
        <p>
          El plan PRO es una suscripción mensual recurrente procesada a través de <strong>MercadoPago</strong>. El monto vigente se muestra en la página de registro al momento de contratar. La suscripción se renueva automáticamente hasta que sea cancelada por el usuario.
        </p>
        <p>
          La cancelación se puede hacer en cualquier momento desde el panel del profesional o desde MercadoPago. Los pagos ya realizados no son reembolsables salvo error material.
        </p>

        <h2>5. Conducta del usuario</h2>
        <p>El usuario se compromete a:</p>
        <ul>
          <li>No publicar información falsa, engañosa u ofensiva.</li>
          <li>No usar la Plataforma para fines ilegales.</li>
          <li>No intentar acceder a cuentas ajenas ni vulnerar la seguridad del sistema.</li>
          <li>Respetar la propiedad intelectual de TuProfesional y terceros.</li>
        </ul>

        <h2>6. Limitación de responsabilidad</h2>
        <p>
          TuProfesional no es responsable por daños directos o indirectos derivados del uso de la Plataforma, ni por las acciones u omisiones de los profesionales o clientes. El servicio se ofrece "tal cual" sin garantías explícitas o implícitas.
        </p>

        <h2>7. Modificaciones</h2>
        <p>
          Podemos modificar estos términos en cualquier momento. Los cambios se publican en esta página con la fecha de actualización. El uso continuado de la Plataforma implica la aceptación de los términos vigentes.
        </p>

        <h2>8. Jurisdicción</h2>
        <p>
          Estos términos se rigen por las leyes de la <strong>República Argentina</strong>. Cualquier controversia será sometida a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, renunciando a cualquier otro fuero o jurisdicción.
        </p>

        <h2>9. Contacto</h2>
        <p>
          Para consultas o reclamos: <a href="mailto:hola@tuprofesional.com">hola@tuprofesional.com</a>.
        </p>
      </div>
    </main>
  )
}
