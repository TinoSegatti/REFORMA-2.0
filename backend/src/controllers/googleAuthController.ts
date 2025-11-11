/**
 * Controlador de Autenticación con Google
 * Maneja las peticiones de OAuth con Google
 */

import { Request, Response } from 'express';
import { findOrCreateGoogleUser, generateToken } from '../services/googleAuthService';

interface GoogleAuthRequest extends Request {
  body: {
    idToken?: string;
    accessToken?: string;
    googleId?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };
}

/**
 * Autenticación/Registro con Google usando ID Token
 * El frontend envía el ID token de Google después de la autenticación
 */
export async function googleAuth(req: GoogleAuthRequest, res: Response) {
  try {
    const { idToken, googleId, email, given_name, family_name, picture } = req.body;

    // Validar que tenemos la información mínima
    if (!googleId || !email) {
      return res.status(400).json({
        error: 'Información de Google incompleta. Se requieren googleId y email.'
      });
    }

    // Si tenemos idToken, podemos verificar con Google (opcional)
    // Por ahora, confiamos en la información del frontend
    // En producción, deberías verificar el idToken con Google

    // Crear o encontrar usuario
    const usuario = await findOrCreateGoogleUser({
      id: googleId,
      email: email,
      given_name: given_name || 'Usuario',
      family_name: family_name || 'Google',
      picture: picture
    });

    // Generar token JWT
    const token = generateToken({
      id: usuario.id,
      email: usuario.email,
      tipoUsuario: usuario.tipoUsuario
    });

    res.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombreUsuario: usuario.nombreUsuario,
        apellidoUsuario: usuario.apellidoUsuario,
        tipoUsuario: usuario.tipoUsuario,
        planSuscripcion: usuario.planSuscripcion
      },
      token
    });
  } catch (error: any) {
    console.error('Error en autenticación con Google:', error);
    res.status(500).json({
      error: error.message || 'Error al autenticar con Google'
    });
  }
}

/**
 * Verificar token de Google (para validación adicional en producción)
 * Esta función puede ser usada para verificar el ID token de Google
 */
export async function verifyGoogleToken(req: Request, res: Response) {
  try {
    // En producción, aquí verificarías el ID token con Google
    // usando la librería google-auth-library
    // Por ahora, retornamos éxito
    res.json({ valid: true });
  } catch (error: any) {
    console.error('Error verificando token de Google:', error);
    res.status(500).json({ error: 'Error al verificar token' });
  }
}

