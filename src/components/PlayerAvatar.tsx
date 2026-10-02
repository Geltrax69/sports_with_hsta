import { useState } from 'react'

/** Player photo with an initials fallback when missing or failing to load. */
export function PlayerAvatar({
  photo,
  name,
  size = 'md',
}: {
  photo?: string | null
  name: string
  size?: 'sm' | 'md'
}) {
  const [failed, setFailed] = useState(false)
  const initials = (name || '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const cls = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs'
  if (!photo || failed) {
    return (
      <span
        className={`${cls} rounded-full bg-[#5a0a8f]/10 text-[#5a0a8f] flex items-center justify-center font-bold flex-shrink-0`}
      >
        {initials || '•'}
      </span>
    )
  }
  return (
    <img
      src={photo}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${cls} rounded-full object-cover flex-shrink-0 bg-gray-100`}
    />
  )
}
