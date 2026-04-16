import { useState, useEffect } from 'react'
import { CertificateTemplate } from '../../components/common/CertificateTemplate'
import { apiRequest } from '../../lib/api'

export function AdminCertificates() {
    const [selectedCertificate, setSelectedCertificate] = useState(0)
    const [logos, setLogos] = useState<string[]>([])
    const [tournaments, setTournaments] = useState<any[]>([])
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
    const [championshipTitle, setChampionshipTitle] = useState('22nd SENIOR HARYANA STATE SEPAKTAKRAW CHAMPIONSHIP-2025')

    // Participants State
    const [participants, setParticipants] = useState<any[]>([])
    const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null)
    const [loadingParticipants, setLoadingParticipants] = useState(false)
    const [participantTab, setParticipantTab] = useState<'all' | '1st' | '2nd' | '3rd' | 'participation' | 'player' | 'coach' | 'referee'>('all')
    const [winners, setTournamentWinners] = useState<{ first: string[], second: string[], third: string[] }>({ first: [], second: [], third: [] })
    const [position, setPosition] = useState<string>('1st Place')
    const [eventType, setEventType] = useState<string>('Regu')
    const [certificateIds, setCertificateIds] = useState<Record<string, string>>({})

    // Signature State
    const [presidentName, setPresidentName] = useState('Jitender Singh')
    const [generalSecretaryName, setGeneralSecretaryName] = useState('ShamSher Singh')
    const [treasurerName, setTreasurerName] = useState('Shailender Singh')
    const [orgSecretaryName, setOrgSecretaryName] = useState('Surender Hooda')

    // Signature Images State
    const [presidentSignature, setPresidentSignature] = useState<string | null>(null)
    const [generalSecretarySignature, setGeneralSecretarySignature] = useState<string | null>(null)
    const [treasurerSignature, setTreasurerSignature] = useState<string | null>(null)
    const [orgSecretarySignature, setOrgSecretarySignature] = useState<string | null>(null)

    // Event Details State
    const [venue, setVenue] = useState('YASH COLLEGE OF EDUCATION RURKEE, ROHTAK')
    const [dates, setDates] = useState('28th to 29th September 2025')
    const [generating, setGenerating] = useState(false)
    const [generationProgress, setGenerationProgress] = useState(0)
    const [generationResults, setGenerationResults] = useState<{ success: number, failed: number } | null>(null)

    const blobToBase64 = async (blobUrl: string): Promise<string> => {
        try {
            const response = await fetch(blobUrl)
            const blob = await response.blob()
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
            })
        } catch (error) {
            console.error('Error converting blob to base64:', error)
            return blobUrl // fallback to original
        }
    }

    // Mock data as per user request
    const mockCertificateData = {
        serialNumber: (selectedParticipant?._id && certificateIds[selectedParticipant._id]) || 'ENTER CERTIFICATE ID',
        name: selectedParticipant?.fullName || 'SUDHIR',
        fatherName: selectedParticipant?.fatherName || 'SOMBIR',
        motherName: selectedParticipant?.motherName || 'SUNITA',
        aadhaar: selectedParticipant?.aadhaarNumber || '6546-5799-4696',
        dob: selectedParticipant?.dateOfBirth || '01-01-2005',
        district: selectedParticipant?.district || 'CHARKHI DADRI',
        role: selectedParticipant?.role || 'Player',
        event: eventType,
        dates: dates,
        venue: venue,
        championshipName: championshipTitle,
        position: position,
        photoUrl: selectedParticipant?.profilePhoto
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

    // Fetch tournaments from backend
    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const response = await apiRequest<{ tournaments: any[] }>('/tournaments')
                setTournaments(Array.isArray(response.tournaments) ? response.tournaments : [])
            } catch (error) {
                console.error('Error fetching tournaments:', error)
                setTournaments([])
            }
        }
        fetchTournaments()
    }, [])

    const handleGenerate = async () => {
        if (!selectedTournamentId) {
            alert('Please select a tournament first')
            return
        }

        const missingCertificateIds = participants
            .filter((participant) => !(certificateIds[participant._id] || '').trim())
            .map((participant) => participant.fullName)

        if (missingCertificateIds.length > 0) {
            alert(`Please enter a certificate ID for all participants before generating. Missing: ${missingCertificateIds.slice(0, 5).join(', ')}${missingCertificateIds.length > 5 ? '...' : ''}`)
            return
        }

        if (!window.confirm(`Generate certificates for all ${participants.length} participants?`)) return

        setGenerating(true)
        setGenerationProgress(0)
        setGenerationResults(null)

        try {
            // 1. Pre-convert logos and signatures to base64 to avoid doing it in the loop
            const base64Logos = await Promise.all(logos.map(l => l.startsWith('blob:') ? blobToBase64(l) : l))

            // Sequential to parallel for signatures
            const [base64President, base64Secretary, base64Treasurer, base64OrgSecretary] = await Promise.all([
                presidentSignature?.startsWith('blob:') ? blobToBase64(presidentSignature) : Promise.resolve(presidentSignature),
                generalSecretarySignature?.startsWith('blob:') ? blobToBase64(generalSecretarySignature) : Promise.resolve(generalSecretarySignature),
                treasurerSignature?.startsWith('blob:') ? blobToBase64(treasurerSignature) : Promise.resolve(treasurerSignature),
                orgSecretarySignature?.startsWith('blob:') ? blobToBase64(orgSecretarySignature) : Promise.resolve(orgSecretarySignature)
            ]);

            const base64Sigs = {
                president: base64President,
                secretary: base64Secretary,
                treasurer: base64Treasurer,
                orgSecretary: base64OrgSecretary,
            }

            let successCount = 0
            let failedCount = 0

            for (let i = 0; i < participants.length; i++) {
                const p = participants[i]

                // Determine position
                let pPosition = 'Participation'
                if (winners.first.includes(p._id)) pPosition = '1st Place'
                else if (winners.second.includes(p._id)) pPosition = '2nd Place'
                else if (winners.third.includes(p._id)) pPosition = '3rd Place'
                else if (p.role === 'coach') pPosition = 'Coach'
                else if (p.role === 'referee') pPosition = 'Referee'

                const sNo = (certificateIds[p._id] || '').trim()

                const participantData = {
                    id: p._id,
                    fullName: p.fullName,
                    fatherName: p.fatherName,
                    motherName: p.motherName,
                    aadhaarNumber: p.aadhaarNumber,
                    dateOfBirth: p.dateOfBirth,
                    district: p.district,
                    role: p.role.charAt(0).toUpperCase() + p.role.slice(1),
                    position: pPosition,
                    serialNumber: sNo,
                    profilePhoto: p.profilePhoto
                }

                try {
                    // Call API for single participant
                    await apiRequest<{ results: any }>('/admin/certificates/generate', {
                        method: 'POST',
                        auth: true,
                        body: JSON.stringify({
                            tournamentId: selectedTournamentId,
                            participants: [participantData], // Send as array with one item
                            championshipTitle,
                            venue,
                            dates,
                            eventType,
                            design: selectedCertificate + 1,
                            signatures: {
                                president: presidentName,
                                secretary: generalSecretaryName,
                                treasurer: treasurerName,
                                orgSecretary: orgSecretaryName
                            },
                            signatureImages: base64Sigs,
                            logos: base64Logos
                        })
                    })
                    successCount++
                } catch (error) {
                    console.error(`Error generating certificate for ${p.fullName}:`, error)
                    failedCount++
                }

                // Update progress after each participant
                setGenerationProgress(Math.round(((i + 1) / participants.length) * 100))
            }

            setGenerationResults({
                success: successCount,
                failed: failedCount
            })

            if (failedCount === 0) {
                alert(`Successfully generated ${successCount} certificates!`)
            } else {
                alert(`Generation completed. Success: ${successCount}, Failed: ${failedCount}. Check console for errors.`)
            }
        } catch (error) {
            console.error('Error during generation sequence:', error)
            alert('An unexpected error occurred during generation.')
        } finally {
            setGenerating(false)
            setGenerationProgress(0)
        }
    }

    // Handle tournament selection and auto-populate fields
    const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tournamentId = e.target.value
        setSelectedTournamentId(tournamentId)
        setParticipants([])
        setSelectedParticipant(null)
        setCertificateIds({})

        if (tournamentId) {
            const tournament = tournaments.find(t => t._id === tournamentId)
            if (tournament) {
                // Set championship title
                setChampionshipTitle(tournament.title || '')

                // Set venue (venueName + city if available)
                let venueText = tournament.venueName || ''
                if (tournament.city && venueText) {
                    venueText = `${venueText}, ${tournament.city}`
                } else if (tournament.city) {
                    venueText = tournament.city
                }
                setVenue(venueText)

                // Set dates (format startDate to endDate)
                if (tournament.startDate && tournament.endDate) {
                    const startDate = new Date(tournament.startDate)
                    const endDate = new Date(tournament.endDate)
                    const formatDate = (date: Date) => {
                        const day = date.getDate()
                        const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                            day === 2 || day === 22 ? 'nd' :
                                day === 3 || day === 23 ? 'rd' : 'th'
                        const month = date.toLocaleString('en-US', { month: 'long' })
                        const year = date.getFullYear()
                        return `${day}${suffix} ${month} ${year}`
                    }

                    if (startDate.toDateString() === endDate.toDateString()) {
                        setDates(formatDate(startDate))
                    } else {
                        setDates(`${formatDate(startDate)} to ${formatDate(endDate)}`)
                    }
                } else if (tournament.startDate) {
                    const startDate = new Date(tournament.startDate)
                    setDates(startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }))
                }

                // Set winners
                if (tournament.winners) {
                    setTournamentWinners({
                        first: Array.isArray(tournament.winners.first) ? tournament.winners.first.map((w: any) => typeof w === 'string' ? w : w._id) : [],
                        second: Array.isArray(tournament.winners.second) ? tournament.winners.second.map((w: any) => typeof w === 'string' ? w : w._id) : [],
                        third: Array.isArray(tournament.winners.third) ? tournament.winners.third.map((w: any) => typeof w === 'string' ? w : w._id) : []
                    })
                } else {
                    setTournamentWinners({ first: [], second: [], third: [] })
                }

                // Fetch full tournament details to get populated winners if needed (though list might not have them)
                const fetchFullTournament = async () => {
                    try {
                        const res = await apiRequest<{ tournament: any }>(`/admin/tournaments/${tournamentId}`, { auth: true })
                        if (res.tournament?.winners) {
                            setTournamentWinners({
                                first: Array.isArray(res.tournament.winners.first) ? res.tournament.winners.first.map((w: any) => typeof w === 'string' ? w : w._id) : [],
                                second: Array.isArray(res.tournament.winners.second) ? res.tournament.winners.second.map((w: any) => typeof w === 'string' ? w : w._id) : [],
                                third: Array.isArray(res.tournament.winners.third) ? res.tournament.winners.third.map((w: any) => typeof w === 'string' ? w : w._id) : []
                            })
                        }
                    } catch (err) {
                        console.error('Error fetching full tournament details:', err)
                    }
                }
                fetchFullTournament()

                // Fetch participants
                fetchParticipants(tournamentId)
            }
        }
    }

    // Fetch participants for selected tournament
    const fetchParticipants = async (tournamentId: string) => {
        setLoadingParticipants(true)
        try {
            const response = await apiRequest<{ registrations: any[] }>(
                `/admin/tournaments/${tournamentId}/registrations`,
                { auth: true }
            )
            const registrations = response.registrations || []

            // Map registrations to participants with role
            const participantsList = registrations
                .filter(reg => reg.applicant && reg.status === 'approved')
                .map(reg => ({
                    ...reg.applicant,
                    role: reg.registerAs,
                    registrationId: reg._id
                }))

            setParticipants(participantsList)
            setCertificateIds(
                participantsList.reduce((acc, participant) => {
                    acc[participant._id] = ''
                    return acc
                }, {} as Record<string, string>)
            )
        } catch (error) {
            console.error('Error fetching participants:', error)
            setParticipants([])
            setCertificateIds({})
        } finally {
            setLoadingParticipants(false)
        }
    }

    const handleCertificateIdChange = (participantId: string, value: string) => {
        setCertificateIds(prev => ({
            ...prev,
            [participantId]: value.toUpperCase()
        }))
    }

    // Handle participant selection
    const handleParticipantClick = async (participant: any) => {
        try {
            // Auto-set position based on current tab or winner status
            if (participantTab === '1st') setPosition('1st Place')
            else if (participantTab === '2nd') setPosition('2nd Place')
            else if (participantTab === '3rd') setPosition('3rd Place')
            else if (participantTab === 'participation') setPosition('Participation')
            else if (participant.role === 'coach') setPosition('Coach')
            else if (participant.role === 'referee') setPosition('Referee')
            else {
                // Check if they are a winner even if in 'all' or 'player' tab
                if (winners.first.includes(participant._id)) setPosition('1st Place')
                else if (winners.second.includes(participant._id)) setPosition('2nd Place')
                else if (winners.third.includes(participant._id)) setPosition('3rd Place')
                else setPosition('Participation')
            }

            // Fetch full details
            let endpoint = ''
            if (participant.role === 'player') endpoint = `/admin/players/${participant._id}`
            else if (participant.role === 'coach') endpoint = `/admin/coaches/${participant._id}`
            else if (participant.role === 'referee') endpoint = `/admin/referees/${participant._id}`

            if (endpoint) {
                const response = await apiRequest<{ registration: any }>(
                    endpoint,
                    { auth: true }
                )
                const fullDetails = response.registration || participant
                setSelectedParticipant({
                    ...fullDetails,
                    role: participant.role.charAt(0).toUpperCase() + participant.role.slice(1)
                })
            }
        } catch (error) {
            console.error('Error fetching participant details:', error)
            setSelectedParticipant({
                ...participant,
                role: participant.role.charAt(0).toUpperCase() + participant.role.slice(1)
            })
        }
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newLogos = Array.from(e.target.files).map(file => URL.createObjectURL(file))
            setLogos(prev => [...prev, ...newLogos].slice(0, 7)) // Limit to 7 logos
        }
    }

    const handleSignatureUpload = (signatureType: 'president' | 'secretary' | 'treasurer' | 'orgSecretary') => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            const url = URL.createObjectURL(file)
            switch (signatureType) {
                case 'president':
                    setPresidentSignature(url)
                    break
                case 'secretary':
                    setGeneralSecretarySignature(url)
                    break
                case 'treasurer':
                    setTreasurerSignature(url)
                    break
                case 'orgSecretary':
                    setOrgSecretarySignature(url)
                    break
            }
            // Reset input value to allow uploading the same file again if needed
            e.target.value = ''
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
                    {/* Tournament Selection */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Tournament</h3>
                        <select
                            value={selectedTournamentId}
                            onChange={handleTournamentChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium text-gray-800"
                        >
                            <option value="">-- Select a Tournament --</option>
                            {tournaments.map((tournament) => (
                                <option key={tournament._id} value={tournament._id}>
                                    {tournament.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Participants List */}
                    {selectedTournamentId && (
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Participant</h3>

                            {/* Tabs */}
                            <div className="flex gap-2 mb-3 border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
                                <button
                                    onClick={() => setParticipantTab('all')}
                                    className={`px-4 py-2 text-sm font-medium ${participantTab === 'all' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    All ({participants.length})
                                </button>
                                <button
                                    onClick={() => setParticipantTab('1st')}
                                    className={`px-4 py-2 text-sm font-medium ${participantTab === '1st' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    1st Place ({participants.filter(p => winners.first.includes(p._id)).length})
                                </button>
                                <button
                                    onClick={() => setParticipantTab('2nd')}
                                    className={`px-4 py-2 text-sm font-medium ${participantTab === '2nd' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    2nd Place ({participants.filter(p => winners.second.includes(p._id)).length})
                                </button>
                                <button
                                    onClick={() => setParticipantTab('3rd')}
                                    className={`px-4 py-2 text-sm font-medium ${participantTab === '3rd' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    3rd Place ({participants.filter(p => winners.third.includes(p._id)).length})
                                </button>
                                <button
                                    onClick={() => setParticipantTab('participation')}
                                    className={`px-4 py-2 text-sm font-medium ${participantTab === 'participation' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Participation ({participants.filter(p => p.role === 'player' && !winners.first.includes(p._id) && !winners.second.includes(p._id) && !winners.third.includes(p._id)).length})
                                </button>
                                <button
                                    onClick={() => setParticipantTab('coach')}
                                    className={`px-4 py-2 text-sm font-medium ${participantTab === 'coach' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Coaches ({participants.filter(p => p.role === 'coach').length})
                                </button>
                                <button
                                    onClick={() => setParticipantTab('referee')}
                                    className={`px-4 py-2 text-sm font-medium ${participantTab === 'referee' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Referees ({participants.filter(p => p.role === 'referee').length})
                                </button>
                            </div>

                            {/* Participants Grid */}
                            {loadingParticipants ? (
                                <div className="text-center py-8 text-gray-500">Loading participants...</div>
                            ) : participants.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No participants registered yet</div>
                            ) : (
                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
                                        {participants
                                            .filter(p => {
                                                if (participantTab === 'all') return true
                                                if (participantTab === '1st') return winners.first.includes(p._id)
                                                if (participantTab === '2nd') return winners.second.includes(p._id)
                                                if (participantTab === '3rd') return winners.third.includes(p._id)
                                                if (participantTab === 'participation') return p.role === 'player' && !winners.first.includes(p._id) && !winners.second.includes(p._id) && !winners.third.includes(p._id)
                                                return p.role === participantTab
                                            })
                                            .map((participant) => (
                                                <button
                                                    key={participant._id}
                                                    onClick={() => handleParticipantClick(participant)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${selectedParticipant?._id === participant._id
                                                        ? 'border-purple-600 bg-purple-50'
                                                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3 w-full">
                                                        {participant.profilePhoto ? (
                                                            <img
                                                                src={participant.profilePhoto}
                                                                alt={participant.fullName}
                                                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                                                {participant.fullName?.charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">{participant.fullName}</div>
                                                            <div className="text-xs text-gray-500 capitalize">{participant.role}</div>
                                                            {participant.district && <div className="text-xs text-gray-400 truncate">{participant.district}</div>}
                                                            <div className="mt-2">
                                                                <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">
                                                                    Certificate ID
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={certificateIds[participant._id] || ''}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => handleCertificateIdChange(participant._id, e.target.value)}
                                                                    placeholder="Enter certificate ID"
                                                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:ring-2 focus:ring-purple-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Event Details */}
                    <div className="md:col-span-2 space-y-4">
                        {selectedParticipant && (
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Certificate ID for Selected Participant</label>
                                <input
                                    type="text"
                                    value={certificateIds[selectedParticipant._id] || ''}
                                    onChange={(e) => handleCertificateIdChange(selectedParticipant._id, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 text-gray-900"
                                    placeholder="Enter certificate ID manually"
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Event Type</h3>
                                <input
                                    type="text"
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium text-gray-800"
                                    placeholder="e.g. Regu, Doubles, Team"
                                />
                            </div>
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

                    {/* Signature Images */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Signature Images</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">President HSTA</label>
                                <label htmlFor="sig-president" className="flex flex-col items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded cursor-pointer hover:bg-green-100 transition-colors border border-green-200 text-center text-xs">
                                    <span className="material-icons-outlined text-lg">upload</span>
                                    <span>Upload Signature</span>
                                    <input
                                        id="sig-president"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSignatureUpload('president')}
                                        className="hidden"
                                    />
                                </label>
                                {presidentSignature && (
                                    <div className="mt-2 border border-gray-200 rounded p-2 bg-white">
                                        <img src={presidentSignature} alt="President Signature" className="w-full h-12 object-contain" />
                                        <button
                                            onClick={() => setPresidentSignature(null)}
                                            className="text-xs text-red-600 hover:text-red-800 mt-1 w-full"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Gen. Secretary HSTA</label>
                                <label htmlFor="sig-secretary" className="flex flex-col items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded cursor-pointer hover:bg-green-100 transition-colors border border-green-200 text-center text-xs">
                                    <span className="material-icons-outlined text-lg">upload</span>
                                    <span>Upload Signature</span>
                                    <input
                                        id="sig-secretary"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSignatureUpload('secretary')}
                                        className="hidden"
                                    />
                                </label>
                                {generalSecretarySignature && (
                                    <div className="mt-2 border border-gray-200 rounded p-2 bg-white">
                                        <img src={generalSecretarySignature} alt="Secretary Signature" className="w-full h-12 object-contain" />
                                        <button
                                            onClick={() => setGeneralSecretarySignature(null)}
                                            className="text-xs text-red-600 hover:text-red-800 mt-1 w-full"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Treasurer HSTA</label>
                                <label htmlFor="sig-treasurer" className="flex flex-col items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded cursor-pointer hover:bg-green-100 transition-colors border border-green-200 text-center text-xs">
                                    <span className="material-icons-outlined text-lg">upload</span>
                                    <span>Upload Signature</span>
                                    <input
                                        id="sig-treasurer"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSignatureUpload('treasurer')}
                                        className="hidden"
                                    />
                                </label>
                                {treasurerSignature && (
                                    <div className="mt-2 border border-gray-200 rounded p-2 bg-white">
                                        <img src={treasurerSignature} alt="Treasurer Signature" className="w-full h-12 object-contain" />
                                        <button
                                            onClick={() => setTreasurerSignature(null)}
                                            className="text-xs text-red-600 hover:text-red-800 mt-1 w-full"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Org. Secretary</label>
                                <label htmlFor="sig-org" className="flex flex-col items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded cursor-pointer hover:bg-green-100 transition-colors border border-green-200 text-center text-xs">
                                    <span className="material-icons-outlined text-lg">upload</span>
                                    <span>Upload Signature</span>
                                    <input
                                        id="sig-org"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSignatureUpload('orgSecretary')}
                                        className="hidden"
                                    />
                                </label>
                                {orgSecretarySignature && (
                                    <div className="mt-2 border border-gray-200 rounded p-2 bg-white">
                                        <img src={orgSecretarySignature} alt="Org Secretary Signature" className="w-full h-12 object-contain" />
                                        <button
                                            onClick={() => setOrgSecretarySignature(null)}
                                            className="text-xs text-red-600 hover:text-red-800 mt-1 w-full"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

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

            </div>

            {/* Preview Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Certificate Preview (Mockup)</h2>
                    <button
                        onClick={handleGenerate}
                        disabled={generating || participants.length === 0}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${generating
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200 active:scale-95'
                            }`}
                    >
                        {generating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">verified</span>
                                Generate Certificates ({participants.length})
                            </>
                        )}
                    </button>
                </div>

                {generationResults && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-green-600">check_circle</span>
                            <div>
                                <div className="text-sm font-bold text-green-800">Bulk Generation Complete</div>
                                <div className="text-xs text-green-600">Successfully generated {generationResults.success} certificates.</div>
                            </div>
                        </div>
                        <a href="/admin/certificates/list" className="text-sm font-bold text-green-700 hover:underline">View All</a>
                    </div>
                )}

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
                        signatureImages={{
                            president: presidentSignature || undefined,
                            secretary: generalSecretarySignature || undefined,
                            treasurer: treasurerSignature || undefined,
                            orgSecretary: orgSecretarySignature || undefined
                        }}
                    />
                </div>
            </div>
            {/* Progress Modal */}
            {generating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-purple-600 animate-pulse">verified</span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Generating Certificates</h3>
                        <p className="text-gray-500 mb-8">Please wait while we process the certificates. Do not close this browser tab.</p>

                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                                        Progress
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-purple-600">
                                        {generationProgress}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-purple-100 border border-purple-200">
                                <div
                                    style={{ width: `${generationProgress}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600 transition-all duration-300 ease-out"
                                ></div>
                            </div>
                            <div className="text-xs text-gray-400">
                                Processing {Math.round((generationProgress / 100) * participants.length)} of {participants.length} participants
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
