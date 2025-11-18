/**
 * Servicio de lógica de negocio para suscripciones
 * Maneja la creación, actualización y gestión de suscripciones
 */

import { PrismaClient } from '@prisma/client';
import { PlanSuscripcion, PeriodoFacturacion, obtenerPrecioPlan } from '../constants/planes';
import { crearPreapprovalMercadoPago as crearSuscripcionMercadoPago, cancelarSuscripcion, reactivarSuscripcion } from './mercadoPagoService';
import prisma from '../lib/prisma';

/**
 * Crea una suscripción DEMO para un nuevo usuario
 */
export async function crearSuscripcionDemo(usuarioId: string): Promise<void> {
  const fechaFin = new Date();
  fechaFin.setDate(fechaFin.getDate() + 30); // 30 días desde hoy

  await prisma.suscripcion.create({
    data: {
      idUsuario: usuarioId,
      planSuscripcion: PlanSuscripcion.DEMO,
      estadoSuscripcion: 'ACTIVA',
      periodoFacturacion: PeriodoFacturacion.MENSUAL,
      fechaInicio: new Date(),
      fechaFin,
      precio: 0,
      moneda: 'USD',
    },
  });
}

/**
 * Crea una sesión de checkout para una nueva suscripción
 */
export async function crearSuscripcionCheckout(
  usuarioId: string,
  plan: PlanSuscripcion,
  periodo: PeriodoFacturacion,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  // Validar que no sea plan DEMO
  if (plan === PlanSuscripcion.DEMO) {
    throw new Error('No se puede crear checkout para plan DEMO');
  }

  // Validar que usuarioId no sea un email (prevención)
  if (usuarioId.includes('@')) {
    console.error(`[crearSuscripcionCheckout] ERROR: Se recibió un email como usuarioId: ${usuarioId}`);
    throw new Error('Error interno: se recibió un email en lugar de un ID de usuario');
  }

  // Obtener usuario
  console.log(`[crearSuscripcionCheckout] Buscando usuario con ID: ${usuarioId}`);
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
  });

  if (!usuario) {
    console.error(`[crearSuscripcionCheckout] Usuario no encontrado con ID: ${usuarioId}`);
    // Intentar buscar por email como fallback (para debug)
    const usuarios = await prisma.usuario.findMany({
      take: 5,
      select: { id: true, email: true, nombreUsuario: true }
    });
    console.log(`[crearSuscripcionCheckout] Usuarios disponibles en BD:`, usuarios);
    throw new Error(`Usuario no encontrado con ID: ${usuarioId}`);
  }
  
  console.log(`[crearSuscripcionCheckout] Usuario encontrado: ${usuario.email} (ID: ${usuario.id})`);

  // Crear checkout con Mercado Pago
  console.log(`[crearSuscripcionCheckout] Llamando a mercadoPagoService.crearPreapprovalMercadoPago con userId: ${usuarioId}`);
  try {
    const session = await crearSuscripcionMercadoPago(
      usuario.email,
      usuario.nombreUsuario,
      usuario.apellidoUsuario,
      plan,
      periodo,
      usuarioId, // Asegurar que se pasa el ID, no el email
      successUrl,
      cancelUrl
    );
    
    console.log(`[crearSuscripcionCheckout] Checkout creado exitosamente, sessionId: ${session.sessionId}`);
    return session;
  } catch (error) {
    console.error(`[crearSuscripcionCheckout] Error llamando a Mercado Pago:`, error);
    throw error; // Re-lanzar el error para que se maneje arriba
  }
}

/**
 * Procesa el pago exitoso y crea/actualiza la suscripción
 */
export async function procesarPagoExitoso(
  usuarioId: string,
  plan: PlanSuscripcion,
  periodo: PeriodoFacturacion,
  customerId: string, // Email para Mercado Pago
  subscriptionId: string, // mercadoPagoPreapprovalId
  priceId: string | null, // No usado en Mercado Pago
  monto: number,
  procesadorPago: 'MERCADOPAGO' = 'MERCADOPAGO'
): Promise<void> {
  const precio = obtenerPrecioPlan(plan, periodo);
  const fechaInicio = new Date();
  const fechaFin = new Date();

  // Calcular fecha de fin según período
  if (periodo === PeriodoFacturacion.ANUAL) {
    fechaFin.setFullYear(fechaFin.getFullYear() + 1);
  } else {
    fechaFin.setMonth(fechaFin.getMonth() + 1);
  }

  // Verificar si ya existe una suscripción
  const suscripcionExistente = await prisma.suscripcion.findUnique({
    where: { idUsuario: usuarioId },
  });

  // Preparar datos según procesador de pago
  const datosSuscripcion: any = {
    planSuscripcion: plan,
    estadoSuscripcion: 'ACTIVA',
    periodoFacturacion: periodo,
    fechaInicio,
    fechaFin,
    fechaProximaRenovacion: fechaFin,
    precio,
  };

  // Agregar IDs de Mercado Pago
  datosSuscripcion.mercadoPagoPreapprovalId = subscriptionId;

  if (suscripcionExistente) {
    // Actualizar suscripción existente
    await prisma.suscripcion.update({
      where: { id: suscripcionExistente.id },
      data: datosSuscripcion,
    });
  } else {
    // Crear nueva suscripción
    await prisma.suscripcion.create({
      data: {
        idUsuario: usuarioId,
        ...datosSuscripcion,
      },
    });
  }

  // Actualizar plan del usuario
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      planSuscripcion: plan,
    },
  });

  // Crear registro de pago
  const suscripcion = await prisma.suscripcion.findUnique({
    where: { idUsuario: usuarioId },
  });

  if (suscripcion) {
    const datosPago: any = {
      idSuscripcion: suscripcion.id,
      metodoPago: 'MERCADOPAGO',
      monto: precio,
      moneda: 'USD',
      estadoPago: 'COMPLETADO',
      fechaPago: new Date(),
      mercadoPagoPreapprovalId: subscriptionId,
    };

    await prisma.pago.create({
      data: datosPago,
    });
  }
}

