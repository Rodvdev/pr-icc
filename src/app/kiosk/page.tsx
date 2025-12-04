"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, CheckCircle2, AlertCircle, Shield, UserPlus, KeyRound, HelpCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type DetectionStatus = 'idle' | 'detecting' | 'recognized' | 'unknown' | 'error'

interface DetectionResult {
  clientId?: string
  clientName?: string
  confidence?: number
  status: DetectionStatus
  message: string
}

interface FaceDetection {
  detection: {
    box: {
      x: number
      y: number
      width: number
      height: number
    }
    score: number
  }
  descriptor: Float32Array | number[]
}

interface FaceAPI {
  detectSingleFace: (input: HTMLImageElement, options: unknown) => {
    withFaceLandmarks: () => {
      withFaceDescriptor: () => Promise<FaceDetection | null>
    }
  }
  nets: {
    tinyFaceDetector: {
      load: (url: string) => Promise<void>
    }
    faceLandmark68Net: {
      load: (url: string) => Promise<void>
    }
    faceRecognitionNet: {
      load: (url: string) => Promise<void>
    }
  }
  TinyFaceDetectorOptions: new (options: { inputSize: number; scoreThreshold: number }) => unknown
}

declare global {
  interface Window {
    FaceAPI?: FaceAPI
    faceapi?: FaceAPI
    facapi?: FaceAPI
    __faceapi?: FaceAPI
  }
}

/**
 * Página principal del kiosco
 * - Detección facial automático mediante servidor
 * - Reconocimiento de clientes existentes
 * - Opciones de registro para nuevos clientes
 */
