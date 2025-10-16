"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, User, Lock, FileText, Camera } from "lucide-react"
import { useRouter } from "next/navigation"

type Step = 1 | 2 | 3 | 4

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    name: "",
    email: "",
    phone: "",
    dni: "",
    dateOfBirth: "",
    address: "",
    
    // Step 2: Account
    password: "",
    confirmPassword: "",
    
    // Step 3: Documents (for future implementation)
    documentFront: null as File | null,
    documentBack: null as File | null,
    
    // Step 4: Photo (for future implementation)
    photo: null as File | null,
  })

  const progress = (currentStep / 4) * 100

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const handleSubmit = async () => {
    setError("")
    setLoading(true)

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden")
        setLoading(false)
        return
      }

      // Create registration request
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          dni: formData.dni,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Error al registrar. Por favor intente nuevamente.")
      }
    } catch {
      setError("Error de conexión. Por favor intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">¡Registro Exitoso!</CardTitle>
            <CardDescription>
              Tu solicitud ha sido enviada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Tu registro está pendiente de aprobación. Recibirás un correo electrónico 
                cuando tu cuenta sea activada. Este proceso puede tomar 24-48 horas.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push("/client/login")}
              className="w-full"
            >
              Ir a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Registro de Cliente</CardTitle>
          <CardDescription>
            Sistema de Identificación Bancaria - Completa tu registro
          </CardDescription>
          <Progress value={progress} className="mt-4" />
          <p className="text-sm text-gray-500 mt-2">
            Paso {currentStep} de 4
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Información Personal</h3>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Juan Pérez García"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dni">DNI *</Label>
                    <Input
                      id="dni"
                      value={formData.dni}
                      onChange={(e) =>
                        setFormData({ ...formData, dni: e.target.value })
                      }
                      placeholder="12345678"
                      maxLength={8}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfBirth: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="juan.perez@email.com"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+51 999 888 777"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Av. Principal 123, Lima"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Account Security */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Seguridad de Cuenta</h3>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Usa al menos 8 caracteres con letras y números
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="Repite tu contraseña"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents (Placeholder) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Documentos (Opcional)</h3>
              </div>

              <Alert>
                <AlertDescription>
                  La carga de documentos estará disponible próximamente. 
                  Puedes continuar con el registro y enviar tus documentos más tarde.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 4: Photo (Placeholder) */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Fotografía (Opcional)</h3>
              </div>

              <Alert>
                <AlertDescription>
                  La captura de fotografía estará disponible próximamente.
                  Puedes completar el registro sin foto y agregarla más tarde.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Resumen de tu registro:</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Nombre:</dt>
                    <dd className="font-medium">{formData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">DNI:</dt>
                    <dd className="font-medium">{formData.dni}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Email:</dt>
                    <dd className="font-medium">{formData.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Teléfono:</dt>
                    <dd className="font-medium">{formData.phone}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
            >
              Anterior
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 &&
                    (!formData.name || !formData.email || !formData.dni || !formData.phone)) ||
                  (currentStep === 2 && (!formData.password || !formData.confirmPassword))
                }
              >
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Enviando..." : "Completar Registro"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

