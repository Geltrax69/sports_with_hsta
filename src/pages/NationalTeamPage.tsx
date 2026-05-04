import { Navigate, useParams } from 'react-router-dom'
import { useWebsiteContent, type NationalTeamPageSettings } from '../context/WebsiteContentContext'

type SectionKey = keyof NationalTeamPageSettings

const SECTIONS: Array<{ key: SectionKey; slug: string; eyebrow: string; accent: string; blurb: string }> = [
  { key: 'mensTeam', slug: 'mens-team', eyebrow: 'Senior Squad', accent: "Men's Team", blurb: 'Experienced athletes representing the state at the highest level of competition.' },
  { key: 'juniorMensTeam', slug: 'junior-mens-team', eyebrow: 'Development Pathway', accent: "Junior Men's Team", blurb: 'Rising players building the next generation of national-level contenders.' },
  { key: 'womensTeam', slug: 'womens-team', eyebrow: 'Elite Women', accent: "Women's Team", blurb: 'Skilled and disciplined athletes competing with pace, precision, and power.' },
  { key: 'juniorWomensTeam', slug: 'junior-womens-team', eyebrow: 'Youth Program', accent: "Junior Women's Team", blurb: 'Promising talents progressing through structured training and championships.' },
]

export function NationalTeamPage() {
  const { content } = useWebsiteContent()
  const { teamSlug } = useParams<{ teamSlug?: string }>()

  const section = SECTIONS.find((item) => item.slug === teamSlug)
  if (!teamSlug || !section) {
    return <Navigate to="/national-team/mens-team" replace />
  }

  const group = content.nationalTeamPage[section.key]
  const blocks = group?.blocks || []
  const totalPlayers = blocks.reduce((sum, block) => sum + block.players.length, 0)

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
              Explore the {group?.title || section.accent}. Each block beneath this section can hold a different title and a separate player list.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-3xl font-black">{blocks.length}</div>
              <div className="mt-1 text-sm text-white/70">Blocks</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-3xl font-black">{totalPlayers}</div>
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
        <div className="mx-auto max-w-7xl space-y-6">
          <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_80px_rgba(28,16,48,0.12)]">
            <div className="bg-gradient-to-br from-[#f7f1ff] via-white to-[#eef4ff] p-8 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#7a5aa8]">{section.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-black text-[#241b71] sm:text-4xl">{group?.title || section.accent}</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700">{section.blurb}</p>
            </div>
          </article>

          {blocks.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600 shadow-sm">
              No title blocks have been added yet. The admin can create one or more blocks for this squad.
            </div>
          ) : (
            blocks.map((block, blockIndex) => (
              <article
                key={block.id || `${section.slug}-${blockIndex}`}
                className="overflow-hidden rounded-[2rem] border border-[#eadcf7] bg-white shadow-[0_25px_70px_rgba(28,16,48,0.10)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col gap-4 border-b border-gray-100 bg-gradient-to-r from-[#faf7ff] via-white to-[#eef4ff] p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#7a5aa8]">{section.eyebrow}</p>
                    <h3 className="mt-2 text-2xl font-black text-[#241b71] sm:text-3xl">{block.title || section.accent}</h3>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#241b71] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#241b71]/20">
                    <span className="material-symbols-outlined text-[18px]">groups</span>
                    {block.players.length} players
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  {block.players.length === 0 ? (
                    <div className="flex min-h-[220px] items-center justify-center rounded-[1.5rem] border border-dashed border-gray-300 bg-gray-50 text-center text-gray-500">
                      <div>
                        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-[#241b71] shadow-sm">
                          <span className="material-symbols-outlined text-[28px]">person</span>
                        </div>
                        <p className="mt-4 font-semibold">No players added yet.</p>
                        <p className="mt-1 text-sm">This block will appear once the admin adds players.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {block.players.map((player, playerIndex) => (
                        <div
                          key={player.id || `${section.slug}-${blockIndex}-${playerIndex}`}
                          className="group relative mx-auto flex h-[430px] w-full max-w-[292px] flex-col overflow-hidden rounded-[1.75rem] border border-[#d9c8ef] bg-gradient-to-b from-[#f7f1e8] via-[#f5f0fb] to-[#e9f2ff] shadow-[0_16px_42px_rgba(52,33,99,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(52,33,99,0.22)] sm:h-[450px]"
                        >
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(90,10,143,0.12),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(208,0,26,0.14),transparent_38%)]" />

                          <div className="relative m-4 mb-3 flex flex-1 items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/70 bg-gradient-to-b from-[#f8f4ef] via-[#f2eef9] to-[#eef4ff] shadow-inner">
                            <div className="absolute inset-y-0 left-[34%] w-14 -translate-x-1/2 skew-x-[-10deg] bg-[#5a0a8f]/65 opacity-70" />
                            <div className="absolute inset-y-0 right-[34%] w-14 translate-x-1/2 skew-x-[-10deg] bg-[#d0001a]/72 opacity-80" />
                            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.35),transparent_25%,transparent_70%,rgba(36,27,113,0.08))]" />
                            {player.imageUrl ? (
                              <img
                                src={player.imageUrl}
                                alt={player.name}
                                className="relative z-10 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                              />
                            ) : (
                              <div className="relative z-10 flex h-full items-center justify-center text-[#7a5aa8]">
                                <span className="material-symbols-outlined text-6xl">person</span>
                              </div>
                            )}
                          </div>

                          <div className="relative mx-4 mb-4 overflow-hidden rounded-[1rem] border border-[#ffffff3d] bg-gradient-to-r from-[#261b79] via-[#32238a] to-[#281d7a] px-4 py-3 text-center text-white shadow-[0_12px_24px_rgba(36,27,113,0.28)]">
                            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.16),transparent_30%,transparent_70%,rgba(255,255,255,0.09))]" />
                            <h4 className="relative truncate text-[16px] font-black uppercase leading-tight tracking-[0.08em]">
                              {player.name || 'Player Name'}
                            </h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}