import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useWebsiteContent } from '../context/WebsiteContentContext'
import { resolveImageUrl } from '../lib/images'
import { parseYoutubeId, youtubeEmbedUrl, youtubeThumbnail } from '../lib/youtube'
import { PAGE_SIZE_MEDIA } from '../lib/formStyles'
import { ListPagination } from '../components/ListPagination'
import { Skeleton } from 'boneyard-js/react'

type Tab = 'gallery' | 'videos'

export function MediaPage() {
  const { content, contentLoading, contentError, refreshContent } = useWebsiteContent()
  const [activeTab, setActiveTab] = useState<Tab>('gallery')
  const [galleryPage, setGalleryPage] = useState(1)
  const [videoPage, setVideoPage] = useState(1)
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({})
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)

  const galleryImages = useMemo(
    () =>
      [...content.homepage.galleryImages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [content.homepage.galleryImages],
  )

  const videos = useMemo(
    () =>
      [...content.homepage.mediaVideos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [content.homepage.mediaVideos],
  )

  const galleryTotalPages = Math.max(1, Math.ceil(galleryImages.length / PAGE_SIZE_MEDIA))
  const videoTotalPages = Math.max(1, Math.ceil(videos.length / PAGE_SIZE_MEDIA))

  const safeGalleryPage = Math.min(galleryPage, galleryTotalPages)
  const safeVideoPage = Math.min(videoPage, videoTotalPages)

  const pagedGallery = useMemo(() => {
    const start = (safeGalleryPage - 1) * PAGE_SIZE_MEDIA
    return galleryImages.slice(start, start + PAGE_SIZE_MEDIA)
  }, [galleryImages, safeGalleryPage])

  const pagedVideos = useMemo(() => {
    const start = (safeVideoPage - 1) * PAGE_SIZE_MEDIA
    return videos.slice(start, start + PAGE_SIZE_MEDIA)
  }, [videos, safeVideoPage])

  useEffect(() => {
    const resolve = async () => {
      const resolved: Record<string, string> = {}
      for (const img of pagedGallery) {
        resolved[img.id] = await resolveImageUrl(img.imageUrl, false)
      }
      setResolvedUrls(resolved)
    }
    void resolve()
  }, [pagedGallery])

  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') === 'videos' ? 'videos' : 'gallery'

  useEffect(() => {
    setActiveTab(tabFromUrl)
  }, [tabFromUrl])

  useEffect(() => {
    setGalleryPage(1)
  }, [galleryImages.length])

  useEffect(() => {
    setVideoPage(1)
  }, [videos.length])

  return (
    <Skeleton name="media-page" loading={contentLoading}>
      <main id="page-content" className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900">Media</h1>
          <p className="text-gray-600 mt-2">Gallery photos and tournament videos from HSTA events.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`px-5 py-2 rounded-lg font-bold ${activeTab === 'gallery' ? 'bg-[#5a0a8f] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Image Gallery ({galleryImages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`px-5 py-2 rounded-lg font-bold ${activeTab === 'videos' ? 'bg-[#5a0a8f] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Videos ({videos.length})
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3">Showing up to {PAGE_SIZE_MEDIA} items per page.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {!contentLoading && contentError && (
            <div className="text-center py-12 space-y-4">
              <p className="text-red-600">{contentError}</p>
              <button
                type="button"
                onClick={() => void refreshContent()}
                className="px-4 py-2 bg-[#5a0a8f] text-white rounded-lg font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {!contentLoading && !contentError && activeTab === 'gallery' && (
            galleryImages.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No gallery images yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pagedGallery.map((img, index) => {
                    const serial = (safeGalleryPage - 1) * PAGE_SIZE_MEDIA + index + 1
                    const title = img.title?.trim() || 'Gallery Image'
                    return (
                      <article
                        key={img.id}
                        className="rounded-xl overflow-hidden bg-white shadow border border-gray-100 relative"
                      >
                        <span className="absolute top-3 left-3 z-10 bg-[#5a0a8f] text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                          {serial}
                        </span>
                        <div className="aspect-[4/3] bg-gray-200">
                          <img
                            src={resolvedUrls[img.id] || img.imageUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4 border-t border-gray-100">
                          <h3 className="font-bold text-gray-900">{title}</h3>
                          {img.description?.trim() && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-3">{img.description}</p>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
                <ListPagination
                  page={safeGalleryPage}
                  totalItems={galleryImages.length}
                  pageSize={PAGE_SIZE_MEDIA}
                  onPageChange={setGalleryPage}
                />
              </>
            )
          )}

          {!contentLoading && !contentError && activeTab === 'videos' && (
            videos.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No videos yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pagedVideos.map((video, index) => {
                    const ytId = parseYoutubeId(video.youtubeUrl)
                    if (!ytId) return null
                    const serial = (safeVideoPage - 1) * PAGE_SIZE_MEDIA + index + 1
                    return (
                      <article
                        key={video.id}
                        className="rounded-xl overflow-hidden bg-white shadow border border-gray-100 flex flex-col relative"
                      >
                        <span className="absolute top-3 left-3 z-10 bg-[#5a0a8f] text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                          {serial}
                        </span>
                        <button
                          type="button"
                          className="relative aspect-video bg-gray-900 group"
                          onClick={() => setActiveVideoId(ytId)}
                        >
                          <img
                            src={youtubeThumbnail(ytId)}
                            alt={video.title || 'Video thumbnail'}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="size-14 rounded-full bg-[#5a0a8f]/90 text-white flex items-center justify-center text-2xl">
                              ▶
                            </span>
                          </span>
                        </button>
                        <div className="p-4 border-t border-gray-100">
                          <h3 className="font-bold text-gray-900 line-clamp-2">
                            {video.title?.trim() || 'Untitled video'}
                          </h3>
                        </div>
                      </article>
                    )
                  })}
                </div>
                <ListPagination
                  page={safeVideoPage}
                  totalItems={videos.length}
                  pageSize={PAGE_SIZE_MEDIA}
                  onPageChange={setVideoPage}
                />
              </>
            )
          )}
        </div>
      </section>

      {activeVideoId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActiveVideoId(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              title="YouTube video player"
              src={youtubeEmbedUrl(activeVideoId)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <button
            type="button"
            className="absolute top-4 right-4 text-white text-3xl font-bold"
            onClick={() => setActiveVideoId(null)}
            aria-label="Close video"
          >
            ×
          </button>
        </div>
      )}
    </main>
    </Skeleton>
  )
}
