/**
 * Servicio de Autenticación con Google
 * Maneja la lógica de autenticación OAuth con Google
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface GoogleUserInfo {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

/**
 * Busca o crea un usuario basado en la información de Google
 */
export async function findOrCreateGoogleUser(googleInfo: GoogleUserInfo) {
  try {
    // Buscar usuario existente por googleId
    let usuario = await prisma.usuario.findUnique({
      where: { googleId: googleInfo.id }
    });

    // Si no existe por googleId, buscar por email
    if (!usuario) {
      usuario = await prisma.usuario.findUnique({
        where: { email: googleInfo.email }
      });

      // Si existe por email pero no tiene googleId, actualizar
      if (usuario && !usuario.googleId) {
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            googleId: googleInfo.id,
            // Actualizar nombre si viene de Google
            nombreUsuario: googleInfo.given_name || usuario.nombreUsuario,
            apellidoUsuario: googleInfo.family_name || usuario.apellidoUsuario,
            emailVerificado: true, // Google ya verifica el email
            activo: true, // Activar cuenta si estaba inactiva
            ultimoAcceso: new Date()
          },
          select: {
            id: true,
            email: true,
            nombreUsuario: true,
            apellidoUsuario: true,
            tipoUsuario: true,
            planSuscripcion: true
          }
        });
      }
    }

    // Si no existe, crear nuevo usuario
    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          email: googleInfo.email,
          googleId: googleInfo.id,
          nombreUsuario: googleInfo.given_name || 'Usuario',
          apellidoUsuario: googleInfo.family_name || 'Google',
          passwordHash: null, // No tiene contraseña, solo Google
          tipoUsuario: 'CLIENTE',
          planSuscripcion: 'PLAN_0',
          emailVerificado: true, // Google ya verifica el email
          activo: true,
          ultimoAcceso: new Date()
        },
        select: {
          id: true,
          email: true,
          nombreUsuario: true,
          apellidoUsuario: true,
          tipoUsuario: true,
          planSuscripcion: true
        }
      });
    } else {
      // Actualizar último acceso
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { ultimoAcceso: new Date() }
      });
    }

    return usuario;
  } catch (error: any) {
    console.error('Error en findOrCreateGoogleUser:', error);
    throw new Error('Error al procesar autenticación con Google');
  }
}

/**
 * Genera un token JWT para el usuario
 */
export function generateToken(usuario: {
  id: string;
  email: string;
  tipoUsuario: string;
}): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no configurado');
  }

  return jwt.sign(
    {
      userId: usuario.id,
      email: usuario.email,
      tipo: usuario.tipoUsuario
    },
    JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRATION || '24h'
    } as jwt.SignOptions
  );
}

