import type { LiveMatch, LiveReguData, LiveSetData } from '../lib/liveScores'

type Props = {
  match: LiveMatch
  compact?: boolean
}

// ─── Small helpers ────────────────────────────────────────────────────────────
/**
 * What the big number should be. While a match is live that's the points in the
 * set being played — rounds won is a slow-moving 2-0 that tells you nothing about
 * the rally in front of you. Once it's over, rounds won is the result.
 */
function headlineScore(match: LiveMatch) {
  const lastSet = (match.regus ?? []).flatMap((r) => r.sets).at(-1) ?? null
  const live = match.status === 'ongoing'
  const points = match.setScore ?? (lastSet ? { team1: lastSet.team1Score, team2: lastSet.team2Score } : null)
  const setNumber = match.activeSet ?? lastSet?.setNumber ?? null

  return {
    live,
    points,
    setNumber,
    /** The number shown per team, large. */
    value: live && points ? points : match.score,
    rounds: match.score,
  }
}


function SetRow({
  set, team1, team2,
}: { set: LiveSetData; team1: string; team2: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-10 shrink-0 font-medium">Set {set.setNumber}</span>
      <span className={`font-black tabular-nums ${set.winner === 'team1' ? 'text-[#5a0a8f]' : 'text-gray-600'}`}>
        {set.team1Score}
      </span>
      <span className="text-gray-300">–</span>
      <span className={`font-black tabular-nums ${set.winner === 'team2' ? 'text-[#5a0a8f]' : 'text-gray-600'}`}>
        {set.team2Score}
      </span>
      {set.winner && (
        <span className="ml-1 text-[10px] font-bold text-[#5a0a8f]">
          → {set.winner === 'team1' ? team1 : team2} won
        </span>
      )}
    </div>
  )
}

