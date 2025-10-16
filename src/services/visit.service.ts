/**
 * Visit Service
 * 
 * Business logic for visit management and tracking.
 * Handles visit creation, status updates, and history.
 */

import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { VisitStatus as PrismaVisitStatus } from '@prisma/client'

// ========== TYPE DEFINITIONS ==========

export enum VisitStatus {
  WAITING = 'WAITING',
  IN_SERVICE = 'IN_SERVICE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED'
}

// Visit interface based on Prisma schema
export interface Visit {
  id: string
  clientId: string | null
  branchId: string
  moduleId: string | null
  detectionId: string | null
  status: PrismaVisitStatus
  purpose: string | null
  startedAt: Date
  assignedAt: Date | null
  finishedAt: Date | null
}

export interface CreateVisitData {
  clientId: string
  branchId: string
  moduleId?: string | null
  purpose?: string | null
}

export interface UpdateVisitData {
  status?: VisitStatus
  purpose?: string | null
  moduleId?: string | null
  assignedAt?: Date | null
  finishedAt?: Date | null
}

export interface VisitSearchParams {
  clientId?: string
  branchId?: string
  status?: VisitStatus
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// ========== VISIT SERVICE ==========

export class VisitService {
  /**
   * Create a new visit
   */
  async createVisit(
    data: CreateVisitData,
    actorUserId?: string
  ): Promise<Visit> {
    const visit = await prisma.visit.create({
      data: {
        clientId: data.clientId,
        branchId: data.branchId,
        moduleId: data.moduleId,
        purpose: data.purpose || 'Consulta general',
        status: PrismaVisitStatus.WAITING
      },
      include: {
        client: true,
        branch: true
      }
    })

    await audit({
      action: 'VISIT_CREATED',
      actorUserId: actorUserId || null,
      targetClientId: data.clientId,
      details: {
        visitId: visit.id,
        branchId: data.branchId,
        purpose: data.purpose
      }
    })

    return visit
  }

