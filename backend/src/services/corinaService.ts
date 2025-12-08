/**
 * Servicio principal de CORINA
 * Maneja la lógica de negocio para procesar mensajes de WhatsApp,
 * transcribir audios, extraer datos con NLP y crear registros
 */

import prisma from '../lib/prisma';
import { MensajeWhatsApp, DatosExtraidosNLP, RespuestaCorina } from '../types/corina';
import { CorinaNotificacionService } from './corinaNotificacionService';
import { TipoInteraccionCorina, EstadoInteraccionCorina } from '@prisma/client';

export class CorinaService {
  /**
   * Procesar audio recibido de WhatsApp
   * Descarga el audio, lo transcribe y procesa el texto resultante
   */
  static async procesarAudio(
    mediaUrl: string,
    from: string,
    mediaSid: string | null,
    messageSid: string | null
  ): Promise<void> {
    try {
      console.log('🎤 Iniciando procesamiento de audio...');
      console.log('  Media URL:', mediaUrl);
      console.log('  From:', from);

      // Buscar usuario por teléfono
      const usuario = await prisma.usuario.findFirst({
        where: {
          telefono: from,
          telefonoVerificado: true,
        },
        include: {
          granjas: {
            where: {
              activa: true,
            },
          },
        },
      });

      if (!usuario) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          from,
          '❌ CORINA\n\nNo se encontró tu cuenta o tu teléfono no está verificado.\n\nPor favor, verifica tu teléfono desde la aplicación web.'
        );
        return;
      }

      if (usuario.granjas.length === 0) {
        await CorinaNotificacionService.enviarMensajeWhatsApp(
          from,
          '❌ CORINA\n\nNo tienes granjas activas configuradas.'
        );
        return;
      }

      const idGranja = usuario.granjas[0].id;

      // Crear registro de interacción
      let interaccion = await prisma.corinaInteraccion.create({
        data: {
          idUsuario: usuario.id,
          idGranja: idGranja,
          tipoInteraccion: 'MENSAJE_AUDIO',
          estadoInteraccion: 'PROCESANDO',
          urlAudioOriginal: mediaUrl,
          fechaProcesamiento: new Date(),
        },
      });

