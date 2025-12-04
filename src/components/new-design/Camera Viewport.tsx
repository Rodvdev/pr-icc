import { Camera, Scan, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type CameraStatus = "idle" | "scanning" | "detected" | "error";

interface CameraViewportProps {
  status: CameraStatus;
  message?: string;
}

export function CameraViewport({ status, message }: CameraViewportProps) {
  const statusConfig = {
    idle: {
      icon: Camera,
      text: message || "Presiona el botón para iniciar",
      color: "text-muted-foreground",
    },
    scanning: {
      icon: Scan,
      text: message || "Escaneando rostro...",
      color: "text-primary",
    },
    detected: {
      icon: CheckCircle2,
      text: message || "¡Rostro detectado!",
      color: "text-bank-success",
    },
    error: {
      icon: AlertCircle,
      text: message || "No se detectó un rostro",
      color: "text-destructive",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="camera-viewport w-full aspect-[4/3] max-w-lg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Scanning animation overlay */}
      {status === "scanning" && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 h-1 bg-gradient-to-b from-primary/50 to-transparent animate-scan" />
        </div>
      )}
      
      {/* Face detection frame */}
      {(status === "scanning" || status === "detected") && (
        <div className={cn(
          "absolute inset-8 border-2 rounded-2xl transition-all duration-500",
          status === "detected" ? "border-bank-success" : "border-primary/50"
        )}>
          {/* Corner markers */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
        </div>
      )}

      {/* Status icon and text */}
      <div className={cn(
        "flex flex-col items-center gap-3 transition-all duration-300",
        status === "detected" && "animate-face-detected"
      )}>
        <Icon className={cn("w-12 h-12", config.color, status === "scanning" && "animate-pulse")} />
        <p className={cn("text-sm font-medium", config.color)}>{config.text}</p>
      </div>
    </div>
  );
}
