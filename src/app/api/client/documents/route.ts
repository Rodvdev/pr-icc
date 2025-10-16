import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * GET /api/client/documents
 * Get current client's uploaded documents
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

    // For now, return mock data
    // TODO: Implement proper document storage and retrieval
    const mockDocuments = [
      {
        id: "doc-1",
        name: "DNI - Anverso",
        type: "Identificación",
        uploadDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        size: "2.3 MB",
        sizeBytes: 2411724,
        status: "approved",
        url: "/documents/dni-front.jpg",
        mimeType: "image/jpeg"
      },
      {
        id: "doc-2",
        name: "DNI - Reverso",
        type: "Identificación",
        uploadDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        size: "2.1 MB",
        sizeBytes: 2202010,
        status: "approved",
        url: "/documents/dni-back.jpg",
        mimeType: "image/jpeg"
      },
      {
        id: "doc-3",
        name: "Recibo de Luz - Octubre 2024",
        type: "Comprobante de Domicilio",
        uploadDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        size: "1.8 MB",
        sizeBytes: 1887436,
        status: "approved",
        url: "/documents/utility-bill.pdf",
        mimeType: "application/pdf"
      },
      {
        id: "doc-4",
        name: "Boleta de Pago - Septiembre",
        type: "Ingreso",
        uploadDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        size: "856 KB",
        sizeBytes: 876544,
        status: "pending",
        url: "/documents/payslip.pdf",
        mimeType: "application/pdf"
      }
    ]

    // Calculate stats
    const stats = {
      total: mockDocuments.length,
      approved: mockDocuments.filter(d => d.status === "approved").length,
      pending: mockDocuments.filter(d => d.status === "pending").length,
      rejected: mockDocuments.filter(d => d.status === "rejected").length
    }

    return NextResponse.json({
      success: true,
      data: {
        documents: mockDocuments,
        stats
      }
    })

  } catch (error) {
    console.error("[API] GET /api/client/documents error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error al obtener documentos" 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/client/documents
 * Upload a new document
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // TODO: Implement actual file upload logic
    // For now, return success response
    const formData = await req.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó archivo" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "El archivo es demasiado grande (máx 10MB)" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png"
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Tipo de archivo no permitido" },
        { status: 400 }
      )
    }

    // Mock successful upload
    const newDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: type || "Otro",
      uploadDate: new Date().toISOString(),
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      sizeBytes: file.size,
      status: "pending",
      url: `/documents/${file.name}`,
      mimeType: file.type
    }

    return NextResponse.json({
      success: true,
      data: newDocument,
      message: "Documento subido exitosamente"
    })

  } catch (error) {
    console.error("[API] POST /api/client/documents error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error al subir documento" 
      },
      { status: 500 }
    )
  }
}

