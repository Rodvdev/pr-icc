/**
 * Facial Recognition Detections API
 * 
 * GET /api/facial-recognition/detections - List detection events
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { facialRecognitionService } from '@/services/facial-recognition.service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cameraId = searchParams.get('cameraId')
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status') as 'MATCHED' | 'NEW_FACE' | 'MULTIPLE_MATCHES' | 'UNKNOWN' | null
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const { detections, total } = await facialRecognitionService.getDetectionEvents({
      cameraId: cameraId || undefined,
      clientId: clientId || undefined,
      status: status || undefined,
      limit,
      offset,
      startDate,
      endDate
    })

    return NextResponse.json({
      success: true,
      detections,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching detection events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch detection events' },
      { status: 500 }
    )
  }
}

