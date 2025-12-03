import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { tmpdir } from 'os'
import path from 'path'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null
  const samples = typeof body.samples === 'number' && body.samples > 0 ? body.samples : 3

  if (!name) {
    return NextResponse.json({ ok: false, message: 'Missing name in body' }, { status: 400 })
  }

  // locate python script in sibling folder
  const workspaceRoot = path.resolve(process.cwd(), '..') // pr-icc/.. -> Proy_local
  const scriptPath = path.join(workspaceRoot, 'hardware_ESP32Cam', 'register_headless.py')

  // spawn python process
  const pythonExe = process.env.PYTHON_PATH ?? 'python'
  const args = [scriptPath, '--name', name, '--samples', String(samples)]

  return new Promise((resolve) => {
    const proc = spawn(pythonExe, args, { cwd: path.dirname(scriptPath) })
    let out = ''
    let err = ''
    proc.stdout.on('data', (d) => { out += d.toString() })
    proc.stderr.on('data', (d) => { err += d.toString() })
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(NextResponse.json({ ok: true, message: 'Registration completed', stdout: out }))
      } else {
        resolve(NextResponse.json({ ok: false, message: 'Registration failed', code, stdout: out, stderr: err }, { status: 500 }))
      }
    })
  })
}
