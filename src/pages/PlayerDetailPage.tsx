import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Player } from '../data/playersData'
import { fetchDirectoryPlayer, toDisplayPlayer } from '../lib/directoryPlayers'

export function PlayerDetailPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const [player, setPlayer] = useState<Player | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId) {
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchDirectoryPlayer(playerId)
        if (!cancelled) setPlayer(toDisplayPlayer(data))
      } catch {
        if (!cancelled) setPlayer(undefined)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [playerId])

  if (loading) {
    return (
      <main className="flex-grow w-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-500">Loading player profile...</div>
      </main>
    )
  }

  if (!player) {
    return (
      <main className="flex-grow w-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Player Not Found</h1>
          <a href={`${import.meta.env.BASE_URL}players`} className="text-[#5a0a8f] hover:underline">
            Back to Players
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-grow w-full">
      <section className="relative w-full overflow-hidden bg-gray-900 min-h-[400px]">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBQkZ3uNiS3toCeitYMgI3en60sbHGrCFfS_mrSJR_zBr25ZEpm3jApXKID8GmpUBbzhJGl3Rlpwm0TnepehtJcUJ-zfEx3ky6DecBLi6sXU4qbvE8n_TewEKhZBFUqp28mnYd_FWOSl9pdfv-Df3FEkrwCka2vaLflSvMhRjbQfsc8vbcockhtk-wV1GBDI5oYK_gIYb8YmUbBBr0LJTsSHf5x-ow8cJ-6tozDP1aDYmSNn6NJFUZiZqCbftjCQlDZ18Nk1PaopU0")',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/70 z-10"></div>
        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-xs font-medium text-white/70 mb-6">
            <a href={import.meta.env.BASE_URL} className="hover:text-white transition-colors">
              Home
            </a>
            <span className="opacity-50">›</span>
            <a href={`${import.meta.env.BASE_URL}players`} className="hover:text-white transition-colors">
              Players
            </a>
            <span className="opacity-50">›</span>
            <span className="text-white">{player.name}</span>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <img
                alt={`Profile of ${player.name}`}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl object-cover"
                src={player.image}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=random&size=160&bold=true`
                }}
              />
            </div>
            <div className="flex-1 text-white">
              <h1 className="text-4xl md:text-5xl font-black mb-3">{player.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-white/90 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">track_changes</span>
                  <span>{player.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">location_on</span>
                  <span>{player.state}, India</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#5a0a8f] to-[#7c3aed] p-6 text-white shadow-xl">
                {player.rankChange && player.rankChange > 0 && (
                  <div className="absolute top-3 right-3 bg-[#fcd34d] text-gray-900 text-[10px] font-bold uppercase px-2 py-1 rounded">
                    ELITE
                  </div>
                )}
                <div className="mb-2">
                  <p className="text-sm text-white/80 mb-1">National Rank</p>
                  <p className="text-5xl font-black">{player.rank}</p>
                  {player.rankDescription && (
                    <p className="text-xs text-white/70 mt-2">{player.rankDescription}</p>
                  )}
                </div>
                {player.rankChange && player.rankChange > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-lg">trending_up</span>
                    <span>Up {player.rankChange} spots this season</span>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-gray-600">person</span>
                  Personal Details
                </h2>
                <div className="space-y-3 text-sm">
                  {player.dob && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date of Birth:</span>
                      <span className="font-medium text-gray-900">{player.dob}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium text-gray-900">{player.age} Years</span>
                  </div>
                  {player.height && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Height:</span>
                      <span className="font-medium text-gray-900">{player.height}</span>
                    </div>
                  )}
                  {player.weight && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium text-gray-900">{player.weight}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-600">Category:</span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                      {player.category}
                    </span>
                  </div>
                </div>
              </div>

              {player.skills && player.skills.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Skills &amp; Strengths</h2>
                  <div className="flex flex-wrap gap-2">
                    {player.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-amber-50 text-amber-900 px-3 py-1.5 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-8">
              {player.biography && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Biography</h2>
                  <p className="text-gray-700 leading-relaxed">{player.biography}</p>
                </div>
              )}

              {(player.goldMedals !== undefined || player.silverMedals !== undefined) && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Career Statistics</h2>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    {player.goldMedals !== undefined && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-2xl font-black text-[#5a0a8f] mb-1">{player.goldMedals}</p>
                        <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                          GOLD MEDALS
                        </p>
                      </div>
                    )}
                    {player.silverMedals !== undefined && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-2xl font-black text-gray-700 mb-1">{player.silverMedals}</p>
                        <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                          SILVER MEDALS
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {player.tournaments && player.tournaments.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournament History</h2>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                              Event Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                              Year
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                              Category
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                              Team
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                              Result
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {player.tournaments.map((tournament, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {tournament.eventName}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{tournament.year}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{tournament.category}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{tournament.team}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${tournament.result === 'GOLD'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : tournament.result === 'SILVER'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-amber-100 text-amber-800'
                                    }`}
                                >
                                  {tournament.result}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
