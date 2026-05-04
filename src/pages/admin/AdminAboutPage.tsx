import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useWebsiteContent, type AboutPageSettings } from '../../context/WebsiteContentContext'
import { ExecutiveBoardForm } from './ExecutiveBoardForm'
import { MemberUnitForm } from './MemberUnitForm'
import { RtiForm } from './RtiForm'
import { DocumentListForm } from './DocumentListForm'
import { CustomPageForm } from './CustomPageForm'

const PAGE_MAPPING: Record<string, { title: string, field: keyof AboutPageSettings }> = {
  'executive-board': { title: 'Executive Board', field: 'executiveBoardText' },
  'member-unit': { title: 'Member Unit', field: 'memberUnitText' },
  'rti': { title: 'RTI', field: 'rtiText' },
  'annual-report': { title: 'Annual Report', field: 'annualReportText' },
  'election-report': { title: 'Election Report', field: 'electionReportText' },
}

export function AdminAboutPage() {
  const { pageId } = useParams<{ pageId: string }>()
  const { content, updateAboutPage } = useWebsiteContent()
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  if (pageId === 'accounts') {
    return <DocumentListForm title="Accounts and Expenditures" field="accounts" />
  }
  if (pageId === 'agm-meetings') {
    return <DocumentListForm title="AGM Meetings" field="agmMeetings" />
  }

  const staticConfig = pageId ? PAGE_MAPPING[pageId] : null
  const customPage = content.aboutPage?.customPages?.find(p => p.slug === pageId)

  if (customPage) {
    return <CustomPageForm customPage={customPage} />
  }
  
  const config = staticConfig

  useEffect(() => {
    if (staticConfig && content.aboutPage) {
      setText((content.aboutPage[staticConfig.field] as string) || '')
    }
  }, [staticConfig, content.aboutPage])

  const handleSave = async () => {
    if (!config) return
    setIsSaving(true)
    setSaveMessage('')
    try {
      if (staticConfig) {
        await updateAboutPage({ [staticConfig.field]: text })
      }
      setSaveMessage('Content updated successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage('Failed to save content.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!config) {
    return <div className="p-6">Page not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.title} Content</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the content for the {config.title} page. This text will be displayed publicly.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#5a0a8f] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#4a087a] transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">save</span>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg ${saveMessage.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {saveMessage}
        </div>
      )}

      {pageId !== 'rti' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Page Content (Markdown/Text)
            </label>
            <textarea
              id="content"
              rows={15}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#5a0a8f] focus:ring-[#5a0a8f] border p-4 text-gray-800"
              placeholder={`Enter the content for ${config.title}...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>
      )}

      {pageId === 'executive-board' && (
        <ExecutiveBoardForm />
      )}

      {pageId === 'member-unit' && (
        <MemberUnitForm />
      )}

      {pageId === 'rti' && (
        <RtiForm />
      )}
    </div>
  )
}
