/**
 * Facial Recognition Service
 * 
 * Business logic for facial recognition operations.
 * Handles facial profiles, detection events, and integration with Python API.
 */

import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import facialAPI from '@/lib/facial-recognition-api'
import type { FacialAPIResult } from '@/lib/facial-recognition-api'
import type { Prisma } from '@prisma/client'

// ========== TYPE DEFINITIONS ==========

export interface FacialProfile {
  id: string
  clientId: string
  provider: string
  providerFaceId: string | null
  version: string | null
  embedding: unknown
  imageUrl: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    name: string | null
    dni: string | null
    email: string | null
  }
}

export interface DetectionEvent {
  id: string
  cameraId: string
  clientId: string | null
  status: 'MATCHED' | 'NEW_FACE' | 'MULTIPLE_MATCHES' | 'UNKNOWN'
  confidence: number | null
  snapshotUrl: string | null
  metadata: unknown
  occurredAt: Date
  camera: {
    id: string
    name: string
    branch: {
      name: string
    }
  }
  client: {
    id: string
    name: string | null
    dni: string | null
    email: string | null
  } | null
}

export interface CreateFacialProfileData {
  clientId: string
  provider: string
  providerFaceId?: string
  version?: string
  embedding?: Prisma.InputJsonValue
  imageUrl?: string
}

export interface RegisterUserToPythonAPI {
  name: string
  encoding: number[] | unknown
  imageUrl?: string
  clientId: string
}

export interface DetectionEventData {
  cameraId: string
  clientId?: string | null
  status: 'MATCHED' | 'NEW_FACE' | 'MULTIPLE_MATCHES' | 'UNKNOWN'
  confidence?: number | null
  snapshotUrl?: string | null
  metadata?: Prisma.InputJsonValue
}

// ========== FACIAL RECOGNITION SERVICE ==========

