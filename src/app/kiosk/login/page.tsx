"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, User, Lock, AlertCircle } from "lucide-react"
import Link from "next/link"

/**
 * Página de login manual para clientes que ya tienen cuenta
 */
export default function KioskLoginPage() {
  const router = useRouter()
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    const newErrors: Record<string, string> = {}
    if (!dni.trim()) newErrors.dni = 'El DNI es obligatorio'
    else if (!/^\d{8}$/.test(dni)) newErrors.dni = 'El DNI debe tener 8 dígitos'
    if (!password) newErrors.password = 'La contraseña es obligatoria'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, password })
      })

      const data = await response.json()

      if (response.ok) {
        // Redirigir a la página de bienvenida con el clientId
        router.push(`/kiosk/welcome?clientId=${data.client.id}`)
      } else {
        setErrors({ submit: data.message || 'Credenciales inválidas' })
      }
    } catch {
      setErrors({ submit: 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-6 max-w-md">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/kiosk">
            <Button variant="ghost" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </Button>
          </Link>
        </div>

        {/* Login card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h1>
              <p className="text-gray-600">Ingresa tus credenciales para continuar</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    id="dni"
                    placeholder="12345678"
                    value={dni}
                    onChange={(e) => {
                      setDni(e.target.value.replace(/\D/g, '').slice(0, 8))
                      if (errors.dni) setErrors(prev => ({ ...prev, dni: '' }))
                    }}
                    className={`pl-10 h-12 text-lg ${errors.dni ? 'border-red-500' : ''}`}
                    maxLength={8}
                    autoFocus
                  />
                </div>
                {errors.dni && <p className="text-sm text-red-500">{errors.dni}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                    }}
                    className={`pl-10 h-12 text-lg ${errors.password ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              {errors.submit && (
                <Card className="p-4 bg-red-50 border-red-200">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{errors.submit}</p>
                  </div>
                </Card>
              )}
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
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            <div className="text-center space-y-3">
              <Link href="/kiosk/reset-password" className="text-sm text-blue-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">o</span>
                </div>
              </div>

              <Link href="/kiosk/register">
                <Button variant="outline" className="w-full h-12" type="button">
                  Crear Nueva Cuenta
                </Button>
              </Link>
            </div>
          </form>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">Primera vez aquí?</p>
              <p>Si aún no tienes una cuenta, puedes registrarte fácilmente usando el botón de arriba.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

