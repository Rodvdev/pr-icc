/**
 * Centralized Audit Logging Helper
 * 
 * This module provides a unified interface for creating audit logs
 * across the application. All administrative and sensitive actions
 * should be logged through this helper.
 */

import { prisma } from './prisma'

// ========== TYPE DEFINITIONS ==========

export type AuditAction =
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'CLIENT_BLOCKED'
  | 'CLIENT_UNBLOCKED'
  | 'CLIENT_DELETED'
  | 'REGISTRATION_APPROVED'
  | 'REGISTRATION_REJECTED'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'BRANCH_CREATED'
  | 'BRANCH_UPDATED'
  | 'BRANCH_DELETED'
  | 'MODULE_CREATED'
  | 'MODULE_UPDATED'
  | 'MODULE_DELETED'
  | 'CAMERA_CREATED'
  | 'CAMERA_UPDATED'
  | 'CAMERA_DELETED'
  | 'CAMERA_CONFIGURED'
  | 'FAQ_CREATED'
  | 'FAQ_UPDATED'
  | 'FAQ_PUBLISHED'
  | 'FAQ_ARCHIVED'
  | 'FAQ_DELETED'
  | 'QA_CREATED'
  | 'QA_UPDATED'
  | 'QA_DELETED'
  | 'DATASET_REFRESHED'
  | 'VISIT_CREATED'
  | 'VISIT_UPDATED'
  | 'DETECTION_LOGGED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PERMISSION_DENIED'
  | 'DATA_EXPORTED'
  | 'SETTINGS_CHANGED'

export interface AuditLogData {
  action: AuditAction
  actorUserId?: string | null
  targetClientId?: string | null
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

// ========== AUDIT LOGGING FUNCTION ==========

/**
 * Create an audit log entry
 * 
 * @param data - Audit log data
 * @returns Created audit log entry
 * 
 * @example
 * ```ts
 * await audit({
 *   action: 'CLIENT_BLOCKED',
 *   actorUserId: session.user.id,
 *   targetClientId: clientId,
 *   details: { 
 *     reason: 'Fraud detected',
 *     previousStatus: 'ACTIVE'
 *   }
 * })
 * ```
 */
export async function audit(data: AuditLogData) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        action: data.action,
        actorUserId: data.actorUserId || null,
        targetClientId: data.targetClientId || null,
        details: data.details ? {
          ...data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date().toISOString()
        } : {
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date().toISOString()
        },
      }
    })

    console.log(`[AUDIT] ${data.action} by ${data.actorUserId || 'system'}`, {
      logId: log.id,
      target: data.targetClientId,
    })

    return log
  } catch (error) {
    console.error('[AUDIT] Failed to create audit log:', error, data)
    // Don't throw - audit logging should never break the main flow
    return null
  }
}

/**
 * Audit helper for successful logins
 */
export async function auditLogin(
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  return audit({
    action: 'LOGIN_SUCCESS',
    actorUserId: userId,
    ipAddress,
    userAgent,
    details: {
      loginTime: new Date().toISOString()
    }
  })
}

/**
 * Audit helper for failed login attempts
 */
export async function auditLoginFailed(
  email: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
) {
  return audit({
    action: 'LOGIN_FAILED',
    details: {
      email,
      reason,
      attemptTime: new Date().toISOString()
    },
    ipAddress,
    userAgent
  })
}

/**
 * Audit helper for permission denied events
 */
export async function auditPermissionDenied(
  userId: string,
  resource: string,
  action: string,
  ipAddress?: string,
  userAgent?: string
) {
  return audit({
    action: 'PERMISSION_DENIED',
    actorUserId: userId,
    details: {
      resource,
      attemptedAction: action,
      deniedAt: new Date().toISOString()
    },
    ipAddress,
    userAgent
  })
}

/**
 * Audit helper for data exports
 */
export async function auditDataExport(
  userId: string,
  dataType: string,
  recordCount: number,
  filters?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  return audit({
    action: 'DATA_EXPORTED',
    actorUserId: userId,
    details: {
      dataType,
      recordCount,
      filters,
      exportedAt: new Date().toISOString()
    },
    ipAddress,
    userAgent
  })
}

/**
 * Audit helper for client operations
 */
export async function auditClientOperation(
  action: Extract<AuditAction, 'CLIENT_CREATED' | 'CLIENT_UPDATED' | 'CLIENT_BLOCKED' | 'CLIENT_UNBLOCKED' | 'CLIENT_DELETED'>,
  actorUserId: string,
  clientId: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  return audit({
    action,
    actorUserId,
    targetClientId: clientId,
    details,
    ipAddress,
    userAgent
  })
}

/**
 * Get audit logs for a specific user
 */
export async function getAuditLogsForUser(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  return prisma.auditLog.findMany({
    where: {
      actorUserId: userId
    },
    include: {
      actorUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      },
      targetClient: {
        select: {
          id: true,
          email: true,
          name: true,
          dni: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  })
}

/**
 * Get audit logs for a specific client
 */
export async function getAuditLogsForClient(
  clientId: string,
  limit: number = 50,
  offset: number = 0
) {
  return prisma.auditLog.findMany({
    where: {
      targetClientId: clientId
    },
    include: {
      actorUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  })
}

/**
 * Get recent audit logs (admin view)
 */
export async function getRecentAuditLogs(
  limit: number = 100,
  offset: number = 0,
  action?: AuditAction
) {
  return prisma.auditLog.findMany({
    where: action ? {
      action
    } : undefined,
    include: {
      actorUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      },
      targetClient: {
        select: {
          id: true,
          email: true,
          name: true,
          dni: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  })
}

/**
 * Search audit logs by action or date range
 */
export async function searchAuditLogs(params: {
  actions?: AuditAction[]
  actorUserId?: string
  targetClientId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const {
    actions,
    actorUserId,
    targetClientId,
    startDate,
    endDate,
    limit = 100,
    offset = 0
  } = params

  const where: Record<string, unknown> = {}

  if (actions && actions.length > 0) {
    where.action = { in: actions }
  }

  if (actorUserId) {
    where.actorUserId = actorUserId
  }

  if (targetClientId) {
    where.targetClientId = targetClientId
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      (where.createdAt as Record<string, unknown>).gte = startDate
    }
    if (endDate) {
      (where.createdAt as Record<string, unknown>).lte = endDate
    }
  }

  return prisma.auditLog.findMany({
    where,
    include: {
      actorUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      },
      targetClient: {
        select: {
          id: true,
          email: true,
          name: true,
          dni: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  })
}

// ========== EXPORTS ==========

export default audit

