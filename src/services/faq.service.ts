/**
 * FAQ Service
 * 
 * Business logic for FAQ and QA pair management.
 * Handles knowledge base operations for the chatbot.
 */

import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'

// ========== TYPE DEFINITIONS ==========

export enum FAQStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

// FAQ interface based on Prisma schema
export interface FAQ {
  id: string
  title: string
  answer: string
  tags: string[]
  status: string
  createdAt: Date
  updatedAt: Date
}

// QAPair interface based on Prisma schema
export interface QAPair {
  id: string
  question: string
  answer: string
  metadata: Record<string, unknown> | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateFAQData {
  title: string
  answer: string
  tags?: string[]
  status?: FAQStatus
}

export interface UpdateFAQData {
  title?: string
  answer?: string
  tags?: string[]
  status?: FAQStatus
}

export interface CreateQAPairData {
  question: string
  answer: string
  metadata?: Record<string, unknown> | null
}

export interface UpdateQAPairData {
  question?: string
  answer?: string
  metadata?: Record<string, unknown> | null
  isActive?: boolean
}

export interface FAQSearchParams {
  query?: string
  status?: FAQStatus
  tags?: string[]
  limit?: number
  offset?: number
}

// ========== FAQ SERVICE ==========

export class FAQService {
  // ========== FAQ OPERATIONS ==========

  /**
   * Create a new FAQ
   */
  async createFAQ(
    data: CreateFAQData,
    actorUserId: string
  ): Promise<FAQ> {
    const faq = await prisma.fAQ.create({
      data: {
        title: data.title,
        answer: data.answer,
        tags: data.tags || [],
        status: data.status || FAQStatus.DRAFT
      }
    })

    await audit({
      action: 'FAQ_CREATED',
      actorUserId,
      details: {
        faqId: faq.id,
        title: faq.title,
        status: faq.status
      }
    })

    return faq
  }

  /**
   * Get FAQ by ID
   */
  async getFAQById(faqId: string): Promise<FAQ | null> {
    return prisma.fAQ.findUnique({
      where: { id: faqId }
    })
  }

  /**
   * Search FAQs
   */
  async searchFAQs(params: FAQSearchParams): Promise<{
    faqs: FAQ[]
    total: number
  }> {
    const {
      query,
      status,
      tags,
      limit = 50,
      offset = 0
    } = params

    const where: Record<string, unknown> = {}

    // Status filter
    if (status) {
      where.status = status
    }

    // Tags filter
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags
      }
    }

