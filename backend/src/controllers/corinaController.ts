/**
 * Controlador para el sistema CORINA
 * Maneja las peticiones HTTP relacionadas con CORINA
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { CorinaService } from '../services/corinaService';
import { validarFirmaTwilio } from '../utils/corinaUtils';
import { DatosExtraidosNLP } from '../types/corina';
import { Prisma } from '@prisma/client';

/**
 * Handler para el status callback de Twilio
 * Recibe actualizaciones de estado de mensajes enviados
 */
export async function handleWhatsAppStatus(req: Request, res: Response) {
  try {
    // Twilio envía datos como form-urlencoded
    const body = req.body.toString();
    const params = new URLSearchParams(body);

    const messageSid = params.get('MessageSid');
    const messageStatus = params.get('MessageStatus');
    const to = params.get('To');

    console.log('📊 Status callback recibido:');
    console.log('  Message SID:', messageSid);
    console.log('  Status:', messageStatus);
    console.log('  To:', to);

    // Actualizar notificación en BD si existe
    if (messageSid) {
      const { prisma } = await import('../config/database');
      await prisma.corinaNotificacion.updateMany({
        where: {
          twilioMessageSid: messageSid,
        },
        data: {
          estadoNotificacion:
            messageStatus === 'delivered'
              ? 'ENTREGADA'
              : messageStatus === 'failed'
              ? 'FALLIDA'
              : 'ENVIADA',
          fechaEntrega:
            messageStatus === 'delivered' ? new Date() : undefined,
          fechaError:
            messageStatus === 'failed' ? new Date() : undefined,
        },
      });
    }

    // Responder a Twilio (requerido)
    res.status(200).send('OK');
  } catch (error: any) {
    console.error('❌ Error procesando status callback:', error);
    res.status(500).send('Error');
  }
}

/**
 * Handler para el webhook de Twilio
 * Recibe mensajes de WhatsApp y los procesa
 */
export async function handleWhatsAppWebhook(req: Request, res: Response) {
  try {
    // Verificar si CORINA está habilitado
    const corinaEnabled = process.env.CORINA_ENABLED === 'true';
    if (!corinaEnabled) {
      console.log('⚠️ CORINA está deshabilitado (CORINA_ENABLED !== true)');
      // Responder a Twilio para que no reintente, pero sin procesar el mensaje
      res.type('text/xml');
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      return;
    }

    // Twilio envía datos como form-urlencoded
    // El body viene como Buffer desde express.raw()
    let body: string;
    
    if (Buffer.isBuffer(req.body)) {
      body = req.body.toString('utf-8');
    } else if (typeof req.body === 'string') {
      body = req.body;
    } else if (typeof req.body === 'object' && req.body !== null) {
      // Si ya está parseado (no debería pasar con express.raw, pero por si acaso)
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(req.body)) {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      }
      body = searchParams.toString();
    } else {
      console.error('❌ Tipo de body no reconocido:', typeof req.body);
      res.type('text/xml');
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      return;
    }

    console.log('🔍 Raw body recibido (primeros 500 chars):', body.substring(0, 500));
    console.log('🔍 Tipo de body:', typeof req.body, Buffer.isBuffer(req.body) ? '(Buffer)' : '');

    const params = new URLSearchParams(body);

    // Validar firma de Twilio (seguridad)
    const signature = req.headers['x-twilio-signature'] as string | null;
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    // En desarrollo, permitir sin validación si no hay authToken configurado
    // En producción, siempre validar
    if (authToken && process.env.NODE_ENV === 'production') {
      const isValid = validarFirmaTwilio(signature, fullUrl, params, authToken);
      if (!isValid) {
        console.error('❌ Firma de Twilio inválida - rechazando webhook');
        return res.status(403).send('Forbidden');
      }
    }

    // Extraer datos del mensaje
    const from = params.get('From'); // Número que envió el mensaje (whatsapp:+5493515930163)
    const to = params.get('To'); // Número de Twilio
    const bodyMessage = params.get('Body'); // Texto del mensaje
    const numMedia = params.get('NumMedia'); // Número de archivos adjuntos
    const messageSid = params.get('MessageSid'); // SID único del mensaje

    console.log('📱 Mensaje recibido de WhatsApp:');
    console.log('  Message SID:', messageSid);
    console.log('  De:', from);
    console.log('  Para:', to);
    console.log('  Mensaje:', bodyMessage);
    console.log('  Archivos adjuntos:', numMedia);
    console.log('  Todos los parámetros:', Object.fromEntries(params));

    if (!from) {
      console.warn('⚠️ No se recibió número de origen');
      res.type('text/xml');
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      return;
    }

    // Detectar tipo de mensaje
    let mediaUrl: string | null = null;
    let mediaContentType: string | null = null;
    let mediaSid: string | null = null;

    if (numMedia && parseInt(numMedia) > 0) {
      mediaUrl = params.get(`MediaUrl0`);
      mediaContentType = params.get(`MediaContentType0`);
      mediaSid = params.get(`MediaSid0`);
      console.log('  Media URL:', mediaUrl);
      console.log('  Media Type:', mediaContentType);
      console.log('  Media SID:', mediaSid);
    }

    // Determinar tipo de mensaje y procesarlo
    if (mediaUrl && mediaContentType) {
      // Mensaje con archivo adjunto (audio, imagen, etc.)
      const isAudio = mediaContentType.startsWith('audio/') || 
                      mediaContentType.includes('ogg') ||
                      mediaContentType.includes('mpeg') ||
                      mediaContentType.includes('mp3') ||
                      mediaContentType.includes('wav');

      if (isAudio) {
        // Procesar audio
        console.log('🎤 Procesando mensaje de audio...');
        await procesarMensajeAudio(from, mediaUrl, mediaSid, messageSid);
      } else {
        // Otro tipo de archivo (imagen, documento, etc.)
        console.log('📎 Archivo no soportado:', mediaContentType);
        const { CorinaNotificacionService } = await import('../services/corinaNotificacionService');
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          from,
          '❌ CORINA\n\nLo siento, solo puedo procesar mensajes de texto y audio. Por favor, envía un mensaje de voz o texto.'
        );
      }
    } else if (bodyMessage) {
      // Mensaje de texto
      console.log('💬 Procesando mensaje de texto...');
      await procesarMensajeTexto(from, bodyMessage);
    } else {
      // Mensaje sin contenido reconocible
      console.log('⚠️ Mensaje sin contenido reconocible');
      const { CorinaNotificacionService } = await import('../services/corinaNotificacionService');
      await CorinaNotificacionService.enviarMensajeWhatsApp(
        from,
        '❌ CORINA\n\nNo pude procesar tu mensaje. Por favor, envía un mensaje de texto o audio.'
      );
    }

    // Responder a Twilio (requerido)
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error: any) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).send('Error');
  }
}

/**
 * Procesar mensaje de audio recibido por WhatsApp
 */
async function procesarMensajeAudio(
  from: string,
  mediaUrl: string,
  mediaSid: string | null,
  messageSid: string | null
) {
  try {
    const { CorinaService } = await import('../services/corinaService');
    
    // Enviar mensaje de confirmación al usuario
    const { CorinaNotificacionService } = await import('../services/corinaNotificacionService');
    await CorinaNotificacionService.enviarMensajeWhatsApp(
      from,
      '🎤 CORINA\n\nAudio recibido. Procesando...\n\nPor favor espera mientras transcribo tu mensaje.'
    );

    // Procesar audio usando CorinaService
    await CorinaService.procesarAudio(mediaUrl, from, mediaSid, messageSid);
  } catch (error: any) {
    console.error('❌ Error procesando audio:', error);
    const { CorinaNotificacionService } = await import('../services/corinaNotificacionService');
    
    // El servicio ya maneja el error de cuota y envía mensaje al usuario
    // Solo enviamos mensaje genérico si no es error de cuota
    if (!error.message?.includes('QUOTA_EXCEEDED') && !error.message?.includes('quota')) {
      await CorinaNotificacionService.enviarMensajeWhatsApp(
        from,
        '❌ CORINA\n\nLo siento, hubo un error al procesar tu audio. Por favor, intenta nuevamente o envía un mensaje de texto.\n\nEjemplo: "CORINA alertas" o "Quiero ver las alertas de inventario".'
      );
    }
  }
}

/**
 * Procesar mensaje de texto recibido por WhatsApp
 * Detecta comandos y responde apropiadamente
 * También puede ser llamado con texto transcrito de audio
 */
