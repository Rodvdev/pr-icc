/**
 * Facial Recognition Sync API
 * 
 * POST /api/facial-recognition/sync - Sync all active facial profiles to Python API
 * 
 * This endpoint synchronizes all active facial profiles from the database
 * to the Python API so they can be used for recognition.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { facialRecognitionService } from '@/services/facial-recognition.service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can trigger sync
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { clientId } = body

    let result

    if (clientId) {
      // Sync profiles for a specific client
      const profiles = await facialRecognitionService.getFacialProfilesByClient(clientId)
      const activeProfiles = profiles.filter(p => p.isActive)
      
      result = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      }

      for (const profile of activeProfiles) {
        try {
          if (!profile.embedding) {
            result.failed++
            result.errors.push(`Profile ${profile.id} has no embedding`)
            continue
          }

          const clientName = profile.client.name || 
            profile.client.email || 
            profile.client.dni || 
            `Client-${profile.client.id}`

          await facialRecognitionService.registerUserToPythonAPI({
            name: clientName,
            encoding: profile.embedding,
            imageUrl: profile.imageUrl || undefined,
            clientId: profile.clientId
          })

          result.success++
        } catch (error) {
          result.failed++
          result.errors.push(
            `Failed to sync profile ${profile.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    } else {
      // Sync all active profiles
      result = await facialRecognitionService.syncProfilesToPythonAPI()
    }

    return NextResponse.json({
      success: true,
      synced: result.success,
      failed: result.failed,
      errors: result.errors,
      message: `Synced ${result.success} profiles, ${result.failed} failed`
    })
  } catch (error) {
    console.error('Error syncing profiles:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync profiles',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


