import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  useWebsiteContent,
  type NationalTeamBlock,
  type NationalTeamCategory,
  type NationalTeamPageSettings,
  type NationalTeamPlayer,
} from '../../context/WebsiteContentContext'
import { apiRequest } from '../../lib/api'

type SectionKey = keyof NationalTeamPageSettings

const SECTION_META: Array<{ key: SectionKey; label: string; description: string }> = [
  { key: 'mensTeam', label: "Men's Team", description: 'Senior squad members competing at the top level.' },
  { key: 'juniorMensTeam', label: "Junior Men's Team", description: 'Developing talent for the next generation.' },
  { key: 'womensTeam', label: "Women's Team", description: 'Elite women athletes representing the association.' },
  { key: 'juniorWomensTeam', label: "Junior Women's Team", description: 'Youth pathway for the women’s national squad.' },
]

const createEmptyPlayer = (): NationalTeamPlayer => ({ name: '', imageUrl: '' })

const createEmptyBlock = (): NationalTeamBlock => ({ title: '', players: [] })

const normalizeBlock = (block: Partial<NationalTeamBlock>): NationalTeamBlock => ({
  id: block.id,
  title: block.title || '',
  players: (block.players || []).map((player) => ({
    id: player.id,
    name: player.name || '',
    imageUrl: player.imageUrl || '',
  })),
})

const createInitialState = (page: NationalTeamPageSettings): NationalTeamPageSettings => ({
  mensTeam: {
    title: page.mensTeam?.title || "Men's Team",
    blocks: (page.mensTeam?.blocks || []).map((block) => normalizeBlock(block)),
  },
  juniorMensTeam: {
    title: page.juniorMensTeam?.title || "Junior Men's Team",
    blocks: (page.juniorMensTeam?.blocks || []).map((block) => normalizeBlock(block)),
  },
  womensTeam: {
    title: page.womensTeam?.title || "Women's Team",
    blocks: (page.womensTeam?.blocks || []).map((block) => normalizeBlock(block)),
  },
  juniorWomensTeam: {
    title: page.juniorWomensTeam?.title || "Junior Women's Team",
    blocks: (page.juniorWomensTeam?.blocks || []).map((block) => normalizeBlock(block)),
  },
})

