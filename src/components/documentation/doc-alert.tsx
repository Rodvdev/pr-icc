import { AlertCircle, Info, CheckCircle2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocAlertProps {
  children: React.ReactNode
  type?: "info" | "warning" | "error" | "success"
  className?: string
}

export function DocAlert({ children, type = "info", className }: DocAlertProps) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle2,
  }

  const styles = {
    info: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100",
    warning: "bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-900 text-yellow-900 dark:text-yellow-100",
    error: "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-900 dark:text-red-100",
    success: "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-900 text-green-900 dark:text-green-100",
  }

  const Icon = icons[type]

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg border",
        styles[type],
        className
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">{children}</div>
    </div>
  )
}

