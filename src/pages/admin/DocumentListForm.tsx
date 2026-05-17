import { useState, useRef } from 'react'
import { useWebsiteContent, type DocumentLink } from '../../context/WebsiteContentContext'
import { apiRequest } from '../../lib/api'

interface DocumentListFormProps {
  title: string
  field: 'accounts' | 'agmMeetings' | 'electionReports'
}

export function DocumentListForm({ title, field }: DocumentListFormProps) {
  const { content, updateAboutPage } = useWebsiteContent()
  const items = content.aboutPage?.[field] || []
  
  const [isUploading, setIsUploading] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', newTitle.trim())

      const response = await apiRequest<{ key: string; url: string }>('/uploads/documents', {
        method: 'POST',
        body: formData,
        auth: true,
      })

      if (!response.url) {
        throw new Error('Upload failed')
      }

      const newItem: DocumentLink = {
        title: newTitle.trim(),
        fileUrl: response.url,
      }

      await updateAboutPage({
        [field]: [...items, newItem]
      })

      setNewTitle('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      alert('Failed to upload document')
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string | undefined, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      // Try to delete from S3
      if (fileUrl && fileUrl.includes('amazonaws.com')) {
        try {
          await apiRequest('/uploads/images', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: fileUrl }),
            auth: true,
          })
        } catch (err) {
          console.warn('Failed to delete file from AWS:', err)
        }
      }

      const newItems = items.filter(item => item.id !== id && item.fileUrl !== fileUrl)
      await updateAboutPage({
        [field]: newItems
      })
    } catch (error) {
      alert('Failed to delete document')
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">Manage documents for the {title} page.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleAdd} className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Document</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Title (e.g. Particulars of Accounts 2023-2024)
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                required
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#5a0a8f] outline-none bg-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isUploading || !selectedFile || !newTitle.trim()}
                className="bg-[#5a0a8f] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#4a087a] transition-colors disabled:opacity-50 h-[42px] whitespace-nowrap"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </form>

        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-400">description</span>
            <p>No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#241b71] text-white">
                  <th className="py-3 px-4 text-center w-20 font-semibold border-r border-[#3a2e8c]">Sr. No</th>
                  <th className="py-3 px-4 font-semibold border-r border-[#3a2e8c]">{title}</th>
                  <th className="py-3 px-4 font-semibold text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-center text-gray-500">{index + 1}</td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900 font-medium">{item.title}</span>
                      <a 
                        href={item.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block mt-1 text-sm text-[#5a0a8f] hover:underline"
                      >
                        View File
                      </a>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(item.id, item.fileUrl)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