export default function KioskHomePage() {
  const router = useRouter()
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>('idle')
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [streamError, setStreamError] = useState(false)
  const [streamRetryCount, setStreamRetryCount] = useState(0)
  const [faceApiReady, setFaceApiReady] = useState(false)
  const detectionLoopRef = useRef<number | null>(null)
  const [lastDetection, setLastDetection] = useState<FaceDetection | null>(null)
  
  // URL del stream de la ESP32-CAM (usar NEXT_PUBLIC_ para que esté disponible en cliente)
  const ESP32_STREAM_URL = process.env.NEXT_PUBLIC_ESP32_STREAM_URL ?? 'http://192.168.122.116:81/stream'

  // Cargar face-api y modelos
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        // Cargar TensorFlow.js
        const tfScript = document.createElement('script')
        tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js'
        tfScript.async = true
        
        tfScript.onload = async () => {
          // Cargar face-api
          const faceApiScript = document.createElement('script')
          faceApiScript.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js'
          faceApiScript.async = true
          
          faceApiScript.onload = async () => {
            try {
              const globalFaceApi = window.FaceAPI || window.faceapi || window.facapi
              if (!globalFaceApi) {
                console.error('❌ face-api no se cargó correctamente')
                return
              }
              window.__faceapi = globalFaceApi
              
              // Cargar modelos
              const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'
              try {
                await globalFaceApi.nets.tinyFaceDetector.load(MODEL_URL)
                await globalFaceApi.nets.faceLandmark68Net.load(MODEL_URL)
                await globalFaceApi.nets.faceRecognitionNet.load(MODEL_URL)
                console.log('✅ face-api models cargados')
                setFaceApiReady(true)
              } catch (err) {
                console.error('❌ Error al cargar modelos:', err)
              }
            } catch (err) {
              console.error('❌ Error en face-api:', err)
            }
          }
          document.head.appendChild(faceApiScript)
        }
        document.head.appendChild(tfScript)
      } catch (err) {
        console.error('❌ Error al cargar face-api:', err)
      }
    }

    loadFaceApi()
  }, [])

  // Detection loop continuo
  useEffect(() => {
    if (!faceApiReady || !mediaRef.current || !overlayRef.current) return

    const doLoop = async () => {
      try {
        const img = mediaRef.current as HTMLImageElement
        if (!img || !img.src || img.naturalWidth === 0) {
          detectionLoopRef.current = requestAnimationFrame(doLoop)
          return
        }

        const FaceAPI = window.FaceAPI || window.faceapi || window.facapi
        if (!FaceAPI) {
          detectionLoopRef.current = requestAnimationFrame(doLoop)
          return
        }

        try {
          const detection = await FaceAPI.detectSingleFace(
            img,
            new FaceAPI.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.3
            })
          ).withFaceLandmarks().withFaceDescriptor()

          if (detection) {
            setLastDetection(detection)
          }

          // Dibujar en el canvas overlay
          const canvas = overlayRef.current
          if (!canvas) {
            detectionLoopRef.current = requestAnimationFrame(doLoop)
            return
          }

          const rect = img.getBoundingClientRect()
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          canvas.style.width = rect.width + 'px'
          canvas.style.height = rect.height + 'px'

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            detectionLoopRef.current = requestAnimationFrame(doLoop)
            return
          }

          // Limpiar
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          if (detection) {
            const { x, y, width, height } = detection.detection.box
            const score = Math.round(detection.detection.score * 100)

            // Dibujar caja verde
            ctx.strokeStyle = '#22c55e'
            ctx.lineWidth = 3
            ctx.strokeRect(x, y, width, height)

            // Dibujar score
            ctx.fillStyle = '#22c55e'
            ctx.font = 'bold 16px Arial'
            ctx.fillText(`Detectado ${score}%`, x, y - 10)
          }
        } catch {
          // Ignorar errores de detección silenciosamente
        }
      } catch (err) {
        console.error('Error en detection loop:', err)
      }

      detectionLoopRef.current = requestAnimationFrame(doLoop)
    }

    detectionLoopRef.current = requestAnimationFrame(doLoop)

    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current)
      }
    }
  }, [faceApiReady])
  
  const startFacialDetection = async () => {
    setIsScanning(true)
    setDetectionStatus('detecting')
    setDetectionResult(null)
    setStreamError(false)
    setStreamRetryCount(0)

    try {
      // Si hay una URL de stream de ESP32 y no hay error previo, intentar usarla
      if (ESP32_STREAM_URL && !streamError) {
        setIsScanning(true)
        setDetectionStatus('detecting')
        
        // Esperar a que la imagen cargue (con timeout)
        const loadTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout loading stream')), 5000)
        )
        
        const imageLoad = new Promise<void>((resolve) => {
          if (mediaRef.current && 'complete' in mediaRef.current) {
            const img = mediaRef.current as HTMLImageElement
            if (img.complete && img.naturalWidth > 0) {
              resolve()
            } else {
              img.onload = () => resolve()
              img.onerror = () => resolve() // Continuar aunque falle
            }
          } else {
            resolve()
          }
        })

        try {
          await Promise.race([imageLoad, loadTimeout])
        } catch {
          // Timeout o error, continuar de todas formas
        }

        // Esperar un poco más para que face-api detecte
        await new Promise(resolve => setTimeout(resolve, 2000))

        if (!lastDetection) {
          setDetectionStatus('error')
          setDetectionResult({
            status: 'error',
            message: 'No se detectó un rostro. Por favor, asegúrate de estar frente a la cámara.'
          })
          setIsScanning(false)
          return
        }

        // Enviar descriptor a la API para reconocimiento
        try {
          const response = await fetch('/api/kiosk/recognize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              descriptor: Array.from(lastDetection.descriptor)
            })
          })

          const data = await response.json()

          if (response.ok && data.ok && data.recognized && data.clientId) {
            setDetectionStatus('recognized')
            setDetectionResult({
              clientId: data.clientId,
              clientName: data.clientName || 'Cliente',
              confidence: data.confidence || 0.95,
              status: 'recognized',
              message: `¡Bienvenido, ${data.clientName || 'Cliente'}!`
            })
          } else {
            setDetectionStatus('unknown')
            setDetectionResult({
              status: 'unknown',
              message: 'No te reconocemos aún. Por favor, regístrate para usar este servicio.'
            })
          }
        } catch (err) {
          console.error('Error en reconocimiento:', err)
          setDetectionStatus('error')
          setDetectionResult({
            status: 'error',
            message: 'Error al comunicarse con el servidor. Por favor, intenta de nuevo.'
          })
        }
      } else {
        // Fallback: usar webcam local
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          if (mediaRef.current && 'srcObject' in mediaRef.current) {
            (mediaRef.current as HTMLVideoElement).srcObject = stream
          }
        } catch {
          setDetectionStatus('error')
          setDetectionResult({
            status: 'error',
            message: 'No se pudo acceder a la cámara. Por favor, use el registro manual.'
          })
        }
      }
    } catch {
      setDetectionStatus('error')
      setDetectionResult({
        status: 'error',
        message: 'No se pudo acceder a la cámara. Por favor, use el registro manual.'
      })
    } finally {
      setIsScanning(false)
    }
  }

  const resetDetection = () => {
    setDetectionStatus('idle')
    setDetectionResult(null)
    setIsScanning(false)
    setStreamError(false)
    setStreamRetryCount(0)
    // Resetear la imagen del stream si existe
    if (ESP32_STREAM_URL && mediaRef.current && 'src' in mediaRef.current) {
      (mediaRef.current as HTMLImageElement).src = ESP32_STREAM_URL
    }
  }

  const handleStartScan = () => {
    startFacialDetection()
  }

  const handleRegister = async () => {
    const name = window.prompt('Nombre para registrar (automático, 3 muestras):')
    if (!name) return
    try {
      setIsScanning(true)
      const resp = await fetch('/api/esp32/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, samples: 3 })
      })
      const data = await resp.json()
      if (resp.ok && data.ok) {
        alert('Registro completado: ' + (data.message ?? 'OK'))
      } else {
        console.error(data)
        alert('Registro falló: ' + (data.message ?? 'Error'))
      }
    } catch (err) {
      console.error(err)
      alert('Error en el registro automático')
    } finally {
      setIsScanning(false)
    }
  }

  // Navigate to welcome page when recognized
  useEffect(() => {
    if (detectionStatus === 'recognized' && detectionResult?.clientId) {
      const timer = setTimeout(() => {
        router.push(`/kiosk/welcome?clientId=${detectionResult.clientId}`)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [detectionStatus, detectionResult, router])

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      {/* Welcome section */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Bienvenido</h1>
        <p className="text-lg text-muted-foreground">
          Usa tu rostro para identificarte de forma rápida y segura
        </p>
      </div>

      {/* Facial recognition card with ESP32 stream */}
      <div className="bank-card-elevated p-8 max-w-xl w-full animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4 shadow-glow">
            <Camera className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Reconocimiento Facial</h2>
          <p className="text-muted-foreground mt-1">Acércate a la cámara para identificarte automáticamente</p>
        </div>

        {/* ESP32 Stream Display */}
        <div className="flex justify-center mb-6">
          <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-xl bg-bank-camera">
            {ESP32_STREAM_URL ? (
              <>
                <img
                  ref={mediaRef as React.RefObject<HTMLImageElement>}
                  src={streamRetryCount > 0 ? `${ESP32_STREAM_URL}?retry=${streamRetryCount}&t=${Date.now()}` : ESP32_STREAM_URL}
                  crossOrigin="anonymous"
                  onLoad={() => {
                    setStreamError(false)
                    setStreamRetryCount(0)
                  }}
                  onError={() => {
                    if (isScanning && streamRetryCount < 3) {
                      setStreamRetryCount(prev => prev + 1)
                      setTimeout(() => {
                        if (mediaRef.current) {
                          (mediaRef.current as HTMLImageElement).src = `${ESP32_STREAM_URL}?retry=${streamRetryCount + 1}&t=${Date.now()}`
                        }
                      }, 1000)
                    } else {
                      setStreamError(true)
                      setDetectionStatus('error')
                    }
                  }}
                  className="w-full h-full object-cover"
                  alt="Stream de cámara ESP32"
                />
                <canvas
                  ref={overlayRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Status overlay */}
            {detectionStatus === 'detecting' && (
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-medium text-primary">Detectando rostro...</p>
                </div>
              </div>
            )}
            
            {detectionStatus === 'recognized' && detectionResult && (
              <div className="absolute inset-0 bg-bank-success/10 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-bank-success mx-auto" />
                  <p className="text-lg font-bold text-foreground">¡Bienvenido!</p>
                  <p className="text-sm text-muted-foreground">{detectionResult.clientName}</p>
                </div>
              </div>
            )}
            
            {detectionStatus === 'error' && (
              <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                  <p className="text-sm font-medium text-destructive">{detectionResult?.message || 'Error'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {(detectionStatus === 'idle' || detectionStatus === 'error') && (
            <Button 
              variant="bank" 
              size="xl" 
              className="w-full"
              onClick={handleStartScan}
              disabled={isScanning || !faceApiReady}
            >
              <Camera className="w-5 h-5" />
              {isScanning ? "Escaneando..." : "Iniciar Reconocimiento Facial"}
            </Button>
          )}
          
          {(detectionStatus === 'idle' || detectionStatus === 'error') && (
            <Button 
              variant="bank-outline" 
              size="xl" 
              className="w-full"
              onClick={handleRegister}
              disabled={isScanning}
            >
              Registrar Automático
            </Button>
          )}

          {detectionStatus === 'recognized' && detectionResult && (
            <Link href={`/kiosk/welcome?clientId=${detectionResult.clientId}`} className="block">
              <Button variant="bank" size="xl" className="w-full">
                <CheckCircle2 className="w-5 h-5" />
                Continuar
              </Button>
            </Link>
          )}

          {(detectionStatus === 'unknown' || detectionStatus === 'detecting' || detectionStatus === 'recognized') && (
            <Button
              onClick={resetDetection}
              variant="bank-outline"
              size="xl"
              className="w-full"
            >
              Intentar de Nuevo
            </Button>
          )}
        </div>
      </div>

      {/* Alternative options */}
      <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <p className="text-sm text-muted-foreground mb-3">¿Prefieres otra opción?</p>
        <div className="flex items-center justify-center gap-6 text-sm">
          <Link 
            href="/kiosk/register"
            className="text-primary hover:underline flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" />
            Registrarse
          </Link>
          <span className="text-border">•</span>
          <Link 
            href="/kiosk/login"
            className="text-primary hover:underline flex items-center gap-1"
          >
            <KeyRound className="w-4 h-4" />
            Iniciar sesión con DNI
          </Link>
          <span className="text-border">•</span>
          <Link 
            href="/kiosk/chat"
            className="text-primary hover:underline flex items-center gap-1"
          >
            <HelpCircle className="w-4 h-4" />
            Hacer una pregunta
          </Link>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="mt-8 max-w-xl animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/50 border border-border">
          <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Información de Privacidad</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tus datos biométricos están protegidos según la Ley de Protección de Datos Personales.
              Solo se utilizan para verificar tu identidad de forma segura.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

