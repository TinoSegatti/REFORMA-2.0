/**
 * Servicio de Email
 * Maneja el envío de correos electrónicos
 */

import nodemailer from 'nodemailer';
import crypto from 'crypto';

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

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true para 465, false para otros puertos
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    // Timeouts más largos para conexiones lentas o con problemas de red
    connectionTimeout: 30000, // 30 segundos para establecer conexión
    greetingTimeout: 30000, // 30 segundos para saludo SMTP
    socketTimeout: 30000, // 30 segundos para operaciones de socket
    // Opciones adicionales para mejorar la conexión
    tls: {
      // No rechazar conexiones no autorizadas (útil para desarrollo)
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      // Ciphers permitidos
      ciphers: 'SSLv3',
    },
    // Pool de conexiones
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
  });

  return transporter;
}

/**
 * Generar token de verificación
 */
export function generarTokenVerificacion(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Enviar email de verificación
 */
export async function enviarEmailVerificacion(
  email: string,
  nombreUsuario: string,
  tokenVerificacion: string
): Promise<void> {
  const transporter = initializeTransporter();

  if (!transporter) {
    throw new Error('Servicio de email no configurado. Contacta al administrador.');
  }

  // Obtener URL del frontend y asegurar que tenga protocolo
  let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Si la URL no tiene protocolo, agregar https:// (asumimos producción)
  if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
    frontendUrl = `https://${frontendUrl}`;
  }
  
  const urlVerificacion = `${frontendUrl}/verificar-email?token=${tokenVerificacion}`;

  const mailOptions = {
    from: `"REFORMA" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verifica tu cuenta de REFORMA',
    html: `
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
    `,
    text: `
      ¡Bienvenido a REFORMA!
      
      Hola ${nombreUsuario},
      
      Gracias por registrarte en REFORMA. Para completar tu registro, por favor verifica tu dirección de correo electrónico visitando el siguiente enlace:
      
      ${urlVerificacion}
      
      Este enlace expirará en 24 horas.
      
      Si no creaste esta cuenta, puedes ignorar este correo.
      
      © 2024 REFORMA - Sistema de Gestión de Granjas
    `,
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
      console.error('   ⚠️  Error de conexión. Verifica:');
      console.error('      - Que SMTP_HOST sea correcto (smtp.gmail.com)');
      console.error('      - Que SMTP_PORT sea correcto (587 o 465)');
      console.error('      - Que el servidor tenga acceso a internet');
      console.error('      - Si estás en desarrollo local, puede haber restricciones de firewall');
      console.error('      - Gmail puede bloquear conexiones desde ciertas IPs o redes');
      console.error('      - Intenta usar el puerto 465 con SMTP_SECURE=true');
      console.error('      - O considera usar un servicio de email profesional (SendGrid, Mailgun)');
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

