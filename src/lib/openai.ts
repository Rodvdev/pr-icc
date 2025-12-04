/**
 * OpenAI Service
 * 
 * Service for interacting with OpenAI API using gpt-3.5-turbo model.
 * Handles chat completions, error handling, and rate limiting.
 */

import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Model configuration
const MODEL = 'gpt-3.5-turbo'
const DEFAULT_TEMPERATURE = 0.7
const MAX_TOKENS = 1000
const DEFAULT_MAX_TOKENS = 500

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatCompletionResult {
  response: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  finishReason?: string
}

/**
 * Check if OpenAI API key is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0
}

/**
 * Generate chat completion using OpenAI
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResult> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.')
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      stream: options.stream ?? false,
    })

    // Handle stream responses
    if (options.stream) {
      // For streaming, we'd need to handle the stream differently
      // For now, throw an error as streaming is not fully implemented
      throw new Error('Streaming responses are not yet supported')
    }

    // Type guard: ensure we have a ChatCompletion, not a Stream
    if (!('choices' in completion)) {
      throw new Error('Unexpected response type from OpenAI')
    }

    const choice = completion.choices[0]
    if (!choice || !choice.message) {
      throw new Error('No response from OpenAI')
    }

    return {
      response: choice.message.content || '',
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : undefined,
      model: completion.model,
      finishReason: choice.finish_reason || undefined,
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      // Handle API errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key')
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.')
      } else if (error.status === 500) {
        throw new Error('OpenAI API server error. Please try again later.')
      }
      throw new Error(`OpenAI API error: ${error.message}`)
    }
    
    // Handle other errors
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Unknown error occurred while calling OpenAI API')
  }
}

/**
 * Estimate cost for a chat completion (in USD)
 * Pricing for gpt-3.5-turbo as of 2024:
 * - Input: $0.50 per 1M tokens
 * - Output: $1.50 per 1M tokens
 */
export function estimateCost(usage: { promptTokens: number; completionTokens: number }): number {
  const INPUT_COST_PER_MILLION = 0.50
  const OUTPUT_COST_PER_MILLION = 1.50
  
  const inputCost = (usage.promptTokens / 1_000_000) * INPUT_COST_PER_MILLION
  const outputCost = (usage.completionTokens / 1_000_000) * OUTPUT_COST_PER_MILLION
  
  return inputCost + outputCost
}

/**
 * Format tokens for display
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`
  }
  return `${(tokens / 1000).toFixed(2)}K tokens`
}

