import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function euclidean(a: number[], b: number[]) {
  if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY
  let s = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i]
    s += d * d
  }
  return Math.sqrt(s)
}

function normalize(v: number[]) {
  if (!v || v.length === 0) return v
  let s = 0
  for (let i = 0; i < v.length; i++) s += v[i] * v[i]
  const len = Math.sqrt(s)
  if (!isFinite(len) || len === 0) return v
  return v.map((x) => x / len)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  // Accept descriptor (preferred) or image (fallback)
  const descriptor: number[] | undefined = Array.isArray(body.descriptor) ? body.descriptor : undefined
  if (!descriptor) {
    return NextResponse.json({ ok: false, message: 'Missing descriptor. Send { descriptor: number[] } from client-side face-api.' }, { status: 400 })
  }

  try {
    // Load active facial profiles with embeddings
    const profiles = await prisma.facialProfile.findMany({
      where: { isActive: true },
      include: { client: true }
    })

    let best: {
      profile: { id: string; clientId: string; client: { name: string | null } | null } | null
      distance: number
    } = { profile: null, distance: Number.POSITIVE_INFINITY }

    for (const p of profiles) {
      // embedding stored as { vector: [...] } or directly as array
      let vec: number[] | undefined
      try {
        const embedding = p.embedding as unknown
        if (embedding && typeof embedding === 'object' && 'vector' in embedding && Array.isArray((embedding as { vector: unknown }).vector)) {
          vec = (embedding as { vector: number[] }).vector
        } else if (Array.isArray(embedding)) {
          vec = embedding as number[]
        }
      } catch {
        vec = undefined
      }

      if (!vec) continue

      // Normalize both descriptor and stored vector to reduce scale mismatch
      const dNorm = normalize(descriptor)
      const vNorm = normalize(vec)

      const dist = euclidean(dNorm, vNorm)
      if (dist < best.distance) {
        best = { profile: p, distance: dist }
      }
    }
    // Decide threshold (Euclidean). Typical face-api descriptors use euclidean distance ~0.6
    // Allow override via env var RECOGNITION_THRESHOLD (e.g. 0.5)
    const THRESHOLD = Number(process.env.RECOGNITION_THRESHOLD ?? process.env.NEXT_PUBLIC_RECOGNITION_THRESHOLD ?? 0.5)

    if (best.profile && best.distance <= THRESHOLD) {
      // confidence: 1 when distance==0, 0 when distance==THRESHOLD
      const raw = 1 - best.distance / THRESHOLD
      const confidence = Math.max(0, Math.min(1, raw))
      return NextResponse.json({
        ok: true,
        recognized: true,
        clientId: best.profile.clientId,
        clientName: best.profile.client?.name || null,
        confidence,
        distance: best.distance,
        threshold: THRESHOLD
      })
    }

    return NextResponse.json({ ok: true, recognized: false, distance: best.distance, threshold: THRESHOLD })
  } catch {
    console.error('[API] /api/kiosk/recognize error')
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 })
  }
}
