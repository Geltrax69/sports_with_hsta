import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useWebsiteContent } from '../../context/WebsiteContentContext'
import { getSignedUrlForImage } from '../../lib/images'
import { useSiteContent } from '../../content/SiteContentContext'
import { apiRequest } from '../../lib/api'
import { processImageFile } from '../../lib/imageCompression'
import type { NewsItem, TournamentItem } from '../../content/types'

type TabType = 'homepage' | 'about' | 'events'

export function WebsiteContentManagement() {
  const { content, updateHomepage, updateAboutPage, updateEventsPage, addGalleryImage, removeGalleryImage, addJourneyItem, updateJourneyItem, removeJourneyItem } = useWebsiteContent()
  const { content: siteContent } = useSiteContent()
  const [activeTab, setActiveTab] = useState<TabType>('homepage')
  const [galleryUploadError, setGalleryUploadError] = useState<string>('')
  const [galleryUploading, setGalleryUploading] = useState(false)

  // Homepage State
  const [galleryImage, setGalleryImage] = useState<{ imageFile: File | null; imageUrl: string }>({
    imageFile: null,
    imageUrl: '',
  })
  const [galleryImageUrlInput, setGalleryImageUrlInput] = useState<string>('')

  // About Page State
  const [journeyItem, setJourneyItem] = useState<{ year: string; title: string; description: string; imageFile: File | null; imageUrl: string }>({
    year: '',
    title: '',
    description: '',
    imageFile: null,
    imageUrl: '',
  })
  const [editingJourney, setEditingJourney] = useState<string | null>(null)
  const [journeyImageUrlInput, setJourneyImageUrlInput] = useState<string>('')

  // Get featured news and tournaments
  const featuredNews = useMemo(() => {
    return content.homepage.featuredNewsIds
      .map((id) => siteContent.news.find((n) => n.id === id))
      .filter((n): n is NewsItem => n !== undefined)
  }, [content.homepage.featuredNewsIds, siteContent.news])

  const featuredTournaments = useMemo(() => {
    return content.homepage.featuredTournamentIds
      .map((id) => siteContent.tournaments.find((t) => t.id === id))
      .filter((t): t is TournamentItem => t !== undefined)
  }, [content.homepage.featuredTournamentIds, siteContent.tournaments])

  const handleGalleryImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Compress and validate image
        const processedFile = await processImageFile(file)
        setGalleryImage({ imageFile: processedFile, imageUrl: '' })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid image file'
        alert(message)
      }
    }
  }

  const handleJourneyImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Compress and validate image
        const processedFile = await processImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setJourneyItem({ ...journeyItem, imageFile: processedFile, imageUrl: reader.result as string })
        }
        reader.readAsDataURL(processedFile)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid image file'
        alert(message)
      }
    }
  }

  const handleAddGalleryImage = async () => {
    setGalleryUploadError('')
    
    // Check if URL is provided
    if (galleryImageUrlInput) {
      addGalleryImage({
        imageUrl: galleryImageUrlInput,
        title: 'Gallery Image',
        description: '',
      })
      setGalleryImage({ imageFile: null, imageUrl: '' })
      setGalleryImageUrlInput('')
      const fileInput = document.getElementById('gallery-image-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      return
    }

    // Check if file is provided
    if (!galleryImage.imageFile) {
      setGalleryUploadError('Please upload an image or enter an image URL')
      return
    }

    try {
      setGalleryUploading(true)
      
      // Upload to AWS
      const formData = new FormData()
      formData.append('image', galleryImage.imageFile)
      formData.append('name', 'gallery-image')

      const response = await apiRequest<{ key: string; url: string }>('/uploads/gallery', {
        method: 'POST',
        body: formData,
        auth: true,
      })

      if (!response.url) {
        throw new Error('No URL returned from upload')
      }

      // Add to gallery with the AWS URL
      addGalleryImage({
        imageUrl: response.url,
        title: 'Gallery Image',
        description: '',
      })

      setGalleryImage({ imageFile: null, imageUrl: '' })
      setGalleryImageUrlInput('')
      
      // Reset file input
      const fileInput = document.getElementById('gallery-image-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image to AWS'
      setGalleryUploadError(message)
      console.error('Gallery upload error:', error)
    } finally {
      setGalleryUploading(false)
    }
  }

  const handleDeleteGalleryImage = async (id: string, imageUrl: string) => {
    if (!window.confirm('Delete this gallery image?')) {
      return
    }

    // Delete from AWS if it's an S3 URL
    if (imageUrl && imageUrl.includes('amazonaws.com')) {
      try {
        await apiRequest('/uploads/images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: imageUrl }),
          auth: true,
        })
      } catch (err) {
        console.warn('Failed to delete image from AWS:', err)
        // Continue with deletion even if AWS delete fails
      }
    }

    removeGalleryImage(id)
  }

  const handleAddJourneyItem = () => {
    if (!journeyItem.year || !journeyItem.title) {
      alert('Please fill in required fields')
      return
    }
    if (editingJourney) {
      const existingItem = content.aboutPage.journeyItems.find((j) => j.id === editingJourney)
      updateJourneyItem(editingJourney, {
        year: journeyItem.year,
        title: journeyItem.title,
        description: journeyItem.description,
        imageUrl: (journeyImageUrlInput || journeyItem.imageUrl) || undefined,
        order: existingItem?.order || 0,
      })
      setEditingJourney(null)
    } else {
      addJourneyItem({
        year: journeyItem.year,
        title: journeyItem.title,
        description: journeyItem.description,
        imageUrl: (journeyImageUrlInput || journeyItem.imageUrl) || undefined,
      })
    }
    setJourneyItem({ year: '', title: '', description: '', imageFile: null, imageUrl: '' })
    setJourneyImageUrlInput('')
    // Reset file input
    const fileInput = document.getElementById('journey-image-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleEditJourney = (id: string) => {
    const item = content.aboutPage.journeyItems.find((j) => j.id === id)
    if (item) {
      setJourneyItem({
        year: item.year,
        title: item.title,
        description: item.description,
        imageFile: null,
        imageUrl: item.imageUrl || '',
      })
      setEditingJourney(id)
    }
  }

  const removeFeaturedNews = (id: string) => {
    updateHomepage({
      featuredNewsIds: content.homepage.featuredNewsIds.filter((newsId) => newsId !== id),
    })
  }

  const removeFeaturedTournament = (id: string) => {
    updateHomepage({
      featuredTournamentIds: content.homepage.featuredTournamentIds.filter((tournamentId) => tournamentId !== id),
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
        <span className="text-gray-900 font-medium">Website Content</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Website Content Management</h1>
        <p className="text-gray-600">Manage content for different pages of the website.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('homepage')}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'homepage'
              ? 'bg-[#5a0a8f] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Homepage
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'about'
              ? 'bg-[#5a0a8f] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          About Page
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'events'
              ? 'bg-[#5a0a8f] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Events Page
        </button>
      </div>

      {/* Homepage Tab */}
      {activeTab === 'homepage' && (
        <div className="space-y-6">
          {/* Currently Selected Featured News */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Currently Featured News (Will Show on Homepage)</h2>
            {featuredNews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No news items selected. Select news items below.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredNews.map((news) => (
                  <div
                    key={news.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#5a0a8f] transition-colors relative group"
                  >
                    <button
                      onClick={() => removeFeaturedNews(news.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Remove from featured"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                    <img
                      src={news.imageUrl}
                      alt={news.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
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
                    <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{news.title}</div>
                    <div className="text-xs text-gray-500">{news.dateText}</div>
                    <div className="mt-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                        {news.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Select News to Feature */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select News to Feature on Homepage</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select which news items should be displayed on the homepage. You can select multiple.
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {siteContent.news.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No news items available. Go to{' '}
                  <Link to="/admin/news" className="text-[#5a0a8f] hover:underline font-semibold">
                    News Management
                  </Link>{' '}
                  to add news.
                </p>
              ) : (
                siteContent.news.map((news) => (
                  <label
                    key={news.id}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      content.homepage.featuredNewsIds.includes(news.id)
                        ? 'border-[#5a0a8f] bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={content.homepage.featuredNewsIds.includes(news.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateHomepage({
                            featuredNewsIds: [...content.homepage.featuredNewsIds, news.id],
                          })
                        } else {
                          updateHomepage({
                            featuredNewsIds: content.homepage.featuredNewsIds.filter((id) => id !== news.id),
                          })
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-[#5a0a8f] focus:ring-[#5a0a8f]"
                    />
                    <img
                      src={news.imageUrl}
                      alt={news.title}
                      className="w-16 h-16 object-cover rounded"
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
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{news.title}</div>
                      <div className="text-sm text-gray-500">{news.dateText}</div>
                    </div>
                    {news.featured && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                        Featured
                      </span>
                    )}
                    {news.pinned && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">Pinned</span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Currently Selected Featured Tournaments */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Currently Featured Tournaments (Will Show in Event Calendar)
            </h2>
            {featuredTournaments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tournaments selected. Select tournaments below.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#5a0a8f] transition-colors relative group"
                  >
                    <button
                      onClick={() => removeFeaturedTournament(tournament.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Remove from featured"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="bg-[#5a0a8f] text-white rounded-lg w-16 h-16 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold uppercase">{tournament.month}</span>
                        <span className="text-2xl font-black">{tournament.day}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{tournament.title}</div>
                        <div className="text-sm text-gray-600 mb-2">{tournament.location}</div>
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            tournament.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-700'
                              : tournament.status === 'REGISTRATION OPEN'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tournament.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Select Tournaments for Calendar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Tournaments for Event Calendar</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select which tournaments should appear in the event calendar on homepage.
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {siteContent.tournaments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No tournaments available. Go to{' '}
                  <Link to="/admin/tournaments" className="text-[#5a0a8f] hover:underline font-semibold">
                    Tournament Management
                  </Link>{' '}
                  to add tournaments.
                </p>
              ) : (
                siteContent.tournaments.map((tournament) => (
                  <label
                    key={tournament.id}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      content.homepage.featuredTournamentIds.includes(tournament.id)
                        ? 'border-[#5a0a8f] bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={content.homepage.featuredTournamentIds.includes(tournament.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateHomepage({
                            featuredTournamentIds: [...content.homepage.featuredTournamentIds, tournament.id],
                          })
                        } else {
                          updateHomepage({
                            featuredTournamentIds: content.homepage.featuredTournamentIds.filter(
                              (id) => id !== tournament.id,
                            ),
                          })
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-[#5a0a8f] focus:ring-[#5a0a8f]"
                    />
                    <div className="bg-gray-100 rounded-lg w-12 h-12 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#5a0a8f] uppercase">{tournament.month}</span>
                      <span className="text-lg font-black text-gray-900">{tournament.day}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{tournament.title}</div>
                      <div className="text-sm text-gray-500">
                        {tournament.month} {tournament.day} - {tournament.location}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded ${
                        tournament.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : tournament.status === 'REGISTRATION OPEN'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tournament.status}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Gallery Images */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Featured Gallery Images ({content.homepage.galleryImages.length} images)
            </h2>

            {/* Current Gallery Images - Visual Display */}
            {content.homepage.galleryImages.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Gallery Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {content.homepage.galleryImages.map((img) => (
                    <div key={img.id} className="relative group border-2 border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={img.imageUrl}
                        alt={img.title || 'Gallery image'}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          void getSignedUrlForImage(img.imageUrl, true)
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
                      <button
                        onClick={() => handleDeleteGalleryImage(img.id, img.imageUrl)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                      {(img.title || img.description) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                          {img.title && <div className="font-semibold">{img.title}</div>}
                          {img.description && (
                            <div className="text-white/80 line-clamp-1">{img.description}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6 p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-3">image</span>
                <p className="text-gray-500">No gallery images yet. Add your first image below.</p>
              </div>
            )}

            {/* Add New Gallery Image */}
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
              <h3 className="font-semibold text-gray-900 mb-3">Add New Gallery Image</h3>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Upload Image <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="gallery-image-upload"
                    accept="image/*"
                    onChange={handleGalleryImageFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="gallery-image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-4xl text-gray-400">upload_file</span>
                    <span className="text-sm text-gray-600">
                      {galleryImage.imageFile ? galleryImage.imageFile.name : 'Click to upload image'}
                    </span>
                    {galleryImage.imageFile && (
                      <span className="text-xs text-gray-500">
                        Size: {(galleryImage.imageFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                    <span className="text-xs text-gray-400">Max size: 5MB</span>
                  </label>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Or enter Image URL</label>
                  <input
                    type="url"
                    value={galleryImageUrlInput}
                    onChange={(e) => setGalleryImageUrlInput(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {(galleryImageUrlInput || galleryImage.imageFile) && (
                  <img
                    src={galleryImageUrlInput || (galleryImage.imageFile ? URL.createObjectURL(galleryImage.imageFile) : '')}
                    alt="Preview"
                    className="mt-4 w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                )}
              </div>
              {galleryUploadError && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {galleryUploadError}
                  </p>
                </div>
              )}
              <button
                onClick={handleAddGalleryImage}
                disabled={galleryUploading}
                className="px-4 py-2 bg-[#5a0a8f] hover:bg-[#400466] disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {galleryUploading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">loading</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">add</span>
                    Add Image to Gallery
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Page Tab */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          {/* Mission & Vision */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mission & Vision</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Mission</label>
                <textarea
                  value={content.aboutPage.mission || ''}
                  onChange={(e) => updateAboutPage({ mission: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none resize-y text-gray-900"
                  placeholder="Enter mission statement..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Vision</label>
                <textarea
                  value={content.aboutPage.vision || ''}
                  onChange={(e) => updateAboutPage({ vision: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none resize-y text-gray-900"
                  placeholder="Enter vision statement..."
                />
              </div>
            </div>
          </div>

          {/* Our Journey Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Our Journey Timeline ({content.aboutPage.journeyItems.length} items)
            </h2>

            {/* Current Journey Items - Visual Display */}
            {content.aboutPage.journeyItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Journey Items</h3>
                <div className="space-y-4">
                  {content.aboutPage.journeyItems
                    .sort((a, b) => parseInt(a.year) - parseInt(b.year))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="border-2 border-gray-200 rounded-lg p-4 flex items-start gap-4 hover:border-[#5a0a8f] transition-colors relative group"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-bold text-[#5a0a8f] text-xl mb-1">{item.year}</div>
                              <div className="font-semibold text-gray-900 text-lg">{item.title}</div>
                              <div className="text-gray-600 mt-2">{item.description}</div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditJourney(item.id)}
                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                title="Edit"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Delete this journey item?')) {
                                    removeJourneyItem(item.id)
                                  }
                                }}
                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Add/Edit Journey Item Form */}
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
              <h3 className="font-semibold text-gray-900 mb-3">
                {editingJourney ? 'Edit Journey Item' : 'Add New Journey Item'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={journeyItem.year}
                    onChange={(e) => setJourneyItem({ ...journeyItem, year: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    placeholder="e.g., 1982"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={journeyItem.title}
                    onChange={(e) => setJourneyItem({ ...journeyItem, title: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    placeholder="Event title"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  value={journeyItem.description}
                  onChange={(e) => setJourneyItem({ ...journeyItem, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none resize-y text-gray-900"
                  placeholder="Event description..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Upload Image (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="journey-image-upload"
                    accept="image/*"
                    onChange={handleJourneyImageFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="journey-image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-3xl text-gray-400">upload_file</span>
                    <span className="text-sm text-gray-600">
                      {journeyItem.imageFile ? journeyItem.imageFile.name : 'Click to upload image'}
                    </span>
                    {journeyItem.imageFile && (
                      <span className="text-xs text-gray-500">
                        Size: {(journeyItem.imageFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                    <span className="text-xs text-gray-400">Max size: 5MB</span>
                  </label>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Or enter Image URL</label>
                  <input
                    type="url"
                    value={journeyImageUrlInput}
                    onChange={(e) => setJourneyImageUrlInput(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {(journeyImageUrlInput || journeyItem.imageUrl) && (
                  <img
                    src={journeyImageUrlInput || journeyItem.imageUrl}
                    alt="Preview"
                    className="mt-4 w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddJourneyItem}
                  className="px-4 py-2 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">check</span>
                  {editingJourney ? 'Update Item' : 'Add Item'}
                </button>
                {editingJourney && (
                  <button
                    onClick={() => {
                      setEditingJourney(null)
                      setJourneyItem({ year: '', title: '', description: '', imageFile: null, imageUrl: '' })
                      setJourneyImageUrlInput('')
                      const fileInput = document.getElementById('journey-image-upload') as HTMLInputElement
                      if (fileInput) fileInput.value = ''
                    }}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Page Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Currently Featured Events */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Currently Featured Events ({content.eventsPage.featuredEventIds.length} events)
            </h2>
            {content.eventsPage.featuredEventIds.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No events selected. Select events below.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.eventsPage.featuredEventIds
                  .map((id) => siteContent.tournaments.find((t) => t.id === id))
                  .filter((t): t is TournamentItem => t !== undefined)
                  .map((tournament) => (
                    <div
                      key={tournament.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#5a0a8f] transition-colors relative group"
                    >
                      <button
                        onClick={() => {
                          updateEventsPage({
                            featuredEventIds: content.eventsPage.featuredEventIds.filter((id) => id !== tournament.id),
                          })
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Remove from featured"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                      <div className="flex items-center gap-4">
                        <div className="bg-[#5a0a8f] text-white rounded-lg w-16 h-16 flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-bold uppercase">{tournament.month}</span>
                          <span className="text-2xl font-black">{tournament.day}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{tournament.title}</div>
                          <div className="text-sm text-gray-600 mb-2">{tournament.location}</div>
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded ${
                              tournament.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-700'
                                : tournament.status === 'REGISTRATION OPEN'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tournament.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Select Events to Feature */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Events to Feature on Events Page</h2>
            <p className="text-sm text-gray-600 mb-6">
              Configure which events and tournaments should be featured on the events page.
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {siteContent.tournaments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No tournaments available. Go to{' '}
                  <Link to="/admin/tournaments" className="text-[#5a0a8f] hover:underline font-semibold">
                    Tournament Management
                  </Link>{' '}
                  to add tournaments.
                </p>
              ) : (
                siteContent.tournaments.map((tournament) => (
                  <label
                    key={tournament.id}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      content.eventsPage.featuredEventIds.includes(tournament.id)
                        ? 'border-[#5a0a8f] bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={content.eventsPage.featuredEventIds.includes(tournament.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateEventsPage({
                            featuredEventIds: [...content.eventsPage.featuredEventIds, tournament.id],
                          })
                        } else {
                          updateEventsPage({
                            featuredEventIds: content.eventsPage.featuredEventIds.filter(
                              (id) => id !== tournament.id,
                            ),
                          })
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-[#5a0a8f] focus:ring-[#5a0a8f]"
                    />
                    <div className="bg-gray-100 rounded-lg w-12 h-12 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#5a0a8f] uppercase">{tournament.month}</span>
                      <span className="text-lg font-black text-gray-900">{tournament.day}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{tournament.title}</div>
                      <div className="text-sm text-gray-500">
                        {tournament.month} {tournament.day} - {tournament.location} ({tournament.status})
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded ${
                        tournament.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : tournament.status === 'REGISTRATION OPEN'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tournament.status}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
