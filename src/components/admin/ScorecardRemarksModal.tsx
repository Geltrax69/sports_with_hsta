type Props = {
  isOpen: boolean
  matchLabel?: string
  remarks: string
  downloading?: boolean
  onRemarksChange: (value: string) => void
  onDownload: () => void
  onClose: () => void
}

export function ScorecardRemarksModal({
  isOpen,
  matchLabel,
  remarks,
  downloading = false,
  onRemarksChange,
  onDownload,
  onClose,
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] px-6 py-4 text-white">
          <h3 className="text-xl font-black">Download Score Card</h3>
          {matchLabel && <p className="text-sm text-purple-100 mt-1">{matchLabel}</p>}
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Remarks <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              rows={5}
              placeholder="Enter remarks for the score sheet. Text will auto-fit in the remarks box on the PDF."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] text-gray-900 resize-y"
            />
            <p className="text-xs text-gray-500 mt-2">
              Leave blank and click Download if you do not need remarks.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={downloading}
              className="px-5 py-2.5 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#5a0a8f] to-[#400466] text-white rounded-xl font-bold shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {downloading ? 'Generating…' : 'Download'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
