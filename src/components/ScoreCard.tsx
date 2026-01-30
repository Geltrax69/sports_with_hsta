import { useEffect } from 'react'

type MatchSet = {
  setNumber: number
  team1Score: number
  team2Score: number
}

type ScoreCardData = {
  tournamentName: string
  matchDate: string
  team1: string
  team2: string
  sets: MatchSet[]
  winner: string
  venue?: string
}

type ScoreCardProps = {
  data: ScoreCardData | null
  isOpen: boolean
  onClose: () => void
}

export function ScoreCard({ data, isOpen, onClose }: ScoreCardProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !data) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#5a0a8f] text-white p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">{data.tournamentName}</h3>
            {data.venue && <p className="text-sm text-white/80">{data.venue}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Match Date</p>
            <p className="text-lg font-semibold text-gray-900">{data.matchDate}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-lg border-2 ${data.winner === data.team1 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <p className="text-sm text-gray-500 mb-1">Team 1</p>
              <p className="text-lg font-bold text-gray-900">{data.team1}</p>
              {data.winner === data.team1 && (
                <span className="inline-block mt-2 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">WINNER</span>
              )}
            </div>
            <div className={`p-4 rounded-lg border-2 ${data.winner === data.team2 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <p className="text-sm text-gray-500 mb-1">Team 2</p>
              <p className="text-lg font-bold text-gray-900">{data.team2}</p>
              {data.winner === data.team2 && (
                <span className="inline-block mt-2 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">WINNER</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 mb-3">Set Scores</h4>
            {data.sets.map((set, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Set {set.setNumber}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    set.team1Score > set.team2Score ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {set.team1Score > set.team2Score ? data.team1 : data.team2} won
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{set.team1Score}</p>
                    <p className="text-xs text-gray-500 mt-1">{data.team1}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{set.team2Score}</p>
                    <p className="text-xs text-gray-500 mt-1">{data.team2}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Final Result</p>
              <p className="text-xl font-bold text-[#5a0a8f]">{data.winner} won the match</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
