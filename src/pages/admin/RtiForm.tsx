import { useState, useEffect } from 'react'
import { useWebsiteContent, type RtiExecutiveBoard, type RtiOfficer } from '../../context/WebsiteContentContext'

export function RtiForm() {
  const { content, updateAboutPage } = useWebsiteContent()

  const defaultBoard: RtiExecutiveBoard[] = [
    { role: 'President', number: '' },
    { role: 'Secretary General', number: '' },
    { role: 'Treasurer', number: '' },
    { role: 'Vice President', number: '2' },
    { role: 'Associate Vice President', number: '2' },
    { role: 'Joint Secretary', number: '2' },
    { role: 'Associate Joint Secretary', number: '2' },
    { role: 'Executive Member', number: '5' },
    { role: 'Athlete Representative', number: '4' }
  ]

  const defaultOfficers: RtiOfficer[] = [
    { name: 'Cdr. R. K. Srivastava', designation: 'Director General' },
    { name: 'Mr. B. N. Bhushan', designation: 'Director' },
    { name: 'Ms. Ranjit Gill', designation: 'Director' },
    { name: 'Mr. Vikram Singh', designation: 'Director - Competitions & Hockey Development' },
    { name: 'Mr. Kuldeep Singh', designation: 'Joint Director - Protocol' },
    { name: 'Mr. Rakesh Kumar', designation: 'Joint Director - Administration & HR' },
    { name: 'Mr. Ahad Azim', designation: 'Joint Director - Coordination' },
    { name: 'Mr. Bhupender Singh', designation: 'Manager Coordination' },
    { name: 'Mr. Ankit Walia', designation: 'Manager Coordination' },
    { name: 'Mr. Naveen Khurana', designation: 'Senior Account Officer' },
    { name: 'Mr. Mahender Singh Negi', designation: 'Manager Purchase & Administration' },
    { name: 'Mr. Davender Kumar Sharma', designation: 'Manager Coordination' },
    { name: 'Mr. Tarun Gambhir', designation: 'Manager Admin/Protocol' },
    { name: 'Ms. Sneha Singh', designation: 'Manager Media' },
    { name: 'Ms. Bhagyashree Das', designation: 'Officer Coordination' },
    { name: 'Ms. Priyanka Yadav', designation: 'P.A. to DG' },
    { name: 'Ms. Vaishali Rathore', designation: 'Senior Officer Coordination' },
    { name: 'Ms. Monalisa Mishra', designation: 'P.S. to President' },
    { name: 'Mr. Som Akash', designation: 'Account Officer' },
    { name: 'Mr. Akash Choubey', designation: 'Officer Coordination' },
    { name: 'Mr. Amit Rai', designation: 'IT Executive' },
    { name: 'Mr. Wasim', designation: 'Office Assistant' },
    { name: 'Mr. Ashish', designation: 'Accountant' },
    { name: 'Mr. Deepak Kumar', designation: 'Record keeper Finance' },
    { name: 'Mr. Prem Singh', designation: 'Office Assistant' },
    { name: 'Mr. Sanjeev Singh', designation: 'Office Assistant' },
    { name: 'Mr. Manohar Lal', designation: 'Office Assistant' },
    { name: 'Ms. Mansi Sejwal', designation: 'Cashier' }
  ]

  const [rtiExecutiveBoard, setRtiExecutiveBoard] = useState<RtiExecutiveBoard[]>(defaultBoard)
  const [rtiOfficers, setRtiOfficers] = useState<RtiOfficer[]>(defaultOfficers)

  useEffect(() => {
    if (content.aboutPage?.rtiExecutiveBoard && content.aboutPage.rtiExecutiveBoard.length > 0) {
      setRtiExecutiveBoard(content.aboutPage.rtiExecutiveBoard)
    }
    if (content.aboutPage?.rtiOfficers && content.aboutPage.rtiOfficers.length > 0) {
      setRtiOfficers(content.aboutPage.rtiOfficers)
    }
  }, [content.aboutPage])

  const saveBoard = async () => {
    try {
      await updateAboutPage({ rtiExecutiveBoard })
      alert('Executive Board saved successfully!')
    } catch (e) {
      alert('Failed to save Executive Board')
    }
  }

  const saveOfficers = async () => {
    try {
      await updateAboutPage({ rtiOfficers })
      alert('Officers and Employees saved successfully!')
    } catch (e) {
      alert('Failed to save Officers and Employees')
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Executive Board Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Executive Board</h2>
          <div className="space-x-2">
            <button 
              onClick={() => setRtiExecutiveBoard([...rtiExecutiveBoard, { role: '', number: '' }])}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add Row
            </button>
            <button 
              onClick={saveBoard} 
              className="bg-[#5a0a8f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a087a]"
            >
              Save Board
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {rtiExecutiveBoard.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-center group relative border border-gray-200 p-3 rounded-lg bg-gray-50">
              <div className="flex-1">
                <input 
                  type="text" 
                  value={item.role} 
                  placeholder="Role"
                  onChange={e => {
                    const newData = [...rtiExecutiveBoard]; newData[idx].role = e.target.value; setRtiExecutiveBoard(newData);
                  }} 
                  className="w-full border p-2 rounded text-sm text-gray-900 bg-white" 
                />
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={item.number} 
                  placeholder="Number"
                  onChange={e => {
                    const newData = [...rtiExecutiveBoard]; newData[idx].number = e.target.value; setRtiExecutiveBoard(newData);
                  }} 
                  className="w-full border p-2 rounded text-sm text-gray-900 bg-white" 
                />
              </div>
              <button 
                onClick={() => setRtiExecutiveBoard(rtiExecutiveBoard.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Officers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Officers and Employees</h2>
          <div className="space-x-2">
            <button 
              onClick={() => setRtiOfficers([...rtiOfficers, { name: '', designation: '' }])}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add Row
            </button>
            <button 
              onClick={saveOfficers} 
              className="bg-[#5a0a8f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a087a]"
            >
              Save Officers
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {rtiOfficers.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-center group relative border border-gray-200 p-3 rounded-lg bg-gray-50">
              <div className="flex-1">
                <input 
                  type="text" 
                  value={item.name} 
                  placeholder="Name"
                  onChange={e => {
                    const newData = [...rtiOfficers]; newData[idx].name = e.target.value; setRtiOfficers(newData);
                  }} 
                  className="w-full border p-2 rounded text-sm text-gray-900 bg-white" 
                />
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={item.designation} 
                  placeholder="Designation"
                  onChange={e => {
                    const newData = [...rtiOfficers]; newData[idx].designation = e.target.value; setRtiOfficers(newData);
                  }} 
                  className="w-full border p-2 rounded text-sm text-gray-900 bg-white" 
                />
              </div>
              <button 
                onClick={() => setRtiOfficers(rtiOfficers.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