export function NationalTeamManagement() {
  const { content, updateNationalTeamPage } = useWebsiteContent()
  const [pageData, setPageData] = useState<NationalTeamPageSettings>(createInitialState(content.nationalTeamPage))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setPageData(createInitialState(content.nationalTeamPage))
  }, [content.nationalTeamPage])

  const summary = useMemo(
    () =>
      SECTION_META.map((section) => ({
        ...section,
        count: pageData[section.key].blocks.reduce((sum, block) => sum + block.players.length, 0),
        blockCount: pageData[section.key].blocks.length,
      })),
    [pageData],
  )

  const updateSection = (key: SectionKey, updater: (section: NationalTeamCategory) => NationalTeamCategory) => {
    setPageData((prev) => ({
      ...prev,
      [key]: updater(prev[key]),
    }))
  }

  const updateBlock = (key: SectionKey, blockIndex: number, updater: (block: NationalTeamBlock) => NationalTeamBlock) => {
    updateSection(key, (section) => ({
      ...section,
      blocks: section.blocks.map((block, index) => (index === blockIndex ? updater(block) : block)),
    }))
  }

  const addBlock = (key: SectionKey) => {
    updateSection(key, (section) => ({
      ...section,
      blocks: [...section.blocks, createEmptyBlock()],
    }))
  }

  const removeBlock = (key: SectionKey, blockIndex: number) => {
    updateSection(key, (section) => ({
      ...section,
      blocks: section.blocks.filter((_, index) => index !== blockIndex),
    }))
  }

  const addPlayer = (key: SectionKey, blockIndex: number) => {
    updateBlock(key, blockIndex, (block) => ({
      ...block,
      players: [...block.players, createEmptyPlayer()],
    }))
  }

  const updatePlayer = (
    key: SectionKey,
    blockIndex: number,
    playerIndex: number,
    field: keyof NationalTeamPlayer,
    value: string,
  ) => {
    updateBlock(key, blockIndex, (block) => ({
      ...block,
      players: block.players.map((player, index) => (index === playerIndex ? { ...player, [field]: value } : player)),
    }))
  }

  const removePlayer = (key: SectionKey, blockIndex: number, playerIndex: number) => {
    updateBlock(key, blockIndex, (block) => ({
      ...block,
      players: block.players.filter((_, index) => index !== playerIndex),
    }))
  }

  const handleImageUpload = async (key: SectionKey, blockIndex: number, playerIndex: number, file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await apiRequest<{ url: string }>('/uploads/images', {
      method: 'POST',
      body: formData,
      auth: true,
    })
    if (response.url) {
      updatePlayer(key, blockIndex, playerIndex, 'imageUrl', response.url)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await updateNationalTeamPage(pageData)
      setMessage('National Team content updated successfully.')
      window.setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to save National Team content.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Dashboard
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">National Team</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">National Team Management</h1>
          <p className="text-gray-600 max-w-2xl">
            Manage repeatable title blocks within each squad. Every block can contain its own player names and image
            URLs or uploaded photographs.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[#5a0a8f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition-colors hover:bg-[#400466] disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <div key={item.key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">{item.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <div className="text-3xl font-black text-[#241b71]">{item.blockCount}</div>
                <div className="text-sm text-gray-600">Blocks</div>
                <div className="text-sm text-gray-600">{item.count} players</div>
              </div>
              <span className="material-symbols-outlined text-4xl text-[#5a0a8f]/30">groups</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {SECTION_META.map((section) => {
          const current = pageData[section.key]
          return (
            <section key={section.key} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-100 bg-gradient-to-r from-[#f7f1ff] to-white p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7a5aa8]">Team Section</p>
                  <h2 className="mt-1 text-2xl font-black text-gray-900">{section.label}</h2>
                  <p className="mt-2 text-sm text-gray-600">{section.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => addBlock(section.key)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#5a0a8f]/20 px-4 py-2 text-sm font-semibold text-[#5a0a8f] transition-colors hover:bg-[#5a0a8f]/5"
                  >
                    <span className="material-symbols-outlined text-[18px]">playlist_add</span>
                    Add Block
                  </button>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-gray-700">Section Title</span>
                    <input
                      value={current.title}
                      onChange={(e) => updateSection(section.key, (item) => ({ ...item, title: e.target.value }))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/10"
                      placeholder={section.label}
                    />
                  </label>
                  <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    {current.blocks.length} blocks configured
                  </div>
                </div>

                {current.blocks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
                    No blocks yet. Add a title block to start grouping players in this squad.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {current.blocks.map((block, blockIndex) => (
                      <div key={block.id || `${section.key}-${blockIndex}`} className="rounded-3xl border border-gray-200 bg-[#fcfbff] p-5 shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
                          <label className="block w-full lg:max-w-xl">
                            <span className="mb-2 block text-sm font-semibold text-gray-700">Block Title</span>
                            <input
                              value={block.title}
                              onChange={(e) => updateBlock(section.key, blockIndex, (item) => ({ ...item, title: e.target.value }))}
                              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition-colors focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/10"
                              placeholder="Enter a title for this block"
                            />
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => addPlayer(section.key, blockIndex)}
                              className="inline-flex items-center gap-2 rounded-full border border-[#5a0a8f]/20 px-4 py-2 text-sm font-semibold text-[#5a0a8f] transition-colors hover:bg-[#5a0a8f]/5"
                            >
                              <span className="material-symbols-outlined text-[18px]">person_add</span>
                              Add Player
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBlock(section.key, blockIndex)}
                              className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                              Remove Block
                            </button>
                          </div>
                        </div>

                        <div className="pt-5">
                          {block.players.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
                              No players in this block yet. Add a player with name and photograph.
                            </div>
                          ) : (
                            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                              {block.players.map((player, playerIndex) => (
                                <div key={`${section.key}-${blockIndex}-${playerIndex}`} className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="text-sm font-semibold text-gray-700">Player {playerIndex + 1}</div>
                                    <button
                                      type="button"
                                      onClick={() => removePlayer(section.key, blockIndex, playerIndex)}
                                      className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                      aria-label="Remove player"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                  </div>

                                  <div className="mt-4 flex flex-col items-center gap-4">
                                    <div className="relative size-28 overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-[#f0ebff] to-[#eff4ff]">
                                      {player.imageUrl ? (
                                        <img src={player.imageUrl} alt={player.name || 'Player'} className="h-full w-full object-cover" />
                                      ) : (
                                        <div className="flex h-full items-center justify-center text-[#7a5aa8]">
                                          <span className="material-symbols-outlined text-6xl">person</span>
                                        </div>
                                      )}
                                      <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 text-xs font-bold uppercase tracking-[0.2em] text-white opacity-0 transition-opacity group-hover:opacity-100">
                                        Upload
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return
                                            await handleImageUpload(section.key, blockIndex, playerIndex, file)
                                          }}
                                        />
                                      </label>
                                    </div>

                                    <label className="block w-full">
                                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Name</span>
                                      <input
                                        value={player.name}
                                        onChange={(e) => updatePlayer(section.key, blockIndex, playerIndex, 'name', e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-center font-semibold text-gray-900 outline-none transition-colors focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/10"
                                        placeholder="Player name"
                                      />
                                    </label>

                                    <label className="block w-full">
                                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Image URL</span>
                                      <input
                                        value={player.imageUrl}
                                        onChange={(e) => updatePlayer(section.key, blockIndex, playerIndex, 'imageUrl', e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs text-gray-700 outline-none transition-colors focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/10"
                                        placeholder="Paste an image URL or upload above"
                                      />
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}