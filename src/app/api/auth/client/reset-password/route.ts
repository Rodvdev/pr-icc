import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

/**
 * POST /api/auth/client/reset-password
 * Solicitar reset de contraseña
 * 
 * Body: { email: string }
 * Returns: { message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { message: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Buscar cliente por email
    const client = await prisma.client.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        status: true
      }
    })

    // Por seguridad, siempre devolver éxito (no revelar si el email existe)
    if (!client || client.status !== 'ACTIVE') {
      return NextResponse.json({
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      })
    }

    // Generar token único
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Guardar token en base de datos
    await prisma.passwordResetToken.create({
      data: {
        clientId: client.id,
        token,
        expiresAt
      }
    })

    // TODO: En producción, enviar email con el token
    // const resetLink = `${process.env.NEXTAUTH_URL}/kiosk/reset-password/${token}`
    // await sendResetPasswordEmail(client.email, client.name, resetLink)

    console.log(`Reset password token for ${client.email}: ${token}`)

    return NextResponse.json({
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    })

  } catch (error) {
    console.error('Error en reset password:', error)
    return NextResponse.json(
      { 
        message: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

