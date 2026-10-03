import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../../lib/api'
import { isTournamentOpen, type DistrictTeam, type TournamentOption } from '../../lib/districtApi'
import { eventTypesLabel, tournamentEventTypes } from '../../lib/eventFormat'
import { genderCategoriesLabel, tournamentGenderCategories } from '../../lib/tournamentFormOptions'
import { TeamFormModal } from '../../components/district/TeamFormModal'

const formatDate = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function DistrictTournaments() {
  const [tournaments, setTournaments] = useState<TournamentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTournament, setActiveTournament] = useState<TournamentOption | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    apiRequest<{ tournaments: TournamentOption[] }>('/tournaments', { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) setTournaments(res.tournaments || [])
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  // Names saved in the current modal session (one save can register a Male
  // and a Female team together).
  const savedNames = useRef<string[]>([])

  const openCreate = (t: TournamentOption) => {
    savedNames.current = []
    setActiveTournament(t)
    setModalOpen(true)
  }

  const handleSaved = (team: DistrictTeam) => {
    savedNames.current = [...savedNames.current, `“${team.name}”`]
    const names = savedNames.current
    setNotice(`${names.length > 1 ? 'Teams' : 'Team'} ${names.join(' and ')} registered for ${team.tournament?.title || 'the tournament'}.`)
    window.setTimeout(() => setNotice(''), 5000)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Tournaments</h1>
        <p className="text-gray-600">View tournaments and register your district's teams while registration is open.</p>
      </div>

      {notice && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {notice}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading tournaments…</p>
      ) : tournaments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
          No tournaments found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tournaments.map((t) => {
            const open = isTournamentOpen(t)
            return (
              <div key={t._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                {t.imageUrl && (
                  <div className="h-40 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={t.imageUrl}
                      alt={t.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-lg font-bold text-gray-900">{t.title}</h2>
                  <span
                    className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      open ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${open ? 'bg-green-600' : 'bg-gray-400'}`} />
                    {open ? 'Registration Open' : t.status || 'Closed'}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-gray-400">event</span>
                    {formatDate(t.startDate)} – {formatDate(t.endDate)}
                  </div>
                  {(t.venueName || t.city) && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-gray-400">location_on</span>
                      {[t.venueName, t.city].filter(Boolean).join(', ')}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-gray-400">sports</span>
                    <span>
                      Event{tournamentEventTypes(t).length > 1 ? 's' : ''}: {eventTypesLabel(t)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-gray-400">wc</span>
                    <span>
                      Categor{tournamentGenderCategories(t).length > 1 ? 'ies' : 'y'}: {genderCategoriesLabel(tournamentGenderCategories(t))}
                    </span>
                  </div>
                  {t.registrationCloses && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-gray-400">schedule</span>
                      Registration closes: {formatDate(t.registrationCloses)}
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  {open ? (
                    <button
                      onClick={() => openCreate(t)}
                      className="w-full flex items-center justify-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] text-white px-5 py-2.5 rounded-lg font-bold transition-colors"
                    >
                      <span className="material-symbols-outlined">group_add</span>
                      Create Team / Register Team
                    </button>
                  ) : (
                    <div className="w-full text-center text-sm text-gray-400 border border-gray-200 rounded-lg px-5 py-2.5">
                      Registration closed
                    </div>
                  )}
                </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TeamFormModal
        open={modalOpen}
        tournament={activeTournament}
        onClose={() => {
          setModalOpen(false)
          setActiveTournament(null)
        }}
        onSaved={handleSaved}
      />
    </div>
  )
}
