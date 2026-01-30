import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useDocuments, type Document, type DocumentCategory } from '../../context/DocumentsContext'
import { useAuth } from '../../context/AuthContext'

export function DocumentsManagement() {
  const { documents, addDocument, updateDocument, deleteDocument } = useDocuments()
  useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const [formData, setFormData] = useState({
    title: '',
    category: 'official' as DocumentCategory,
    description: '',
    file: null as File | null,
    fileUrl: '',
    fileName: '',
  })

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [documents, searchQuery, categoryFilter])

  const categories: { value: DocumentCategory; label: string }[] = [
    { value: 'official', label: 'Official' },
    { value: 'forms', label: 'Forms' },
    { value: 'guidelines', label: 'Guidelines' },
    { value: 'rules', label: 'Rules' },
    { value: 'other', label: 'Other' },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB')
        return
      }
      setFormData({
        ...formData,
        file,
        fileName: file.name,
      })
    }
  }

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      category: 'official',
      description: '',
      file: null,
      fileUrl: '',
      fileName: '',
    })
    setEditingDoc(null)
    setShowAddModal(true)
  }

  const handleOpenEdit = (doc: Document) => {
    setFormData({
      title: doc.title,
      category: doc.category,
      description: doc.description,
      file: null,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
    })
    setEditingDoc(doc)
    setShowAddModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = new FormData()
    data.append('title', formData.title)
    data.append('category', formData.category)
    if (formData.description) {
      data.append('description', formData.description)
    }

    if (editingDoc) {
      // For update, only add file if a new one was selected
      if (formData.file) {
        data.append('file', formData.file)
      }
      await updateDocument(editingDoc.id, data)
    } else {
      // For create, file is required
      if (!formData.file) {
        alert('Please select a file to upload')
        return
      }
      data.append('file', formData.file)
      await addDocument(data)
    }

    setShowAddModal(false)
    setEditingDoc(null)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocument(id)
    }
  }

  const handleDownload = (doc: Document) => {
    if (doc.fileUrl.startsWith('data:')) {
      const link = document.createElement('a')
      link.href = doc.fileUrl
      link.download = doc.fileName
      link.click()
    } else {
      window.open(doc.fileUrl, '_blank')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Dashboard
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Documents Management</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Documents Management</h1>
          <p className="text-gray-600">Upload, manage, and organize documents for public download.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] text-white px-5 py-2.5 rounded-lg font-bold transition-colors"
        >
          <span className="material-symbols-outlined">upload</span>
          Upload Document
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  Document
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  Size
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  Uploaded
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No documents found. Click "Upload Document" to add one.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{doc.title}</div>
                        {doc.description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-1">{doc.description}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">{doc.fileName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded capitalize">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(doc.fileSize)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                      {doc.uploadedBy && (
                        <div className="text-xs text-gray-500">by {doc.uploadedBy}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title="Download"
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
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
                {editingDoc ? 'Edit Document' : 'Upload New Document'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingDoc(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                  placeholder="Enter document title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as DocumentCategory })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none resize-y text-gray-900"
                  placeholder="Enter document description"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {editingDoc ? 'Replace File (Optional)' : 'Upload File'} <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required={!editingDoc}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-4xl text-gray-400">upload_file</span>
                    <span className="text-sm text-gray-600">
                      {formData.file ? formData.fileName : editingDoc ? editingDoc.fileName : 'Click to upload PDF'}
                    </span>
                    {formData.file && (
                      <span className="text-xs text-gray-500">Size: {formatFileSize(formData.file.size)}</span>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingDoc(null)
                  }}
                  className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-bold transition-colors"
                >
                  {editingDoc ? 'Update Document' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