    // Search query (title or answer)
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { answer: { contains: query, mode: 'insensitive' } }
      ]
    }

    const [faqs, total] = await Promise.all([
      prisma.fAQ.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.fAQ.count({ where })
    ])

    return { faqs, total }
  }

  /**
   * Get all published FAQs
   */
  async getPublishedFAQs(): Promise<FAQ[]> {
    return prisma.fAQ.findMany({
      where: { status: FAQStatus.PUBLISHED },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Update FAQ
   */
  async updateFAQ(
    faqId: string,
    data: UpdateFAQData,
    actorUserId: string
  ): Promise<FAQ> {
    const faq = await prisma.fAQ.update({
      where: { id: faqId },
      data
    })

    await audit({
      action: 'FAQ_UPDATED',
      actorUserId,
      details: {
        faqId,
        updates: data
      }
    })

    return faq
  }

  /**
   * Publish FAQ
   */
  async publishFAQ(
    faqId: string,
    actorUserId: string
  ): Promise<FAQ> {
    const faq = await prisma.fAQ.update({
      where: { id: faqId },
      data: { status: FAQStatus.PUBLISHED }
    })

    await audit({
      action: 'FAQ_PUBLISHED',
      actorUserId,
      details: {
        faqId,
        title: faq.title
      }
    })

    return faq
  }

  /**
   * Archive FAQ
   */
  async archiveFAQ(
    faqId: string,
    actorUserId: string
  ): Promise<FAQ> {
    const faq = await prisma.fAQ.update({
      where: { id: faqId },
      data: { status: FAQStatus.ARCHIVED }
    })

    await audit({
      action: 'FAQ_ARCHIVED',
      actorUserId,
      details: {
        faqId,
        title: faq.title
      }
    })

    return faq
  }

  /**
   * Delete FAQ
   */
  async deleteFAQ(
    faqId: string,
    actorUserId: string
  ): Promise<FAQ> {
    const faq = await prisma.fAQ.delete({
      where: { id: faqId }
    })

    await audit({
      action: 'FAQ_DELETED',
      actorUserId,
      details: {
        faqId,
        title: faq.title
      }
    })

    return faq
  }

  /**
   * Bulk publish FAQs
   */
  async bulkPublishFAQs(
    faqIds: string[],
    actorUserId: string
  ): Promise<number> {
    const result = await prisma.fAQ.updateMany({
      where: {
        id: { in: faqIds }
      },
      data: { status: FAQStatus.PUBLISHED }
    })

    await audit({
      action: 'FAQ_PUBLISHED',
      actorUserId,
      details: {
        action: 'bulk_publish',
        count: result.count,
        faqIds
      }
    })

    return result.count
  }

  // ========== QA PAIR OPERATIONS ==========

  /**
   * Create a new QA pair
   */
  async createQAPair(
    data: CreateQAPairData,
    actorUserId: string
  ): Promise<Awaited<ReturnType<typeof prisma.qAPair.create>>> {
    const qaPair = await prisma.qAPair.create({
      data: {
        question: data.question,
        answer: data.answer,
        metadata: data.metadata || undefined,
        isActive: true
      }
    })

    await audit({
      action: 'QA_CREATED',
      actorUserId,
      details: {
        qaPairId: qaPair.id,
        question: qaPair.question
      }
    })

    return qaPair
  }

  /**
   * Get QA pair by ID
   */
  async getQAPairById(qaPairId: string): Promise<Awaited<ReturnType<typeof prisma.qAPair.findUnique>>> {
    return prisma.qAPair.findUnique({
      where: { id: qaPairId }
    })
  }

  /**
   * Search QA pairs
   */
  async searchQAPairs(params: {
    query?: string
    isActive?: boolean
    limit?: number
    offset?: number
  }): Promise<{
    qaPairs: Awaited<ReturnType<typeof prisma.qAPair.findMany>>
    total: number
  }> {
    const {
      query,
      isActive = true,
      limit = 50,
      offset = 0
    } = params

    const where: Record<string, unknown> = {
      isActive
    }

    // Search query
    if (query) {
      where.OR = [
        { question: { contains: query, mode: 'insensitive' } },
        { answer: { contains: query, mode: 'insensitive' } }
      ]
    }

    const [qaPairs, total] = await Promise.all([
      prisma.qAPair.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.qAPair.count({ where })
    ])

    return { qaPairs, total }
  }

  /**
   * Update QA pair
   */
  async updateQAPair(
    qaPairId: string,
    data: UpdateQAPairData,
    actorUserId: string
  ): Promise<Awaited<ReturnType<typeof prisma.qAPair.create>>> {
    const qaPair = await prisma.qAPair.update({
      where: { id: qaPairId },
      data: {
        ...data,
        metadata: data.metadata !== undefined ? data.metadata : undefined
      }
    })

    await audit({
      action: 'QA_UPDATED',
      actorUserId,
      details: {
        qaPairId,
        updates: data
      }
    })

    return qaPair
  }

  /**
   * Delete QA pair
   */
  async deleteQAPair(
    qaPairId: string,
    actorUserId: string
  ): Promise<Awaited<ReturnType<typeof prisma.qAPair.create>>> {
    const qaPair = await prisma.qAPair.delete({
      where: { id: qaPairId }
    })

    await audit({
      action: 'QA_DELETED',
      actorUserId,
      details: {
        qaPairId,
        question: qaPair.question
      }
    })

    return qaPair
  }

  /**
   * Get all active QA pairs
   */
  async getActiveQAPairs(): Promise<Awaited<ReturnType<typeof prisma.qAPair.findMany>>> {
    return prisma.qAPair.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  // ========== DATASET OPERATIONS ==========

  /**
   * Refresh dataset (for chatbot)
   */
  async refreshDataset(actorUserId: string): Promise<{
    publishedFAQs: number
    activeQAPairs: number
  }> {
    const [publishedFAQs, activeQAPairs] = await Promise.all([
      prisma.fAQ.count({ where: { status: FAQStatus.PUBLISHED } }),
      prisma.qAPair.count({ where: { isActive: true } })
    ])

    await audit({
      action: 'DATASET_REFRESHED',
      actorUserId,
      details: {
        publishedFAQs,
        activeQAPairs,
        timestamp: new Date().toISOString()
      }
    })

    return { publishedFAQs, activeQAPairs }
  }

  /**
   * Get FAQ statistics
   */
  async getFAQStats(): Promise<{
    totalFAQs: number
    publishedFAQs: number
    draftFAQs: number
    archivedFAQs: number
    totalQAPairs: number
    activeQAPairs: number
  }> {
    const [
      totalFAQs,
      publishedFAQs,
      draftFAQs,
      archivedFAQs,
      totalQAPairs,
      activeQAPairs
    ] = await Promise.all([
      prisma.fAQ.count(),
      prisma.fAQ.count({ where: { status: FAQStatus.PUBLISHED } }),
      prisma.fAQ.count({ where: { status: FAQStatus.DRAFT } }),
      prisma.fAQ.count({ where: { status: FAQStatus.ARCHIVED } }),
      prisma.qAPair.count(),
      prisma.qAPair.count({ where: { isActive: true } })
    ])

    return {
      totalFAQs,
      publishedFAQs,
      draftFAQs,
      archivedFAQs,
      totalQAPairs,
      activeQAPairs
    }
  }

  /**
   * Get all unique tags from FAQs
   */
  async getAllTags(): Promise<string[]> {
    const faqs = await prisma.fAQ.findMany({
      select: { tags: true }
    })

    const tags = new Set<string>()
    faqs.forEach((f: { tags: string[] }) => f.tags.forEach((tag: string) => tags.add(tag)))

    return Array.from(tags).sort()
  }
}

// ========== SINGLETON EXPORT ==========

export const faqService = new FAQService()

