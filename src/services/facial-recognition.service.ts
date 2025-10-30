/**
 * Facial Recognition Service
 * 
 * Handles communication with external Python API for facial recognition
 * connected to ESP32 devices.
 */

import axios, { AxiosInstance } from 'axios'
import { prisma } from '@/lib/prisma'
import { clientService } from './client.service'

// ========== TYPE DEFINITIONS ==========

export interface FacialRecognitionResult {
  success: boolean
  status: 'matched' | 'new_face' | 'unknown' | 'multiple_matches' | 'error'
  clientId?: string | null
  confidence?: number
  embedding?: number[]
  faceId?: string
  metadata?: Record<string, unknown>
  message?: string
}

export interface FacialRegistrationData {
  imageData: string // Base64 encoded image
  clientData: {
    dni?: string
    name?: string
    email?: string
    phone?: string
  }
  metadata?: Record<string, unknown>
}

export interface FacialDetectionData {
  imageData: string
  cameraId: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

// ========== FACIAL RECOGNITION SERVICE ==========

export class FacialRecognitionService {
  private apiClient: AxiosInstance
  private baseUrl: string

  constructor() {
    // Get API URL from environment variable
    this.baseUrl = process.env.EXTERNAL_FACIAL_API_URL || 'http://localhost:8000'
    
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor for logging
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log(`[FacialRecognition] Requesting ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('[FacialRecognition] Request error:', error)
        return Promise.reject(error)
      }
    )

    // Add response interceptor for logging
    this.apiClient.interceptors.response.use(
      (response) => {
        console.log(`[FacialRecognition] Response from ${response.config.url}:`, response.status)
        return response
      },
      (error) => {
        console.error('[FacialRecognition] Response error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  /**
   * Detect and identify a face from an image
   */
  async detectFace(data: FacialDetectionData): Promise<FacialRecognitionResult> {
    try {
      const response = await this.apiClient.post('/detect', {
        image: data.imageData,
        camera_id: data.cameraId,
        timestamp: data.timestamp || new Date().toISOString(),
        ...data.metadata
      })

      const result = response.data

      // Map the response to our standard format
      const detectionResult: FacialRecognitionResult = {
        success: result.success || true,
        status: this.mapStatus(result.status || result.detection_status),
        clientId: result.client_id || result.clientId,
        confidence: result.confidence || 0,
        faceId: result.face_id || result.faceId,
        embedding: result.embedding,
        metadata: result.metadata || result
      }

      return detectionResult

    } catch (error) {
      console.error('Error calling external facial recognition API:', error)
      
      // Return error result
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Register a new face (create facial profile)
   */
  async registerFace(data: FacialRegistrationData): Promise<FacialRecognitionResult> {
    try {
      const response = await this.apiClient.post('/register', {
        image: data.imageData,
        client_data: data.clientData,
        metadata: data.metadata
      })

      const result = response.data

      // Map the response to our standard format
      const registrationResult: FacialRecognitionResult = {
        success: result.success || true,
        status: result.face_id ? 'matched' : 'error',
        faceId: result.face_id || result.faceId,
        embedding: result.embedding,
        metadata: result.metadata || result
      }

      return registrationResult

    } catch (error) {
      console.error('Error calling external facial registration API:', error)
      
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * List all registered faces
   */
  async listFaces(): Promise<{ faces: Array<{ faceId: string, clientId?: string }> }> {
    try {
      const response = await this.apiClient.get('/faces')
      return response.data
    } catch (error) {
      console.error('Error fetching faces:', error)
      return { faces: [] }
    }
  }

  /**
   * Delete a face from the system
   */
  async deleteFace(faceId: string): Promise<boolean> {
    try {
      const response = await this.apiClient.delete(`/faces/${faceId}`)
      return response.data.success || true
    } catch (error) {
      console.error('Error deleting face:', error)
      return false
    }
  }

  /**
   * Get system health/status
   */
  async getHealth(): Promise<{ status: string, version?: string }> {
    try {
      const response = await this.apiClient.get('/health')
      return response.data
    } catch (error) {
      console.error('Error checking API health:', error)
      return { status: 'error' }
    }
  }

  /**
   * Map external API status to our internal status format
   */
  private mapStatus(status: string): FacialRecognitionResult['status'] {
    const statusMap: Record<string, FacialRecognitionResult['status']> = {
      'recognized': 'matched',
      'matched': 'matched',
      'new_face': 'new_face',
      'unknown': 'unknown',
      'no_match': 'unknown',
      'multiple_matches': 'multiple_matches',
      'error': 'error'
    }

    return statusMap[status.toLowerCase()] || 'unknown'
  }

  /**
   * Store detection event in database
   */
  async storeDetectionEvent(
    cameraId: string,
    result: FacialRecognitionResult,
    snapshotUrl?: string
  ): Promise<void> {
    try {
      await prisma.detectionEvent.create({
        data: {
          cameraId,
          clientId: result.clientId || null,
          status: this.mapDetectionStatus(result.status),
          confidence: result.confidence || null,
          snapshotUrl: snapshotUrl,
          metadata: {
            faceId: result.faceId,
            embedding: result.embedding ? 'present' : 'not_present',
            externalApi: true,
            ...result.metadata
          }
        }
      })
    } catch (error) {
      console.error('Error storing detection event:', error)
    }
  }

  /**
   * Create or update facial profile for a client
   */
  async createFacialProfile(
    clientId: string,
    result: FacialRecognitionResult,
    imageUrl?: string
  ): Promise<void> {
    try {
      if (!result.faceId && !result.embedding) {
        throw new Error('No face ID or embedding provided')
      }

      await prisma.facialProfile.create({
        data: {
          clientId,
          provider: 'external-python-api',
          providerFaceId: result.faceId || undefined,
          version: '1.0',
          embedding: result.embedding || null,
          imageUrl: imageUrl,
          isActive: true
        }
      })
    } catch (error) {
      console.error('Error creating facial profile:', error)
      throw error
    }
  }

  /**
   * Map our facial recognition status to Prisma DetectionStatus enum
   */
  private mapDetectionStatus(status: FacialRecognitionResult['status']): 
    'MATCHED' | 'NEW_FACE' | 'MULTIPLE_MATCHES' | 'UNKNOWN' {
    const statusMap = {
      'matched': 'MATCHED' as const,
      'new_face': 'NEW_FACE' as const,
      'multiple_matches': 'MULTIPLE_MATCHES' as const,
      'unknown': 'UNKNOWN' as const,
      'error': 'UNKNOWN' as const
    }

    return statusMap[status] || 'UNKNOWN'
  }
}

// ========== SINGLETON EXPORT ==========

export const facialRecognitionService = new FacialRecognitionService()

