import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyGenerator } = options

  return (req: NextRequest) => {
    const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req)
    const now = Date.now()
    
    const record = rateLimitMap.get(key)
    
    if (!record || now > record.resetTime) {
      // Reset or create new record
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return { success: true, remaining: maxRequests - 1 }
    }
    
    if (record.count >= maxRequests) {
      return { 
        success: false, 
        error: 'Rate limit exceeded',
        resetTime: record.resetTime
      }
    }
    
    record.count++
    return { success: true, remaining: maxRequests - record.count }
  }
}

function getDefaultKey(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for') || 
            req.headers.get('x-real-ip') || 
            'unknown'
  return `rate_limit:${ip}`
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate DNI format (Peruvian DNI)
export function isValidDNI(dni: string): boolean {
  const dniRegex = /^\d{8}$/
  return dniRegex.test(dni)
}

// Validate phone format (Peruvian phone)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+51\s?)?9\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// CSRF protection helper
export function validateCSRF(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  
  // In production, implement proper CSRF token validation
  // For now, just check origin/referer
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3005',
    'https://pr-icc.vercel.app'
  ]
  
  return !origin || allowedOrigins.some(allowed => origin.startsWith(allowed))
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  return response
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula')
  }
  
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// File upload validation
export function validateFileUpload(file: File): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  
  if (file.size > maxSize) {
    errors.push('El archivo es demasiado grande (máximo 5MB)')
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Tipo de archivo no permitido')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
