import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWebsiteContent } from '../../context/WebsiteContentContext'
import { parseYoutubeId, youtubeEmbedUrl, youtubeThumbnail } from '../../lib/youtube'
import { PAGE_SIZE_MEDIA } from '../../lib/formStyles'
import { ListPagination } from '../../components/ListPagination'

const inputClass =
  'w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/25 outline-none'

export function VideosManagement() {
  const { content, contentLoading, contentError, refreshContent, addMediaVideo, updateMediaVideo, removeMediaVideo } =
    useWebsiteContent()
  const [title, setTitle] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const previewId = useMemo(() => parseYoutubeId(youtubeUrl), [youtubeUrl])
  const videos = content.homepage.mediaVideos || []
  const [listPage, setListPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(videos.length / PAGE_SIZE_MEDIA))
  const safeListPage = Math.min(listPage, totalPages)
  const pagedVideos = useMemo(() => {
    const start = (safeListPage - 1) * PAGE_SIZE_MEDIA
    return videos.slice(start, start + PAGE_SIZE_MEDIA)
  }, [videos, safeListPage])

  const handleAdd = async () => {
    setError('')
    setSuccess('')
    if (!title.trim()) {
      setError('Please enter a video title')
      return
    }
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL')
      return
    }
    if (!parseYoutubeId(youtubeUrl)) {
      setError('Enter a valid YouTube link (youtube.com or youtu.be)')
      return
    }
    try {
      setSaving(true)
      await addMediaVideo({ title: title.trim(), youtubeUrl: youtubeUrl.trim() })
      setTitle('')
      setYoutubeUrl('')
      setSuccess('Video added successfully!')
      window.setTimeout(() => setSuccess(''), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add video')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this video?')) return
    try {
      await removeMediaVideo(id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#5a0a8f] to-[#400466] p-6 text-white shadow-lg">
        <Link to="/admin/media" className="text-purple-200 hover:text-white text-sm font-semibold">
          ← Back to Media
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black mt-2">Videos</h1>
            <p className="text-purple-100/90 text-sm mt-1">
              Add YouTube videos with titles. They appear on the public Media page under the Videos tab.
            </p>
            <p className="text-purple-200/80 text-xs mt-1">Public site shows {PAGE_SIZE_MEDIA} videos per page.</p>
          </div>
          <Link
            to="/media?tab=videos"
            className="px-4 py-2 rounded-lg border-2 border-white/50 text-white font-bold hover:bg-white/10 shrink-0"
          >
            View All (public)
          </Link>
        </div>
      </div>

      {contentError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex flex-wrap justify-between gap-2">
          <span>{contentError}</span>
          <button type="button" onClick={() => void refreshContent()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#5a0a8f]">add_circle</span>
          Add new video
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="video-title" className="block text-sm font-bold text-gray-800 mb-2">
                Video title <span className="text-red-500">*</span>
              </label>
              <input
                id="video-title"
                type="text"
                placeholder="e.g. National Championship Highlights 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="video-url" className="block text-sm font-bold text-gray-800 mb-2">
                YouTube URL <span className="text-red-500">*</span>
              </label>
              <input
                id="video-url"
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-gray-500 mt-1.5">Supports youtube.com, youtu.be, or embed links</p>
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving}
              className="w-full md:w-auto px-6 py-3 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-xl font-bold disabled:opacity-60 shadow-md"
            >
              {saving ? 'Saving…' : 'Add Video'}
            </button>
          </div>

          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 flex flex-col">
            <p className="text-sm font-bold text-gray-700 mb-3">Preview</p>
            {previewId ? (
              <div className="flex-1 flex flex-col gap-3">
                <img
                  src={youtubeThumbnail(previewId)}
                  alt="Video thumbnail preview"
                  className="w-full aspect-video object-cover rounded-lg border border-gray-200"
                />
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">{title || 'Untitled video'}</p>
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    title="Preview"
                    src={youtubeEmbedUrl(previewId, false)}
                    className="w-full h-full"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-gray-400">
                <span className="material-symbols-outlined text-5xl mb-2">play_circle</span>
                <p className="text-sm">Enter a valid YouTube URL to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Published videos ({contentLoading ? '…' : videos.length})
        </h2>

        {contentLoading ? (
          <p className="text-gray-500 py-8 text-center">Loading videos…</p>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
            <span className="material-symbols-outlined text-5xl text-gray-300">video_library</span>
            <p className="text-gray-600 font-semibold mt-2">No videos yet</p>
            <p className="text-sm text-gray-500 mt-1">Add your first YouTube video using the form above.</p>
          </div>
        ) : (
          <>
            {pagedVideos.map((video, index) => (
              <div key={video.id} className="relative">
                <span className="absolute -left-1 top-4 z-10 size-8 rounded-full bg-[#5a0a8f] text-white text-sm font-black flex items-center justify-center shadow">
                  {(safeListPage - 1) * PAGE_SIZE_MEDIA + index + 1}
                </span>
                <VideoRow
                  video={video}
                  onDelete={() => void handleDelete(video.id)}
                  onSave={(updates) => updateMediaVideo(video.id, updates)}
                />
              </div>
            ))}
            <ListPagination
              page={safeListPage}
              totalItems={videos.length}
              pageSize={PAGE_SIZE_MEDIA}
              onPageChange={setListPage}
            />
          </>
        )}
      </div>
    </div>
  )
}

function VideoRow({
  video,
  onDelete,
  onSave,
}: {
  video: { id: string; title: string; youtubeUrl: string }
  onDelete: () => void
  onSave: (updates: { title?: string; youtubeUrl?: string }) => Promise<void>
}) {
  const [editTitle, setEditTitle] = useState(video.title)
  const [editUrl, setEditUrl] = useState(video.youtubeUrl)
  const [saving, setSaving] = useState(false)
  const ytId = parseYoutubeId(editUrl)

  const handleSave = async () => {
    if (!parseYoutubeId(editUrl)) {
      alert('Invalid YouTube URL')
      return
    }
    setSaving(true)
    try {
      await onSave({ title: editTitle.trim(), youtubeUrl: editUrl.trim() })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex flex-col sm:flex-row gap-4 shadow-sm">
      {ytId ? (
        <img
          src={youtubeThumbnail(ytId)}
          alt=""
          className="w-full sm:w-48 aspect-video object-cover rounded-xl border border-gray-200 shrink-0"
        />
      ) : (
        <div className="w-full sm:w-48 aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
          No preview
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Title</label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">YouTube URL</label>
          <input
            type="text"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 bg-[#5a0a8f] text-white rounded-lg text-sm font-bold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={onDelete} className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg text-sm font-bold">
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
