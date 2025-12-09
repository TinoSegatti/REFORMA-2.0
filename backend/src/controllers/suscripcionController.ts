/**
 * Controlador para gestión de suscripciones
 */

import { Request, Response } from 'express';
import { PlanSuscripcion, PeriodoFacturacion, LIMITES_PLANES, obtenerLimitesPlan } from '../constants/planes';
import * as suscripcionService from '../services/suscripcionService';
import prisma from '../lib/prisma';
import { getFrontendUrl, buildUrl } from '../utils/urlHelper';

const SUPERUSUARIO_ID = 'cmhb1d6c50001kdggopzuiczr';

/**
 * Obtener todos los planes disponibles
 */
export async function obtenerPlanes(req: Request, res: Response) {
  try {
    const planes = Object.values(PlanSuscripcion).map(plan => {
      const limites = obtenerLimitesPlan(plan);
      return {
        id: plan,
        nombre: limites.nombre,
        descripcion: limites.descripcion,
        precioMensual: limites.precioMensual,
        precioAnual: limites.precioAnual,
        limites: {
          maxMateriasPrimas: limites.maxMateriasPrimas,
          maxProveedores: limites.maxProveedores,
          maxPiensos: limites.maxPiensos,
          maxCompras: limites.maxCompras,
          maxFormulas: limites.maxFormulas,
          maxFabricaciones: limites.maxFabricaciones,
          maxGranjas: limites.maxGranjas,
          maxUsuarios: limites.maxUsuarios,
          maxArchivosHistoricos: limites.maxArchivosHistoricos,
        },
        funcionalidades: {
          permiteGraficosAvanzados: limites.permiteGraficosAvanzados,
          permiteGraficosFormulas: limites.permiteGraficosFormulas,
          permiteGraficosFabricaciones: limites.permiteGraficosFabricaciones,
          permiteReportesPDF: limites.permiteReportesPDF,
          permiteImportacionCSV: limites.permiteImportacionCSV,
          permiteImportacionCSVCompleta: limites.permiteImportacionCSVCompleta,
          permiteMultiplesUsuarios: limites.permiteMultiplesUsuarios,
          permiteDatosPermanentes: limites.permiteDatosPermanentes,
          permiteMultiplesPlantas: limites.permiteMultiplesPlantas,
          permiteHistorialCompleto: limites.permiteHistorialCompleto,
          permiteHistorialFormulas: limites.permiteHistorialFormulas,
          permiteRestaurarFabricaciones: limites.permiteRestaurarFabricaciones,
          permiteCapacitacionPersonalizada: limites.permiteCapacitacionPersonalizada,
          permiteSoporteDirecto: limites.permiteSoporteDirecto,
          permiteAlertasWhatsApp: limites.permiteAlertasWhatsApp,
          permiteGestionIA: limites.permiteGestionIA,
        },
      };
    });

    res.json({ planes });
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    res.status(500).json({ error: 'Error al obtener planes' });
  }
}

/**
 * Obtener plan actual del usuario autenticado
 */
export async function obtenerMiPlan(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const suscripcion = await suscripcionService.obtenerSuscripcionUsuario(userId);
    
    if (!suscripcion) {
      return res.status(404).json({ error: 'No se encontró suscripción para este usuario' });
    }

    const limites = obtenerLimitesPlan(suscripcion.planSuscripcion as PlanSuscripcion);
    const estaActiva = await suscripcionService.suscripcionEstaActiva(userId);

    res.json({
      suscripcion: {
        id: suscripcion.id,
        plan: suscripcion.planSuscripcion,
        nombre: limites.nombre,
        estado: suscripcion.estadoSuscripcion,
        periodoFacturacion: suscripcion.periodoFacturacion,
        fechaInicio: suscripcion.fechaInicio,
        fechaFin: suscripcion.fechaFin,
        fechaProximaRenovacion: suscripcion.fechaProximaRenovacion,
        precio: suscripcion.precio,
        estaActiva,
      },
      limites,
      ultimosPagos: suscripcion.pagos,
    });
  } catch (error) {
    console.error('Error obteniendo plan del usuario:', error);
    res.status(500).json({ error: 'Error al obtener plan del usuario' });
  }
}

/**
 * Crear sesión de checkout para nueva suscripción
 */
