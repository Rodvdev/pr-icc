"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ClientLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthError("")

    try {
      const result = await signIn("client-credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/client",
      })

      if (result?.error) {
        setAuthError("Credenciales inválidas. Verifica tu email y contraseña.")
      } else if (result?.ok) {
        router.push("/client")
        router.refresh()
      }
    } catch {
      setAuthError("Error al iniciar sesión. Por favor intenta de nuevo.")
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
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

