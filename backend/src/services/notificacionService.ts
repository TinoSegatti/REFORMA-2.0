/**
 * Servicio de Notificaciones
 * Maneja el envío de notificaciones por email para eventos del sistema
 */

import { enviarEmailVerificacion } from './emailService';
import prisma from '../lib/prisma';

/**
 * Template base para emails de notificaciones
 */
function getEmailTemplate(
  titulo: string,
  contenido: string,
  botonTexto?: string,
  botonUrl?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #9d77f4 0%, #f472b6 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #9d77f4 0%, #f472b6 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
          }
          .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titulo}</h1>
        </div>
        <div class="content">
          ${contenido}
          ${botonTexto && botonUrl ? `
            <div style="text-align: center;">
              <a href="${botonUrl}" class="button">${botonTexto}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>© 2024 REFORMA - Sistema de Gestión de Granjas</p>
          <p>Este es un correo automático, por favor no respondas.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Enviar notificación cuando un empleado es agregado a una cuenta
 */
export async function notificarEmpleadoAgregado(
  emailEmpleado: string,
  nombreEmpleado: string,
  nombreDueño: string,
  emailDueño: string
): Promise<void> {
  try {
    const transporter = await import('./emailService').then(m => {
      // Usar el transporter del servicio de email
      const nodemailer = require('nodemailer');
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpSecure = process.env.SMTP_SECURE === 'true';

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return null;
      }

      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
    });

    if (!transporter) {
      console.warn('⚠️  Servicio de email no configurado. No se enviará notificación.');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const contenido = `
      <p>Hola <strong>${nombreEmpleado}</strong>,</p>
      <p>Has sido agregado como empleado a la cuenta de <strong>${nombreDueño}</strong> (${emailDueño}).</p>
      <div class="info-box">
        <p><strong>¿Qué significa esto?</strong></p>
        <p>Ahora tienes acceso a las granjas de tu empleador y podrás gestionar sus operaciones según los permisos asignados.</p>
      </div>
      <p>Puedes iniciar sesión en REFORMA con tu cuenta para comenzar a trabajar.</p>
    `;

    const mailOptions = {
      from: `"REFORMA" <${process.env.SMTP_USER}>`,
      to: emailEmpleado,
      subject: 'Has sido agregado como empleado en REFORMA',
      html: getEmailTemplate(
        '¡Bienvenido como Empleado!',
        contenido,
        'Iniciar Sesión',
        `${frontendUrl}/login`
      ),
      text: `
        Has sido agregado como empleado
        
        Hola ${nombreEmpleado},
        
        Has sido agregado como empleado a la cuenta de ${nombreDueño} (${emailDueño}).
        
        Ahora tienes acceso a las granjas de tu empleador y podrás gestionar sus operaciones según los permisos asignados.
        
        Puedes iniciar sesión en REFORMA con tu cuenta para comenzar a trabajar.
        
        ${frontendUrl}/login
        
        © 2024 REFORMA - Sistema de Gestión de Granjas
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notificación de empleado agregado enviada a ${emailEmpleado}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de empleado agregado:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
}

/**
 * Enviar notificación cuando un empleado acepta una invitación (se registra con código de referencia)
 */
