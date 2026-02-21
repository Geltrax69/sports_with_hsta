import { createPortal } from 'react-dom'
import { useMemo, useRef } from 'react'
import domtoimage from 'dom-to-image-more'
import { useDistricts } from '../../context/DistrictsContext'
import { API_BASE_URL } from '../../lib/api'

interface PlayerIDCardProps {
    profile: any
    onClose: () => void
}

export function PlayerIDCard({ profile, onClose }: PlayerIDCardProps) {
    if (!profile) return null

    const { districts } = useDistricts()
    const cardRef = useRef<HTMLDivElement>(null)
    const logoUrl = `${import.meta.env.BASE_URL}assets/images/logo.png`
    const footballBgUrl = `${import.meta.env.BASE_URL}assets/images/football.png`
    const signatureUrl = `${import.meta.env.BASE_URL}assets/images/signature.png`

    const profilePhotoUrl = useMemo(() => {
        const src = profile?.profilePhoto as string | undefined
        if (!src) return ''

        const isRelative = src.startsWith('/')
        if (isRelative) return src

        try {
            const url = new URL(src)
            const sameOrigin = url.origin === window.location.origin
            if (sameOrigin) return src
        } catch {
            // If URL parsing fails, fall back to proxy so download still works
        }

        return `${API_BASE_URL}/proxy/image?url=${encodeURIComponent(src)}`
    }, [profile?.profilePhoto])

    const districtName = useMemo(() => {
        const match = districts.find((d: any) => d._id === profile.district || d.id === profile.district || d.code === profile.district || d.slug === profile.district)
        return match?.name || profile.district || '—'
    }, [districts, profile.district])

    const roleLabel = (profile.role || 'Player').toString().toUpperCase()
    const identityLabel = `${roleLabel} IDENTITY CARD`
    const isReferee = roleLabel === 'REFEREE'

    const brandTitle = isReferee ? 'HSTA' : 'HSTA'
    const brandSubtitle = isReferee ? 'Haryana Sepak Takraw Association' : 'Haryana Sepak Takraw Association'
    const brandCaption = isReferee ? 'OFFICIAL REFEREE' : 'Affiliated to Sepaktakraw Federation of India'

    const handleDownload = async () => {
        if (!cardRef.current) return
        try {
            // Clone the card so we can safely prep it for export without changing the visible UI
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

            // Hide action buttons from the exported image
            cloned.querySelectorAll('button').forEach((btn) => {
                btn.style.display = 'none'
            })

            // Remove all borders, backgrounds, and shadows that create boxes around text
            cloned.style.setProperty('border', 'none', 'important')
            cloned.style.setProperty('box-shadow', 'none', 'important')
            
            // Remove borders and backgrounds from all child elements except specific ones
            cloned.querySelectorAll('*').forEach((el: any) => {
                const classList = el.classList.toString()
                const textContent = el.textContent?.trim()
                
                // Keep borders/styling for specific elements
                const keepBorders = (
                    // Profile photo container and inner container
                    classList.includes('w-32') && classList.includes('h-32') && classList.includes('rounded-full') ||
                    classList.includes('w-full') && classList.includes('h-full') && classList.includes('rounded-full') ||
                    // Barcode/identity card section  
                    classList.includes('bg-gray-50') && classList.includes('rounded-lg') ||
                    // Player role text (if it has specific styling)
                    textContent === 'PLAYER'
                )
                
                if (!keepBorders) {
                    el.style.setProperty('border', 'none', 'important')
                    el.style.setProperty('box-shadow', 'none', 'important')
                    el.style.setProperty('outline', 'none', 'important')
                    
                    // Keep only essential backgrounds (like the purple header)
                    if (!classList.includes('bg-[#5a0a8f]') && !classList.includes('bg-green-500') && !classList.includes('bg-yellow-500')) {
                        if (classList.includes('bg-gray') || classList.includes('bg-white') || classList.includes('bg-purple')) {
                            el.style.setProperty('background', 'transparent', 'important')
                        }
                    }
                    
                    // Remove rounded borders that create visible boxes (except for profile photo)
                    if ((classList.includes('rounded') || classList.includes('border')) && !classList.includes('rounded-full')) {
                        el.style.setProperty('border-radius', '0', 'important')
                    }
                }
            })

            // Convert ALL images to data URLs to ensure they capture correctly
            const inlineImages = async () => {
                const images = Array.from(cloned.querySelectorAll('img'))
                return Promise.all(
                    images.map(async (img) => {
                        const src = img.getAttribute('src') || ''
                        if (!src) return

                        try {
                            // Create a canvas to draw the image and convert to data URL
                            const canvas = document.createElement('canvas')
                            const ctx = canvas.getContext('2d')
                            if (!ctx) return

                            // Create a new image element to load the current image
                            const sourceImg = new Image()
                            sourceImg.crossOrigin = 'anonymous'
                            
                            await new Promise<void>((resolve) => {
                                sourceImg.onload = () => {
                                    canvas.width = sourceImg.naturalWidth || sourceImg.width
                                    canvas.height = sourceImg.naturalHeight || sourceImg.height
                                    ctx.drawImage(sourceImg, 0, 0)
                                    
                                    try {
                                        const dataURL = canvas.toDataURL('image/png', 1.0)
                                        img.setAttribute('src', dataURL)
                                    } catch (e) {
                                        console.warn('Failed to convert image to data URL:', e)
                                    }
                                    resolve()
                                }
                                sourceImg.onerror = () => {
                                    console.warn('Failed to load image for inlining:', src)
                                    resolve() // Don't reject, just skip this image
                                }
                                sourceImg.src = src
                            })
                        } catch (e) {
                            console.warn('Failed to inline image:', e)
                        }
                    })
                )
            }

            await inlineImages()

            // Wait for images in the clone to finish loading before capture
            const waitForImages = Array.from(cloned.querySelectorAll('img')).map(
                (img) =>
                    new Promise<void>((resolve) => {
                        if (img.complete) return resolve()
                        img.onload = img.onerror = () => resolve()
                    })
            )

            document.body.appendChild(cloned)
            await Promise.all(waitForImages)

            // Render at 2x scale for a sharper PNG
            const dataUrl = await domtoimage.toPng(cloned, {
                bgcolor: '#ffffff',
                cacheBust: false, // Avoid breaking signed URLs (e.g., S3 presigned images)
                width: rect.width * 2,
                height: rect.height * 2,
                fetchRequestInit: {
                    mode: 'cors',
                    credentials: 'omit',
                },
                style: {
                    transform: 'scale(2)',
                    transformOrigin: 'top left',
                },
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
                            <div className="text-xl font-black tracking-tighter">{brandTitle}</div>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80">
                            {brandSubtitle}
                        </div>
                    </div>
                    <div className="text-[8px] opacity-70 mt-1 text-center">{brandCaption}</div>
                </div>

                {/* Card Body */}
                <div className="p-8 pb-10 flex flex-col items-center -mt-12 relative overflow-hidden">
                    <div
                        className="absolute inset-0 pointer-events-none opacity-5 bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${logoUrl})`, backgroundSize: '260px' }}
                    />
                    {/* Profile Image container */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-xl">
                            <div className="w-full h-full rounded-full overflow-hidden">
                                {profile.profilePhoto ? (
                                    <img src={profilePhotoUrl} alt={profile.fullName} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-gray-300 text-5xl">person</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">{profile.fullName?.toUpperCase()}</h2>
                        <div className="mt-2">
                            <span className="text-[11px] font-semibold text-gray-700 tracking-widest">{profile.playerId || 'ID PENDING'}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center mt-2 flex-wrap">
                            <div className="inline-block px-3 py-1 bg-purple-50 rounded-full border border-purple-200">
                                <span className="text-[11px] font-black text-[#5a0a8f] tracking-widest">{roleLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full mt-8 grid grid-cols-2 gap-y-4 gap-x-8 px-4">
                        <div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">District Association</div>
                            <div className="text-xs font-bold text-gray-800 break-words leading-snug">{districtName}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date of Birth</div>
                            <div className="text-xs font-bold text-gray-800 truncate">{profile.dateOfBirth || '—'}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Father Name</div>
                            <div className="text-xs font-bold text-gray-800 truncate">{profile.fatherName || '—'}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Phone</div>
                            <div className="text-xs font-bold text-gray-800 truncate">{profile.phone || '—'}</div>
                        </div>
                    </div>
                    <div className="w-full mt-2 px-4 grid grid-cols-2 gap-6 items-start">
                        <div className="flex flex-col items-start pt-16">
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sports</div>
                            <div className="text-sm font-black text-gray-900">SEPAKTAKRAW</div>
                        </div>
                        <div className="flex flex-col items-start justify-start">
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Authorized By</div>
                            <img src={signatureUrl} alt="General Secretary Signature" className="h-12 object-contain opacity-80" />
                            <span className="text-[10px] font-semibold text-gray-700 mt-1">Samshee singh</span>
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
                                <span className="text-[10px] font-black tracking-widest text-[#5a0a8f]">{identityLabel}</span>
                            </div>
                        </div>
                        <p className="text-[8px] font-medium text-gray-400 mt-2 tracking-widest uppercase">Verified Sports Identity Card</p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
