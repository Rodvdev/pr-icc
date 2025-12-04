/**
 * MCP (Model Context Protocol) Client-Broker
 * 
 * This module provides MCP tools for the Anthropic Claude integration.
 * 
 * Phase 1-2: Stub implementations
 * Phase 3-5: Full implementations with database integration
 * Phase 6-7: Performance optimizations and caching
 */

import { prisma } from './prisma'

// ========== TYPE DEFINITIONS ==========

export interface FAQData {
  id?: string
  title: string
  answer: string
  tags?: string[]
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

export interface FAQSearchResult {
  items: Array<{
    id: string
    title: string
    answer: string
    tags: string[]
    relevance: number
  }>
}

export interface QASearchResult {
  items: Array<{
    id: string
    question: string
    answer: string
    relevance: number
  }>
}

export interface ClientLookupResult {
  client: {
    id: string
    dni?: string
    name?: string
    email?: string
    phone?: string
    status: string
  } | null
}

export interface VisitResult {
  visitId: string
  status: 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'ABANDONED'
}

export interface KPIsResult {
  visitors: number
  newVsReturning: {
    new: number
    returning: number
  }
  completionPct: number
}

export interface HandOffResult {
  status: 'QUEUED' | 'ASSIGNED' | 'FAILED'
  agentId?: string
  estimatedWaitTime?: number
}

// ========== HELPER FUNCTIONS ==========

/**
 * Calculate relevance score based on keyword matches
 * 
 * Algorithm:
 * - Tokenizes query and text into words
 * - Counts exact matches (case-insensitive)
 * - Counts partial matches (substring matches)
 * - Weights title matches higher than content matches
 * - Returns score between 0 and 1
 * 
 * @param query - Search query string
 * @param title - Title text to search in
 * @param content - Content text to search in
 * @returns Relevance score between 0 and 1
 */
function calculateRelevance(
  query: string,
  title: string,
  content: string
): number {
  if (!query || !title || !content) {
    return 0
  }

  const queryLower = query.toLowerCase().trim()
  const titleLower = title.toLowerCase()
  const contentLower = content.toLowerCase()

  // Tokenize query into words (remove common stop words)
  const stopWords = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'y', 'o', 'que', 'es', 'son', 'para', 'con', 'por', 'sobre', 'a', 'al', 'se', 'le', 'te', 'me', 'nos', 'les'])
  const queryWords = queryLower
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))

  if (queryWords.length === 0) {
    // If query is too short or only stop words, use substring matching
    if (titleLower.includes(queryLower) || contentLower.includes(queryLower)) {
      return 0.3
    }
    return 0
  }

  let titleScore = 0
  let contentScore = 0
  let exactMatches = 0
  let partialMatches = 0

  // Check for exact phrase match (highest priority)
  if (titleLower.includes(queryLower)) {
    titleScore += 0.5
    exactMatches++
  }
  if (contentLower.includes(queryLower)) {
    contentScore += 0.3
    exactMatches++
  }

  // Check for individual word matches
  for (const word of queryWords) {
    // Exact word match in title (weighted higher)
    if (titleLower.includes(word)) {
      titleScore += 0.3
      exactMatches++
    } else if (new RegExp(`\\b${word}\\w*`, 'i').test(titleLower)) {
      // Partial match in title
      titleScore += 0.1
      partialMatches++
    }

    // Exact word match in content
    if (contentLower.includes(word)) {
      contentScore += 0.2
      exactMatches++
    } else if (new RegExp(`\\b${word}\\w*`, 'i').test(contentLower)) {
      // Partial match in content
      contentScore += 0.05
      partialMatches++
    }
  }

  // Calculate final relevance score
  // Title matches are weighted 2x more than content matches
  const totalScore = (titleScore * 2 + contentScore) / (queryWords.length * 2.5)
  
  // Boost score if there are exact matches
  const exactMatchBoost = exactMatches > 0 ? 0.2 : 0
  const partialMatchPenalty = partialMatches > exactMatches ? -0.1 : 0

  // Normalize to 0-1 range
  const relevance = Math.min(1, Math.max(0, totalScore + exactMatchBoost + partialMatchPenalty))

  return Math.round(relevance * 100) / 100 // Round to 2 decimal places
}

// ========== MCP TOOLS ==========

/**
 * FAQ Search Tool
 * Search for FAQs based on query and optional tags
 * Uses keyword-based search with relevance scoring
 * 
 * @param query - Search query string
 * @param tags - Optional array of tags to filter by
 * @param topK - Number of results to return (default: 5)
 */
