"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

/**
 * Página de recuperación de contraseña
 */
export default function KioskResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('El email es obligatorio')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await fetch('/api/auth/client/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      // Siempre mostrar éxito por seguridad (no revelar si el email existe)
      setIsSubmitted(true)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-6 max-w-md">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/kiosk/login">
              <Button variant="ghost" size="lg">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </Button>
            </Link>
          </div>

          <Card className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">¡Correo Enviado!</h1>
              <p className="text-gray-600">
                Si existe una cuenta con el email <strong>{email}</strong>, 
                recibirás instrucciones para restablecer tu contraseña.
              </p>
            </div>

            <Card className="p-4 bg-blue-50 border-blue-200 text-left">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-medium">Revisa tu bandeja de entrada</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>El correo puede tardar unos minutos en llegar</li>
                    <li>Revisa tu carpeta de spam si no lo ves</li>
                    <li>El enlace expira en 1 hora</li>
                  </ul>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Link href="/kiosk/login">
                <Button className="w-full h-12" size="lg">
                  Volver al Inicio de Sesión
                </Button>
              </Link>
              
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail('')
                }}
              >
                Enviar a Otro Email
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 max-w-md">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/kiosk/login">
            <Button variant="ghost" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </Button>
          </Link>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Recuperar Contraseña</h1>
              <p className="text-gray-600">
                Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    className={`pl-10 h-12 text-lg ${error ? 'border-red-500' : ''}`}
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Instrucciones'
                )}
              </Button>
            </div>

            <div className="text-center">
              <Link href="/kiosk/login" className="text-sm text-blue-600 hover:underline">
                ¿Recordaste tu contraseña? Inicia sesión
              </Link>
            </div>
          </form>
        </Card>

        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">¿No tienes acceso a tu email?</p>
              <p className="text-xs">
                Si no puedes acceder a tu email registrado, por favor contacta con 
                un administrador en el mostrador de atención al cliente.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

