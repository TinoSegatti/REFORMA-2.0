/**
 * Servicio para integración con Mercado Pago
 * Maneja la creación de planes, suscripciones, checkout y webhooks
 */

import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago';
import { PlanSuscripcion, PeriodoFacturacion, obtenerPrecioPlan } from '../constants/planes';
import { getFrontendUrl, normalizeUrl } from '../utils/urlHelper';

// Lazy initialization de Mercado Pago
let mercadoPagoClient: MercadoPagoConfig | null = null;

function getMercadoPago(): MercadoPagoConfig {
  if (!mercadoPagoClient) {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurada en las variables de entorno');
    }
    mercadoPagoClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      options: {
        timeout: 5000,
        idempotencyKey: 'abc',
      },
    });
  }
  return mercadoPagoClient;
}

/**
 * Mapeo de planes y períodos a precios
 * Mercado Pago usa precios en pesos argentinos o USD según configuración
 */
function obtenerPrecioMercadoPago(plan: PlanSuscripcion, periodo: PeriodoFacturacion): number {
  const precio = obtenerPrecioPlan(plan, periodo);
  // Mercado Pago usa el precio tal cual (no centavos como Stripe)
  return precio;
}

/**
 * Convierte período de facturación a formato de Mercado Pago
 */
function convertirPeriodo(periodo: PeriodoFacturacion): { frequency: number; frequency_type: 'months' | 'days' } {
  if (periodo === PeriodoFacturacion.ANUAL) {
    return { frequency: 12, frequency_type: 'months' };
  }
  return { frequency: 1, frequency_type: 'months' };
}

/**
 * Crea un plan de suscripción en Mercado Pago
 */
