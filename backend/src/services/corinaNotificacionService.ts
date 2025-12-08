/**
 * Servicio de notificaciones de CORINA
 * Maneja el envío de notificaciones por WhatsApp cuando hay alertas de inventario
 */

import { prisma } from '../config/database';
import twilio from 'twilio';
import { obtenerPlanEfectivo } from '../middleware/validateEnterpriseFeature';
import { obtenerComprasGranja } from './compraService';
import { obtenerFormulasGranja } from './formulaService';
import { obtenerFabricacionesGranja } from './fabricacionService';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const twilioClient = accountSid && authToken 
  ? twilio(accountSid, authToken)
  : null;

export class CorinaNotificacionService {
  /**
   * Detectar nueva alerta de inventario y notificar al usuario
   * También marca alertas anteriores como resueltas si la cantidad ahora es > 0
   * Se llama automáticamente cuando se detecta una nueva alerta
   * Solo notifica si:
   * - El usuario tiene plan ENTERPRISE
   * - Las notificaciones están activas
   * - El teléfono está verificado
   * - No se notificó esta alerta recientemente
   */
  static async detectarNuevaAlerta(
    idGranja: string,
    idMateriaPrima: string,
    cantidadReal: number
  ): Promise<void> {
    // Si la cantidad es > 0, verificar si hay alertas pendientes para marcar como resueltas
    if (cantidadReal > 0) {
      await this.marcarAlertasResueltas(idGranja, idMateriaPrima);
      return;
    }
    try {
      // Solo detectar alertas si cantidad <= 0
      if (cantidadReal > 0) {
        return;
      }

      // Obtener información de la granja y usuario dueño
      const granja = await prisma.granja.findUnique({
        where: { id: idGranja },
        include: {
          usuario: {
            select: {
              id: true,
              planSuscripcion: true,
              notificacionesWhatsAppActivas: true,
              telefonoVerificado: true,
              telefono: true,
            },
          },
        },
      });

      if (!granja) {
        return;
      }

      const usuario = granja.usuario;

      // Verificar que el usuario tiene plan ENTERPRISE
      const planEfectivo = await obtenerPlanEfectivo(usuario.id);
      if (planEfectivo !== 'ENTERPRISE') {
        return;
      }

      // Verificar que las notificaciones están activas y teléfono verificado
      if (
        !usuario.notificacionesWhatsAppActivas ||
        !usuario.telefonoVerificado ||
        !usuario.telefono
      ) {
        return;
      }

      // Obtener información de la materia prima
      const materiaPrima = await prisma.materiaPrima.findUnique({
        where: { id: idMateriaPrima },
        select: {
          nombreMateriaPrima: true,
          codigoMateriaPrima: true,
        },
      });

      if (!materiaPrima) {
        return;
      }

      // Obtener inventario para verificar si ya existe una notificación reciente
      const inventario = await prisma.inventario.findUnique({
        where: {
          idGranja_idMateriaPrima: {
            idGranja,
            idMateriaPrima,
          },
        },
      });

      if (!inventario) {
        return;
      }

      // Verificar si ya se notificó esta alerta en las últimas 24 horas
      const notificacionReciente = await prisma.corinaNotificacion.findFirst({
        where: {
          idUsuario: usuario.id,
          idGranja,
          idInventario: inventario.id,
          tipoNotificacion: 'ALERTA_INVENTARIO',
          fechaCreacion: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
          },
        },
      });

      if (notificacionReciente) {
        // Ya se notificó recientemente, no notificar de nuevo
        return;
      }

      // Crear notificación en BD
      const notificacion = await prisma.corinaNotificacion.create({
        data: {
          idUsuario: usuario.id,
          idGranja,
          idInventario: inventario.id,
          tipoNotificacion: 'ALERTA_INVENTARIO',
          estadoNotificacion: 'PENDIENTE',
          titulo: `Alerta de Inventario - ${materiaPrima.nombreMateriaPrima}`,
          mensaje: this.formatearMensajeAlerta(materiaPrima, cantidadReal, granja.nombreGranja),
          cantidadAlerta: cantidadReal,
          datosAdicionales: {
            codigoMateriaPrima: materiaPrima.codigoMateriaPrima,
            nombreMateriaPrima: materiaPrima.nombreMateriaPrima,
            nombreGranja: granja.nombreGranja,
          },
        },
      });

      // Enviar notificación por WhatsApp
      await this.enviarNotificacionWhatsApp(notificacion.id, usuario.telefono);
    } catch (error: any) {
      console.error('Error detectando nueva alerta:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Enviar notificación por WhatsApp usando Twilio
   */
  static async enviarNotificacionWhatsApp(
    idNotificacion: string,
    telefonoDestino: string
  ): Promise<void> {
    if (!twilioClient) {
      console.error('Twilio client no configurado');
      return;
    }

    try {
      const notificacion = await prisma.corinaNotificacion.findUnique({
        where: { id: idNotificacion },
      });

      if (!notificacion || !fromNumber) {
        return;
      }

      // Enviar mensaje por WhatsApp
      // No incluir statusCallback para evitar errores con configuración de Twilio
      const message = await twilioClient.messages.create({
        from: fromNumber,
        to: telefonoDestino,
        body: `🚨 ${notificacion.titulo}\n\n${notificacion.mensaje}`,
      });

      // Actualizar notificación con estado de envío
      await prisma.corinaNotificacion.update({
        where: { id: idNotificacion },
        data: {
          estadoNotificacion: 'ENVIADA',
          fechaEnvio: new Date(),
          twilioMessageSid: message.sid,
        },
      });

      console.log(`✅ Notificación enviada: ${message.sid}`);
    } catch (error: any) {
      console.error('Error enviando notificación WhatsApp:', error);

      // Actualizar notificación con error
      await prisma.corinaNotificacion.update({
        where: { id: idNotificacion },
        data: {
          estadoNotificacion: 'FALLIDA',
          fechaError: new Date(),
          errorMensaje: error.message,
          intentosEnvio: { increment: 1 },
        },
      });
    }
  }

  /**
   * Formatear mensaje de alerta
   */
  static formatearMensajeAlerta(
    materiaPrima: { nombreMateriaPrima: string; codigoMateriaPrima: string },
    cantidadReal: number,
    nombreGranja: string
  ): string {
    const tipoAlerta = cantidadReal < 0 ? 'NEGATIVO' : 'CERO';
    const emoji = cantidadReal < 0 ? '⚠️' : '🔴';

    return `🚨 CORINA\n\n` +
      `${emoji} Alerta de Inventario\n\n` +
      `Granja: ${nombreGranja}\n` +
      `Materia Prima: ${materiaPrima.nombreMateriaPrima} (${materiaPrima.codigoMateriaPrima})\n` +
      `Cantidad Actual: ${cantidadReal.toFixed(2)} kg\n` +
      `Estado: ${tipoAlerta}\n\n` +
      `Por favor, revisa el inventario y realiza las compras necesarias.`;
  }

  /**
   * Enviar listado de alertas cuando el usuario lo solicita
   */
  static async enviarListadoAlertas(
    idUsuario: string,
    idGranja: string
  ): Promise<void> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: idUsuario },
        select: {
          telefono: true,
          telefonoVerificado: true,
          notificacionesWhatsAppActivas: true,
        },
      });

      if (!usuario || !usuario.telefono || !usuario.telefonoVerificado) {
        throw new Error('Usuario no tiene teléfono verificado');
      }

      // Obtener todas las alertas activas (cantidad <= 0)
      const inventarios = await prisma.inventario.findMany({
        where: {
          idGranja,
          cantidadReal: {
            lte: 0,
          },
        },
        include: {
          materiaPrima: {
            select: {
              nombreMateriaPrima: true,
              codigoMateriaPrima: true,
            },
          },
        },
        orderBy: {
          cantidadReal: 'asc',
        },
      });

      if (inventarios.length === 0) {
        // No hay alertas
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          usuario.telefono,
          '✅ CORINA\n\nNo hay alertas de inventario en este momento.\n\nTodas las materias primas tienen stock disponible.'
        );
        return;
      }

      // Obtener nombre de la granja
      const granja = await prisma.granja.findUnique({
        where: { id: idGranja },
        select: { nombreGranja: true },
      });

      // Formatear listado de alertas
      let mensaje = `📋 CORINA\n\n`;
      mensaje += `Listado de Alertas de Inventario\n\n`;
      mensaje += `Granja: ${granja?.nombreGranja || 'N/A'}\n\n`;

      inventarios.forEach((inv, index) => {
        const tipoAlerta = inv.cantidadReal < 0 ? '⚠️ NEGATIVO' : '🔴 CERO';
        mensaje += `${index + 1}. ${inv.materiaPrima.nombreMateriaPrima} (${inv.materiaPrima.codigoMateriaPrima})\n`;
        mensaje += `   Cantidad: ${inv.cantidadReal.toFixed(2)} kg - ${tipoAlerta}\n\n`;
      });

      mensaje += `Total de alertas: ${inventarios.length}`;

      await CorinaNotificacionService.enviarMensajeWhatsApp(usuario.telefono, mensaje);
    } catch (error: any) {
      console.error('Error enviando listado de alertas:', error);
      throw error;
    }
  }

  /**
   * Enviar mensaje genérico por WhatsApp
   */
  static async enviarMensajeWhatsApp(
    telefonoDestino: string,
    mensaje: string
  ): Promise<string | null> {
    if (!twilioClient || !fromNumber) {
      console.error('Twilio client no configurado');
      return null;
    }

    try {
      // Configurar parámetros del mensaje
      // NO incluir statusCallback para evitar errores con configuración de Twilio
      const messageParams: any = {
        from: fromNumber,
        to: telefonoDestino,
        body: mensaje,
        // No incluir statusCallback - Twilio puede tenerlo configurado como "none" en la consola
      };

      const message = await twilioClient.messages.create(messageParams);

      return message.sid;
    } catch (error: any) {
      // Si el error es por StatusCallback, intentar sin él explícitamente
      if (error.code === 21609 && error.message.includes('StatusCallback')) {
        console.warn('⚠️  Error con StatusCallback, intentando sin él...');
        try {
          const message = await twilioClient.messages.create({
            from: fromNumber,
            to: telefonoDestino,
            body: mensaje,
            statusCallback: undefined, // Forzar undefined
          });
          return message.sid;
        } catch (retryError: any) {
          console.error('Error en reintento:', retryError.message);
          throw retryError;
        }
      }
      // Manejar error de límite diario de Twilio Sandbox (50 mensajes/día)
      if (error.code === 63038 || (error.status === 429 && error.message?.includes('daily messages limit'))) {
        console.error('❌ Límite diario de mensajes de Twilio Sandbox alcanzado (50 mensajes/día)');
        console.error('   El límite se resetea cada 24 horas desde el primer mensaje del día');
        console.error('   Para producción, considera actualizar a WhatsApp Business API completo');
        // Lanzar error especial para que el controlador lo maneje apropiadamente
        const limiteError: any = new Error('LIMITE_DIARIO_TWILIO');
        limiteError.code = 63038;
        limiteError.status = 429;
        throw limiteError;
      }
      
      // Manejar errores de autenticación de Twilio
      if (error.code === 20003 || 
          error.status === 401 ||
          error.message?.includes('Authenticate') ||
          error.message?.includes('authentication')) {
        console.error('❌ Error de autenticación de Twilio (código 20003)');
        console.error('   Verifica que TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN estén configuradas correctamente');
        console.error('   Guía: docs/06-GUIAS/TROUBLESHOOTING/SOLUCION_ERRORES_AUTENTICACION_CORINA.md');
        
        const authError: any = new Error('TWILIO_AUTH_ERROR');
        authError.code = 20003;
        authError.status = 401;
        throw authError;
      }
      
      console.error('Error enviando mensaje WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Marcar alertas como resueltas cuando la cantidad vuelve a ser positiva
   */
  static async marcarAlertasResueltas(
    idGranja: string,
    idMateriaPrima: string
  ): Promise<void> {
    try {
      const inventario = await prisma.inventario.findUnique({
        where: {
          idGranja_idMateriaPrima: {
            idGranja,
            idMateriaPrima,
          },
        },
      });

      if (!inventario) {
        return;
      }

      // Buscar alertas pendientes o enviadas para esta materia prima
      const alertasPendientes = await prisma.corinaNotificacion.findMany({
        where: {
          idGranja,
          idInventario: inventario.id,
          tipoNotificacion: 'ALERTA_INVENTARIO',
          estadoNotificacion: {
            in: ['PENDIENTE', 'ENVIADA'],
          },
        },
      });

      // Marcar como resueltas (opcional: enviar notificación de resolución)
      for (const alerta of alertasPendientes) {
        await prisma.corinaNotificacion.update({
          where: { id: alerta.id },
          data: {
            estadoNotificacion: 'ENTREGADA', // Usamos ENTREGADA para indicar resuelta
            datosAdicionales: {
              ...(alerta.datosAdicionales as any),
              resuelta: true,
              fechaResolucion: new Date().toISOString(),
            },
          },
        });
      }
    } catch (error: any) {
      console.error('Error marcando alertas como resueltas:', error);
    }
  }

  /**
   * Verificar si el usuario tiene notificaciones activas
   */
  static async tieneNotificacionesActivas(idUsuario: string): Promise<boolean> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: idUsuario },
      select: {
        notificacionesWhatsAppActivas: true,
        telefonoVerificado: true,
        planSuscripcion: true,
      },
    });

    if (!usuario) {
      return false;
    }

    const planEfectivo = await obtenerPlanEfectivo(idUsuario);

    return (
      planEfectivo === 'ENTERPRISE' &&
      usuario.notificacionesWhatsAppActivas &&
      usuario.telefonoVerificado
    );
  }

  /**
   * Enviar listado de materias primas de una granja
   */
  static async enviarListadoMateriasPrimas(
    idUsuario: string,
    idGranja: string
  ): Promise<void> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: idUsuario },
        select: {
          telefono: true,
          telefonoVerificado: true,
        },
      });

      if (!usuario || !usuario.telefono || !usuario.telefonoVerificado) {
        throw new Error('Usuario no tiene teléfono verificado');
      }

      const materiasPrimas = await prisma.materiaPrima.findMany({
        where: {
          idGranja,
          activa: true,
        },
        orderBy: {
          nombreMateriaPrima: 'asc',
        },
      });

      const granja = await prisma.granja.findUnique({
        where: { id: idGranja },
        select: { nombreGranja: true },
      });

      if (materiasPrimas.length === 0) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          usuario.telefono,
          `📋 CORINA\n\nNo hay materias primas registradas en ${granja?.nombreGranja || 'esta granja'}.`
        );
        return;
      }

      let mensaje = `📋 CORINA\n\nListado de Materias Primas\n\n`;
      mensaje += `Granja: ${granja?.nombreGranja || 'N/A'}\n\n`;

      materiasPrimas.forEach((mp, index) => {
        mensaje += `${index + 1}. ${mp.nombreMateriaPrima} (${mp.codigoMateriaPrima})\n`;
        mensaje += `   Precio: $${mp.precioPorKilo.toFixed(2)}/kg\n\n`;
      });

      mensaje += `Total: ${materiasPrimas.length} materias primas`;

      await CorinaNotificacionService.enviarMensajeWhatsApp(usuario.telefono, mensaje);
    } catch (error: any) {
      console.error('Error enviando listado de materias primas:', error);
      throw error;
    }
  }

  /**
   * Enviar listado de compras de una granja con detalles
   */
  static async enviarListadoCompras(
    idUsuario: string,
    idGranja: string
  ): Promise<void> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: idUsuario },
        select: {
          telefono: true,
          telefonoVerificado: true,
        },
      });

      if (!usuario || !usuario.telefono || !usuario.telefonoVerificado) {
        throw new Error('Usuario no tiene teléfono verificado');
      }

      const compras = await obtenerComprasGranja(idGranja);

      const granja = await prisma.granja.findUnique({
        where: { id: idGranja },
        select: { nombreGranja: true },
      });

      if (compras.length === 0) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          usuario.telefono,
          `📋 CORINA\n\nNo hay compras registradas en ${granja?.nombreGranja || 'esta granja'}.`
        );
        return;
      }

      // WhatsApp tiene límite de 4096 caracteres, así que limitamos a las últimas 10 compras
      const comprasMostrar = compras.slice(0, 10);
      const hayMas = compras.length > 10;

      let mensaje = `📋 CORINA\n\nListado de Compras\n\n`;
      mensaje += `Granja: ${granja?.nombreGranja || 'N/A'}\n\n`;

      comprasMostrar.forEach((compra, index) => {
        const fecha = new Date(compra.fechaCompra).toLocaleDateString('es-AR');
        mensaje += `${index + 1}. Factura: ${compra.numeroFactura || 'N/A'}\n`;
        mensaje += `   Fecha: ${fecha}\n`;
        mensaje += `   Proveedor: ${compra.proveedor.nombreProveedor}\n`;
        mensaje += `   Total: $${compra.totalFactura.toFixed(2)}\n`;
        mensaje += `   Items: ${compra.comprasDetalle.length}\n`;
        
        // Mostrar primeros 3 items como resumen
        if (compra.comprasDetalle.length > 0) {
          mensaje += `   Detalles:\n`;
          compra.comprasDetalle.slice(0, 3).forEach((detalle) => {
            mensaje += `     • ${detalle.materiaPrima.nombreMateriaPrima}: ${detalle.cantidadComprada.toFixed(2)} kg\n`;
          });
          if (compra.comprasDetalle.length > 3) {
            mensaje += `     ... y ${compra.comprasDetalle.length - 3} más\n`;
          }
        }
        mensaje += `\n`;
      });

      if (hayMas) {
        mensaje += `\n... y ${compras.length - 10} compras más.`;
      }
      mensaje += `\n\nTotal: ${compras.length} compras`;

      await CorinaNotificacionService.enviarMensajeWhatsApp(usuario.telefono, mensaje);
    } catch (error: any) {
      console.error('Error enviando listado de compras:', error);
      throw error;
    }
  }

  /**
   * Enviar listado de fórmulas de una granja
   */
  static async enviarListadoFormulas(
    idUsuario: string,
    idGranja: string
  ): Promise<void> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: idUsuario },
        select: {
          telefono: true,
          telefonoVerificado: true,
        },
      });

      if (!usuario || !usuario.telefono || !usuario.telefonoVerificado) {
        throw new Error('Usuario no tiene teléfono verificado');
      }

      const formulas = await obtenerFormulasGranja(idGranja);

      const granja = await prisma.granja.findUnique({
        where: { id: idGranja },
        select: { nombreGranja: true },
      });

      if (formulas.length === 0) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          usuario.telefono,
          `📋 CORINA\n\nNo hay fórmulas registradas en ${granja?.nombreGranja || 'esta granja'}.`
        );
        return;
      }

      let mensaje = `📋 CORINA\n\nListado de Fórmulas\n\n`;
      mensaje += `Granja: ${granja?.nombreGranja || 'N/A'}\n\n`;

      formulas.forEach((formula, index) => {
        mensaje += `${index + 1}. ${formula.descripcionFormula} (${formula.codigoFormula})\n`;
        mensaje += `   Animal: ${formula.animal.descripcionAnimal}\n`;
        mensaje += `   Peso Total: ${formula.pesoTotalFormula.toFixed(2)} kg\n`;
        mensaje += `   Costo Total: $${formula.costoTotalFormula.toFixed(2)}\n`;
        mensaje += `   Ingredientes: ${formula._count.formulasDetalle}\n\n`;
      });

      mensaje += `Total: ${formulas.length} fórmulas`;

      await CorinaNotificacionService.enviarMensajeWhatsApp(usuario.telefono, mensaje);
    } catch (error: any) {
      console.error('Error enviando listado de fórmulas:', error);
      throw error;
    }
  }

  /**
   * Enviar listado de fabricaciones de una granja
   */
  static async enviarListadoFabricaciones(
    idUsuario: string,
    idGranja: string
  ): Promise<void> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: idUsuario },
        select: {
          telefono: true,
          telefonoVerificado: true,
        },
      });

      if (!usuario || !usuario.telefono || !usuario.telefonoVerificado) {
        throw new Error('Usuario no tiene teléfono verificado');
      }

      const fabricaciones = await obtenerFabricacionesGranja(idGranja);

      const granja = await prisma.granja.findUnique({
        where: { id: idGranja },
        select: { nombreGranja: true },
      });

      if (fabricaciones.length === 0) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          usuario.telefono,
          `📋 CORINA\n\nNo hay fabricaciones registradas en ${granja?.nombreGranja || 'esta granja'}.`
        );
        return;
      }

      // Limitar a las últimas 10 fabricaciones
      const fabricacionesMostrar = fabricaciones.slice(0, 10);
      const hayMas = fabricaciones.length > 10;

      let mensaje = `📋 CORINA\n\nListado de Fabricaciones\n\n`;
      mensaje += `Granja: ${granja?.nombreGranja || 'N/A'}\n\n`;

      fabricacionesMostrar.forEach((fab, index) => {
        const fecha = new Date(fab.fechaFabricacion).toLocaleDateString('es-AR');
        mensaje += `${index + 1}. ${fab.descripcionFabricacion}\n`;
        mensaje += `   Fecha: ${fecha}\n`;
        mensaje += `   Fórmula: ${fab.formula.descripcionFormula}\n`;
        mensaje += `   Cantidad: ${fab.cantidadFabricacion.toFixed(2)} veces\n`;
        mensaje += `   Costo Total: $${fab.costoTotalFabricacion.toFixed(2)}\n`;
        mensaje += `   Costo/kg: $${fab.costoPorKilo.toFixed(2)}\n\n`;
      });

      if (hayMas) {
        mensaje += `\n... y ${fabricaciones.length - 10} fabricaciones más.`;
      }
      mensaje += `\n\nTotal: ${fabricaciones.length} fabricaciones`;

      await CorinaNotificacionService.enviarMensajeWhatsApp(usuario.telefono, mensaje);
    } catch (error: any) {
      console.error('Error enviando listado de fabricaciones:', error);
      throw error;
    }
  }

  /**
   * Enviar listado de proveedores de una granja
   */
  static async enviarListadoProveedores(
    idUsuario: string,
    idGranja: string
  ): Promise<void> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: idUsuario },
        select: {
          telefono: true,
          telefonoVerificado: true,
        },
      });

      if (!usuario || !usuario.telefono || !usuario.telefonoVerificado) {
        throw new Error('Usuario no tiene teléfono verificado');
      }

      const proveedores = await prisma.proveedor.findMany({
        where: {
          idGranja,
          activo: true,
        },
        orderBy: {
          nombreProveedor: 'asc',
        },
      });

      const granja = await prisma.granja.findUnique({
        where: { id: idGranja },
        select: { nombreGranja: true },
      });

      if (proveedores.length === 0) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          usuario.telefono,
          `📋 CORINA\n\nNo hay proveedores registrados en ${granja?.nombreGranja || 'esta granja'}.`
        );
        return;
      }

      let mensaje = `📋 CORINA\n\nListado de Proveedores\n\n`;
      mensaje += `Granja: ${granja?.nombreGranja || 'N/A'}\n\n`;

      proveedores.forEach((prov, index) => {
        mensaje += `${index + 1}. ${prov.nombreProveedor} (${prov.codigoProveedor})\n`;
        if (prov.direccion || prov.localidad) {
          mensaje += `   ${prov.direccion || ''}${prov.direccion && prov.localidad ? ', ' : ''}${prov.localidad || ''}\n`;
        }
        mensaje += `\n`;
      });

      mensaje += `Total: ${proveedores.length} proveedores`;

      await CorinaNotificacionService.enviarMensajeWhatsApp(usuario.telefono, mensaje);
    } catch (error: any) {
      console.error('Error enviando listado de proveedores:', error);
      throw error;
    }
  }

  /**
   * Enviar listado de animales (piensos) de una granja
   */
  static async enviarListadoAnimales(
    idUsuario: string,
    idGranja: string
  ): Promise<void> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: idUsuario },
        select: {
          telefono: true,
          telefonoVerificado: true,
        },
      });

      if (!usuario || !usuario.telefono || !usuario.telefonoVerificado) {
        throw new Error('Usuario no tiene teléfono verificado');
      }

      const animales = await prisma.animal.findMany({
        where: {
          idGranja,
          activo: true,
        },
        orderBy: {
          descripcionAnimal: 'asc',
        },
      });

      const granja = await prisma.granja.findUnique({
        where: { id: idGranja },
        select: { nombreGranja: true },
      });

      if (animales.length === 0) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          usuario.telefono,
          `📋 CORINA\n\nNo hay animales (piensos) registrados en ${granja?.nombreGranja || 'esta granja'}.`
        );
        return;
      }

      let mensaje = `📋 CORINA\n\nListado de Animales (Piensos)\n\n`;
      mensaje += `Granja: ${granja?.nombreGranja || 'N/A'}\n\n`;

      animales.forEach((animal, index) => {
        mensaje += `${index + 1}. ${animal.descripcionAnimal} (${animal.codigoAnimal})\n`;
        mensaje += `   Categoría: ${animal.categoriaAnimal}\n\n`;
      });

      mensaje += `Total: ${animales.length} animales`;

      await CorinaNotificacionService.enviarMensajeWhatsApp(usuario.telefono, mensaje);
    } catch (error: any) {
      console.error('Error enviando listado de animales:', error);
      throw error;
    }
  }

  /**
   * Enviar informe de inventario de una granja
   */
  static async enviarInformeInventario(
    idUsuario: string,
    idGranja: string
  ): Promise<void> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: idUsuario },
        select: {
          telefono: true,
          telefonoVerificado: true,
        },
      });

      if (!usuario || !usuario.telefono || !usuario.telefonoVerificado) {
        throw new Error('Usuario no tiene teléfono verificado');
      }

      const inventario = await prisma.inventario.findMany({
        where: { idGranja },
        include: {
          materiaPrima: {
            select: {
              nombreMateriaPrima: true,
              codigoMateriaPrima: true,
            },
          },
        },
        orderBy: {
          materiaPrima: {
            codigoMateriaPrima: 'asc',
          },
        },
      });

      const granja = await prisma.granja.findUnique({
        where: { id: idGranja },
        select: { nombreGranja: true },
      });

      if (inventario.length === 0) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          usuario.telefono,
          `📋 CORINA\n\nNo hay inventario registrado en ${granja?.nombreGranja || 'esta granja'}.`
        );
        return;
      }

      // Calcular estadísticas
      const totalMateriasPrimas = inventario.length;
      const toneladasTotales = inventario.reduce((sum, item) => sum + item.cantidadReal, 0) / 1000;
      const costoTotalStock = inventario.reduce((sum, item) => sum + item.valorStock, 0);
      const alertas = inventario.filter(item => item.cantidadReal <= 0).length;

      let mensaje = `📊 CORINA\n\nInforme de Inventario\n\n`;
      mensaje += `Granja: ${granja?.nombreGranja || 'N/A'}\n\n`;
      mensaje += `📈 Estadísticas:\n`;
      mensaje += `• Total materias primas: ${totalMateriasPrimas}\n`;
      mensaje += `• Toneladas totales: ${toneladasTotales.toFixed(2)} T\n`;
      mensaje += `• Valor total stock: $${costoTotalStock.toFixed(2)}\n`;
      mensaje += `• Alertas (≤0): ${alertas}\n\n`;

      // Mostrar top 10 materias primas con más stock
      const topStock = inventario
        .filter(item => item.cantidadReal > 0)
        .sort((a, b) => b.cantidadReal - a.cantidadReal)
        .slice(0, 10);

      if (topStock.length > 0) {
        mensaje += `🔝 Top 10 Materias Primas:\n\n`;
        topStock.forEach((item, index) => {
          mensaje += `${index + 1}. ${item.materiaPrima.nombreMateriaPrima}\n`;
          mensaje += `   Stock: ${item.cantidadReal.toFixed(2)} kg\n`;
          mensaje += `   Valor: $${item.valorStock.toFixed(2)}\n\n`;
        });
      }

      await CorinaNotificacionService.enviarMensajeWhatsApp(usuario.telefono, mensaje);
    } catch (error: any) {
      console.error('Error enviando informe de inventario:', error);
      throw error;
    }
  }
}

