/**
 * AI Prompts
 * 
 * Advanced banking security system prompts and pre-configured Q&A templates
 * for the AI chat module.
 */

/**
 * Generate the main system prompt for banking security
 */
export function getBankingSecuritySystemPrompt(clientContext?: string): string {
  const basePrompt = `Eres un asistente virtual de seguridad bancaria especializado en atención al cliente de un agente bancario en Perú.

REGLAS DE SEGURIDAD CRÍTICAS:
1. NUNCA solicites, reveles o confirmes información sensible como:
   - Contraseñas o códigos de acceso
   - Números completos de tarjetas de crédito/débito
   - Códigos CVV o PIN
   - Información de cuentas bancarias completas
   - Tokens de seguridad o códigos de verificación

2. NUNCA realices transacciones financieras de ningún tipo.

3. NUNCA compartas información de otros clientes, incluso si se solicita.

4. Valida siempre la identidad del cliente antes de proporcionar información personal sensible. Si no estás seguro, redirige a un agente humano.

5. Redirige consultas complejas a agentes humanos cuando:
   - Se requiera realizar transacciones
   - Se necesite modificar información crítica
   - El cliente exprese insatisfacción o reclamos formales
   - Se detecten intentos de fraude o actividad sospechosa

6. Mantén la confidencialidad de todos los datos del cliente según las políticas de privacidad bancaria.

COMPLIANCE Y REGULACIONES:
- Cumple con las regulaciones bancarias peruanas (SBS)
- Protege los datos personales según la Ley de Protección de Datos Personales (Ley N° 29733)
- Reporta cualquier actividad sospechosa o intento de fraude
- Mantén registros de interacciones para auditoría

CAPACIDADES:
- Responder preguntas sobre servicios bancarios generales
- Consultar información del perfil del cliente (si está autenticado y se proporciona contexto)
- Informar sobre visitas pasadas y citas programadas
- Proporcionar información sobre horarios de atención y ubicaciones
- Ayudar con FAQs y preguntas comunes sobre servicios
- Orientar sobre procesos y requisitos

TONO Y ESTILO:
- Profesional pero amigable y empático
- Claro, conciso y directo
- En español de Perú
- Servicial y proactivo
- Paciente y comprensivo

FORMATO DE RESPUESTAS:
- Usa párrafos cortos para mejor legibilidad
- Enumera información cuando sea apropiado
- Destaca información importante cuando sea necesario
- Proporciona pasos claros cuando se soliciten instrucciones

LÍMITES:
- Si no sabes algo, admítelo honestamente y ofrece redirigir a un agente humano
- Si la consulta está fuera de tu alcance, explica cortésmente y ofrece alternativas
- Mantén las respuestas dentro de un contexto razonable (no más de 300 palabras por respuesta)`

  // Add client context if available
  if (clientContext) {
    return `${basePrompt}

CONTEXTO DEL CLIENTE ACTUAL:
${clientContext}

IMPORTANTE: Solo usa esta información del cliente para responder consultas específicas sobre su perfil, visitas o citas. NUNCA reveles información sensible como DNI completo, contraseñas, o datos financieros detallados.`
  }

  return `${basePrompt}

NOTA: No hay información del cliente disponible en este momento. Si el cliente pregunta sobre sus datos personales, solicita que se autentique o redirige a un agente humano.`
}

/**
 * Pre-configured quick responses for common queries
 */
export const PRE_CONFIGURED_RESPONSES = {
  greeting: [
    '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
    '¡Buenos días! Estoy aquí para ayudarte con tus consultas. ¿Qué necesitas?',
    '¡Buenas tardes! Bienvenido. ¿En qué puedo asistirte?',
    '¡Hola! ¿Cómo puedo ayudarte hoy?',
  ],

  farewell: [
    '¡Fue un placer ayudarte! Si tienes más preguntas, no dudes en consultarme. ¡Que tengas un excelente día!',
    'De nada. Estoy aquí cuando me necesites. ¡Que tengas un buen día!',
    '¡Hasta luego! Si necesitas algo más, estaré aquí para ayudarte.',
    '¡Que tengas un excelente día! No dudes en volver si tienes más consultas.',
  ],

  hours: [
    'Nuestros horarios de atención son de lunes a viernes de 9:00 AM a 6:00 PM, y los sábados de 9:00 AM a 1:00 PM.',
    'Atendemos de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 1:00 PM.',
  ],

  location: [
    'Puedo ayudarte con información sobre nuestras ubicaciones. ¿Qué sucursal necesitas consultar?',
    'Tenemos varias sucursales disponibles. ¿Te gustaría saber la ubicación de alguna en particular?',
  ],

  contact: [
    'Para contactarnos directamente, puedes llamar a nuestro teléfono de atención o visitar una de nuestras sucursales. ¿Te gustaría que te proporcione más información?',
    'Puedes contactarnos por teléfono o visitarnos en cualquiera de nuestras sucursales. ¿Necesitas información específica?',
  ],

  services: [
    'Ofrecemos diversos servicios bancarios. ¿Hay algo específico en lo que te pueda ayudar?',
    'Tenemos varios servicios disponibles. ¿Qué tipo de servicio necesitas consultar?',
  ],

  profile: [
    'Puedo ayudarte con información sobre tu perfil. ¿Qué te gustaría saber específicamente?',
    'Tengo acceso a tu información de perfil. ¿Qué consulta tienes?',
  ],

  visits: [
    'Puedo informarte sobre tus visitas recientes. ¿Qué te gustaría saber?',
    'Tengo información sobre tu historial de visitas. ¿Qué consulta tienes?',
  ],

  appointments: [
    'Puedo ayudarte con información sobre tus citas programadas. ¿Qué necesitas saber?',
    'Tengo información sobre tus próximas citas. ¿En qué puedo ayudarte?',
  ],

  error: [
    'Lo siento, tuve un problema al procesar tu consulta. ¿Podrías reformularla o prefieres que te conecte con un agente humano?',
    'Disculpa, hubo un error. Por favor, intenta de nuevo o puedo redirigirte a un agente humano.',
  ],

  limit: [
    'Esta consulta está fuera de mi alcance. Te recomiendo contactar con un agente humano para obtener asistencia personalizada.',
    'Para esta consulta, necesitarás hablar con un agente humano. ¿Te gustaría que te ayude a programar una cita?',
  ],

  security: [
    'Por razones de seguridad, no puedo proporcionar esa información aquí. Te recomiendo contactar directamente con un agente o visitar una sucursal.',
    'Por seguridad, esa información requiere verificación adicional. ¿Te gustaría que te ayude a programar una cita con un agente?',
  ],
}

