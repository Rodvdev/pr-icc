"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, User, Lock, AlertCircle, Eye, EyeOff, Mail, Phone, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"

type Step = 1 | 2

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dni: "",
    password: "",
    confirmPassword: "",
  })

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    phone?: string
    dni?: string
    password?: string
    confirmPassword?: string
  }>({})

  const progress = (currentStep / 2) * 100

  // Validation functions
  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setFieldErrors(prev => ({ ...prev, name: "El nombre es requerido" }))
      return false
    }
    if (name.trim().length < 2) {
      setFieldErrors(prev => ({ ...prev, name: "El nombre debe tener al menos 2 caracteres" }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, name: undefined }))
    return true
  }

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: "El email es requerido" }))
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: "Formato de email inválido" }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, email: undefined }))
    return true
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) {
      setFieldErrors(prev => ({ ...prev, phone: "El teléfono es requerido" }))
      return false
    }
    const phoneRegex = /^(\+51\s?)?9\d{8}$/
    const cleanedPhone = phone.replace(/\s/g, '')
    if (!phoneRegex.test(cleanedPhone)) {
      setFieldErrors(prev => ({ ...prev, phone: "Formato de teléfono inválido (debe ser un número peruano de 9 dígitos)" }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, phone: undefined }))
    return true
  }

  const validateDNI = (dni: string): boolean => {
    if (!dni.trim()) {
      setFieldErrors(prev => ({ ...prev, dni: "El DNI es requerido" }))
      return false
    }
    const dniRegex = /^\d{8}$/
    if (!dniRegex.test(dni)) {
      setFieldErrors(prev => ({ ...prev, dni: "El DNI debe tener 8 dígitos" }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, dni: undefined }))
    return true
  }

  const validatePassword = (password: string): boolean => {
    if (!password.trim()) {
      setFieldErrors(prev => ({ ...prev, password: "La contraseña es requerida" }))
      return false
    }
    if (password.length < 8) {
      setFieldErrors(prev => ({ ...prev, password: "La contraseña debe tener al menos 8 caracteres" }))
      return false
    }
    if (!/[A-Z]/.test(password)) {
      setFieldErrors(prev => ({ ...prev, password: "La contraseña debe contener al menos una letra mayúscula" }))
      return false
    }
    if (!/[a-z]/.test(password)) {
      setFieldErrors(prev => ({ ...prev, password: "La contraseña debe contener al menos una letra minúscula" }))
      return false
    }
    if (!/\d/.test(password)) {
      setFieldErrors(prev => ({ ...prev, password: "La contraseña debe contener al menos un número" }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, password: undefined }))
    return true
  }

  const validateConfirmPassword = (confirmPassword: string, password: string): boolean => {
    if (!confirmPassword.trim()) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Confirma tu contraseña" }))
      return false
    }
    if (confirmPassword !== password) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Las contraseñas no coinciden" }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }))
    return true
  }

  const nextStep = () => {
    // Validate step 1 fields
    const isNameValid = validateName(formData.name)
    const isEmailValid = validateEmail(formData.email)
    const isPhoneValid = validatePhone(formData.phone)
    const isDniValid = validateDNI(formData.dni)

    if (isNameValid && isEmailValid && isPhoneValid && isDniValid) {
      setCurrentStep(2)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(1)
    }
  }

  const handleSubmit = async () => {
    setError("")
    setFieldErrors({})

    // Validate all fields
    const isNameValid = validateName(formData.name)
    const isEmailValid = validateEmail(formData.email)
    const isPhoneValid = validatePhone(formData.phone)
    const isDniValid = validateDNI(formData.dni)
    const isPasswordValid = validatePassword(formData.password)
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword, formData.password)

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isDniValid || !isPasswordValid || !isConfirmPasswordValid) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          dni: formData.dni.trim(),
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        // Handle API errors
        if (data.error) {
          if (Array.isArray(data.error)) {
            setError(data.error.join(", "))
          } else if (typeof data.error === 'string') {
            setError(data.error)
          } else if (data.details && Array.isArray(data.details)) {
            setError(data.details.join(", "))
          } else {
            setError(data.error || "Error al registrar. Por favor intente nuevamente.")
          }
        } else {
          setError("Error al registrar. Por favor intente nuevamente.")
        }
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("Error de conexión. Por favor verifica tu conexión e intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md w-full space-y-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">¡Registro Exitoso!</CardTitle>
              <CardDescription>
                Tu cuenta ha sido creada exitosamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Ya puedes iniciar sesión con tus credenciales. Tu cuenta está activa y lista para usar.
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
            Paso {currentStep} de 2
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
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
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Nombre Completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      setFieldErrors(prev => ({ ...prev, name: undefined }))
                    }}
                    onBlur={() => validateName(formData.name)}
                    placeholder="Juan Pérez García"
                    required
                    className={fieldErrors.name ? "border-red-500" : ""}
                    aria-invalid={!!fieldErrors.name}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dni" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      DNI *
                    </Label>
                    <Input
                      id="dni"
                      value={formData.dni}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        setFormData({ ...formData, dni: value })
                        setFieldErrors(prev => ({ ...prev, dni: undefined }))
                      }}
                      onBlur={() => validateDNI(formData.dni)}
                      placeholder="12345678"
                      maxLength={8}
                      required
                      className={fieldErrors.dni ? "border-red-500" : ""}
                      aria-invalid={!!fieldErrors.dni}
                    />
                    {fieldErrors.dni && (
                      <p className="text-sm text-red-600">{fieldErrors.dni}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      Correo Electrónico *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value })
                        setFieldErrors(prev => ({ ...prev, email: undefined }))
                      }}
                      onBlur={() => validateEmail(formData.email)}
                      placeholder="juan.perez@email.com"
                      required
                      className={fieldErrors.email ? "border-red-500" : ""}
                      aria-invalid={!!fieldErrors.email}
                    />
                    {fieldErrors.email && (
                      <p className="text-sm text-red-600">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Teléfono *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      setFieldErrors(prev => ({ ...prev, phone: undefined }))
                    }}
                    onBlur={() => validatePhone(formData.phone)}
                    placeholder="+51 999 888 777"
                    required
                    className={fieldErrors.phone ? "border-red-500" : ""}
                    aria-invalid={!!fieldErrors.phone}
                  />
                  {fieldErrors.phone && (
                    <p className="text-sm text-red-600">{fieldErrors.phone}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Formato: +51 seguido de 9 dígitos (ej: +51 987654321)
                  </p>
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
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-400" />
                    Contraseña *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value })
                        setFieldErrors(prev => ({ ...prev, password: undefined }))
                        if (formData.confirmPassword) {
                          validateConfirmPassword(formData.confirmPassword, e.target.value)
                        }
                      }}
                      onBlur={() => validatePassword(formData.password)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className={fieldErrors.password ? "border-red-500 pr-10" : "pr-10"}
                      aria-invalid={!!fieldErrors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-sm text-red-600">{fieldErrors.password}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value })
                        setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }))
                      }}
                      onBlur={() => validateConfirmPassword(formData.confirmPassword, formData.password)}
                      placeholder="Repite tu contraseña"
                      required
                      className={fieldErrors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                      aria-invalid={!!fieldErrors.confirmPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
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

            {currentStep < 2 ? (
              <Button
                onClick={nextStep}
                disabled={
                  !formData.name || !formData.email || !formData.dni || !formData.phone
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
