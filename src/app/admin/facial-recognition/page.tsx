"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Clock, Eye, TrendingUp, Play, Square, RefreshCw } from "lucide-react"
import { 
  getFacialAPIStatus, 
  startFacialRecognition, 
  stopFacialRecognition, 
  getFacialResults, 
  getLatestFacialResult,
  getFacialStats,
  type FacialAPIIStatus,
  type FacialAPIResult,
  type FacialAPIStats
} from "@/lib/facial-recognition-api"

interface FacialProfile {
  id: string
  clientId: string
  provider: string
  providerFaceId: string | null
  isActive: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  client: {
    id: string
    name: string | null
    dni: string | null
    email: string | null
    status: string
  }
}

interface DetectionEvent {
  id: string
  cameraId: string
  clientId: string | null
  status: string
  confidence: number | null
  occurredAt: string
  client: {
    id: string
    name: string | null
    dni: string | null
    email: string | null
  } | null
  camera: {
    id: string
    name: string
    branch: {
      name: string
    }
  }
}

export default function FacialRecognitionPage() {
  const [profiles, setProfiles] = useState<FacialProfile[]>([])
  const [detections, setDetections] = useState<DetectionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProfiles: 0,
    activeProfiles: 0,
    totalDetections: 0,
    matchedDetections: 0
  })

  // Python API state
  const [apiStatus, setApiStatus] = useState<FacialAPIIStatus | null>(null)
  const [apiResults, setApiResults] = useState<FacialAPIResult[]>([])
  const [apiStats, setApiStats] = useState<FacialAPIStats | null>(null)
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    fetchAPIData()
  }, [])

  const fetchData = async () => {
    setLoading(true)    
    try {
      const [profilesRes, detectionsRes, encodingsRes, pythonResults] = await Promise.all([
        fetch('/api/facial-recognition/profiles'),
        fetch('/api/facial-recognition/detections?limit=1000'),
        // API Flask deshabilitada temporalmente
        Promise.resolve(null),
        getFacialResults().catch(() => null) // Si falla la API de Python, continúa
      ])
      
      // Si tenemos encodings de Flask, combinarlos con los perfiles
      // API Flask deshabilitada temporalmente - este código no se ejecuta
      // if (encodingsRes?.ok) {
      //   const encodingsData = await encodingsRes.json()
      //   if (encodingsData.encodings?.length > 0) {
      //     console.log(`✅ ${encodingsData.total} usuarios registrados en Flask API`)
      //   }
      // }

      const profilesData = await profilesRes.json()
      const detectionsData = await detectionsRes.json()

      setProfiles(profilesData.profiles || [])
      setDetections(detectionsData.detections || [])
      
      // Agregar resultados de Python API si están disponibles
      if (pythonResults?.results) {
        setApiResults(pythonResults.results)
      }

      // Calculate stats
      const totalProfiles = profilesData.profiles?.length || 0
      const activeProfiles = profilesData.profiles?.filter((p: FacialProfile) => p.isActive).length || 0
      const totalDetections = detectionsData.total || 0
      const matchedDetections = detectionsData.detections?.filter((d: DetectionEvent) => d.status === 'MATCHED').length || 0
      
      // También obtener estadísticas de Python API si están disponibles
      if (pythonResults?.results && pythonResults.results.length > 0) {
        const pythonStats = pythonResults.results.reduce((acc: { total: number; recognized: Record<string, number> }, result: FacialAPIResult) => {
          acc.total = (acc.total || 0) + 1
          if (result.name) {
            acc.recognized = acc.recognized || {}
            acc.recognized[result.name] = (acc.recognized[result.name] || 0) + 1
          }
          return acc
        }, { total: 0, recognized: {} })
        
        setApiStats({
          total_detections: pythonStats.total,
          recognized: pythonStats.recognized || {},
          unknown_count: pythonResults.results.filter((r: FacialAPIResult) => !r.name).length
        })
      }

      setStats({
        totalProfiles,
        activeProfiles,
        totalDetections,
        matchedDetections
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string, className: string }> = {
      'MATCHED': { label: 'Coincidencia', className: 'bg-green-100 text-green-800' },
      'NEW_FACE': { label: 'Nueva Cara', className: 'bg-blue-100 text-blue-800' },
      'MULTIPLE_MATCHES': { label: 'Múltiples', className: 'bg-yellow-100 text-yellow-800' },
      'UNKNOWN': { label: 'Desconocido', className: 'bg-gray-100 text-gray-800' }
    }

    const variant = variants[status] || variants['UNKNOWN']

    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  // Python API functions
  const fetchAPIData = async () => {
    setApiLoading(true)
    setApiError(null)
    try {
      const [status, results, stats] = await Promise.all([
        getFacialAPIStatus(),
        getFacialResults(),
        getFacialStats()
      ])
      
      setApiStatus(status)
      setApiResults(results.results)
      setApiStats(stats)
    } catch (error) {
      console.error('Error fetching Python API data:', error)
      setApiError('No se pudo conectar con el servidor Python API')
    } finally {
      setApiLoading(false)
    }
  }

  const handleStartRecognition = async () => {
    try {
      await startFacialRecognition()
      fetchAPIData()
    } catch (error) {
      console.error('Error starting recognition:', error)
      alert('Error al iniciar el reconocimiento facial')
    }
  }

  const handleStopRecognition = async () => {
    try {
      await stopFacialRecognition()
      fetchAPIData()
    } catch (error) {
      console.error('Error stopping recognition:', error)
      alert('Error al detener el reconocimiento facial')
    }
  }

  const handleGetLatestResult = async () => {
    try {
      const result = await getLatestFacialResult()
      alert(JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('Error getting latest result:', error)
    }
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Reconocimiento Facial
          </h1>
          <p className="text-gray-600">
            Administra perfiles faciales y visualiza eventos de detección desde el sistema Python/ESP32
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Perfiles Totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProfiles}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Perfiles Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeProfiles}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Detecciones Totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDetections}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coincidencias</p>
                <p className="text-2xl font-bold text-blue-600">{stats.matchedDetections}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="detections" className="space-y-4">
          <TabsList>
            <TabsTrigger value="detections">Eventos de Detección</TabsTrigger>
            <TabsTrigger value="profiles">Perfiles Faciales</TabsTrigger>
            <TabsTrigger value="logs">Logs de Acceso</TabsTrigger>
            <TabsTrigger value="python-api">Python API Dashboard</TabsTrigger>
          </TabsList>

          {/* Detections Tab */}
          <TabsContent value="detections">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Cámara</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Confianza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Cargando datos...
                      </TableCell>
                    </TableRow>
                  ) : detections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No hay eventos de detección registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    detections.map((detection) => (
                      <TableRow key={detection.id}>
                        <TableCell>
                          {new Date(detection.occurredAt).toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{detection.camera.name}</p>
                            <p className="text-sm text-gray-500">{detection.camera.branch.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {detection.client ? (
                            <div>
                              <p className="font-medium">{detection.client.name || 'Sin nombre'}</p>
                              {detection.client.dni && (
                                <p className="text-sm text-gray-500">DNI: {detection.client.dni}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No identificado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(detection.status)}
                        </TableCell>
                        <TableCell>
                          {detection.confidence ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${detection.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-12">
                                {Math.round(detection.confidence * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Provider ID</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Registrado</TableHead>
                    <TableHead>Última Actualización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Cargando datos...
                      </TableCell>
                    </TableRow>
                  ) : profiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No hay perfiles faciales registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{profile.client.name || 'Sin nombre'}</p>
                            <p className="text-sm text-gray-500">{profile.client.email}</p>
                            {profile.client.dni && (
                              <p className="text-sm text-gray-500">DNI: {profile.client.dni}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {profile.providerFaceId || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {profile.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Activo</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(profile.createdAt).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          {new Date(profile.updatedAt).toLocaleDateString('es-ES')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Python API Dashboard Tab */}
          <TabsContent value="python-api">
            <Card className="p-6 space-y-6">
              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Error de conexión</p>
                    <p className="text-sm text-red-600">{apiError}</p>
                  </div>
                </div>
              )}

              {/* Status Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>
                {apiLoading ? (
                  <p className="text-gray-500">Cargando estado...</p>
                ) : apiStatus ? (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Activo:</span>
                      <Badge className={apiStatus.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {apiStatus.active ? 'Sí' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Encodings Cargados:</span>
                      <Badge className={apiStatus.encodings_loaded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {apiStatus.encodings_loaded ? 'Sí' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Total Resultados:</span>
                      <span className="text-gray-700">{apiStatus.total_results}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Stream URL:</span>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded">{apiStatus.stream_url}</code>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Stats Section */}
              {apiStats && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Total Detecciones:</span>
                      <span className="text-blue-700 font-semibold">{apiStats.total_detections}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Desconocidos:</span>
                      <span className="text-gray-700">{apiStats.unknown_count}</span>
                    </div>
                    {apiStats.last_detection && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Última Detección:</span>
                        <span className="text-gray-700">{new Date(apiStats.last_detection).toLocaleString('es-ES')}</span>
                      </div>
                    )}
                    {Object.keys(apiStats.recognized).length > 0 && (
                      <div>
                        <span className="font-medium">Reconocimientos por Persona:</span>
                        <ul className="mt-2 space-y-1">
                          {Object.entries(apiStats.recognized).map(([name, count]) => (
                            <li key={name} className="flex justify-between bg-white px-3 py-2 rounded">
                              <span>{name}</span>
                              <Badge>{count}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Results Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Resultados Recientes ({apiResults.length})</h3>
                {apiLoading ? (
                  <p className="text-gray-500">Cargando resultados...</p>
                ) : apiResults.length === 0 ? (
                  <p className="text-gray-500">No hay resultados disponibles</p>
                ) : (
                  <div className="bg-green-50 rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                    {apiResults.map((result, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <strong className="text-gray-900">{result.name}</strong>
                          <span className="text-sm text-gray-500">{new Date(result.timestamp).toLocaleString('es-ES')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Confianza:</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(result.confidence) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12">{Math.round(result.confidence * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button
                  onClick={handleStartRecognition}
                  disabled={apiStatus?.active || apiLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Reconocimiento
                </Button>
                <Button
                  onClick={handleStopRecognition}
                  disabled={!apiStatus?.active || apiLoading}
                  variant="destructive"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Detener Reconocimiento
                </Button>
                <Button
                  onClick={handleGetLatestResult}
                  disabled={apiLoading}
                  variant="outline"
                >
                  Último Resultado
                </Button>
                <Button
                  onClick={fetchAPIData}
                  disabled={apiLoading}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Logs Tab (axios-based) */}
          <TabsContent value="logs">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Resumen</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-600">Sesiones activas</p>
                    <p className="text-2xl font-bold text-gray-900">{apiStatus?.active ? 1 : 0}</p>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-600">Reconocimientos aprobados</p>
                    <p className="text-2xl font-bold text-green-600">{apiResults.filter(r => r.name && r.name !== 'Desconocido').length}</p>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-600">Reconocimientos fallidos</p>
                    <p className="text-2xl font-bold text-red-600">{apiResults.filter(r => !r.name || r.name === 'Desconocido').length}</p>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total eventos</p>
                    <p className="text-2xl font-bold text-gray-900">{apiResults.length}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Últimos eventos</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Confianza</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">Cargando...</TableCell>
                      </TableRow>
                    ) : apiResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">Sin registros</TableCell>
                      </TableRow>
                    ) : (
                      apiResults.slice().reverse().slice(0, 50).map((r, idx) => {
                        const approved = r.name && r.name !== 'Desconocido'
                        return (
                          <TableRow key={idx}>
                            <TableCell>{new Date(r.timestamp).toLocaleString('es-ES')}</TableCell>
                            <TableCell>{approved ? r.name : 'Desconocido'}</TableCell>
                            <TableCell>
                              <Badge className={approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {approved ? 'Aprobado' : 'Fallido'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div className={approved ? 'bg-green-600 h-2 rounded-full' : 'bg-red-600 h-2 rounded-full'} style={{ width: `${Math.max(0, Math.min(100, Math.round((r.confidence || 0) * 100))) }%` }} />
                                </div>
                                <span className="text-sm font-medium w-12">{Math.round((r.confidence || 0) * 100)}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2">
                <Button onClick={fetchAPIData} disabled={apiLoading} variant="outline">Actualizar</Button>
                <Button onClick={handleStartRecognition} disabled={apiStatus?.active || apiLoading}>Iniciar</Button>
                <Button onClick={handleStopRecognition} disabled={!apiStatus?.active || apiLoading} variant="destructive">Detener</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button onClick={fetchData} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar Datos'}
          </Button>
        </div>
      </div>
    </div>
  )
}