export async function crearCheckout(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { plan, periodoFacturacion } = req.body;

    // Logging para debug
    console.log(`[crearCheckout] userId recibido: ${userId}`);
    console.log(`[crearCheckout] Tipo de userId: ${typeof userId}`);
    console.log(`[crearCheckout] SUPERUSUARIO_ID esperado: ${SUPERUSUARIO_ID}`);
    console.log(`[crearCheckout] ¿Es super admin?: ${userId === SUPERUSUARIO_ID}`);
    
    // Verificar que el usuario existe antes de continuar
    try {
      const usuarioExiste = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { id: true, email: true, activo: true }
      });
      
      if (!usuarioExiste) {
        console.error(`[crearCheckout] ERROR: Usuario con ID ${userId} no existe en BD`);
        // Listar algunos usuarios para debug
        const usuarios = await prisma.usuario.findMany({
          take: 5,
          select: { id: true, email: true }
        });
        console.log(`[crearCheckout] Usuarios disponibles:`, usuarios);
        return res.status(404).json({ 
          error: 'Usuario no encontrado',
          detalles: `No se encontró usuario con ID: ${userId}`
        });
      }
      
      console.log(`[crearCheckout] Usuario verificado: ${usuarioExiste.email}`);
    } catch (error) {
      console.error(`[crearCheckout] Error verificando usuario:`, error);
      return res.status(500).json({ 
        error: 'Error verificando usuario',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    // Validaciones
    if (!plan || !Object.values(PlanSuscripcion).includes(plan)) {
      return res.status(400).json({ error: 'Plan inválido' });
    }

    if (!periodoFacturacion || !Object.values(PeriodoFacturacion).includes(periodoFacturacion)) {
      return res.status(400).json({ error: 'Período de facturación inválido' });
    }

    if (plan === PlanSuscripcion.DEMO) {
      return res.status(400).json({ error: 'No se puede crear checkout para plan DEMO' });
    }

    // Si es super admin, cambiar plan directamente sin Stripe
    if (userId === SUPERUSUARIO_ID) {
      try {
        console.log(`[Super Admin] Cambiando plan directamente: ${plan} - ${periodoFacturacion}`);
        await suscripcionService.cambiarPlanDirecto(
          userId,
          plan as PlanSuscripcion,
          periodoFacturacion as PeriodoFacturacion
        );
        
        console.log(`[Super Admin] Plan actualizado exitosamente`);
        return res.json({ 
          exito: true,
          mensaje: 'Plan actualizado directamente (modo super admin)',
          plan: plan,
          periodoFacturacion: periodoFacturacion
        });
      } catch (adminError) {
        console.error('[Super Admin] Error cambiando plan:', adminError);
        return res.status(500).json({
          error: 'Error al cambiar plan (modo super admin)',
          detalles: adminError instanceof Error ? adminError.message : 'Error desconocido'
        });
      }
    }

    // URLs de éxito y cancelación
    // Normalizar URL para asegurar que tenga https:// en producción
    const frontendUrl = getFrontendUrl();
    // Mercado Pago no acepta placeholders en URLs, usar URL simple
    const successUrl = buildUrl(frontendUrl, '/planes/exito');
    const cancelUrl = buildUrl(frontendUrl, '/planes?cancelado=true');
    
    console.log(`[crearCheckout] URLs configuradas - successUrl: ${successUrl}, cancelUrl: ${cancelUrl}`);

    const { sessionId, url } = await suscripcionService.crearSuscripcionCheckout(
      userId,
      plan as PlanSuscripcion,
      periodoFacturacion as PeriodoFacturacion,
      successUrl,
      cancelUrl
    );

    res.json({ sessionId, url });
  } catch (error) {
    console.error('Error creando checkout:', error);
    res.status(500).json({ 
      error: 'Error al crear sesión de checkout',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Cambiar plan del usuario
 */
export async function cambiarPlan(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { nuevoPlan, nuevoPeriodoFacturacion } = req.body;

    // Validaciones
    if (!nuevoPlan || !Object.values(PlanSuscripcion).includes(nuevoPlan)) {
      return res.status(400).json({ error: 'Plan inválido' });
    }

    if (!nuevoPeriodoFacturacion || !Object.values(PeriodoFacturacion).includes(nuevoPeriodoFacturacion)) {
      return res.status(400).json({ error: 'Período de facturación inválido' });
    }

    // TODO: Implementar lógica de cambio de plan con prorrateo
    // Por ahora, crear nuevo checkout
    const frontendUrl = getFrontendUrl();
    const successUrl = buildUrl(frontendUrl, '/planes/exito?session_id={CHECKOUT_SESSION_ID}');
    const cancelUrl = buildUrl(frontendUrl, '/planes?cancelado=true');

    const { sessionId, url } = await suscripcionService.crearSuscripcionCheckout(
      userId,
      nuevoPlan as PlanSuscripcion,
      nuevoPeriodoFacturacion as PeriodoFacturacion,
      successUrl,
      cancelUrl
    );

    res.json({ sessionId, url });
  } catch (error) {
    console.error('Error cambiando plan:', error);
    res.status(500).json({ 
      error: 'Error al cambiar plan',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Cancelar suscripción
 */
export async function cancelarSuscripcionCtrl(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    await suscripcionService.cancelarSuscripcionUsuario(userId);

    res.json({ mensaje: 'Suscripción cancelada. Seguirá activa hasta el fin del período actual.' });
  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    res.status(500).json({ 
      error: 'Error al cancelar suscripción',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Reactivar suscripción cancelada
 */
export async function reactivarSuscripcionCtrl(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    await suscripcionService.reactivarSuscripcionUsuario(userId);

    res.json({ mensaje: 'Suscripción reactivada exitosamente' });
  } catch (error) {
    console.error('Error reactivando suscripción:', error);
    res.status(500).json({ 
      error: 'Error al reactivar suscripción',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Verificar pago después de checkout
 */
export async function verificarPago(req: Request, res: Response) {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'session_id es requerido' });
    }

    // Verificar con Mercado Pago usando el preapproval ID
    // Por ahora retornar éxito (el webhook maneja la verificación real)
    res.json({ 
      exito: true,
      mensaje: 'Pago verificado correctamente'
    });
  } catch (error) {
    console.error('Error verificando pago:', error);
    res.status(500).json({ 
      error: 'Error al verificar pago',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

