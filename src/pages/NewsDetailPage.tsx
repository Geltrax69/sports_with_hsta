import { useParams, Navigate, Link } from 'react-router-dom'
import { useSiteContent } from '../content/SiteContentContext'
import { useState, useEffect } from 'react'
import { resolveImageUrl } from '../lib/images'
import { getRelativeDate, formatDate } from '../lib/dateUtils'

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { content } = useSiteContent()
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string>('')

  const newsItem = content.news.find((news) => news.id === id)
  useEffect(() => {
    if (!newsItem?.imageUrl) return
    let cancelled = false
    resolveImageUrl(newsItem.imageUrl).then((url) => {
      if (!cancelled) setResolvedImageUrl(url)
    })
    return () => { cancelled = true }
  }, [newsItem?.imageUrl])

  if (!newsItem) {
    return <Navigate to="/news" replace />
  }

  return (
    <main id="page-content" className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link to="/" className="hover:text-[#5a0a8f]">
                Home
              </Link>
              <span>›</span>
              <Link to="/news" className="hover:text-[#5a0a8f]">
                News & Media
              </Link>
              <span>›</span>
              <span className="text-gray-900 font-medium line-clamp-1">{newsItem.title}</span>
            </div>
          </div>
        </div>

        {/* Article */}
        <article className="max-w-4xl mx-auto px-4 py-12">
          {/* Back Button - Top */}
          <div className="mb-8">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 text-[#5a0a8f] hover:text-[#400466] font-semibold transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to News & Media
            </Link>
          </div>
          {/* Badge & Date */}
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded uppercase">
              {newsItem.badge}
            </span>
            <span className="text-sm text-gray-500">
              {getRelativeDate(newsItem.date)} • {formatDate(newsItem.date)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">
            {newsItem.title}
          </h1>

          {/* Excerpt */}
          {newsItem.excerpt && (
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {newsItem.excerpt}
            </p>
          )}

          {/* Featured Image */}
          {resolvedImageUrl && (
            <div className="mb-10">
              <img
                src={resolvedImageUrl}
                alt={newsItem.title}
                className="w-full h-auto rounded-xl shadow-lg"
              />
            </div>
          )}

          {/* Article Content */}
          {newsItem.article && (
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {newsItem.article}
              </div>
            </div>
          )}
        </article>
      </main>
  )
}
