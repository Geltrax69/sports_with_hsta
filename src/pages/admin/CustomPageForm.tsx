import { useState } from 'react'
import { useWebsiteContent, type CustomPage, type CustomPagePerson, type CustomPageSection } from '../../context/WebsiteContentContext'
import { apiRequest } from '../../lib/api'

interface CustomPageFormProps {
  customPage: CustomPage
}

export function CustomPageForm({ customPage }: CustomPageFormProps) {
  const { updateCustomPage } = useWebsiteContent()
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const [pageType, setPageType] = useState(customPage.pageType || 'content')
  const [content, setContent] = useState(customPage.content || '')
  
  const [tableHeaders, setTableHeaders] = useState<string[]>(customPage.tableData?.headers || [])
  const [tableRows, setTableRows] = useState<string[][]>(customPage.tableData?.rows || [])

  const [peopleSections, setPeopleSections] = useState<CustomPageSection[]>(customPage.peopleSections || [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    try {
      await updateCustomPage(customPage.id, {
        pageType,
        content,
        tableData: { headers: tableHeaders, rows: tableRows },
        peopleSections,
      })
      setSaveMessage('Content updated successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage('Failed to save content.')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const addHeader = () => setTableHeaders([...tableHeaders, 'New Header'])
  const addRow = () => setTableRows([...tableRows, new Array(tableHeaders.length).fill('')])
  
  const updateHeader = (i: number, val: string) => {
    const newH = [...tableHeaders]
    newH[i] = val
    setTableHeaders(newH)
  }
  
  const updateCell = (ri: number, ci: number, val: string) => {
    const newR = [...tableRows]
    newR[ri][ci] = val
    setTableRows(newR)
  }

  const removeRow = (ri: number) => {
    setTableRows(tableRows.filter((_, i) => i !== ri))
  }

  const removeHeader = (hi: number) => {
    setTableHeaders(tableHeaders.filter((_, i) => i !== hi))
    setTableRows(tableRows.map(row => row.filter((_, i) => i !== hi)))
  }

  const addSection = () => setPeopleSections([...peopleSections, { heading: 'New Heading', people: [] }])
  const updateSectionHeading = (i: number, val: string) => {
    const newS = [...peopleSections]
    newS[i].heading = val
    setPeopleSections(newS)
  }
  const removeSection = (i: number) => setPeopleSections(peopleSections.filter((_, idx) => idx !== i))

  const addPerson = (si: number) => {
    const newS = [...peopleSections]
    newS[si].people.push({ name: '', post: '', imageUrl: '' })
    setPeopleSections(newS)
  }

  const updatePerson = (si: number, pi: number, field: keyof CustomPagePerson, val: string) => {
    const newS = [...peopleSections]
    newS[si].people[pi] = { ...newS[si].people[pi], [field]: val }
    setPeopleSections(newS)
  }

  const removePerson = (si: number, pi: number) => {
    const newS = [...peopleSections]
    newS[si].people.splice(pi, 1)
    setPeopleSections(newS)
  }

  const handleImageUpload = async (si: number, pi: number, file: File) => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await apiRequest<{ url: string }>('/uploads/images', {
        method: 'POST',
        body: formData,
        auth: true,
      })
      if (res.url) {
        updatePerson(si, pi, 'imageUrl', res.url)
      }
    } catch (e) {
      alert('Failed to upload image')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{customPage.title}</h2>
          <p className="mt-1 text-sm text-gray-500">Edit the content and layout for this page.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#5a0a8f] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#4a087a] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <><span className="material-symbols-outlined animate-spin text-[20px]">sync</span> Saving...</>
          ) : (
            <><span className="material-symbols-outlined text-[20px]">save</span> Save Changes</>
          )}
        </button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg ${saveMessage.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {saveMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <label className="block text-sm font-semibold text-gray-900 mb-3">Page Layout Type</label>
        <div className="flex gap-4">
          {['content', 'table', 'people'].map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                checked={pageType === type} 
                onChange={() => setPageType(type as any)}
                className="text-[#5a0a8f] focus:ring-[#5a0a8f]"
              />
              <span className="capitalize text-gray-900 font-medium">{type} Page</span>
            </label>
          ))}
        </div>
      </div>

      {pageType === 'content' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Markdown Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none font-mono text-sm text-gray-900"
            placeholder="# Page Heading\n\nEnter your markdown content here..."
          />
        </div>
      )}

      {pageType === 'table' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-900">Table Data</h3>
            <button onClick={addHeader} className="text-[#5a0a8f] text-sm font-semibold hover:underline">
              + Add Column
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="p-2 border border-gray-300 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={h} 
                          onChange={e => updateHeader(i, e.target.value)} 
                          className="w-full bg-transparent outline-none font-bold text-gray-900"
                        />
                        <button onClick={() => removeHeader(i)} className="text-red-500 hover:text-red-700">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="p-2 border border-gray-300 bg-gray-50 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="p-2 border border-gray-300">
                        <input 
                          type="text" 
                          value={cell} 
                          onChange={e => updateCell(ri, ci, e.target.value)} 
                          className="w-full bg-transparent outline-none text-gray-900"
                        />
                      </td>
                    ))}
                    <td className="p-2 border border-gray-300 text-center">
                      <button onClick={() => removeRow(ri)} className="text-red-500 hover:text-red-700">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addRow} className="mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-200 transition-colors">
            + Add Row
          </button>
        </div>
      )}

      {pageType === 'people' && (
        <div className="space-y-6">
          {peopleSections.map((section, si) => (
            <div key={si} className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-start mb-6">
                <input 
                  type="text"
                  value={section.heading}
                  onChange={e => updateSectionHeading(si, e.target.value)}
                  className="text-xl font-bold text-gray-900 border-b border-gray-300 focus:border-[#5a0a8f] outline-none pb-1 w-1/2"
                  placeholder="Section Heading"
                />
                <button onClick={() => removeSection(si)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.people.map((person, pi) => (
                  <div key={pi} className="border border-gray-200 rounded-lg p-4 relative group">
                    <button 
                      onClick={() => removePerson(si, pi)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                    
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border border-gray-200 relative group/img">
                        {person.imageUrl ? (
                          <img src={person.imageUrl} alt="person" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="material-symbols-outlined text-3xl">person</span>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 cursor-pointer transition-opacity">
                          <span className="text-xs font-medium">Upload</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            if (e.target.files?.[0]) handleImageUpload(si, pi, e.target.files[0])
                          }} />
                        </label>
                      </div>
                      
                      <input
                        type="url"
                        value={person.imageUrl}
                        onChange={e => updatePerson(si, pi, 'imageUrl', e.target.value)}
                        placeholder="Image URL (or upload above)"
                        className="w-full text-center text-xs text-gray-500 border-b border-gray-300 focus:border-[#5a0a8f] outline-none"
                      />

                      <input
                        type="text"
                        value={person.name}
                        onChange={e => updatePerson(si, pi, 'name', e.target.value)}
                        placeholder="Name"
                        className="w-full text-center font-bold text-gray-900 border-b border-gray-300 focus:border-[#5a0a8f] outline-none"
                      />
                      <input
                        type="text"
                        value={person.post}
                        onChange={e => updatePerson(si, pi, 'post', e.target.value)}
                        placeholder="Post / Title"
                        className="w-full text-center text-sm text-gray-600 border-b border-gray-300 focus:border-[#5a0a8f] outline-none"
                      />
                    </div>
                  </div>
                ))}
                
                <button onClick={() => addPerson(si)} className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors h-48">
                  <span className="material-symbols-outlined text-3xl mb-2">person_add</span>
                  <span className="font-medium">Add Person</span>
                </button>
              </div>
            </div>
          ))}

          <button onClick={addSection} className="w-full bg-white border-2 border-dashed border-[#5a0a8f] text-[#5a0a8f] p-4 rounded-xl font-bold hover:bg-purple-50 transition-colors">
            + Add New Section
          </button>
        </div>
      )}
    </div>
  )
}
