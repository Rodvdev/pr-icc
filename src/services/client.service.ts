/**
 * Client Service
 * 
 * Business logic for client management operations.
 * Handles client CRUD, registration approval, and status management.
 */

import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

// ========== TYPE DEFINITIONS ==========

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED'
}

// Client interface based on Prisma schema
export interface Client {
  id: string
  dni: string | null
  name: string | null
  email: string | null
  phone: string | null
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED'
  hashedPassword: string | null
  passwordUpdatedAt: Date | null
  locale: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateClientData {
  email: string
  password: string
  name?: string | null
  dni?: string | null
  phone?: string | null
}

export interface UpdateClientData {
  name?: string | null
  email?: string
  phone?: string | null
}

export interface ClientSearchParams {
  query?: string
  status?: ClientStatus
  limit?: number
  offset?: number
}

// ========== CLIENT SERVICE ==========

export class ClientService {
  /**
   * Create a new client
   */
  async createClient(
    data: CreateClientData,
    actorUserId?: string
  ): Promise<Client> {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Create client
    const client = await prisma.client.create({
      data: {
        email: data.email,
        hashedPassword: hashedPassword,
        name: data.name,
        dni: data.dni,
        phone: data.phone,
        status: 'ACTIVE' // New clients start as active (no PENDING status in enum)
      }
    })

    // Audit log
    await audit({
      action: 'CLIENT_CREATED',
      actorUserId: actorUserId || null,
      targetClientId: client.id,
      details: {
        email: client.email,
        dni: client.dni,
        status: client.status
      }
    })

    return client
  }

  /**
   * Get client by ID
   */
  async getClientById(clientId: string): Promise<Client | null> {
    return prisma.client.findUnique({
      where: { id: clientId },
      include: {
        facialProfiles: true,
        visits: {
          orderBy: { startedAt: 'desc' },
          take: 10
        },
        chatSessions: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      }
    })
  }

  /**
   * Get client by email
   */
  async getClientByEmail(email: string): Promise<Client | null> {
    return prisma.client.findUnique({
      where: { email }
    })
  }

  /**
   * Get client by DNI
   */
  async getClientByDni(dni: string): Promise<Client | null> {
    return prisma.client.findUnique({
      where: { dni }
    })
  }

  /**
   * Search clients with filters
   */
  async searchClients(params: ClientSearchParams): Promise<{
    clients: Client[]
    total: number
  }> {
    const {
      query,
      status,
      limit = 50,
      offset = 0
    } = params

    const where: Record<string, unknown> = {}

    // Status filter
    if (status) {
      where.status = status
    }

    // Search query (name, email, or DNI)
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { dni: { contains: query, mode: 'insensitive' } }
      ]
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.client.count({ where })
    ])

    return { clients, total }
  }

  /**
   * Update client information
   */
  async updateClient(
    clientId: string,
    data: UpdateClientData,
    actorUserId?: string
  ): Promise<Client> {
    const client = await prisma.client.update({
      where: { id: clientId },
      data
    })

    await audit({
      action: 'CLIENT_UPDATED',
      actorUserId: actorUserId || null,
      targetClientId: clientId,
      details: {
        updates: data
      }
    })

    return client
  }

  /**
   * Activate a client (approve registration)
   */
  async activateClient(
    clientId: string,
    actorUserId: string
  ): Promise<Client> {
    const client = await prisma.client.update({
      where: { id: clientId },
      data: { status: 'ACTIVE' }
    })

    await audit({
      action: 'REGISTRATION_APPROVED',
      actorUserId,
      targetClientId: clientId,
      details: {
        newStatus: 'ACTIVE'
      }
    })

    return client
  }

  /**
   * Block a client
   */
  async blockClient(
    clientId: string,
    reason: string,
    actorUserId: string
  ): Promise<Client> {
    const client = await prisma.client.update({
      where: { id: clientId },
      data: { status: 'BLOCKED' }
    })

    await audit({
      action: 'CLIENT_BLOCKED',
      actorUserId,
      targetClientId: clientId,
      details: {
        reason,
        previousStatus: client.status
      }
    })

    return client
  }

  /**
   * Unblock a client
   */
  async unblockClient(
    clientId: string,
    actorUserId: string
  ): Promise<Client> {
    const client = await prisma.client.update({
      where: { id: clientId },
      data: { status: 'ACTIVE' }
    })

    await audit({
      action: 'CLIENT_UNBLOCKED',
      actorUserId,
      targetClientId: clientId,
      details: {
        previousStatus: 'BLOCKED',
        newStatus: 'ACTIVE'
      }
    })

    return client
  }

  /**
   * Delete a client (soft delete by setting status to DELETED)
   */
  async deleteClient(
    clientId: string,
    actorUserId: string
  ): Promise<Client> {
    const client = await prisma.client.update({
      where: { id: clientId },
      data: { status: 'DELETED' }
    })

    await audit({
      action: 'CLIENT_DELETED',
      actorUserId,
      targetClientId: clientId,
      details: {
        method: 'soft_delete'
      }
    })

    return client
  }

  /**
   * Change client password
   */
  async changePassword(
    clientId: string,
    newPassword: string,
    actorUserId?: string
  ): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.client.update({
      where: { id: clientId },
      data: { 
        hashedPassword: hashedPassword,
        passwordUpdatedAt: new Date()
      }
    })

    await audit({
      action: 'PASSWORD_CHANGED',
      actorUserId: actorUserId || null,
      targetClientId: clientId
    })
  }

  /**
   * Verify client password
   */
  async verifyPassword(
    clientId: string,
    password: string
  ): Promise<boolean> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { hashedPassword: true }
    })

    if (!client || !client.hashedPassword) {
      return false
    }

    return bcrypt.compare(password, client.hashedPassword)
  }

  /**
   * Get client statistics
   */
  async getClientStats(): Promise<{
    total: number
    active: number
    blocked: number
    deleted: number
  }> {
    const [total, active, blocked, deleted] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: 'ACTIVE' } }),
      prisma.client.count({ where: { status: 'BLOCKED' } }),
      prisma.client.count({ where: { status: 'DELETED' } })
    ])

    return { total, active, blocked, deleted }
  }
}

// ========== SINGLETON EXPORT ==========

export const clientService = new ClientService()

