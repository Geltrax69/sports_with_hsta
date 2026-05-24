import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchPlayer } from '../lib/playersApi'
import type { Player } from '../types/player'
import { useDistricts } from '../context/DistrictsContext'

// ─── small helpers ────────────────────────────────────────────────────────────

function Avatar({ src, name }: { src: string; name: string }) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=5a0a8f&color=fff&size=320&bold=true&format=svg`
  return (
    <img
      alt={`Profile of ${name}`}
      src={src || fallback}
      width={160}
      height={160}
      loading="eager"
      className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl object-cover shrink-0"
      onError={(e) => {
        const el = e.target as HTMLImageElement
        if (el.src !== fallback) el.src = fallback
      }}
    />
  )
}

interface GameStatProps { value: number; label: string; accent?: boolean }
function GameStat({ value, label, accent }: GameStatProps) {
  return (
    <div className={`flex flex-col items-center rounded-2xl px-4 py-4 min-w-[80px] ${
      accent ? 'bg-[#5a0a8f] text-white' : 'bg-gray-50 border border-gray-200'
    }`}>
      <span className={`text-3xl font-black leading-none ${accent ? 'text-white' : 'text-[#5a0a8f]'}`}>
        {value}
      </span>
      <span className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 text-center ${
        accent ? 'text-white/80' : 'text-gray-500'
      }`}>
        {label}
      </span>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function PlayerDetailPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const { getDistrictById } = useDistricts()
  const [player, setPlayer]   = useState<Player | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId) { setLoading(false); return }
    const controller = new AbortController()
    setLoading(true)
    fetchPlayer(playerId, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setPlayer(data) })
      .catch(() => { if (!controller.signal.aborted) setPlayer(undefined) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => { controller.abort() }
  }, [playerId])

  if (loading) {
    return (
      <main className="flex-grow w-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#5a0a8f] border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading player profile…</p>
        </div>
      </main>
    )
  }

  if (!player) {
    return (
      <main className="flex-grow w-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-gray-400">person_off</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Player Not Found</h1>
          <p className="text-gray-500 mb-6 text-sm">This profile may have been removed or the link is incorrect.</p>
          <Link
            to="/players"
            className="inline-flex items-center gap-2 bg-[#5a0a8f] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#400466] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Players
          </Link>
        </div>
      </main>
    )
  }

  const hasGames =
    (player.districtGames ?? 0) > 0 ||
    (player.stateGames ?? 0) > 0 ||
    (player.nationalGames ?? 0) > 0 ||
    (player.internationalGames ?? 0) > 0

  const hasCareerStats =
    (player.goldMedals ?? 0) > 0 || (player.silverMedals ?? 0) > 0 || hasGames

  return (
    <main className="flex-grow w-full bg-gray-50">

      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden bg-gray-900">
        {/* Background sport image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-top opacity-30"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBQkZ3uNiS3toCeitYMgI3en60sbHGrCFfS_mrSJR_zBr25ZEpm3jApXKID8GmpUBbzhJGl3Rlpwm0TnepehtJcUJ-zfEx3ky6DecBLi6sXU4qbvE8n_TewEKhZBFUqp28mnYd_FWOSl9pdfv-Df3FEkrwCka2vaLflSvMhRjbQfsc8vbcockhtk-wV1GBDI5oYK_gIYb8YmUbBBr0LJsTsSHf5x-ow8cJ-6tozDP1aDYmSNn6NJFUZiZqCbftjCQlDZ18Nk1PaopU0")',
          }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-900/80 to-[#5a0a8f]/30 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent z-10" />

        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-white/60 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <Link to="/players" className="hover:text-white transition-colors">Players</Link>
            <span>›</span>
            <span className="text-white/90">{player.name}</span>
          </div>

          {/* Profile header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Avatar */}
            <Avatar src={player.image} name={player.name} />

            {/* Info */}
            <div className="flex-1 min-w-0 pb-1">
              {/* Chips row */}
              <div className="flex flex-wrap gap-2 mb-3">
                {player.playerType && (
                  <span className="inline-flex items-center rounded-full bg-[#5a0a8f]/80 backdrop-blur-sm border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    {player.playerType === 'national' ? '🇮🇳 National Player' : '🌍 International Player'}
                  </span>
                )}
                {player.category && (
                  <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    {player.category}
                  </span>
                )}
                {player.badge && (
                  <span className="inline-flex items-center rounded-full bg-[#fcd34d] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-900">
                    {player.badge}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none mb-3">
                {player.name}
              </h1>

              {/* Role + Location */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
                {player.role && (
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px] text-[#a78bfa]">track_changes</span>
                    <span className="font-semibold">{player.role}</span>
                  </div>
                )}
                {player.state && (
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px] text-[#a78bfa]">location_on</span>
                    <span>{getDistrictById(player.state)?.name || player.state}, India</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Games played quick-stats (shown in hero) ── */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { label: 'District Games', value: player.districtGames ?? 0 },
              { label: 'State Games',    value: player.stateGames    ?? 0 },
              { label: 'National Games', value: player.nationalGames  ?? 0 },
              { label: 'Intl. Games',    value: player.internationalGames ?? 0 },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 min-w-[90px]"
              >
                <span className="text-2xl font-black text-white leading-none">{value}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/70 mt-1 text-center">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left column ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Personal Details */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#5a0a8f]">person</span>
                Personal Details
              </h2>
              <dl className="space-y-3 text-sm">
                {player.dob && (
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">Date of Birth</dt>
                    <dd className="font-semibold text-gray-900">{player.dob}</dd>
                  </div>
                )}
                {player.age > 0 && (
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">Age</dt>
                    <dd className="font-semibold text-gray-900">{player.age} yrs</dd>
                  </div>
                )}
                {player.height && (
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">Height</dt>
                    <dd className="font-semibold text-gray-900">{player.height}</dd>
                  </div>
                )}
                {player.weight && (
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">Weight</dt>
                    <dd className="font-semibold text-gray-900">{player.weight}</dd>
                  </div>
                )}
                {player.state && (
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">District</dt>
                    <dd className="font-semibold text-gray-900">{getDistrictById(player.state)?.name || player.state}</dd>
                  </div>
                )}
                {player.category && (
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <dt className="text-gray-500">Category</dt>
                    <dd>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        {player.category}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Skills */}
            {player.skills && player.skills.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#5a0a8f]">bolt</span>
                  Skills &amp; Strengths
                </h2>
                <div className="flex flex-wrap gap-2">
                  {player.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Biography */}
            {player.biography && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-[#5a0a8f]">menu_book</span>
                  Biography
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm">{player.biography}</p>
              </div>
            )}

            {/* Career Statistics */}
            {hasCareerStats && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-[#5a0a8f]">emoji_events</span>
                  Career Statistics
                </h2>

                {/* Medals */}
                {((player.goldMedals ?? 0) > 0 || (player.silverMedals ?? 0) > 0) && (
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Medals</p>
                    <div className="flex flex-wrap gap-4">
                      {(player.goldMedals ?? 0) > 0 && (
                        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
                          <span className="text-3xl">🥇</span>
                          <div>
                            <p className="text-2xl font-black text-gray-900 leading-none">{player.goldMedals}</p>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">Gold Medals</p>
                          </div>
                        </div>
                      )}
                      {(player.silverMedals ?? 0) > 0 && (
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
                          <span className="text-3xl">🥈</span>
                          <div>
                            <p className="text-2xl font-black text-gray-900 leading-none">{player.silverMedals}</p>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">Silver Medals</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Games Played */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Games Played</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <GameStat label="District Games"       value={player.districtGames      ?? 0} />
                    <GameStat label="State Games"          value={player.stateGames         ?? 0} />
                    <GameStat label="National Games"       value={player.nationalGames      ?? 0} accent />
                    <GameStat label="International Games"  value={player.internationalGames ?? 0} accent />
                  </div>
                </div>
              </div>
            )}

            {/* Tournament History */}
            {player.tournaments && player.tournaments.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
                  <span className="material-symbols-outlined text-[22px] text-[#5a0a8f]">military_tech</span>
                  <h2 className="text-xl font-bold text-gray-900">Tournament History</h2>
                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-[#5a0a8f]/10 px-3 py-0.5 text-xs font-bold text-[#5a0a8f]">
                    {player.tournaments.length}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Event', 'Year', 'Category', 'Team', 'Result'].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {player.tournaments.map((t, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-gray-900">{t.eventName}</td>
                          <td className="px-5 py-3.5 text-gray-600">{t.year}</td>
                          <td className="px-5 py-3.5 text-gray-600">{t.category}</td>
                          <td className="px-5 py-3.5 text-gray-600">{t.team}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                                t.result === 'GOLD'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : t.result === 'SILVER'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {t.result === 'GOLD' ? '🥇' : t.result === 'SILVER' ? '🥈' : '🥉'}
                              {t.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

    </main>
  )
}
