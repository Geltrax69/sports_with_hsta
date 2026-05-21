import { useState, useEffect, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useWebsiteContent, type AboutPageSettings } from '../../context/WebsiteContentContext'
import { ExecutiveBoardForm } from './ExecutiveBoardForm'
import { MemberUnitForm } from './MemberUnitForm'
import { RtiForm } from './RtiForm'
import { DocumentListForm } from './DocumentListForm'
import { CustomPageForm } from './CustomPageForm'

const PAGE_MAPPING: Record<string, { title: string; field: keyof AboutPageSettings }> = {
  'executive-board': { title: 'Executive Board', field: 'executiveBoardText' },
  'member-unit': { title: 'Member Unit', field: 'memberUnitText' },
  rti: { title: 'RTI', field: 'rtiText' },
  'annual-report': { title: 'Annual Report', field: 'annualReportText' },
  'election-report': { title: 'Election Report', field: 'electionReportText' },
}

/**
 * All hooks must stay at the top — never return before hooks (fixes blank admin About pages).
 */
export function AdminAboutPage() {
  const { pageId } = useParams<{ pageId: string }>()
  const { content, contentLoading, contentError, refreshContent, updateAboutPage } = useWebsiteContent()
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const staticConfig = pageId ? PAGE_MAPPING[pageId] : null
  const customPage = content.aboutPage?.customPages?.find((p) => p.slug === pageId)

  useEffect(() => {
    if (staticConfig && content.aboutPage) {
      setText((content.aboutPage[staticConfig.field] as string) || '')
    } else {
      setText('')
    }
  }, [staticConfig, content.aboutPage, pageId])

  const handleSave = async () => {
    if (!staticConfig) return
    setIsSaving(true)
    setSaveMessage('')
    try {
      await updateAboutPage({ [staticConfig.field]: text })
      setSaveMessage('Content updated successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch {
      setSaveMessage('Failed to save content.')
    } finally {
      setIsSaving(false)
    }
  }

  let body: ReactNode

  if (contentLoading) {
    body = (
      <div className="p-8 text-center text-gray-500">
        <p>Loading page content…</p>
      </div>
    )
  } else if (contentError) {
    body = (
      <div className="p-6 rounded-xl border border-red-200 bg-red-50 space-y-3">
        <p className="text-red-800 font-semibold">{contentError}</p>
        <button
          type="button"
          onClick={() => void refreshContent()}
          className="px-4 py-2 bg-[#5a0a8f] text-white rounded-lg font-bold"
        >
          Retry
        </button>
      </div>
    )
  } else if (pageId === 'accounts') {
    body = <DocumentListForm title="Accounts and Expenditures" field="accounts" />
  } else if (pageId === 'agm-meetings') {
    body = <DocumentListForm title="AGM Meetings" field="agmMeetings" />
  } else if (customPage) {
    body = <CustomPageForm customPage={customPage} />
  } else if (!staticConfig) {
    body = <div className="p-6 text-gray-700">Page not found</div>
  } else {
    body = (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{staticConfig.title} Content</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage the content for the {staticConfig.title} page. This text will be displayed publicly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="bg-[#5a0a8f] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#4a087a] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {saveMessage && (
          <div
            className={`p-4 rounded-lg ${saveMessage.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
          >
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
                placeholder={`Enter the content for ${staticConfig.title}...`}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>
        )}

        {pageId === 'executive-board' && <ExecutiveBoardForm />}
        {pageId === 'member-unit' && <MemberUnitForm />}
        {pageId === 'rti' && <RtiForm />}
      </div>
    )
  }

  return body
}
