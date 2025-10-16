import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * GET /api/client/profile
 * Get current client's profile information
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // For now, we'll return mock data since clients authenticate differently
    // TODO: Implement proper client authentication and fetch from Client table
    const mockProfile = {
      id: "client-1",
      firstName: "Juan",
      lastName: "Pérez",
      email: session.user.email,
      phone: "+51 987 654 321",
      address: "Av. Principal 123, San Isidro",
      city: "Lima",
      country: "Perú",
      documentType: "DNI",
      documentNumber: "12345678",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: mockProfile
    })

  } catch (error) {
    console.error("[API] GET /api/client/profile error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error al obtener perfil" 
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/client/profile
 * Update current client's profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { firstName, lastName, phone, address, city, country } = body

    // TODO: Implement actual update logic
    const updatedProfile = {
      id: "client-1",
      firstName,
      lastName,
      email: session.user.email,
      phone,
      address,
      city,
      country,
      documentType: "DNI",
      documentNumber: "12345678",
      status: "ACTIVE",
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile
    })

  } catch (error) {
    console.error("[API] PATCH /api/client/profile error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error al actualizar perfil" 
      },
      { status: 500 }
    )
  }
}