/**
 * Get a random response from a category
 */
export function getRandomResponse(category: keyof typeof PRE_CONFIGURED_RESPONSES): string {
  const responses = PRE_CONFIGURED_RESPONSES[category]
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Detect query intent category
 */
export function detectQueryIntent(query: string): {
  category: string
  confidence: number
  requiresClientData: boolean
} {
  const lowerQuery = query.toLowerCase()

  // Greeting detection
  if (
    lowerQuery.includes('hola') ||
    lowerQuery.includes('buenos días') ||
    lowerQuery.includes('buenas tardes') ||
    lowerQuery.includes('buenas noches') ||
    lowerQuery.includes('saludos')
  ) {
    return { category: 'greeting', confidence: 0.9, requiresClientData: false }
  }

  // Farewell detection
  if (
    lowerQuery.includes('gracias') ||
    lowerQuery.includes('adiós') ||
    lowerQuery.includes('chau') ||
    lowerQuery.includes('hasta luego') ||
    lowerQuery.includes('nos vemos')
  ) {
    return { category: 'farewell', confidence: 0.9, requiresClientData: false }
  }

  // Hours detection
  if (
    lowerQuery.includes('horario') ||
    lowerQuery.includes('hora') ||
    lowerQuery.includes('abierto') ||
    lowerQuery.includes('cerrado') ||
    lowerQuery.includes('atención') ||
    lowerQuery.includes('atender') ||
    lowerQuery.includes('cuándo')
  ) {
    return { category: 'hours', confidence: 0.85, requiresClientData: false }
  }

  // Location detection
  if (
    lowerQuery.includes('ubicación') ||
    lowerQuery.includes('dirección') ||
    lowerQuery.includes('sucursal') ||
    lowerQuery.includes('dónde') ||
    lowerQuery.includes('local')
  ) {
    return { category: 'location', confidence: 0.85, requiresClientData: false }
  }

  // Contact detection
  if (
    lowerQuery.includes('contacto') ||
    lowerQuery.includes('teléfono') ||
    lowerQuery.includes('llamar') ||
    lowerQuery.includes('comunicar')
  ) {
    return { category: 'contact', confidence: 0.85, requiresClientData: false }
  }

  // Profile detection (requires client data)
  if (
    lowerQuery.includes('mi perfil') ||
    lowerQuery.includes('mis datos') ||
    lowerQuery.includes('mi información') ||
    lowerQuery.includes('mi nombre') ||
    lowerQuery.includes('mi email') ||
    lowerQuery.includes('mi teléfono')
  ) {
    return { category: 'profile', confidence: 0.9, requiresClientData: true }
  }

  // Visits detection (requires client data)
  if (
    lowerQuery.includes('mis visitas') ||
    lowerQuery.includes('visité') ||
    lowerQuery.includes('historial') ||
    lowerQuery.includes('cuántas visitas') ||
    lowerQuery.includes('última visita')
  ) {
    return { category: 'visits', confidence: 0.9, requiresClientData: true }
  }

  // Appointments detection (requires client data)
  if (
    lowerQuery.includes('mis citas') ||
    lowerQuery.includes('próxima cita') ||
    lowerQuery.includes('tengo cita') ||
    lowerQuery.includes('cita programada') ||
    lowerQuery.includes('agendar')
  ) {
    return { category: 'appointments', confidence: 0.9, requiresClientData: true }
  }

  // Services detection
  if (
    lowerQuery.includes('servicio') ||
    lowerQuery.includes('qué ofrecen') ||
    lowerQuery.includes('qué puedo hacer') ||
    lowerQuery.includes('opciones')
  ) {
    return { category: 'services', confidence: 0.8, requiresClientData: false }
  }

  // Default to general
  return { category: 'general', confidence: 0.5, requiresClientData: false }
}

/**
 * Build user message with context
 */
export function buildUserMessage(query: string, clientContext?: string): string {
  if (clientContext) {
    return `${query}

[Contexto del cliente disponible para responder esta consulta]`
  }
  return query
}

