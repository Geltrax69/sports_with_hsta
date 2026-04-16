import type { PlayerRegistration } from '../context/RegistrationsContext'

type ExportablePlayer = PlayerRegistration & {
  districtName?: string
  age?: number
}

const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`

export function downloadPlayersCsv(players: ExportablePlayer[], filename = 'players-export.csv') {
  const headers = [
    'Player ID',
    'Registration ID',
    'Full Name',
    'Email',
    'Phone',
    'Gender',
    'Category',
    'District',
    'Date of Birth',
    'Age',
    'Aadhaar Number',
    'Status',
    'Submitted At',
    'Reviewed At',
    'Reviewed By',
    'District Games',
    'State Games',
    'National Games',
    'International Games',
  ]

  const rows = players.map((player) =>
    [
      player.playerId || '',
      player.id,
      player.fullName,
      player.email,
      player.phone,
      player.gender || '',
      player.category || '',
      player.districtName || player.district || '',
      player.dateOfBirth || '',
      player.age ?? '',
      player.aadhaarNumber || '',
      player.status,
      player.submittedAt || '',
      player.reviewedAt || '',
      player.reviewedBy || '',
      player.districtGames || '',
      player.stateGames || '',
      player.nationalGames || '',
      player.internationalGames || '',
    ]
      .map(escapeCsv)
      .join(','),
  )

  const csv = [headers.map(escapeCsv).join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const objectUrl = URL.createObjectURL(blob)

  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}
