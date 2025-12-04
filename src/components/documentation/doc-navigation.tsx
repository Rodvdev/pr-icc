"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPreviousNextDocs } from "@/config/documentation-nav"
import { usePathname } from "next/navigation"

export function DocNavigation() {
  const pathname = usePathname()
  const { previous, next } = getPreviousNextDocs(pathname)

  return (
    <div className="flex items-center justify-between gap-4 pt-8 mt-8 border-t">
      {previous ? (
        <Button variant="outline" asChild>
          <Link href={previous.href} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Anterior</div>
              <div className="text-sm font-medium">{previous.title}</div>
            </div>
          </Link>
        </Button>
      ) : (
        <div />
      )}

      {next && (
        <Button variant="outline" asChild>
          <Link href={next.href} className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Siguiente</div>
              <div className="text-sm font-medium">{next.title}</div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}

