import { useState } from 'react'
import { AdminEmailField } from './AdminEmailField'
import type { PlayerRegistration } from '../../context/RegistrationsContext'

interface EditCoachModalProps {
    registration: PlayerRegistration
    onClose: () => void
    onSave: (updates: Partial<PlayerRegistration>) => void
}

export function EditCoachModal({ registration, onClose, onSave }: EditCoachModalProps) {
    const [formData, setFormData] = useState({
        fullName: registration.fullName,
        fatherName: registration.fatherName,
        motherName: registration.motherName,
        phone: registration.phone || '',
        dateOfBirth: registration.dateOfBirth,
        aadhaarNumber: registration.aadhaarNumber,
        passportNumber: registration.passportNumber || '',
        passportExpiryDate: registration.passportExpiryDate || '',
        passportIssuedPlace: registration.passportIssuedPlace || '',
        email: registration.email,
        district: registration.district,
        category: registration.category || '',
        gender: registration.gender || '',
        tShirtSize: registration.tShirtSize || '',
        trackSuitSize: registration.trackSuitSize || '',
        shoesSize: registration.shoesSize || '',
        pantSize: registration.pantSize || '',
        districtGames: registration.districtGames || '',
        stateGames: registration.stateGames || '',
        nationalGames: registration.nationalGames || '',
        internationalGames: registration.internationalGames || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-[60] p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-2xl w-full my-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">Edit Coach Registration</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <AdminEmailField
                            role="coach"
                            accountId={registration.id}
                            email={formData.email}
                            onChanged={(email) => setFormData((prev) => ({ ...prev, email }))}
                        />
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Father's Name</label>
                            <input
                                type="text"
                                name="fatherName"
                                value={formData.fatherName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Mother's Name</label>
                            <input
                                type="text"
                                name="motherName"
                                value={formData.motherName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhaar Number</label>
                            <input
                                type="text"
                                name="aadhaarNumber"
                                value={formData.aadhaarNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Passport Number</label>
                            <input
                                type="text"
                                name="passportNumber"
                                value={formData.passportNumber}
                                onChange={handleChange}
                                placeholder="Enter passport number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Passport Expiry</label>
                            <input
                                type="date"
                                name="passportExpiryDate"
                                value={formData.passportExpiryDate}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Issued Place</label>
                            <input
                                type="text"
                                name="passportIssuedPlace"
                                value={formData.passportIssuedPlace}
                                onChange={handleChange}
                                placeholder="City/State"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none bg-white"
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none bg-white"
                            >
                                <option value="">Select Category</option>
                                <option value="SC">SC</option>
                                <option value="ST">ST</option>
                                <option value="General">General</option>
                                <option value="OBC">OBC</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">T-Shirt Size</label>
                            <select
                                name="tShirtSize"
                                value={formData.tShirtSize}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none bg-white"
                            >
                                <option value="">Select Size</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="XXL">XXL</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tracksuit Size</label>
                            <select
                                name="trackSuitSize"
                                value={formData.trackSuitSize}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none bg-white"
                            >
                                <option value="">Select Size</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="XXL">XXL</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Shoes Size</label>
                            <input
                                type="text"
                                name="shoesSize"
                                value={formData.shoesSize}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Pant Size</label>
                            <input
                                type="text"
                                name="pantSize"
                                value={formData.pantSize}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">District Games Coached</label>
                            <input
                                type="text"
                                name="districtGames"
                                value={formData.districtGames}
                                onChange={handleChange}
                                placeholder="Number of games"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">State Games Coached</label>
                            <input
                                type="text"
                                name="stateGames"
                                value={formData.stateGames}
                                onChange={handleChange}
                                placeholder="Number of games"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">National Games Coached</label>
                            <input
                                type="text"
                                name="nationalGames"
                                value={formData.nationalGames}
                                onChange={handleChange}
                                placeholder="Number of games"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">International Games Coached</label>
                            <input
                                type="text"
                                name="internationalGames"
                                value={formData.internationalGames}
                                onChange={handleChange}
                                placeholder="Number of games"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-bold shadow-lg shadow-purple-900/20 transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