/**
 * Cancela una suscripción
 */
export async function cancelarSuscripcionUsuario(usuarioId: string): Promise<void> {
  const suscripcion = await prisma.suscripcion.findUnique({
    where: { idUsuario: usuarioId },
  });

  if (!suscripcion) {
    throw new Error('Suscripción no encontrada');
  }

  if (suscripcion.mercadoPagoPreapprovalId) {
    // Cancelar en Mercado Pago
    await cancelarSuscripcion(suscripcion.mercadoPagoPreapprovalId);
  }

  // Actualizar estado en BD
  await prisma.suscripcion.update({
    where: { id: suscripcion.id },
    data: {
      estadoSuscripcion: 'CANCELADA',
    },
  });
}

/**
 * Reactiva una suscripción cancelada
 */
export async function reactivarSuscripcionUsuario(usuarioId: string): Promise<void> {
  const suscripcion = await prisma.suscripcion.findUnique({
    where: { idUsuario: usuarioId },
  });

  if (!suscripcion) {
    throw new Error('Suscripción no encontrada');
  }

  if (suscripcion.mercadoPagoPreapprovalId) {
    // Reactivar en Mercado Pago
    await reactivarSuscripcion(suscripcion.mercadoPagoPreapprovalId);
  }

  // Actualizar estado en BD
  await prisma.suscripcion.update({
    where: { id: suscripcion.id },
    data: {
      estadoSuscripcion: 'ACTIVA',
    },
  });
}

/**
 * Obtiene la suscripción de un usuario
 */
export async function obtenerSuscripcionUsuario(usuarioId: string) {
  return await prisma.suscripcion.findUnique({
    where: { idUsuario: usuarioId },
    include: {
      pagos: {
        orderBy: {
          fechaCreacion: 'desc',
        },
        take: 10, // Últimos 10 pagos
      },
    },
  });
}

/**
 * Verifica si una suscripción está activa
 */
export async function suscripcionEstaActiva(usuarioId: string): Promise<boolean> {
  const suscripcion = await prisma.suscripcion.findUnique({
    where: { idUsuario: usuarioId },
  });

  if (!suscripcion) {
    return false;
  }

  const ahora = new Date();
  return (
    suscripcion.estadoSuscripcion === 'ACTIVA' &&
    suscripcion.fechaFin > ahora
  );
}

/**
 * Cambia el plan de un usuario directamente sin pasar por Stripe
 * Útil para super admin o testing
 */
export async function cambiarPlanDirecto(
  usuarioId: string,
  nuevoPlan: PlanSuscripcion,
  nuevoPeriodo: PeriodoFacturacion
): Promise<void> {
  const precio = obtenerPrecioPlan(nuevoPlan, nuevoPeriodo);
  const fechaInicio = new Date();
  const fechaFin = new Date();

  // Calcular fecha de fin según período
  if (nuevoPeriodo === PeriodoFacturacion.ANUAL) {
    fechaFin.setFullYear(fechaFin.getFullYear() + 1);
  } else {
    fechaFin.setMonth(fechaFin.getMonth() + 1);
  }

  // Verificar si ya existe una suscripción
  const suscripcionExistente = await prisma.suscripcion.findUnique({
    where: { idUsuario: usuarioId },
  });

  if (suscripcionExistente) {
    // Actualizar suscripción existente
    await prisma.suscripcion.update({
      where: { id: suscripcionExistente.id },
      data: {
        planSuscripcion: nuevoPlan,
        estadoSuscripcion: 'ACTIVA',
        periodoFacturacion: nuevoPeriodo,
        fechaInicio,
        fechaFin,
        fechaProximaRenovacion: fechaFin,
        precio,
      },
    });
  } else {
    // Crear nueva suscripción
    await prisma.suscripcion.create({
      data: {
        idUsuario: usuarioId,
        planSuscripcion: nuevoPlan,
        estadoSuscripcion: 'ACTIVA',
        periodoFacturacion: nuevoPeriodo,
        fechaInicio,
        fechaFin,
        fechaProximaRenovacion: fechaFin,
        precio,
        moneda: 'USD',
      },
    });
  }

  // Actualizar plan del usuario
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      planSuscripcion: nuevoPlan,
    },
  });

  // Crear registro de pago (marcado como ADMIN para testing)
  const suscripcion = await prisma.suscripcion.findUnique({
    where: { idUsuario: usuarioId },
  });

  if (suscripcion) {
    try {
      await prisma.pago.create({
        data: {
          idSuscripcion: suscripcion.id,
          metodoPago: 'ADMIN' as any, // Método especial para cambios administrativos
          monto: precio,
          moneda: 'USD',
          estadoPago: 'COMPLETADO',
          fechaPago: new Date(),
        },
      });
    } catch (error) {
      // Si falla por el enum ADMIN, usar TRANSFERENCIA como fallback
      console.warn('No se pudo crear pago con método ADMIN, usando TRANSFERENCIA:', error);
      try {
        await prisma.pago.create({
          data: {
            idSuscripcion: suscripcion.id,
            metodoPago: 'TRANSFERENCIA',
            monto: precio,
            moneda: 'USD',
            estadoPago: 'COMPLETADO',
            fechaPago: new Date(),
          },
        });
      } catch (fallbackError) {
        console.error('Error creando registro de pago:', fallbackError);
        // No lanzamos error, el cambio de plan ya se hizo
      }
    }
  }
}

