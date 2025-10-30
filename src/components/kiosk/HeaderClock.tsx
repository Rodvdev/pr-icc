"use client"

import { useEffect, useState } from "react"

export default function HeaderClock() {
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <>
      <p className="text-sm font-medium text-gray-900">
        {now.toLocaleDateString('es-PE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </p>
      <p className="text-xs text-gray-500">
        {now.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </>
  )
}


