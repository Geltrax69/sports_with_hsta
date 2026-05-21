export function parseYoutubeId(url: string): string | null {
  const trimmed = String(url || '').trim()
  if (!trimmed) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export function youtubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export function youtubeEmbedUrl(videoId: string, autoplay = true): string {
  const autoplayParam = autoplay ? '1' : '0'
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplayParam}&rel=0`
}
