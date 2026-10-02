import React, { useRef, useState } from 'react'
import { API_BASE_URL, getAuthToken } from '../../lib/api'

// Overlay positions in PDF points (preview renders 1pt = 1px).
// Keep in sync with back/src/utils/generateLetterheadPdf.js (LH).
const LH = {
  baseline: 216.4, fieldSize: 12, refX: 68, dateX: 484, dotsX: 478.7, dotsW: 96, paper: '#FBFBFB',
  bodyX: 50, bodyY: 240, bodyW: 495, bodyBottom: 700,
  sigX: 395, sigW: 150, sigY: 715, sigH: 55,
}

// yyyy-mm-dd (from <input type="date">) → dd-mm-yyyy
const formatDate = (iso: string) => iso ? iso.split('-').reverse().join('-') : ''

// ─── Inline preview: scanned letterhead image with text overlaid ────────────
function LetterheadPreview({
  refNo, dated, bodyContent, signaturePreview,
}: {
  refNo: string; dated: string; bodyContent: string; signaturePreview: string | null
}) {
  const abs = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties =>
    ({ position: 'absolute', left: x, top: y, ...extra })
  const fieldTop = LH.baseline - 0.84 * LH.fieldSize
  const fieldStyle: React.CSSProperties = {
    fontSize: LH.fieldSize, lineHeight: `${LH.fieldSize}px`, fontWeight: 'bold', fontStyle: 'italic', whiteSpace: 'nowrap',
  }
  return (
    <div
      id="letterhead-preview"
      className="shadow-xl border border-gray-200 shrink-0"
      style={{
        width: 595, height: 842, position: 'relative', overflow: 'hidden',
        fontFamily: '"Times New Roman", Times, serif', color: '#000',
        backgroundImage: `url(${import.meta.env.BASE_URL}assets/images/letterhead.jpg)`,
        backgroundSize: '100% 100%',
      }}
    >
      {/* line-height = font-size puts the Times baseline ~0.84em below the top */}
      <div style={abs(LH.refX, fieldTop, fieldStyle)}>{refNo}</div>
      {dated && (
        <>
          {/* mask the printed dots (they sit on the baseline only) */}
          <div style={abs(LH.dotsX, LH.baseline - 3, { width: LH.dotsW, height: 5, background: LH.paper })} />
          <div style={abs(LH.dateX, fieldTop, fieldStyle)}>{formatDate(dated)}</div>
        </>
      )}

      <div style={abs(LH.bodyX, LH.bodyY, {
        width: LH.bodyW, height: LH.bodyBottom - LH.bodyY, overflow: 'hidden',
        fontSize: 12, fontWeight: 'bold', lineHeight: '17px', whiteSpace: 'pre-wrap', textAlign: 'justify',
      })}>
        {bodyContent || <span style={{ color: '#999' }}>Letter body will appear here…</span>}
      </div>

      <div style={abs(LH.sigX, LH.sigY, { width: LH.sigW, height: LH.sigH, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' })}>
        {signaturePreview && <img src={signaturePreview} alt="Signature" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
      </div>
      <div style={abs(LH.sigX, LH.sigY + LH.sigH + 4, {
        width: LH.sigW, borderTop: '0.5px solid #000', paddingTop: 3,
        fontSize: 10, fontWeight: 'bold', textAlign: 'center',
      })}>
        Authorised Signatory
      </div>
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

  // mode 'download' saves the file; 'print' opens the browser print dialog on the PDF.
  const generatePdf = async (mode: 'download' | 'print') => {
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('refNo',       refNo)
      formData.append('dated',       formatDate(dated))
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

      const url = URL.createObjectURL(await res.blob())
      if (mode === 'print') {
        const frame = document.createElement('iframe')
        frame.style.display = 'none'
        frame.src = url
        frame.onload = () => frame.contentWindow?.print()
        document.body.appendChild(frame)
        // ponytail: frame + URL kept for the print dialog's lifetime; freed after a minute
        setTimeout(() => { frame.remove(); URL.revokeObjectURL(url) }, 60_000)
        return
      }
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

          {/* Download / Print */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => generatePdf('download')}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-purple-900/20 transition-all text-sm"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>{loading ? 'progress_activity' : 'download'}</span>
              {loading ? 'Generating PDF…' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={() => generatePdf('print')}
              disabled={loading}
              className="flex items-center justify-center gap-2 border-2 border-[#5a0a8f] text-[#5a0a8f] hover:bg-purple-50 disabled:opacity-60 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-xl transition-all text-sm"
            >
              {/* ponytail: inline SVG — "print" isn't in the self-hosted icon font subset */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3zm-3 11H8v-5h8v5zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM18 3H6v4h12V3z"/>
              </svg>
              Print
            </button>
          </div>
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
