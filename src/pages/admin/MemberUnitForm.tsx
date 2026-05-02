import { useState, useEffect } from 'react'
import { useWebsiteContent, type MemberUnit } from '../../context/WebsiteContentContext'

export function MemberUnitForm() {
  const { content, updateAboutPage } = useWebsiteContent()

  const defaultPermanent: MemberUnit[] = [
    {
      slNo: '1',
      unit: 'HOCKEY ANDHRA PRADESH\nDoor No: 25-25-4/1\n1st lane, Netaji Nagar\nGuntur, Andhra Pradesh - 522004\n(E) hockeyandhra@hockeyindia.org\n(W) www.hockeyandhrapradesh.com\n\nRegistration Certificate No. 54 of 2014\n\nElections Conducted On: 29 September 2024',
      president: 'Mr. B M Chanakya Raju\n(P) +91 7780119947\n(E) chanakyaraju328@gmail.com',
      secretary: 'Mr. G . Harsha Vardhan - General Secretary\n(P) +91 8885656667\n(E) harshahockey@gmail.com\n\nMr. P. Thomas Peter - Treasurer',
    },
    {
      slNo: '2',
      unit: 'HOCKEY ARUNACHAL\nHill Top Colony, ESS Sector\nItanagar\nArunachal Pradesh\n(E) hockeyarunachal@hockeyindia.org\n(W) www.hockeyarunachal.com\n\nRegistration Certificate No. SR/ITA/5996',
      president: 'Mr. Gumjum Haider\n(P) +91 9436040637\n(P) +91 7005300550\n(E) gumjumhaider@yahoo.com',
      secretary: 'Mr. Sonam Tenzing - General Secretary\n(P) +91 9402222220\n(P) +91 8132932665\n(E) sonamtenzin321@gmail.com\n\nMr. Hillang Nima - Treasurer',
    },
    {
      slNo: '3',
      unit: 'ASSAM HOCKEY\nNowgong Sports Association\nNirulamin Stadium\nNagaon - 782001,\nAssam\n(F) 03672 – 232833\n(P) 03672-233405\n(E) assamhockey@hockeyindia.org\n(W) www.assamhockey.org\n\nRegistration Certificate No. 822 of 1981 - 1982\n\nElections Conducted On: 13 Feb 2022',
      president: 'Mr. Keshob Mahanta\n(P) +91-9954060006\n(P) +91-9435060006\n(E) mwrofficeassam@gmail.com',
      secretary: 'Mr. Tapan Kumar Das - General Secretary\n(P) +91 9435061711\n\nMr. Samundra Buragohain - Treasurer',
    }
  ]

  const [permanentMembers, setPermanentMembers] = useState<MemberUnit[]>(defaultPermanent)
  const [associateMembers, setAssociateMembers] = useState<MemberUnit[]>([])
  const [academyMembers, setAcademyMembers] = useState<MemberUnit[]>([])
  const [hockeyMembers, setHockeyMembers] = useState<MemberUnit[]>([])

  useEffect(() => {
    if (content.aboutPage?.permanentMembers && content.aboutPage.permanentMembers.length > 0) {
      setPermanentMembers(content.aboutPage.permanentMembers)
    }
    if (content.aboutPage?.associateMembers) {
      setAssociateMembers(content.aboutPage.associateMembers)
    }
    if (content.aboutPage?.academyMembers) {
      setAcademyMembers(content.aboutPage.academyMembers)
    }
    if (content.aboutPage?.hockeyMembers) {
      setHockeyMembers(content.aboutPage.hockeyMembers)
    }
  }, [content.aboutPage])

  const saveSection = async (field: keyof typeof content.aboutPage, data: MemberUnit[]) => {
    try {
      await updateAboutPage({ [field]: data })
      alert('Saved successfully!')
    } catch (e) {
      alert('Failed to save data')
    }
  }

  const renderTableEditor = (
    title: string,
    data: MemberUnit[],
    setData: React.Dispatch<React.SetStateAction<MemberUnit[]>>,
    field: keyof typeof content.aboutPage,
    secretaryHeader: string
  ) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <div className="space-x-2">
            <button 
              onClick={() => setData([...data, { slNo: String(data.length + 1), unit: '', president: '', secretary: '' }])}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add Row
            </button>
            <button 
              onClick={() => saveSection(field, data)} 
              className="bg-[#5a0a8f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a087a]"
            >
              Save Section
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {data.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative group">
              <button 
                onClick={() => setData(data.filter((_, i) => i !== idx))}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">SN</label>
                  <input type="text" value={item.slNo} onChange={e => {
                    const newData = [...data]; newData[idx].slNo = e.target.value; setData(newData);
                  }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Unit</label>
                  <textarea value={item.unit} onChange={e => {
                    const newData = [...data]; newData[idx].unit = e.target.value; setData(newData);
                  }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" rows={4} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">President</label>
                  <textarea value={item.president} onChange={e => {
                    const newData = [...data]; newData[idx].president = e.target.value; setData(newData);
                  }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" rows={4} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{secretaryHeader}</label>
                  <textarea value={item.secretary} onChange={e => {
                    const newData = [...data]; newData[idx].secretary = e.target.value; setData(newData);
                  }} className="w-full border p-2 rounded text-sm text-gray-900 bg-white" rows={4} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      {renderTableEditor('Permanent Members', permanentMembers, setPermanentMembers, 'permanentMembers', 'General Secretary / Treasurer')}
      {renderTableEditor('Associate Members', associateMembers, setAssociateMembers, 'associateMembers', 'General Secretary / Treasurer')}
      {renderTableEditor('Academy Members', academyMembers, setAcademyMembers, 'academyMembers', 'General Secretary')}
      {renderTableEditor('Hoc-Key Member', hockeyMembers, setHockeyMembers, 'hockeyMembers', 'Secretary')}
    </div>
  )
}
