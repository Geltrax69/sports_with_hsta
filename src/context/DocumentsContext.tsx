import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { documentsApi, type DocumentItem, type DocumentCategory } from '../lib/api'

export type { DocumentCategory }

export type Document = {
  id: string
  title: string
  category: DocumentCategory
  description: string
  fileUrl: string
  fileName: string
  fileSize: number
  uploadedAt: string
  uploadedBy?: string
  tournament?: string
  downloadCount?: number
}

type DocumentsContextType = {
  documents: Document[]
  loading: boolean
  error: string | null
  addDocument: (formData: FormData) => Promise<void>
  updateDocument: (id: string, formData: FormData) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  getDocumentById: (id: string) => Document | undefined
  getDocumentsByCategory: (category: DocumentCategory) => Document[]
  refreshDocuments: () => Promise<void>
  incrementDownload: (id: string) => Promise<void>
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined)

// Convert API document to context document format
function convertApiDocument(apiDoc: DocumentItem): Document {
  return {
    id: apiDoc._id,
    title: apiDoc.title,
    category: apiDoc.category,
    description: apiDoc.description || '',
    fileUrl: apiDoc.fileUrl,
    fileName: apiDoc.fileName,
    fileSize: apiDoc.fileSize,
    uploadedAt: apiDoc.uploadedAt,
    uploadedBy: apiDoc.uploadedBy?.name,
    tournament: apiDoc.tournament?.title,
    downloadCount: apiDoc.downloadCount,
  }
}

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await documentsApi.getAll()
      const convertedDocs = response.data.map(convertApiDocument)
      setDocuments(convertedDocs)
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch documents')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDocuments()
  }, [])

  const addDocument = async (formData: FormData) => {
    try {
      const response = await documentsApi.create(formData)
      const newDoc = convertApiDocument(response.data)
      setDocuments([newDoc, ...documents])
    } catch (err) {
      console.error('Error adding document:', err)
      throw err
    }
  }

  const updateDocument = async (id: string, formData: FormData) => {
    try {
      const response = await documentsApi.update(id, formData)
      const updatedDoc = convertApiDocument(response.data)
      setDocuments(documents.map((d) => (d.id === id ? updatedDoc : d)))
    } catch (err) {
      console.error('Error updating document:', err)
      throw err
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      await documentsApi.delete(id)
      setDocuments(documents.filter((d) => d.id !== id))
    } catch (err) {
      console.error('Error deleting document:', err)
      throw err
    }
  }

  const getDocumentById = (id: string) => {
    return documents.find((d) => d.id === id)
  }

  const getDocumentsByCategory = (category: DocumentCategory) => {
    return documents.filter((d) => d.category === category)
  }

  const refreshDocuments = async () => {
    await fetchDocuments()
  }

  const incrementDownload = async (id: string) => {
    try {
      await documentsApi.incrementDownload(id)
      // Update local state
      setDocuments(
        documents.map((d) =>
          d.id === id ? { ...d, downloadCount: (d.downloadCount || 0) + 1 } : d,
        ),
      )
    } catch (err) {
      console.error('Error incrementing download count:', err)
    }
  }

  return (
    <DocumentsContext.Provider
      value={{
        documents,
        loading,
        error,
        addDocument,
        updateDocument,
        deleteDocument,
        getDocumentById,
        getDocumentsByCategory,
        refreshDocuments,
        incrementDownload,
      }}
    >
      {children}
    </DocumentsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDocuments() {
  const context = useContext(DocumentsContext)
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentsProvider')
  }
  return context
}
