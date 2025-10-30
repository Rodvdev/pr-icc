import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addSecurityHeaders } from "@/lib/security"

/**
 * GET /api/client/profile
 * Get current client's profile information
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.userType !== "CLIENT") {
      return addSecurityHeaders(NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ))
    }

    const clientId = session.user.id

    // Fetch client from database
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dni: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!client) {
      return addSecurityHeaders(NextResponse.json(
        { success: false, error: "Cliente no encontrado" },
        { status: 404 }
      ))
    }

    // Split name into firstName and lastName
    const nameParts = client.name?.split(" ") || []
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    const profile = {
      id: client.id,
      firstName,
      lastName,
      fullName: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      dni: client.dni || "",
      documentType: "DNI",
      documentNumber: client.dni || "",
      status: client.status,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    }

    return addSecurityHeaders(NextResponse.json({
      success: true,
      data: profile
    }))

  } catch (error) {
    console.error("[API] GET /api/client/profile error:", error)
    return addSecurityHeaders(NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error al obtener perfil" 
      },
      { status: 500 }
    ))
  }
}

/**
 * PATCH /api/client/profile
 * Update current client's profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.userType !== "CLIENT") {
      return addSecurityHeaders(NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ))
    }

    const clientId = session.user.id
    const body = await req.json()
    const { firstName, lastName, phone } = body

    // Validate inputs
    if (firstName && firstName.trim().length < 2) {
      return addSecurityHeaders(NextResponse.json(
        { success: false, error: "El nombre debe tener al menos 2 caracteres" },
        { status: 400 }
      ))
    }

    // Update client in database
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()
    
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(fullName && { name: fullName }),
        ...(phone && { phone: phone.trim() }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dni: true,
        status: true,
        updatedAt: true,
      }
    })

    // Split name for response
    const nameParts = updatedClient.name?.split(" ") || []
    const updatedFirstName = nameParts[0] || ""
    const updatedLastName = nameParts.slice(1).join(" ") || ""

    const updatedProfile = {
      id: updatedClient.id,
      firstName: updatedFirstName,
      lastName: updatedLastName,
      fullName: updatedClient.name || "",
      email: updatedClient.email || "",
      phone: updatedClient.phone || "",
      dni: updatedClient.dni || "",
      documentType: "DNI",
      documentNumber: updatedClient.dni || "",
      status: updatedClient.status,
      updatedAt: updatedClient.updatedAt.toISOString(),
    }

    return addSecurityHeaders(NextResponse.json({
      success: true,
      data: updatedProfile
    }))

  } catch (error) {
    console.error("[API] PATCH /api/client/profile error:", error)
    return addSecurityHeaders(NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error al actualizar perfil" 
      },
      { status: 500 }
    ))
  }
}

