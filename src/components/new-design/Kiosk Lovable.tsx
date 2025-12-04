import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskHeader } from "@/components/kiosk/KioskHeader";
import { KioskFooter } from "@/components/kiosk/KioskFooter";
import { FacialRecognitionCard } from "@/components/kiosk/FacialRecognitionCard";
import { Shield, UserPlus, KeyRound, HelpCircle } from "lucide-react";

type CameraStatus = "idle" | "scanning" | "detected" | "error";

export default function Kiosk() {
  const navigate = useNavigate();
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>();

  const handleStartScan = () => {
    setCameraStatus("scanning");
    setStatusMessage("Detectando rostro...");
    
    // Simulate scanning process
    setTimeout(() => {
      setCameraStatus("detected");
      setStatusMessage("¡Bienvenido, Carlos!");
      
      // Navigate to logged in view after detection
      setTimeout(() => {
        navigate("/kiosk/dashboard");
      }, 1500);
    }, 3000);
  };

  const handleRegister = () => {
    navigate("/kiosk/register");
  };

  return (
    <div className="min-h-screen bank-gradient flex flex-col">
      <KioskHeader />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Welcome section */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Bienvenido</h1>
          <p className="text-lg text-muted-foreground">
            Usa tu rostro para identificarte de forma rápida y segura
          </p>
        </div>

        {/* Facial recognition card */}
        <FacialRecognitionCard
          status={cameraStatus}
          statusMessage={statusMessage}
          onStartScan={handleStartScan}
          onRegister={handleRegister}
          isScanning={cameraStatus === "scanning"}
        />

        {/* Alternative options */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <p className="text-sm text-muted-foreground mb-3">¿Prefieres otra opción?</p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <button 
              onClick={() => navigate("/kiosk/register")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-4 h-4" />
              Registrarse
            </button>
            <span className="text-border">•</span>
            <button 
              onClick={() => navigate("/kiosk/login")}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <KeyRound className="w-4 h-4" />
              Iniciar sesión con DNI
            </button>
            <span className="text-border">•</span>
            <button 
              onClick={() => {}}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-4 h-4" />
              Hacer una pregunta
            </button>
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

      <KioskFooter />
    </div>
  );
}
