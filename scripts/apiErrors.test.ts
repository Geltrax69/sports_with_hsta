// Run: npx tsx scripts/apiErrors.test.ts
// Exercises apiRequest against a real local server, so the classification is
// tested through fetch rather than against a mock of it.
import assert from 'node:assert/strict'
import http from 'node:http'

const server = http.createServer((req, res) => {
  const url = req.url || ''
  if (url.startsWith('/api/client-errors')) { res.writeHead(204).end(); return }
  if (url.startsWith('/api/slow')) { return } // never answers → client-side timeout
  if (url.startsWith('/api/boom')) {
    res.writeHead(500, { 'Content-Type': 'application/json', 'X-Request-Id': 'srv-123' })
    res.end(JSON.stringify({ error: 'Internal Server Error', requestId: 'srv-123' })); return
  }
  if (url.startsWith('/api/busy')) {
    res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '42' })
    res.end(JSON.stringify({ error: 'Too many registration attempts' })); return
  }
  if (url.startsWith('/api/huge')) {
    res.writeHead(413, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'File too large' })); return
  }
  if (url.startsWith('/api/dupe')) {
    res.writeHead(409, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'This Aadhaar number is already registered' })); return
  }
  res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true }))
})
await new Promise<void>((r) => server.listen(0, r))
const port = (server.address() as { port: number }).port
process.env.VITE_API_BASE_URL = `http://127.0.0.1:${port}/api`

// Minimal browser globals the module expects.
;(globalThis as any).window = { setTimeout, clearTimeout, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { href: 'http://test/register' } }
;(globalThis as any).navigator = { onLine: true, userAgent: 'test' }

const { apiRequest, ApiError } = await import('../src/lib/api.ts')

const failed = async (path: string, init?: RequestInit & { timeoutMs?: number }) => {
  try {
    await apiRequest(path, init as never)
    assert.fail(`${path} should have thrown`)
  } catch (e) {
    assert.ok(e instanceof ApiError, `${path} threw ${(e as Error).name}, expected ApiError`)
    return e as InstanceType<typeof ApiError>
  }
}

// A 500 is named as our problem, not the user's connection.
const boom = await failed('/boom')
assert.equal(boom.kind, 'server')
assert.equal(boom.status, 500)
assert.equal(boom.requestId, 'srv-123', 'server request id is carried for support')
assert.match(boom.message, /problem on our side/)
assert.doesNotMatch(boom.message, /check your connection/i, 'a server fault must not tell the user to check their connection')

// Rate limiting says how long to wait, using the server's own Retry-After.
const busy = await failed('/busy')
assert.equal(busy.kind, 'ratelimit')
assert.match(busy.message, /wait 42 seconds/)

// Oversized uploads name the limit.
const huge = await failed('/huge')
assert.equal(huge.kind, 'too-large')
assert.match(huge.message, /under 5 MB/)

// A 4xx repeats the server's own explanation rather than inventing one.
const dupe = await failed('/dupe', { method: 'POST', body: '{}' })
assert.equal(dupe.kind, 'client')
assert.equal(dupe.message, 'This Aadhaar number is already registered')

// A timeout on a write warns that it may have gone through anyway.
const slow = await failed('/slow', { method: 'POST', body: '{}', timeoutMs: 300 })
assert.equal(slow.kind, 'timeout')
assert.match(slow.message, /may still have received/)
assert.equal(slow.attempts, 1, 'a POST that timed out is never retried')

// The same timeout on a read just asks the user to try again.
const slowRead = await failed('/slow', { timeoutMs: 300 })
assert.equal(slowRead.kind, 'timeout')
assert.doesNotMatch(slowRead.message, /may still have received/)

// Offline is reported as offline — not as a timeout.
;(globalThis as any).navigator.onLine = false
const off = await failed('/ok')
assert.equal(off.kind, 'offline')
assert.match(off.message, /offline/)
assert.equal(off.attempts, 0, 'nothing is sent while offline')
;(globalThis as any).navigator.onLine = true

// FormData bodies get the upload timeout without the caller asking for it.
const fd = new FormData()
fd.append('x', 'y')
const started = Date.now()
const upload = await failed('/slow', { method: 'POST', body: fd, timeoutMs: 400 })
assert.equal(upload.kind, 'timeout')
assert.match(upload.message, /2 minutes|files too large/, 'upload wording, not the generic one')
assert.ok(Date.now() - started >= 350)

server.close()
console.log('apiRequest error classification: all checks passed')
