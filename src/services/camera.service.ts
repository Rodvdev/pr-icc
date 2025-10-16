/**
 * Camera Service
 * 
 * Business logic for camera management and monitoring.
 * Handles camera CRUD, status updates, and logging.
 */

import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'

// ========== TYPE DEFINITIONS ==========

export enum CameraStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR'
}

// Camera interface based on Prisma schema
export interface Camera {
  id: string
  branchId: string
  moduleId: string | null
  name: string
  streamUrl: string | null
  status: CameraStatus
  lastHeartbeat: Date | null
  ownerUserId: string | null
  createdAt: Date
  updatedAt: Date
}

// CameraLog interface based on Prisma schema
export interface CameraLog {
  id: string
  cameraId: string
  level: string
  message: string
  meta: Record<string, unknown> | null
  createdAt: Date
}

export interface CreateCameraData {
  name: string
  branchId: string
  moduleId?: string | null
  streamUrl?: string | null
}

export interface UpdateCameraData {
  name?: string
  streamUrl?: string | null
  status?: CameraStatus
  branchId?: string
  moduleId?: string | null
}

export interface CameraSearchParams {
  branchId?: string
  moduleId?: string
  status?: CameraStatus
  limit?: number
  offset?: number
}

// ========== CAMERA SERVICE ==========

export class CameraService {
  /**
   * Create a new camera
   */
  async createCamera(
    data: CreateCameraData,
    actorUserId: string
  ): Promise<Camera> {
    const camera = await prisma.camera.create({
      data: {
        name: data.name,
        branchId: data.branchId,
        moduleId: data.moduleId,
        streamUrl: data.streamUrl,
        status: 'OFFLINE' // Cameras start offline until activated
      }
    })

    await audit({
      action: 'CAMERA_CREATED',
      actorUserId,
      details: {
        cameraId: camera.id,
        cameraName: camera.name,
        branchId: camera.branchId
      }
    })

    return camera
  }

