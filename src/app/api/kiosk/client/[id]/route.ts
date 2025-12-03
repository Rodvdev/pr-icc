import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/kiosk/client/[id]
 * Obtener información del cliente para la pantalla de bienvenida
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params
    const id = p?.id
    if (!id) {
      return NextResponse.json({ ok: false, message: 'Missing id param' }, { status: 400 })
    }

    // Buscar cliente en la base de datos
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true
      }
    })

    if (!client) {
      // Si no existe, devolver un 404 para que el frontend no muestre un nombre fijo
      return NextResponse.json({ ok: false, message: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      id: client.id,
      name: client.name ?? null,
      email: client.email ?? null,
      phone: client.phone ?? null,
      lastVisit: client.createdAt?.toISOString() ?? null
    })
  } catch (error) {
    console.error('Error obteniendo datos del cliente:', error)
    // Fallback: Keep behavior safe and return generic 500
    return NextResponse.json({ ok: false, message: 'Internal error' }, { status: 500 })
  }
}
