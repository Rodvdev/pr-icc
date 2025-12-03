import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null
  const encodings = Array.isArray(body.encodings) ? body.encodings : null

  if (!name || !encodings) {
    return NextResponse.json({ ok: false, message: 'Missing name or encodings' }, { status: 400 })
  }

  // locate script
  const workspaceRoot = path.resolve(process.cwd(), '..') // pr-icc/.. -> Proy_local
  const scriptPath = path.join(workspaceRoot, 'hardware_ESP32Cam', 'append_embeddings.py')

  // prefer virtualenv python in hardware_ESP32Cam/.venv on Windows
  const venvPythonWin = path.join(workspaceRoot, 'hardware_ESP32Cam', '.venv', 'Scripts', 'python.exe')
  const venvPythonUnix = path.join(workspaceRoot, 'hardware_ESP32Cam', '.venv', 'bin', 'python')
  let pythonExe = process.env.PYTHON_PATH ?? 'python'
  if (fs.existsSync(venvPythonWin)) pythonExe = venvPythonWin
  else if (fs.existsSync(venvPythonUnix)) pythonExe = venvPythonUnix

  return new Promise((resolve) => {
    const proc = spawn(pythonExe, [scriptPath], { cwd: path.dirname(scriptPath) })
    let out = ''
    let err = ''
    proc.stdout.on('data', (d) => { out += d.toString() })
    proc.stderr.on('data', (d) => { err += d.toString() })

    // write payload to stdin
    proc.stdin.write(JSON.stringify({ name, encodings }))
    proc.stdin.end()

    proc.on('close', (code) => {
      if (code === 0) {
        // Return the encodings back to the client so the frontend can attach them to the DB record
        resolve(NextResponse.json({ ok: true, message: 'Embeddings appended', stdout: out, encodings }))
      } else {
        resolve(NextResponse.json({ ok: false, message: 'Failed to append', code, stdout: out, stderr: err }, { status: 500 }))
      }
    })
  })
}
