/**
 * Utilidad para validar granja con caché
 * Reemplaza las validaciones repetidas de granja en los controladores
 */

import { Response } from 'express';
import { getGranjaCached } from '../middleware/granjaCache';

interface ValidationResult {
  isValid: boolean;
  granja?: { id: string; idUsuario: string; nombreGranja: string };
  error?: { status: number; message: string };
}

/**
 * Validar que una granja pertenece a un usuario (con caché)
 */
export async function validateGranja(
  idGranja: string,
  idUsuario: string
): Promise<ValidationResult> {
  if (!idGranja) {
    return {
      isValid: false,
      error: { status: 400, message: 'idGranja es requerido' }
    };
  }

  if (!idUsuario) {
    return {
      isValid: false,
      error: { status: 401, message: 'Usuario no autenticado' }
    };
  }

  const granja = await getGranjaCached(idGranja, idUsuario);

  if (!granja) {
    return {
      isValid: false,
      error: { status: 404, message: 'Granja no encontrada' }
    };
  }

  return {
    isValid: true,
    granja
  };
}

/**
 * Helper para enviar respuesta de error si la validación falla
 */
export function sendValidationError(
  res: Response,
  validation: ValidationResult
): boolean {
  if (!validation.isValid && validation.error) {
    res.status(validation.error.status).json({ error: validation.error.message });
    return true; // Error enviado
  }
  return false; // No hay error
}




