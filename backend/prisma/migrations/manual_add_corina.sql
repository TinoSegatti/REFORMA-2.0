-- Migración manual para agregar modelos CORINA
-- Ejecutar este script directamente en la base de datos si hay problemas con Prisma Migrate

-- ============================================
-- 1. Agregar campos a tabla t_usuarios
-- ============================================
ALTER TABLE "t_usuarios" 
ADD COLUMN IF NOT EXISTS "telefono" TEXT,
ADD COLUMN IF NOT EXISTS "telefonoVerificado" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "notificacionesWhatsAppActivas" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "codigoVerificacionTelefono" TEXT,
ADD COLUMN IF NOT EXISTS "fechaVerificacionTelefono" TIMESTAMP(3);

-- Crear índice único para codigoVerificacionTelefono si no existe
CREATE UNIQUE INDEX IF NOT EXISTS "t_usuarios_codigoVerificacionTelefono_key" ON "t_usuarios"("codigoVerificacionTelefono");

-- ============================================
-- 2. Crear enums para CORINA
-- ============================================
CREATE TYPE "TipoInteraccionCorina" AS ENUM ('MENSAJE_TEXTO', 'MENSAJE_AUDIO', 'CREACION_REGISTRO', 'CONSULTA_ALERTAS', 'CONSULTA_INVENTARIO');
CREATE TYPE "EstadoInteraccionCorina" AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADA', 'ERROR');
CREATE TYPE "TipoNotificacionCorina" AS ENUM ('ALERTA_INVENTARIO', 'CONFIRMACION_CREACION', 'ERROR_VALIDACION');
CREATE TYPE "EstadoNotificacionCorina" AS ENUM ('ENVIADA', 'ENTREGADA', 'FALLIDA', 'PENDIENTE');

-- ============================================
-- 3. Crear tabla t_corina_interaccion
-- ============================================
CREATE TABLE IF NOT EXISTS "t_corina_interaccion" (
    "id" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "idGranja" TEXT,
    "tipoInteraccion" "TipoInteraccionCorina" NOT NULL,
    "estadoInteraccion" "EstadoInteraccionCorina" NOT NULL DEFAULT 'PENDIENTE',
    "mensajeRecibido" TEXT,
    "urlAudioOriginal" TEXT,
    "duracionAudioSegundos" DOUBLE PRECISION,
    "datosExtraidos" JSONB,
    "tablaDestino" TEXT,
    "respuestaCorina" TEXT,
    "registroCreadoId" TEXT,
    "tablaRegistroCreado" TEXT,
    "fechaInteraccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaProcesamiento" TIMESTAMP(3),
    "fechaCompletada" TIMESTAMP(3),
    "errorMensaje" TEXT,

    CONSTRAINT "t_corina_interaccion_pkey" PRIMARY KEY ("id")
);

-- Índices para t_corina_interaccion
CREATE INDEX IF NOT EXISTS "t_corina_interaccion_idUsuario_idx" ON "t_corina_interaccion"("idUsuario");
CREATE INDEX IF NOT EXISTS "t_corina_interaccion_idGranja_idx" ON "t_corina_interaccion"("idGranja");
CREATE INDEX IF NOT EXISTS "t_corina_interaccion_tipoInteraccion_idx" ON "t_corina_interaccion"("tipoInteraccion");
CREATE INDEX IF NOT EXISTS "t_corina_interaccion_estadoInteraccion_idx" ON "t_corina_interaccion"("estadoInteraccion");
CREATE INDEX IF NOT EXISTS "t_corina_interaccion_fechaInteraccion_idx" ON "t_corina_interaccion"("fechaInteraccion");

-- Foreign keys para t_corina_interaccion
ALTER TABLE "t_corina_interaccion" 
ADD CONSTRAINT "t_corina_interaccion_idUsuario_fkey" 
FOREIGN KEY ("idUsuario") REFERENCES "t_usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "t_corina_interaccion" 
ADD CONSTRAINT "t_corina_interaccion_idGranja_fkey" 
FOREIGN KEY ("idGranja") REFERENCES "t_granja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- 4. Crear tabla t_corina_notificacion
-- ============================================
CREATE TABLE IF NOT EXISTS "t_corina_notificacion" (
    "id" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "idGranja" TEXT,
    "tipoNotificacion" "TipoNotificacionCorina" NOT NULL,
    "estadoNotificacion" "EstadoNotificacionCorina" NOT NULL DEFAULT 'PENDIENTE',
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "datosAdicionales" JSONB,
    "idInventario" TEXT,
    "cantidadAlerta" DOUBLE PRECISION,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEnvio" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "fechaError" TIMESTAMP(3),
    "errorMensaje" TEXT,
    "intentosEnvio" INTEGER NOT NULL DEFAULT 0,
    "twilioMessageSid" TEXT,

    CONSTRAINT "t_corina_notificacion_pkey" PRIMARY KEY ("id")
);

-- Índice único para twilioMessageSid
CREATE UNIQUE INDEX IF NOT EXISTS "t_corina_notificacion_twilioMessageSid_key" ON "t_corina_notificacion"("twilioMessageSid");

-- Índices para t_corina_notificacion
CREATE INDEX IF NOT EXISTS "t_corina_notificacion_idUsuario_idx" ON "t_corina_notificacion"("idUsuario");
CREATE INDEX IF NOT EXISTS "t_corina_notificacion_idGranja_idx" ON "t_corina_notificacion"("idGranja");
CREATE INDEX IF NOT EXISTS "t_corina_notificacion_tipoNotificacion_idx" ON "t_corina_notificacion"("tipoNotificacion");
CREATE INDEX IF NOT EXISTS "t_corina_notificacion_estadoNotificacion_idx" ON "t_corina_notificacion"("estadoNotificacion");
CREATE INDEX IF NOT EXISTS "t_corina_notificacion_fechaCreacion_idx" ON "t_corina_notificacion"("fechaCreacion");

-- Foreign keys para t_corina_notificacion
ALTER TABLE "t_corina_notificacion" 
ADD CONSTRAINT "t_corina_notificacion_idUsuario_fkey" 
FOREIGN KEY ("idUsuario") REFERENCES "t_usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "t_corina_notificacion" 
ADD CONSTRAINT "t_corina_notificacion_idGranja_fkey" 
FOREIGN KEY ("idGranja") REFERENCES "t_granja"("id") ON DELETE SET NULL ON UPDATE CASCADE;












