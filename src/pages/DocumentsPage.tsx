import { useState, useMemo } from 'react'
import { useDocuments } from '../context/DocumentsContext'
import { formatDate } from '../lib/dateUtils'
import { Skeleton } from 'boneyard-js/react'

export function DocumentsPage() {
  const { documents, loading, error, incrementDownload } = useDocuments()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Get unique years from documents
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    documents.forEach((doc) => {
      const year = new Date(doc.uploadedAt).getFullYear().toString()
      years.add(year)
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
  }, [documents])

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory

      const docYear = new Date(doc.uploadedAt).getFullYear().toString()
      const matchesYear = selectedYear === 'all' || docYear === selectedYear

      return matchesSearch && matchesCategory && matchesYear
    })
  }, [documents, searchQuery, selectedCategory, selectedYear])

  // Paginate documents
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredDocuments.slice(start, end)
  }, [filteredDocuments, currentPage])

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)

  // Reset to page 1 when filters change
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    setCurrentPage(1)
  }

  const handleDownload = async (doc: typeof documents[0]) => {
    try {
      await incrementDownload(doc.id)
      const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
      const url =
        doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://')
          ? doc.fileUrl
          : `${apiBase}/api/documents/${doc.id}/download-file`
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('Error downloading document:', err)
      alert('Could not download this file. Try again or re-generate the PDF from the admin tournament page.')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      official: 'description',
      forms: 'description',
      guidelines: 'health_and_safety',
      rules: 'gavel',
      other: 'folder',
    }
    return icons[category] || 'description'
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      official: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      forms: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      guidelines: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      rules: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    }
    return colors[category] || 'bg-gray-100 text-gray-600'
  }

  const getFileExtension = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toUpperCase()
    return ext || 'FILE'
  }

  return (
    <Skeleton name="documents-page" loading={loading}>
      <main id="page-content" className="w-full overflow-x-hidden relative">
        <section className="relative w-full min-h-[400px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBQkZ3uNiS3toCeitYMgI3en60sbHGrCFfS_mrSJR_zBr25ZEpm3jApXKID8GmpUBbzhJGl3Rlpwm0TnepehtJcUJ-zfEx3ky6DecBLi6sXU4qbvE8n_TewEKhZBFUqp28mnYd_FWOSl9pdfv-Df3FEkrwCka2vaLflSvMhRjbQfsc8vbcockhtk-wV1GBDI5oYK_gIYb8YmUbBBr0LJTsSHf5x-ow8cJ-6tozDP1aDYmSNn6NJFUZiZqCbftjCQlDZ18Nk1PaopU0")',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#5a0a8f]/90 via-[#be185d]/80 to-transparent z-10"></div>
        <div className="relative z-20 max-w-[1280px] w-full px-4 sm:px-6 lg:px-8 py-20 flex flex-col justify-center h-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
              <span className="material-symbols-outlined text-sm text-white">folder_open</span>
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                RESOURCE CENTER
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Official <span className="text-[#fcd34d]">Documents</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 font-light leading-relaxed max-w-lg">
              Access official rules, registration forms, circulars, and technical data directly from
              the federation. Keep your team up to date.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 -mt-24 relative z-30">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400">search</span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-3 border-none ring-1 ring-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#5a0a8f] focus:bg-white transition-all"
                placeholder="Search documents by name, year or keyword..."
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <select
                className="form-select bg-gray-50 border-none ring-1 ring-gray-200 text-gray-700 py-3 pl-4 pr-10 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] cursor-pointer min-w-[140px]"
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
              >
                <option value="all">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-5 transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#5a0a8f] text-white shadow-md shadow-[#5a0a8f]/25 hover:scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              <span className="text-sm font-bold">All</span>
            </button>
            <button
              onClick={() => handleCategoryChange('rules')}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-5 transition-all ${
                selectedCategory === 'rules'
                  ? 'bg-[#5a0a8f] text-white shadow-md shadow-[#5a0a8f]/25 hover:scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              <span className="text-sm font-medium">Rules</span>
            </button>
            <button
              onClick={() => handleCategoryChange('forms')}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-5 transition-all ${
                selectedCategory === 'forms'
                  ? 'bg-[#5a0a8f] text-white shadow-md shadow-[#5a0a8f]/25 hover:scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              <span className="text-sm font-medium">Forms</span>
            </button>
            <button
              onClick={() => handleCategoryChange('guidelines')}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-5 transition-all ${
                selectedCategory === 'guidelines'
                  ? 'bg-[#5a0a8f] text-white shadow-md shadow-[#5a0a8f]/25 hover:scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
              <span className="text-sm font-medium">Guidelines</span>
            </button>
            <button
              onClick={() => handleCategoryChange('official')}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-5 transition-all ${
                selectedCategory === 'official'
                  ? 'bg-[#5a0a8f] text-white shadow-md shadow-[#5a0a8f]/25 hover:scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">folder</span>
              <span className="text-sm font-medium">Official</span>
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-xl font-bold text-[#160d1c] dark:text-white px-1">
            Recent Documents
          </h3>

          {error && (
            <div className="text-center py-20 text-red-600">
              <span className="material-symbols-outlined text-4xl mb-2">error</span>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && paginatedDocuments.length === 0 && (
            <div className="text-center py-20 opacity-60">
              <span className="material-symbols-outlined text-4xl mb-2 text-gray-400">
                folder_off
              </span>
              <p className="text-gray-500">No documents found matching your criteria.</p>
            </div>
          )}

          {!loading && !error && paginatedDocuments.length > 0 && (
            <div className="flex flex-col gap-4">
              {paginatedDocuments.map((doc) => (
                <article
                  key={doc.id}
                  className="group flex flex-col md:flex-row items-start md:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-[#5a0a8f]/30 hover:shadow-md transition-all"
                >
                  <div
                    className={`flex items-center justify-center rounded-lg shrink-0 size-14 ${getCategoryColor(doc.category)}`}
                  >
                    <span className="material-symbols-outlined text-3xl">
                      {getCategoryIcon(doc.category)}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1 gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-gray-900 text-lg font-bold leading-tight group-hover:text-[#5a0a8f] transition-colors">
                        {doc.title}
                      </h4>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {doc.description || `Official document classified under ${doc.category}.`}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          calendar_today
                        </span>{' '}
                        {formatDate(doc.uploadedAt)}
                      </span>
                      <span>•</span>
                      <span>{getFileExtension(doc.fileName)}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      {doc.downloadCount !== undefined && doc.downloadCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{doc.downloadCount} downloads</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-full md:w-auto mt-3 md:mt-0 shrink-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex w-full md:w-auto cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors gap-2 group-hover:bg-[#5a0a8f] group-hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      <span>Download</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center size-10 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex items-center justify-center size-10 rounded-lg font-medium transition-all ${
                    page === currentPage
                      ? 'bg-[#5a0a8f] text-white shadow-md shadow-[#5a0a8f]/20 transform scale-105'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center size-10 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
    </Skeleton>
  )
}
