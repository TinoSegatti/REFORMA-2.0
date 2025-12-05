/**
 * Servicio de Email
 * Maneja el envío de correos electrónicos
 * Usa API REST de SendGrid cuando está disponible (más confiable que SMTP)
 */

import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Intentar importar SendGrid (opcional)
let sgMail: any = null;
try {
  sgMail = require('@sendgrid/mail');
} catch (e) {
  // SendGrid no está instalado, usar solo SMTP
}

// Configuración del transporter de nodemailer
let transporter: nodemailer.Transporter | null = null;

/**
 * Inicializar el transporter de email
 */
function initializeTransporter() {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  let smtpPassword = process.env.SMTP_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn('⚠️  Configuración SMTP incompleta. El envío de emails no funcionará.');
    console.warn('   Variables requeridas: SMTP_HOST, SMTP_USER, SMTP_PASSWORD');
    return null;
  }

  // Limpiar espacios del App Password (Gmail genera passwords con espacios que deben eliminarse)
  smtpPassword = smtpPassword.replace(/\s+/g, '');

  console.log('📧 Inicializando transporter SMTP:');
  console.log(`   Host: ${smtpHost}`);
  console.log(`   Port: ${smtpPort}`);
  console.log(`   User: ${smtpUser}`);
  console.log(`   Secure: ${smtpSecure}`);
  console.log(`   Password length: ${smtpPassword.length} caracteres`);

  // Configuración específica para SendGrid
  if (smtpHost === 'smtp.sendgrid.net') {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser, // Para SendGrid siempre es 'apikey'
        pass: smtpPassword, // API Key de SendGrid
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });
  } else {
    // Configuración para Gmail y otros proveedores SMTP
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true para 465, false para otros puertos
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      // Timeouts más largos para conexiones lentas o con problemas de red
      connectionTimeout: 60000, // 60 segundos para establecer conexión
      greetingTimeout: 30000, // 30 segundos para saludo SMTP
      socketTimeout: 60000, // 60 segundos para operaciones de socket
      // Opciones TLS mejoradas para Gmail
      tls: {
        rejectUnauthorized: true, // Verificar certificados SSL
        minVersion: 'TLSv1.2', // Versión mínima de TLS
      },
      // Pool de conexiones
      pool: true,
      maxConnections: 1,
      maxMessages: 3,
      // Opciones adicionales para mejorar la conexión
      requireTLS: smtpPort === 587, // Requerir TLS para puerto 587
    });
  }

  return transporter;
}

/**
 * Generar token de verificación
 */
