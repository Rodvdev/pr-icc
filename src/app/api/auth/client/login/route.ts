import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/client/login
 * Login de clientes desde kiosco
 * 
 * Body: { dni: string, password: string }
 * Returns: { client: object, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dni, password } = body

    if (!dni || !password) {
      return NextResponse.json(
        { message: 'DNI y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar cliente por DNI
    const client = await prisma.client.findUnique({
      where: { dni },
      select: {
        id: true,
        dni: true,
        name: true,
        email: true,
        status: true,
        hashedPassword: true,
      }
    })

    if (!client) {
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verificar estado del cliente
    if (client.status === 'BLOCKED') {
      return NextResponse.json(
        { message: 'Tu cuenta está bloqueada. Contacta con soporte.' },
        { status: 403 }
      )
    }

    if (client.status === 'DELETED') {
      return NextResponse.json(
        { message: 'Esta cuenta ya no existe' },
        { status: 404 }
      )
    }

    // Verificar contraseña
    if (!client.hashedPassword) {
      return NextResponse.json(
        { message: 'Tu cuenta no tiene contraseña configurada. Contacta con un administrador.' },
        { status: 400 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, client.hashedPassword)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Login exitoso - no incluir hashedPassword en respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword: _, ...clientData } = client

    return NextResponse.json({
      client: clientData,
      message: 'Login exitoso'
    })

  } catch (error) {
    console.error('Error en login de cliente:', error)
    return NextResponse.json(
      { 
        message: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