export async function procesarMensajeTexto(from: string, mensaje: string) {
  try {
    const { prisma } = await import('../config/database');
    const { CorinaNotificacionService } = await import('../services/corinaNotificacionService');

    // Normalizar mensaje (minúsculas, sin acentos)
    const mensajeNormalizado = mensaje.toLowerCase().trim();

    // Buscar usuario por teléfono
    const usuario = await prisma.usuario.findFirst({
      where: {
        telefono: from, // from ya viene con formato whatsapp:+5493515930163
        telefonoVerificado: true,
      },
      include: {
        granjas: {
          where: {
            activa: true,
          },
          orderBy: {
            nombreGranja: 'asc',
          },
        },
      },
    });

    if (!usuario) {
      // Usuario no encontrado o teléfono no verificado
      await CorinaNotificacionService.enviarMensajeWhatsApp(
        from,
        '❌ CORINA\n\nNo se encontró tu cuenta o tu teléfono no está verificado.\n\nPor favor, verifica tu teléfono desde la aplicación web.'
      );
      return;
    }

    // Función auxiliar para encontrar granja por número o nombre
    // Debe estar definida ANTES de su primer uso
    const encontrarGranjaPorNumeroONombre = (
      mensaje: string,
      granjasListadas: Array<{ numero: number; id: string; nombre: string }>
    ): { id: string; nombre: string } | null => {
      // Buscar número en el mensaje (solo si está al inicio o después de palabras clave)
      const patronNumero = /(?:^|\s)(?:la\s+)?(?:planta\s+)?(\d+)(?:\s|$)/i;
      const matchNumero = mensaje.match(patronNumero);
      if (matchNumero) {
        const numeroSeleccionado = parseInt(matchNumero[1]);
        if (!isNaN(numeroSeleccionado) && numeroSeleccionado > 0 && numeroSeleccionado <= granjasListadas.length) {
          console.log(`🔢 Granja encontrada por número: ${numeroSeleccionado} - ${granjasListadas[numeroSeleccionado - 1].nombre}`);
          return granjasListadas[numeroSeleccionado - 1];
        }
      }

      // Buscar nombre de planta en el mensaje (comparación más estricta)
      // Solo buscar después de palabras clave como "en", "de", "para", "granja", "planta"
      const palabrasClaveGranja = /\b(en|de|para|granja|planta)\s+([a-záéíóúñ\s\.]+)/gi;
      let matchPalabraClave = palabrasClaveGranja.exec(mensaje);
      
      while (matchPalabraClave) {
        const textoDespuesClave = matchPalabraClave[2].trim().toLowerCase();
        
        for (const granja of granjasListadas) {
          const nombreNormalizado = granja.nombre.toLowerCase().trim();
          
          // Verificar si el nombre completo está en el texto después de la palabra clave
          if (textoDespuesClave.includes(nombreNormalizado) || nombreNormalizado.includes(textoDespuesClave)) {
            console.log(`✅ Granja encontrada por nombre después de palabra clave: ${granja.nombre}`);
            return granja;
          }
          
          // Verificar palabras clave del nombre (solo palabras de más de 3 caracteres)
          const palabrasNombre = nombreNormalizado.split(/\s+/).filter(p => p.length > 3);
          const palabrasTexto = textoDespuesClave.split(/\s+/).filter(p => p.length > 3);
          
          // Verificar si todas las palabras importantes del nombre están en el texto
          if (palabrasNombre.length > 0 && palabrasNombre.every(palabra => 
            palabrasTexto.some(texto => texto.includes(palabra) || palabra.includes(texto))
          )) {
            console.log(`✅ Granja encontrada por palabras clave: ${granja.nombre}`);
            return granja;
          }
        }
        
        matchPalabraClave = palabrasClaveGranja.exec(mensaje);
      }

      // Si no se encontró con palabras clave, buscar directamente en el mensaje completo
      // pero solo si el nombre completo está presente (más estricto)
      for (const granja of granjasListadas) {
        const nombreNormalizado = granja.nombre.toLowerCase().trim();
        // Solo considerar coincidencia si el nombre completo está en el mensaje
        // y tiene al menos 4 caracteres (para evitar falsos positivos con palabras cortas)
        if (nombreNormalizado.length >= 4 && mensaje.includes(nombreNormalizado)) {
          console.log(`✅ Granja encontrada por nombre completo en mensaje: ${granja.nombre}`);
          return granja;
        }
      }

      console.log(`❌ No se encontró ninguna granja en el mensaje: "${mensaje}"`);
      return null;
    };

    // PRIORIDAD 1: Verificar si hay una interacción pendiente de CREACION_REGISTRO esperando selección de granja
    // Esto debe ir ANTES de las consultas para que los números no se interpreten como consultas
    const interaccionCreacionEsperandoGranja = await prisma.corinaInteraccion.findFirst({
      where: {
        idUsuario: usuario.id,
        tipoInteraccion: 'CREACION_REGISTRO',
        estadoInteraccion: 'PROCESANDO',
        fechaInteraccion: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Últimos 30 minutos
        },
        datosExtraidos: {
          path: ['esperandoSeleccionGranja'],
          equals: true,
        },
      },
      orderBy: {
        fechaInteraccion: 'desc',
      },
    });

    // Si hay interacción esperando selección de granja, procesar la selección PRIMERO
    if (interaccionCreacionEsperandoGranja) {
      const datosExtraidos = interaccionCreacionEsperandoGranja.datosExtraidos as any;
      const granjasListadas = datosExtraidos?.granjasListadas || [];
      const tipoComando = datosExtraidos?.tipoComando || 'CREAR_MATERIA_PRIMA';
      const mensajeOriginal = interaccionCreacionEsperandoGranja.mensajeRecibido || mensaje;

      const granjaEncontrada = encontrarGranjaPorNumeroONombre(mensajeNormalizado, granjasListadas);

      if (granjaEncontrada) {
        // Granja seleccionada - continuar con el proceso de creación usando el mensaje original
        const { CorinaService } = await import('../services/corinaService');
        
        // Mapear tipo de comando a tabla destino
        const tablaDestinoMap: Record<string, string> = {
          'CREAR_MATERIA_PRIMA': 'materiaPrima',
          'CREAR_PIENSO': 'animal',
          'CREAR_PROVEEDOR': 'proveedor',
          'CREAR_FORMULA': 'formula',
          'CREAR_COMPRA': 'compra',
          'CREAR_FABRICACION': 'fabricacion',
        };

        const tablaDestino = tablaDestinoMap[tipoComando] || 'materiaPrima';

        // Extraer datos del mensaje original
        let datosExtraidosNLP: DatosExtraidosNLP;
        try {
          console.log(`📝 Extrayendo datos para comando: ${tipoComando} (granja: ${granjaEncontrada.nombre})`);
          datosExtraidosNLP = await CorinaService.extraerDatos(mensajeOriginal, tipoComando);
          console.log(`✅ Datos extraídos: ${JSON.stringify(datosExtraidosNLP.datos)}`);
        } catch (extraccionError: any) {
          console.error('Error extrayendo datos:', extraccionError);
          
          if (extraccionError.message === 'QUOTA_EXCEEDED') {
            await CorinaNotificacionService.enviarMensajeWhatsApp(
              from,
              '❌ CORINA\n\nLo siento, la cuota de OpenAI se ha agotado.\n\n' +
              'Por favor, intenta más tarde o usa la aplicación web para crear registros.'
            );
            return;
          }
          
          datosExtraidosNLP = {
            tablaDestino: tablaDestino,
            datos: { mensajeOriginal },
            confianza: 0.3,
          };
        }

        // Normalizar y validar datos
        let datosNormalizados: Record<string, any> = datosExtraidosNLP.datos;
        let erroresNormalizacion: string[] = [];
        let advertenciasNormalizacion: string[] = [];

        try {
          console.log(`🔧 Normalizando datos para: ${tablaDestino}`);
          const normalizacion = await CorinaService.normalizarDatos(datosExtraidosNLP, granjaEncontrada.id);
          datosNormalizados = normalizacion.datosNormalizados;
          erroresNormalizacion = normalizacion.errores;
          advertenciasNormalizacion = normalizacion.advertencias;
        } catch (normalizacionError: any) {
          console.error('Error normalizando datos:', normalizacionError);
          erroresNormalizacion.push(`Error al normalizar datos: ${normalizacionError.message}`);
        }

        // Validar datos
        const datosParaValidar: DatosExtraidosNLP = {
          tablaDestino: tablaDestino,
          datos: datosNormalizados,
          confianza: datosExtraidosNLP.confianza,
        };

        const validacion = await CorinaService.validarDatos(datosParaValidar, granjaEncontrada.id);
        
        if (erroresNormalizacion.length > 0) {
          if (!validacion.errores) {
            validacion.errores = [];
          }
          validacion.errores.push(...erroresNormalizacion);
          validacion.esValido = false;
        }

        if (!validacion.esValido) {
          // Hay errores - solicitar corrección
          let mensajeRespuesta = CorinaService.generarMensajeSolicitudDatos(
            tablaDestino,
            validacion.camposFaltantes || []
          );

          const todosLosErrores = [
            ...(erroresNormalizacion || []),
            ...(validacion.errores || []),
          ];

          if (todosLosErrores.length > 0) {
            mensajeRespuesta += '\n\n❌ Errores encontrados:\n';
            todosLosErrores.forEach((error, index) => {
              mensajeRespuesta += `${index + 1}. ${error}\n`;
            });
          }

          await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajeRespuesta);

          await prisma.corinaInteraccion.update({
            where: { id: interaccionCreacionEsperandoGranja.id },
            data: {
              idGranja: granjaEncontrada.id,
              estadoInteraccion: 'PROCESANDO',
              mensajeRecibido: mensajeOriginal,
              datosExtraidos: {
                tipoComando,
                tablaDestino,
                datos: datosNormalizados,
                esperandoSeleccionGranja: false,
                granjaSeleccionada: {
                  id: granjaEncontrada.id,
                  nombre: granjaEncontrada.nombre,
                },
                validacion: {
                  esValido: false,
                  camposFaltantes: validacion.camposFaltantes,
                  errores: validacion.errores,
                },
              },
            },
          });

          return;
        } else {
          // Datos válidos - mostrar preview y pedir confirmación
          const mensajePreview = await CorinaService.generarMensajePreview(
            tablaDestino,
            datosNormalizados,
            advertenciasNormalizacion
          );

          await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajePreview);

          // Workaround: intentar usar ESPERANDO_CONFIRMACION, si falla usar PROCESANDO
          try {
            await prisma.$executeRaw`
              UPDATE "t_corina_interaccion"
              SET "idGranja" = ${granjaEncontrada.id},
                  "estadoInteraccion" = 'ESPERANDO_CONFIRMACION'::"EstadoInteraccionCorina",
                  "mensajeRecibido" = ${mensajeOriginal},
                  "datosExtraidos" = ${JSON.stringify({
                    tipoComando,
                    tablaDestino,
                    datos: datosNormalizados,
                    esperandoSeleccionGranja: false,
                    granjaSeleccionada: {
                      id: granjaEncontrada.id,
                      nombre: granjaEncontrada.nombre,
                    },
                    validacion: {
                      esValido: true,
                    },
                    esperandoConfirmacion: true, // Marcar explícitamente
                  })}::jsonb
              WHERE "id" = ${interaccionCreacionEsperandoGranja.id}
            `;
          } catch (error: any) {
            // Si el enum no existe, usar PROCESANDO y marcar en datosExtraidos
            if (error.code === 'P2010' || error.message?.includes('ESPERANDO_CONFIRMACION')) {
              console.warn('⚠️ Enum ESPERANDO_CONFIRMACION no existe, usando PROCESANDO como fallback');
              await prisma.corinaInteraccion.update({
                where: { id: interaccionCreacionEsperandoGranja.id },
                data: {
                  idGranja: granjaEncontrada.id,
                  estadoInteraccion: 'PROCESANDO',
                  mensajeRecibido: mensajeOriginal,
                  datosExtraidos: {
                    tipoComando,
                    tablaDestino,
                    datos: datosNormalizados,
                    esperandoSeleccionGranja: false,
                    granjaSeleccionada: {
                      id: granjaEncontrada.id,
                      nombre: granjaEncontrada.nombre,
                    },
                    validacion: {
                      esValido: true,
                    },
                    esperandoConfirmacion: true, // Marcar explícitamente para búsqueda posterior
                  },
                },
              });
            } else {
              throw error; // Re-lanzar otros errores
            }
          }

          return;
        }
      } else {
        // No se encontró granja válida
        let mensajeError = `❌ CORINA\n\nNo pude identificar la planta.\n\nPor favor, responde con el número (ej: "1", "la planta 2") o el nombre de la planta.\n\nPlantas disponibles:\n\n`;
        granjasListadas.forEach((granja: { numero: number; id: string; nombre: string }) => {
          mensajeError += `${granja.numero}- ${granja.nombre}\n`;
        });
        
        await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajeError);
        return;
      }
    }

    // PRIORIDAD 2: Verificar si hay una interacción pendiente (listado reciente de granjas)
    // Aumentamos el tiempo a 30 minutos para permitir múltiples consultas de la misma lista
    // y permitimos tanto PROCESANDO como COMPLETADA (para permitir consultas adicionales)
    // Buscar cualquier tipo de consulta pendiente
    // NOTA: Temporalmente solo buscamos CONSULTA_ALERTAS hasta que se ejecute la migración SQL
    const interaccionPendiente = await prisma.corinaInteraccion.findFirst({
      where: {
        idUsuario: usuario.id,
        tipoInteraccion: {
          in: [
            'CONSULTA_ALERTAS',
            'CONSULTA_INVENTARIO',
            // Los siguientes valores se agregarán después de ejecutar la migración SQL:
            // 'CONSULTA_MATERIAS_PRIMAS',
            // 'CONSULTA_COMPRAS',
            // 'CONSULTA_FORMULAS',
            // 'CONSULTA_FABRICACIONES',
            // 'CONSULTA_PROVEEDORES',
            // 'CONSULTA_ANIMALES',
          ],
        },
        estadoInteraccion: {
          in: ['PROCESANDO', 'COMPLETADA'], // Permitir consultas adicionales incluso si ya se completó una
        },
        fechaInteraccion: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Últimos 30 minutos (suficiente para hasta 25 consultas)
        },
      },
      orderBy: {
        fechaInteraccion: 'desc',
      },
    });

    // Función auxiliar ya definida arriba (línea ~240)

    // Si hay interacción pendiente, verificar primero si el mensaje es una nueva consulta
    // Si contiene palabras clave de otras consultas, ignorar la interacción pendiente
    const palabrasClaveNuevasConsultas = [
      'compra', 'compras', 'factura', 'facturas',
      'materia', 'materias', 'materia prima', 'materias primas',
      'formula', 'formulas', 'fórmula', 'fórmulas',
      'fabricacion', 'fabricaciones', 'fabricación', 'fabricaciones',
      'proveedor', 'proveedores',
      'animal', 'animales', 'pienso', 'piensos',
      'inventario', 'stock', 'informe',
      'alerta', 'alertas',
    ];
    
    const esNuevaConsulta = palabrasClaveNuevasConsultas.some(palabra => 
      mensajeNormalizado.includes(palabra)
    );
    
    // Solo procesar interacción pendiente si NO es una nueva consulta
    // (es decir, si parece ser una respuesta a la lista anterior)
    if (interaccionPendiente && interaccionPendiente.datosExtraidos && !esNuevaConsulta) {
      const datosExtraidos = interaccionPendiente.datosExtraidos as any;
      const granjasListadas = datosExtraidos?.granjasListadas || [];
      
      const granjaEncontrada = encontrarGranjaPorNumeroONombre(mensajeNormalizado, granjasListadas);
      
      if (granjaEncontrada) {
        // Actualizar interacción - mantenerla en PROCESANDO para permitir más consultas
        const esPrimeraConsulta = interaccionPendiente.estadoInteraccion === 'PROCESANDO' && !interaccionPendiente.fechaCompletada;
        
        await prisma.corinaInteraccion.update({
          where: { id: interaccionPendiente.id },
          data: {
            estadoInteraccion: 'PROCESANDO',
            fechaCompletada: esPrimeraConsulta ? new Date() : interaccionPendiente.fechaCompletada,
            respuestaCorina: `Granja seleccionada: ${granjaEncontrada.nombre}`,
            mensajeRecibido: mensaje,
          },
        });

        // Ejecutar la consulta según el tipo de interacción
        // Si el tipo real está en datosExtraidos (workaround temporal), usarlo
        try {
          const datosExtraidos = interaccionPendiente.datosExtraidos as any;
          const tipoConsultaReal = datosExtraidos?.tipoConsultaReal || interaccionPendiente.tipoInteraccion;
          const tipoConsulta = tipoConsultaReal as string;
          
          switch (tipoConsulta) {
            case 'CONSULTA_ALERTAS':
              await CorinaNotificacionService.enviarListadoAlertas(usuario.id, granjaEncontrada.id);
              break;
            case 'CONSULTA_MATERIAS_PRIMAS':
              await CorinaNotificacionService.enviarListadoMateriasPrimas(usuario.id, granjaEncontrada.id);
              break;
            case 'CONSULTA_COMPRAS':
              await CorinaNotificacionService.enviarListadoCompras(usuario.id, granjaEncontrada.id);
              break;
            case 'CONSULTA_FORMULAS':
              await CorinaNotificacionService.enviarListadoFormulas(usuario.id, granjaEncontrada.id);
              break;
            case 'CONSULTA_FABRICACIONES':
              await CorinaNotificacionService.enviarListadoFabricaciones(usuario.id, granjaEncontrada.id);
              break;
            case 'CONSULTA_PROVEEDORES':
              await CorinaNotificacionService.enviarListadoProveedores(usuario.id, granjaEncontrada.id);
              break;
            case 'CONSULTA_ANIMALES':
              await CorinaNotificacionService.enviarListadoAnimales(usuario.id, granjaEncontrada.id);
              break;
            case 'CONSULTA_INVENTARIO':
              await CorinaNotificacionService.enviarInformeInventario(usuario.id, granjaEncontrada.id);
              break;
          }
          
          // Enviar mensaje de confirmación con opción de consultar otra granja
          if (granjasListadas.length > 1) {
            await CorinaNotificacionService.enviarMensajeWhatsApp(
              from,
              `✅ CORINA\n\nConsulta enviada para: ${granjaEncontrada.nombre}\n\n¿Necesitas consultar otra planta? Responde con el número o nombre.`
            );
          }
        } catch (error: any) {
          await CorinaNotificacionService.enviarMensajeWhatsApp(
            from,
            `❌ CORINA\n\nError al obtener la información. Por favor, intenta más tarde.`
          );
        }
        return;
      } else {
        // No se encontró número ni nombre válido
        let mensajeError = `❌ CORINA\n\nNo pude identificar la planta.\n\nPor favor, responde con el número (ej: "1", "la planta 2") o el nombre de la planta.\n\nPlantas disponibles:\n\n`;
        granjasListadas.forEach((granja: { numero: number; id: string; nombre: string }) => {
          mensajeError += `${granja.numero}- ${granja.nombre}\n`;
        });
        
        await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajeError);
        return;
      }
    }

    // Detectar comandos de consulta de alertas (debe contener la palabra "alerta")
    const tienePalabraAlerta = mensajeNormalizado.includes('alerta') || 
                                mensajeNormalizado.includes('alertas');

    if (tienePalabraAlerta) {
      // Procesar consulta de alertas
      if (usuario.granjas.length === 0) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          from,
          '❌ CORINA\n\nNo tienes granjas activas configuradas.'
        );
        return;
      }

      // Preparar listado de granjas para búsqueda
      const granjasListadas = usuario.granjas.map((g, index) => ({
        numero: index + 1,
        id: g.id,
        nombre: g.nombreGranja,
      }));

      // Función auxiliar para encontrar granja por número o nombre
      const encontrarGranjaPorNumeroONombre = (
        mensaje: string,
        granjas: Array<{ numero: number; id: string; nombre: string }>
      ): { id: string; nombre: string } | null => {
        // Buscar número en el mensaje
        const numerosEnMensaje = mensaje.match(/\d+/g);
        if (numerosEnMensaje && numerosEnMensaje.length > 0) {
          const numeroSeleccionado = parseInt(numerosEnMensaje[0]);
          if (!isNaN(numeroSeleccionado) && numeroSeleccionado > 0 && numeroSeleccionado <= granjas.length) {
            return granjas[numeroSeleccionado - 1];
          }
        }

        // Buscar nombre de planta en el mensaje (comparación flexible)
        for (const granja of granjas) {
          const nombreNormalizado = granja.nombre.toLowerCase().trim();
          // Verificar si el nombre completo está en el mensaje
          if (mensaje.includes(nombreNormalizado)) {
            return granja;
          }
          // Verificar palabras clave del nombre (para nombres compuestos como "PORCINO S.A.")
          const palabrasNombre = nombreNormalizado.split(/\s+/);
          const palabrasSignificativas = palabrasNombre.filter(p => p.length > 2); // Filtrar palabras muy cortas
          if (palabrasSignificativas.length > 0) {
            const todasLasPalabrasEnMensaje = palabrasSignificativas.every(palabra => 
              mensaje.includes(palabra)
            );
            if (todasLasPalabrasEnMensaje) {
              return granja;
            }
          }
        }

        return null;
      };

      // Intentar encontrar granja específica en el mensaje
      const granjaEncontrada = encontrarGranjaPorNumeroONombre(mensajeNormalizado, granjasListadas);

      // Si solo tiene una granja, enviar alertas directamente
      if (usuario.granjas.length === 1) {
        const idGranja = usuario.granjas[0].id;
        try {
          await CorinaNotificacionService.enviarListadoAlertas(usuario.id, idGranja);
        } catch (error: any) {
          await CorinaNotificacionService.enviarMensajeWhatsApp(
            from,
            '❌ CORINA\n\nError al obtener las alertas. Por favor, intenta más tarde.'
          );
        }
        return;
      }

      // Si tiene múltiples granjas y encontró una específica, enviar alertas directamente
      if (granjaEncontrada) {
        try {
          await CorinaNotificacionService.enviarListadoAlertas(usuario.id, granjaEncontrada.id);
        } catch (error: any) {
          await CorinaNotificacionService.enviarMensajeWhatsApp(
            from,
            '❌ CORINA\n\nError al obtener las alertas. Por favor, intenta más tarde.'
          );
        }
        return;
      }

      // Si tiene múltiples granjas pero no especificó cuál, preguntar cuál quiere consultar
      // Primero, cerrar cualquier interacción anterior del mismo tipo que esté activa
      await prisma.corinaInteraccion.updateMany({
        where: {
          idUsuario: usuario.id,
          tipoInteraccion: 'CONSULTA_ALERTAS',
          estadoInteraccion: 'PROCESANDO',
          fechaInteraccion: {
            lt: new Date(Date.now() - 30 * 60 * 1000), // Cerrar las que tienen más de 30 minutos
          },
        },
        data: {
          estadoInteraccion: 'COMPLETADA',
          fechaCompletada: new Date(),
        },
      });
      
      // Crear nueva interacción para rastrear el estado
      await prisma.corinaInteraccion.create({
        data: {
          idUsuario: usuario.id,
          tipoInteraccion: 'CONSULTA_ALERTAS',
          estadoInteraccion: 'PROCESANDO',
          mensajeRecibido: mensaje,
          datosExtraidos: {
            granjasListadas: granjasListadas,
            fechaCreacionLista: new Date().toISOString(),
            totalGranjas: granjasListadas.length,
          },
        },
      });

      // Formatear mensaje con listado de granjas
      let mensajeGranjas = `📋 CORINA\n\nNecesito que me especifiques de cuál de todas las plantas necesitas las alertas de inventario.\n\nActualmente tienes un total de ${usuario.granjas.length} planta${usuario.granjas.length > 1 ? 's' : ''}:\n\n`;

      granjasListadas.forEach((granja) => {
        mensajeGranjas += `${granja.numero}- ${granja.nombre}\n`;
      });

      mensajeGranjas += `\nResponde con el número (ej: "1", "la planta 2") o el nombre de la planta (ej: "${granjasListadas[0]?.nombre || 'PORCINO S.A.'}").`;
      mensajeGranjas += `\n\n💡 Puedes consultar múltiples plantas respondiendo con sus números o nombres.`;

      await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajeGranjas);
      return;
    }

    // Función auxiliar para procesar consultas genéricas
    const procesarConsultaGenerica = async (
      tipoConsulta: string,
      tipoInteraccion: any,
      funcionEnvio: (idUsuario: string, idGranja: string) => Promise<void>,
      nombreConsulta: string
    ) => {
      if (usuario.granjas.length === 0) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          from,
          '❌ CORINA\n\nNo tienes granjas activas configuradas.'
        );
        return true;
      }

      const granjasListadas = usuario.granjas.map((g, index) => ({
        numero: index + 1,
        id: g.id,
        nombre: g.nombreGranja,
      }));

      // Intentar encontrar granja específica en el mensaje
      const granjaEncontrada = encontrarGranjaPorNumeroONombre(mensajeNormalizado, granjasListadas);

      // Si solo tiene una granja, enviar directamente
      if (usuario.granjas.length === 1) {
        const idGranja = usuario.granjas[0].id;
        try {
          await funcionEnvio(usuario.id, idGranja);
        } catch (error: any) {
          await CorinaNotificacionService.enviarMensajeWhatsApp(
            from,
            `❌ CORINA\n\nError al obtener ${nombreConsulta}. Por favor, intenta más tarde.`
          );
        }
        return true;
      }

      // Si tiene múltiples granjas y encontró una específica, enviar directamente
      if (granjaEncontrada) {
        try {
          await funcionEnvio(usuario.id, granjaEncontrada.id);
        } catch (error: any) {
          await CorinaNotificacionService.enviarMensajeWhatsApp(
            from,
            `❌ CORINA\n\nError al obtener ${nombreConsulta}. Por favor, intenta más tarde.`
          );
        }
        return true;
      }

      // Si tiene múltiples granjas pero no especificó cuál, preguntar cuál quiere consultar
      // Workaround temporal: usar CONSULTA_INVENTARIO si el tipo no existe en el enum de la BD
      // Guardar el tipo real en datosExtraidos para recuperarlo después
      const tiposTemporales = ['CONSULTA_MATERIAS_PRIMAS', 'CONSULTA_COMPRAS', 'CONSULTA_FORMULAS', 
                               'CONSULTA_FABRICACIONES', 'CONSULTA_PROVEEDORES', 'CONSULTA_ANIMALES'];
      const tipoInteraccionBD = tiposTemporales.includes(tipoInteraccion as string) 
        ? 'CONSULTA_INVENTARIO' // Tipo temporal hasta migración SQL
        : tipoInteraccion;
      
      await prisma.corinaInteraccion.updateMany({
        where: {
          idUsuario: usuario.id,
          tipoInteraccion: tipoInteraccionBD as any,
          estadoInteraccion: 'PROCESANDO',
          fechaInteraccion: {
            lt: new Date(Date.now() - 30 * 60 * 1000),
          },
        },
        data: {
          estadoInteraccion: 'COMPLETADA',
          fechaCompletada: new Date(),
        },
      });
      
      await prisma.corinaInteraccion.create({
        data: {
          idUsuario: usuario.id,
          tipoInteraccion: tipoInteraccionBD as any,
          estadoInteraccion: 'PROCESANDO',
          mensajeRecibido: mensaje,
          datosExtraidos: {
            granjasListadas: granjasListadas,
            fechaCreacionLista: new Date().toISOString(),
            totalGranjas: granjasListadas.length,
            tipoConsultaReal: tipoInteraccion, // Guardar tipo real para recuperarlo después
          },
        },
      });

      let mensajeGranjas = `📋 CORINA\n\nNecesito que me especifiques de cuál de todas las plantas necesitas ${nombreConsulta}.\n\nActualmente tienes un total de ${usuario.granjas.length} planta${usuario.granjas.length > 1 ? 's' : ''}:\n\n`;

      granjasListadas.forEach((granja) => {
        mensajeGranjas += `${granja.numero}- ${granja.nombre}\n`;
      });

      mensajeGranjas += `\nResponde con el número (ej: "1", "la planta 2") o el nombre de la planta (ej: "${granjasListadas[0]?.nombre || 'PORCINO S.A.'}").`;
      mensajeGranjas += `\n\n💡 Puedes consultar múltiples plantas respondiendo con sus números o nombres.`;

      await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajeGranjas);
      return true;
    };

    // Detectar consultas de materias primas
    // IMPORTANTE: Verificar primero si NO es un comando de creación
    const tienePalabrasCreacion = mensajeNormalizado.includes('crear') || 
                                  mensajeNormalizado.includes('registrar') ||
                                  mensajeNormalizado.includes('agregar') ||
                                  mensajeNormalizado.includes('nueva') ||
                                  mensajeNormalizado.includes('nuevo');
    
    const tieneConsultaMateriasPrimas = mensajeNormalizado.includes('materia') || 
                                         mensajeNormalizado.includes('materias') ||
                                         mensajeNormalizado.includes('materia prima') ||
                                         mensajeNormalizado.includes('materias primas');
    
    // Solo procesar como consulta si NO contiene palabras de creación
    if (tieneConsultaMateriasPrimas && !tienePalabrasCreacion) {
      await procesarConsultaGenerica(
        'materias primas',
        'CONSULTA_MATERIAS_PRIMAS',
        CorinaNotificacionService.enviarListadoMateriasPrimas,
        'el listado de materias primas'
      );
      return;
    }

    // Detectar consultas de compras
    // IMPORTANTE: Verificar primero si NO es un comando de creación
    const tieneConsultaCompras = mensajeNormalizado.includes('compra') || 
                                 mensajeNormalizado.includes('compras') ||
                                 mensajeNormalizado.includes('factura') ||
                                 mensajeNormalizado.includes('facturas');
    
    // Solo procesar como consulta si NO contiene palabras de creación
    if (tieneConsultaCompras && !tienePalabrasCreacion) {
      await procesarConsultaGenerica(
        'compras',
        'CONSULTA_COMPRAS',
        CorinaNotificacionService.enviarListadoCompras,
        'el listado de compras'
      );
      return;
    }

    // Detectar consultas de fórmulas
    // IMPORTANTE: Verificar primero si NO es un comando de creación
    const tieneConsultaFormulas = mensajeNormalizado.includes('formula') || 
                                  mensajeNormalizado.includes('formulas') ||
                                  mensajeNormalizado.includes('fórmula') ||
                                  mensajeNormalizado.includes('fórmulas');
    
    // Solo procesar como consulta si NO contiene palabras de creación
    if (tieneConsultaFormulas && !tienePalabrasCreacion) {
      await procesarConsultaGenerica(
        'fórmulas',
        'CONSULTA_FORMULAS',
        CorinaNotificacionService.enviarListadoFormulas,
        'el listado de fórmulas'
      );
      return;
    }

    // Detectar consultas de fabricaciones
    // IMPORTANTE: Verificar primero si NO es un comando de creación
    const tieneConsultaFabricaciones = mensajeNormalizado.includes('fabricacion') || 
                                      mensajeNormalizado.includes('fabricaciones') ||
                                      mensajeNormalizado.includes('fabricación') ||
                                      mensajeNormalizado.includes('fabricaciones');
    
    // Solo procesar como consulta si NO contiene palabras de creación
    if (tieneConsultaFabricaciones && !tienePalabrasCreacion) {
      await procesarConsultaGenerica(
        'fabricaciones',
        'CONSULTA_FABRICACIONES',
        CorinaNotificacionService.enviarListadoFabricaciones,
        'el listado de fabricaciones'
      );
      return;
    }

    // Detectar consultas de proveedores
    // IMPORTANTE: Verificar primero si NO es un comando de creación
    const tieneConsultaProveedores = mensajeNormalizado.includes('proveedor') || 
                                     mensajeNormalizado.includes('proveedores');
    
    // Solo procesar como consulta si NO contiene palabras de creación
    if (tieneConsultaProveedores && !tienePalabrasCreacion) {
      await procesarConsultaGenerica(
        'proveedores',
        'CONSULTA_PROVEEDORES',
        CorinaNotificacionService.enviarListadoProveedores,
        'el listado de proveedores'
      );
      return;
    }

    // Detectar consultas de animales/piensos
    // IMPORTANTE: Verificar primero si NO es un comando de creación
    const tieneConsultaAnimales = mensajeNormalizado.includes('animal') || 
                                  mensajeNormalizado.includes('animales') ||
                                  mensajeNormalizado.includes('pienso') ||
                                  mensajeNormalizado.includes('piensos');
    
    // Solo procesar como consulta si NO contiene palabras de creación
    if (tieneConsultaAnimales && !tienePalabrasCreacion) {
      await procesarConsultaGenerica(
        'animales',
        'CONSULTA_ANIMALES',
        CorinaNotificacionService.enviarListadoAnimales,
        'el listado de animales'
      );
      return;
    }

    // Detectar consultas de inventario
    const tieneConsultaInventario = mensajeNormalizado.includes('inventario') || 
                                    mensajeNormalizado.includes('stock') ||
                                    mensajeNormalizado.includes('informe');
    
    // No requiere palabras adicionales - si dice "inventario", "stock" o "informe" es suficiente
    if (tieneConsultaInventario) {
      await procesarConsultaGenerica(
        'inventario',
        'CONSULTA_INVENTARIO',
        CorinaNotificacionService.enviarInformeInventario,
        'el informe de inventario'
      );
      return;
    }

    // PRIORIDAD: Verificar si hay una interacción esperando modificación
    // Esto debe ir ANTES de buscar confirmaciones para procesar los nuevos datos primero
    const interaccionEsperandoModificacion = await prisma.corinaInteraccion.findFirst({
      where: {
        idUsuario: usuario.id,
        tipoInteraccion: 'CREACION_REGISTRO',
        estadoInteraccion: 'PROCESANDO',
        fechaInteraccion: {
          gte: new Date(Date.now() - 30 * 60 * 1000),
        },
        datosExtraidos: {
          path: ['esperandoModificacion'],
          equals: true,
        },
      },
      orderBy: {
        fechaInteraccion: 'desc',
      },
    });

    // Si hay interacción esperando modificación, procesar los nuevos datos
    if (interaccionEsperandoModificacion) {
      const { CorinaService } = await import('../services/corinaService');
      const datosAnteriores = interaccionEsperandoModificacion.datosExtraidos as any || {};
      const tablaDestino = datosAnteriores.tablaDestino;
      const datosParciales = datosAnteriores.datos || {};
      const tipoComandoAnterior = datosAnteriores.tipoComando || 'CREAR_MATERIA_PRIMA';
      const idGranja = interaccionEsperandoModificacion.idGranja || usuario.granjas[0]?.id;

      if (!idGranja) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          from,
          '❌ CORINA\n\nError: No se pudo determinar la granja.\n\nPor favor, intenta nuevamente.'
        );
        return;
      }

      try {
        // Extraer nuevos datos del mensaje
        console.log(`📝 Procesando modificación para: ${tipoComandoAnterior}`);
        const datosNuevos = await CorinaService.extraerDatos(mensaje, tipoComandoAnterior);

        // Combinar datos anteriores con nuevos (los nuevos tienen prioridad)
        const datosCombinados: DatosExtraidosNLP = {
          tablaDestino: tablaDestino,
          datos: {
            ...datosParciales,
            ...datosNuevos.datos, // Los nuevos datos sobrescriben los anteriores
          },
          confianza: Math.max(
            datosAnteriores.confianza || 0,
            datosNuevos.confianza || 0
          ),
        };

        // Normalizar datos combinados
        let datosNormalizados: Record<string, any> = datosCombinados.datos;
        let erroresNormalizacion: string[] = [];
        let advertenciasNormalizacion: string[] = [];

        try {
          console.log(`🔧 Normalizando datos modificados para: ${tablaDestino}`);
          const normalizacion = await CorinaService.normalizarDatos(datosCombinados, idGranja);
          datosNormalizados = normalizacion.datosNormalizados;
          erroresNormalizacion = normalizacion.errores;
          advertenciasNormalizacion = normalizacion.advertencias;
        } catch (normalizacionError: any) {
          console.error('Error normalizando datos modificados:', normalizacionError);
          erroresNormalizacion.push(`Error al normalizar datos: ${normalizacionError.message}`);
        }

        // Validar datos
        const datosParaValidar: DatosExtraidosNLP = {
          tablaDestino: tablaDestino,
          datos: datosNormalizados,
          confianza: datosCombinados.confianza,
        };

        const validacion = await CorinaService.validarDatos(datosParaValidar, idGranja);

        if (erroresNormalizacion.length > 0) {
          if (!validacion.errores) {
            validacion.errores = [];
          }
          validacion.errores.push(...erroresNormalizacion);
          validacion.esValido = false;
        }

        if (!validacion.esValido) {
          // Hay errores - solicitar corrección
          let mensajeRespuesta = CorinaService.generarMensajeSolicitudDatos(
            tablaDestino,
            validacion.camposFaltantes || []
          );

          const todosLosErrores = [
            ...(erroresNormalizacion || []),
            ...(validacion.errores || []),
          ];

          if (todosLosErrores.length > 0) {
            mensajeRespuesta += '\n\n❌ Errores encontrados:\n';
            todosLosErrores.forEach((error, index) => {
              mensajeRespuesta += `${index + 1}. ${error}\n`;
            });
          }

          mensajeRespuesta += '\n\n💡 Responde con los datos faltantes o corrige los errores para continuar.';

          await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajeRespuesta);

          await prisma.corinaInteraccion.update({
            where: { id: interaccionEsperandoModificacion.id },
            data: {
              datosExtraidos: {
                ...datosAnteriores,
                datos: datosNormalizados,
                esperandoModificacion: true, // Mantener el flag
                validacion: {
                  esValido: false,
                  camposFaltantes: validacion.camposFaltantes,
                  errores: validacion.errores,
                },
              },
            },
          });

          return;
        } else {
          // Datos válidos - mostrar nuevo preview y pedir confirmación
          const mensajePreview = await CorinaService.generarMensajePreview(
            tablaDestino,
            datosNormalizados,
            advertenciasNormalizacion
          );

          await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajePreview);

          // Actualizar interacción con nuevos datos y volver a esperar confirmación
          try {
            await prisma.$executeRaw`
              UPDATE "t_corina_interaccion"
              SET "datosExtraidos" = ${JSON.stringify({
                tipoComando: tipoComandoAnterior,
                tablaDestino: tablaDestino,
                datos: datosNormalizados,
                datosOriginales: datosAnteriores.datosOriginales || datosParciales,
                normalizacion: {
                  errores: erroresNormalizacion,
                  advertencias: advertenciasNormalizacion,
                },
                validacion: {
                  esValido: true,
                },
                esperandoConfirmacion: true,
                esperandoModificacion: false, // Ya no está esperando modificación
              })}::jsonb,
                  "respuestaCorina" = ${mensajePreview}
              WHERE "id" = ${interaccionEsperandoModificacion.id}
            `;
          } catch (error: any) {
            // Si falla el raw SQL, usar update normal
            if (error.code === 'P2010' || error.message?.includes('ESPERANDO_CONFIRMACION')) {
              await prisma.corinaInteraccion.update({
                where: { id: interaccionEsperandoModificacion.id },
                data: {
                  datosExtraidos: {
                    tipoComando: tipoComandoAnterior,
                    tablaDestino: tablaDestino,
                    datos: datosNormalizados,
                    datosOriginales: datosAnteriores.datosOriginales || datosParciales,
                    normalizacion: {
                      errores: erroresNormalizacion,
                      advertencias: advertenciasNormalizacion,
                    },
                    validacion: {
                      esValido: true,
                    },
                    esperandoConfirmacion: true,
                    esperandoModificacion: false,
                  },
                  respuestaCorina: mensajePreview,
                },
              });
            } else {
              throw error;
            }
          }

          return;
        }
      } catch (error: any) {
        console.error('Error procesando modificación:', error);
        
        if (error.message === 'QUOTA_EXCEEDED') {
          await CorinaNotificacionService.enviarMensajeWhatsApp(
            from,
            '❌ CORINA\n\nLo siento, la cuota de OpenAI se ha agotado.\n\n' +
            'Por favor, intenta más tarde o usa la aplicación web para crear registros.'
          );
          return;
        }

        await CorinaNotificacionService.enviarMensajeWhatsApp(
          from,
          `❌ CORINA\n\nError al procesar la modificación:\n${error.message}\n\n` +
          `Por favor, intenta nuevamente.`
        );
        return;
      }
    }

    // ANTES de verificar confirmaciones pendientes, verificar si el mensaje es un nuevo comando de creación
    // Esto evita que mensajes como "Crear materia prima X" sean tratados como respuestas a confirmaciones anteriores
    let esNuevoComandoCreacion = false;
    try {
      const { CorinaService } = await import('../services/corinaService');
      const deteccionTemporal = await CorinaService.detectarTipoComando(mensaje);
      // Si es un comando de creación con confianza suficiente, es un nuevo comando
      if (deteccionTemporal.confianza >= 0.7 && deteccionTemporal.tipoComando.startsWith('CREAR_')) {
        esNuevoComandoCreacion = true;
        console.log(`🆕 Detectado nuevo comando de creación: ${deteccionTemporal.tipoComando} (confianza: ${deteccionTemporal.confianza})`);
      }
    } catch (error) {
      // Si falla la detección, continuar con el flujo normal
      console.warn('⚠️ Error detectando tipo de comando (continuando con flujo normal):', error);
    }

    // Verificar si hay una interacción pendiente de confirmación
    // Workaround: usar SQL raw porque el enum aún no tiene ESPERANDO_CONFIRMACION en la BD
    // Si el enum no existe, buscar por PROCESANDO y verificar en datosExtraidos
    let interaccionConfirmacionPendiente = null;
    try {
      const interaccionConfirmacionPendienteRaw = await prisma.$queryRaw<any[]>`
        SELECT * FROM "t_corina_interaccion"
        WHERE "idUsuario" = ${usuario.id}
          AND "tipoInteraccion" = 'CREACION_REGISTRO'
          AND ("estadoInteraccion"::text = 'ESPERANDO_CONFIRMACION' OR "estadoInteraccion" = 'PROCESANDO')
          AND "fechaInteraccion" >= ${new Date(Date.now() - 30 * 60 * 1000)}
          AND "datosExtraidos" IS NOT NULL
        ORDER BY "fechaInteraccion" DESC
        LIMIT 1
      `;
      
      if (interaccionConfirmacionPendienteRaw.length > 0) {
        const interaccion = await prisma.corinaInteraccion.findUnique({
          where: { id: interaccionConfirmacionPendienteRaw[0].id },
        });
        
        // Verificar si realmente está esperando confirmación (puede estar en PROCESANDO si el enum no existe)
        if (interaccion) {
          const datosExtraidos = interaccion.datosExtraidos as any;
          // Si tiene esperandoConfirmacion: true o validación válida, está esperando confirmación
          if (datosExtraidos?.esperandoConfirmacion === true || datosExtraidos?.validacion?.esValido === true) {
            interaccionConfirmacionPendiente = interaccion;
          }
        }
      }
    } catch (error: any) {
      // Si falla la consulta (enum no existe), buscar por PROCESANDO y validar manualmente
      console.warn('Error buscando ESPERANDO_CONFIRMACION, usando fallback:', error.message);
      const interaccionesProcesando = await prisma.corinaInteraccion.findMany({
        where: {
          idUsuario: usuario.id,
          tipoInteraccion: 'CREACION_REGISTRO',
          estadoInteraccion: 'PROCESANDO',
          fechaInteraccion: {
            gte: new Date(Date.now() - 30 * 60 * 1000),
          },
          datosExtraidos: {
            not: Prisma.JsonNull,
          },
        },
        orderBy: {
          fechaInteraccion: 'desc',
        },
        take: 1,
      });
      
      // Verificar si alguna está esperando confirmación (tiene validación válida o esperandoConfirmacion: true)
      for (const interaccion of interaccionesProcesando) {
        const datosExtraidos = interaccion.datosExtraidos as any;
        if (datosExtraidos?.esperandoConfirmacion === true || datosExtraidos?.validacion?.esValido === true) {
          interaccionConfirmacionPendiente = interaccion;
          break;
        }
      }
    }

    // Si hay interacción esperando confirmación, procesar respuesta
    // PERO solo si NO es un nuevo comando de creación (para evitar que nuevos comandos sean tratados como respuestas)
    if (interaccionConfirmacionPendiente && !esNuevoComandoCreacion) {
      const mensajeNormalizado = mensaje.toLowerCase().trim();
      const datosAnteriores = interaccionConfirmacionPendiente.datosExtraidos as any || {};
      const tablaDestino = datosAnteriores.tablaDestino;
      const datosNormalizados = datosAnteriores.datos || {};

      // Detectar respuesta de confirmación
      const esConfirmacion = 
        mensajeNormalizado === 'sí' ||
        mensajeNormalizado === 'si' ||
        mensajeNormalizado === 'confirmar' ||
        mensajeNormalizado === 'confirmo' ||
        mensajeNormalizado === 'ok' ||
        mensajeNormalizado === 'correcto' ||
        mensajeNormalizado.startsWith('sí ') ||
        mensajeNormalizado.startsWith('si ');

      const esCancelacion =
        mensajeNormalizado === 'no' ||
        mensajeNormalizado === 'cancelar' ||
        mensajeNormalizado === 'cancelo' ||
        mensajeNormalizado.startsWith('no ');

      const esModificacion =
        mensajeNormalizado === 'modificar' ||
        mensajeNormalizado === 'cambiar' ||
        mensajeNormalizado.startsWith('modificar ') ||
        mensajeNormalizado.startsWith('cambiar ');

      if (esConfirmacion) {
        // Usuario confirma - crear registro
        try {
          const { CorinaService } = await import('../services/corinaService');
          const registroCreado = await CorinaService.crearRegistro(
            tablaDestino,
            datosNormalizados,
            interaccionConfirmacionPendiente.idGranja || usuario.granjas[0]?.id!,
            usuario.id
          );

          await CorinaNotificacionService.enviarMensajeWhatsApp(
            from,
            `✅ CORINA\n\n¡Registro creado exitosamente!\n\n` +
            `El registro ha sido creado en el sistema. Puedes verlo en la aplicación web.`
          );

          // Actualizar interacción como completada
          await prisma.corinaInteraccion.update({
            where: { id: interaccionConfirmacionPendiente.id },
            data: {
              estadoInteraccion: 'COMPLETADA',
              fechaCompletada: new Date(),
              registroCreadoId: registroCreado.id,
              tablaRegistroCreado: tablaDestino,
              respuestaCorina: 'Registro creado exitosamente',
            },
          });

          return;
        } catch (error: any) {
          console.error('Error creando registro:', error);
          await CorinaNotificacionService.enviarMensajeWhatsApp(
            from,
            `❌ CORINA\n\nError al crear el registro:\n${error.message}\n\n` +
            `Por favor, intenta nuevamente o usa la aplicación web.`
          );

          // Actualizar interacción con error
          await prisma.corinaInteraccion.update({
            where: { id: interaccionConfirmacionPendiente.id },
            data: {
              estadoInteraccion: 'ERROR',
              errorMensaje: error.message,
            },
          });

          return;
        }
      } else if (esCancelacion) {
        // Usuario cancela
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          from,
          `❌ CORINA\n\nCreación cancelada.\n\n` +
          `Si necesitas crear un registro más adelante, puedes intentarlo nuevamente.`
        );

        // Actualizar interacción como cancelada
        // Workaround: intentar usar CANCELADA, si falla usar ERROR como fallback
        try {
          await prisma.$executeRaw`
            UPDATE "t_corina_interaccion"
            SET "estadoInteraccion" = 'CANCELADA'::"EstadoInteraccionCorina",
                "fechaCompletada" = ${new Date()},
                "respuestaCorina" = 'Creación cancelada por el usuario'
            WHERE "id" = ${interaccionConfirmacionPendiente.id}
          `;
        } catch (error: any) {
          // Si el enum no existe, usar ERROR y marcar en datosExtraidos
          if (error.code === 'P2010' || error.message?.includes('CANCELADA')) {
            console.warn('⚠️ Enum CANCELADA no existe, usando ERROR como fallback');
            const datosExtraidos = interaccionConfirmacionPendiente.datosExtraidos as any || {};
            await prisma.corinaInteraccion.update({
              where: { id: interaccionConfirmacionPendiente.id },
              data: {
                estadoInteraccion: 'ERROR',
                fechaCompletada: new Date(),
                respuestaCorina: 'Creación cancelada por el usuario',
                datosExtraidos: {
                  ...datosExtraidos,
                  cancelada: true, // Marcar explícitamente que fue cancelada
                },
              },
            });
          } else {
            throw error; // Re-lanzar otros errores
          }
        }

        return;
      } else if (esModificacion) {
        // Usuario quiere modificar - cambiar estado a PROCESANDO para permitir nuevos datos
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          from,
          `✏️ CORINA\n\nIndica qué dato quieres modificar o envía los nuevos datos.\n\n` +
          `Ejemplo: "Cambiar el código a MAIZ002" o "El nombre es Maíz Amarillo"`
        );

        // Actualizar interacción marcando que está esperando modificación
        const datosExtraidosActualizados = {
          ...datosAnteriores,
          esperandoModificacion: true, // Marcar que está esperando datos de modificación
        };

        await prisma.corinaInteraccion.update({
          where: { id: interaccionConfirmacionPendiente.id },
          data: {
            estadoInteraccion: 'PROCESANDO', // Volver a procesamiento para recibir modificaciones
            datosExtraidos: datosExtraidosActualizados,
          },
        });

        return;
      } else {
        // Respuesta no reconocida - recordar opciones
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          from,
          `🤔 CORINA\n\nNo entendí tu respuesta.\n\n` +
          `Por favor, responde:\n` +
          `• "Sí" o "Confirmar" para crear el registro\n` +
          `• "No" o "Cancelar" para cancelar\n` +
          `• "Modificar" para cambiar algún dato`
        );
        return;
      }
    }

    // Este código ya está manejado ANTES de las consultas (línea ~269)
    // Se eliminó el código duplicado porque ya se procesa al inicio del flujo

    // Verificar si hay una interacción pendiente de creación (esperando datos faltantes o corrección)
    const interaccionCreacionPendiente = await prisma.corinaInteraccion.findFirst({
      where: {
        idUsuario: usuario.id,
        tipoInteraccion: 'CREACION_REGISTRO', // Usar el tipo genérico del enum
        estadoInteraccion: {
          in: ['PENDIENTE', 'PROCESANDO'], // Usar estados disponibles en el enum
        },
        fechaInteraccion: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Últimos 30 minutos
        },
        datosExtraidos: {
          not: Prisma.JsonNull, // Debe tener datos extraídos
        },
      },
      orderBy: {
        fechaInteraccion: 'desc',
      },
    });

    // Si hay interacción pendiente de creación, intentar completar los datos
    if (interaccionCreacionPendiente) {
      const { CorinaService } = await import('../services/corinaService');
      
      try {
        // Obtener datos extraídos de la interacción anterior
        const datosAnteriores = interaccionCreacionPendiente.datosExtraidos as any || {};
        const tablaDestino = datosAnteriores.tablaDestino;
        const datosParciales = datosAnteriores.datos || {};
        const tipoComandoAnterior = datosAnteriores.tipoComando || 'CREAR_MATERIA_PRIMA';

        // Obtener idGranja antes de validar
        const idGranja = interaccionCreacionPendiente.idGranja || usuario.granjas[0]?.id;
        if (!idGranja) {
          throw new Error('No se pudo determinar la granja');
        }

        // Intentar extraer nuevos datos del mensaje actual para complementar
        let datosNuevos: DatosExtraidosNLP;
        try {
          console.log(`📝 Extrayendo datos complementarios para: ${tipoComandoAnterior}`);
          datosNuevos = await CorinaService.extraerDatos(mensaje, tipoComandoAnterior);
        } catch (extraccionError: any) {
          console.error('Error extrayendo datos complementarios:', extraccionError);
          
          // Si es error de cuota, informar al usuario
          if (extraccionError.message === 'QUOTA_EXCEEDED') {
            await CorinaNotificacionService.enviarMensajeWhatsApp(
              from,
              '❌ CORINA\n\nLo siento, la cuota de OpenAI se ha agotado.\n\n' +
              'Por favor, intenta más tarde o usa la aplicación web para crear registros.'
            );
            return;
          }
          
          // Para otros errores, usar datos anteriores sin combinar
          datosNuevos = {
            tablaDestino: tablaDestino,
            datos: {},
            confianza: 0.0,
          };
        }

        // Combinar datos anteriores con nuevos (los nuevos tienen prioridad)
        const datosCombinados: DatosExtraidosNLP = {
          tablaDestino: tablaDestino,
          datos: {
            ...datosParciales,
            ...datosNuevos.datos, // Los nuevos datos sobrescriben los anteriores
          },
          confianza: Math.max(
            datosAnteriores.confianza || 0,
            datosNuevos.confianza || 0
          ),
        };
        
        // Normalizar datos combinados
        let datosNormalizados: Record<string, any> = datosCombinados.datos;
        let erroresNormalizacion: string[] = [];
        let advertenciasNormalizacion: string[] = [];

        try {
          console.log(`🔧 Normalizando datos combinados para: ${tablaDestino}`);
          const normalizacion = await CorinaService.normalizarDatos(datosCombinados, idGranja);
          datosNormalizados = normalizacion.datosNormalizados;
          erroresNormalizacion = normalizacion.errores;
          advertenciasNormalizacion = normalizacion.advertencias;
        } catch (normalizacionError: any) {
          console.error('Error normalizando datos combinados:', normalizacionError);
          erroresNormalizacion.push(`Error al normalizar datos: ${normalizacionError.message}`);
        }

        // Crear estructura de datos normalizados para validación
        const datosParaValidar: DatosExtraidosNLP = {
          tablaDestino: tablaDestino,
          datos: datosNormalizados,
          confianza: datosCombinados.confianza,
        };

        // Validar datos combinados y normalizados
        const validacion = await CorinaService.validarDatos(datosParaValidar, idGranja);
        
        // Combinar errores de normalización con errores de validación
        if (erroresNormalizacion.length > 0) {
          if (!validacion.errores) {
            validacion.errores = [];
          }
          validacion.errores.push(...erroresNormalizacion);
          validacion.esValido = false;
        }

        if (!validacion.esValido) {
          // Hay errores o campos faltantes - solicitar corrección
          let mensajeRespuesta = CorinaService.generarMensajeSolicitudDatos(
            tablaDestino,
            validacion.camposFaltantes || []
          );

          // Agregar errores de normalización y validación
          const todosLosErrores = [
            ...(erroresNormalizacion || []),
            ...(validacion.errores || []),
          ];

          if (todosLosErrores.length > 0) {
            mensajeRespuesta += '\n\n❌ Errores encontrados:\n';
            todosLosErrores.forEach((error, index) => {
              mensajeRespuesta += `${index + 1}. ${error}\n`;
            });
          }

          // Agregar advertencias si las hay
          if (advertenciasNormalizacion.length > 0) {
            mensajeRespuesta += '\n\n⚠️ Advertencias:\n';
            advertenciasNormalizacion.forEach((advertencia: string, index: number) => {
              mensajeRespuesta += `${index + 1}. ${advertencia}\n`;
            });
          }

          await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajeRespuesta);

          // Actualizar interacción manteniendo el estado PROCESANDO (esperando datos)
          await prisma.corinaInteraccion.update({
            where: { id: interaccionCreacionPendiente.id },
            data: {
              estadoInteraccion: 'PROCESANDO', // Usar estado disponible en el enum
              mensajeRecibido: mensaje,
              datosExtraidos: {
                ...datosAnteriores,
                datos: datosNormalizados,
                datosOriginales: datosParciales,
                normalizacion: {
                  errores: erroresNormalizacion,
                  advertencias: advertenciasNormalizacion,
                },
                validacion: {
                  esValido: false,
                  camposFaltantes: validacion.camposFaltantes,
                  errores: validacion.errores,
                },
              },
            },
          });

          return;
        } else {
          // Datos válidos y normalizados - mostrar preview y pedir confirmación
          const mensajePreviewCompleto = await CorinaService.generarMensajePreview(
            tablaDestino,
            datosNormalizados,
            advertenciasNormalizacion
          );

          await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajePreviewCompleto);

          // Actualizar interacción con estado ESPERANDO_CONFIRMACION
          // Workaround: intentar usar ESPERANDO_CONFIRMACION, si falla usar PROCESANDO
          try {
            await prisma.$executeRaw`
              UPDATE "t_corina_interaccion"
              SET "idGranja" = ${idGranja},
                  "estadoInteraccion" = 'ESPERANDO_CONFIRMACION'::"EstadoInteraccionCorina",
                  "respuestaCorina" = ${mensajePreviewCompleto},
                  "datosExtraidos" = ${JSON.stringify({
                    tipoComando: tipoComandoAnterior,
                    tablaDestino: tablaDestino,
                    datos: datosNormalizados,
                    datosOriginales: datosAnteriores.datosOriginales || datosParciales,
                    normalizacion: {
                      errores: erroresNormalizacion,
                      advertencias: advertenciasNormalizacion,
                    },
                    validacion: {
                      esValido: true,
                    },
                    esperandoConfirmacion: true,
                  })}::jsonb
              WHERE "id" = ${interaccionCreacionPendiente.id}
            `;
          } catch (error: any) {
            // Si el enum no existe, usar PROCESANDO y marcar en datosExtraidos
            if (error.code === 'P2010' || error.message?.includes('ESPERANDO_CONFIRMACION')) {
              console.warn('⚠️ Enum ESPERANDO_CONFIRMACION no existe, usando PROCESANDO como fallback');
              await prisma.corinaInteraccion.update({
                where: { id: interaccionCreacionPendiente.id },
                data: {
                  idGranja: idGranja,
                  estadoInteraccion: 'PROCESANDO',
                  respuestaCorina: mensajePreviewCompleto,
                  datosExtraidos: {
                    tipoComando: tipoComandoAnterior,
                    tablaDestino: tablaDestino,
                    datos: datosNormalizados,
                    datosOriginales: datosAnteriores.datosOriginales || datosParciales,
                    normalizacion: {
                      errores: erroresNormalizacion,
                      advertencias: advertenciasNormalizacion,
                    },
                    validacion: {
                      esValido: true,
                    },
                    esperandoConfirmacion: true, // Marcar explícitamente para búsqueda posterior
                  },
                },
              });
            } else {
              throw error; // Re-lanzar otros errores
            }
          }

          return;
        }
      } catch (error: any) {
        console.error('Error procesando interacción pendiente:', error);
        
        // Enviar mensaje de error
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          from,
          '❌ CORINA\n\nHubo un error al procesar tu solicitud.\n\n' +
          'Por favor, intenta nuevamente o usa la aplicación web para crear registros.'
        );

        // Actualizar interacción con error
        await prisma.corinaInteraccion.update({
          where: { id: interaccionCreacionPendiente.id },
          data: {
            estadoInteraccion: 'ERROR',
            errorMensaje: error.message || 'Error desconocido',
          },
        });

        return;
      }
    }

    // Intentar detectar si es un comando de creación
    try {
      const { CorinaService } = await import('../services/corinaService');
      
      // Detectar tipo de comando
      const deteccion = await CorinaService.detectarTipoComando(mensaje);
      
      // Si es un comando de creación con confianza suficiente
      if (deteccion.confianza >= 0.7 && deteccion.tipoComando.startsWith('CREAR_')) {
        // Preparar listado de granjas para búsqueda
        const granjasListadas = usuario.granjas.map((g, index) => ({
          numero: index + 1,
          id: g.id,
          nombre: g.nombreGranja,
        }));

        // Intentar encontrar granja en el mensaje ANTES de preguntar
        let idGranja: string | null = null;
        let granjaEncontrada: { id: string; nombre: string } | null = null;

        if (usuario.granjas.length === 1) {
          // Si solo tiene una granja, usarla directamente
          idGranja = usuario.granjas[0].id;
          granjaEncontrada = { id: usuario.granjas[0].id, nombre: usuario.granjas[0].nombreGranja };
        } else if (usuario.granjas.length > 1) {
          // Si tiene múltiples granjas, intentar encontrar el nombre en el mensaje
          console.log(`🔍 Buscando granja en mensaje. Total de granjas: ${usuario.granjas.length}`);
          console.log(`📋 Granjas disponibles: ${granjasListadas.map(g => `${g.numero}- ${g.nombre}`).join(', ')}`);
          granjaEncontrada = encontrarGranjaPorNumeroONombre(mensajeNormalizado, granjasListadas);
          if (granjaEncontrada) {
            idGranja = granjaEncontrada.id;
            console.log(`✅ Granja encontrada en el mensaje: ${granjaEncontrada.nombre} (ID: ${granjaEncontrada.id})`);
          } else {
            console.log(`⚠️ No se encontró granja en el mensaje. Se preguntará al usuario.`);
          }
        }

        if (!idGranja && usuario.granjas.length > 1) {
          // Si tiene múltiples granjas y no se encontró ninguna en el mensaje, preguntar cuál usar
          // Crear interacción para rastrear la selección de granja
          await prisma.corinaInteraccion.create({
            data: {
              idUsuario: usuario.id,
              tipoInteraccion: 'CREACION_REGISTRO',
              estadoInteraccion: 'PROCESANDO',
              mensajeRecibido: mensaje,
              datosExtraidos: {
                tipoComando: deteccion.tipoComando,
                granjasListadas: granjasListadas,
                esperandoSeleccionGranja: true,
                fechaCreacionLista: new Date().toISOString(),
                totalGranjas: granjasListadas.length,
              },
            },
          });

          let mensajeGranjas = `📋 CORINA\n\nTienes múltiples granjas. Por favor, especifica de cuál granja quieres crear el registro.\n\n`;
          mensajeGranjas += `Actualmente tienes un total de ${usuario.granjas.length} planta${usuario.granjas.length > 1 ? 's' : ''}:\n\n`;
          
          granjasListadas.forEach((granja) => {
            mensajeGranjas += `${granja.numero}- ${granja.nombre}\n`;
          });

          mensajeGranjas += `\nResponde con el número (ej: "1", "la planta 2") o el nombre de la planta (ej: "${granjasListadas[0]?.nombre || 'PORCINO S.A.'}").`;
          mensajeGranjas += `\n\n💡 También puedes incluir el nombre de la granja en tu mensaje inicial, por ejemplo: "Crear materia prima maíz en ${granjasListadas[0]?.nombre || 'PORCINO S.A.'}"`;

          await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajeGranjas);
          return;
        }

        if (!idGranja) {
          await CorinaNotificacionService.enviarMensajeWhatsApp(
            from,
            '❌ CORINA\n\nNo tienes granjas activas configuradas.'
          );
          return;
        }

        // Mapear tipo de comando a tabla destino
        const tablaDestinoMap: Record<string, string> = {
          'CREAR_MATERIA_PRIMA': 'materiaPrima',
          'CREAR_PIENSO': 'animal',
          'CREAR_PROVEEDOR': 'proveedor',
          'CREAR_FORMULA': 'formula',
          'CREAR_COMPRA': 'compra',
          'CREAR_FABRICACION': 'fabricacion',
        };

        const tablaDestino = tablaDestinoMap[deteccion.tipoComando] || 'desconocido';

        // Extraer datos estructurados del mensaje
        let datosExtraidos: DatosExtraidosNLP;
        try {
          console.log(`📝 Extrayendo datos para comando: ${deteccion.tipoComando}`);
          datosExtraidos = await CorinaService.extraerDatos(mensaje, deteccion.tipoComando);
          console.log(`✅ Datos extraídos: ${JSON.stringify(datosExtraidos.datos)}`);
        } catch (extraccionError: any) {
          console.error('Error extrayendo datos:', extraccionError);
          
          // Si es error de cuota, informar al usuario
          if (extraccionError.message === 'QUOTA_EXCEEDED') {
            await CorinaNotificacionService.enviarMensajeWhatsApp(
              from,
              '❌ CORINA\n\nLo siento, la cuota de OpenAI se ha agotado.\n\n' +
              'Por favor, intenta más tarde o usa la aplicación web para crear registros.'
            );
            return;
          }
          
          // Para otros errores, crear estructura básica y continuar
          datosExtraidos = {
            tablaDestino: tablaDestino,
            datos: {
              mensajeOriginal: mensaje,
            },
            confianza: 0.3,
          };
        }

        // Normalizar y completar datos extraídos
        let datosNormalizados: Record<string, any> = datosExtraidos.datos;
        let erroresNormalizacion: string[] = [];
        let advertenciasNormalizacion: string[] = [];

        // Verificar que tenemos una granja válida antes de continuar
        if (!idGranja) {
          // Esto no debería pasar si la lógica anterior funcionó correctamente
          // pero lo agregamos como seguridad
          if (usuario.granjas.length > 1) {
            console.error('⚠️ ERROR: Se intentó crear registro sin especificar granja cuando hay múltiples granjas');
            await CorinaNotificacionService.enviarMensajeWhatsApp(
              from,
              '❌ CORINA\n\nError: No se especificó la granja para crear el registro.\n\nPor favor, intenta nuevamente especificando la granja.'
            );
            return;
          } else if (usuario.granjas.length === 1) {
            idGranja = usuario.granjas[0].id;
            granjaEncontrada = { id: usuario.granjas[0].id, nombre: usuario.granjas[0].nombreGranja };
          } else {
            await CorinaNotificacionService.enviarMensajeWhatsApp(
              from,
              '❌ CORINA\n\nNo tienes granjas activas configuradas.'
            );
            return;
          }
        }

        // Usar la granja encontrada si se detectó en el mensaje
        const idGranjaFinal = idGranja;
        const nombreGranjaFinal = granjaEncontrada?.nombre || usuario.granjas.find(g => g.id === idGranjaFinal)?.nombreGranja || 'la granja';
        
        console.log(`🏭 Usando granja para creación: ${nombreGranjaFinal} (ID: ${idGranjaFinal})`);

        try {
          console.log(`🔧 Normalizando datos para: ${tablaDestino} (granja: ${nombreGranjaFinal})`);
          const normalizacion = await CorinaService.normalizarDatos(datosExtraidos, idGranjaFinal);
          datosNormalizados = normalizacion.datosNormalizados;
          erroresNormalizacion = normalizacion.errores;
          advertenciasNormalizacion = normalizacion.advertencias;
          
          if (erroresNormalizacion.length > 0) {
            console.log(`⚠️ Errores de normalización: ${erroresNormalizacion.join(', ')}`);
          }
          if (advertenciasNormalizacion.length > 0) {
            console.log(`ℹ️ Advertencias de normalización: ${advertenciasNormalizacion.join(', ')}`);
          }
        } catch (normalizacionError: any) {
          console.error('Error normalizando datos:', normalizacionError);
          erroresNormalizacion.push(`Error al normalizar datos: ${normalizacionError.message}`);
        }

        // Crear estructura de datos normalizados para validación
        const datosParaValidar: DatosExtraidosNLP = {
          tablaDestino: tablaDestino,
          datos: datosNormalizados,
          confianza: datosExtraidos.confianza,
        };

        // Validar datos normalizados
        const validacion = await CorinaService.validarDatos(datosParaValidar, idGranjaFinal);
        
        // Combinar errores de normalización con errores de validación
        if (erroresNormalizacion.length > 0) {
          if (!validacion.errores) {
            validacion.errores = [];
          }
          validacion.errores.push(...erroresNormalizacion);
          validacion.esValido = false;
        }

        // Crear interacción de creación
        const interaccionCreacion = await prisma.corinaInteraccion.create({
          data: {
            idUsuario: usuario.id,
            idGranja: idGranjaFinal,
            tipoInteraccion: 'CREACION_REGISTRO', // Usar el tipo genérico del enum
            estadoInteraccion: validacion.esValido ? 'PROCESANDO' : 'PENDIENTE', // Usar estados disponibles
            mensajeRecibido: mensaje,
            datosExtraidos: {
              tipoComando: deteccion.tipoComando,
              tablaDestino: tablaDestino,
              datos: datosNormalizados, // Guardar datos normalizados
              datosOriginales: datosExtraidos.datos, // Guardar también los originales para referencia
              confianza: deteccion.confianza,
              razon: deteccion.razon,
              normalizacion: {
                errores: erroresNormalizacion,
                advertencias: advertenciasNormalizacion,
              },
              validacion: {
                esValido: validacion.esValido,
                camposFaltantes: validacion.camposFaltantes,
                errores: validacion.errores,
              },
            },
          },
        });

        if (!validacion.esValido) {
          // Hay errores o campos faltantes - solicitar corrección
          let mensajeRespuesta = CorinaService.generarMensajeSolicitudDatos(
            tablaDestino,
            validacion.camposFaltantes || []
          );

          // Agregar errores si hay duplicados
          if (validacion.errores && validacion.errores.length > 0) {
            mensajeRespuesta += '\n\n❌ Errores encontrados:\n';
            validacion.errores.forEach((error, index) => {
              mensajeRespuesta += `${index + 1}. ${error}\n`;
            });
          }

          mensajeRespuesta += '\n\n💡 Responde con los datos faltantes o corrige los errores para continuar.';

          await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajeRespuesta);
          return;
        } else {
          // Datos válidos y normalizados - mostrar preview y solicitar confirmación
          const mensajePreview = await CorinaService.generarMensajePreview(
            tablaDestino,
            datosNormalizados,
            advertenciasNormalizacion
          );

          await CorinaNotificacionService.enviarMensajeWhatsApp(from, mensajePreview);

          // Crear o actualizar interacción con estado ESPERANDO_CONFIRMACION
          // Workaround: intentar usar ESPERANDO_CONFIRMACION, si falla usar PROCESANDO
          try {
            await prisma.$executeRaw`
              UPDATE "t_corina_interaccion"
              SET "idGranja" = ${idGranjaFinal},
                  "estadoInteraccion" = 'ESPERANDO_CONFIRMACION'::"EstadoInteraccionCorina",
                  "respuestaCorina" = ${mensajePreview},
                  "datosExtraidos" = ${JSON.stringify({
                    tipoComando: deteccion.tipoComando,
                    tablaDestino: tablaDestino,
                    datos: datosNormalizados,
                    datosOriginales: datosExtraidos.datos,
                    normalizacion: {
                      errores: erroresNormalizacion,
                      advertencias: advertenciasNormalizacion,
                    },
                    validacion: {
                      esValido: true,
                    },
                    esperandoConfirmacion: true, // Marcar explícitamente
                  })}::jsonb
              WHERE "id" = ${interaccionCreacion.id}
            `;
          } catch (error: any) {
            // Si el enum no existe, usar PROCESANDO y marcar en datosExtraidos
            if (error.code === 'P2010' || error.message?.includes('ESPERANDO_CONFIRMACION')) {
              console.warn('⚠️ Enum ESPERANDO_CONFIRMACION no existe, usando PROCESANDO como fallback');
              await prisma.corinaInteraccion.update({
                where: { id: interaccionCreacion.id },
                data: {
                  idGranja: idGranjaFinal,
                  estadoInteraccion: 'PROCESANDO',
                  respuestaCorina: mensajePreview,
                  datosExtraidos: {
                    tipoComando: deteccion.tipoComando,
                    tablaDestino: tablaDestino,
                    datos: datosNormalizados,
                    datosOriginales: datosExtraidos.datos,
                    normalizacion: {
                      errores: erroresNormalizacion,
                      advertencias: advertenciasNormalizacion,
                    },
                    validacion: {
                      esValido: true,
                    },
                    esperandoConfirmacion: true, // Marcar explícitamente para búsqueda posterior
                  },
                },
              });
            } else {
              throw error; // Re-lanzar otros errores
            }
          }

          return;
        }
      }
    } catch (detectionError: any) {
      console.error('Error detectando comando:', detectionError);
      
      // Si es error de cuota, no intentar enviar mensaje
      if (detectionError.message === 'QUOTA_EXCEEDED') {
        console.error('⚠️  Cuota de OpenAI agotada - no se puede detectar comando');
        return;
      }
      
      // Para otros errores, continuar con mensaje de ayuda
    }

    // Mensaje no reconocido
    await CorinaNotificacionService.enviarMensajeWhatsApp(
      from,
      '👋 Hola! Soy CORINA, tu asistente de inventario.\n\n' +
        'Puedo ayudarte con:\n' +
        '• Consultar alertas de inventario\n' +
        '• Ver listado de materias primas\n' +
        '• Ver listado de compras\n' +
        '• Ver listado de fórmulas\n' +
        '• Ver listado de fabricaciones\n' +
        '• Ver listado de proveedores\n' +
        '• Ver listado de animales (piensos)\n' +
        '• Ver informe de inventario\n\n' +
        'Ejemplos:\n' +
        '• "Quiero ver las compras de (nombre de alguna de tus plantas)"\n' +
        '• "Listado de materias primas"\n' +
        '• "Informe de inventario de la granja 1"\n\n' +
        'Próximamente podrás crear registros por voz. 🎤'
    );
  } catch (error: any) {
    console.error('Error procesando mensaje de texto:', error);
    
    // Manejar error de límite diario de Twilio
    if (error.message === 'LIMITE_DIARIO_TWILIO' || 
        error.code === 63038 || 
        (error.status === 429 && error.message?.includes('daily messages limit'))) {
      // No intentar enviar otro mensaje - ya se alcanzó el límite
      console.error('⚠️  No se puede enviar mensaje de error: límite diario de Twilio Sandbox alcanzado');
      console.error('   El límite se resetea cada 24 horas. Ver: backend/docs/LIMITE_DIARIO_TWILIO_SANDBOX.md');
      return; // Salir silenciosamente sin intentar enviar más mensajes
    }
    
    // Para otros errores, intentar enviar mensaje de error (si no es otro error de Twilio)
    try {
      const { CorinaNotificacionService: CorinaService } = await import('../services/corinaNotificacionService');
      await CorinaService.enviarMensajeWhatsApp(
        from,
        '❌ CORINA\n\nLo siento, hubo un error interno al procesar tu solicitud. Por favor, intenta nuevamente más tarde.'
      );
    } catch (mensajeError: any) {
      // Si también falla el mensaje de error, solo registrar
      console.error('Error enviando mensaje de error:', mensajeError.message);
    }
  }
}

