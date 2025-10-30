"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, User, UserPlus, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

type DetectionStatus = 'idle' | 'detecting' | 'recognized' | 'unknown' | 'error'

interface DetectionResult {
  clientId?: string
  clientName?: string
  confidence?: number
  status: DetectionStatus
  message: string
}

/**
 * Página principal del kiosco
 * - Detección facial automática
 * - Reconocimiento de clientes existentes
 * - Opciones de registro para nuevos clientes
 */
export default function KioskHomePage() {
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>('idle')
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasCamera, setHasCamera] = useState(true)
  const [showPrivacyMore, setShowPrivacyMore] = useState(false)

  // Simular detección facial (en producción, esto se conectaría a la API real)
  const startFacialDetection = async () => {
    setIsScanning(true)
    setDetectionStatus('detecting')
    setDetectionResult(null)

    try {
      // Intentar acceder a la cámara
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        })
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Capturar imagen del video
      await new Promise(resolve => setTimeout(resolve, 1000)) // Esperar 1 segundo para que la cámara estabilice
      
      let imageData = ''
      if (videoRef.current) {
        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0)
          imageData = canvas.toDataURL('image/jpeg', 0.8)
        }
      }

      // API de detección facial deshabilitada temporalmente
      // TODO: Re-enable when facial recognition service is available
      throw new Error('Detección facial temporalmente deshabilitada. Por favor, use el registro manual.')
    } catch (error) {
      console.error('Error en detección facial:', error)
      setDetectionStatus('error')
      setDetectionResult({
        status: 'error',
        message: 'No se pudo acceder a la cámara. Por favor, use el registro manual.'
      })
      setHasCamera(false)
    } finally {
      setIsScanning(false)
      
      // Detener stream de video
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }

  const resetDetection = () => {
    setDetectionStatus('idle')
    setDetectionResult(null)
    setIsScanning(false)
  }

  return (
    <div className="container mx-auto px-6 max-w-6xl">
      <div className="space-y-8">
        {/* Bienvenida */}
        <div className="text-center space-y-3">
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema de identificación automática. Por favor, posiciónate frente a la cámara 
            o selecciona una opción para continuar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Panel de detección facial */}
          <Card className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Identificación Facial
              </h2>
              <p className="text-gray-600">
                Reconocimiento automático para clientes registrados
              </p>
            </div>

            {/* Video preview (oculto durante detección) */}
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {detectionStatus === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white space-y-2">
                    <Camera className="w-12 h-12 mx-auto opacity-50" />
                    <p className="text-sm">Presiona el botón para iniciar</p>
                  </div>
                </div>
              )}
              
              {detectionStatus === 'detecting' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white space-y-3">
                    <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-lg font-medium">Detectando rostro...</p>
                    <p className="text-sm opacity-75">Por favor, mantén tu rostro frente a la cámara</p>
                  </div>
                </div>
              )}

              {detectionStatus === 'recognized' && detectionResult && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-600">
                  <div className="text-center text-white space-y-3 p-6">
                    <CheckCircle2 className="w-16 h-16 mx-auto" />
                    <p className="text-2xl font-bold">¡Bienvenido de vuelta!</p>
                    <p className="text-xl">{detectionResult.clientName}</p>
                    <p className="text-sm opacity-90">
                      Confianza: {Math.round((detectionResult.confidence || 0) * 100)}%
                    </p>
                  </div>
                </div>
              )}

              {detectionStatus === 'unknown' && (
                <div className="absolute inset-0 flex items-center justify-center bg-orange-500">
                  <div className="text-center text-white space-y-3 p-6">
                    <AlertCircle className="w-16 h-16 mx-auto" />
                    <p className="text-xl font-medium">No te reconocemos aún</p>
                    <p className="text-sm">Por favor, regístrate para usar este servicio</p>
                  </div>
                </div>
              )}

              {detectionStatus === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500">
                  <div className="text-center text-white space-y-3 p-6">
                    <AlertCircle className="w-16 h-16 mx-auto" />
                    <p className="text-xl font-medium">Error de conexión</p>
                    <p className="text-sm">{detectionResult?.message}</p>
                  </div>
                </div>
              )}

              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ display: isScanning ? 'block' : 'none' }}
                autoPlay
                playsInline
                muted
              />
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              {(detectionStatus === 'idle' || detectionStatus === 'error') && (
                <Button
                  onClick={startFacialDetection}
                  disabled={isScanning || !hasCamera}
                  className="w-full h-14 text-lg"
                  size="lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Iniciar Reconocimiento Facial
                </Button>
              )}

              {detectionStatus === 'recognized' && detectionResult && (
                <Link href="/kiosk/welcome?clientId=3" className="block">
                  <Button className="w-full h-14 text-lg" size="lg">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Continuar
                  </Button>
                </Link>
              )}

              {(detectionStatus === 'unknown' || detectionStatus === 'detecting' || detectionStatus === 'recognized') && (
                <Button
                  onClick={resetDetection}
                  variant="outline"
                  className="w-full h-12"
                  size="lg"
                >
                  Intentar de Nuevo
                </Button>
              )}
            </div>

            {/* Cuando no se usa reconocimiento, ofrecer opción de preguntas en el panel izquierdo */}
            {detectionStatus === 'idle' && (
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Solo Tengo Preguntas</h3>
                  <p className="text-gray-600">Obtén respuestas rápidas o inicia un chat</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Link href="/kiosk/chat" className="block">
                    <Button className="w-full h-12" variant="outline">Ver Preguntas Frecuentes</Button>
                  </Link>
                  <Link href="/kiosk/chat" className="block">
                    <Button className="w-full h-12" variant="secondary">Iniciar Chat</Button>
                  </Link>
                </div>
              </Card>
            )}
          </Card>

          {/* Opciones manuales */}
          <div className="space-y-6">
            <Card className="p-8 space-y-4 hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/kiosk/register" className="block space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center">
                  Soy Nuevo Cliente
                </h3>
                <p className="text-gray-600 text-center">
                  Regístrate en nuestro sistema para disfrutar de atención rápida y personalizada
                </p>
                <Button className="w-full h-12" variant="default">
                  Comenzar Registro
                </Button>
              </Link>
            </Card>

            <Card className="p-8 space-y-4 hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/kiosk/login" className="block space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center">
                  Ya Tengo Cuenta
                </h3>
                <p className="text-gray-600 text-center">
                  Inicia sesión con tu DNI y contraseña para acceder a nuestros servicios
                </p>
                <Button className="w-full h-12" variant="outline">
                  Iniciar Sesión
                </Button>
              </Link>
            </Card>

            {detectionStatus !== 'idle' && (
              <Card className="p-8 space-y-4 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50">
                <Link href="/kiosk/chat" className="block space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center">
                    Solo Tengo Preguntas
                  </h3>
                  <p className="text-gray-600 text-center">
                    Chatea con nuestro asistente virtual sin necesidad de registrarte
                  </p>
                  <Button className="w-full h-12" variant="secondary">
                    Iniciar Chat
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </div>

        {/* Acceso discreto a Privacidad */}
        <div className="text-right">
          <a href="#privacidad" className="text-xs text-gray-500 underline">Privacidad</a>
        </div>

        {/* Información adicional */}
        <Card id="privacidad" className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-semibold text-gray-900">Información de Privacidad</h4>
              {!showPrivacyMore ? (
                <div className="text-sm text-gray-700">
                  <p className="truncate">
                    Tu imagen facial se utiliza únicamente para identificación y se almacena de forma segura según las normativas vigentes.
                  </p>
                  <button
                    type="button"
                    className="text-xs text-blue-600 underline mt-1"
                    onClick={() => setShowPrivacyMore(true)}
                  >
                    Ver más
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    Tu imagen facial se utiliza únicamente para identificación y se almacena de forma segura según las normativas de protección de datos.
                  </p>
                  <p>
                    Puedes desactivar esta función en cualquier momento desde tu perfil.
                  </p>
                  <button
                    type="button"
                    className="text-xs text-blue-600 underline"
                    onClick={() => setShowPrivacyMore(false)}
                  >
                    Ver menos
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

