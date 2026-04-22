const express = require('express')
const bodyParser = require('body-parser')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const compression = require('compression')

const app = express()
const PORT = process.env.PORT || 4000

app.use(bodyParser.json())

// Production static assets (built frontend)
const distPath = path.join(__dirname, '../frontend/dist')
app.use(compression())

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        // don't aggressively cache HTML so new deployments load immediately
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      }
    }
  }))
} else {
  // fall back to serving frontend source (dev) if dist not available
  app.use(express.static(path.join(__dirname, '../frontend')))
}

app.post('/api/run', (req, res) => {
  const { input, options } = req.body || {}

  // Determine executable path (try main, then main.exe)
  let exePath = path.join(__dirname, '../main')
  if (!fs.existsSync(exePath)) {
    if (fs.existsSync(exePath + '.exe')) exePath = exePath + '.exe'
    else if (fs.existsSync(path.join(__dirname, '../main.exe'))) exePath = path.join(__dirname, '../main.exe')
    else return res.status(500).json({ error: `Executable not found. Expected ${exePath} or ${exePath}.exe` })
  }

  const child = spawn(exePath, [], { stdio: ['pipe', 'pipe', 'pipe'] })

  // Safely buffer stdout/stderr as Buffers and cap total size to avoid memory blowups.
  const MAX_BYTES = 2 * 1024 * 1024 // 2MB
  let stdoutBuffers = []
  let stderrBuffers = []
  let stdoutBytes = 0
  let stderrBytes = 0
  let truncated = false
  let killTimer = null

  child.stdout.on('data', (chunk) => {
    if (truncated) return
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    stdoutBytes += buf.length
    if (stdoutBytes <= MAX_BYTES) stdoutBuffers.push(buf)
    else {
      const allowed = MAX_BYTES - (stdoutBytes - buf.length)
      if (allowed > 0) stdoutBuffers.push(buf.slice(0, allowed))
      truncated = true
      try { child.kill() } catch (e) {}
    }
  })

  child.stderr.on('data', (chunk) => {
    if (truncated) return
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    stderrBytes += buf.length
    if (stderrBytes <= MAX_BYTES) stderrBuffers.push(buf)
    else {
      const allowed = MAX_BYTES - (stderrBytes - buf.length)
      if (allowed > 0) stderrBuffers.push(buf.slice(0, allowed))
      truncated = true
      try { child.kill() } catch (e) {}
    }
  })

  child.on('error', (err) => {
    if (!res.headersSent) res.status(500).json({ error: `Failed to start process: ${err.message}` })
  })

  child.on('close', (code) => {
    if (killTimer) clearTimeout(killTimer)
    const outStr = Buffer.concat(stdoutBuffers).toString()
    const errStr = Buffer.concat(stderrBuffers).toString()
    if (truncated) return res.status(500).json({ error: 'Process output too large and was terminated', partial: outStr, stderr: errStr })
    if (code !== 0) return res.status(500).json({ error: errStr || `Process exited ${code}` })
    res.json({ output: outStr })
  })

  // Prepare stdin: if client sent empty input, send '7' (Exit) to avoid interactive loops.
  let inputToSend = typeof input === 'string' ? input : ''
  if (!inputToSend || inputToSend.trim() === '') {
    inputToSend = '7\n'
  } else {
    if (!inputToSend.endsWith('\n')) inputToSend += '\n'
  }

  try { child.stdin.write(inputToSend) } catch (e) {}
  if (options) {
    const optStr = typeof options === 'string' ? options : JSON.stringify(options)
    try { child.stdin.write('\n' + optStr + '\n') } catch (e) {}
  }
  try { child.stdin.end() } catch (e) {}

  // Safety timeout: kill child if it runs too long (10s)
  killTimer = setTimeout(() => {
    truncated = true
    try { child.kill() } catch (e) {}
  }, 10_000)
})

// fallback: serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

app.listen(PORT, () => console.log(`Server listening ${PORT}`))
