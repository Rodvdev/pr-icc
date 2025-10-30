"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

type RegistrationStep = 'personal' | 'security' | 'photo' | 'review' | 'success'

interface RegistrationData {
  // Datos personales
  name: string
  dni: string
  email: string
  phone: string
  // Seguridad
  password: string
  confirmPassword: string
  // Foto
  photoData?: string
}

/**
 * Flujo de registro guiado (wizard) para nuevos clientes
 * Pasos:
 * 1. Datos personales (nombre, DNI, email, teléfono)
 * 2. Seguridad (contraseña)
 * 3. Foto para reconocimiento facial
 * 4. Revisión de información
 * 5. Confirmación y estado de aprobación
 */
export default function KioskRegisterPage() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('personal')
  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    dni: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)

  const steps: Array<{ id: RegistrationStep; label: string; icon: typeof User }> = [
    { id: 'personal', label: 'Datos Personales', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'photo', label: 'Foto', icon: Camera },
    { id: 'review', label: 'Revisar', icon: CheckCircle2 },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const progress = currentStep === 'success' ? 100 : ((currentStepIndex + 1) / steps.length) * 100

  const updateField = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo al editar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 'personal':
        if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio'
        if (!formData.dni.trim()) newErrors.dni = 'El DNI es obligatorio'
        else if (!/^\d{8}$/.test(formData.dni)) newErrors.dni = 'El DNI debe tener 8 dígitos'
        if (!formData.email.trim()) newErrors.email = 'El email es obligatorio'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido'
        if (!formData.phone.trim()) newErrors.phone = 'El teléfono es obligatorio'
        else if (!/^\d{9}$/.test(formData.phone)) newErrors.phone = 'El teléfono debe tener 9 dígitos'
        break

      case 'security':
        if (!formData.password) newErrors.password = 'La contraseña es obligatoria'
        else if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres'
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden'
        }
        break

      case 'photo':
        if (!formData.photoData) newErrors.photoData = 'Por favor, captura tu foto'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep()) return

    const stepOrder: RegistrationStep[] = ['personal', 'security', 'photo', 'review', 'success']
    const nextIndex = stepOrder.indexOf(currentStep) + 1
    if (nextIndex < stepOrder.length) {
      setCurrentStep(stepOrder[nextIndex])
    }
  }

  const handleBack = () => {
    const stepOrder: RegistrationStep[] = ['personal', 'security', 'photo', 'review']
    const prevIndex = stepOrder.indexOf(currentStep) - 1
    if (prevIndex >= 0) {
      setCurrentStep(stepOrder[prevIndex])
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          dni: formData.dni,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          photoData: formData.photoData,
        })
      })

      if (response.ok) {
        setCurrentStep('success')
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || error.message || 'Error al registrar' })
      }
    } catch {
      setErrors({ submit: 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsCameraActive(true)
      }
    } catch {
      setErrors({ photoData: 'No se pudo acceder a la cámara' })
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  const capturePhoto = async () => {
    try {
      if (!videoRef.current) return
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No se pudo crear el contexto de imagen')
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      updateField('photoData', dataUrl)
      stopCamera()
    } catch {
      setErrors({ photoData: 'No se pudo capturar la foto' })
    }
  }

  return (
    <div className="container mx-auto px-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/kiosk">
            <Button variant="ghost" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Cliente</h1>
          <div className="w-32" /> {/* Spacer */}
        </div>

        {/* Progress bar */}
        {currentStep !== 'success' && (
          <Card className="p-6">
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = step.id === currentStep
                  const isCompleted = index < currentStepIndex

                  return (
                    <div
                      key={step.id}
                      className={`flex flex-col items-center space-y-2 flex-1 ${
                        isActive ? 'opacity-100' : 'opacity-50'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Step content */}
        <Card className="p-8">
          {currentStep === 'personal' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Datos Personales</h2>
                <p className="text-gray-600">Ingresa tu información básica</p>
              </div>

              <div className="grid gap-6 max-w-lg mx-auto">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      id="name"
                      placeholder="Ej: Juan Pérez García"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={`pl-10 h-12 text-lg ${errors.name ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni">DNI *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      id="dni"
                      placeholder="12345678"
                      value={formData.dni}
                      onChange={(e) => updateField('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className={`pl-10 h-12 text-lg ${errors.dni ? 'border-red-500' : ''}`}
                      maxLength={8}
                    />
                  </div>
                  {errors.dni && <p className="text-sm text-red-500">{errors.dni}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={`pl-10 h-12 text-lg ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      placeholder="987654321"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                      className={`pl-10 h-12 text-lg ${errors.phone ? 'border-red-500' : ''}`}
                      maxLength={9}
                    />
                  </div>
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'security' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Seguridad</h2>
                <p className="text-gray-600">Crea una contraseña segura para tu cuenta</p>
              </div>

              <div className="grid gap-6 max-w-lg mx-auto">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className={`pl-10 h-12 text-lg ${errors.password ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      className={`pl-10 h-12 text-lg ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                </div>

                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-medium">Consejos para una contraseña segura:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Usa al menos 6 caracteres</li>
                        <li>Combina letras, números y símbolos</li>
                        <li>No uses información personal obvia</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {currentStep === 'photo' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Foto para Reconocimiento</h2>
                <p className="text-gray-600">Captura tu foto para identificación automática</p>
              </div>

              <div className="max-w-lg mx-auto space-y-6">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                  {isCameraActive ? (
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                  ) : !formData.photoData ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center space-y-4">
                        <Camera className="w-16 h-16 mx-auto opacity-50" />
                        <p>Presiona "Activar Cámara" y luego "Capturar Foto"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-600">
                      <div className="text-center text-white space-y-3">
                        <CheckCircle2 className="w-16 h-16 mx-auto" />
                        <p className="text-xl font-medium">¡Foto capturada!</p>
                      </div>
                    </div>
                  )}
                </div>

                {!formData.photoData ? (
                  <div className="grid grid-cols-2 gap-3">
                    {!isCameraActive ? (
                      <Button onClick={startCamera} className="h-14 text-lg" size="lg">
                        Activar Cámara
                      </Button>
                    ) : (
                      <Button onClick={capturePhoto} className="h-14 text-lg" size="lg">
                        <Camera className="w-5 h-5 mr-2" />
                        Capturar Foto
                      </Button>
                    )}
                    {isCameraActive && (
                      <Button onClick={stopCamera} variant="outline" className="h-14" size="lg">
                        Cancelar
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        updateField('photoData', '')
                        startCamera()
                      }}
                      variant="outline"
                      className="h-12"
                    >
                      Tomar Nueva Foto
                    </Button>
                    <Button onClick={() => setCurrentStep('review')} className="h-12">
                      Continuar
                    </Button>
                  </div>
                )}

                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Consejos para una buena foto:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Mira directamente a la cámara</li>
                        <li>Asegúrate de tener buena iluminación</li>
                        <li>Evita usar lentes de sol o gorros</li>
                        <li>Mantén una expresión neutra</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Revisar Información</h2>
                <p className="text-gray-600">Verifica que todos los datos sean correctos</p>
              </div>

              <div className="max-w-lg mx-auto space-y-4">
                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Datos Personales</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">DNI:</span>
                      <span className="font-medium">{formData.dni}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Teléfono:</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Seguridad</h3>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Contraseña configurada</span>
                  </div>
                </Card>

                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Reconocimiento Facial</h3>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Foto capturada correctamente</span>
                  </div>
                </Card>

                {errors.submit && (
                  <Card className="p-4 bg-red-50 border-red-200">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">{errors.submit}</p>
                    </div>
                  </Card>
                )}

                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Tu registro será revisado por un administrador. Recibirás un correo 
                      cuando tu cuenta sea aprobada (generalmente en menos de 24 horas).
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {currentStep === 'success' && (
            <div className="text-center space-y-6 py-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-gray-900">¡Registro Exitoso!</h2>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  Tu solicitud de registro ha sido enviada correctamente.
                </p>
              </div>

              <Card className="max-w-md mx-auto p-6 bg-blue-50 border-blue-200 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">Próximos pasos:</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">1.</span>
                    <span>Recibirás un correo de confirmación en {formData.email}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">2.</span>
                    <span>Un administrador revisará tu solicitud (generalmente en 24 horas)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">3.</span>
                    <span>Te notificaremos cuando tu cuenta sea aprobada</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">4.</span>
                    <span>Podrás iniciar sesión y usar el reconocimiento facial</span>
                  </li>
                </ol>
              </Card>

              <div className="space-y-3 max-w-md mx-auto">
                <Link href="/kiosk">
                  <Button className="w-full h-14 text-lg" size="lg">
                    Volver al Inicio
                  </Button>
                </Link>
                <Link href="/kiosk/chat">
                  <Button variant="outline" className="w-full h-12">
                    Chatear con Asistente Virtual
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          {currentStep !== 'success' && (
            <div className="flex justify-between pt-6 border-t">
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                disabled={currentStep === 'personal'}
                className="w-32"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Atrás
              </Button>

              {currentStep !== 'review' ? (
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="w-32"
                >
                  Siguiente
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  disabled={isSubmitting}
                  className="w-40"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Credenciales de prueba */}
        {currentStep !== 'success' && (
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-semibold text-base">💡 ¿Solo quieres probar el sistema?</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-amber-800">Usa estas cuentas de prueba ya activadas:</p>
                <div className="bg-white/80 rounded-lg p-4 space-y-2 border border-amber-100">
                  <p className="font-mono text-gray-700">🆔 DNI: <span className="font-bold">72134682</span> / client123</p>
                  <p className="font-mono text-gray-700">🆔 DNI: <span className="font-bold">12345678</span> / client123</p>
                  <p className="font-mono text-gray-700">🆔 DNI: <span className="font-bold">70669690</span> / client123</p>
                </div>
                <Link href="/kiosk/login" className="block">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full mt-2"
                  >
                    Ir a Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