export async function notificarEmpleadoAceptaInvitacion(
  emailDueño: string,
  nombreDueño: string,
  nombreEmpleado: string,
  emailEmpleado: string
): Promise<void> {
  try {
    const transporter = await import('./emailService').then(m => {
      const nodemailer = require('nodemailer');
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpSecure = process.env.SMTP_SECURE === 'true';

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return null;
      }

      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
    });

    if (!transporter) {
      console.warn('⚠️  Servicio de email no configurado. No se enviará notificación.');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const contenido = `
      <p>Hola <strong>${nombreDueño}</strong>,</p>
      <p><strong>${nombreEmpleado}</strong> (${emailEmpleado}) ha aceptado tu invitación y se ha registrado como empleado en tu cuenta.</p>
      <div class="info-box">
        <p><strong>Próximos pasos:</strong></p>
        <p>El empleado ahora tiene acceso a tus granjas. Puedes gestionar sus permisos y roles desde la sección de Configuración > Gestión de Empleados.</p>
      </div>
    `;

    const mailOptions = {
      from: `"REFORMA" <${process.env.SMTP_USER}>`,
      to: emailDueño,
      subject: 'Nuevo empleado se ha unido a tu cuenta',
      html: getEmailTemplate(
        'Nuevo Empleado Agregado',
        contenido,
        'Gestionar Empleados',
        `${frontendUrl}/granja/[id]/configuracion/empleados`
      ),
      text: `
        Nuevo empleado se ha unido a tu cuenta
        
        Hola ${nombreDueño},
        
        ${nombreEmpleado} (${emailEmpleado}) ha aceptado tu invitación y se ha registrado como empleado en tu cuenta.
        
        El empleado ahora tiene acceso a tus granjas. Puedes gestionar sus permisos y roles desde la sección de Configuración > Gestión de Empleados.
        
        © 2024 REFORMA - Sistema de Gestión de Granjas
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notificación de empleado acepta invitación enviada a ${emailDueño}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de empleado acepta invitación:', error);
  }
}

/**
 * Enviar notificación antes de eliminar un empleado
 */
export async function notificarAntesEliminarEmpleado(
  emailEmpleado: string,
  nombreEmpleado: string,
  nombreDueño: string,
  emailDueño: string,
  motivo?: string
): Promise<void> {
  try {
    const transporter = await import('./emailService').then(m => {
      const nodemailer = require('nodemailer');
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpSecure = process.env.SMTP_SECURE === 'true';

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return null;
      }

      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
    });

    if (!transporter) {
      console.warn('⚠️  Servicio de email no configurado. No se enviará notificación.');
      return;
    }

    const contenido = `
      <p>Hola <strong>${nombreEmpleado}</strong>,</p>
      <p>Te informamos que tu acceso como empleado a la cuenta de <strong>${nombreDueño}</strong> (${emailDueño}) será eliminado.</p>
      ${motivo ? `
        <div class="info-box">
          <p><strong>Motivo:</strong></p>
          <p>${motivo}</p>
        </div>
      ` : ''}
      <p>Una vez eliminado, perderás acceso a las granjas de tu empleador. Si crees que esto es un error, contacta a ${nombreDueño} directamente.</p>
    `;

    const mailOptions = {
      from: `"REFORMA" <${process.env.SMTP_USER}>`,
      to: emailEmpleado,
      subject: 'Notificación: Acceso como empleado será eliminado',
      html: getEmailTemplate(
        'Notificación Importante',
        contenido
      ),
      text: `
        Notificación: Acceso como empleado será eliminado
        
        Hola ${nombreEmpleado},
        
        Te informamos que tu acceso como empleado a la cuenta de ${nombreDueño} (${emailDueño}) será eliminado.
        
        ${motivo ? `Motivo: ${motivo}` : ''}
        
        Una vez eliminado, perderás acceso a las granjas de tu empleador. Si crees que esto es un error, contacta a ${nombreDueño} directamente.
        
        © 2024 REFORMA - Sistema de Gestión de Granjas
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notificación antes de eliminar empleado enviada a ${emailEmpleado}`);
  } catch (error) {
    console.error('❌ Error enviando notificación antes de eliminar empleado:', error);
  }
}

/**
 * Enviar notificación cuando un empleado es eliminado
 */
export async function notificarEmpleadoEliminado(
  emailEmpleado: string,
  nombreEmpleado: string,
  nombreDueño: string,
  emailDueño: string
): Promise<void> {
  try {
    const transporter = await import('./emailService').then(m => {
      const nodemailer = require('nodemailer');
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpSecure = process.env.SMTP_SECURE === 'true';

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return null;
      }

      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
    });

    if (!transporter) {
      console.warn('⚠️  Servicio de email no configurado. No se enviará notificación.');
      return;
    }

    const contenido = `
      <p>Hola <strong>${nombreEmpleado}</strong>,</p>
      <p>Tu acceso como empleado a la cuenta de <strong>${nombreDueño}</strong> (${emailDueño}) ha sido eliminado.</p>
      <div class="info-box">
        <p><strong>¿Qué significa esto?</strong></p>
        <p>Ya no tienes acceso a las granjas de tu empleador. Si necesitas recuperar el acceso, contacta a ${nombreDueño} directamente.</p>
      </div>
      <p>Tu cuenta de REFORMA sigue activa, pero ahora funciona como una cuenta independiente con plan DEMO.</p>
    `;

    const mailOptions = {
      from: `"REFORMA" <${process.env.SMTP_USER}>`,
      to: emailEmpleado,
      subject: 'Tu acceso como empleado ha sido eliminado',
      html: getEmailTemplate(
        'Acceso Eliminado',
        contenido
      ),
      text: `
        Tu acceso como empleado ha sido eliminado
        
        Hola ${nombreEmpleado},
        
        Tu acceso como empleado a la cuenta de ${nombreDueño} (${emailDueño}) ha sido eliminado.
        
        Ya no tienes acceso a las granjas de tu empleador. Si necesitas recuperar el acceso, contacta a ${nombreDueño} directamente.
        
        Tu cuenta de REFORMA sigue activa, pero ahora funciona como una cuenta independiente con plan DEMO.
        
        © 2024 REFORMA - Sistema de Gestión de Granjas
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notificación de empleado eliminado enviada a ${emailEmpleado}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de empleado eliminado:', error);
  }
}

/**
 * Enviar notificación 10 días antes de eliminación de datos DEMO
 */
export async function notificarEliminacionDemo10Dias(
  email: string,
  nombreUsuario: string,
  fechaRegistro: Date
): Promise<void> {
  try {
    const transporter = await import('./emailService').then(m => {
      const nodemailer = require('nodemailer');
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpSecure = process.env.SMTP_SECURE === 'true';

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return null;
      }

      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
    });

    if (!transporter) {
      console.warn('⚠️  SMTP no configurado, no se enviará notificación DEMO');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const planesUrl = `${frontendUrl}/planes`;

    const diasRestantes = 10;
    const fechaEliminacion = new Date(fechaRegistro);
    fechaEliminacion.setDate(fechaRegistro.getDate() + 30);

    const contenido = `
      <p>Hola <strong>${nombreUsuario}</strong>,</p>
      
      <p>Te escribimos para informarte que tu cuenta <strong>DEMO</strong> cumplirá <strong>30 días</strong> el <strong>${fechaEliminacion.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
      
      <div class="info-box">
        <p><strong>⚠️ Importante:</strong> En <strong>${diasRestantes} días</strong>, todos tus datos serán eliminados automáticamente si no actualizas a un plan de pago.</p>
      </div>

      <h3>💡 ¿Por qué actualizar ahora?</h3>
      <ul>
        <li>✅ <strong>Descuento especial:</strong> Ahorra hasta un <strong>17%</strong> pagando anualmente</li>
        <li>✅ <strong>Mantén tus datos:</strong> No pierdas toda la información que has ingresado</li>
        <li>✅ <strong>Más funcionalidades:</strong> Accede a características avanzadas del sistema</li>
        <li>✅ <strong>Soporte prioritario:</strong> Recibe ayuda cuando la necesites</li>
      </ul>

      <h3>🎯 Planes Disponibles:</h3>
      <ul>
        <li><strong>STARTER:</strong> $50,750/mes o $507,500/año (ahorra $91,000 con plan anual)</li>
        <li><strong>BUSINESS:</strong> $143,550/mes o $1,435,500/año (ahorra $286,100 con plan anual)</li>
        <li><strong>ENTERPRISE:</strong> $332,050/mes o $3,320,500/año (ahorra $663,100 con plan anual)</li>
      </ul>

      <p><strong>💎 Recomendación:</strong> El plan <strong>STARTER anual</strong> es ideal para comenzar. Con el descuento anual, pagas menos de $42,000 por mes.</p>
    `;

    const mailOptions = {
      from: `"REFORMA" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `⚠️ Tu cuenta DEMO expira en ${diasRestantes} días - Actualiza ahora y ahorra`,
      html: getEmailTemplate(
        '⚠️ Tu cuenta DEMO expira pronto',
        contenido,
        'Ver Planes y Precios',
        planesUrl
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notificación DEMO 10 días enviada a ${email}`);
  } catch (error) {
    console.error('❌ Error enviando notificación DEMO 10 días:', error);
  }
}

/**
 * Enviar notificación 5 días antes de eliminación de datos DEMO
 */
export async function notificarEliminacionDemo5Dias(
  email: string,
  nombreUsuario: string,
  fechaRegistro: Date
): Promise<void> {
  try {
    const transporter = await import('./emailService').then(m => {
      const nodemailer = require('nodemailer');
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpSecure = process.env.SMTP_SECURE === 'true';

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return null;
      }

      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
    });

    if (!transporter) {
      console.warn('⚠️  SMTP no configurado, no se enviará notificación DEMO');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const planesUrl = `${frontendUrl}/planes`;

    const diasRestantes = 5;
    const fechaEliminacion = new Date(fechaRegistro);
    fechaEliminacion.setDate(fechaRegistro.getDate() + 30);

    const contenido = `
      <p>Hola <strong>${nombreUsuario}</strong>,</p>
      
      <p>Tu cuenta <strong>DEMO</strong> expirará el <strong>${fechaEliminacion.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
      
      <div class="info-box" style="background: #fff3cd; border-left-color: #ffc107;">
        <p><strong>⏰ Quedan solo ${diasRestantes} días</strong> antes de que todos tus datos sean eliminados automáticamente.</p>
      </div>

      <h3>💰 Aprovecha el Descuento Anual:</h3>
      <p>Al pagar anualmente, obtienes un <strong>descuento del 17%</strong> en todos los planes:</p>
      <ul>
        <li><strong>STARTER Anual:</strong> $507,500/año (equivalente a $42,292/mes) - <strong style="color: #28a745;">Ahorra $91,000</strong></li>
        <li><strong>BUSINESS Anual:</strong> $1,435,500/año (equivalente a $119,625/mes) - <strong style="color: #28a745;">Ahorra $286,100</strong></li>
        <li><strong>ENTERPRISE Anual:</strong> $3,320,500/año (equivalente a $276,708/mes) - <strong style="color: #28a745;">Ahorra $663,100</strong></li>
      </ul>

      <p><strong>💡 Recomendación:</strong> El plan <strong>STARTER anual</strong> te permite mantener todos tus datos y pagar menos de $42,300 por mes.</p>

      <p>No pierdas toda la información que has ingresado. Actualiza ahora y mantén tu trabajo seguro.</p>
    `;

    const mailOptions = {
      from: `"REFORMA" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `⏰ Solo quedan ${diasRestantes} días - Actualiza tu cuenta DEMO ahora`,
      html: getEmailTemplate(
        `⏰ Solo ${diasRestantes} días restantes`,
        contenido,
        'Actualizar a Plan de Pago',
        planesUrl
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notificación DEMO 5 días enviada a ${email}`);
  } catch (error) {
    console.error('❌ Error enviando notificación DEMO 5 días:', error);
  }
}

/**
 * Enviar notificación 1 día antes de eliminación de datos DEMO
 */
export async function notificarEliminacionDemo1Dia(
  email: string,
  nombreUsuario: string,
  fechaRegistro: Date
): Promise<void> {
  try {
    const transporter = await import('./emailService').then(m => {
      const nodemailer = require('nodemailer');
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpSecure = process.env.SMTP_SECURE === 'true';

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return null;
      }

      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
    });

    if (!transporter) {
      console.warn('⚠️  SMTP no configurado, no se enviará notificación DEMO');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const planesUrl = `${frontendUrl}/planes`;

    const diasRestantes = 1;
    const fechaEliminacion = new Date(fechaRegistro);
    fechaEliminacion.setDate(fechaRegistro.getDate() + 30);

    const contenido = `
      <p>Hola <strong>${nombreUsuario}</strong>,</p>
      
      <div class="info-box" style="background: #f8d7da; border-left-color: #dc3545;">
        <p><strong>🚨 URGENTE:</strong> Tu cuenta <strong>DEMO</strong> expira <strong>MAÑANA (${fechaEliminacion.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })})</strong>.</p>
        <p><strong>Todos tus datos serán eliminados permanentemente si no actualizas a un plan de pago.</strong></p>
      </div>

      <h3>💎 Última Oportunidad - Descuento Anual:</h3>
      <p>Esta es tu <strong>última oportunidad</strong> para aprovechar el descuento del <strong>17%</strong> pagando anualmente:</p>
      
      <ul>
        <li><strong>STARTER Anual:</strong> $507,500/año - <strong style="color: #28a745;">Ahorra $91,000</strong> vs mensual</li>
        <li><strong>BUSINESS Anual:</strong> $1,435,500/año - <strong style="color: #28a745;">Ahorra $286,100</strong> vs mensual</li>
        <li><strong>ENTERPRISE Anual:</strong> $3,320,500/año - <strong style="color: #28a745;">Ahorra $663,100</strong> vs mensual</li>
      </ul>

      <p><strong>⚡ Acción inmediata requerida:</strong> Si no actualizas tu plan antes de mañana, perderás:</p>
      <ul>
        <li>❌ Todas tus materias primas</li>
        <li>❌ Todos tus proveedores</li>
        <li>❌ Todas tus fórmulas</li>
        <li>❌ Todas tus compras y fabricaciones</li>
        <li>❌ Todo tu historial</li>
      </ul>

      <p><strong>💡 Recomendación:</strong> El plan <strong>STARTER anual</strong> es la mejor opción para comenzar. Por solo $507,500 al año (menos de $42,300/mes), mantienes todos tus datos y accedes a funcionalidades avanzadas.</p>

      <p><strong>No esperes más. Actualiza ahora y protege tu información.</strong></p>
    `;

    const mailOptions = {
      from: `"REFORMA" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🚨 URGENTE: Tu cuenta DEMO expira MAÑANA - Actualiza ahora`,
      html: getEmailTemplate(
        '🚨 Última Oportunidad - Expira Mañana',
        contenido,
        'Actualizar Ahora - No Perder Datos',
        planesUrl
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notificación DEMO 1 día enviada a ${email}`);
  } catch (error) {
    console.error('❌ Error enviando notificación DEMO 1 día:', error);
  }
}

/**
 * Enviar notificación después de eliminación de datos DEMO
 */
export async function notificarDatosEliminadosDemo(
  email: string,
  nombreUsuario: string
): Promise<void> {
  try {
    const transporter = await import('./emailService').then(m => {
      const nodemailer = require('nodemailer');
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpSecure = process.env.SMTP_SECURE === 'true';

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return null;
      }

      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
    });

    if (!transporter) {
      console.warn('⚠️  SMTP no configurado, no se enviará notificación DEMO');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const planesUrl = `${frontendUrl}/planes`;

    const contenido = `
      <p>Hola <strong>${nombreUsuario}</strong>,</p>
      
      <p>Te informamos que tu cuenta <strong>DEMO</strong> ha cumplido 30 días y, como se indicó en las notificaciones previas, todos tus datos han sido eliminados automáticamente.</p>
      
      <div class="info-box">
        <p><strong>📋 Datos eliminados:</strong></p>
        <ul>
          <li>Materias primas</li>
          <li>Proveedores</li>
          <li>Fórmulas</li>
          <li>Compras y fabricaciones</li>
          <li>Historial y archivos</li>
        </ul>
      </div>

      <h3>🔄 ¿Quieres volver a empezar?</h3>
      <p>Si deseas continuar usando REFORMA, puedes registrarte nuevamente o actualizar a un plan de pago para mantener tus datos permanentemente.</p>

      <h3>💎 Planes Disponibles:</h3>
      <ul>
        <li><strong>STARTER:</strong> $50,750/mes o $507,500/año (ahorra $91,000 con plan anual)</li>
        <li><strong>BUSINESS:</strong> $143,550/mes o $1,435,500/año (ahorra $286,100 con plan anual)</li>
        <li><strong>ENTERPRISE:</strong> $332,050/mes o $3,320,500/año (ahorra $663,100 con plan anual)</li>
      </ul>

      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
    `;

    const mailOptions = {
      from: `"REFORMA" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Datos eliminados - Tu cuenta DEMO ha expirado',
      html: getEmailTemplate(
        'Datos Eliminados - Cuenta DEMO Expirada',
        contenido,
        'Ver Planes Disponibles',
        planesUrl
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notificación de eliminación DEMO enviada a ${email}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de eliminación DEMO:', error);
  }
}

