import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { 
  rateLimit, 
  sanitizeInput, 
  isValidEmail, 
  validateCSRF,
  addSecurityHeaders 
} from '@/lib/security'

// Rate limiting: 5 login attempts per IP per 15 minutes
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || 
              req.headers.get('x-real-ip') || 
              'unknown'
    return `client_login:${ip}`
  }
})

/**
 * POST /api/auth/client/login
 * Login de clientes con email o DNI
 * 
 * Body: { email?: string, dni?: string, password: string }
 * Returns: { client: object, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = loginRateLimit(request)
    if (!rateLimitResult.success) {
      const retryAfter = 'resetTime' in rateLimitResult && rateLimitResult.resetTime
        ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        : 900 // Default 15 minutes
      return addSecurityHeaders(NextResponse.json(
        { 
          error: 'Demasiados intentos de inicio de sesión. Intenta más tarde.',
          retryAfter
        },
        { status: 429 }
      ))
    }

    // CSRF protection
    if (!validateCSRF(request)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Solicitud no válida' },
        { status: 403 }
      ))
    }

    const body = await request.json()
    const { email, dni, password } = body

    // Sanitize inputs
    const sanitizedEmail = email ? sanitizeInput(email) : null
    const sanitizedDni = dni ? sanitizeInput(dni) : null

    // Validate that at least one identifier is provided
    if ((!sanitizedEmail && !sanitizedDni) || !password) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Email o DNI y contraseña son requeridos' },
        { status: 400 }
      ))
    }

    // Validate email format if provided
    if (sanitizedEmail && !isValidEmail(sanitizedEmail)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      ))
    }

    // Buscar cliente por email o DNI
    const client = await prisma.client.findUnique({
      where: sanitizedEmail 
        ? { email: sanitizedEmail }
        : { dni: sanitizedDni! },
      select: {
        id: true,
        dni: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        hashedPassword: true,
        createdAt: true,
      }
    })

    if (!client) {
      // Use generic error message to prevent enumeration
      return addSecurityHeaders(NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      ))
    }

    // Verificar estado del cliente
    if (client.status === 'BLOCKED') {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Tu cuenta está bloqueada. Contacta con soporte.' },
        { status: 403 }
      ))
    }

    if (client.status === 'DELETED') {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Esta cuenta ya no existe' },
        { status: 404 }
      ))
    }

    // Verificar contraseña
    if (!client.hashedPassword) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Tu cuenta no tiene contraseña configurada. Contacta con soporte.' },
        { status: 400 }
      ))
    }

    // Constant-time password comparison to prevent timing attacks
    const isValidPassword = await bcrypt.compare(password, client.hashedPassword)

    if (!isValidPassword) {
      // Use generic error message to prevent enumeration
      return addSecurityHeaders(NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      ))
    }

    // Login exitoso - no incluir hashedPassword en respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword: _, ...clientData } = client

    // Add security headers and session hardening
    const response = NextResponse.json({
      client: clientData,
      message: 'Login exitoso'
    })

    // Session hardening headers
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    
    return addSecurityHeaders(response)

  } catch (error) {
    console.error('Error en login de cliente:', error)
    return addSecurityHeaders(NextResponse.json(
      { 
        error: 'Error interno del servidor. Por favor intenta más tarde.'
      },
      { status: 500 }
    ))
  }
}
