import React, { useRef, useState } from 'react'
import { API_BASE_URL, getAuthToken } from '../../lib/api'

// ─── Letterhead static data (mirrors the physical letterhead) ────────────────
const ORG_NAME    = 'Haryana Sepak Takraw Association'
const AFFILIATION = '(Affiliated to Sepak Takraw Federation of India)'
const PAN_NO      = 'AAFAH1161F'
const REGD_NO     = 'SNP00749'
const OFFICE      = 'Yash College of Education, Rurkee, Rohtak, Haryana-124401'
const EMAIL1      = 'haryanasepaktakrawassociation@gmail.com'
const EMAIL2      = 'shamsher.saroha@gmail.com'

const PRESIDENT   = { title: 'President',         name: 'NIKHIL MADAAN',    lines: ['MLA, Sonepat', '9990499993'] }
const TREASURER   = { title: 'Treasurer',          name: 'SHAILENDER SINGH', lines: ['9468155471'] }
const GEN_SEC     = { title: 'General Secretary',  name: 'SHAMSHER SINGH',   lines: ['9255282117', '7015742935'] }

const SIDEBAR = [
  { role: 'Vice-President',   names: ['SURENDER HOODA', 'PRITAM SIWACH'] },
  { role: 'Joint Secretary',  names: ['SHUBHAM SAROHA', 'MURTI DEVI'] },
  { role: 'Executive Member', names: ['BHARAT', 'SUNIL', 'SHIVANI', 'ASHOK KUMAR'] },
]

