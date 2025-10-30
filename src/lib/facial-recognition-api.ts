/**
 * Facial Recognition API Client
 * 
 * Client-side API client for consuming the external Python Facial Recognition API
 */

import axios, { AxiosInstance } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_FACIAL_API_URL || 'http://localhost:5001/api'

// Create axios instance
const facialAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// API Response Types
export interface FacialAPIIStatus {
  active: boolean
  encodings_loaded: boolean
  stream_url: string
  total_results: number
}

export interface FacialAPIResult {
  timestamp: string
  name: string
  confidence: number
  distance: number
  box?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface FacialAPIResultsResponse {
  results: FacialAPIResult[]
  total: number
}

export interface FacialAPIStats {
  total_detections: number
  recognized: Record<string, number>
  unknown_count: number
  last_detection?: string
}

export interface FacialAPIConfig {
  stream_url?: string
  threshold?: number
  encoding_model?: string
}

/**
 * Get current status of the face recognition system
 */
export const getFacialAPIStatus = async (): Promise<FacialAPIIStatus> => {
  try {
    const response = await facialAPI.get<FacialAPIIStatus>('/status')
    return response.data
  } catch (error) {
    console.error('Error fetching facial API status:', error)
    throw error
  }
}

/**
 * Start face recognition
 */
export const startFacialRecognition = async (): Promise<FacialAPIIStatus> => {
  try {
    const response = await facialAPI.post<FacialAPIIStatus>('/start')
    return response.data
  } catch (error) {
    console.error('Error starting facial recognition:', error)
    throw error
  }
}

/**
 * Stop face recognition
 */
export const stopFacialRecognition = async (): Promise<FacialAPIIStatus> => {
  try {
    const response = await facialAPI.post<FacialAPIIStatus>('/stop')
    return response.data
  } catch (error) {
    console.error('Error stopping facial recognition:', error)
    throw error
  }
}

/**
 * Get all detection results
 */
export const getFacialResults = async (): Promise<FacialAPIResultsResponse> => {
  try {
    const response = await facialAPI.get<FacialAPIResultsResponse>('/results')
    return response.data
  } catch (error) {
    console.error('Error fetching facial results:', error)
    throw error
  }
}

/**
 * Get the latest detection result
 */
export const getLatestFacialResult = async (): Promise<FacialAPIResult> => {
  try {
    const response = await facialAPI.get<FacialAPIResult>('/latest')
    return response.data
  } catch (error) {
    console.error('Error fetching latest facial result:', error)
    throw error
  }
}

/**
 * Get system statistics
 */
export const getFacialStats = async (): Promise<FacialAPIStats> => {
  try {
    const response = await facialAPI.get<FacialAPIStats>('/stats')
    return response.data
  } catch (error) {
    console.error('Error fetching facial stats:', error)
    throw error
  }
}

/**
 * Update system configuration
 */
export const updateFacialConfig = async (config: FacialAPIConfig): Promise<unknown> => {
  try {
    const response = await facialAPI.put('/config', config)
    return response.data
  } catch (error) {
    console.error('Error updating facial config:', error)
    throw error
  }
}

export default facialAPI