export class FacialRecognitionService {
  /**
   * Create a facial profile
   */
  async createFacialProfile(
    data: CreateFacialProfileData,
    actorUserId?: string
  ): Promise<FacialProfile> {
    const profile = await prisma.facialProfile.create({
      data: {
        clientId: data.clientId,
        provider: data.provider,
        providerFaceId: data.providerFaceId,
        version: data.version,
        embedding: data.embedding,
        imageUrl: data.imageUrl,
        isActive: true
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            dni: true,
            email: true
          }
        }
      }
    })

    await audit({
      action: 'CAMERA_CONFIGURED', // Using existing action for facial profile creation
      actorUserId: actorUserId || null,
      targetClientId: data.clientId,
      details: {
        profileId: profile.id,
        provider: data.provider,
        type: 'facial_profile_created'
      }
    })

    return profile as FacialProfile
  }

  /**
   * Get facial profile by ID
   */
  async getFacialProfileById(profileId: string): Promise<FacialProfile | null> {
    const profile = await prisma.facialProfile.findUnique({
      where: { id: profileId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            dni: true,
            email: true
          }
        }
      }
    })

    return profile as FacialProfile | null
  }

  /**
   * Get facial profiles by client ID
   */
  async getFacialProfilesByClient(clientId: string): Promise<FacialProfile[]> {
    const profiles = await prisma.facialProfile.findMany({
      where: { clientId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            dni: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return profiles as FacialProfile[]
  }

  /**
   * Get all active facial profiles
   */
  async getActiveFacialProfiles(): Promise<FacialProfile[]> {
    const profiles = await prisma.facialProfile.findMany({
      where: { isActive: true },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            dni: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return profiles as FacialProfile[]
  }

  /**
   * Update facial profile
   */
  async updateFacialProfile(
    profileId: string,
    data: {
      provider?: string
      providerFaceId?: string
      version?: string
      embedding?: Prisma.InputJsonValue
      imageUrl?: string
      isActive?: boolean
    },
    actorUserId?: string
  ): Promise<FacialProfile> {
    const profile = await prisma.facialProfile.update({
      where: { id: profileId },
      data,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            dni: true,
            email: true
          }
        }
      }
    })

    await audit({
      action: 'CAMERA_UPDATED', // Using existing action for facial profile update
      actorUserId: actorUserId || null,
      targetClientId: profile.clientId,
      details: {
        profileId,
        updates: data,
        type: 'facial_profile_updated'
      }
    })

    return profile as FacialProfile
  }

  /**
   * Deactivate facial profile
   */
  async deactivateFacialProfile(
    profileId: string,
    actorUserId?: string
  ): Promise<FacialProfile> {
    const profile = await prisma.facialProfile.update({
      where: { id: profileId },
      data: { isActive: false },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            dni: true,
            email: true
          }
        }
      }
    })

    await audit({
      action: 'CAMERA_UPDATED', // Using existing action for facial profile deactivation
      actorUserId: actorUserId || null,
      targetClientId: profile.clientId,
      details: {
        profileId,
        type: 'facial_profile_deactivated'
      }
    })

    return profile as FacialProfile
  }

  /**
   * Create detection event
   */
  async createDetectionEvent(
    data: DetectionEventData,
    actorUserId?: string
  ): Promise<DetectionEvent> {
    const detection = await prisma.detectionEvent.create({
      data: {
        cameraId: data.cameraId,
        clientId: data.clientId,
        status: data.status,
        confidence: data.confidence,
        snapshotUrl: data.snapshotUrl,
        metadata: data.metadata
      },
      include: {
        camera: {
          include: {
            branch: {
              select: {
                name: true
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            dni: true,
            email: true
          }
        }
      }
    })

    await audit({
      action: 'DETECTION_LOGGED', // Using existing action for detection events
      actorUserId: actorUserId || null,
      targetClientId: data.clientId || null,
      details: {
        detectionId: detection.id,
        cameraId: data.cameraId,
        status: data.status,
        confidence: data.confidence
      }
    })

    return detection as DetectionEvent
  }

  /**
   * Get detection events with filters
   */
  async getDetectionEvents(params: {
    cameraId?: string
    clientId?: string
    status?: 'MATCHED' | 'NEW_FACE' | 'MULTIPLE_MATCHES' | 'UNKNOWN'
    limit?: number
    offset?: number
    startDate?: Date
    endDate?: Date
  }): Promise<{ detections: DetectionEvent[]; total: number }> {
    const {
      cameraId,
      clientId,
      status,
      limit = 100,
      offset = 0,
      startDate,
      endDate
    } = params

    const where: Record<string, unknown> = {}

    if (cameraId) {
      where.cameraId = cameraId
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {}
      if (startDate) {
        dateFilter.gte = startDate
      }
      if (endDate) {
        dateFilter.lte = endDate
      }
      where.occurredAt = dateFilter
    }

    const [detections, total] = await Promise.all([
      prisma.detectionEvent.findMany({
        where,
        include: {
          camera: {
            include: {
              branch: {
                select: {
                  name: true
                }
              }
            }
          },
          client: {
            select: {
              id: true,
              name: true,
              dni: true,
              email: true
            }
          }
        },
        orderBy: { occurredAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.detectionEvent.count({ where })
    ])

    return {
      detections: detections as DetectionEvent[],
      total
    }
  }

  /**
   * Register user to Python API
   * This sends the facial encoding to the Python API for recognition
   * Note: Flask API uses file-based storage (encodings.npy, labels.json)
   */
  async registerUserToPythonAPI(
    data: RegisterUserToPythonAPI
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Flask API uses /api/register endpoint
      // The encoding should be a numpy array (list of numbers)
      let encodingArray: number[] = []
      
      if (Array.isArray(data.encoding)) {
        encodingArray = data.encoding
      } else if (typeof data.encoding === 'object' && data.encoding !== null) {
        // Try to extract encoding from object
        if ('encoding' in data.encoding && Array.isArray((data.encoding as { encoding: unknown }).encoding)) {
          encodingArray = (data.encoding as { encoding: number[] }).encoding
        } else if ('data' in data.encoding && Array.isArray((data.encoding as { data: unknown }).data)) {
          encodingArray = (data.encoding as { data: number[] }).data
        }
      }

      if (encodingArray.length === 0) {
        throw new Error('Invalid encoding format: must be an array of numbers (typically 128 numbers for face_recognition)')
      }

      // Ensure encoding is the right length (face_recognition uses 128-dimensional encodings)
      if (encodingArray.length !== 128) {
        console.warn(`Encoding length is ${encodingArray.length}, expected 128. Continuing anyway.`)
      }

      const response = await facialAPI.post('/register', {
        name: data.name,
        encoding: encodingArray,
        image_url: data.imageUrl,
        client_id: data.clientId
      })
      
      // Log response for debugging
      console.log('Flask API registration response:', response.data)

      return {
        success: true,
        message: 'User registered successfully'
      }
    } catch (error) {
      console.error('Error registering user to Python API:', error)
      throw new Error(`Failed to register user to Python API: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Sync all active facial profiles to Python API
   */
  async syncProfilesToPythonAPI(): Promise<{
    success: number
    failed: number
    errors: string[]
  }> {
    const profiles = await this.getActiveFacialProfiles()
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const profile of profiles) {
      try {
        if (!profile.embedding) {
          results.failed++
          results.errors.push(`Profile ${profile.id} has no embedding`)
          continue
        }

        const clientName = profile.client.name || 
          profile.client.email || 
          profile.client.dni || 
          `Client-${profile.client.id}`

        await this.registerUserToPythonAPI({
          name: clientName,
          encoding: profile.embedding,
          imageUrl: profile.imageUrl || undefined,
          clientId: profile.clientId
        })

        // Update providerFaceId if not set
        if (!profile.providerFaceId) {
          await prisma.facialProfile.update({
            where: { id: profile.id },
            data: {
              providerFaceId: `python-api-${profile.id}`
            }
          })
        }

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(
          `Failed to sync profile ${profile.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return results
  }

  /**
   * Process detection result from Python API
   * This is called when the Python API detects a face
   */
  async processPythonAPIDetection(
    result: FacialAPIResult,
    cameraId: string
  ): Promise<DetectionEvent> {
    // Try to find client by name or other identifier
    let clientId: string | null = null
    let status: 'MATCHED' | 'NEW_FACE' | 'MULTIPLE_MATCHES' | 'UNKNOWN' = 'UNKNOWN'

    if (result.name && result.name !== 'Desconocido' && result.name !== 'Unknown') {
      // Try to find client by name, email, or DNI
      const client = await prisma.client.findFirst({
        where: {
          OR: [
            { name: { contains: result.name, mode: 'insensitive' } },
            { email: { contains: result.name, mode: 'insensitive' } },
            { dni: { contains: result.name, mode: 'insensitive' } }
          ],
          status: 'ACTIVE'
        }
      })

      if (client) {
        clientId = client.id
        status = 'MATCHED'
      } else {
        status = 'NEW_FACE'
      }
    }

    // Create detection event
    const detection = await this.createDetectionEvent({
      cameraId,
      clientId,
      status,
      confidence: result.confidence,
      snapshotUrl: undefined, // Python API might provide this separately
      metadata: {
        timestamp: result.timestamp,
        distance: result.distance,
        box: result.box,
        name: result.name,
        source: 'python-api'
      }
    })

    return detection
  }

  /**
   * Update camera stream URL in Python API
   */
  async updateCameraStreamInPythonAPI(
    cameraId: string,
    streamUrl: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await facialAPI.put('/config', {
        stream_url: streamUrl,
        camera_id: cameraId
      })

      return {
        success: true,
        message: 'Camera stream updated in Python API'
      }
    } catch (error) {
      console.error('Error updating camera stream in Python API:', error)
      throw new Error('Failed to update camera stream in Python API')
    }
  }

  /**
   * Get facial recognition statistics
   */
  async getFacialRecognitionStats(): Promise<{
    totalProfiles: number
    activeProfiles: number
    totalDetections: number
    matchedDetections: number
    newFaceDetections: number
    unknownDetections: number
  }> {
    const [
      totalProfiles,
      activeProfiles,
      totalDetections,
      matchedDetections,
      newFaceDetections,
      unknownDetections
    ] = await Promise.all([
      prisma.facialProfile.count(),
      prisma.facialProfile.count({ where: { isActive: true } }),
      prisma.detectionEvent.count(),
      prisma.detectionEvent.count({ where: { status: 'MATCHED' } }),
      prisma.detectionEvent.count({ where: { status: 'NEW_FACE' } }),
      prisma.detectionEvent.count({ where: { status: 'UNKNOWN' } })
    ])

    return {
      totalProfiles,
      activeProfiles,
      totalDetections,
      matchedDetections,
      newFaceDetections,
      unknownDetections
    }
  }
}

// ========== SINGLETON EXPORT ==========

export const facialRecognitionService = new FacialRecognitionService()

