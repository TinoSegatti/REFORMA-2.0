/**
 * Controlador para webhooks de Mercado Pago
 * Maneja eventos de pago, suscripciones y renovaciones
 */

import { Request, Response } from 'express';
import { verificarWebhookSignature, obtenerSuscripcion } from '../services/mercadoPagoService';
import * as suscripcionService from '../services/suscripcionService';
import { PlanSuscripcion, PeriodoFacturacion } from '../constants/planes';
import prisma from '../lib/prisma';

/**
 * Maneja webhooks de Mercado Pago
 */
export async function manejarWebhookMercadoPago(req: Request, res: Response) {
  const signature = req.headers['x-signature'] as string;
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('MERCADOPAGO_WEBHOOK_SECRET no está configurado');
    return res.status(500).json({ error: 'Configuración de webhook incorrecta' });
  }

  try {
    // Verificar la firma del webhook
    const isValid = verificarWebhookSignature(req.body, signature, webhookSecret);
    
    if (!isValid) {
      console.error('Firma de webhook inválida');
      return res.status(400).json({ error: 'Firma de webhook inválida' });
    }

    const data = req.body;
    const type = data.type;

    // Manejar diferentes tipos de eventos
    switch (type) {
      case 'payment':
        await manejarPago(data.data);
        break;

      case 'subscription_preapproval':
        await manejarPreapproval(data.data);
        break;

      default:
        console.log(`Evento no manejado: ${type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ 
      error: 'Error procesando webhook',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Maneja eventos de pago
 */
async function manejarPago(paymentData: any) {
  console.log('[Webhook MP] Pago recibido:', paymentData.id);

  const preapprovalId = paymentData.preapproval_id;
  if (!preapprovalId) {
    return; // No es un pago de suscripción
  }

  try {
    const suscripcion = await prisma.suscripcion.findUnique({
      where: { mercadoPagoPreapprovalId: preapprovalId },
    });

    if (!suscripcion) {
      console.error('Suscripción no encontrada para preapproval:', preapprovalId);
      return;
    }

    // Crear registro de pago
    await prisma.pago.create({
      data: {
        idSuscripcion: suscripcion.id,
        metodoPago: 'MERCADOPAGO',
        monto: paymentData.transaction_amount || suscripcion.precio,
        moneda: paymentData.currency_id?.toUpperCase() || 'USD',
        estadoPago: paymentData.status === 'approved' ? 'COMPLETADO' : 
                    paymentData.status === 'rejected' ? 'FALLIDO' : 'PENDIENTE',
        mercadoPagoPaymentId: paymentData.id?.toString(),
        mercadoPagoPreapprovalId: preapprovalId,
        fechaPago: paymentData.date_approved ? new Date(paymentData.date_approved) : new Date(),
      },
    });

    // Actualizar estado de suscripción
    if (paymentData.status === 'approved') {
      await prisma.suscripcion.update({
        where: { id: suscripcion.id },
        data: {
          estadoSuscripcion: 'ACTIVA',
        },
      });
    } else if (paymentData.status === 'rejected') {
      await prisma.suscripcion.update({
        where: { id: suscripcion.id },
        data: {
          estadoSuscripcion: 'PENDIENTE_PAGO',
        },
      });
    }
  } catch (error) {
    console.error('Error procesando pago:', error);
    throw error;
  }
}

/**
 * Maneja eventos de preapproval (suscripción)
 */
async function manejarPreapproval(preapprovalData: any) {
  console.log('[Webhook MP] Preapproval actualizado:', preapprovalData.id);

  const preapprovalId = preapprovalData.id?.toString();
  if (!preapprovalId) {
    return;
  }

  try {
    const suscripcion = await prisma.suscripcion.findUnique({
      where: { mercadoPagoPreapprovalId: preapprovalId },
    });

    const userId = preapprovalData.external_reference;
    const status = preapprovalData.status;

    // Si no existe suscripción pero tenemos userId y está autorizada, crear suscripción
    if (!suscripcion && userId && status === 'authorized') {
      // Obtener información del auto_recurring para determinar plan y período
      const autoRecurring = preapprovalData.auto_recurring;
      if (!autoRecurring) {
        console.error('No se encontró auto_recurring en preapproval');
        return;
      }

      // Determinar plan y período desde el monto y frecuencia
      const monto = autoRecurring.transaction_amount;
      const frecuencia = autoRecurring.frequency;
      const frecuenciaTipo = autoRecurring.frequency_type;

      // Mapear monto a plan
      let plan: PlanSuscripcion = PlanSuscripcion.STARTER;
      let periodo: PeriodoFacturacion = frecuenciaTipo === 'months' && frecuencia === 12 
        ? PeriodoFacturacion.ANUAL 
        : PeriodoFacturacion.MENSUAL;

      // Determinar plan por monto
      if (monto >= 229) {
        plan = PlanSuscripcion.ENTERPRISE;
      } else if (monto >= 99) {
        plan = PlanSuscripcion.BUSINESS;
      } else if (monto >= 35) {
        plan = PlanSuscripcion.STARTER;
      }

      // Procesar pago exitoso para crear suscripción
      await suscripcionService.procesarPagoExitoso(
        userId,
        plan,
        periodo,
        preapprovalData.payer_email || '',
        preapprovalId,
        null, // No hay priceId en Mercado Pago
        monto,
        'MERCADOPAGO'
      );

      // Obtener suscripción recién creada
      suscripcion = await prisma.suscripcion.findUnique({
        where: { mercadoPagoPreapprovalId: preapprovalId },
      });
    }

    if (!suscripcion) {
      return;
    }

    // Actualizar estado según el status del preapproval
    let estadoSuscripcion = suscripcion.estadoSuscripcion;
    
    switch (preapprovalData.status) {
      case 'authorized':
        estadoSuscripcion = 'ACTIVA';
        break;
      case 'cancelled':
        estadoSuscripcion = 'CANCELADA';
        // Degradar usuario a plan DEMO
        await prisma.usuario.update({
          where: { id: suscripcion.idUsuario },
          data: {
            planSuscripcion: PlanSuscripcion.DEMO,
          },
        });
        break;
      case 'pending':
        estadoSuscripcion = 'PENDIENTE_PAGO';
        break;
    }

    await prisma.suscripcion.update({
      where: { id: suscripcion.id },
      data: {
        estadoSuscripcion,
      },
    });
  } catch (error) {
    console.error('Error procesando preapproval:', error);
    throw error;
  }
}

