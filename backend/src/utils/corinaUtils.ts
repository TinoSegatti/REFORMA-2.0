/**
 * Utilidades para CORINA
 */

import crypto from 'crypto';

/**
 * Validar firma de Twilio para asegurar que el webhook viene de Twilio
 * @param signature Firma recibida en header X-Twilio-Signature
 * @param url URL completa del webhook
 * @param params Parámetros del request
 * @param authToken Token de autenticación de Twilio
 * @returns true si la firma es válida
 */
export function validarFirmaTwilio(
  signature: string | null,
  url: string,
  params: URLSearchParams,
  authToken: string
): boolean {
  if (!signature) {
    console.warn('⚠️ No se recibió firma de Twilio');
    return false;
  }

  // Crear string de parámetros ordenado
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}${value}`)
    .join('');

  // Crear string a firmar: URL + parámetros ordenados
  const data = url + sortedParams;

  // Calcular HMAC-SHA1
  const hmac = crypto.createHmac('sha1', authToken);
  hmac.update(data, 'utf-8');
  const expectedSignature = hmac.digest('base64');

  // Comparar firmas
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    console.warn('⚠️ Firma de Twilio inválida');
  }

  return isValid;
}

/**
 * Generar código de verificación de 6 dígitos
 */
export function generarCodigoVerificacion(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validar formato de número de teléfono de WhatsApp
 */
export function validarNumeroWhatsApp(numero: string): boolean {
  // Formato esperado: whatsapp:+5493515930163
  return numero.startsWith('whatsapp:+') && numero.length > 12;
}

/**
 * Extraer número de teléfono del formato de Twilio
 */
export function extraerNumeroTelefono(from: string): string {
  // from viene como: whatsapp:+5493515930163
  // Retornar solo el número: +5493515930163
  return from.replace('whatsapp:', '');
}