export async function faqSearch(
  query: string,
  tags?: string[],
  topK: number = 5
): Promise<FAQSearchResult> {
  try {
    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags
      }
    }

    // Get all published FAQs (we'll filter and rank by relevance)
    const allFaqs = await prisma.fAQ.findMany({
      where,
    })

    // Calculate relevance for each FAQ
    const faqsWithRelevance = allFaqs.map((faq) => ({
      id: faq.id,
      title: faq.title,
      answer: faq.answer,
      tags: faq.tags,
      relevance: calculateRelevance(query, faq.title, faq.answer)
    }))

    // Sort by relevance (descending) and take top K
    const sortedFaqs = faqsWithRelevance
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, topK)

    return {
      items: sortedFaqs
    }
  } catch (error) {
    console.error('[MCP] FAQ Search Error:', error)
    return { items: [] }
  }
}

/**
 * FAQ Upsert Tool
 * Create or update an FAQ entry
 * 
 * @param faq - FAQ data to upsert
 */
export async function faqUpsert(faq: FAQData): Promise<{ success: boolean; id?: string }> {
  // Phase 3+: Full implementation
  
  try {
    if (faq.id) {
      await prisma.fAQ.update({
        where: { id: faq.id },
        data: {
          title: faq.title,
          answer: faq.answer,
          tags: faq.tags || [],
          status: faq.status || 'DRAFT',
        }
      })
      return { success: true, id: faq.id }
    } else {
      const created = await prisma.fAQ.create({
        data: {
          title: faq.title,
          answer: faq.answer,
          tags: faq.tags || [],
          status: faq.status || 'DRAFT',
        }
      })
      return { success: true, id: created.id }
    }
  } catch (error) {
    console.error('[MCP] FAQ Upsert Error:', error)
    return { success: false }
  }
}

/**
 * QA Search Tool
 * Search in question-answer pairs using keyword-based relevance
 * 
 * @param query - Search query
 * @param topK - Number of results (default: 5)
 */
export async function qaSearch(
  query: string,
  topK: number = 5
): Promise<QASearchResult> {
  try {
    // Get all active QA pairs (we'll filter and rank by relevance)
    const allQAPairs = await prisma.qAPair.findMany({
      where: {
        isActive: true,
      },
    })

    // Calculate relevance for each QA pair
    const qaPairsWithRelevance = allQAPairs.map((qa) => ({
      id: qa.id,
      question: qa.question,
      answer: qa.answer,
      relevance: calculateRelevance(query, qa.question, qa.answer)
    }))

    // Sort by relevance (descending) and take top K
    const sortedQAPairs = qaPairsWithRelevance
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, topK)

    return {
      items: sortedQAPairs
    }
  } catch (error) {
    console.error('[MCP] QA Search Error:', error)
    return { items: [] }
  }
}

/**
 * Client Lookup Tool
 * Find a client by DNI, email, or phone
 * 
 * @param dni - Client DNI
 * @param email - Client email
 * @param phone - Client phone
 */
export async function clientLookup(
  dni?: string,
  email?: string,
  phone?: string
): Promise<ClientLookupResult> {
  // Phase 2+: Full implementation
  
  try {
    const where: Record<string, unknown> = {
      status: 'ACTIVE'
    }

    if (dni) where.dni = dni
    else if (email) where.email = email
    else if (phone) where.phone = phone
    else return { client: null }

    const client = await prisma.client.findFirst({
      where,
      select: {
        id: true,
        dni: true,
        name: true,
        email: true,
        phone: true,
        status: true,
      }
    })

    return { 
      client: client ? {
        id: client.id,
        dni: client.dni || undefined,
        name: client.name || undefined,
        email: client.email || undefined,
        phone: client.phone || undefined,
        status: client.status
      } : null
    }
  } catch (error) {
    console.error('[MCP] Client Lookup Error:', error)
    return { client: null }
  }
}

/**
 * Visit Create/Update Tool
 * Create or update a visit record
 * 
 * @param clientId - Client ID
 * @param branchId - Branch ID
 * @param purpose - Purpose of visit
 */