  /**
   * Get visit by ID
   */
  async getVisitById(visitId: string): Promise<Visit | null> {
    return prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        client: true,
        branch: true
      }
    })
  }

  /**
   * Get active visit for client
   * Returns the most recent WAITING or IN_SERVICE visit
   */
  async getActiveVisitForClient(clientId: string): Promise<Visit | null> {
    return prisma.visit.findFirst({
      where: {
        clientId,
        status: {
          in: [VisitStatus.WAITING, VisitStatus.IN_SERVICE]
        }
      },
      orderBy: { startedAt: 'desc' },
      include: {
        branch: true
      }
    })
  }

  /**
   * Search visits
   */
  async searchVisits(params: VisitSearchParams): Promise<{
    visits: Visit[]
    total: number
  }> {
    const {
      clientId,
      branchId,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = params

    const where: Record<string, unknown> = {}

    if (clientId) {
      where.clientId = clientId
    }

    if (branchId) {
      where.branchId = branchId
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      const startedAt: Record<string, Date> = {}
      if (startDate) {
        startedAt.gte = startDate
      }
      if (endDate) {
        startedAt.lte = endDate
      }
      where.startedAt = startedAt
    }

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              dni: true
            }
          },
          branch: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { startedAt: 'desc' }
      }),
      prisma.visit.count({ where })
    ])

    return { visits, total }
  }

  /**
   * Get visits by client
   */
  async getVisitsByClient(
    clientId: string,
    limit = 20
  ): Promise<Visit[]> {
    return prisma.visit.findMany({
      where: { clientId },
      include: {
        branch: true
      },
      take: limit,
      orderBy: { startedAt: 'desc' }
    })
  }

  /**
   * Get visits by branch
   */
  async getVisitsByBranch(
    branchId: string,
    status?: VisitStatus,
    limit = 50
  ): Promise<Visit[]> {
    const where: Record<string, unknown> = { branchId }
    
    if (status) {
      where.status = status
    }

    return prisma.visit.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            dni: true
          }
        }
      },
      take: limit,
      orderBy: { startedAt: 'desc' }
    })
  }

  /**
   * Get waiting queue for a branch
   */
  async getWaitingQueue(branchId: string): Promise<Visit[]> {
    return prisma.visit.findMany({
      where: {
        branchId,
        status: PrismaVisitStatus.WAITING
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            dni: true
          }
        }
      },
      orderBy: { startedAt: 'asc' } // FIFO - first in, first out
    })
  }

  /**
   * Update visit status
   */
  async updateVisitStatus(
    visitId: string,
    status: PrismaVisitStatus,
    actorUserId?: string
  ): Promise<Visit> {
    const updateData: Record<string, unknown> = { status }

    // Set finishedAt when visit is completed or abandoned
    if (status === VisitStatus.COMPLETED || status === VisitStatus.ABANDONED) {
      updateData.finishedAt = new Date()
    }

    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: updateData,
      include: {
        client: true,
        branch: true
      }
    })

    await audit({
      action: 'VISIT_UPDATED',
      actorUserId: actorUserId || null,
      targetClientId: visit.clientId,
      details: {
        visitId,
        previousStatus: visit.status,
        newStatus: status
      }
    })

    return visit
  }

  /**
   * Start service for a visit (move from WAITING to IN_SERVICE)
   */
  async startService(
    visitId: string,
    actorUserId: string
  ): Promise<Visit> {
    return this.updateVisitStatus(visitId, VisitStatus.IN_SERVICE, actorUserId)
  }

  /**
   * Complete a visit
   */
  async completeVisit(
    visitId: string,
    actorUserId?: string
  ): Promise<Visit> {
    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: {
        status: PrismaVisitStatus.COMPLETED,
        finishedAt: new Date()
      },
      include: {
        client: true,
        branch: true
      }
    })

    await audit({
      action: 'VISIT_UPDATED',
      actorUserId: actorUserId || null,
      targetClientId: visit.clientId,
      details: {
        visitId,
        action: 'completed'
      }
    })

    return visit
  }

  /**
   * Abandon a visit (client left before service)
   */
  async abandonVisit(
    visitId: string,
    reason?: string,
    actorUserId?: string
  ): Promise<Visit> {
    const visit = await prisma.visit.update({
      where: { id: visitId },
      data: {
        status: PrismaVisitStatus.ABANDONED,
        finishedAt: new Date()
      },
      include: {
        client: true,
        branch: true
      }
    })

    await audit({
      action: 'VISIT_UPDATED',
      actorUserId: actorUserId || null,
      targetClientId: visit.clientId,
      details: {
        visitId,
        action: 'abandoned',
        reason
      }
    })

    return visit
  }

  /**
   * Update visit details
   */
  async updateVisit(
    visitId: string,
    data: UpdateVisitData,
    actorUserId?: string
  ): Promise<Visit> {
    const visit = await prisma.visit.update({
      where: { id: visitId },
      data,
      include: {
        client: true,
        branch: true
      }
    })

    await audit({
      action: 'VISIT_UPDATED',
      actorUserId: actorUserId || null,
      targetClientId: visit.clientId,
      details: {
        visitId,
        updates: data
      }
    })

    return visit
  }

  /**
   * Get visit statistics
   */
  async getVisitStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number
    waiting: number
    inService: number
    completed: number
    abandoned: number
    averageWaitTime: number
    averageServiceTime: number
    completionRate: number
  }> {
    const where: Record<string, unknown> = {}

    if (startDate || endDate) {
      const startedAt: Record<string, Date> = {}
      if (startDate) startedAt.gte = startDate
      if (endDate) startedAt.lte = endDate
      where.startedAt = startedAt
    }

    const [
      total,
      waiting,
      inService,
      completed,
      abandoned,
      allVisits
    ] = await Promise.all([
      prisma.visit.count({ where }),
      prisma.visit.count({ where: { ...where, status: VisitStatus.WAITING } }),
      prisma.visit.count({ where: { ...where, status: VisitStatus.IN_SERVICE } }),
      prisma.visit.count({ where: { ...where, status: VisitStatus.COMPLETED } }),
      prisma.visit.count({ where: { ...where, status: VisitStatus.ABANDONED } }),
      prisma.visit.findMany({ where })
    ])

    // Calculate average wait time and service time
    let totalWaitTime = 0
    let totalServiceTime = 0
    let waitTimeCount = 0
    let serviceTimeCount = 0

    for (const visit of allVisits) {
      if (visit.finishedAt) {
        const totalTime = visit.finishedAt.getTime() - visit.startedAt.getTime()
        totalServiceTime += totalTime
        serviceTimeCount++

        // Calculate wait time from startedAt to assignedAt
        if (visit.assignedAt) {
          const waitTime = visit.assignedAt.getTime() - visit.startedAt.getTime()
          totalWaitTime += waitTime
          waitTimeCount++
        }
      }
    }

    const averageWaitTime = waitTimeCount > 0
      ? Math.round(totalWaitTime / waitTimeCount / 1000 / 60) // minutes
      : 0

    const averageServiceTime = serviceTimeCount > 0
      ? Math.round(totalServiceTime / serviceTimeCount / 1000 / 60) // minutes
      : 0

    const completionRate = total > 0
      ? Math.round((completed / (completed + abandoned)) * 100)
      : 0

    return {
      total,
      waiting,
      inService,
      completed,
      abandoned,
      averageWaitTime,
      averageServiceTime,
      completionRate
    }
  }

  /**
   * Get visit statistics by branch
   */
  async getVisitStatsByBranch(
    branchId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number
    completed: number
    abandoned: number
    averageVisitsPerDay: number
  }> {
    const where: Record<string, unknown> = { branchId }

    if (startDate || endDate) {
      const startedAt: Record<string, Date> = {}
      if (startDate) startedAt.gte = startDate
      if (endDate) startedAt.lte = endDate
      where.startedAt = startedAt
    }

    const [total, completed, abandoned] = await Promise.all([
      prisma.visit.count({ where }),
      prisma.visit.count({ where: { ...where, status: VisitStatus.COMPLETED } }),
      prisma.visit.count({ where: { ...where, status: VisitStatus.ABANDONED } })
    ])

    // Calculate average visits per day
    const days = startDate && endDate
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 1
    const averageVisitsPerDay = Math.round(total / days)

    return {
      total,
      completed,
      abandoned,
      averageVisitsPerDay
    }
  }
}

// ========== SINGLETON EXPORT ==========

export const visitService = new VisitService()

