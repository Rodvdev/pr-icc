"use client"

import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CameraViewport } from "./CameraViewport"

type CameraStatus = "idle" | "scanning" | "detected" | "error"

interface FacialRecognitionCardProps {
  status: CameraStatus
  statusMessage?: string
  onStartScan: () => void
  onRegister: () => void
  isScanning?: boolean
}

export function FacialRecognitionCard({
  status,
  statusMessage,
  onStartScan,
  onRegister,
  isScanning = false,
}: FacialRecognitionCardProps) {
  return (
    <div className="bank-card-elevated p-8 max-w-xl w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4 shadow-glow">
          <Camera className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">Reconocimiento Facial</h2>
        <p className="text-muted-foreground mt-1">Acércate a la cámara para identificarte automáticamente</p>
      </div>

      {/* Camera viewport */}
      <div className="flex justify-center mb-6">
        <CameraViewport status={status} message={statusMessage} />
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <Button 
          variant="bank" 
          size="xl" 
          className="w-full"
          onClick={onStartScan}
          disabled={isScanning}
        >
          <Camera className="w-5 h-5" />
          {isScanning ? "Escaneando..." : "Iniciar Reconocimiento Facial"}
        </Button>
        <Button 
          variant="bank-outline" 
          size="xl" 
          className="w-full"
          onClick={onRegister}
          disabled={isScanning}
        >
          Registrar Automático
        </Button>
      </div>
    </div>
  )
}

