import { createPortal } from 'react-dom'
import { useMemo } from 'react'
import { useDistricts } from '../../context/DistrictsContext'

interface PlayerIDCardProps {
    profile: any
    onClose: () => void
}

export function PlayerIDCard({ profile, onClose }: PlayerIDCardProps) {
    if (!profile) return null

    const { districts } = useDistricts()

    const districtName = useMemo(() => {
        const match = districts.find((d: any) => d._id === profile.district || d.id === profile.district || d.code === profile.district || d.slug === profile.district)
        return match?.name || profile.district || '—'
    }, [districts, profile.district])

    const roleLabel = (profile.role || 'Player').toString().toUpperCase()
    const identityLabel = `${roleLabel} IDENTITY CARD`
    const isReferee = roleLabel === 'REFEREE'

    const brandTitle = isReferee ? 'STFI' : 'HSTA'
    const brandSubtitle = isReferee ? 'SEPAKTAKRAW FEDERATION OF INDIA' : 'Haryana Sepak Takraw Association'
    const brandCaption = isReferee ? 'OFFICIAL REFEREE' : 'Affiliated to Sepaktakraw Federation of India'

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Card Header (Branding) */}
                <div className="bg-[#5a0a8f] p-6 text-white relative h-32 flex flex-col items-center justify-center">
                    <div className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </div>
                    <div className="text-xl font-black tracking-tighter mb-0.5">{brandTitle}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80 text-center leading-tight">
                        {brandSubtitle}
                    </div>
                    <div className="text-[8px] opacity-70 mt-1 text-center">{brandCaption}</div>
                </div>

                {/* Card Body */}
                <div className="p-8 pb-10 flex flex-col items-center -mt-12">
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
                        <div className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded-full">
                            <span className="text-[11px] font-semibold text-gray-700 tracking-widest">{profile.playerId || 'ID PENDING'}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center mt-2 flex-wrap">
                            <div className="inline-block px-3 py-1 bg-purple-50 rounded-full">
                                <span className="text-[11px] font-black text-[#5a0a8f] tracking-widest">{roleLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full mt-8 grid grid-cols-2 gap-y-4 gap-x-8 px-4">
                        <div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">District</div>
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
                        <div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Category</div>
                            <div className="text-xs font-bold text-gray-800 truncate text-purple-700">{profile.category || 'GENERAL'}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gender</div>
                            <div className="text-xs font-bold text-gray-800 truncate">{profile.gender || '—'}</div>
                        </div>
                    </div>

                    <div className="w-full mt-10 pt-6 border-t border-dashed border-gray-200 flex flex-col items-center">
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
