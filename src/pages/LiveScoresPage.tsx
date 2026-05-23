import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LiveScoresCard } from '../components/LiveScoresCard'
import { fetchLiveMatches, type LiveMatch } from '../lib/liveScores'

export function LiveScoresPage() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Incrementing this triggers the effect to re-run with a fresh AbortController (Retry button)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        setError(null)
        const data = await fetchLiveMatches(controller.signal)
        if (!controller.signal.aborted) {
          setMatches(data)
          setLoading(false)
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Failed to load live scores')
          setMatches([])
          setLoading(false)
        }
      }
    }

    void load()
    const id = window.setInterval(() => void load(), 30000)
    return () => {
      controller.abort()
      window.clearInterval(id)
    }
  }, [retryKey])

  const liveMatches = matches.filter((m) => m.status === 'ongoing')
  const recentMatches = matches.filter((m) => m.status === 'completed')

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-red-600 via-[#5a0a8f] to-[#400466] text-white py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-red-200 text-xs font-bold uppercase tracking-widest mb-2">Live now</p>
          <h1 className="text-3xl md:text-4xl font-black">Live Scores</h1>
          <p className="text-white/85 mt-2 max-w-xl">
            Follow ongoing Sepak Takraw matches in real time — sets, timeouts, substitutions, and more.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-16 gap-4 text-gray-500">
            <div className="w-10 h-10 border-4 border-[#5a0a8f] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading match data…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-12 space-y-3">
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => { setLoading(true); setRetryKey((k) => k + 1) }}
              className="px-4 py-2 bg-[#5a0a8f] text-white rounded-lg font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* No matches at all */}
        {!loading && !error && matches.length === 0 && (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">sports</span>
            <p className="text-gray-600 font-semibold">No live matches right now</p>
            <p className="text-sm text-gray-500 mt-1">Check back when a match is in progress.</p>
            <Link to="/" className="inline-block mt-4 text-[#5a0a8f] font-bold hover:underline">
              Back to home
            </Link>
          </div>
        )}

        {/* No live matches but there are recent results */}
        {!loading && !error && liveMatches.length === 0 && recentMatches.length > 0 && (
          <div className="text-center py-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-700 font-semibold">No live matches right now — showing recent results below.</p>
          </div>
        )}

        {/* ── Live matches ── */}
        {!loading && !error && liveMatches.length > 0 && (
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
        {!loading && !error && recentMatches.length > 0 && (
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
