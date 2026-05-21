import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LiveScoresCard } from '../components/LiveScoresCard'
import { fetchLiveMatches, type LiveMatch } from '../lib/liveScores'

export function LiveScoresPage() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setError(null)
      const data = await fetchLiveMatches()
      setMatches(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load live scores')
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), 12000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="bg-gradient-to-r from-red-600 via-[#5a0a8f] to-[#400466] text-white py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-red-200 text-xs font-bold uppercase tracking-widest mb-2">Live now</p>
          <h1 className="text-3xl md:text-4xl font-black">Live Scores</h1>
          <p className="text-white/85 mt-2 max-w-xl">
            Follow ongoing Sepak Takraw matches in real time, including timeouts.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {loading && <p className="text-gray-500 text-center py-12">Loading live matches…</p>}

        {!loading && error && (
          <div className="text-center py-12 space-y-3">
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="px-4 py-2 bg-[#5a0a8f] text-white rounded-lg font-bold"
            >
              Retry
            </button>
          </div>
        )}

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

        {!loading && !error && matches.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            {matches.map((m) => (
              <LiveScoresCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
