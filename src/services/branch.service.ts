/**
 * Branch Service
 * 
 * Business logic for branch and module management.
 * Handles branch CRUD, module assignments, and location management.
 */

import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'

// ========== TYPE DEFINITIONS ==========

export interface CreateBranchData {
  code: string
  name: string
  address?: string | null
  city?: string | null
  country?: string | null
}

export interface UpdateBranchData {
  code?: string
  name?: string
  address?: string | null
  city?: string | null
  country?: string | null
}

export interface CreateModuleData {
  name: string
  code: string
  branchId: string
}

export interface UpdateModuleData {
  name?: string
  code?: string
  isActive?: boolean
}

export interface Branch {
  id: string
  code: string
  name: string
  address?: string | null
  city?: string | null
  country?: string | null
}

export interface Module {
  id: string
  code: string
  name: string
  isActive: boolean
}

// ========== BRANCH SERVICE ==========

export class BranchService {
  /**
   * Create a new branch
   */
  async createBranch(
    data: CreateBranchData,
    actorUserId: string
  ) {
    const branch = await prisma.branch.create({
      data: {
        code: data.code,
        name: data.name,
        address: data.address,
        city: data.city,
        country: data.country || "PE"
      }
    })

    await audit({
      action: 'BRANCH_CREATED',
      actorUserId,
      details: {
        branchId: branch.id,
        branchCode: branch.code,
        branchName: branch.name
      }
    })

    return branch
  }

  /**
   * Get branch by ID
   */
  async getBranchById(branchId: string) {
    return prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        modules: true,
        cameras: true,
        visits: {
          where: {
            startedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: { startedAt: 'desc' }
        },
        admins: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })
  }

  /**
   * Get branch by code
   */
  async getBranchByCode(code: string) {
    return prisma.branch.findUnique({
      where: { code }
    })
  }

  /**
   * Get all branches
   */
  async getAllBranches() {
    // Branch model doesn't have isActive field, so we just fetch all
    return prisma.branch.findMany({
      include: {
        modules: true,
        cameras: true,
        admins: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
  }

  /**
   * Update branch information
   */
  async updateBranch(
    branchId: string,
    data: UpdateBranchData,
    actorUserId: string
  ) {
    const branch = await prisma.branch.update({
      where: { id: branchId },
      data
    })

    await audit({
      action: 'BRANCH_UPDATED',
      actorUserId,
      details: {
        branchId,
        updates: data
      }
    })

    return branch
  }

  /**
   * Delete branch (hard delete)
   */
  async deleteBranch(
    branchId: string,
    actorUserId: string
  ) {
    const branch = await prisma.branch.delete({
      where: { id: branchId }
    })

    await audit({
      action: 'BRANCH_DELETED',
      actorUserId,
      details: {
        branchId,
        branchCode: branch.code,
        method: 'hard_delete'
      }
    })

    return branch
  }

  /**
   * Create a new module
   */
  async createModule(
    data: CreateModuleData,
    actorUserId: string
  ) {
    const agentModule = await prisma.agentModule.create({
      data: {
        name: data.name,
        code: data.code,
        branchId: data.branchId,
        isActive: true
      }
    })

    await audit({
      action: 'MODULE_CREATED',
      actorUserId,
      details: {
        moduleId: agentModule.id,
        moduleName: agentModule.name,
        moduleCode: agentModule.code,
        branchId: data.branchId
      }
    })

    return agentModule
  }

  /**
   * Get module by ID
   */
  async getModuleById(moduleId: string) {
    return prisma.agentModule.findUnique({
      where: { id: moduleId },
      include: {
        branch: true,
        cameras: true
      }
    })
  }

  /**
   * Get modules by branch
   */
  async getModulesByBranch(branchId: string) {
    return prisma.agentModule.findMany({
      where: { branchId },
      include: {
        cameras: true
      },
      orderBy: { code: 'asc' }
    })
  }

  /**
   * Update module
   */
  async updateModule(
    moduleId: string,
    data: UpdateModuleData,
    actorUserId: string
  ) {
    const agentModule = await prisma.agentModule.update({
      where: { id: moduleId },
      data
    })

    await audit({
      action: 'MODULE_UPDATED',
      actorUserId,
      details: {
        moduleId,
        updates: data
      }
    })

    return agentModule
  }


  /**
   * Delete module
   */
  async deleteModule(
    moduleId: string,
    actorUserId: string
  ) {
    const agentModule = await prisma.agentModule.delete({
      where: { id: moduleId }
    })

    await audit({
      action: 'MODULE_DELETED',
      actorUserId,
      details: {
        moduleId,
        moduleName: agentModule.name,
        moduleCode: agentModule.code
      }
    })

    return agentModule
  }

  /**
   * Get branch statistics
   */
  async getBranchStats(): Promise<{
    totalBranches: number
    activeBranches: number
    totalModules: number
    availableModules: number
    inUseModules: number
  }> {
    const [
      totalBranches,
      activeBranches,
      totalModules,
      availableModules,
      inUseModules
    ] = await Promise.all([
      prisma.branch.count(),
      prisma.branch.count(), // Branch model doesn't have isActive field
      prisma.agentModule.count(),
      prisma.agentModule.count({ where: { isActive: true } }),
      prisma.agentModule.count({ where: { isActive: true } })
    ])

    return {
      totalBranches,
      activeBranches,
      totalModules,
      availableModules,
      inUseModules
    }
  }
}

// ========== SINGLETON EXPORT ==========

export const branchService = new BranchService()