/**
 * Obtener historial de interacciones con CORINA
 */
export async function obtenerInteracciones(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { idGranja, limite = 50, offset = 0 } = req.query;

    // TODO: Implementar en CorinaService
    // const interacciones = await CorinaService.obtenerInteracciones({
    //   idUsuario: req.userId,
    //   idGranja: idGranja as string | undefined,
    //   limite: Number(limite),
    //   offset: Number(offset),
    // });

    res.json({
      mensaje: 'Funcionalidad en desarrollo',
      interacciones: [],
    });
  } catch (error: any) {
    console.error('Error obteniendo interacciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * Obtener historial de notificaciones de CORINA
 */
export async function obtenerNotificaciones(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { idGranja, limite = 50, offset = 0 } = req.query;

    const { prisma } = await import('../config/database');

    const where: any = {
      idUsuario: req.userId,
    };

    if (idGranja) {
      where.idGranja = idGranja as string;
    }

    const notificaciones = await prisma.corinaNotificacion.findMany({
      where,
      orderBy: {
        fechaCreacion: 'desc',
      },
      take: Number(limite),
      skip: Number(offset),
      include: {
        granja: {
          select: {
            nombreGranja: true,
          },
        },
      },
    });

    const total = await prisma.corinaNotificacion.count({ where });

    res.json({
      notificaciones,
      total,
      limite: Number(limite),
      offset: Number(offset),
    });
  } catch (error: any) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * Obtener estado de configuración de CORINA
 */
export async function obtenerEstadoConfiguracion(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { prisma } = await import('../config/database');
    const { obtenerPlanEfectivo } = await import('../middleware/validateEnterpriseFeature');
    const { CorinaNotificacionService } = await import('../services/corinaNotificacionService');

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.userId },
      select: {
        planSuscripcion: true,
        telefono: true,
        telefonoVerificado: true,
        notificacionesWhatsAppActivas: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const planEfectivo = await obtenerPlanEfectivo(req.userId);
    const tieneNotificacionesActivas = await CorinaNotificacionService.tieneNotificacionesActivas(req.userId);

    res.json({
      planEfectivo,
      tienePlanEnterprise: planEfectivo === 'ENTERPRISE',
      telefono: usuario.telefono,
      telefonoVerificado: usuario.telefonoVerificado,
      notificacionesWhatsAppActivas: usuario.notificacionesWhatsAppActivas,
      tieneNotificacionesActivas,
    });
  } catch (error: any) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * Configurar notificaciones de CORINA
 */
export async function configurarNotificaciones(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { notificacionesWhatsAppActivas } = req.body;

    if (typeof notificacionesWhatsAppActivas !== 'boolean') {
      return res.status(400).json({ error: 'notificacionesWhatsAppActivas debe ser un booleano' });
    }

    const { prisma } = await import('../config/database');

    const usuario = await prisma.usuario.update({
      where: { id: req.userId },
      data: {
        notificacionesWhatsAppActivas,
      },
      select: {
        notificacionesWhatsAppActivas: true,
        telefonoVerificado: true,
      },
    });

    res.json({
      mensaje: 'Configuración actualizada',
      notificacionesWhatsAppActivas: usuario.notificacionesWhatsAppActivas,
      telefonoVerificado: usuario.telefonoVerificado,
    });
  } catch (error: any) {
    console.error('Error configurando notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * Iniciar verificación de teléfono
 */
export async function iniciarVerificacionTelefono(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { telefono } = req.body;

    if (!telefono || typeof telefono !== 'string') {
      return res.status(400).json({ error: 'Teléfono requerido' });
    }

    // Validar formato de teléfono (debe empezar con +)
    if (!telefono.startsWith('+')) {
      return res.status(400).json({ error: 'El teléfono debe incluir código de país (ej: +5493515930163)' });
    }

    const { prisma } = await import('../config/database');
    const { CorinaNotificacionService } = await import('../services/corinaNotificacionService');

    // Generar código de verificación (6 dígitos)
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();

    // Actualizar usuario con teléfono y código
    await prisma.usuario.update({
      where: { id: req.userId },
      data: {
        telefono: telefono.startsWith('whatsapp:') ? telefono : `whatsapp:${telefono}`,
        codigoVerificacionTelefono: codigoVerificacion,
        telefonoVerificado: false,
      },
    });

    // Enviar código por WhatsApp
    const mensaje = `🔐 CORINA\n\nCódigo de verificación\n\nTu código es: ${codigoVerificacion}\n\nEste código expira en 10 minutos.`;
    await CorinaNotificacionService.enviarMensajeWhatsApp(
      telefono.startsWith('whatsapp:') ? telefono : `whatsapp:${telefono}`,
      mensaje
    );

    res.json({
      mensaje: 'Código de verificación enviado por WhatsApp',
      telefono: telefono.startsWith('whatsapp:') ? telefono : `whatsapp:${telefono}`,
    });
  } catch (error: any) {
    console.error('Error iniciando verificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * Verificar código de teléfono
 */
export async function verificarCodigoTelefono(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { codigo } = req.body;

    if (!codigo || typeof codigo !== 'string') {
      return res.status(400).json({ error: 'Código requerido' });
    }

    const { prisma } = await import('../config/database');

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.userId },
      select: {
        codigoVerificacionTelefono: true,
        telefono: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!usuario.codigoVerificacionTelefono) {
      return res.status(400).json({ error: 'No hay código de verificación pendiente' });
    }

    if (usuario.codigoVerificacionTelefono !== codigo) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    // Código correcto, marcar teléfono como verificado
    await prisma.usuario.update({
      where: { id: req.userId },
      data: {
        telefonoVerificado: true,
        fechaVerificacionTelefono: new Date(),
        codigoVerificacionTelefono: null, // Limpiar código usado
      },
    });

    res.json({
      mensaje: 'Teléfono verificado exitosamente',
      telefonoVerificado: true,
    });
  } catch (error: any) {
    console.error('Error verificando código:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