export function generarTokenVerificacion(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generar contenido HTML del email
 */
function generarContenidoEmail(nombreUsuario: string, urlVerificacion: string): { html: string; text: string } {
  const html = `
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
        </style>
      </head>
      <body>
        <div class="header">
          <h1>¡Bienvenido a REFORMA!</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${nombreUsuario}</strong>,</p>
          <p>Gracias por registrarte en REFORMA. Para completar tu registro, por favor verifica tu dirección de correo electrónico haciendo clic en el siguiente botón:</p>
          <div style="text-align: center;">
            <a href="${urlVerificacion}" class="button">Verificar Email</a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #9d77f4;">${urlVerificacion}</p>
          <p><strong>Este enlace expirará en 24 horas.</strong></p>
          <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
        </div>
        <div class="footer">
          <p>© 2024 REFORMA - Sistema de Gestión de Granjas</p>
          <p>Este es un correo automático, por favor no respondas.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
    ¡Bienvenido a REFORMA!
    
    Hola ${nombreUsuario},
    
    Gracias por registrarte en REFORMA. Para completar tu registro, por favor verifica tu dirección de correo electrónico visitando el siguiente enlace:
    
    ${urlVerificacion}
    
    Este enlace expirará en 24 horas.
    
    Si no creaste esta cuenta, puedes ignorar este correo.
    
    © 2024 REFORMA - Sistema de Gestión de Granjas
  `;

  return { html, text };
}

/**
 * Enviar email usando API REST de SendGrid (más confiable)
 */
async function enviarConSendGridAPI(
  email: string,
  nombreUsuario: string,
  urlVerificacion: string
): Promise<void> {
  if (!sgMail) {
    throw new Error('SendGrid no está disponible. Instala @sendgrid/mail o usa SMTP.');
  }

  const sendgridApiKey = process.env.SMTP_PASSWORD || process.env.SENDGRID_API_KEY;
  if (!sendgridApiKey) {
    throw new Error('SENDGRID_API_KEY no configurado');
  }

  sgMail.setApiKey(sendgridApiKey);

  const fromEmail = process.env.SMTP_USER || 'reforma.soft.co@gmail.com';
  const contenido = generarContenidoEmail(nombreUsuario, urlVerificacion);

  const msg = {
    to: email,
    from: {
      email: fromEmail,
      name: 'REFORMA'
    },
    subject: 'Verifica tu cuenta de REFORMA',
    text: contenido.text,
    html: contenido.html,
  };

  try {
    console.log(`📧 Enviando email con SendGrid API REST a ${email}...`);
    const [response] = await sgMail.send(msg);
    
    console.log(`✅ Email enviado exitosamente con SendGrid API`);
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Message ID: ${response.headers['x-message-id'] || 'N/A'}`);
    
    return response;
  } catch (error: any) {
    console.error('❌ Error enviando email con SendGrid API:');
    console.error(`   Status Code: ${error.code || 'N/A'}`);
    console.error(`   Message: ${error.message || 'N/A'}`);
    if (error.response) {
      console.error(`   Response Body: ${JSON.stringify(error.response.body)}`);
    }
    throw error;
  }
}

/**
 * Enviar email de verificación
 */
export async function enviarEmailVerificacion(
  email: string,
  nombreUsuario: string,
  tokenVerificacion: string
): Promise<void> {
  // Obtener URL del frontend y asegurar que tenga protocolo
  let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Si la URL no tiene protocolo, agregar https:// (asumimos producción)
  if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
    frontendUrl = `https://${frontendUrl}`;
  }
  
  const urlVerificacion = `${frontendUrl}/verificar-email?token=${tokenVerificacion}`;

  // Intentar usar SendGrid API REST primero (más confiable)
  const smtpHost = process.env.SMTP_HOST || '';
  const sendgridApiKey = process.env.SMTP_PASSWORD || process.env.SENDGRID_API_KEY;
  
  if (smtpHost === 'smtp.sendgrid.net' && sendgridApiKey && sgMail) {
    try {
      return await enviarConSendGridAPI(email, nombreUsuario, urlVerificacion);
    } catch (error: any) {
      console.warn('⚠️  Falló SendGrid API REST, intentando con SMTP...');
      // Continuar con SMTP como fallback
    }
  }

  // Fallback a SMTP
  const transporter = initializeTransporter();
  if (!transporter) {
    throw new Error('Servicio de email no configurado. Contacta al administrador.');
  }

  const contenido = generarContenidoEmail(nombreUsuario, urlVerificacion);
  const fromEmail = process.env.SMTP_USER || 'reforma.soft.co@gmail.com';

  const mailOptions = {
    from: `"REFORMA" <${fromEmail}>`,
    to: email,
    subject: 'Verifica tu cuenta de REFORMA',
    html: contenido.html,
    text: contenido.text,
  };

  try {
    console.log(`📧 Intentando enviar email de verificación a ${email}...`);
    console.log(`   URL de verificación: ${urlVerificacion}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email de verificación enviado exitosamente a ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    
    return info;
  } catch (error: any) {
    console.error('❌ Error enviando email de verificación:');
    console.error(`   Email destino: ${email}`);
    console.error(`   Error code: ${error.code || 'N/A'}`);
    console.error(`   Error command: ${error.command || 'N/A'}`);
    console.error(`   Error message: ${error.message || 'N/A'}`);
    
    if (error.response) {
      console.error(`   SMTP Response: ${error.response}`);
    }
    
    if (error.responseCode) {
      console.error(`   SMTP Response Code: ${error.responseCode}`);
    }
    
    // Detectar errores comunes
    if (error.code === 'EAUTH') {
      console.error('   ⚠️  Error de autenticación. Verifica:');
      console.error('      - Que el App Password sea correcto (sin espacios)');
      console.error('      - Que la verificación en 2 pasos esté habilitada');
      console.error('      - Que el email SMTP_USER sea correcto');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.error('   ⚠️  Error de conexión SMTP. Verifica:');
      console.error('      - Que SMTP_HOST sea correcto');
      console.error('      - Que SMTP_PORT sea correcto (587 o 465)');
      console.error('      - Que el servidor tenga acceso a internet');
      
      const currentSmtpHost = process.env.SMTP_HOST || '';
      if (currentSmtpHost === 'smtp.sendgrid.net') {
        console.error('      - 💡 SOLUCIÓN: Instala @sendgrid/mail y usa API REST');
        console.error('      - Ejecuta: npm install @sendgrid/mail');
        console.error('      - La API REST es más confiable que SMTP desde Render');
      } else if (currentSmtpHost === 'smtp.gmail.com') {
        console.error('      - ⚠️  Gmail bloquea conexiones desde Render frecuentemente');
        console.error('      - 💡 SOLUCIÓN RECOMENDADA: Usa SendGrid API REST');
      } else {
        console.error('      - Intenta usar el puerto 465 con SMTP_SECURE=true');
        console.error('      - O considera usar SendGrid API REST (más confiable)');
      }
    }
    
    throw new Error(`Error al enviar email de verificación: ${error.message}`);
  }
}

/**
 * Reenviar email de verificación
 */
export async function reenviarEmailVerificacion(
  email: string,
  nombreUsuario: string,
  tokenVerificacion: string
): Promise<void> {
  await enviarEmailVerificacion(email, nombreUsuario, tokenVerificacion);
}

/**
 * Verificar configuración de email
 */
export function verificarConfiguracionEmail(): boolean {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  return !!(smtpHost && smtpUser && smtpPassword);
}

