import { NextResponse } from 'next/server'

// Server-side proxy that extracts a single JPEG frame from an MJPEG /stream
export async function GET() {
  const STREAM_URL = process.env.ESP32_STREAM_URL ?? process.env.NEXT_PUBLIC_ESP32_STREAM_URL ?? 'http://192.168.122.116:81/stream'

  const res = await fetch(STREAM_URL, { method: 'GET' })
  if (!res.ok || !res.body) {
    return NextResponse.json({ ok: false, status: res.status, statusText: res.statusText }, { status: 502 })
  }

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  // read up to a reasonable limit
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      total += value.length
      // quick scan for JPEG end marker 0xFFD9
      const buf = Buffer.concat(chunks.map(c => Buffer.from(c)))
      const startIdx = buf.indexOf(Buffer.from([0xff, 0xd8]))
      const endIdx = buf.indexOf(Buffer.from([0xff, 0xd9]), startIdx + 2)
      if (startIdx !== -1 && endIdx !== -1) {
        const jpg = buf.slice(startIdx, endIdx + 2)
        return new Response(jpg, { headers: { 'Content-Type': 'image/jpeg' } })
      }
      // safety: stop if too large
      if (total > 5_000_000) break
    }
  }

  return NextResponse.json({ ok: false, message: 'No se obtuvo frame JPEG del stream' }, { status: 504 })
}
