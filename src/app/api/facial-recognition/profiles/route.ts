/**
 * Facial Recognition Profiles API
 * 
 * GET /api/facial-recognition/profiles - List all facial profiles
 * POST /api/facial-recognition/profiles - Create a new facial profile
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
    const clientId = searchParams.get('clientId')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let profiles

    if (clientId) {
      profiles = await facialRecognitionService.getFacialProfilesByClient(clientId)
    } else if (activeOnly) {
      profiles = await facialRecognitionService.getActiveFacialProfiles()
    } else {
      // Get all profiles (you might want to add pagination here)
      profiles = await facialRecognitionService.getActiveFacialProfiles()
    }

    return NextResponse.json({
      success: true,
      profiles,
      total: profiles.length
    })
  } catch (error) {
    console.error('Error fetching facial profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch facial profiles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      clientId,
      provider,
      providerFaceId,
      version,
      embedding,
      imageUrl
    } = body

    if (!clientId || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, provider' },
        { status: 400 }
      )
    }

    const profile = await facialRecognitionService.createFacialProfile({
      clientId,
      provider,
      providerFaceId,
      version,
      embedding,
      imageUrl
    }, session.user.id)

    return NextResponse.json({
      success: true,
      profile
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating facial profile:', error)
    return NextResponse.json(
      { error: 'Failed to create facial profile' },
      { status: 500 }
    )
  }
}


