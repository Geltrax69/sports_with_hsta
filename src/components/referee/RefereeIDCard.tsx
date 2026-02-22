import { createPortal } from 'react-dom'
import { useRef } from 'react'
import domtoimage from 'dom-to-image-more'

interface RefereeIDCardProps {
    profile: any
    onClose: () => void
}

export function RefereeIDCard({ profile, onClose }: RefereeIDCardProps) {
    if (!profile) return null

    const logoUrl = `${import.meta.env.BASE_URL}assets/images/logo.png`
    const footballBgUrl = `${import.meta.env.BASE_URL}assets/images/football.png`
    const signatureUrl = `${import.meta.env.BASE_URL}assets/images/signature.png`
    const cardRef = useRef<HTMLDivElement>(null)

    const handleDownload = async () => {
        if (!cardRef.current) return
        try {
            const cloned = cardRef.current.cloneNode(true) as HTMLElement | null
            if (!cloned) return

            const rect = cardRef.current.getBoundingClientRect()
            cloned.style.position = 'absolute'
            cloned.style.top = '-10000px'
            cloned.style.left = '-10000px'
            cloned.style.opacity = '1'
            cloned.style.pointerEvents = 'none'
            cloned.style.width = `${rect.width}px`
            cloned.style.height = `${rect.height}px`

            cloned.querySelectorAll('img').forEach((img) => {
                const src = img.getAttribute('src') || ''
                const isSameOrigin = src.startsWith(window.location.origin) || src.startsWith('/') || src.startsWith(import.meta.env.BASE_URL || '')
                if (!isSameOrigin) {
                    img.removeAttribute('srcset')
                    img.setAttribute('crossorigin', 'anonymous')
                    img.setAttribute('referrerpolicy', 'no-referrer')
                    img.setAttribute('src', logoUrl)
                }
            })

            const waitForImages = Array.from(cloned.querySelectorAll('img')).map(
                (img) =>
                    new Promise<void>((resolve) => {
                        if (img.complete) return resolve()
                        img.onload = img.onerror = () => resolve()
                    })
            )

            document.body.appendChild(cloned)
            await Promise.all(waitForImages)

            const dataUrl = await domtoimage.toPng(cloned, {
                bgcolor: '#ffffff',
                cacheBust: true,
                imagePlaceholder: logoUrl,
            })

            document.body.removeChild(cloned)
            const link = document.createElement('a')
            link.download = `${profile.fullName || 'id-card'}.png`
            link.href = dataUrl
            link.click()
        } catch (err) {
            console.error('Failed to download ID card', err)
        }
    }

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div
                ref={cardRef}
                className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative"
                style={{ backgroundImage: `url(${footballBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
                <div className="absolute inset-0 bg-white/90 pointer-events-none" />
                {/* Card Header (Branding) */}
                <div className="bg-[#5a0a8f] p-6 text-white relative h-32 flex flex-col items-center justify-center">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wide backdrop-blur hover:bg-white/25 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            Download
                        </button>
                        <button className="text-white/50 hover:text-white transition-colors cursor-pointer" onClick={onClose}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1">
                        <div className="flex items-center gap-2 leading-none">
                            <img src={logoUrl} alt="HSTA Logo" className="h-9 w-9 object-contain rounded-full bg-white/90 p-0.5" />
                            <div className="text-xl font-black tracking-tighter">HSTA</div>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80">Haryana Sepak Takraw Association</div>
                    </div>
                    <div className="text-[8px] opacity-60 mt-1">OFFICIAL REFEREE</div>
                </div>

                {/* Card Body */}
                <div className="p-8 pb-10 flex flex-col items-center -mt-12 relative overflow-hidden">
                    <div
                        className="absolute inset-0 pointer-events-none opacity-5 bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${logoUrl})`, backgroundSize: '260px' }}
                    />
                    {/* Profile Image container */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-xl">
                            <div className="w-full h-full rounded-xl bg-gray-100 overflow-hidden border border-gray-100 flex items-center justify-center">
                                {profile.profilePhoto ? (
                                    <img src={profile.profilePhoto} alt={profile.fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-gray-300 text-5xl">person</span>
                                )}
                            </div>
                        </div>
                        {/* Status light */}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white p-1 shadow-lg">
                            <div className={`w-full h-full rounded-full flex items-center justify-center ${profile.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                <span className="material-symbols-outlined text-white text-[16px] font-bold">
                                    {profile.status === 'approved' ? 'check' : 'pending'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">{profile.fullName?.toUpperCase()}</h2>
                        <div className="inline-block mt-2 px-3 py-1 bg-purple-50 rounded-full">
                            <span className="text-xs font-black text-[#5a0a8f] tracking-widest">{profile.refereeId || 'PENDING'}</span>
                        </div>
                    </div>

                    <div className="w-full mt-8 grid grid-cols-2 gap-y-4 gap-x-8 px-4 text-center">
                        <div className="flex flex-col items-center">
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">District Association</div>
                            <div className="text-xs font-bold text-gray-800 truncate">{profile.district || '—'}</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date of Birth</div>
                            <div className="text-xs font-bold text-gray-800 truncate">{profile.dateOfBirth || '—'}</div>
                        </div>
                    </div>

                    <div className="w-full mt-2 px-4 grid grid-cols-2 gap-6 items-start">
                        <div className="flex flex-col items-center pt-16 text-center">
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sports</div>
                            <div className="text-sm font-black text-gray-900">SEPAKTAKRAW</div>
                        </div>
                        <div className="flex flex-col items-center justify-start text-center">
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Authorized By</div>
                            <img src={signatureUrl} alt="General Secretary Signature" className="h-12 object-contain opacity-80" />
                            <span className="text-[10px] font-semibold text-gray-700 mt-1">Shamsher Singh</span>
                            <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest mt-0.5">General Secretary</span>
                            <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-wide mt-0.5">Haryana Sepak Takraw Association</span>
                        </div>
                    </div>

                    <div className="w-full mt-6 pt-6 border-t border-dashed border-gray-200 flex flex-col items-center">
                        <div className="w-full h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center relative overflow-hidden group/barcode cursor-pointer">
                            {/* Aesthetic Barcode placeholder */}
                            <div className="flex gap-[2px] items-center h-full opacity-60">
                                {[...Array(40)].map((_, i) => (
                                    <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'w-[1px]' : 'w-[2px]'} ${Math.random() > 0.3 ? 'h-6' : 'h-4'}`} />
                                ))}
                            </div>
                            <div className="absolute inset-0 bg-white/80 opacity-0 group-hover/barcode:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] font-black tracking-widest text-[#5a0a8f]">REFEREE IDENTITY CARD</span>
                            </div>
                        </div>
                        <p className="text-[8px] font-medium text-gray-400 mt-2 tracking-widest uppercase">Verified Official Identity Card</p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
