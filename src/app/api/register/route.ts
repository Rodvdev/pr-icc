/**
 * Client Registration API
 * 
 * POST /api/register - Register a new client
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { 
  rateLimit, 
  sanitizeInput, 
  isValidEmail, 
  isValidDNI, 
  isValidPhone, 
  validatePasswordStrength,
  addSecurityHeaders 
} from '@/lib/security'
import bcrypt from 'bcryptjs'

// Rate limiting: 5 registrations per IP per hour
const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  keyGenerator: (req) => `register:${req.headers.get('x-forwarded-for') || 'unknown'}`
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = registrationRateLimit(request)
    if (!rateLimitResult.success) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Demasiados intentos de registro. Intenta más tarde.' },
        { status: 429 }
      ))
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      dni,
      password
    } = body

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name || '')
    const sanitizedEmail = sanitizeInput(email || '')
    const sanitizedPhone = sanitizeInput(phone || '')
    const sanitizedDni = sanitizeInput(dni || '')

    // Validate required fields
    if (!sanitizedName || !sanitizedEmail || !sanitizedDni || !password || !sanitizedPhone) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Nombre, email, DNI, teléfono y contraseña son requeridos' },
        { status: 400 }
      ))
    }

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      ))
    }

    // Validate DNI format
    if (!isValidDNI(sanitizedDni)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Formato de DNI inválido (debe tener 8 dígitos)' },
        { status: 400 }
      ))
    }

    // Validate phone format
    if (!isValidPhone(sanitizedPhone)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Formato de teléfono inválido (debe ser un número peruano válido)' },
        { status: 400 }
      ))
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Contraseña débil', details: passwordValidation.errors },
        { status: 400 }
      ))
    }

    // Check if email already exists
    const existingEmail = await prisma.client.findUnique({
      where: { email: sanitizedEmail }
    })

    if (existingEmail) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Este correo electrónico ya está registrado' },
        { status: 409 }
      ))
    }

    // Check if DNI already exists
    const existingDni = await prisma.client.findUnique({
      where: { dni: sanitizedDni }
    })

    if (existingDni) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Este DNI ya está registrado' },
        { status: 409 }
      ))
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create client with PENDING status
    const client = await prisma.client.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        dni: sanitizedDni,
        hashedPassword,
        status: 'ACTIVE', // Default to active for new registrations
        locale: 'es-PE'
      }
    })

    // Create registration request
    await prisma.registrationRequest.create({
      data: {
        clientId: client.id,
        status: 'PENDING'
      }
    })

    // If encodings were provided in the registration flow, persist them as FacialProfile(s)
    try {
      const encodings = Array.isArray(body.encodings) ? body.encodings : null
      if (encodings && encodings.length > 0) {
        for (const e of encodings) {
          const vec = Array.isArray(e) ? e.map((n: any) => Number(n)) : null
          if (!vec || vec.length === 0) continue
          await prisma.facialProfile.create({
            data: {
              clientId: client.id,
              provider: 'local',
              providerFaceId: null,
              version: 'v1',
              embedding: { vector: vec },
              imageUrl: body.photoData || null,
              isActive: true
            }
          })
        }
      }
    } catch (err) {
      console.error('Error saving facial profiles for new client:', err)
    }

    // Audit log
    await audit({
      action: 'CLIENT_CREATED',
      targetClientId: client.id,
      details: {
        email: client.email,
        dni: client.dni,
        status: 'PENDING',
        source: 'self_registration',
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return addSecurityHeaders(NextResponse.json({
      success: true,
      message: 'Registro exitoso. Tu solicitud será revisada por un administrador.',
      data: {
        id: client.id,
        name: client.name,
        email: client.email,
        status: client.status
      }
    }, { status: 201 }))

  } catch (error) {
    console.error('[API] POST /api/register error:', error)
    return addSecurityHeaders(NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    ))
  }
}

