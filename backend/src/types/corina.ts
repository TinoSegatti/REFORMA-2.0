/**
 * Tipos TypeScript para el sistema CORINA
 */

export enum TipoInteraccionCorina {
  MENSAJE_TEXTO = 'MENSAJE_TEXTO',
  MENSAJE_AUDIO = 'MENSAJE_AUDIO',
  CREACION_REGISTRO = 'CREACION_REGISTRO',
  CONSULTA_ALERTAS = 'CONSULTA_ALERTAS',
  CONSULTA_INVENTARIO = 'CONSULTA_INVENTARIO',
}

export enum EstadoInteraccionCorina {
  PENDIENTE = 'PENDIENTE',
  PROCESANDO = 'PROCESANDO',
  COMPLETADA = 'COMPLETADA',
  ERROR = 'ERROR',
}

export enum TipoNotificacionCorina {
  ALERTA_INVENTARIO = 'ALERTA_INVENTARIO',
  CONFIRMACION_CREACION = 'CONFIRMACION_CREACION',
  ERROR_VALIDACION = 'ERROR_VALIDACION',
}

export enum EstadoNotificacionCorina {
  ENVIADA = 'ENVIADA',
  ENTREGADA = 'ENTREGADA',
  FALLIDA = 'FALLIDA',
  PENDIENTE = 'PENDIENTE',
}

export interface MensajeWhatsApp {
  from: string; // Número que envió el mensaje (whatsapp:+5493515930163)
  to: string; // Número de Twilio (whatsapp:+14155238886)
  body?: string; // Texto del mensaje (si es texto)
  numMedia?: number; // Número de archivos adjuntos
  mediaUrl?: string; // URL del audio (si hay audio)
  mediaContentType?: string; // Tipo de contenido del audio
}

export interface DatosExtraidosNLP {
  tablaDestino: string; // 'materiaPrima', 'proveedor', 'animal', 'compra', 'formula', 'fabricacion'
  datos: Record<string, any>; // Datos extraídos del mensaje
  confianza?: number; // Nivel de confianza de la extracción (0-1)
}

export interface RespuestaCorina {
  mensaje: string;
  requiereConfirmacion?: boolean;
  datosParaConfirmar?: DatosExtraidosNLP;
  accionesDisponibles?: string[]; // ['confirmar', 'modificar', 'cancelar']
}






