import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LiveScoresCard } from '../components/LiveScoresCard'
import { fetchLiveMatches, type LiveMatch } from '../lib/liveScores'
import { API_BASE_URL } from '../lib/api'

type ConnectionState = 'connecting' | 'live' | 'error' | 'reconnecting'

export function LiveScoresPage() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [, setError] = useState<string | null>(null)
  const [connState, setConnState] = useState<ConnectionState>('connecting')
  // Incrementing this re-mounts the effect (manual Retry)
  const [retryKey, setRetryKey] = useState(0)

  // Track how many consecutive SSE errors we've seen so we can fall back to polling
  const sseErrorCount = useRef(0)
  const pollFallbackId = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let es: EventSource | null = null
    let destroyed = false

    // ── Polling fallback ─────────────────────────────────────────────────────
    // Used only when SSE is unavailable. Runs every 15 s — much less often than
    // the old 30 s interval, because SSE already pushes instant updates normally.
    const startPollingFallback = () => {
      if (pollFallbackId.current) return // already running
      const id = setInterval(async () => {
        try {
          const data = await fetchLiveMatches()
          if (!destroyed) setMatches(data)
        } catch { /* ignore — SSE might recover */ }
      }, 15_000)
      pollFallbackId.current = id
    }

    const stopPollingFallback = () => {
      if (pollFallbackId.current) {
        clearInterval(pollFallbackId.current)
        pollFallbackId.current = null
      }
    }

    // ── Open SSE stream ──────────────────────────────────────────────────────
    const connect = () => {
      const url = `${API_BASE_URL}/tournaments/live-matches/stream`
      es = new EventSource(url)

      es.onopen = () => {
        if (destroyed) return
        sseErrorCount.current = 0
        setConnState('live')
        setError(null)
        stopPollingFallback() // SSE is working — stop polling
      }

      es.onmessage = (event: MessageEvent) => {
        if (destroyed) return
        try {
          const payload = JSON.parse(event.data as string) as { matches: LiveMatch[] }
          if (Array.isArray(payload.matches)) {
            setMatches(payload.matches)
            setLoading(false)
            setConnState('live')
            setError(null)
          }
        } catch {
          // ignore malformed frames
        }
      }

      es.onerror = () => {
        if (destroyed) return
        sseErrorCount.current += 1
        setConnState('reconnecting')

        if (sseErrorCount.current >= 3) {
          // SSE keeps failing — activate polling fallback so the page stays usable
          startPollingFallback()
          setConnState('error')
        }
        // EventSource auto-reconnects; we don't need to call connect() manually
      }
    }

    connect()

    return () => {
      destroyed = true
      es?.close()
      stopPollingFallback()
    }
  }, [retryKey])

  const liveMatches = matches.filter((m) => m.status === 'ongoing')
  const recentMatches = matches.filter((m) => m.status === 'completed')

  const handleRetry = () => {
    sseErrorCount.current = 0
    setLoading(true)
    setError(null)
    setConnState('connecting')
    setRetryKey((k) => k + 1)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-red-600 via-[#5a0a8f] to-[#400466] text-white py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-red-200 text-xs font-bold uppercase tracking-widest">Live now</p>
            {/* Connection indicator */}
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              connState === 'live'
                ? 'bg-white/20 text-white'
                : connState === 'reconnecting'
                ? 'bg-amber-400/30 text-amber-200'
                : connState === 'error'
                ? 'bg-red-400/30 text-red-200'
                : 'bg-white/10 text-white/60'
            }`}>
              <span className={`size-1.5 rounded-full ${
                connState === 'live' ? 'bg-green-400 animate-pulse' :
                connState === 'reconnecting' ? 'bg-amber-400 animate-pulse' :
                connState === 'error' ? 'bg-red-400' : 'bg-white/40'
              }`} />
              {connState === 'live' ? 'Connected' :
               connState === 'reconnecting' ? 'Reconnecting…' :
               connState === 'error' ? 'Polling fallback' : 'Connecting…'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black">Live Scores</h1>
          <p className="text-white/85 mt-2 max-w-xl">
            Scores update instantly as the admin records them — no refresh needed.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-16 gap-4 text-gray-500">
            <div className="w-10 h-10 border-4 border-[#5a0a8f] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Connecting to live scores…</p>
          </div>
        )}

        {/* Error with retry */}
        {!loading && connState === 'error' && (
          <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm text-amber-800 font-semibold">
              Live connection unavailable — showing scores via polling.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="ml-4 shrink-0 text-sm font-bold text-[#5a0a8f] hover:underline"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* No matches */}
        {!loading && matches.length === 0 && (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">sports</span>
            <p className="text-gray-600 font-semibold">No live matches right now</p>
            <p className="text-sm text-gray-500 mt-1">Check back when a match is in progress.</p>
            <Link to="/" className="inline-block mt-4 text-[#5a0a8f] font-bold hover:underline">
              Back to home
            </Link>
          </div>
        )}

        {/* No live but has recent results */}
        {!loading && liveMatches.length === 0 && recentMatches.length > 0 && (
          <div className="text-center py-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-700 font-semibold">
              No live matches right now — showing recent results below.
            </p>
          </div>
        )}

        {/* ── Live matches ── */}
        {!loading && liveMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full animate-pulse">
                <span className="size-2 rounded-full bg-white" />
                LIVE
              </span>
              <h2 className="text-xl font-black text-gray-900">Matches in Progress</h2>
              <span className="text-sm text-gray-400 font-medium">({liveMatches.length})</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {liveMatches.map((m) => (
                <LiveScoresCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}

        {/* ── Recently completed ── */}
        {!loading && recentMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-full">
                ✓ FINAL
              </span>
              <h2 className="text-xl font-black text-gray-900">Recent Results</h2>
              <span className="text-sm text-gray-400 font-medium">last 24 hrs</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {recentMatches.map((m) => (
                <LiveScoresCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}

      </section>
    </main>
  )
}
