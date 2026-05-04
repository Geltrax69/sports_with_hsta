import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWebsiteContent } from '../../context/WebsiteContentContext'

export function AdminManageDirectories() {
  const { content, addCustomPage, removeCustomPage } = useWebsiteContent()
  const navigate = useNavigate()
  
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const customPages = content.aboutPage?.customPages || []

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setIsSubmitting(true)
    try {
      const slug = newTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      await addCustomPage({
        title: newTitle.trim(),
        slug,
        content: `# ${newTitle.trim()}\n\nWelcome to the ${newTitle.trim()} page. Edit this content as needed.`
      })
      setNewTitle('')
      setIsAdding(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this custom page? This action cannot be undone.')) {
      await removeCustomPage(id)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Custom Directories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage dynamic pages that appear in the About Us dropdown and sidebar.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#5a0a8f] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#4a087a] transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isAdding ? 'close' : 'add'}
          </span>
          {isAdding ? 'Cancel' : 'Create New Page'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Page</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Page Title
              </label>
              <input
                type="text"
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. History, Achievements"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newTitle.trim()}
              className="bg-[#5a0a8f] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#4a087a] transition-colors disabled:opacity-50 h-[42px]"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {customPages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-400">folder_open</span>
            <p>No custom pages created yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {customPages.map((page) => (
              <li key={page.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{page.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    /about/{page.slug}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/admin/about/${page.slug}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    title="Edit Content"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    <span className="text-sm font-medium hidden sm:block">Edit Content</span>
                  </button>
                  <button
                    onClick={() => handleDelete(page.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Page"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
