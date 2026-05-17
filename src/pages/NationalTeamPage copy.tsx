import { Navigate, useParams } from 'react-router-dom'
import { useWebsiteContent, type NationalTeamPageSettings } from '../context/WebsiteContentContext'

type SectionKey = keyof NationalTeamPageSettings

const SECTIONS: Array<{ key: SectionKey; slug: string; eyebrow: string; accent: string; blurb: string }> = [
  {
    key: 'mensTeam',
    slug: 'mens-team',
    eyebrow: 'Senior Squad',
    accent: 'Men\'s Team',
    blurb: 'Experienced athletes representing the state at the highest level of competition.',
  },
  {
    key: 'juniorMensTeam',
    slug: 'junior-mens-team',
    eyebrow: 'Development Pathway',
    accent: 'Junior Men\'s Team',
    blurb: 'Rising players building the next generation of national-level contenders.',
  },
  {
    key: 'womensTeam',
    slug: 'womens-team',
    eyebrow: 'Elite Women',
    accent: 'Women\'s Team',
    blurb: 'Skilled and disciplined athletes competing with pace, precision, and power.',
  },
  {
    key: 'juniorWomensTeam',
    slug: 'junior-womens-team',
    eyebrow: 'Youth Program',
    accent: 'Junior Women\'s Team',
    blurb: 'Promising talents progressing through structured training and championships.',
  },
]

export function NationalTeamPage() {
  const { content } = useWebsiteContent()
  const { teamSlug } = useParams<{ teamSlug?: string }>()

  const nationalTeam = content.nationalTeamPage

  const section = SECTIONS.find((item) => item.slug === teamSlug) || SECTIONS[0]
  const group = nationalTeam[section.key]
  const players = group?.players || []

  if (!teamSlug) {
    return <Navigate to="/national-team/mens-team" replace />
  }

  if (!SECTIONS.some((item) => item.slug === teamSlug)) {
    return <Navigate to="/national-team/mens-team" replace />
  }

  return (
    <main className="w-full overflow-x-hidden bg-gradient-to-b from-[#140b22] via-[#1d1030] to-[#f7f4fb]">
      <section className="relative overflow-hidden bg-[#241b71] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(255,188,67,0.18),_transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              National Team
            </p>
            <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Haryana&apos;s pathway to the national stage.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
              Explore the {group?.title || section.accent}. This page is maintained from the admin console with player
              names and photographs or image URLs.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-3xl font-black">4</div>
              <div className="mt-1 text-sm text-white/70">Team groups</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-3xl font-black">{players.length}</div>
              <div className="mt-1 text-sm text-white/70">Players listed</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-3xl font-black">Live</div>
              <div className="mt-1 text-sm text-white/70">Admin-managed updates</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-12 px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl">
          <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_80px_rgba(28,16,48,0.12)]">
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="bg-gradient-to-br from-[#f7f1ff] via-white to-[#eef4ff] p-8 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#7a5aa8]">{section.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-black text-[#241b71] sm:text-4xl">
                  {group?.title || section.accent}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-gray-700">{section.blurb}</p>
                <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#241b71] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#241b71]/20">
                  <span className="material-symbols-outlined text-[18px]">groups</span>
                  {players.length} players
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {players.length === 0 ? (
                  <div className="flex h-full min-h-[280px] items-center justify-center rounded-[1.5rem] border border-dashed border-gray-300 bg-gray-50 text-center text-gray-500">
                    <div>
                      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-[#241b71] shadow-sm">
                        <span className="material-symbols-outlined text-[28px]">person</span>
                      </div>
                      <p className="mt-4 font-semibold">No players added yet.</p>
                      <p className="mt-1 text-sm">Add squad members from the admin panel.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {players.map((player, playerIndex) => (
                      <div
                        key={player.id || `${section.slug}-${playerIndex}`}
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-[#f1ebff] to-[#eef4ff]">
                          {player.imageUrl ? (
                            <img
                              src={player.imageUrl}
                              alt={player.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#7a5aa8]">
                              <span className="material-symbols-outlined text-6xl">person</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-4 text-center">
                          <h3 className="text-lg font-bold text-[#241b71]">{player.name || 'Player Name'}</h3>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            {group?.title || section.accent}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}