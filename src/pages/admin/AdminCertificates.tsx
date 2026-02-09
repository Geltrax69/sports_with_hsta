import { useState, useEffect } from 'react'
import { CertificateTemplate } from '../../components/common/CertificateTemplate'

export function AdminCertificates() {
    const [selectedCertificate, setSelectedCertificate] = useState(0)
    const [logos, setLogos] = useState<string[]>([])
    const [championshipTitle, setChampionshipTitle] = useState('22nd SENIOR HARYANA STATE SEPAKTAKRAW CHAMPIONSHIP-2025')
    const [playerPhoto, setPlayerPhoto] = useState<string | null>(null)

    // Signature State
    const [presidentName, setPresidentName] = useState('Jitender Singh')
    const [generalSecretaryName, setGeneralSecretaryName] = useState('ShamSher Singh')
    const [treasurerName, setTreasurerName] = useState('Shailender Singh')
    const [orgSecretaryName, setOrgSecretaryName] = useState('Surender Hooda')

    // Event Details State
    const [venue, setVenue] = useState('YASH COLLEGE OF EDUCATION RURKEE, ROHTAK')
    const [dates, setDates] = useState('28th to 29th September 2025')

    // Mock data as per user request
    const mockCertificateData = {
        serialNumber: '57',
        name: 'SUDHIR',
        fatherName: 'SOMBIR',
        motherName: 'SUNITA',
        aadhaar: '6546-5799-4696',
        dob: '01-01-2005',
        district: 'CHARKHI DADRI',
        role: 'Player',
        event: 'Regu',
        dates: dates,
        venue: venue,
        championshipName: championshipTitle,
        position: '1st',
        photoUrl: playerPhoto || undefined
    }

    // Dynamic Design Discovery
    const [certificateDesigns, setCertificateDesigns] = useState<string[]>([])

    useEffect(() => {
        const checkDesigns = async () => {
            const foundDesigns: string[] = []
            let index = 1
            let keepChecking = true

            // Limit check to avoid infinite loops, e.g., max 20 designs
            while (keepChecking && index <= 20) {
                const designName = `/certificates/c${index}.png`
                try {
                    const response = await fetch(designName, { method: 'HEAD' })
                    const contentType = response.headers.get('content-type')

                    if (response.ok && contentType && contentType.startsWith('image')) {
                        foundDesigns.push(designName)
                        index++
                    } else {
                        keepChecking = false
                    }
                } catch (error) {
                    keepChecking = false
                }
            }
            setCertificateDesigns(foundDesigns)
        }

        checkDesigns()
    }, [])

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newLogos = Array.from(e.target.files).map(file => URL.createObjectURL(file))
            setLogos(prev => [...prev, ...newLogos].slice(0, 7)) // Limit to 7 logos
        }
    }

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPlayerPhoto(URL.createObjectURL(e.target.files[0]))
        }
    }

    const clearLogos = () => {
        setLogos([])
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Certificate Generator</h1>
                    <p className="text-gray-600">Preview and generate certificates.</p>
                </div>
            </div>

            {/* Controls Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

                {/* Design Selection */}
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Design</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {certificateDesigns.map((design, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedCertificate(index)}
                                className={`relative rounded-lg overflow-hidden border-2 transition-all w-32 h-20 flex-shrink-0 ${selectedCertificate === index
                                    ? 'border-purple-600 ring-2 ring-purple-200 shadow-lg scale-105'
                                    : 'border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100'
                                    }`}
                            >
                                <img
                                    src={design}
                                    alt={`Design ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 text-center font-bold ${selectedCertificate === index ? 'bg-purple-600' : ''}`}>
                                    Design {index + 1}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Text Customization Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Event Details */}
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Championship Title</h3>
                            <input
                                type="text"
                                value={championshipTitle}
                                onChange={(e) => setChampionshipTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium text-gray-800"
                                placeholder="Enter Championship Title"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Venue</label>
                                <input
                                    type="text"
                                    value={venue}
                                    onChange={(e) => setVenue(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-gray-900"
                                    placeholder="Enter Venue"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Dates</label>
                                <input
                                    type="text"
                                    value={dates}
                                    onChange={(e) => setDates(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-gray-900"
                                    placeholder="Enter Dates"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Signatory Names</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">President HSTA</label>
                                <input
                                    type="text"
                                    value={presidentName}
                                    onChange={(e) => setPresidentName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Gen. Secretary HSTA</label>
                                <input
                                    type="text"
                                    value={generalSecretaryName}
                                    onChange={(e) => setGeneralSecretaryName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Treasurer HSTA</label>
                                <input
                                    type="text"
                                    value={treasurerName}
                                    onChange={(e) => setTreasurerName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Org. Secretary</label>
                                <input
                                    type="text"
                                    value={orgSecretaryName}
                                    onChange={(e) => setOrgSecretaryName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-gray-900"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* File Uploads Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Upload */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Logos (Max 7)</h3>
                            {logos.length > 0 && (
                                <button
                                    onClick={clearLogos}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4 items-center">
                            <label className="flex items-center justify-center gap-2 px-4 py-3 w-full bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200 font-medium text-sm">
                                <span className="material-icons-outlined text-lg">cloud_upload</span>
                                Add Logos
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    disabled={logos.length >= 7}
                                />
                            </label>
                            <span className="text-sm text-gray-500">
                                {logos.length} / 7
                            </span>
                        </div>

                        {/* Logo Previews */}
                        {logos.length > 0 && (
                            <div className="flex gap-2 mt-3">
                                {logos.map((logo, idx) => (
                                    <div key={idx} className="w-12 h-12 border border-gray-200 rounded p-1 bg-gray-50">
                                        <img src={logo} alt={`Logo ${idx}`} className="w-full h-full object-contain" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Player Photo Upload */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Player Photo</h3>
                            {playerPhoto && (
                                <button
                                    onClick={() => setPlayerPhoto(null)}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4 items-center">
                            <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200 font-medium text-sm">
                                <span className="material-icons-outlined text-lg">person</span>
                                Upload Photo
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                            </label>
                            {playerPhoto && (
                                <div className="w-12 h-12 border border-gray-200 rounded p-1 bg-gray-50 overflow-hidden">
                                    <img src={playerPhoto} alt="Player" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Preview Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-hidden">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Certificate Preview (Mockup)</h2>

                {/* Certificate Rendering */}
                <div className="w-full max-w-4xl mx-auto shadow-2xl rounded-lg overflow-hidden bg-gray-50">
                    <CertificateTemplate
                        backgroundImage={certificateDesigns[selectedCertificate]}
                        data={mockCertificateData}
                        logos={logos}
                        signatures={{
                            president: presidentName,
                            secretary: generalSecretaryName,
                            treasurer: treasurerName,
                            orgSecretary: orgSecretaryName
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
