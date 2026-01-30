import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useSiteContent } from '../../content/SiteContentContext'
import type { NewsItem } from '../../content/types'
import { apiRequest } from '../../lib/api'
import { getSignedUrlForImage } from '../../lib/images'
import { processImageFile } from '../../lib/imageCompression'

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`
}

export function NewsManagement() {
  const { content, setContent } = useSiteContent()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    badge: 'UPDATE',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    dateText: '',
    excerpt: '',
    article: '',
    imageUrl: '',
    pinned: false,
    featured: false,
  })

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [imageUploadMethod, setImageUploadMethod] = useState<'file' | 'url'>('file')
  const [compressedSize, setCompressedSize] = useState<string | null>(null)

  const filteredNews = useMemo(() => {
    return content.news.filter(
      (news) =>
        news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        news.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [content.news, searchQuery])

  const handleOpenAdd = () => {
    const now = new Date()
    setFormData({
      title: '',
      badge: 'UPDATE',
      date: now.toISOString().split('T')[0], // YYYY-MM-DD format
      dateText: now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' }),
      excerpt: '',
      article: '',
      imageUrl: '',
      pinned: false,
      featured: false,
    })
    setEditingNews(null)
    setShowAddModal(true)
  }

  const handleOpenEdit = (news: NewsItem) => {
    setFormData({
      title: news.title,
      badge: news.badge,
      date: news.date || new Date().toISOString().split('T')[0],
      dateText: news.dateText,
      excerpt: news.excerpt || '',
      article: news.article || '',
      imageUrl: news.imageUrl,
      pinned: news.pinned,
      featured: news.featured,
    })
    setEditingNews(news)
    setShowAddModal(true)
  }

  const handleImageSelect = async (file: File | null) => {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    setCompressedSize(null)
    try {
      // Compress and validate image
      const processedFile = await processImageFile(file)
      setCompressedSize(`${(processedFile.size / 1024).toFixed(0)}KB`)
      
      const fd = new FormData()
      fd.append('image', processedFile)
      fd.append('name', formData.title || 'news')
      
      // If updating an existing news item with an image, send the old URL to replace it
      if (editingNews?.imageUrl) {
        fd.append('oldImageUrl', editingNews.imageUrl)
      }
      
      const res = await apiRequest<{ key: string; url: string }>(
        '/uploads/images',
        { method: 'POST', body: fd, auth: true },
      )
      setFormData({ ...formData, imageUrl: res.url })
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed')
      setCompressedSize(null)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.imageUrl) {
      setUploadError('Please upload an image before submitting')
      return
    }

    if (editingNews) {
      setContent({
        ...content,
        news: content.news.map((n) => (n.id === editingNews.id ? { ...n, ...formData } : n)),
      })
    } else {
      const newNews: NewsItem = {
        id: uid('news'),
        ...formData,
      }
      setContent({
        ...content,
        news: [newNews, ...content.news],
      })
    }

    setShowAddModal(false)
    setEditingNews(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this news item?')) {
      return
    }

    const newsItem = content.news.find((n) => n.id === id)
    
    // Delete from AWS if image exists
    if (newsItem?.imageUrl) {
      try {
        await apiRequest('/uploads/images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: newsItem.imageUrl }),
          auth: true,
        })
      } catch (err) {
        console.warn('Failed to delete image from AWS:', err)
        // Continue with deletion even if AWS delete fails
      }
    }

    setContent({
      ...content,
      news: content.news.filter((n) => n.id !== id),
    })
  }

  const toggleFeatured = (id: string) => {
    setContent({
      ...content,
      news: content.news.map((n) => ({
        ...n,
        featured: n.id === id ? !n.featured : false, // Only one can be featured
      })),
    })
  }

  const togglePinned = (id: string) => {
    setContent({
      ...content,
      news: content.news.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    })
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Dashboard
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">News Management</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">News Management</h1>
          <p className="text-gray-600">Create, edit, and manage news articles for the website.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] text-white px-5 py-2.5 rounded-lg font-bold transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          Add New News
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news by title or excerpt..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
          />
        </div>
      </div>

      {/* News List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Image</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Title</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Badge</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No news items found. Click "Add New News" to create one.
                  </td>
                </tr>
              ) : (
                filteredNews.map((news) => (
                  <tr key={news.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <img
                        src={news.imageUrl}
                        alt={news.title}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          void getSignedUrlForImage(news.imageUrl)
                            .then((signed) => {
                              if (signed) {
                                target.src = signed
                              } else {
                                target.src = '/assets/images/placeholder.svg'
                              }
                            })
                            .catch(() => {
                              target.src = '/assets/images/placeholder.svg'
                            })
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{news.title}</div>
                      {news.excerpt && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">{news.excerpt}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                        {news.badge}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{news.dateText}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {news.featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded w-fit">
                            Featured
                          </span>
                        )}
                        {news.pinned && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded w-fit">
                            Pinned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFeatured(news.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            news.featured
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={news.featured ? 'Remove from featured' : 'Make featured'}
                        >
                          <span className="material-symbols-outlined text-lg">star</span>
                        </button>
                        <button
                          onClick={() => togglePinned(news.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            news.pinned
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={news.pinned ? 'Unpin' : 'Pin'}
                        >
                          <span className="material-symbols-outlined text-lg">push_pin</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(news)}
                          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(news.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingNews ? 'Edit News' : 'Add New News'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingNews(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                  placeholder="Enter news title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Badge</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    placeholder="UPDATE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => {
                      const date = new Date(e.target.value)
                      const dateText = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' })
                      setFormData({ ...formData, date: e.target.value, dateText })
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none resize-y text-gray-900"
                  placeholder="Enter a short excerpt..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Article Content</label>
                <textarea
                  value={formData.article}
                  onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none resize-y text-gray-900"
                  placeholder="Enter the full article content..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Image <span className="text-red-500">*</span>
                </label>
                
                {/* Radio buttons for upload method */}
                <div className="flex items-center gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="file"
                      checked={imageUploadMethod === 'file'}
                      onChange={(e) => setImageUploadMethod(e.target.value as 'file' | 'url')}
                      className="w-4 h-4 text-[#5a0a8f] focus:ring-[#5a0a8f]"
                    />
                    <span className="text-sm font-medium text-gray-700">Upload File</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="url"
                      checked={imageUploadMethod === 'url'}
                      onChange={(e) => setImageUploadMethod(e.target.value as 'file' | 'url')}
                      className="w-4 h-4 text-[#5a0a8f] focus:ring-[#5a0a8f]"
                    />
                    <span className="text-sm font-medium text-gray-700">Enter URL</span>
                  </label>
                </div>

                {/* Conditional rendering based on selected method */}
                {imageUploadMethod === 'file' ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-900 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-2 file:border-gray-300 file:text-sm file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                      />
                      {uploading && (
                        <span className="text-sm text-gray-600">Uploading...</span>
                      )}
                    </div>
                    {compressedSize && (
                      <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Image optimized: {compressedSize}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setUploadError(null)
                        setFormData({ ...formData, imageUrl: e.target.value })
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                )}
                {uploadError && (
                  <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                )}
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="mt-2 w-full h-48 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                )}
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#5a0a8f] focus:ring-[#5a0a8f]"
                  />
                  <span className="text-sm text-gray-700">Pin to top</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#5a0a8f] focus:ring-[#5a0a8f]"
                  />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingNews(null)
                  }}
                  className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-bold transition-colors"
                >
                  {editingNews ? 'Update News' : 'Add News'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
