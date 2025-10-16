/**
 * Client Registration API
 * 
 * POST /api/register - Register a new client
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      dni,
      dateOfBirth,
      address,
      password
    } = body

    // Validate required fields
    if (!name || !email || !dni || !password || !phone) {
      return NextResponse.json(
        { error: 'Nombre, email, DNI, teléfono y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.client.findUnique({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este correo electrónico ya está registrado' },
        { status: 409 }
      )
    }

    // Check if DNI already exists
    const existingDni = await prisma.client.findUnique({
      where: { dni }
    })

    if (existingDni) {
      return NextResponse.json(
        { error: 'Este DNI ya está registrado' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create client with PENDING status
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        dni,
        hashedPassword,
        status: 'ACTIVE', // Default to active for new registrations
      }
    })

    // Create registration request
    await prisma.registrationRequest.create({
      data: {
        clientId: client.id,
        status: 'PENDING'
      }
    })

    // Audit log
    await audit({
      action: 'CLIENT_CREATED',
      targetClientId: client.id,
      details: {
        email: client.email,
        dni: client.dni,
        status: 'PENDING',
        source: 'self_registration'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Registro exitoso. Tu solicitud será revisada por un administrador.',
      data: client
    }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/register error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