      try {
        // Descargar audio
        console.log('⬇️ Descargando audio...');
        const audioBuffer = await this.descargarAudio(mediaUrl);

        // Transcribir audio
        console.log('🎙️ Transcribiendo audio...');
        const textoTranscrito = await this.transcribirAudio(audioBuffer);

        // Actualizar interacción con transcripción
        await prisma.corinaInteraccion.update({
          where: { id: interaccion.id },
          data: {
            mensajeRecibido: textoTranscrito,
            estadoInteraccion: 'COMPLETADA',
            fechaCompletada: new Date(),
          },
        });

        console.log('✅ Transcripción completada:', textoTranscrito);

        // Procesar el texto transcrito como si fuera un mensaje de texto
        // Esto permite que comandos como "CORINA alertas" funcionen también por audio
        const { procesarMensajeTexto } = await import('../controllers/corinaController');
        await procesarMensajeTexto(from, textoTranscrito);

        // Actualizar interacción con respuesta
        await prisma.corinaInteraccion.update({
          where: { id: interaccion.id },
          data: {
            respuestaCorina: `Transcripción: "${textoTranscrito}" - Procesado como mensaje de texto`,
          },
        });
      } catch (error: any) {
        console.error('❌ Error procesando audio:', error);
        
        // Manejar error de cuota agotada específicamente
        const isQuotaError = error.message === 'QUOTA_EXCEEDED' || 
                           error.message?.includes('quota') ||
                           error.message?.includes('exceeded') ||
                           error.message?.includes('insufficient_quota') ||
                           (error.originalError && (
                             error.originalError.code === 'insufficient_quota' ||
                             error.originalError.status === 429 ||
                             error.originalError.type === 'insufficient_quota'
                           ));
        
        if (isQuotaError) {
          await CorinaNotificacionService.enviarMensajeWhatsApp(
            from,
            '❌ CORINA\n\nLo siento, la cuota de transcripción de audio se ha agotado temporalmente.\n\nPor favor, envía tu mensaje como texto en lugar de audio, o contacta al administrador del sistema.\n\nEjemplo: "CORINA alertas" o "Quiero ver las alertas de inventario".'
          );
          
          // Actualizar interacción con error
          await prisma.corinaInteraccion.update({
            where: { id: interaccion.id },
            data: {
              estadoInteraccion: 'ERROR',
              errorMensaje: 'Cuota de OpenAI agotada',
            },
          });
          return;
        }
        
        // Otros errores - actualizar interacción y relanzar
        await prisma.corinaInteraccion.update({
          where: { id: interaccion.id },
          data: {
            estadoInteraccion: 'ERROR',
            errorMensaje: error.message || 'Error desconocido',
          },
        });
        
        throw error;
      }
    } catch (error: any) {
      console.error('❌ Error general procesando audio:', error);
      throw error;
    }
  }

  /**
   * Descargar audio de Twilio
   */
  static async descargarAudio(mediaUrl: string): Promise<Buffer> {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        throw new Error('Credenciales de Twilio no configuradas');
      }

      // Twilio requiere autenticación básica para descargar media
      const url = new URL(mediaUrl);
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const response = await fetch(mediaUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error descargando audio: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      console.error('❌ Error descargando audio:', error);
      throw new Error(`No se pudo descargar el audio: ${error.message}`);
    }
  }

  /**
   * Transcribir audio usando OpenAI Whisper API
   */
  static async transcribirAudio(audioBuffer: Buffer): Promise<string> {
    try {
      const { OpenAI } = await import('openai');
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY no configurada');
      }

      const openai = new OpenAI({ apiKey });

      // Guardar audio temporalmente
      const tempDir = os.tmpdir();
      const tempPath = path.join(tempDir, `corina-audio-${Date.now()}.ogg`);

      try {
        fs.writeFileSync(tempPath, audioBuffer);

        console.log('📤 Enviando audio a Whisper API...');
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempPath),
          model: 'whisper-1',
          language: 'es', // Español
        });

        return transcription.text;
      } finally {
        // Limpiar archivo temporal
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
            console.log('🗑️ Archivo temporal eliminado');
          }
        } catch (cleanupError) {
          console.warn('⚠️ Error eliminando archivo temporal:', cleanupError);
        }
      }
    } catch (error: any) {
      console.error('❌ Error transcribiendo audio:', error);
      console.error('   Código:', error.code);
      console.error('   Status:', error.status);
      console.error('   Tipo:', error.type);
      console.error('   Mensaje completo:', JSON.stringify(error, null, 2));
      
      // Manejar errores específicos de OpenAI - cuota agotada
      if (error.code === 'insufficient_quota' || 
          error.status === 429 || 
          error.type === 'insufficient_quota' ||
          error.message?.includes('quota') ||
          error.message?.includes('exceeded') ||
          error.message?.includes('insufficient_quota')) {
        console.error('⚠️  Error de cuota detectado - puede ser:');
        console.error('   1. Créditos agotados');
        console.error('   2. Rate limit temporal');
        console.error('   3. Cuenta sin créditos iniciales');
        console.error('   Verifica en: https://platform.openai.com/account/billing');
        
        const quotaError = new Error('QUOTA_EXCEEDED');
        (quotaError as any).originalError = error;
        throw quotaError;
      }
      
      throw new Error(`No se pudo transcribir el audio: ${error.message}`);
    }
  }

  /**
   * Detectar tipo de comando usando GPT-3.5
   * Clasifica el mensaje para determinar qué tipo de registro quiere crear el usuario
   */
  static async detectarTipoComando(texto: string): Promise<{
    tipoComando: string;
    confianza: number;
    razon: string;
  }> {
    try {
      const { OpenAI } = await import('openai');
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY no configurada');
      }

      const openai = new OpenAI({ apiKey });

      const prompt = `Eres CORINA, un asistente de inventario para granjas. Analiza el siguiente mensaje del usuario y determina qué tipo de registro quiere crear o qué acción quiere realizar.

Tipos de comandos disponibles:
- CREAR_MATERIA_PRIMA: Crear una nueva materia prima (ej: "crear materia prima maíz", "registrar soja")
- CREAR_PIENSO: Crear un nuevo tipo de animal/pienso (ej: "crear pienso para cerdos", "registrar alimento para pollos")
- CREAR_PROVEEDOR: Crear un nuevo proveedor (ej: "agregar proveedor Juan Pérez", "registrar proveedor")
- CREAR_FORMULA: Crear una nueva fórmula de alimentación (ej: "crear fórmula para engorde", "nueva fórmula")
- CREAR_COMPRA: Registrar una compra (ej: "compré 100 kg de maíz", "registrar compra")
- CREAR_FABRICACION: Registrar una fabricación (ej: "fabricamos 500 kg", "registrar fabricación")
- CONSULTA_ALERTAS: Consultar alertas de inventario (ya implementado)
- CONSULTA_INVENTARIO: Consultar inventario (ya implementado)
- DESCONOCIDO: No se pudo identificar la intención

Mensaje del usuario: "${texto}"

Responde SOLO con un JSON válido en este formato exacto:
{
  "tipoComando": "CREAR_MATERIA_PRIMA" | "CREAR_PIENSO" | "CREAR_PROVEEDOR" | "CREAR_FORMULA" | "CREAR_COMPRA" | "CREAR_FABRICACION" | "CONSULTA_ALERTAS" | "CONSULTA_INVENTARIO" | "DESCONOCIDO",
  "confianza": 0.0-1.0,
  "razon": "Breve explicación de por qué se clasificó así"
}

IMPORTANTE:
- Si el mensaje es una consulta (ver, listar, mostrar), usa CONSULTA_ALERTAS o CONSULTA_INVENTARIO
- Si el mensaje es sobre crear/registrar/agregar algo, identifica el tipo específico
- Si no estás seguro, usa DESCONOCIDO con confianza baja (<0.5)
- Responde SOLO con el JSON, sin texto adicional`;

      console.log('🤖 Detectando tipo de comando con GPT-3.5...');
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres CORINA, un asistente de inventario para granjas. Analizas mensajes y clasificas la intención del usuario.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Baja temperatura para respuestas más consistentes
        max_tokens: 200,
        response_format: { type: 'json_object' }, // Forzar respuesta JSON
      });

      const contenido = response.choices[0]?.message?.content;
      if (!contenido) {
        throw new Error('No se recibió respuesta de GPT-3.5');
      }

      console.log('📥 Respuesta de GPT-3.5:', contenido);

      try {
        const resultado = JSON.parse(contenido);
        
        // Validar estructura de respuesta
        if (!resultado.tipoComando || typeof resultado.confianza !== 'number') {
          throw new Error('Respuesta de GPT-3.5 con formato inválido');
        }

        console.log(`✅ Tipo detectado: ${resultado.tipoComando} (confianza: ${resultado.confianza})`);
        return {
          tipoComando: resultado.tipoComando,
          confianza: resultado.confianza,
          razon: resultado.razon || 'Sin razón proporcionada',
        };
      } catch (parseError: any) {
        console.error('❌ Error parseando respuesta de GPT-3.5:', parseError);
        throw new Error(`Error parseando respuesta de GPT-3.5: ${parseError.message}`);
      }
    } catch (error: any) {
      console.error('❌ Error detectando tipo de comando:', error);
      
      // Manejar errores de autenticación de OpenAI
      if (error.code === 'invalid_api_key' || 
          error.status === 401 || 
          error.type === 'invalid_request_error' ||
          error.message?.includes('Incorrect API key') ||
          error.message?.includes('invalid_api_key')) {
        console.error('⚠️  Error de autenticación de OpenAI: API key inválida');
        console.error('   Verifica que OPENAI_API_KEY esté configurada correctamente en Render');
        console.error('   Guía: docs/06-GUIAS/TROUBLESHOOTING/SOLUCION_ERRORES_AUTENTICACION_CORINA.md');
        
        const authError: any = new Error('OPENAI_AUTH_ERROR');
        authError.code = 'invalid_api_key';
        authError.status = 401;
        throw authError;
      }
      
      // Manejar errores de cuota
      if (error.code === 'insufficient_quota' || 
          error.status === 429 || 
          error.message === 'QUOTA_EXCEEDED' ||
          error.message?.includes('quota')) {
        console.error('⚠️  Cuota de OpenAI agotada');
        
        const quotaError: any = new Error('QUOTA_EXCEEDED');
        quotaError.code = 'insufficient_quota';
        throw quotaError;
      }
      
      throw error;
      } catch (parseError: any) {
        console.error('❌ Error parseando respuesta de GPT-3.5:', parseError);
        console.error('   Contenido recibido:', contenido);
        throw new Error(`Error parseando respuesta: ${parseError.message}`);
      }
    } catch (error: any) {
      console.error('❌ Error detectando tipo de comando:', error);
      
      // Manejar errores de cuota
      if (error.code === 'insufficient_quota' || 
          error.status === 429 ||
          error.message?.includes('quota')) {
        throw new Error('QUOTA_EXCEEDED');
      }
      
      // En caso de error, retornar DESCONOCIDO
      return {
        tipoComando: 'DESCONOCIDO',
        confianza: 0.0,
        razon: `Error al procesar: ${error.message}`,
      };
    }
  }

  /**
   * Generar prompt específico según el tipo de comando
   */
  private static generarPromptExtraccion(texto: string, tipoComando: string): string {
    switch (tipoComando) {
      case 'CREAR_MATERIA_PRIMA':
        return `Eres CORINA, un asistente de inventario para granjas. Extrae los siguientes datos del mensaje del usuario para crear una materia prima.

Campos requeridos:
- codigoMateriaPrima: Código único de la materia prima (ej: "MAIZ001", "SOJA002", "TRIGO003", "MAIZ_TEST_002", "test002")
- nombreMateriaPrima: Nombre completo de la materia prima (puede tener múltiples palabras, ej: "Maíz", "Soja", "Trigo", "Test-maiz", "Maíz Amarillo", "Maíz-test", "sorgo-test")

Mensaje del usuario: "${texto}"

INSTRUCCIONES PARA EXTRAER EL CÓDIGO:
1. El código puede venir después de palabras como: "con código", "código", "con codigo", "codigo", "código:", "codigo:"
2. El código también puede venir solo en el mensaje (ej: "test002", "MAIZ001")
3. El código generalmente es una secuencia de letras y números sin espacios (puede tener guiones bajos o guiones)
4. Si el mensaje contiene solo un código (ej: "código: test002" o "test002"), extrae ese código
5. PRESERVA el código tal como aparece, incluyendo mayúsculas, minúsculas y guiones

INSTRUCCIONES PARA EXTRAER EL NOMBRE:
1. El nombre de la materia prima puede tener UNA O MÁS PALABRAS
2. El nombre generalmente viene después de las palabras "materia prima" o "materia"
3. El nombre termina cuando encuentras palabras como: "con código", "código", "con codigo", "codigo", o al final del mensaje
4. PRESERVA el nombre completo tal como aparece en el mensaje, incluyendo guiones, espacios y mayúsculas/minúsculas
5. NO normalices el nombre a "primera letra mayúscula" - mantén el formato original del usuario

Ejemplos de extracción:
- Mensaje: "Crear materia prima Test-maiz con código MAIZ_TEST_002"
  → codigoMateriaPrima: "MAIZ_TEST_002", nombreMateriaPrima: "Test-maiz"
  
- Mensaje: "Crear materia prima sorgo-test con código test002 en PORCINO S.A."
  → codigoMateriaPrima: "test002", nombreMateriaPrima: "sorgo-test"
  
- Mensaje: "Crear materia prima Maíz Amarillo con código MAIZ001"
  → codigoMateriaPrima: "MAIZ001", nombreMateriaPrima: "Maíz Amarillo"
  
- Mensaje: "código: test002"
  → codigoMateriaPrima: "test002", nombreMateriaPrima: null
  
- Mensaje: "test002"
  → codigoMateriaPrima: "test002", nombreMateriaPrima: null
  
- Mensaje: "Crear materia prima aaa con código MAIZ_TEST_001"
  → codigoMateriaPrima: "MAIZ_TEST_001", nombreMateriaPrima: "aaa"

Responde SOLO con un JSON válido en este formato:
{
  "codigoMateriaPrima": "MAIZ001" o null,
  "nombreMateriaPrima": "Nombre completo tal como aparece" o null
}

IMPORTANTE:
- Si el código no está presente, usa null
- Si el nombre no está presente, usa null
- PRESERVA tanto el código como el nombre con su formato original (mayúsculas, minúsculas, guiones, espacios)
- NO normalices ni cambies el formato
- Responde SOLO con el JSON, sin texto adicional`;

      case 'CREAR_PROVEEDOR':
        return `Eres CORINA, un asistente de inventario para granjas. Extrae los siguientes datos del mensaje del usuario para crear un proveedor.

Campos requeridos:
- codigoProveedor: Código único del proveedor (ej: "PROV001", "PROV002", "PROV_TEST_001")
- nombreProveedor: Nombre completo del proveedor (puede tener múltiples palabras, ej: "Juan Pérez", "Distribuidora ABC", "Agropecuaria San Martín S.A.", "Distribuidora-test")

Campos opcionales:
- direccion: Dirección del proveedor (ej: "Calle 123", "Av. Principal 456")
- localidad: Localidad del proveedor (ej: "Córdoba", "Buenos Aires")

Mensaje del usuario: "${texto}"

INSTRUCCIONES PARA EXTRAER EL CÓDIGO:
1. El código puede venir después de palabras como: "con código", "código", "con codigo", "codigo", "código:", "codigo:"
2. El código generalmente es una secuencia de letras y números sin espacios (puede tener guiones bajos o guiones)
3. PRESERVA el código tal como aparece, incluyendo mayúsculas, minúsculas y guiones

INSTRUCCIONES PARA EXTRAER EL NOMBRE:
1. El nombre del proveedor puede tener UNA O MÁS PALABRAS
2. El nombre generalmente viene después de las palabras "proveedor", "agregar proveedor", "crear proveedor", "registrar proveedor"
3. El nombre termina cuando encuentras palabras como: "con código", "código", "con codigo", "codigo", "dirección", "localidad", o al final del mensaje
4. PRESERVA el nombre completo tal como aparece en el mensaje, incluyendo guiones, espacios, mayúsculas/minúsculas y abreviaciones (S.A., S.R.L., etc.)
5. NO normalices el nombre - mantén el formato original del usuario

Ejemplos de extracción:
- Mensaje: "Crear proveedor Distribuidora-test con código PROV_TEST_001"
  → codigoProveedor: "PROV_TEST_001", nombreProveedor: "Distribuidora-test"
  
- Mensaje: "Agregar proveedor Juan Pérez con código PROV001"
  → codigoProveedor: "PROV001", nombreProveedor: "Juan Pérez"
  
- Mensaje: "Crear proveedor Agropecuaria San Martín S.A. con código PROV002 en PORCINO S.A."
  → codigoProveedor: "PROV002", nombreProveedor: "Agropecuaria San Martín S.A."
  
- Mensaje: "código: PROV001"
  → codigoProveedor: "PROV001", nombreProveedor: null

Responde SOLO con un JSON válido en este formato:
{
  "codigoProveedor": "PROV001" o null,
  "nombreProveedor": "Nombre completo tal como aparece" o null,
  "direccion": "Calle 123" o null,
  "localidad": "Córdoba" o null
}

IMPORTANTE:
- Si algún campo no está presente, usa null
- PRESERVA tanto el código como el nombre con su formato original (mayúsculas, minúsculas, guiones, espacios, abreviaciones)
- NO normalices ni cambies el formato
- Responde SOLO con el JSON, sin texto adicional`;

      case 'CREAR_PIENSO':
        return `Eres CORINA, un asistente de inventario para granjas. Extrae los siguientes datos del mensaje del usuario para crear un animal/pienso.

Campos requeridos:
- codigoAnimal: Código único del animal/pienso (ej: "CERDO001", "POLLO001", "VACA001", "CERDO_TEST_001")
- descripcionAnimal: Descripción completa del animal/pienso (puede tener múltiples palabras, ej: "Cerdo Engorde", "Pollo Inicio", "Vaca Lechera", "Cerdo-test Engorde", "Pollo Inicio Premium")
- categoriaAnimal: Categoría del animal/pienso (ej: "Engorde", "Inicio", "Finalización", "Lechera", "Reproductor")

Mensaje del usuario: "${texto}"

INSTRUCCIONES PARA EXTRAER EL CÓDIGO:
1. El código puede venir después de palabras como: "con código", "código", "con codigo", "codigo", "código:", "codigo:"
2. El código generalmente es una secuencia de letras y números sin espacios (puede tener guiones bajos o guiones)
3. PRESERVA el código tal como aparece, incluyendo mayúsculas, minúsculas y guiones

INSTRUCCIONES PARA EXTRAER LA DESCRIPCIÓN:
1. La descripción del animal/pienso puede tener UNA O MÁS PALABRAS
2. La descripción generalmente viene después de las palabras "pienso", "animal", "crear pienso", "crear animal", "registrar pienso"
3. La descripción termina cuando encuentras palabras como: "con código", "código", "categoría", "categoria", o al final del mensaje
4. PRESERVA la descripción completa tal como aparece en el mensaje, incluyendo guiones, espacios y mayúsculas/minúsculas
5. NO normalices la descripción - mantén el formato original del usuario

INSTRUCCIONES PARA EXTRAER LA CATEGORÍA:
1. La categoría puede venir después de palabras como: "categoría", "categoria", "tipo", "para"
2. La categoría generalmente es una sola palabra o frase corta (ej: "Engorde", "Inicio", "Finalización")
3. Si no se especifica explícitamente, intenta inferirla de la descripción (ej: si dice "Cerdo Engorde", la categoría es "Engorde")

Ejemplos de extracción:
- Mensaje: "Crear pienso Cerdo-test Engorde con código CERDO_TEST_001 y categoría Engorde"
  → codigoAnimal: "CERDO_TEST_001", descripcionAnimal: "Cerdo-test Engorde", categoriaAnimal: "Engorde"
  
- Mensaje: "Crear pienso Pollo Inicio Premium con código POLLO001"
  → codigoAnimal: "POLLO001", descripcionAnimal: "Pollo Inicio Premium", categoriaAnimal: "Inicio" (inferida)
  
- Mensaje: "Agregar animal Vaca Lechera con código VACA001 y categoría Lechera"
  → codigoAnimal: "VACA001", descripcionAnimal: "Vaca Lechera", categoriaAnimal: "Lechera"
  
- Mensaje: "código: CERDO001"
  → codigoAnimal: "CERDO001", descripcionAnimal: null, categoriaAnimal: null

Responde SOLO con un JSON válido en este formato:
{
  "codigoAnimal": "CERDO001" o null,
  "descripcionAnimal": "Descripción completa tal como aparece" o null,
  "categoriaAnimal": "Engorde" o null
}

IMPORTANTE:
- Si algún campo no está presente, usa null
- PRESERVA el código, descripción y categoría con su formato original (mayúsculas, minúsculas, guiones, espacios)
- NO normalices ni cambies el formato
- Responde SOLO con el JSON, sin texto adicional`;

      case 'CREAR_FORMULA':
        return `Eres CORINA, un asistente de inventario para granjas. Extrae los siguientes datos del mensaje del usuario para crear una fórmula:

Campos requeridos:
- codigoFormula: Código único de la fórmula (ej: "FORM001", "FORM002")
- descripcionFormula: Descripción de la fórmula (ej: "Fórmula Engorde", "Fórmula Inicio")
- idAnimal: Código o descripción del animal/pienso (ej: "CERDO001" o "Cerdo Engorde")
- detalles: Array de materias primas con cantidades en kg (ej: [{"materiaPrima": "maíz", "cantidadKg": 500}, {"materiaPrima": "soja", "cantidadKg": 500}])

Mensaje del usuario: "${texto}"

Responde SOLO con un JSON válido en este formato:
{
  "codigoFormula": "FORM001" o null,
  "descripcionFormula": "Fórmula Engorde" o null,
  "idAnimal": "CERDO001" o "Cerdo Engorde" o null,
  "detalles": [
    {"materiaPrima": "maíz", "cantidadKg": 500},
    {"materiaPrima": "soja", "cantidadKg": 500}
  ] o []
}

IMPORTANTE:
- Si algún campo no está presente, usa null o array vacío
- Las cantidades deben estar en kg
- El total de detalles debe sumar aproximadamente 1000 kg (puede variar)
- Responde SOLO con el JSON, sin texto adicional`;

      case 'CREAR_COMPRA':
        return `Eres CORINA, un asistente de inventario para granjas. Extrae los siguientes datos del mensaje del usuario para registrar una compra:

Campos requeridos:
- idProveedor: Código o nombre del proveedor (ej: "PROV001" o "Juan Pérez")
- fechaCompra: Fecha de la compra en formato ISO (YYYY-MM-DD). Si dice "hoy", usa la fecha actual. Si dice "ayer", usa la fecha de ayer.
- detalles: Array de materias primas compradas con cantidades y precios (ej: [{"materiaPrima": "maíz", "cantidadComprada": 100, "precioUnitario": 50}])

Campos opcionales:
- numeroFactura: Número de factura (ej: "FAC-001", "12345")
- observaciones: Observaciones adicionales

Mensaje del usuario: "${texto}"

Responde SOLO con un JSON válido en este formato:
{
  "idProveedor": "PROV001" o "Juan Pérez" o null,
  "fechaCompra": "2025-11-22" o null,
  "numeroFactura": "FAC-001" o null,
  "observaciones": "Texto" o null,
  "detalles": [
    {"materiaPrima": "maíz", "cantidadComprada": 100, "precioUnitario": 50}
  ] o []
}

IMPORTANTE:
- Si algún campo no está presente, usa null o array vacío
- Las cantidades deben estar en kg
- Los precios deben estar en la moneda base (sin símbolo $)
- Normaliza fechas a formato ISO (YYYY-MM-DD)
- Responde SOLO con el JSON, sin texto adicional`;

      case 'CREAR_FABRICACION':
        return `Eres CORINA, un asistente de inventario para granjas. Extrae los siguientes datos del mensaje del usuario para registrar una fabricación:

Campos requeridos:
- idFormula: Código de la fórmula a fabricar (ej: "FORM001", "FORM002")
- descripcionFabricacion: Descripción de la fabricación (ej: "Fabricación Engorde", "Lote 001")
- cantidadFabricacion: Cantidad a fabricar en "veces" (donde 1 vez = 1000 kg). Si dice "500 kg", convierte a 0.5 veces.
- fechaFabricacion: Fecha de fabricación en formato ISO (YYYY-MM-DD). Si dice "hoy", usa la fecha actual.

Campos opcionales:
- observaciones: Observaciones adicionales

Mensaje del usuario: "${texto}"

Responde SOLO con un JSON válido en este formato:
{
  "idFormula": "FORM001" o null,
  "descripcionFabricacion": "Fabricación Engorde" o null,
  "cantidadFabricacion": 1.0 o null,
  "fechaFabricacion": "2025-11-22" o null,
  "observaciones": "Texto" o null
}

IMPORTANTE:
- Si algún campo no está presente, usa null
- cantidadFabricacion debe estar en "veces" (1 vez = 1000 kg)
- Normaliza fechas a formato ISO (YYYY-MM-DD)
- Responde SOLO con el JSON, sin texto adicional`;

      default:
        throw new Error(`Tipo de comando no soportado para extracción: ${tipoComando}`);
    }
  }

  /**
   * Mapear tipo de comando a tabla destino
   */
  private static mapearTipoComandoATablaDestino(tipoComando: string): string {
    const mapa: Record<string, string> = {
      'CREAR_MATERIA_PRIMA': 'materiaPrima',
      'CREAR_PIENSO': 'animal',
      'CREAR_PROVEEDOR': 'proveedor',
      'CREAR_FORMULA': 'formula',
      'CREAR_COMPRA': 'compra',
      'CREAR_FABRICACION': 'fabricacion',
    };

    return mapa[tipoComando] || 'desconocido';
  }

  /**
   * Extraer datos estructurados del texto usando GPT-3.5
   */
  static async extraerDatos(texto: string, tipoComando: string): Promise<DatosExtraidosNLP> {
    try {
      const { OpenAI } = await import('openai');
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY no configurada');
      }

      const openai = new OpenAI({ apiKey });

      // Generar prompt específico según el tipo de comando
      const prompt = this.generarPromptExtraccion(texto, tipoComando);
      const tablaDestino = this.mapearTipoComandoATablaDestino(tipoComando);

      console.log(`🤖 Extrayendo datos con GPT-3.5 para: ${tipoComando}...`);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres CORINA, un asistente de inventario para granjas. Extraes datos estructurados de mensajes de usuarios.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0, // Temperatura 0 para respuestas más deterministas
        max_tokens: 1000,
        response_format: { type: 'json_object' }, // Forzar respuesta JSON
      });

      const contenido = response.choices[0]?.message?.content;
      if (!contenido) {
        throw new Error('No se recibió respuesta de GPT-3.5');
      }

      console.log('📥 Respuesta de GPT-3.5:', contenido);

      try {
        const datosExtraidos = JSON.parse(contenido);

        // Validar que la respuesta tiene la estructura esperada
        if (typeof datosExtraidos !== 'object' || Array.isArray(datosExtraidos)) {
          throw new Error('Respuesta de GPT-3.5 no es un objeto JSON válido');
        }

        // Calcular confianza basada en cuántos campos requeridos están presentes
        const camposRequeridos = this.obtenerCamposRequeridos(tipoComando);
        const camposPresentes = camposRequeridos.filter((campo) => {
          const valor = datosExtraidos[campo];
          return valor !== null && valor !== undefined && valor !== '';
        });
        const confianza = camposRequeridos.length > 0 
          ? camposPresentes.length / camposRequeridos.length 
          : 0.5;

        console.log(`✅ Datos extraídos: ${JSON.stringify(datosExtraidos)} (confianza: ${confianza.toFixed(2)})`);

        return {
          tablaDestino,
          datos: datosExtraidos,
          confianza,
        };
      } catch (parseError: any) {
        console.error('❌ Error parseando respuesta de GPT-3.5:', parseError);
        console.error('   Contenido recibido:', contenido);
        throw new Error(`Error parseando respuesta: ${parseError.message}`);
      }
    } catch (error: any) {
      console.error('❌ Error extrayendo datos:', error);
      
      // Manejar errores de cuota - lanzar error para que el controlador lo maneje
      if (error.code === 'insufficient_quota' || 
          error.status === 429 ||
          error.message?.includes('quota')) {
        throw new Error('QUOTA_EXCEEDED');
      }
      
      // Si es error de tipo no soportado, lanzar error
      if (error.message?.includes('Tipo de comando no soportado')) {
        throw error;
      }
      
      // En caso de otros errores, retornar estructura vacía con baja confianza
      return {
        tablaDestino: this.mapearTipoComandoATablaDestino(tipoComando),
        datos: {},
        confianza: 0.0,
      };
    }
  }

  /**
   * Obtener campos requeridos según el tipo de comando
   */
  private static obtenerCamposRequeridos(tipoComando: string): string[] {
    switch (tipoComando) {
      case 'CREAR_MATERIA_PRIMA':
        return ['codigoMateriaPrima', 'nombreMateriaPrima'];
      case 'CREAR_PROVEEDOR':
        return ['codigoProveedor', 'nombreProveedor'];
      case 'CREAR_PIENSO':
        return ['codigoAnimal', 'descripcionAnimal', 'categoriaAnimal'];
      case 'CREAR_FORMULA':
        return ['codigoFormula', 'descripcionFormula', 'idAnimal', 'detalles'];
      case 'CREAR_COMPRA':
        return ['idProveedor', 'fechaCompra', 'detalles'];
      case 'CREAR_FABRICACION':
        return ['idFormula', 'descripcionFabricacion', 'cantidadFabricacion', 'fechaFabricacion'];
      default:
        return [];
    }
  }

  /**
   * Normalizar y completar datos extraídos para prepararlos para la base de datos
   * - Resuelve referencias (nombres/códigos → IDs)
   * - Normaliza fechas, cantidades, precios
   * - Completa detalles de compras y fórmulas
   * - Valida que todos los datos necesarios estén presentes
   */
  static async normalizarDatos(
    datosExtraidos: DatosExtraidosNLP,
    idGranja: string
  ): Promise<{
    datosNormalizados: Record<string, any>;
    errores: string[];
    advertencias: string[];
  }> {
    const { tablaDestino, datos } = datosExtraidos;
    const errores: string[] = [];
    const advertencias: string[] = [];
    const datosNormalizados: Record<string, any> = { ...datos };

    try {
      switch (tablaDestino) {
        case 'materiaPrima': {
          // PRESERVAR formato original del nombre (no normalizar)
          // El prompt ya instruye a GPT a preservar el formato
          // Solo normalizar código a mayúsculas para consistencia en BD
          if (datosNormalizados.codigoMateriaPrima) {
            datosNormalizados.codigoMateriaPrima = (datosNormalizados.codigoMateriaPrima as string).toUpperCase();
          }
          // El nombre se preserva tal como viene de GPT
          break;
        }

        case 'proveedor': {
          // PRESERVAR formato original del nombre (no normalizar)
          // El prompt ya instruye a GPT a preservar el formato, incluyendo abreviaciones (S.A., S.R.L., etc.)
          // Solo normalizar código a mayúsculas para consistencia en BD
          if (datosNormalizados.codigoProveedor) {
            datosNormalizados.codigoProveedor = (datosNormalizados.codigoProveedor as string).toUpperCase();
          }
          // El nombre se preserva tal como viene de GPT
          // Dirección y localidad también se preservan
          break;
        }

        case 'animal': {
          // PRESERVAR formato original de descripción y categoría (no normalizar)
          // El prompt ya instruye a GPT a preservar el formato
          // Solo normalizar código a mayúsculas para consistencia en BD
          if (datosNormalizados.codigoAnimal) {
            datosNormalizados.codigoAnimal = (datosNormalizados.codigoAnimal as string).toUpperCase();
          }
          // La descripción y categoría se preservan tal como vienen de GPT
          break;
        }

        case 'formula': {
          // Normalizar código (mayúsculas)
          if (datosNormalizados.codigoFormula) {
            datosNormalizados.codigoFormula = (datosNormalizados.codigoFormula as string).toUpperCase();
          }

          // Resolver ID de animal por código o descripción
          if (datosNormalizados.idAnimal && typeof datosNormalizados.idAnimal === 'string') {
            const animalIdentificador = datosNormalizados.idAnimal as string;
            const animal = await prisma.animal.findFirst({
              where: {
                idGranja,
                OR: [
                  { codigoAnimal: animalIdentificador.toUpperCase() },
                  { descripcionAnimal: { contains: animalIdentificador, mode: 'insensitive' } },
                ],
              },
            });

            if (animal) {
              datosNormalizados.idAnimal = animal.id;
            } else {
              errores.push(`No se encontró el animal/pienso: ${animalIdentificador}`);
            }
          }

          // Normalizar y completar detalles de la fórmula
          if (datosNormalizados.detalles && Array.isArray(datosNormalizados.detalles)) {
            const detallesNormalizados = [];
            let totalKg = 0;

            for (const detalle of datosNormalizados.detalles) {
              // Resolver ID de materia prima por nombre o código
              if (detalle.materiaPrima) {
                const materiaPrimaIdentificador = detalle.materiaPrima as string;
                const materiaPrima = await prisma.materiaPrima.findFirst({
                  where: {
                    idGranja,
                    OR: [
                      { codigoMateriaPrima: materiaPrimaIdentificador.toUpperCase() },
                      { nombreMateriaPrima: { contains: materiaPrimaIdentificador, mode: 'insensitive' } },
                    ],
                  },
                });

                if (materiaPrima) {
                  const cantidadKg = Number(detalle.cantidadKg) || 0;
                  totalKg += cantidadKg;

                  detallesNormalizados.push({
                    idMateriaPrima: materiaPrima.id,
                    cantidadKg: cantidadKg,
                  });
                } else {
                  errores.push(`No se encontró la materia prima: ${materiaPrimaIdentificador}`);
                }
              } else {
                errores.push('Detalle de fórmula sin materia prima especificada');
              }
            }

            // Validar que el total sea 1000 kg (con tolerancia)
            if (detallesNormalizados.length > 0) {
              if (Math.abs(totalKg - 1000) > 0.001) {
                // Si el total no es 1000 kg, ajustar proporcionalmente
                const factorAjuste = 1000 / totalKg;
                detallesNormalizados.forEach((detalle) => {
                  detalle.cantidadKg = Math.round((detalle.cantidadKg * factorAjuste) * 100) / 100;
                });
                advertencias.push(
                  `El total de la fórmula se ajustó a 1000 kg (era ${totalKg.toFixed(2)} kg)`
                );
              }

              datosNormalizados.detalles = detallesNormalizados;
            } else {
              errores.push('La fórmula debe tener al menos un detalle con materia prima');
            }
          } else {
            errores.push('La fórmula debe tener detalles (materias primas y cantidades)');
          }
          break;
        }

        case 'compra': {
          // Resolver ID de proveedor por código o nombre
          if (datosNormalizados.idProveedor && typeof datosNormalizados.idProveedor === 'string') {
            const proveedorIdentificador = datosNormalizados.idProveedor as string;
            const proveedor = await prisma.proveedor.findFirst({
              where: {
                idGranja,
                OR: [
                  { codigoProveedor: proveedorIdentificador.toUpperCase() },
                  { nombreProveedor: { contains: proveedorIdentificador, mode: 'insensitive' } },
                ],
              },
            });

            if (proveedor) {
              datosNormalizados.idProveedor = proveedor.id;
            } else {
              errores.push(`No se encontró el proveedor: ${proveedorIdentificador}`);
            }
          }

          // Normalizar fecha
          if (datosNormalizados.fechaCompra) {
            const fechaStr = datosNormalizados.fechaCompra as string;
            let fecha: Date;

            if (fechaStr.toLowerCase() === 'hoy' || fechaStr.toLowerCase() === 'today') {
              fecha = new Date();
            } else if (fechaStr.toLowerCase() === 'ayer' || fechaStr.toLowerCase() === 'yesterday') {
              fecha = new Date();
              fecha.setDate(fecha.getDate() - 1);
            } else {
              fecha = new Date(fechaStr);
            }

            if (isNaN(fecha.getTime())) {
              errores.push(`Fecha inválida: ${fechaStr}`);
            } else {
              datosNormalizados.fechaCompra = fecha;
            }
          }

          // Normalizar y completar detalles de la compra
          if (datosNormalizados.detalles && Array.isArray(datosNormalizados.detalles)) {
            const detallesNormalizados = [];

            for (const detalle of datosNormalizados.detalles) {
              // Resolver ID de materia prima por nombre o código
              if (detalle.materiaPrima) {
                const materiaPrimaIdentificador = detalle.materiaPrima as string;
                const materiaPrima = await prisma.materiaPrima.findFirst({
                  where: {
                    idGranja,
                    OR: [
                      { codigoMateriaPrima: materiaPrimaIdentificador.toUpperCase() },
                      { nombreMateriaPrima: { contains: materiaPrimaIdentificador, mode: 'insensitive' } },
                    ],
                  },
                });

                if (materiaPrima) {
                  const cantidadComprada = Number(detalle.cantidadComprada) || 0;
                  const precioUnitario = Number(detalle.precioUnitario) || 0;

                  if (cantidadComprada <= 0) {
                    errores.push(`Cantidad inválida para ${materiaPrimaIdentificador}: ${cantidadComprada}`);
                  }
                  if (precioUnitario < 0) {
                    errores.push(`Precio inválido para ${materiaPrimaIdentificador}: ${precioUnitario}`);
                  }

                  detallesNormalizados.push({
                    idMateriaPrima: materiaPrima.id,
                    cantidadComprada: cantidadComprada,
                    precioUnitario: precioUnitario,
                  });
                } else {
                  errores.push(`No se encontró la materia prima: ${materiaPrimaIdentificador}`);
                }
              } else {
                errores.push('Detalle de compra sin materia prima especificada');
              }
            }

            if (detallesNormalizados.length > 0) {
              datosNormalizados.detalles = detallesNormalizados;
            } else {
              errores.push('La compra debe tener al menos un detalle con materia prima');
            }
          } else {
            errores.push('La compra debe tener detalles (materias primas, cantidades y precios)');
          }
          break;
        }

        case 'fabricacion': {
          // Resolver ID de fórmula por código
          if (datosNormalizados.idFormula && typeof datosNormalizados.idFormula === 'string') {
            const formulaCodigo = datosNormalizados.idFormula as string;
            const formula = await prisma.formulaCabecera.findUnique({
              where: {
                idGranja_codigoFormula: {
                  idGranja,
                  codigoFormula: formulaCodigo.toUpperCase(),
                },
              },
            });

            if (formula) {
              datosNormalizados.idFormula = formula.id;
            } else {
              errores.push(`No se encontró la fórmula: ${formulaCodigo}`);
            }
          }

          // Normalizar cantidad (asegurar que esté en "veces")
          if (datosNormalizados.cantidadFabricacion !== undefined && datosNormalizados.cantidadFabricacion !== null) {
            let cantidad = Number(datosNormalizados.cantidadFabricacion);
            
            // Si la cantidad es muy grande (>100), probablemente está en kg, convertir a veces
            if (cantidad > 100) {
              cantidad = cantidad / 1000;
              advertencias.push(`Cantidad convertida de kg a veces: ${cantidad} veces`);
            }

            if (cantidad <= 0) {
              errores.push(`Cantidad de fabricación inválida: ${cantidad}`);
            } else {
              datosNormalizados.cantidadFabricacion = cantidad;
            }
          }

          // Normalizar fecha
          if (datosNormalizados.fechaFabricacion) {
            const fechaStr = datosNormalizados.fechaFabricacion as string;
            let fecha: Date;

            if (fechaStr.toLowerCase() === 'hoy' || fechaStr.toLowerCase() === 'today') {
              fecha = new Date();
            } else if (fechaStr.toLowerCase() === 'ayer' || fechaStr.toLowerCase() === 'yesterday') {
              fecha = new Date();
              fecha.setDate(fecha.getDate() - 1);
            } else {
              fecha = new Date(fechaStr);
            }

            if (isNaN(fecha.getTime())) {
              errores.push(`Fecha inválida: ${fechaStr}`);
            } else {
              datosNormalizados.fechaFabricacion = fecha;
            }
          }
          break;
        }

        default:
          errores.push(`Tipo de registro no soportado para normalización: ${tablaDestino}`);
      }

      return {
        datosNormalizados,
        errores,
        advertencias,
      };
    } catch (error: any) {
      console.error('Error normalizando datos:', error);
      errores.push(`Error al normalizar datos: ${error.message}`);
      return {
        datosNormalizados,
        errores,
        advertencias,
      };
    }
  }

  /**
   * Validar datos extraídos antes de crear registro
   * Retorna un objeto con el resultado de la validación y mensajes de error si aplica
   */
  static async validarDatos(
    datos: DatosExtraidosNLP,
    idGranja: string
  ): Promise<{
    esValido: boolean;
    camposFaltantes?: string[];
    errores?: string[];
    mensajeError?: string;
  }> {
    const { tablaDestino, datos: datosExtraidos } = datos;
    const errores: string[] = [];
    const camposFaltantes: string[] = [];

    try {
      switch (tablaDestino) {
        case 'materiaPrima': {
          // Campos requeridos: codigoMateriaPrima, nombreMateriaPrima
          if (!datosExtraidos.codigoMateriaPrima) {
            camposFaltantes.push('código de materia prima');
          }
          if (!datosExtraidos.nombreMateriaPrima) {
            camposFaltantes.push('nombre de materia prima');
          }

          // Validar duplicado de código
          if (datosExtraidos.codigoMateriaPrima) {
            const codigoExistente = await prisma.materiaPrima.findFirst({
              where: {
                idGranja,
                codigoMateriaPrima: datosExtraidos.codigoMateriaPrima as string,
              },
            });

            if (codigoExistente) {
              errores.push(
                `Ya existe una materia prima con el código "${datosExtraidos.codigoMateriaPrima}". Por favor, usa un código diferente.`
              );
            }
          }

          break;
        }

        case 'proveedor': {
          // Campos requeridos: codigoProveedor, nombreProveedor
          if (!datosExtraidos.codigoProveedor) {
            camposFaltantes.push('código de proveedor');
          }
          if (!datosExtraidos.nombreProveedor) {
            camposFaltantes.push('nombre del proveedor');
          }

          // Validar duplicado de código
          if (datosExtraidos.codigoProveedor) {
            const codigoExistente = await prisma.proveedor.findFirst({
              where: {
                idGranja,
                codigoProveedor: datosExtraidos.codigoProveedor as string,
              },
            });

            if (codigoExistente) {
              errores.push(
                `Ya existe un proveedor con el código "${datosExtraidos.codigoProveedor}". Por favor, usa un código diferente.`
              );
            }
          }

          break;
        }

        case 'animal': {
          // Campos requeridos: codigoAnimal, descripcionAnimal, categoriaAnimal
          if (!datosExtraidos.codigoAnimal) {
            camposFaltantes.push('código de animal/pienso');
          }
          if (!datosExtraidos.descripcionAnimal) {
            camposFaltantes.push('descripción del animal/pienso');
          }
          if (!datosExtraidos.categoriaAnimal) {
            camposFaltantes.push('categoría del animal/pienso');
          }

          // Validar duplicado de código
          if (datosExtraidos.codigoAnimal) {
            const codigoExistente = await prisma.animal.findFirst({
              where: {
                idGranja,
                codigoAnimal: datosExtraidos.codigoAnimal as string,
              },
            });

            if (codigoExistente) {
              errores.push(
                `Ya existe un animal/pienso con el código "${datosExtraidos.codigoAnimal}". Por favor, usa un código diferente.`
              );
            }
          }

          break;
        }

        case 'formula': {
          // Campos requeridos: codigoFormula, descripcionFormula, idAnimal, detalles
          if (!datosExtraidos.codigoFormula) {
            camposFaltantes.push('código de fórmula');
          }
          if (!datosExtraidos.descripcionFormula) {
            camposFaltantes.push('descripción de la fórmula');
          }
          if (!datosExtraidos.idAnimal) {
            camposFaltantes.push('animal/pienso para la fórmula');
          }
          if (!datosExtraidos.detalles || !Array.isArray(datosExtraidos.detalles) || datosExtraidos.detalles.length === 0) {
            camposFaltantes.push('detalles de la fórmula (materias primas y cantidades)');
          } else {
            // Validar que cada detalle tenga idMateriaPrima y cantidadKg
            datosExtraidos.detalles.forEach((detalle: any, index: number) => {
              if (!detalle.idMateriaPrima) {
                camposFaltantes.push(`materia prima en el detalle ${index + 1}`);
              }
              if (detalle.cantidadKg === undefined || detalle.cantidadKg === null) {
                camposFaltantes.push(`cantidad en kg para el detalle ${index + 1}`);
              }
            });
          }

          // Validar duplicado de código
          if (datosExtraidos.codigoFormula) {
            const codigoExistente = await prisma.formulaCabecera.findUnique({
              where: {
                idGranja_codigoFormula: {
                  idGranja,
                  codigoFormula: datosExtraidos.codigoFormula as string,
                },
              },
            });

            if (codigoExistente) {
              errores.push(
                `Ya existe una fórmula con el código "${datosExtraidos.codigoFormula}". Por favor, usa un código diferente.`
              );
            }
          }

          break;
        }

        case 'compra': {
          // Campos requeridos: idProveedor, fechaCompra, detalles
          if (!datosExtraidos.idProveedor) {
            camposFaltantes.push('proveedor');
          }
          if (!datosExtraidos.fechaCompra) {
            camposFaltantes.push('fecha de compra');
          }
          if (!datosExtraidos.detalles || !Array.isArray(datosExtraidos.detalles) || datosExtraidos.detalles.length === 0) {
            camposFaltantes.push('detalles de la compra (materias primas, cantidades y precios)');
          } else {
            // Validar que cada detalle tenga idMateriaPrima, cantidadComprada y precioUnitario
            datosExtraidos.detalles.forEach((detalle: any, index: number) => {
              if (!detalle.idMateriaPrima) {
                camposFaltantes.push(`materia prima en el detalle ${index + 1}`);
              }
              if (detalle.cantidadComprada === undefined || detalle.cantidadComprada === null) {
                camposFaltantes.push(`cantidad comprada para el detalle ${index + 1}`);
              }
              if (detalle.precioUnitario === undefined || detalle.precioUnitario === null) {
                camposFaltantes.push(`precio unitario para el detalle ${index + 1}`);
              }
            });
          }

          break;
        }

        case 'fabricacion': {
          // Campos requeridos: idFormula, cantidadFabricacion, fechaFabricacion, descripcionFabricacion
          if (!datosExtraidos.idFormula) {
            camposFaltantes.push('fórmula a fabricar');
          }
          if (!datosExtraidos.descripcionFabricacion) {
            camposFaltantes.push('descripción de la fabricación');
          }
          if (datosExtraidos.cantidadFabricacion === undefined || datosExtraidos.cantidadFabricacion === null) {
            camposFaltantes.push('cantidad a fabricar');
          }
          if (!datosExtraidos.fechaFabricacion) {
            camposFaltantes.push('fecha de fabricación');
          }

          break;
        }

        default:
          errores.push(`Tipo de registro desconocido: ${tablaDestino}`);
      }

      // Construir mensaje de error si hay campos faltantes o errores
      let mensajeError = '';
      if (camposFaltantes.length > 0) {
        mensajeError = `Faltan los siguientes datos: ${camposFaltantes.join(', ')}.`;
      }
      if (errores.length > 0) {
        mensajeError += (mensajeError ? ' ' : '') + errores.join(' ');
      }

      return {
        esValido: camposFaltantes.length === 0 && errores.length === 0,
        camposFaltantes: camposFaltantes.length > 0 ? camposFaltantes : undefined,
        errores: errores.length > 0 ? errores : undefined,
        mensajeError: mensajeError || undefined,
      };
    } catch (error: any) {
      console.error('Error validando datos:', error);
      return {
        esValido: false,
        errores: ['Error al validar los datos. Por favor, intenta nuevamente.'],
        mensajeError: 'Error al validar los datos. Por favor, intenta nuevamente.',
      };
    }
  }

  /**
   * Generar mensaje de preview con los datos normalizados y opciones de confirmación
   */
  static async generarMensajePreview(
    tablaDestino: string,
    datosNormalizados: Record<string, any>,
    advertencias: string[] = []
  ): Promise<string> {
    let mensaje = `✅ CORINA\n\n📋 Preview del registro a crear:\n\n`;

    switch (tablaDestino) {
      case 'materiaPrima': {
        mensaje += `• Tipo: Materia Prima\n`;
        mensaje += `• Código: ${datosNormalizados.codigoMateriaPrima}\n`;
        mensaje += `• Nombre: ${datosNormalizados.nombreMateriaPrima}\n`;
        break;
      }

      case 'proveedor': {
        mensaje += `• Tipo: Proveedor\n`;
        mensaje += `• Código: ${datosNormalizados.codigoProveedor}\n`;
        mensaje += `• Nombre: ${datosNormalizados.nombreProveedor}\n`;
        if (datosNormalizados.direccion) {
          mensaje += `• Dirección: ${datosNormalizados.direccion}\n`;
        }
        if (datosNormalizados.localidad) {
          mensaje += `• Localidad: ${datosNormalizados.localidad}\n`;
        }
        break;
      }

      case 'animal': {
        mensaje += `• Tipo: Animal/Pienso\n`;
        mensaje += `• Código: ${datosNormalizados.codigoAnimal}\n`;
        mensaje += `• Descripción: ${datosNormalizados.descripcionAnimal}\n`;
        mensaje += `• Categoría: ${datosNormalizados.categoriaAnimal}\n`;
        break;
      }

      case 'formula': {
        mensaje += `• Tipo: Fórmula\n`;
        mensaje += `• Código: ${datosNormalizados.codigoFormula}\n`;
        mensaje += `• Descripción: ${datosNormalizados.descripcionFormula}\n`;
        
        // Resolver nombre del animal para mostrar
        if (datosNormalizados.idAnimal) {
          try {
            const animal = await prisma.animal.findUnique({
              where: { id: datosNormalizados.idAnimal },
              select: { descripcionAnimal: true },
            });
            if (animal) {
              mensaje += `• Animal: ${animal.descripcionAnimal}\n`;
            }
          } catch (error) {
            // Ignorar error, mostrar solo ID si no se puede resolver
          }
        }

        if (datosNormalizados.detalles && Array.isArray(datosNormalizados.detalles)) {
          mensaje += `• Detalles (${datosNormalizados.detalles.length} materias primas):\n`;
          
          // Resolver nombres de materias primas para mostrar
          for (const detalle of datosNormalizados.detalles.slice(0, 5)) { // Mostrar máximo 5
            try {
              const materiaPrima = await prisma.materiaPrima.findUnique({
                where: { id: detalle.idMateriaPrima },
                select: { nombreMateriaPrima: true, codigoMateriaPrima: true },
              });
              if (materiaPrima) {
                mensaje += `  - ${materiaPrima.codigoMateriaPrima} (${materiaPrima.nombreMateriaPrima}): ${detalle.cantidadKg} kg\n`;
              }
            } catch (error) {
              mensaje += `  - ${detalle.idMateriaPrima}: ${detalle.cantidadKg} kg\n`;
            }
          }
          if (datosNormalizados.detalles.length > 5) {
            mensaje += `  ... y ${datosNormalizados.detalles.length - 5} más\n`;
          }
          mensaje += `• Total: 1000 kg\n`;
        }
        break;
      }

      case 'compra': {
        mensaje += `• Tipo: Compra\n`;
        
        // Resolver nombre del proveedor
        if (datosNormalizados.idProveedor) {
          try {
            const proveedor = await prisma.proveedor.findUnique({
              where: { id: datosNormalizados.idProveedor },
              select: { nombreProveedor: true, codigoProveedor: true },
            });
            if (proveedor) {
              mensaje += `• Proveedor: ${proveedor.codigoProveedor} (${proveedor.nombreProveedor})\n`;
            }
          } catch (error) {
            // Ignorar error
          }
        }

        if (datosNormalizados.fechaCompra) {
          const fecha = datosNormalizados.fechaCompra instanceof Date 
            ? datosNormalizados.fechaCompra.toISOString().split('T')[0]
            : datosNormalizados.fechaCompra;
          mensaje += `• Fecha: ${fecha}\n`;
        }

        if (datosNormalizados.numeroFactura) {
          mensaje += `• Factura: ${datosNormalizados.numeroFactura}\n`;
        }

        if (datosNormalizados.detalles && Array.isArray(datosNormalizados.detalles)) {
          mensaje += `• Detalles (${datosNormalizados.detalles.length} materias primas):\n`;
          
          // Resolver nombres de materias primas para mostrar
          for (const detalle of datosNormalizados.detalles.slice(0, 5)) { // Mostrar máximo 5
            try {
              const materiaPrima = await prisma.materiaPrima.findUnique({
                where: { id: detalle.idMateriaPrima },
                select: { nombreMateriaPrima: true, codigoMateriaPrima: true },
              });
              if (materiaPrima) {
                mensaje += `  - ${materiaPrima.codigoMateriaPrima} (${materiaPrima.nombreMateriaPrima}): ${detalle.cantidadComprada} kg × $${detalle.precioUnitario}\n`;
              }
            } catch (error) {
              mensaje += `  - ${detalle.idMateriaPrima}: ${detalle.cantidadComprada} kg × $${detalle.precioUnitario}\n`;
            }
          }
          if (datosNormalizados.detalles.length > 5) {
            mensaje += `  ... y ${datosNormalizados.detalles.length - 5} más\n`;
          }
        }
        break;
      }

      case 'fabricacion': {
        mensaje += `• Tipo: Fabricación\n`;
        
        // Resolver código de fórmula
        if (datosNormalizados.idFormula) {
          try {
            const formula = await prisma.formulaCabecera.findUnique({
              where: { id: datosNormalizados.idFormula },
              select: { codigoFormula: true, descripcionFormula: true },
            });
            if (formula) {
              mensaje += `• Fórmula: ${formula.codigoFormula} (${formula.descripcionFormula})\n`;
            }
          } catch (error) {
            // Ignorar error
          }
        }

        mensaje += `• Descripción: ${datosNormalizados.descripcionFabricacion}\n`;
        mensaje += `• Cantidad: ${datosNormalizados.cantidadFabricacion} veces (${datosNormalizados.cantidadFabricacion * 1000} kg)\n`;

        if (datosNormalizados.fechaFabricacion) {
          const fecha = datosNormalizados.fechaFabricacion instanceof Date 
            ? datosNormalizados.fechaFabricacion.toISOString().split('T')[0]
            : datosNormalizados.fechaFabricacion;
          mensaje += `• Fecha: ${fecha}\n`;
        }

        if (datosNormalizados.observaciones) {
          mensaje += `• Observaciones: ${datosNormalizados.observaciones}\n`;
        }
        break;
      }

      default:
        mensaje += `• Tipo: ${tablaDestino}\n`;
        mensaje += `• Datos: ${JSON.stringify(datosNormalizados)}\n`;
    }

    // Agregar advertencias si las hay
    // Asegurarse de que advertencias sea un array
    const advertenciasArray = Array.isArray(advertencias) ? advertencias : [];
    if (advertenciasArray.length > 0) {
      mensaje += '\n⚠️ Advertencias:\n';
      advertenciasArray.forEach((advertencia, index) => {
        mensaje += `${index + 1}. ${advertencia}\n`;
      });
    }

    // Agregar opciones de confirmación
    mensaje += '\n\n🤔 ¿Deseas crear este registro?\n\n';
    mensaje += 'Responde:\n';
    mensaje += '• "Sí" o "Confirmar" para crear el registro\n';
    mensaje += '• "No" o "Cancelar" para cancelar\n';
    mensaje += '• "Modificar" para cambiar algún dato';

    return mensaje;
  }

  /**
   * Generar mensaje amigable solicitando datos faltantes
   */
  static generarMensajeSolicitudDatos(
    tablaDestino: string,
    camposFaltantes: string[]
  ): string {
    const nombreTabla = {
      materiaPrima: 'materia prima',
      proveedor: 'proveedor',
      animal: 'animal/pienso',
      formula: 'fórmula',
      compra: 'compra',
      fabricacion: 'fabricación',
    }[tablaDestino] || 'registro';

    let mensaje = `📝 CORINA\n\nPara crear un ${nombreTabla}, necesito los siguientes datos:\n\n`;

    // Mensajes específicos según el tipo
    switch (tablaDestino) {
      case 'materiaPrima':
        mensaje += '• Código de materia prima (ej: MAIZ001)\n';
        mensaje += '• Nombre de la materia prima (ej: Maíz)\n';
        mensaje += '\nEjemplo: "Crear materia prima maíz con código MAIZ001"';
        break;

      case 'proveedor':
        mensaje += '• Código de proveedor (ej: PROV001)\n';
        mensaje += '• Nombre del proveedor (ej: Juan Pérez)\n';
        mensaje += '• Dirección (opcional)\n';
        mensaje += '• Localidad (opcional)\n';
        mensaje += '\nEjemplo: "Agregar proveedor Juan Pérez con código PROV001"';
        break;

      case 'animal':
        mensaje += '• Código de animal/pienso (ej: CERDO001)\n';
        mensaje += '• Descripción (ej: Cerdo Engorde)\n';
        mensaje += '• Categoría (ej: Engorde, Inicio, etc.)\n';
        mensaje += '\nEjemplo: "Crear pienso cerdo engorde con código CERDO001 y categoría Engorde"';
        break;

      case 'formula':
        mensaje += '• Código de fórmula (ej: FORM001)\n';
        mensaje += '• Descripción de la fórmula\n';
        mensaje += '• Animal/pienso para la fórmula\n';
        mensaje += '• Detalles: materias primas y cantidades en kg (total debe ser 1000 kg)\n';
        mensaje += '\nEjemplo: "Crear fórmula FORM001 para cerdo engorde con 500kg de maíz y 500kg de soja"';
        break;

      case 'compra':
        mensaje += '• Proveedor\n';
        mensaje += '• Fecha de compra\n';
        mensaje += '• Número de factura (opcional)\n';
        mensaje += '• Detalles: materias primas, cantidades y precios unitarios\n';
        mensaje += '\nEjemplo: "Compré 100 kg de maíz a $50 por kilo del proveedor PROV001 el día de hoy"';
        break;

      case 'fabricacion':
        mensaje += '• Fórmula a fabricar\n';
        mensaje += '• Descripción de la fabricación\n';
        mensaje += '• Cantidad a fabricar (en veces, donde 1 vez = 1000 kg)\n';
        mensaje += '• Fecha de fabricación\n';
        mensaje += '\nEjemplo: "Fabricamos 0.5 veces de la fórmula FORM001 el día de hoy"';
        break;
    }

    if (camposFaltantes.length > 0) {
      mensaje += `\n\n⚠️ Faltan los siguientes datos:\n`;
      camposFaltantes.forEach((campo, index) => {
        mensaje += `${index + 1}. ${campo}\n`;
      });
      mensaje += '\nPor favor, proporciona estos datos para continuar.';
    }

    return mensaje;
  }

  /**
   * Crear registro en la base de datos usando los servicios existentes
   * IMPORTANTE: Para compras y fabricaciones, usar servicios, NO insertar directo
   */
  static async crearRegistro(
    tablaDestino: string,
    datosNormalizados: Record<string, any>,
    idGranja: string,
    idUsuario: string
  ): Promise<{ id: string; [key: string]: any }> {
    switch (tablaDestino) {
      case 'materiaPrima': {
        const materiaPrima = await prisma.materiaPrima.create({
          data: {
            idGranja,
            codigoMateriaPrima: datosNormalizados.codigoMateriaPrima as string,
            nombreMateriaPrima: datosNormalizados.nombreMateriaPrima as string,
            precioPorKilo: 0, // Sin precio hasta primera compra
          },
        });
        return materiaPrima;
      }

      case 'proveedor': {
        const proveedor = await prisma.proveedor.create({
          data: {
            idGranja,
            codigoProveedor: datosNormalizados.codigoProveedor as string,
            nombreProveedor: datosNormalizados.nombreProveedor as string,
            direccion: datosNormalizados.direccion || null,
            localidad: datosNormalizados.localidad || null,
          },
        });
        return proveedor;
      }

      case 'animal': {
        const animal = await prisma.animal.create({
          data: {
            idGranja,
            codigoAnimal: datosNormalizados.codigoAnimal as string,
            descripcionAnimal: datosNormalizados.descripcionAnimal as string,
            categoriaAnimal: datosNormalizados.categoriaAnimal as string,
          },
        });
        return animal;
      }

      case 'formula': {
        const { crearFormula } = await import('./formulaService');
        const formula = await crearFormula({
          idGranja,
          idAnimal: datosNormalizados.idAnimal as string,
          codigoFormula: datosNormalizados.codigoFormula as string,
          descripcionFormula: datosNormalizados.descripcionFormula as string,
          detalles: datosNormalizados.detalles as Array<{
            idMateriaPrima: string;
            cantidadKg: number;
          }>,
        });
        return formula;
      }

      case 'compra': {
        const { crearCompra } = await import('./compraService');
        const compra = await crearCompra({
          idGranja,
          idUsuario,
          idProveedor: datosNormalizados.idProveedor as string,
          numeroFactura: datosNormalizados.numeroFactura || undefined,
          fechaCompra: datosNormalizados.fechaCompra instanceof Date
            ? datosNormalizados.fechaCompra
            : new Date(datosNormalizados.fechaCompra as string),
          observaciones: datosNormalizados.observaciones || undefined,
          detalles: datosNormalizados.detalles as Array<{
            idMateriaPrima: string;
            cantidadComprada: number;
            precioUnitario: number;
          }>,
        });
        return compra;
      }

      case 'fabricacion': {
        const { crearFabricacion } = await import('./fabricacionService');
        const fabricacion = await crearFabricacion({
          idGranja,
          idUsuario,
          idFormula: datosNormalizados.idFormula as string,
          descripcionFabricacion: datosNormalizados.descripcionFabricacion as string,
          cantidadFabricacion: datosNormalizados.cantidadFabricacion as number,
          fechaFabricacion: datosNormalizados.fechaFabricacion instanceof Date
            ? datosNormalizados.fechaFabricacion
            : new Date(datosNormalizados.fechaFabricacion as string),
          observaciones: datosNormalizados.observaciones || undefined,
        });
        return fabricacion;
      }

      default:
        throw new Error(`Tipo de registro no soportado para creación: ${tablaDestino}`);
    }
  }

  /**
   * Enviar respuesta por WhatsApp usando Twilio
   */
  static async enviarRespuesta(
    numeroDestino: string,
    mensaje: string
  ): Promise<void> {
    // TODO: Implementar envío de mensajes
    throw new Error('Funcionalidad en desarrollo');
  }
}

