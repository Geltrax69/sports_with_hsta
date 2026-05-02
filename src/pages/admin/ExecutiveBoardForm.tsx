import { useState, useEffect } from 'react'
import { useWebsiteContent, type OfficeBearer, type ExecutiveBoardMember, type OtherBoardMemberPosition, type PastOfficeBearer } from '../../context/WebsiteContentContext'
import { apiRequest } from '../../lib/api'
import { processImageFile } from '../../lib/imageCompression'

export function ExecutiveBoardForm() {
  const { content, updateAboutPage } = useWebsiteContent()
  
  // Office Bearers State
  const defaultBearers: OfficeBearer[] = [
    { role: 'President', name: '', email: '', mobile: '', tenure: '', address: '' },
    { role: 'Secretary General', name: '', email: '', mobile: '', tenure: '', address: '' },
    { role: 'Treasurer', name: '', email: '', mobile: '', tenure: '', address: '' }
  ]
  
  const [bearers, setBearers] = useState<OfficeBearer[]>(defaultBearers)
  const [isSavingBearers, setIsSavingBearers] = useState(false)
  
  const [members, setMembers] = useState<ExecutiveBoardMember[]>([])
  const [newMember, setNewMember] = useState<{ name: string, post: string, imageFile: File | null, imageUrl: string }>({
    name: '', post: '', imageFile: null, imageUrl: ''
  })
  const [isUploading, setIsUploading] = useState(false)

  // Other Board Members State
  const [otherPositions, setOtherPositions] = useState<OtherBoardMemberPosition[]>([])
  
  // Past Office Bearers State
  const [pastBearers, setPastBearers] = useState<PastOfficeBearer[]>([])

  useEffect(() => {
    if (content.aboutPage?.officeBearers && content.aboutPage.officeBearers.length > 0) {
      setBearers(content.aboutPage.officeBearers)
    }
    if (content.aboutPage?.executiveBoardMembers) {
      setMembers(content.aboutPage.executiveBoardMembers)
    }
    if (content.aboutPage?.otherBoardMemberPositions) {
      setOtherPositions(content.aboutPage.otherBoardMemberPositions)
    }
    if (content.aboutPage?.pastOfficeBearers) {
      setPastBearers(content.aboutPage.pastOfficeBearers)
    }
  }, [content.aboutPage])

  const handleBearerChange = (index: number, field: keyof OfficeBearer, value: string) => {
    const newBearers = [...bearers]
    newBearers[index] = { ...newBearers[index], [field]: value }
    setBearers(newBearers)
  }

  const saveBearers = async () => {
    setIsSavingBearers(true)
    try {
      await updateAboutPage({ officeBearers: bearers })
      alert('Office Bearers saved successfully!')
    } catch (e) {
      alert('Failed to save office bearers')
    } finally {
      setIsSavingBearers(false)
    }
  }

  const saveOtherPositions = async () => {
    try {
      await updateAboutPage({ otherBoardMemberPositions: otherPositions })
      alert('Other Board Members saved successfully!')
    } catch (e) {
      alert('Failed to save Other Board Members')
    }
  }

  const savePastBearers = async () => {
    try {
      await updateAboutPage({ pastOfficeBearers: pastBearers })
      alert('Past Office Bearers saved successfully!')
    } catch (e) {
      alert('Failed to save Past Office Bearers')
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const processedFile = await processImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setNewMember({ ...newMember, imageFile: processedFile, imageUrl: reader.result as string })
        }
        reader.readAsDataURL(processedFile)
      } catch (error) {
        alert('Invalid image file')
      }
    }
  }

  const handleAddMember = async () => {
    if (!newMember.name || (!newMember.imageFile && !newMember.imageUrl)) {
      alert('Please provide name and image')
      return
    }
    setIsUploading(true)
    try {
      let finalImageUrl = newMember.imageUrl
      
      if (newMember.imageFile) {
        const formData = new FormData()
        formData.append('image', newMember.imageFile)
        formData.append('name', 'executive-member')
        
        const response = await apiRequest<{ key: string; url: string }>('/uploads/images', {
          method: 'POST',
          body: formData,
          auth: true,
        })
        finalImageUrl = response.url
      }
      
      const updatedMembers = [...members, {
        name: newMember.name,
        post: newMember.post,
        imageUrl: finalImageUrl,
        order: members.length
      }]
      
      await updateAboutPage({ executiveBoardMembers: updatedMembers })
      setMembers(updatedMembers)
      setNewMember({ name: '', post: '', imageFile: null, imageUrl: '' })
    } catch (e) {
      alert('Failed to add member')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveMember = async (index: number) => {
    if (!window.confirm('Remove this member?')) return
    const updatedMembers = [...members]
    updatedMembers.splice(index, 1)
    try {
      await updateAboutPage({ executiveBoardMembers: updatedMembers })
      setMembers(updatedMembers)
    } catch (e) {
      alert('Failed to remove member')
    }
  }

  return (
    <div className="space-y-8 mt-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Core Office Bearers</h2>
          <button 
            onClick={saveBearers} 
            disabled={isSavingBearers}
            className="bg-[#5a0a8f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a087a]"
          >
            {isSavingBearers ? 'Saving...' : 'Save Office Bearers'}
          </button>
        </div>
        
        <div className="space-y-8">
          {bearers.map((bearer, index) => (
            <div key={bearer.role} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-bold text-lg text-[#5a0a8f] mb-4">{bearer.role}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                  <input type="text" value={bearer.name} onChange={e => handleBearerChange(index, 'name', e.target.value)} className="w-full border p-2 rounded text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email ID</label>
                  <input type="text" value={bearer.email} onChange={e => handleBearerChange(index, 'email', e.target.value)} className="w-full border p-2 rounded text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile</label>
                  <input type="text" value={bearer.mobile} onChange={e => handleBearerChange(index, 'mobile', e.target.value)} className="w-full border p-2 rounded text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tenure till date</label>
                  <input type="text" value={bearer.tenure} onChange={e => handleBearerChange(index, 'tenure', e.target.value)} className="w-full border p-2 rounded text-gray-900 bg-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                  <textarea value={bearer.address} onChange={e => handleBearerChange(index, 'address', e.target.value)} className="w-full border p-2 rounded text-gray-900 bg-white" rows={3} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Executive Board Members</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {members.map((m, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 text-center relative group">
              <img src={m.imageUrl} alt={m.name} className="w-24 h-24 object-cover rounded-full mx-auto mb-3 border-2 border-[#5a0a8f]" />
              <div className="font-bold text-sm">{m.name}</div>
              <div className="text-xs text-gray-500">{m.post}</div>
              <button 
                onClick={() => handleRemoveMember(idx)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-bold text-md text-gray-800 mb-4">Add New Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
              <input type="text" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full border p-2 rounded text-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Post / Role</label>
              <input type="text" value={newMember.post} onChange={e => setNewMember({...newMember, post: e.target.value})} className="w-full border p-2 rounded text-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Image URL or Upload</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm mb-2 text-gray-900" />
              <input type="text" placeholder="Or Image URL" value={newMember.imageUrl && !newMember.imageFile ? newMember.imageUrl : ''} onChange={e => setNewMember({...newMember, imageUrl: e.target.value, imageFile: null})} className="w-full border p-2 rounded text-xs text-gray-900 bg-white" />
            </div>
          </div>
          <div className="mt-4 text-right">
            <button 
              onClick={handleAddMember}
              disabled={isUploading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              {isUploading ? 'Uploading...' : 'Add Member'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Other Board Members</h2>
          <div className="space-x-2">
            <button 
              onClick={() => setOtherPositions([...otherPositions, { position: '', number: '', details: '' }])}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add Row
            </button>
            <button 
              onClick={saveOtherPositions} 
              className="bg-[#5a0a8f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a087a]"
            >
              Save Section
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {otherPositions.map((pos, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-4 items-start border border-gray-200 rounded-lg p-4 bg-gray-50 relative group">
              <button 
                onClick={() => setOtherPositions(otherPositions.filter((_, i) => i !== idx))}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
              <div className="w-full md:w-1/3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Position</label>
                <input type="text" value={pos.position} onChange={e => {
                  const newPos = [...otherPositions]; newPos[idx].position = e.target.value; setOtherPositions(newPos);
                }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" placeholder="e.g. VICE PRESIDENT" />
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Number</label>
                <input type="text" value={pos.number} onChange={e => {
                  const newPos = [...otherPositions]; newPos[idx].number = e.target.value; setOtherPositions(newPos);
                }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" placeholder="e.g. 2" />
              </div>
              <div className="w-full md:w-5/12">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Details (Optional Names)</label>
                <textarea value={pos.details || ''} onChange={e => {
                  const newPos = [...otherPositions]; newPos[idx].details = e.target.value; setOtherPositions(newPos);
                }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" rows={2} placeholder="1. Name One&#10;2. Name Two" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Past Office Bearers Since Formation</h2>
          <div className="space-x-2">
            <button 
              onClick={() => setPastBearers([...pastBearers, { slNo: String(pastBearers.length + 1), tenure: '', president: '', secretaryGeneral: '', treasurer: '' }])}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add Row
            </button>
            <button 
              onClick={savePastBearers} 
              className="bg-[#5a0a8f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a087a]"
            >
              Save Section
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {pastBearers.map((bearer, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative group">
              <button 
                onClick={() => setPastBearers(pastBearers.filter((_, i) => i !== idx))}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Sl. No.</label>
                  <input type="text" value={bearer.slNo} onChange={e => {
                    const newB = [...pastBearers]; newB[idx].slNo = e.target.value; setPastBearers(newB);
                  }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tenure</label>
                  <input type="text" value={bearer.tenure} onChange={e => {
                    const newB = [...pastBearers]; newB[idx].tenure = e.target.value; setPastBearers(newB);
                  }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" placeholder="e.g. 2009 - 2010" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">President</label>
                  <textarea value={bearer.president} onChange={e => {
                    const newB = [...pastBearers]; newB[idx].president = e.target.value; setPastBearers(newB);
                  }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" rows={4} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Secretary General</label>
                  <textarea value={bearer.secretaryGeneral} onChange={e => {
                    const newB = [...pastBearers]; newB[idx].secretaryGeneral = e.target.value; setPastBearers(newB);
                  }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" rows={4} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Treasurer</label>
                  <textarea value={bearer.treasurer} onChange={e => {
                    const newB = [...pastBearers]; newB[idx].treasurer = e.target.value; setPastBearers(newB);
                  }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" rows={4} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