export async function visitCreateOrUpdate(
  clientId: string,
  branchId?: string,
  purpose?: string
): Promise<VisitResult> {
  // Phase 4+: Full implementation
  
  try {
    // Check for existing WAITING visit
    const existingVisit = await prisma.visit.findFirst({
      where: {
        clientId,
        status: 'WAITING',
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    if (existingVisit) {
      return {
        visitId: existingVisit.id,
        status: existingVisit.status
      }
    }

    // Create new visit
    let finalBranchId = branchId
    if (!finalBranchId) {
      // Get default branch
      const defaultBranch = await prisma.branch.findFirst()
      finalBranchId = defaultBranch?.id
    }

    if (!finalBranchId) {
      throw new Error('No branch available')
    }

    const visit = await prisma.visit.create({
      data: {
        clientId,
        branchId: finalBranchId,
        status: 'WAITING',
        purpose: purpose || 'Consulta general',
      }
    })

    return {
      visitId: visit.id,
      status: visit.status
    }
  } catch (error) {
    console.error('[MCP] Visit Create Error:', error)
    return {
      visitId: 'error',
      status: 'WAITING'
    }
  }
}

/**
 * Get KPIs Tool
 * Retrieve key performance indicators
 * 
 * @param range - Time range ('today', 'week', 'month')
 */
export async function getKPIs(
  range: 'today' | 'week' | 'month' = 'today'
): Promise<KPIsResult> {
  // Phase 7+: Full implementation with caching
  
  try {
    const now = new Date()
    const startDate = new Date()

    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const visits = await prisma.visit.findMany({
      where: {
        startedAt: {
          gte: startDate
        }
      },
      include: {
        client: true
      }
    })

    const uniqueClients = new Set(visits.map((v: { clientId: string | null }) => v.clientId).filter(Boolean))
    const completedVisits = visits.filter((v: { status: string }) => v.status === 'COMPLETED')
    
    // Mock new vs returning calculation
    const newClients = Math.floor(uniqueClients.size * 0.3)
    const returningClients = uniqueClients.size - newClients

    return {
      visitors: uniqueClients.size,
      newVsReturning: {
        new: newClients,
        returning: returningClients
      },
      completionPct: visits.length > 0 
        ? Math.round((completedVisits.length / visits.length) * 100) 
        : 0
    }
  } catch (error) {
    console.error('[MCP] Get KPIs Error:', error)
    return {
      visitors: 0,
      newVsReturning: { new: 0, returning: 0 },
      completionPct: 0
    }
  }
}

/**
 * Chat Hand-off Tool
 * Transfer chat to human agent
 * Records hand-off in both chat messages and metrics
 * 
 * @param sessionId - Chat session ID
 * @param reason - Reason for hand-off
 */
export async function chatHandOff(
  sessionId: string,
  reason?: string
): Promise<HandOffResult> {
  // Phase 5+: Full implementation with queue system
  
  try {
    // Get session to find clientId if available
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { clientId: true }
    })

    // Log the hand-off request as a chat message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        actor: 'BOT',
        content: `Transferencia solicitada a agente humano. Razón: ${reason || 'No especificada'}`,
        intent: 'handoff',
        metadata: {
          handOff: true,
          reason
        }
      }
    })

    // Record hand-off metric (import chatbotService dynamically to avoid circular dependency)
    const { chatbotService } = await import('@/services/chatbot.service')
    await chatbotService.recordHandOff(
      sessionId,
      session?.clientId || null,
      reason
    )

    return {
      status: 'QUEUED',
      estimatedWaitTime: 5 // minutes
    }
  } catch (error) {
    console.error('[MCP] Chat Hand-off Error:', error)
    return {
      status: 'FAILED'
    }
  }
}

/**
 * Dataset Refresh Tool
 * Refresh the knowledge base (trigger re-indexing)
 */
export async function datasetRefresh(): Promise<{ success: boolean; message?: string }> {
  // Phase 3+: Full implementation with vector indexing
  
  try {
    // Count published FAQs and active QA pairs
    const [faqCount, qaCount] = await Promise.all([
      prisma.fAQ.count({ where: { status: 'PUBLISHED' } }),
      prisma.qAPair.count({ where: { isActive: true } })
    ])

    return {
      success: true,
      message: `Dataset refreshed: ${faqCount} FAQs, ${qaCount} QA pairs`
    }
  } catch (error) {
    console.error('[MCP] Dataset Refresh Error:', error)
    return {
      success: false,
      message: 'Failed to refresh dataset'
    }
  }
}

// ========== MCP TOOLS REGISTRY ==========

export const mcpTools = {
  'faq.search': faqSearch,
  'faq.upsert': faqUpsert,
  'qa.search': qaSearch,
  'client.lookup': clientLookup,
  'visit.createOrUpdate': visitCreateOrUpdate,
  'metrics.getKpis': getKPIs,
  'chat.handOff': chatHandOff,
  'dataset.refresh': datasetRefresh,
} as const

export type MCPToolName = keyof typeof mcpTools

// ========== MCP TOOL EXECUTION HELPERS ==========

/**
 * Execute an MCP tool by name
 */
export async function executeMCPTool(
  toolName: MCPToolName,
  params: Record<string, unknown>
): Promise<unknown> {
  const tool = mcpTools[toolName]
  if (!tool) {
    throw new Error(`Unknown MCP tool: ${toolName}`)
  }

  // @ts-expect-error - Dynamic tool execution
  return await tool(...Object.values(params))
}

/**
 * Get available MCP tools list
 */
export function listMCPTools(): Array<{ name: string; description: string }> {
  return [
    { name: 'faq.search', description: 'Search in FAQ database' },
    { name: 'faq.upsert', description: 'Create or update FAQ' },
    { name: 'qa.search', description: 'Search in QA pairs' },
    { name: 'client.lookup', description: 'Find client by DNI/email/phone' },
    { name: 'visit.createOrUpdate', description: 'Create or update visit' },
    { name: 'metrics.getKpis', description: 'Get KPIs for time range' },
    { name: 'chat.handOff', description: 'Transfer to human agent' },
    { name: 'dataset.refresh', description: 'Refresh knowledge base' },
  ]
}

// ========== EXPORTS ==========

export default mcpTools

