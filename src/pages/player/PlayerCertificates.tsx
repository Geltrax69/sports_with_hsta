import { useState } from 'react'
import { CertificateTemplate } from '../../components/common/CertificateTemplate'

export function PlayerCertificates() {
  const [selectedCertificate, setSelectedCertificate] = useState(0)

  // Mock data as per user request
  const mockCertificateData = {
    serialNumber: '57',
    name: 'SUDHIR', // Placeholder based on "Jitender Singh" or just generic
    fatherName: 'SOMBIR',
    motherName: 'SUNITA',
    aadhaar: '6546-5799-4696',
    dob: '01-01-2005',
    district: 'CHARKHI DADRI',
    role: 'Player',
    // position: '1st', // Example
    event: 'Regu',
    dates: '28th to 29th September 2025',
    venue: 'YASH COLLEGE OF EDUCATION RURKEE, ROHTAK',
    championshipName: '22nd SENIOR HARYANA STATE SEPAKTAKRAW CHAMPIONSHIP-2025',
    // photoUrl: '...' // Optional
  }

  const certificateDesigns = [
    '/certificates/c1.png',
    '/certificates/c2.png',
    '/certificates/c3.png'
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-black text-gray-900 mb-2">My Certificates</h1>
        <p className="text-gray-600">View and download your earned certificates.</p>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-hidden">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Certificate Preview (Mockup)</h2>

        {/* Certificate Rendering */}
        <div className="w-full max-w-4xl mx-auto shadow-2xl rounded-lg overflow-hidden">
          <CertificateTemplate
            backgroundImage={certificateDesigns[selectedCertificate]}
            data={mockCertificateData}
          />
        </div>

        {/* Controls for Mockup */}
        <div className="mt-8 flex justify-center gap-4">
          {certificateDesigns.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedCertificate(index)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCertificate === index
                  ? 'bg-[#5a0a8f] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Design {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
