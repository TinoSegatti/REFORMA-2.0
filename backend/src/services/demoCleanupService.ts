/**
 * Servicio de Eliminación Automática de Datos DEMO
 * Maneja la eliminación automática de datos de usuarios DEMO después de 30 días
 * y envía notificaciones por email antes de la eliminación
 */

import prisma from '../lib/prisma';
import { PlanSuscripcion } from '../constants/planes';
import {
  notificarEliminacionDemo10Dias,
  notificarEliminacionDemo5Dias,
  notificarEliminacionDemo1Dia,
  notificarDatosEliminadosDemo
} from './notificacionService';

/**
 * Obtiene usuarios DEMO que están cerca de cumplir 30 días
 */
export async function obtenerUsuariosDemoParaNotificacion() {
  const ahora = new Date();
  
  // Usuarios con 20 días (10 días antes de eliminación)
  const fecha10DiasAntes = new Date(ahora);
  fecha10DiasAntes.setDate(ahora.getDate() - 20);
  
  // Usuarios con 25 días (5 días antes de eliminación)
  const fecha5DiasAntes = new Date(ahora);
  fecha5DiasAntes.setDate(ahora.getDate() - 25);
  
  // Usuarios con 29 días (1 día antes de eliminación)
  const fecha1DiaAntes = new Date(ahora);
  fecha1DiaAntes.setDate(ahora.getDate() - 29);
  
  // Usuarios con exactamente 30 días (para eliminación)
  const fecha30Dias = new Date(ahora);
  fecha30Dias.setDate(ahora.getDate() - 30);

  const usuarios = await prisma.usuario.findMany({
    where: {
      planSuscripcion: PlanSuscripcion.DEMO,
      activo: true,
      fechaRegistro: {
        lte: ahora // Solo usuarios registrados hace al menos 20 días
      }
    },
    select: {
      id: true,
      email: true,
      nombreUsuario: true,
      apellidoUsuario: true,
      fechaRegistro: true,
      planSuscripcion: true
    }
  });

  // Clasificar usuarios según días transcurridos
  const usuarios10Dias: typeof usuarios = [];
  const usuarios5Dias: typeof usuarios = [];
  const usuarios1Dia: typeof usuarios = [];
  const usuariosParaEliminar: typeof usuarios = [];

  usuarios.forEach(usuario => {
    const diasTranscurridos = Math.floor(
      (ahora.getTime() - usuario.fechaRegistro.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Clasificar usuarios según días transcurridos
    // Usamos rangos para asegurar que se envíe la notificación aunque el job se ejecute en diferentes momentos del día
    if (diasTranscurridos >= 30) {
      // Usuarios que cumplieron 30 días o más - para eliminación
      usuariosParaEliminar.push(usuario);
    } else if (diasTranscurridos >= 29 && diasTranscurridos < 30) {
      // Entre 29 y 30 días - 1 día antes (o el día anterior)
      usuarios1Dia.push(usuario);
    } else if (diasTranscurridos >= 25 && diasTranscurridos < 29) {
      // Entre 25 y 29 días - 5 días antes
      usuarios5Dias.push(usuario);
    } else if (diasTranscurridos >= 20 && diasTranscurridos < 25) {
      // Entre 20 y 25 días - 10 días antes
      usuarios10Dias.push(usuario);
    }
  });

  return {
    usuarios10Dias,
    usuarios5Dias,
    usuarios1Dia,
    usuariosParaEliminar
  };
}

/**
 * Envía notificaciones a usuarios DEMO según los días restantes
 */
export async function enviarNotificacionesDemo() {
  try {
    const { usuarios10Dias, usuarios5Dias, usuarios1Dia } = await obtenerUsuariosDemoParaNotificacion();

    // Enviar notificaciones de 10 días antes
    for (const usuario of usuarios10Dias) {
      try {
        await notificarEliminacionDemo10Dias(
          usuario.email,
          usuario.nombreUsuario,
          usuario.fechaRegistro
        );
        console.log(`✅ Notificación 10 días enviada a ${usuario.email}`);
      } catch (error) {
        console.error(`❌ Error enviando notificación 10 días a ${usuario.email}:`, error);
      }
    }

    // Enviar notificaciones de 5 días antes
    for (const usuario of usuarios5Dias) {
      try {
        await notificarEliminacionDemo5Dias(
          usuario.email,
          usuario.nombreUsuario,
          usuario.fechaRegistro
        );
        console.log(`✅ Notificación 5 días enviada a ${usuario.email}`);
      } catch (error) {
        console.error(`❌ Error enviando notificación 5 días a ${usuario.email}:`, error);
      }
    }

    // Enviar notificaciones de 1 día antes
    for (const usuario of usuarios1Dia) {
      try {
        await notificarEliminacionDemo1Dia(
          usuario.email,
          usuario.nombreUsuario,
          usuario.fechaRegistro
        );
        console.log(`✅ Notificación 1 día enviada a ${usuario.email}`);
      } catch (error) {
        console.error(`❌ Error enviando notificación 1 día a ${usuario.email}:`, error);
      }
    }

    return {
      notificaciones10Dias: usuarios10Dias.length,
      notificaciones5Dias: usuarios5Dias.length,
      notificaciones1Dia: usuarios1Dia.length
    };
  } catch (error) {
    console.error('❌ Error en enviarNotificacionesDemo:', error);
    throw error;
  }
}

/**
 * Elimina todos los datos de un usuario DEMO
 */
export async function eliminarDatosUsuarioDemo(usuarioId: string) {
  try {
    // Obtener todas las granjas del usuario
    const granjas = await prisma.granja.findMany({
      where: { idUsuario: usuarioId },
      select: { id: true }
    });

    const granjaIds = granjas.map(g => g.id);

    // Eliminar en orden para respetar foreign keys
    // 1. Eliminar detalles de fabricaciones
    await prisma.detalleFabricacion.deleteMany({
      where: {
        fabricacion: {
          idGranja: { in: granjaIds }
        }
      }
    });

    // 2. Eliminar fabricaciones
    await prisma.fabricacion.deleteMany({
      where: { idGranja: { in: granjaIds } }
    });

    // 3. Eliminar detalles de compras
    await prisma.compraDetalle.deleteMany({
      where: {
        compra: {
          idGranja: { in: granjaIds }
        }
      }
    });

    // 4. Eliminar compras
    await prisma.compraCabecera.deleteMany({
      where: { idGranja: { in: granjaIds } }
    });

    // 5. Eliminar detalles de fórmulas
    await prisma.formulaDetalle.deleteMany({
      where: {
        formula: {
          idGranja: { in: granjaIds }
        }
      }
    });

    // 6. Eliminar fórmulas
    await prisma.formulaCabecera.deleteMany({
      where: { idGranja: { in: granjaIds } }
    });

    // 7. Eliminar inventario inicial
    await prisma.inventarioInicial.deleteMany({
      where: { idGranja: { in: granjaIds } }
    });

    // 8. Eliminar inventario
    await prisma.inventario.deleteMany({
      where: { idGranja: { in: granjaIds } }
    });

    // 9. Eliminar detalles de archivos
    await prisma.archivoDetalle.deleteMany({
      where: {
        archivo: {
          idGranja: { in: granjaIds }
        }
      }
    });

    // 10. Eliminar archivos cabecera
    await prisma.archivoCabecera.deleteMany({
      where: { idGranja: { in: granjaIds } }
    });

    // 11. Eliminar materias primas
    await prisma.materiaPrima.deleteMany({
      where: { idGranja: { in: granjaIds } }
    });

    // 12. Eliminar proveedores
    await prisma.proveedor.deleteMany({
      where: { idGranja: { in: granjaIds } }
    });

    // 13. Eliminar animales (piensos)
    await prisma.animal.deleteMany({
      where: { idGranja: { in: granjaIds } }
    });

    // 14. Eliminar auditorías
    await prisma.auditoria.deleteMany({
      where: { idGranja: { in: granjaIds } }
    });

    // 15. Eliminar granjas
    await prisma.granja.deleteMany({
      where: { idUsuario: usuarioId }
    });

    // 16. Eliminar suscripciones si existen
    await prisma.pago.deleteMany({
      where: {
        suscripcion: {
          idUsuario: usuarioId
        }
      }
    });

    await prisma.suscripcion.deleteMany({
      where: { idUsuario: usuarioId }
    });

    // 17. Eliminar usuarios empleados vinculados (si el usuario es dueño)
    await prisma.usuario.updateMany({
      where: { idUsuarioDueño: usuarioId },
      data: {
        esUsuarioEmpleado: false,
        idUsuarioDueño: null,
        activoComoEmpleado: false,
        fechaVinculacion: null,
        rolEmpleado: null
      }
    });

    console.log(`✅ Datos eliminados para usuario DEMO: ${usuarioId}`);
    
    return {
      granjasEliminadas: granjas.length,
      usuarioId
    };
  } catch (error) {
    console.error(`❌ Error eliminando datos del usuario DEMO ${usuarioId}:`, error);
    throw error;
  }
}

/**
 * Procesa la eliminación de datos de usuarios DEMO que cumplieron 30 días
 */
export async function procesarEliminacionDatosDemo() {
  try {
    const { usuariosParaEliminar } = await obtenerUsuariosDemoParaNotificacion();

    const resultados = {
      usuariosProcesados: 0,
      usuariosEliminados: 0,
      errores: 0
    };

    for (const usuario of usuariosParaEliminar) {
      try {
        // Verificar que sigue siendo DEMO (por si cambió de plan)
        const usuarioActualizado = await prisma.usuario.findUnique({
          where: { id: usuario.id },
          select: { planSuscripcion: true }
        });

        if (usuarioActualizado?.planSuscripcion !== PlanSuscripcion.DEMO) {
          console.log(`⏭️  Usuario ${usuario.email} ya no es DEMO, saltando eliminación`);
          continue;
        }

        // Eliminar datos
        await eliminarDatosUsuarioDemo(usuario.id);

        // Enviar notificación de eliminación
        try {
          await notificarDatosEliminadosDemo(
            usuario.email,
            usuario.nombreUsuario
          );
          console.log(`✅ Notificación de eliminación enviada a ${usuario.email}`);
        } catch (error) {
          console.error(`❌ Error enviando notificación de eliminación a ${usuario.email}:`, error);
        }

        resultados.usuariosEliminados++;
        resultados.usuariosProcesados++;
      } catch (error) {
        console.error(`❌ Error procesando eliminación para usuario ${usuario.email}:`, error);
        resultados.errores++;
        resultados.usuariosProcesados++;
      }
    }

    return resultados;
  } catch (error) {
    console.error('❌ Error en procesarEliminacionDatosDemo:', error);
    throw error;
  }
}

/**
 * Ejecuta el proceso completo de limpieza DEMO
 * - Envía notificaciones
 * - Elimina datos de usuarios que cumplieron 30 días
 */
export async function ejecutarLimpiezaDemo() {
  console.log('🔄 Iniciando proceso de limpieza DEMO...');
  
  try {
    // 1. Enviar notificaciones
    const notificaciones = await enviarNotificacionesDemo();
    console.log('📧 Notificaciones enviadas:', notificaciones);

    // 2. Procesar eliminaciones
    const eliminaciones = await procesarEliminacionDatosDemo();
    console.log('🗑️  Eliminaciones procesadas:', eliminaciones);

    return {
      notificaciones,
      eliminaciones
    };
  } catch (error) {
    console.error('❌ Error en ejecutarLimpiezaDemo:', error);
    throw error;
  }
}

