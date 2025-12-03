"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, CheckCircle2, AlertCircle } from "lucide-react"
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
 * - Detección facial automático mediante servidor
 * - Reconocimiento de clientes existentes
 * - Opciones de registro para nuevos clientes
 */
export default function KioskHomePage() {
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>('idle')
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [hasCamera, setHasCamera] = useState(true)
  const [showPrivacyMore, setShowPrivacyMore] = useState(false)
  const [streamError, setStreamError] = useState(false)
  const [streamRetryCount, setStreamRetryCount] = useState(0)
  const [faceApiReady, setFaceApiReady] = useState(false)
  const detectionLoopRef = useRef<number | null>(null)
  const [lastDetection, setLastDetection] = useState<any>(null)
  
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
              const globalFaceApi = (window as any).FaceAPI || (window as any).faceapi || (window as any).facapi
              if (!globalFaceApi) {
                console.error('❌ face-api no se cargó correctamente')
                return
              }
              (window as any).__faceapi = globalFaceApi
              
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

        const FaceAPI = (window as any).FaceAPI || (window as any).faceapi || (window as any).facapi
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
        } catch (err) {
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
              img.onerror = () => {
                throw new Error('Stream load failed')
              }
            }
          } else {
            setTimeout(() => resolve(), 800)
          }
        })

        try {
          await Promise.race([imageLoad, loadTimeout])
        } catch (err) {
          console.warn('Stream ESP32 no disponible, usando cámara local como fallback')
          setStreamError(true)
          // Continuar con fallback a cámara local
        }

        // Si el stream está disponible, intentar capturar
        if (!streamError && mediaRef.current) {
          const canvas = document.createElement('canvas')
          const width = 'videoWidth' in mediaRef.current 
            ? (mediaRef.current as HTMLVideoElement).videoWidth 
            : (mediaRef.current as HTMLImageElement).naturalWidth
          const height = 'videoHeight' in mediaRef.current 
            ? (mediaRef.current as HTMLVideoElement).videoHeight 
            : (mediaRef.current as HTMLImageElement).naturalHeight
          
          if (width > 0 && height > 0) {
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (ctx) {
              try {
                ctx.drawImage(mediaRef.current as any, 0, 0, canvas.width, canvas.height)
                const imageData = canvas.toDataURL('image/jpeg', 0.8)
                console.debug('Imagen capturada desde stream ESP32, enviando a API...')
                
                // Enviar a API de reconocimiento
                // Preferimos enviar el descriptor calculado en el loop (si existe)
                const payload: any = {}
                if (lastDetection && lastDetection.descriptor) {
                  payload.descriptor = Array.from(lastDetection.descriptor)
                } else {
                  payload.image = imageData
                }

                const response = await fetch('/api/kiosk/recognize', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                })
                const result = await response.json()
                console.debug('Resultado del reconocimiento:', result)
                
                if (result.ok) {
                  if (result.recognized && result.clientName) {
                    setDetectionStatus('recognized')
                    setDetectionResult({
                      status: 'recognized',
                        clientId: result.clientId,
                        clientName: result.clientName,
                        confidence: result.confidence,
                        message: `¡Bienvenido, ${result.clientName}!`
                    })
                  } else {
                    setDetectionStatus('unknown')
                    setDetectionResult({
                      status: 'unknown',
                      message: 'No te reconocemos aún'
                    })
                  }
                } else {
                  setDetectionStatus('error')
                  setDetectionResult({
                    status: 'error',
                    message: result.message || 'Error en reconocimiento'
                  })
                }
              } catch (err) {
                console.warn('No se pudo capturar imagen desde el stream HTTP:', err)
                setStreamError(true)
              }
            }
          } else {
            setStreamError(true)
          }
        }
      }

      // No fallback to local webcam: detection only via ESP32 stream.
      // If ESP32 stream is unavailable, we mark streamError and return an error.
      if (!ESP32_STREAM_URL || streamError) {
        setStreamError(true)
        throw new Error('ESP32 stream not available')
      }

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
      
      // No-op: we don't manage local webcam streams; ESP32 stream is remote and stays running.
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

  return (
    <div className="container mx-auto px-6 max-w-6xl">
      <div className="space-y-8">
        {/* Bienvenida */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Usa tu rostro para identificarte de forma rápida y segura
          </p>
        </div>

        <div className="space-y-6">
          {/* Panel de detección facial - más prominente */}
          <Card className="p-8 space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Reconocimiento Facial
              </h2>
              <p className="text-lg text-gray-600">
                Acércate a la cámara para identificarte automáticamente
              </p>
            </div>

            {/* Video preview (oculto durante detección) */}
            <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
              {detectionStatus === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white space-y-2">
                    <Camera className="w-12 h-12 mx-auto opacity-50" />
                    <p className="text-sm">Presiona el botón para iniciar</p>
                  </div>
                </div>
              )}
              
              {detectionStatus === 'detecting' && (
                <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
                  <div className="bg-black/70 backdrop-blur-sm rounded-lg px-6 py-4 text-center text-white space-y-2">
                    <div className="w-12 h-12 mx-auto border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-base font-medium">Detectando rostro...</p>
                    <p className="text-xs opacity-90">Por favor, mantén tu rostro frente a la cámara</p>
                  </div>
                </div>
              )}

              {detectionStatus === 'recognized' && detectionResult && (
                <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
                  <div className="bg-green-600/90 backdrop-blur-sm rounded-lg px-6 py-4 text-center text-white space-y-2 max-w-md">
                    <CheckCircle2 className="w-12 h-12 mx-auto" />
                    <p className="text-xl font-bold">¡Bienvenido de vuelta!</p>
                    <p className="text-lg">{detectionResult.clientName}</p>
                    <p className="text-xs opacity-90">
                      Confianza: {Math.round((detectionResult.confidence || 0) * 100)}%
                    </p>
                  </div>
                </div>
              )}

              {detectionStatus === 'unknown' && (
                <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
                  <div className="bg-orange-500/90 backdrop-blur-sm rounded-lg px-6 py-4 text-center text-white space-y-2 max-w-md">
                    <AlertCircle className="w-12 h-12 mx-auto" />
                    <p className="text-lg font-medium">No te reconocemos aún</p>
                    <p className="text-xs">Por favor, regístrate para usar este servicio</p>
                  </div>
                </div>
              )}

              {detectionStatus === 'error' && (
                <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
                  <div className="bg-red-500/90 backdrop-blur-sm rounded-lg px-6 py-4 text-center text-white space-y-2 max-w-md">
                    <AlertCircle className="w-12 h-12 mx-auto" />
                    <p className="text-lg font-medium">Error de conexión</p>
                    <p className="text-xs">{detectionResult?.message}</p>
                  </div>
                </div>
              )}

              {ESP32_STREAM_URL ? (
                <>
                  <img
                    ref={mediaRef as any}
                    src={streamRetryCount > 0 ? `${ESP32_STREAM_URL}?retry=${streamRetryCount}&t=${Date.now()}` : ESP32_STREAM_URL}
                    crossOrigin="anonymous"
                    onLoad={() => {
                      console.debug('ESP32 stream image loaded')
                      setStreamError(false)
                      setStreamRetryCount(0)
                    }}
                    onError={(e) => {
                      // Solo mostrar error si estamos escaneando activamente
                      if (isScanning) {
                        const retryLimit = 3
                        if (streamRetryCount < retryLimit) {
                          console.warn(`Intento ${streamRetryCount + 1} de cargar stream ESP32 falló, reintentando...`)
                          setStreamRetryCount(prev => prev + 1)
                          // Forzar recarga de la imagen después de un breve delay
                          setTimeout(() => {
                            if (mediaRef.current) {
                              (mediaRef.current as HTMLImageElement).src = `${ESP32_STREAM_URL}?retry=${streamRetryCount + 1}&t=${Date.now()}`
                            }
                          }, 1000)
                        } else {
                          console.warn('No se pudo cargar el stream ESP32 después de varios intentos')
                          setStreamError(true)
                          setDetectionStatus('error')
                          setDetectionResult({ 
                            status: 'error', 
                            message: 'No se pudo conectar con la cámara. Por favor, intenta usar el registro manual o verifica la conexión.' 
                          })
                          setHasCamera(false)
                          setIsScanning(false)
                        }
                      } else {
                        // Si no estamos escaneando, solo marcar el error silenciosamente
                        setStreamError(true)
                        console.debug('Stream ESP32 no disponible (carga silenciosa)')
                      }
                    }}
                    className="w-full h-full object-cover"
                    style={{ display: 'block' }}
                    alt="Stream de cámara ESP32"
                  />
                  <canvas
                    ref={overlayRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ display: 'block', cursor: 'crosshair' }}
                  />
                </>
              ) : (
                <video
                  ref={mediaRef as any}
                  className="w-full h-full object-cover"
                  style={{ display: 'block' }}
                  autoPlay
                  playsInline
                  muted
                />
              )}
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              {(detectionStatus === 'idle' || detectionStatus === 'error') && (
                <Button
                  onClick={startFacialDetection}
                  disabled={isScanning}
                  className="w-full h-14 text-lg"
                  size="lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Iniciar Reconocimiento Facial
                </Button>
              )}

              {/* Registrar automáticamente (3-shots) */}
              {(detectionStatus === 'idle' || detectionStatus === 'error') && (
                <Button
                  onClick={async () => {
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
                  }}
                  variant="outline"
                  className="w-full h-14 text-lg"
                  size="lg"
                >
                  Registrar Automático
                </Button>
              )}
              

              {detectionStatus === 'recognized' && detectionResult && (
                <Link href={`/kiosk/welcome?clientId=${detectionResult.clientId}`} className="block">
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

          </Card>

          {/* Opciones alternativas - discretas en la parte inferior */}
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <p className="text-xs text-gray-400 mb-3">¿Prefieres otra opción?</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/kiosk/register" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                Registrarse
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/kiosk/login" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                Iniciar sesión con DNI
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/kiosk/chat" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                Hacer una pregunta
              </Link>
            </div>
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

