-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "identidadVerificada" BOOLEAN NOT NULL DEFAULT false,
    "identidadVerificadaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER,
    "clienteNombre" TEXT NOT NULL,
    "clienteTelefono" TEXT NOT NULL,
    "clienteEmail" TEXT,
    "profesionalId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "presupuestoSnapshot" JSONB NOT NULL,
    "mensajeExtra" TEXT,
    "ubicacion" JSONB,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "motivoRechazo" TEXT,
    "respondidoEn" TIMESTAMP(3),
    "cerradoEn" TIMESTAMP(3),
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCliente" (
    "id" SERIAL NOT NULL,
    "telefono" TEXT NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "verificadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_telefono_key" ON "Cliente"("telefono");

-- CreateIndex
CREATE INDEX "Solicitud_profesionalId_estado_idx" ON "Solicitud"("profesionalId", "estado");

-- CreateIndex
CREATE INDEX "Solicitud_clienteTelefono_idx" ON "Solicitud"("clienteTelefono");

-- CreateIndex
CREATE INDEX "OtpCliente_telefono_expiraEn_idx" ON "OtpCliente"("telefono", "expiraEn");

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