function ReguSummaryBlock({
  regu, team1, team2, highlight = false,
}: { regu: LiveReguData; team1: string; team2: string; highlight?: boolean }) {
  const wonBy = regu.winner === 'team1' ? team1 : regu.winner === 'team2' ? team2 : null
  const completedSets = regu.sets.filter((s) => s.winner)
  return (
    <div className={`rounded-xl px-3 py-2.5 ${highlight ? 'bg-[#5a0a8f]/5 border border-[#5a0a8f]/10' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-black text-gray-700 uppercase tracking-wide">{regu.reguName}</span>
        {wonBy ? (
          <span className="text-[10px] font-bold text-[#5a0a8f] bg-purple-50 px-2 py-0.5 rounded-full">
            ✓ {wonBy}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-gray-400 uppercase">In Progress</span>
        )}
      </div>
      {completedSets.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-0.5 mt-1">
          {completedSets.map((s) => (
            <div key={s.setNumber} className="flex items-center gap-1 text-xs text-gray-600">
              <span className="text-gray-400 text-[10px] font-medium">S{s.setNumber}</span>
              <span className={`font-bold tabular-nums ${s.winner === 'team1' ? 'text-[#5a0a8f]' : ''}`}>{s.team1Score}</span>
              <span className="text-gray-300">–</span>
              <span className={`font-bold tabular-nums ${s.winner === 'team2' ? 'text-[#5a0a8f]' : ''}`}>{s.team2Score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Compact card (used in homepage sidebar) ──────────────────────────────────

function CompactCard({ match }: { match: LiveMatch }) {
  const isLive = match.status === 'ongoing'
  const inTimeout = Boolean(match.timeout)
  const head = headlineScore(match)

  return (
    <article
      className={`rounded-xl border-2 transition-all ${
        inTimeout
          ? 'border-amber-400 bg-amber-50/90'
          : isLive
          ? 'border-red-200/80 bg-white shadow-sm'
          : 'border-gray-200 bg-gray-50'
      } p-3`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#5a0a8f] truncate flex-1">
          {match.tournamentTitle}
        </p>
        {isLive ? (
          <span className="flex items-center gap-1 shrink-0 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
            <span className="size-1.5 rounded-full bg-white" />
            LIVE
          </span>
        ) : (
          <span className="shrink-0 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            ✓ FINAL
          </span>
        )}
      </div>

      <p className="text-xs font-bold text-gray-900 truncate mb-2">{match.matchTitle}</p>

      {/* Score — one row per team, so neither name gets squeezed by a centre column */}
      <div className="space-y-1">
        {(['team1', 'team2'] as const).map((s) => {
          const other = s === 'team1' ? 'team2' : 'team1'
          const leading = head.value[s] > head.value[other]
          return (
            <div key={s} className="flex items-baseline gap-2">
              <p className="min-w-0 flex-1 truncate text-xs font-bold text-gray-800" title={match[s]}>
                {match[s]}
              </p>
              <p
                className={`shrink-0 text-xl font-black leading-none tabular-nums ${
                  leading ? 'text-[#5a0a8f]' : 'text-gray-900'
                }`}
              >
                {head.value[s]}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-[10px] font-semibold">
        {head.live ? (
          <>
            <span className="min-w-0 truncate text-gray-500">
              {[match.activeRegu, head.setNumber ? `Set ${head.setNumber}` : null].filter(Boolean).join(' · ')}
              {' · points'}
            </span>
            <span className="shrink-0 text-gray-700">
              Rounds {head.rounds.team1}–{head.rounds.team2}
            </span>
          </>
        ) : (
          <>
            <span className="min-w-0 truncate text-gray-500">
              {head.points && head.setNumber
                ? `Last set ${head.setNumber}: ${head.points.team1}–${head.points.team2}`
                : 'No sets played'}
            </span>
            <span className="shrink-0 text-gray-700">Rounds won</span>
          </>
        )}
      </div>

      {inTimeout && match.timeout && (
        <p className="mt-2 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg px-2 py-1 text-center">
          ⏱ Timeout · {match.timeout.teamName}
        </p>
      )}
    </article>
  )
}

// ─── Full card (used on Live Scores page) ─────────────────────────────────────

function FullCard({ match }: { match: LiveMatch }) {
  const isLive = match.status === 'ongoing'
  const inTimeout = Boolean(match.timeout)
  const head = headlineScore(match)

  // Derive active regu data
  const activeReguData = (match.regus ?? []).find((r) => r.reguName === match.activeRegu)
  const completedSetsInRegu = (activeReguData?.sets ?? []).filter((s) => s.winner)
  const allCompletedSetsInRegu = activeReguData?.sets ?? []

  // Regus that are fully done (have a winner and aren't the active regu)
  const completedRegus = (match.regus ?? []).filter(
    (r) => r.winner && r.reguName !== match.activeRegu
  )

  // Substitutions only for the active regu
  const activeSubs = (match.substitutions ?? []).filter(
    (s) => s.reguName === match.activeRegu
  )

  // Whether active regu is just starting (no sets played yet)
  const reguJustStarted = activeReguData && activeReguData.sets.length === 0
  const prevCompletedRegu = completedRegus[completedRegus.length - 1]

  return (
    <article
      className={`rounded-2xl border-2 overflow-hidden transition-all shadow-sm ${
        inTimeout
          ? 'border-amber-400'
          : isLive
          ? 'border-red-200'
          : 'border-gray-200'
      }`}
    >
      {/* ── Header bar ── */}
      <div className={`px-4 pt-4 pb-3 ${isLive && !inTimeout ? 'bg-white' : inTimeout ? 'bg-amber-50' : 'bg-gray-50'}`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#5a0a8f] truncate flex-1">
            {match.tournamentTitle}
          </p>
          {isLive ? (
            <span className="flex items-center gap-1 shrink-0 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
              <span className="size-1.5 rounded-full bg-white" />
              LIVE
            </span>
          ) : (
            <span className="shrink-0 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
              ✓ FINAL
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-gray-800 leading-snug">{match.matchTitle}</p>
      </div>

      {/* ── Overall score (regus won) ── */}
      <div className={`px-4 py-4 border-b ${isLive ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200'}`}>
        {/* Winner banner for completed */}
        {!isLive && match.winner && (
          <div className="mb-3 text-center">
            <span className="inline-block bg-emerald-600 text-white text-xs font-black px-4 py-1.5 rounded-full">
              🏆 {match.winner === 'team1' ? match.team1 : match.winner === 'team2' ? match.team2 : 'TIE'} WINS!
            </span>
          </div>
        )}
        <div className="grid grid-cols-3 items-center gap-2">
          <p className="text-right text-sm font-bold leading-tight text-gray-900">{match.team1}</p>
          <div className="text-center">
            <p className="text-3xl font-black leading-none tabular-nums text-[#5a0a8f]">
              {head.value.team1} – {head.value.team2}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-gray-500">
              {head.live
                ? head.setNumber
                    ? `Set ${head.setNumber} points`
                    : 'Points'
                : 'Rounds won'}
            </p>
          </div>
          <p className="text-sm font-bold leading-tight text-gray-900">{match.team2}</p>
        </div>

        <p className="mt-2 text-center text-xs font-semibold text-gray-500">
          {head.live ? (
            <>
              Rounds won{' '}
              <span className="font-black tabular-nums text-gray-800">
                {head.rounds.team1} – {head.rounds.team2}
              </span>
            </>
          ) : head.points && head.setNumber ? (
            <>
              Last set {head.setNumber}{' '}
              <span className="font-black tabular-nums text-gray-800">
                {head.points.team1} – {head.points.team2}
              </span>
            </>
          ) : null}
        </p>
      </div>

      {/* ─────────────────── LIVE MATCH DETAIL ─────────────────── */}
      {isLive && match.activeRegu && (
        <div className="bg-white">

          {/* Regu just starting — transition banner */}
          {reguJustStarted && prevCompletedRegu && (
            <div className="mx-4 mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-center">
              <p className="text-xs font-black text-emerald-700 uppercase tracking-wide">
                {prevCompletedRegu.reguName} Complete
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                {prevCompletedRegu.winner === 'team1' ? match.team1 : match.team2} won&nbsp;
                {prevCompletedRegu.team1Score}–{prevCompletedRegu.team2Score}
              </p>
            </div>
          )}

          {/* Active regu + set phase pill */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-900 uppercase">{match.activeRegu}</span>
              {match.activeSet && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm font-bold text-gray-600">Set {match.activeSet}</span>
                </>
              )}
            </div>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide ${
              inTimeout
                ? 'bg-amber-200 text-amber-900'
                : reguJustStarted
                ? 'bg-blue-100 text-blue-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {inTimeout ? '⏱ Timeout' : reguJustStarted ? 'Starting' : '● In Progress'}
            </span>
          </div>

          {/* ⏱ Timeout banner */}
          {inTimeout && match.timeout && (
            <div className="mx-4 mb-3 bg-amber-100 border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl leading-none">⏱</span>
              <div>
                <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Timeout Called</p>
                <p className="text-sm font-black text-amber-800">{match.timeout.teamName}</p>
              </div>
            </div>
          )}

          {/* The live set points are the headline above — not repeated here. */}

          {/* Completed sets in the active regu */}
          {completedSetsInRegu.length > 0 && (
            <div className="mx-4 mb-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                {match.activeRegu} · Set Results
              </p>
              <div className="space-y-1">
                {allCompletedSetsInRegu
                  .filter((s) => s.winner)
                  .map((s) => (
                    <SetRow key={s.setNumber} set={s} team1={match.team1} team2={match.team2} />
                  ))}
              </div>
            </div>
          )}

          {/* Substitutions in the active regu */}
          {activeSubs.length > 0 && (
            <div className="mx-4 mb-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Substitutions — {match.activeRegu}
              </p>
              <div className="space-y-1.5">
                {activeSubs.map((sub, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-1.5 text-xs bg-blue-50 border border-blue-100 rounded-xl px-3 py-2"
                  >
                    <span className="text-blue-500 font-black">↕</span>
                    <span className="font-bold text-gray-500 truncate max-w-[90px]">{sub.teamLabel}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-red-600 font-bold">
                      {sub.playerOutJerseyNumber != null ? `#${sub.playerOutJerseyNumber} ` : ''}
                      {sub.playerOutName} <span className="font-black">OUT</span>
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-emerald-600 font-bold">
                      {sub.playerInJerseyNumber != null ? `#${sub.playerInJerseyNumber} ` : ''}
                      {sub.playerInName} <span className="font-black">IN</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previously completed regus */}
          {completedRegus.length > 0 && (
            <div className="mx-4 mb-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Previous Regus
              </p>
              <div className="space-y-2">
                {completedRegus.map((r) => (
                  <ReguSummaryBlock key={r.reguName} regu={r} team1={match.team1} team2={match.team2} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────── COMPLETED MATCH DETAIL ─────────────────── */}
      {!isLive && (
        <div className="bg-gray-50 px-4 py-4">
          {(match.regus ?? []).filter((r) => r.sets.length > 0 || r.winner).length > 0 ? (
            <div className="space-y-2">
              {(match.regus ?? [])
                .filter((r) => r.sets.length > 0 || r.winner)
                .map((r) => (
                  <ReguSummaryBlock
                    key={r.reguName}
                    regu={r}
                    team1={match.team1}
                    team2={match.team2}
                    highlight={r.winner != null}
                  />
                ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">No set data recorded.</p>
          )}

          {/* Substitutions for completed match (all of them) */}
          {(match.substitutions ?? []).length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Substitutions</p>
              <div className="space-y-1.5">
                {match.substitutions.map((sub, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-1.5 text-xs bg-white border border-gray-100 rounded-xl px-3 py-2"
                  >
                    <span className="text-[10px] text-gray-400 font-medium">{sub.reguName}</span>
                    <span className="text-gray-200">·</span>
                    <span className="font-bold text-gray-500 truncate max-w-[80px]">{sub.teamLabel}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-red-500 font-bold">
                      {sub.playerOutJerseyNumber != null ? `#${sub.playerOutJerseyNumber} ` : ''}
                      {sub.playerOutName} OUT
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-emerald-600 font-bold">
                      {sub.playerInJerseyNumber != null ? `#${sub.playerInJerseyNumber} ` : ''}
                      {sub.playerInName} IN
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="h-1" />
    </article>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function LiveScoresCard({ match, compact = false }: Props) {
  return compact ? <CompactCard match={match} /> : <FullCard match={match} />
}