// ─── Inline preview (HTML replica of the letterhead) ─────────────────────────
function LetterheadPreview({
  refNo, dated, bodyContent, signaturePreview,
}: {
  refNo: string; dated: string; bodyContent: string; signaturePreview: string | null
}) {
  return (
    <div
      id="letterhead-preview"
      className="bg-white shadow-xl border border-gray-200 font-serif"
      style={{ width: '595px', minHeight: '842px', fontSize: '10px', position: 'relative' }}
    >
      {/* ── Header (yellow gradient) ───────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(to right, #7A4A00 0%, #9E6400 8%, #C27800 16%, #DC9200 26%, #EBA800 36%, #F7C832 48%, #FFD84F 58%, #FFF080 74%, #FFFDE7 100%)',
        padding: '10px 20px 10px 20px',
        display: 'flex', alignItems: 'center', gap: '16px',
        minHeight: '100px',
      }}>
        {/* Logo — plain on gradient, matching physical letterhead */}
        <img
          src={`${import.meta.env.BASE_URL}assets/images/logo.png`}
          alt="Logo"
          style={{ width: '90px', height: '90px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '26px', fontWeight: 'bold', color: '#8B0000', lineHeight: 1.1 }}>
            {ORG_NAME}
          </div>
          {/* Affiliation: italic only, not bold — matches physical */}
          <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '12px', fontStyle: 'italic', fontWeight: 'normal', color: '#111', marginTop: '5px' }}>
            {AFFILIATION}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '7px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <span style={{ fontWeight: 'bold', fontSize: '10px', color: '#111' }}>PAN No. {PAN_NO}</span>
            <span style={{ fontWeight: 'bold', fontSize: '10px', color: '#111' }}>Regd. No. {REGD_NO}</span>
          </div>
        </div>
      </div>

      {/* ── Address bar ────────────────────────────────────────────────────── */}
      <div style={{
        background: '#FFF59D', padding: '5px 20px',
        borderTop: '1.5px solid #C8A000', borderBottom: '1.5px solid #C8A000',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}>
        <div style={{ fontSize: '8.5px', display: 'flex', gap: '6px' }}>
          <span style={{ fontWeight: 'bold', flexShrink: 0 }}>H. Office :</span>
          <span>{OFFICE}</span>
        </div>
        {/* Emails on separate lines, indented to align under address — matches physical */}
        <div style={{ fontSize: '8.5px', display: 'flex', gap: '6px', marginTop: '1px' }}>
          <span style={{ fontWeight: 'bold', flexShrink: 0 }}>Email :</span>
          <div>
            <div>{EMAIL1}</div>
            <div>{EMAIL2}</div>
          </div>
        </div>
      </div>

      {/* ── Officials row ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        borderBottom: '1.5px solid #000', fontFamily: 'Arial, sans-serif',
      }}>
        {[PRESIDENT, TREASURER, GEN_SEC].map((off, i) => (
          <div key={i} style={{
            padding: '6px 8px 6px 8px',
            borderRight: i < 2 ? '0.5px solid #aaa' : undefined,
            textAlign: i === 1 ? 'center' : i === 2 ? 'right' : 'left',
          }}>
            <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#222' }}>{off.title} :</div>
            <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#8B0000', marginTop: '2px' }}>{off.name}</div>
            {off.lines.map((l, li) => (
              <div key={li} style={{ fontSize: '8px', color: '#444', marginTop: '1px' }}>{l}</div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Body (sidebar + content) ───────────────────────────────────────── */}
      <div style={{ display: 'flex', minHeight: '540px', fontFamily: 'Arial, sans-serif' }}>
        {/* Sidebar */}
        <div style={{ width: '115px', borderRight: '0.8px solid #555', padding: '10px 6px', flexShrink: 0 }}>
          {SIDEBAR.map((block, bi) => (
            <div key={bi} style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '7.5px', fontWeight: 'bold', color: '#222', marginBottom: '4px' }}>
                {block.role} :
              </div>
              {block.names.map((n, ni) => (
                <div key={ni} style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#8B0000', marginBottom: '3px' }}>
                  {n}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '10px 14px 10px 10px', position: 'relative', minHeight: '480px' }}>
          {/* Ref. No. + Dated row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ fontSize: '9px', fontStyle: 'italic' }}>
              Ref. No.&nbsp;
              <span style={{ display: 'inline-block', borderBottom: '0.5px solid #000', minWidth: '90px', color: '#000' }}>
                {refNo || ' '}
              </span>
            </div>
            <div style={{ fontSize: '9px', fontStyle: 'italic' }}>
              Dated&nbsp;
              <span style={{ display: 'inline-block', borderBottom: '0.5px solid #000', minWidth: '110px', color: '#000' }}>
                {dated || ' '}
              </span>
            </div>
          </div>

          {/* Letter body */}
          <div style={{
            fontSize: '10px', lineHeight: '1.6', whiteSpace: 'pre-wrap',
            color: '#111', textAlign: 'justify',
          }}>
            {bodyContent || <span style={{ color: '#aaa' }}>Letter body will appear here…</span>}
          </div>

          {/* Signature — bottom right */}
          <div style={{
            position: 'absolute', bottom: '12px', right: '14px',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          }}>
            {signaturePreview && (
              <img
                src={signaturePreview}
                alt="Signature"
                style={{ maxHeight: '55px', maxWidth: '140px', marginBottom: '4px', objectFit: 'contain' }}
              />
            )}
            <div style={{
              borderTop: '0.5px solid #000', width: '160px',
              paddingTop: '3px', fontSize: '8px', textAlign: 'center',
            }}>
              Authorised Signatory
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom border lines ────────────────────────────────────────────── */}
      <div style={{ height: '1px', background: '#E8A800', marginTop: '16px' }} />
      <div style={{ height: '1px', background: '#8B0000', marginTop: '3px' }} />
    </div>
  )
}

// ─── Main page component ─────────────────────────────────────────────────────
export function LetterheadPage() {
  const [refNo,          setRefNo]          = useState('')
  const [dated,          setDated]          = useState('')
  const [bodyContent,    setBodyContent]    = useState('')
  const [sigFile,        setSigFile]        = useState<File | null>(null)
  const [sigPreview,     setSigPreview]     = useState<string | null>(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')
  const sigInputRef = useRef<HTMLInputElement>(null)

  const handleSigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSigFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = ev => setSigPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setSigPreview(null)
    }
  }

  const handleRemoveSig = () => {
    setSigFile(null)
    setSigPreview(null)
    if (sigInputRef.current) sigInputRef.current.value = ''
  }

  const handleDownload = async () => {
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('refNo',       refNo)
      formData.append('dated',       dated)
      formData.append('bodyContent', bodyContent)
      if (sigFile) formData.append('signature', sigFile)

      const token = getAuthToken()
      const res = await fetch(`${API_BASE_URL}/letterhead/generate`, {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `Server error ${res.status}`)
      }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'HSTA_Letterhead.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.message || 'Failed to generate PDF.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] bg-white text-gray-900 transition-all'

  return (
    <div className="max-w-screen-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Letterhead Generator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the letter details below, then download as an official HSTA PDF letterhead.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* ── Left: controls ────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Ref / Date */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Letter Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-600">Ref. No.</span>
                <input
                  className={inputCls}
                  placeholder="e.g. HSTA/2026/001"
                  value={refNo}
                  onChange={e => setRefNo(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-600">Dated</span>
                <input
                  className={inputCls}
                  type="date"
                  value={dated}
                  onChange={e => setDated(e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* Body content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Letter Body</h2>
            <textarea
              className={`${inputCls} resize-y`}
              rows={14}
              placeholder={`To,\nThe Secretary,\n...\n\nSir/Madam,\n\nSub: ...\n\nWith reference to the above subject, we wish to inform you that...\n\nYours faithfully,`}
              value={bodyContent}
              onChange={e => setBodyContent(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1.5">{bodyContent.length} / 8000 characters</p>
          </div>

          {/* Signature upload */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-1">Signature Image</h2>
            <p className="text-xs text-gray-400 mb-4">Upload a JPG or PNG of the authorised signature. Max 2 MB.</p>

            {sigPreview ? (
              <div className="flex items-start gap-4">
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <img src={sigPreview} alt="Signature preview" className="max-h-20 max-w-[180px] object-contain" />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveSig}
                  className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 mt-2 font-medium"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#5a0a8f] hover:bg-purple-50/30 transition-all">
                <span className="material-symbols-outlined text-3xl text-gray-400">draw</span>
                <span className="text-sm text-gray-500">Click to upload signature</span>
                <span className="text-xs text-gray-400">JPG or PNG only</span>
                <input
                  ref={sigInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleSigChange}
                />
              </label>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-purple-900/20 transition-all text-sm"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Generating PDF…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download Letterhead PDF
              </>
            )}
          </button>
        </div>

        {/* ── Right: live preview ───────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 self-start">
            <span className="material-symbols-outlined text-[18px] text-gray-500">preview</span>
            <span className="text-sm font-semibold text-gray-600">Live Preview</span>
            <span className="text-xs text-gray-400">(A4 · 595 × 842 pt)</span>
          </div>

          {/* Scrollable preview container */}
          <div className="overflow-auto rounded-xl border border-gray-200 shadow-lg bg-gray-100 p-4 max-h-[90vh] w-full flex justify-center">
            <LetterheadPreview
              refNo={refNo}
              dated={dated}
              bodyContent={bodyContent}
              signaturePreview={sigPreview}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
