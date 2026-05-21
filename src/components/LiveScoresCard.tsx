import type { LiveMatch } from '../lib/liveScores'

type Props = {
  match: LiveMatch
  compact?: boolean
}

export function LiveScoresCard({ match, compact = false }: Props) {
  const inTimeout = Boolean(match.timeout)

  return (
    <article
      className={`rounded-xl border-2 transition-all ${
        inTimeout
          ? 'border-amber-400 bg-amber-50/90 shadow-amber-100/50'
          : 'border-red-200/80 bg-white shadow-sm'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#5a0a8f] truncate">
            {match.tournamentTitle}
          </p>
          <p className={`font-bold text-gray-900 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
            {match.matchTitle}
          </p>
        </div>
        <span className="flex items-center gap-1 shrink-0 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
          <span className="size-1.5 rounded-full bg-white" />
          LIVE
        </span>
      </div>

      <div className={`grid grid-cols-3 gap-2 items-center ${compact ? 'mt-2' : 'mt-3'}`}>
        <p className={`font-bold text-gray-800 text-right truncate ${compact ? 'text-xs' : 'text-sm'}`}>
          {match.team1}
        </p>
        <div className="text-center">
          <p className={`font-black text-[#5a0a8f] tabular-nums ${compact ? 'text-lg' : 'text-2xl'}`}>
            {match.score.team1} – {match.score.team2}
          </p>
          {match.setScore && (
            <p className="text-[10px] text-gray-500">
              Set: {match.setScore.team1}–{match.setScore.team2}
            </p>
          )}
        </div>
        <p className={`font-bold text-gray-800 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
          {match.team2}
        </p>
      </div>

      {inTimeout && match.timeout && (
        <p className="mt-2 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg px-2 py-1.5 text-center">
          ⏱ Timeout — {match.timeout.teamName} ({match.timeout.at})
        </p>
      )}

      {match.activeRegu && !compact && (
        <p className="mt-2 text-[10px] text-gray-500 text-center">
          {match.activeRegu}
          {match.activeSet ? ` · Set ${match.activeSet}` : ''}
        </p>
      )}
    </article>
  )
}