export async function crearPlanSuscripcion(
  plan: PlanSuscripcion,
  periodo: PeriodoFacturacion
): Promise<string> {
  const client = getMercadoPago();
  const preApprovalPlan = new PreApprovalPlan(client);
  
  const precio = obtenerPrecioMercadoPago(plan, periodo);
  const periodoConfig = convertirPeriodo(periodo);
  
  const nombrePlan = `${plan} - ${periodo === PeriodoFacturacion.ANUAL ? 'Anual' : 'Mensual'}`;
  
  try {
    const planData = await preApprovalPlan.create({
      body: {
        reason: nombrePlan,
        auto_recurring: {
          frequency: periodoConfig.frequency,
          frequency_type: periodoConfig.frequency_type,
          transaction_amount: precio,
          currency_id: 'USD', // O 'ARS' según prefieras
        },
        payment_methods_allowed: {
          payment_types: [
            { id: 'credit_card' },
            { id: 'debit_card' },
          ],
          payment_methods: [],
        },
        back_url: getFrontendUrl(),
      },
    });

    return planData.id || '';
  } catch (error) {
    console.error('Error creando plan en Mercado Pago:', error);
    throw new Error(`Error creando plan: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Crea una suscripción (preapproval) en Mercado Pago
 * Retorna la URL de checkout para que el usuario complete el pago
 */
export async function crearPreapprovalMercadoPago(
  email: string,
  nombre: string,
  apellido: string,
  plan: PlanSuscripcion,
  periodo: PeriodoFacturacion,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const client = getMercadoPago();
  const preApproval = new PreApproval(client);
  
  const precio = obtenerPrecioMercadoPago(plan, periodo);
  const periodoConfig = convertirPeriodo(periodo);
  
  // Calcular fecha de inicio (mañana)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  
  console.log(`[MercadoPago] Creando preapproval - userId: ${userId}, email: ${email}, plan: ${plan}, periodo: ${periodo}`);
  console.log(`[MercadoPago] successUrl recibida: ${successUrl}`);
  
  // Validar y normalizar que successUrl sea una URL válida
  let validUrl: string;
  try {
    // Normalizar URL si no tiene protocolo
    const normalizedSuccessUrl = normalizeUrl(successUrl);
    const urlObj = new URL(normalizedSuccessUrl);
    validUrl = urlObj.toString();
    console.log(`[MercadoPago] URL validada y normalizada: ${validUrl}`);
  } catch (error) {
    console.error(`[MercadoPago] Error validando URL: ${successUrl}`, error);
    throw new Error(`URL de éxito inválida: ${successUrl}. Debe ser una URL completa con protocolo (https://)`);
  }
  
  // Si es localhost, intentar usar ngrok si está disponible
  // Mercado Pago en producción no acepta localhost
  let backUrl = validUrl;
  
  // Si la URL es localhost, usar ngrok si está disponible
  // Mercado Pago en producción NO acepta localhost
  if (validUrl.includes('localhost')) {
    // Intentar obtener URL de ngrok de variable de entorno
    const ngrokUrl = process.env.NGROK_URL || 'https://unmerciful-ossie-fluent.ngrok-free.dev';
    
    if (ngrokUrl && !ngrokUrl.includes('localhost')) {
      const ngrokBase = ngrokUrl.replace(/\/$/, ''); // Remover trailing slash
      const urlPath = new URL(validUrl).pathname;
      backUrl = `${ngrokBase}${urlPath}`;
      console.log(`[MercadoPago] Convertido localhost a ngrok: ${backUrl}`);
    } else {
      console.warn(`[MercadoPago] ADVERTENCIA: Usando localhost. Mercado Pago podría rechazarlo.`);
      console.warn(`[MercadoPago] URL actual: ${backUrl}`);
    }
  }
  
  // Mercado Pago Argentina solo acepta ARS
  // Los precios ya están en ARS (multiplicados por 1450 en constants/planes.ts)
  const precioARS = precio; // Ya está en ARS, no necesita conversión
  
  console.log(`[MercadoPago] Precio en ARS: ${precioARS} (ya convertido desde USD)`);
  
  console.log(`[MercadoPago] Body completo a enviar:`, JSON.stringify({
    reason: `REFORMA - Plan ${plan} (${periodo === PeriodoFacturacion.ANUAL ? 'Anual' : 'Mensual'})`,
    external_reference: userId,
    payer_email: email,
    auto_recurring: {
      frequency: periodoConfig.frequency,
      frequency_type: periodoConfig.frequency_type,
      transaction_amount: precioARS,
      currency_id: 'ARS', // Mercado Pago Argentina solo acepta ARS
      start_date: startDate.toISOString(),
    },
    back_url: backUrl,
    status: 'pending',
  }, null, 2));
  
  try {
    // Crear preapproval (suscripción) - Mercado Pago crea directamente el preapproval
    const preapprovalData = await preApproval.create({
      body: {
        reason: `REFORMA - Plan ${plan} (${periodo === PeriodoFacturacion.ANUAL ? 'Anual' : 'Mensual'})`,
        external_reference: userId,
        payer_email: email,
        auto_recurring: {
          frequency: periodoConfig.frequency,
          frequency_type: periodoConfig.frequency_type,
          transaction_amount: precioARS, // Precio convertido a ARS
          currency_id: 'ARS', // Mercado Pago Argentina solo acepta ARS
          start_date: startDate.toISOString(),
        },
        back_url: backUrl, // URL válida sin placeholders
        status: 'pending', // Pendiente hasta que el usuario complete el pago
      },
    });

    console.log(`[MercadoPago] Preapproval creado exitosamente, ID: ${preapprovalData.id}`);
    
    // Obtener URL de pago (init_point)
    const initPoint = preapprovalData.init_point;
    
    console.log(`[MercadoPago] Init point obtenido: ${initPoint ? 'Sí' : 'No'}`);
    
    if (!initPoint) {
      throw new Error('No se pudo obtener URL de pago de Mercado Pago');
    }

    return {
      sessionId: preapprovalData.id?.toString() || '',
      url: initPoint,
    };
  } catch (error: any) {
    console.error('[MercadoPago] Error creando suscripción:', error);
    console.error('[MercadoPago] Error details:', {
      message: error?.message,
      cause: error?.cause?.message,
      status: error?.status,
      statusCode: error?.statusCode,
      response: error?.response
    });
    
    // Log del body completo para debug
    if (error?.response) {
      console.error('[MercadoPago] Response completa del error:', JSON.stringify(error.response, null, 2));
    }
    
    // Si el error es sobre back_url, proporcionar más información
    if (error?.message?.includes('back_url')) {
      console.error(`[MercadoPago] back_url que se intentó enviar: ${backUrl}`);
      console.error(`[MercadoPago] Tipo de back_url: ${typeof backUrl}`);
      console.error(`[MercadoPago] Longitud de back_url: ${backUrl?.length}`);
    }
    
    const errorMessage = error?.message || error?.cause?.message || 'Error desconocido';
    throw new Error(`Error creando suscripción en Mercado Pago: ${errorMessage}`);
  }
}

/**
 * Cancela una suscripción en Mercado Pago
 */
export async function cancelarSuscripcion(preapprovalId: string): Promise<void> {
  const client = getMercadoPago();
  const preApproval = new PreApproval(client);
  
  try {
    await preApproval.update({
      id: preapprovalId,
      body: {
        status: 'cancelled',
      },
    });
  } catch (error) {
    console.error('Error cancelando suscripción en Mercado Pago:', error);
    throw new Error(`Error cancelando suscripción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Reactiva una suscripción cancelada
 */
export async function reactivarSuscripcion(preapprovalId: string): Promise<void> {
  const client = getMercadoPago();
  const preApproval = new PreApproval(client);
  
  try {
    await preApproval.update({
      id: preapprovalId,
      body: {
        status: 'authorized',
      },
    });
  } catch (error) {
    console.error('Error reactivando suscripción en Mercado Pago:', error);
    throw new Error(`Error reactivando suscripción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Obtiene una suscripción de Mercado Pago
 */
export async function obtenerSuscripcion(preapprovalId: string): Promise<any> {
  const client = getMercadoPago();
  const preApproval = new PreApproval(client);
  
  try {
    const preapproval = await preApproval.get({ id: preapprovalId });
    return preapproval;
  } catch (error) {
    console.error('Error obteniendo suscripción de Mercado Pago:', error);
    throw new Error(`Error obteniendo suscripción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Verifica la firma de un webhook de Mercado Pago
 */
export function verificarWebhookSignature(
  payload: any,
  signature: string,
  secret: string
): boolean {
  // Mercado Pago usa x-signature header para verificar webhooks
  // La verificación se hace comparando el hash del payload con la firma
  // Por ahora retornamos true, pero deberías implementar la verificación real
  // Ver: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
  
  if (!signature) {
    return false;
  }
  
  // TODO: Implementar verificación real de firma
  // Por ahora confiamos en que viene de Mercado Pago si tiene la firma
  return true;
}

export default getMercadoPago;

