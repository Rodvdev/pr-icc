"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Building2, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function ClientLoginPage() {
  const [identifier, setIdentifier] = useState("") // Email or DNI
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{identifier?: string; password?: string}>({})
  const router = useRouter()

  // Validate identifier (email or DNI)
  const validateIdentifier = (value: string): boolean => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, identifier: "Email o DNI es requerido" }))
      return false
    }

    // Check if it's an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isEmail = emailRegex.test(value)

    // Check if it's a DNI (8 digits)
    const dniRegex = /^\d{8}$/
    const isDni = dniRegex.test(value)

    if (!isEmail && !isDni) {
      setFieldErrors(prev => ({ ...prev, identifier: "Debe ser un email válido o DNI de 8 dígitos" }))
      return false
    }

    setFieldErrors(prev => ({ ...prev, identifier: undefined }))
    return true
  }

  const validatePassword = (value: string): boolean => {
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, password: "La contraseña es requerida" }))
      return false
    }
    if (value.length < 8) {
      setFieldErrors(prev => ({ ...prev, password: "La contraseña debe tener al menos 8 caracteres" }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, password: undefined }))
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    setFieldErrors({})

    // Validate inputs
    const isIdentifierValid = validateIdentifier(identifier)
    const isPasswordValid = validatePassword(password)

    if (!isIdentifierValid || !isPasswordValid) {
      return
    }

    setIsLoading(true)

    try {
      // Determine if identifier is email or DNI
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const isEmail = emailRegex.test(identifier)

      const result = await signIn("client-credentials", {
        email: isEmail ? identifier : undefined,
        dni: !isEmail ? identifier : undefined,
        password,
        redirect: false,
        callbackUrl: "/client",
      })

      if (result?.error) {
        // Handle different error types
        if (result.error === "CredentialsSignin") {
          setAuthError("Credenciales inválidas. Verifica tu información e intenta de nuevo.")
        } else if (result.error.includes("rate")) {
          setAuthError("Demasiados intentos. Por favor espera unos minutos antes de intentar de nuevo.")
        } else {
          setAuthError("Error al iniciar sesión. Por favor intenta de nuevo.")
        }
      } else if (result?.ok) {
        router.push("/client")
        router.refresh()
      }
    } catch (error) {
      console.error("Login error:", error)
      setAuthError("Error de conexión. Por favor verifica tu conexión e intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Portal de Clientes
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accede a tu cuenta para ver tu información y servicios
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales de cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {authError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="identifier" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  Email o DNI
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    setFieldErrors(prev => ({ ...prev, identifier: undefined }))
                  }}
                  onBlur={() => validateIdentifier(identifier)}
                  placeholder="tu@email.com o 12345678"
                  required
                  disabled={isLoading}
                  className={fieldErrors.identifier ? "border-red-500" : ""}
                  aria-invalid={!!fieldErrors.identifier}
                  aria-describedby={fieldErrors.identifier ? "identifier-error" : undefined}
                />
                {fieldErrors.identifier && (
                  <p className="text-sm text-red-600" id="identifier-error">
                    {fieldErrors.identifier}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-400" />
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setFieldErrors(prev => ({ ...prev, password: undefined }))
                    }}
                    onBlur={() => validatePassword(password)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className={fieldErrors.password ? "border-red-500 pr-10" : "pr-10"}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-red-600" id="password-error">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    ¿No tienes cuenta?
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href="/register">
                  Registrarse como Cliente
                </Link>
              </Button>

              <div className="text-center">
                <Link 
                  href="/auth/signin" 
                  className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  ¿Eres administrador o agente?
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credenciales de prueba */}
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-900">
                <AlertCircle className="h-4 w-4" />
                <h3 className="font-semibold text-sm">Credenciales de Prueba - Clientes</h3>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="bg-white/60 rounded p-3 space-y-1">
                  <p className="font-semibold text-indigo-900">Cliente 1 - Sharon Aiquipa:</p>
                  <p className="font-mono text-gray-700">Email: sharon.aiquipa@utec.edu.pe</p>
                  <p className="font-mono text-gray-700">Contraseña: client123</p>
                </div>
                
                <div className="bg-white/60 rounded p-3 space-y-1">
                  <p className="font-semibold text-indigo-900">Cliente 2 - Carlos Izaguirre:</p>
                  <p className="font-mono text-gray-700">Email: carlos.izaguirre@utec.edu.pe</p>
                  <p className="font-mono text-gray-700">Contraseña: client123</p>
                </div>

                <div className="bg-white/60 rounded p-3 space-y-1">
                  <p className="font-semibold text-indigo-900">Cliente 3 - Rodrigo Vasquez:</p>
                  <p className="font-mono text-gray-700">Email: rodrigo.vasquezdevel@utec.edu.pe</p>
                  <p className="font-mono text-gray-700">Contraseña: client123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

