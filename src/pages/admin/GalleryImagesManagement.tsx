import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWebsiteContent } from '../../context/WebsiteContentContext'
import { apiRequest } from '../../lib/api'
import { fieldClass, PAGE_SIZE_MEDIA } from '../../lib/formStyles'
import { ListPagination } from '../../components/ListPagination'

export function GalleryImagesManagement() {
  const { content, addGalleryImage, removeGalleryImage } = useWebsiteContent()
  const [galleryUploadError, setGalleryUploadError] = useState('')
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [page, setPage] = useState(1)
  const [galleryImage, setGalleryImage] = useState<{ imageFile: File | null; imageUrl: string }>({
    imageFile: null,
    imageUrl: '',
  })
  const [galleryImageUrlInput, setGalleryImageUrlInput] = useState('')

  const sortedImages = useMemo(
    () =>
      [...content.homepage.galleryImages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [content.homepage.galleryImages],
  )

  const totalPages = Math.max(1, Math.ceil(sortedImages.length / PAGE_SIZE_MEDIA))
  const safePage = Math.min(page, totalPages)
  const pagedImages = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE_MEDIA
    return sortedImages.slice(start, start + PAGE_SIZE_MEDIA)
  }, [sortedImages, safePage])

  const handleGalleryImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setGalleryImage({ imageFile: file, imageUrl: '' })
    setGalleryUploadError('')
  }

  const handleAddGalleryImage = async () => {
    setGalleryUploadError('')
    if (galleryImageUrlInput) {
      await addGalleryImage({ imageUrl: galleryImageUrlInput, title: 'Gallery Image' })
      setGalleryImage({ imageFile: null, imageUrl: '' })
      setGalleryImageUrlInput('')
      setPage(1)
      return
    }
    if (!galleryImage.imageFile) {
      setGalleryUploadError('Please upload an image or enter an image URL')
      return
    }
    try {
      setGalleryUploading(true)
      const formData = new FormData()
      formData.append('image', galleryImage.imageFile)
      formData.append('name', 'gallery-image')
      const response = await apiRequest<{ key: string; url: string }>('/uploads/gallery', {
        method: 'POST',
        auth: true,
        body: formData,
      })
      await addGalleryImage({ imageUrl: response.url, title: 'Gallery Image' })
      setGalleryImage({ imageFile: null, imageUrl: '' })
      setGalleryImageUrlInput('')
      setPage(1)
    } catch (error) {
      setGalleryUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setGalleryUploading(false)
    }
  }

  const handleDeleteGalleryImage = async (id: string) => {
    if (!window.confirm('Delete this gallery image?')) return
    await removeGalleryImage(id)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin/media" className="text-[#5a0a8f] text-sm font-semibold hover:underline">
            ← Back to Media
          </Link>
          <h1 className="text-2xl font-black text-gray-900 mt-2">Gallery Images</h1>
          <p className="text-gray-600">Manage photos shown in the public Media Gallery ({sortedImages.length} total).</p>
          <p className="text-sm text-gray-500 mt-1">Admin grid shows {PAGE_SIZE_MEDIA} images per page (same as public site).</p>
        </div>
        <Link
          to="/media"
          className="px-5 py-2.5 rounded-lg border-2 border-[#5a0a8f] text-[#5a0a8f] font-bold hover:bg-purple-50 bg-white shrink-0"
        >
          View All (public)
        </Link>
      </div>

      {sortedImages.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pagedImages.map((img, index) => {
              const serial = (safePage - 1) * PAGE_SIZE_MEDIA + index + 1
              return (
                <div key={img.id} className="relative rounded-lg overflow-hidden border group bg-white">
                  <span className="absolute top-2 left-2 z-10 bg-[#5a0a8f] text-white text-xs font-black px-2 py-0.5 rounded-full">
                    {serial}
                  </span>
                  <img src={img.imageUrl} alt={img.title || 'Gallery'} className="w-full h-36 object-cover" />
                  <p className="px-2 py-1.5 text-sm font-bold text-gray-900 truncate">{img.title || 'Gallery Image'}</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteGalleryImage(img.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              )
            })}
          </div>
          <ListPagination
            page={safePage}
            totalItems={sortedImages.length}
            pageSize={PAGE_SIZE_MEDIA}
            onPageChange={setPage}
          />
        </>
      ) : (
        <p className="text-gray-500">No gallery images yet.</p>
      )}

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Add New Image</h2>
        <input
          id="gallery-image-upload"
          type="file"
          accept="image/*"
          onChange={handleGalleryImageFileChange}
          className="block w-full text-sm text-gray-800"
        />
        <input
          type="url"
          placeholder="Or paste image URL"
          value={galleryImageUrlInput}
          onChange={(e) => setGalleryImageUrlInput(e.target.value)}
          className={fieldClass}
        />
        {galleryUploadError && <p className="text-red-600 text-sm">{galleryUploadError}</p>}
        <button
          type="button"
          onClick={() => void handleAddGalleryImage()}
          disabled={galleryUploading}
          className="px-4 py-2 bg-[#5a0a8f] text-white rounded-lg font-bold disabled:opacity-60"
        >
          {galleryUploading ? 'Uploading…' : 'Add to Gallery'}
        </button>
      </div>
    </div>
  )
}
