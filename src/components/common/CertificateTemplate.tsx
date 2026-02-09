import type { FC } from 'react'
import './CertificateTemplate.css'

interface CertificateData {
    serialNumber: string
    name: string
    fatherName: string
    motherName: string
    aadhaar: string
    dob: string
    district: string
    role: string
    position?: string
    event: string
    dates: string
    venue: string
    championshipName: string
    photoUrl?: string
}

interface CertificateTemplateProps {
    backgroundImage: string
    data: CertificateData
    logos?: string[] // Optional array of logo URLs
    signatures?: {
        president?: string
        secretary?: string
        treasurer?: string
        orgSecretary?: string
    }
}

export const CertificateTemplate: FC<CertificateTemplateProps> = ({
    backgroundImage,
    data,
    logos = [], // Default to empty array
    signatures // For future use
}) => {
    // Ensure we always have 7 slots for structure, filling missing ones with empty strings
    // If fewer than 7 logos are provided, we show placeholders for the rest
    const displayLogos = [...logos, ...Array(7 - logos.length).fill('')].slice(0, 7);

    return (
        <div className="certificate-container">
            <div className="certificate-aspect-ratio">
                {/* Background Image */}
                <img
                    src={backgroundImage}
                    alt="Certificate Background"
                    className="certificate-bg"
                />

                {/* Content Overlay */}
                <div className="certificate-content">

                    {/* Logos Section */}
                    <div className="certificate-logos">
                        {displayLogos.map((logo, index) => (
                            logo ? (
                                <img key={index} src={logo} alt={`Logo ${index + 1}`} className="logo-img" />
                            ) : (
                                <div key={index} className="logo-placeholder">Logo {index + 1}</div>
                            )
                        ))}
                    </div>

                    {/* Header Section */}
                    <div className="text-center">
                        <h1 className="header-association-name">
                            HARYANA SEPAKTAKRAW ASSOCIATION
                        </h1>
                        <p className="header-affiliation">
                            Affiliated from : Sepaktakraw Federation of India
                        </p>
                        <p className="header-recognition">
                            Recognised by : HARYANA OLYMPIC ASSOCIATION, INDIAN OLYMPIC ASSOCIATION, AIU,
                            SGFI, MINISTRY OF YOUTH AFFAIRS & SPORTS, GOVT. OF INDIA
                        </p>
                    </div>

                    {/* Championship Title */}
                    <div className="text-center">
                        <h2 className="championship-title">
                            {data.championshipName}
                        </h2>
                        <p className="championship-subtitle">
                            (MEN & WOMEN)
                        </p>
                        <p className="organised-by">
                            Organised by : <span>Rohtak District Sepaktakraw Association</span>
                        </p>
                    </div>

                    {/* Photo and Serial Number Row */}
                    <div className="middle-row">
                        {/* Serial No (Left) */}
                        <div className="mb-[0.5cqw]">
                            <span className="sr-no-label">Sr. No. </span>
                            <span className="sr-no-value">
                                {data.serialNumber}
                            </span>
                        </div>

                        {/* Certificate Title (Center - moved here or below photo row? Design usually has title below photo row or centered. Image shows title below Photo row)
                            Wait, in the image 2, title "Certificate of Merit/Participation" is BELOW the Sr No / Photo line.
                        */}
                    </div>

                    {/* Photo (Right) - Actually in the image provided, Photo is on the right, Sr No on the left.
                         But the Title "Certificate..." is centered.
                         Let's put the photo absolutely positioned or floated? No, flex row is fine.
                         But I need to make sure the photo doesn't push the title if title is below.
                         The image shows Sr No left, Photo right. Title is centered below them.
                     */}
                    <div style={{ position: 'absolute', right: '10%', top: '37%', zIndex: 20 }}>
                        <div className="photo-box">
                            {data.photoUrl ? (
                                <img src={data.photoUrl} alt="Player" className="photo-img" />
                            ) : (
                                <span className="photo-placeholder">Photo</span>
                            )}
                        </div>
                    </div>

                    {/* Certificate Title Pill */}
                    <div className="certificate-title-container">
                        <div className="certificate-title-pill">
                            Certificate of Merit/Participation
                        </div>
                    </div>

                    {/* Body Text */}
                    <div className="certificate-body">
                        <p>
                            This is to certify that Kumar/Kumari&nbsp;
                            <span className="variable-field">{data.name}</span>
                            &nbsp;S/o/D/o Sh.&nbsp;
                            <span className="variable-field">{data.fatherName}</span>
                            &nbsp;Mother Name&nbsp;
                            <span className="variable-field">{data.motherName}</span>
                        </p>

                        <p className="flex flex-wrap items-center justify-center gap-[0.2cqw]">
                            Aadhaar Card No&nbsp;
                            <span className="variable-field">{data.aadhaar}</span>
                            &nbsp;D.O.B.&nbsp;
                            <span className="variable-field">{data.dob}</span>
                            &nbsp;of&nbsp;
                            <span className="variable-field">{data.district}</span>
                            &nbsp;district has participated in the {data.championshipName} for Men & Women held at
                        </p>

                        <p className="mt-[0.5cqw] font-bold">
                            <span className="variable-field" style={{ textTransform: 'uppercase', fontSize: '1.1em', minWidth: '80%', borderBottom: 'none', display: 'inline-block' }}>
                                {data.venue}
                            </span>
                        </p>

                        <p style={{ marginTop: '0.5cqw' }}>
                            from <span style={{ fontWeight: 'bold' }}>{data.dates}</span> as a&nbsp;
                            <span className="variable-field">{data.role}</span>
                            &nbsp;and secured&nbsp;
                            <span className="variable-field" style={{ minWidth: '3em' }}>
                                {data.position || 'Participated'}
                            </span>
                            &nbsp;place in the&nbsp;
                            <span className="variable-field">{data.event}</span>
                            &nbsp;Event.
                        </p>
                    </div>

                    {/* Spacer */}
                    <div className="flex-grow"></div>

                    {/* Footer Signatures */}
                    <div className="footer-signatures">
                        <div className="signature-block">
                            <div className="signature-placeholder"></div>
                            <div className="signer-name">{signatures?.president}</div>
                            <div className="signer-title">President HSTA</div>
                        </div>

                        <div className="signature-block">
                            <div className="signature-placeholder"></div>
                            <div className="signer-name">{signatures?.secretary}</div>
                            <div className="signer-title">General Secretary HSTA</div>
                        </div>

                        <div className="signature-block">
                            <div className="signature-placeholder"></div>
                            <div className="signer-name">{signatures?.treasurer}</div>
                            <div className="signer-title">Treasurer HSTA</div>
                        </div>

                        <div className="signature-block">
                            <div className="signature-placeholder"></div>
                            <div className="signer-name">{signatures?.orgSecretary}</div>
                            <div className="signer-title">Org. Secretary</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