  /**
   * Get camera by ID
   */
  async getCameraById(cameraId: string): Promise<Camera | null> {
    return prisma.camera.findUnique({
      where: { id: cameraId },
      include: {
        branch: true,
        module: true,
        detections: {
          orderBy: { detectedAt: 'desc' },
          take: 20
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })
  }

  /**
   * Search cameras
   */
  async searchCameras(params: CameraSearchParams): Promise<{
    cameras: Camera[]
    total: number
  }> {
    const {
      branchId,
      moduleId,
      status,
      limit = 50,
      offset = 0
    } = params

    const where: Record<string, unknown> = {}

    if (branchId) {
      where.branchId = branchId
    }

    if (moduleId) {
      where.moduleId = moduleId
    }

    if (status) {
      where.status = status
    }

    const [cameras, total] = await Promise.all([
      prisma.camera.findMany({
        where,
        include: {
          branch: true,
          module: true
        },
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' }
      }),
      prisma.camera.count({ where })
    ])

    return { cameras, total }
  }

  /**
   * Get cameras by branch
   */
  async getCamerasByBranch(branchId: string): Promise<Camera[]> {
    return prisma.camera.findMany({
      where: { branchId },
      include: {
        module: true
      },
      orderBy: { name: 'asc' }
    })
  }

  /**
   * Get cameras by module
   */
  async getCamerasByModule(moduleId: string): Promise<Camera[]> {
    return prisma.camera.findMany({
      where: { moduleId },
      orderBy: { name: 'asc' }
    })
  }

  /**
   * Update camera
   */
  async updateCamera(
    cameraId: string,
    data: UpdateCameraData,
    actorUserId: string
  ): Promise<Camera> {
    const camera = await prisma.camera.update({
      where: { id: cameraId },
      data
    })

    await audit({
      action: 'CAMERA_UPDATED',
      actorUserId,
      details: {
        cameraId,
        updates: data
      }
    })

    return camera
  }

  /**
   * Update camera status
   */
  async updateCameraStatus(
    cameraId: string,
    status: CameraStatus,
    message?: string,
    actorUserId?: string
  ): Promise<Camera> {
    const camera = await prisma.camera.update({
      where: { id: cameraId },
      data: {
        status,
        lastHeartbeat: status === 'ONLINE' ? new Date() : undefined
      }
    })

    // Log the status change
    await this.createCameraLog(
      cameraId, 
      'INFO',
      `Status changed to ${status}`,
      {
        previousStatus: camera.status,
        newStatus: status,
        message
      }
    )

    if (actorUserId) {
      await audit({
        action: 'CAMERA_UPDATED',
        actorUserId,
        details: {
          cameraId,
          action: 'status_change',
          status,
          message
        }
      })
    }

    return camera
  }

  /**
   * Delete camera
   */
  async deleteCamera(
    cameraId: string,
    actorUserId: string
  ): Promise<Camera> {
    const camera = await prisma.camera.delete({
      where: { id: cameraId }
    })

    await audit({
      action: 'CAMERA_DELETED',
      actorUserId,
      details: {
        cameraId,
        cameraName: camera.name
      }
    })

    return camera
  }

  /**
   * Create camera log
   */
  async createCameraLog(
    cameraId: string,
    level: string,
    message: string,
    meta?: Record<string, unknown>
  ): Promise<CameraLog> {
    return prisma.cameraLog.create({
      data: {
        cameraId,
        level,
        message,
        meta: meta || {}
      }
    })
  }

  /**
   * Get camera logs
   */
  async getCameraLogs(
    cameraId: string,
    limit = 100
  ): Promise<CameraLog[]> {
    return prisma.cameraLog.findMany({
      where: { cameraId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  /**
   * Update camera last seen timestamp
   */
  async updateLastSeen(cameraId: string): Promise<void> {
    await prisma.camera.update({
      where: { id: cameraId },
      data: { lastHeartbeat: new Date() }
    })
  }

  /**
   * Get camera statistics
   */
  async getCameraStats(): Promise<{
    total: number
    online: number
    offline: number
    error: number
  }> {
    const [total, online, offline, error] = await Promise.all([
      prisma.camera.count(),
      prisma.camera.count({ where: { status: 'ONLINE' } }),
      prisma.camera.count({ where: { status: 'OFFLINE' } }),
      prisma.camera.count({ where: { status: 'ERROR' } })
    ])

    return { total, online, offline, error }
  }

  /**
   * Check camera health (detect offline cameras)
   */
  async checkCameraHealth(thresholdMinutes = 5): Promise<{
    healthy: Camera[]
    unhealthy: Camera[]
  }> {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000)

    const allCameras = await prisma.camera.findMany({
      where: {
        status: 'ONLINE'
      }
    })

    const healthy: Camera[] = []
    const unhealthy: Camera[] = []

    for (const camera of allCameras) {
      if (camera.lastHeartbeat && camera.lastHeartbeat > threshold) {
        healthy.push(camera)
      } else {
        unhealthy.push(camera)
        // Auto-update status to ERROR
        await this.updateCameraStatus(
          camera.id,
          CameraStatus.ERROR,
          'Camera not responding for over ' + thresholdMinutes + ' minutes'
        )
      }
    }

    return { healthy, unhealthy }
  }

  /**
   * Get camera uptime statistics
   */
  async getCameraUptime(
    cameraId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalMinutes: number
    onlineMinutes: number
    uptimePercentage: number
  }> {
    const logs = await prisma.cameraLog.findMany({
      where: {
        cameraId,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        level: 'INFO'
      },
      orderBy: { createdAt: 'asc' }
    })

    const totalMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
    
    // Simple uptime calculation based on status changes in logs
    let onlineMinutes = 0
    let currentStatus = 'OFFLINE'
    let lastTimestamp = startDate

    for (const log of logs) {
      const duration = (log.createdAt.getTime() - lastTimestamp.getTime()) / (1000 * 60)
      
      if (currentStatus === 'ONLINE') {
        onlineMinutes += duration
      }

      // Extract status from meta if available
      const meta = log.meta as { newStatus?: string } | null
      currentStatus = meta?.newStatus || 'OFFLINE'
      lastTimestamp = log.createdAt
    }

    // Add remaining time if currently online
    if (currentStatus === 'ONLINE') {
      const duration = (endDate.getTime() - lastTimestamp.getTime()) / (1000 * 60)
      onlineMinutes += duration
    }

    const uptimePercentage = totalMinutes > 0
      ? (onlineMinutes / totalMinutes) * 100
      : 0

    return {
      totalMinutes: Math.round(totalMinutes),
      onlineMinutes: Math.round(onlineMinutes),
      uptimePercentage: Math.round(uptimePercentage * 100) / 100
    }
  }
}

// ========== SINGLETON EXPORT ==========

export const cameraService = new CameraService()

