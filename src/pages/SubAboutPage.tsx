import { useParams } from 'react-router-dom'
import { useWebsiteContent, type AboutPageSettings } from '../context/WebsiteContentContext'

export function SubAboutPage({ title: propTitle }: { title?: string }) {
  const { slug } = useParams<{ slug: string }>()
  const { content } = useWebsiteContent()

  const fieldMapping: Record<string, keyof AboutPageSettings> = {
    'Executive Board': 'executiveBoardText',
    'Member Unit': 'memberUnitText',
    'RTI': 'rtiText',
    'Annual Report': 'annualReportText',
    'Election Report': 'electionReportText',
  }

  // Determine if it's a dynamic page or document list
  const isAccounts = slug === 'accounts' || propTitle === 'Accounts'
  const isAgm = slug === 'agm-meetings' || propTitle === 'AGM Meetings'
  const isElectionReport = slug === 'election-report' || propTitle === 'Election Report'
  
  const customPage = (!isAccounts && !isAgm && !isElectionReport && slug) ? content.aboutPage?.customPages?.find(p => p.slug === slug) : null;
  
  let title = propTitle || customPage?.title || 'Unknown Page'
  if (isAccounts) title = 'Accounts and Expenditures'
  if (isAgm) title = 'AGM Meetings'
  if (isElectionReport) title = 'Election Report'

  const documentItems = isAccounts 
    ? (content.aboutPage?.accounts || []) 
    : (isAgm ? (content.aboutPage?.agmMeetings || []) : (isElectionReport ? (content.aboutPage?.electionReports || []) : (customPage?.pageType === 'document' ? (customPage.documents || []) : [])))
  
  const field = fieldMapping[title]
  const pageContent = customPage 
    ? customPage.content 
    : (field && content.aboutPage?.[field]) as string | undefined


  return (
    <main id="page-content" className="w-full overflow-x-hidden relative">
      <section className="relative w-full overflow-hidden bg-[#5a0a8f] py-20 md:py-32">
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl animate-entry">
            {title}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white md:text-xl animate-entry delay-100">
            Information regarding {title}
          </p>
        </div>
      </section>

      <section className="py-20 md:py-32 relative min-h-[40vh] bg-[#f8f9fc] overflow-hidden">
        {/* Immersive Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[50%] rounded-full bg-gradient-to-br from-[#5a0a8f]/10 to-[#241b71]/5 blur-[100px]"></div>
          <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[60%] rounded-full bg-gradient-to-tr from-[#f50057]/5 to-transparent blur-[120px]"></div>
          <div className="absolute top-[40%] left-[20%] w-[60%] h-[40%] rounded-full bg-[#5a0a8f]/5 blur-[100px]"></div>
          
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(36,27,113,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(36,27,113,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          {(isAccounts || isAgm || (customPage && customPage.pageType === 'document')) ? (
            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#241b71] text-white">
                    <th className="py-4 px-6 text-center w-24 font-bold border-r border-[#3a2e8c]">Sr. No</th>
                    <th className="py-4 px-6 font-bold border-r border-[#3a2e8c]">{title}</th>
                    <th className="py-4 px-6 font-bold w-48 text-center">Download Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {documentItems.length > 0 ? (
                    documentItems.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 text-center text-gray-600 font-medium">{index + 1}</td>
                        <td className="py-4 px-6 text-gray-900">{item.title}</td>
                        <td className="py-4 px-6 text-center">
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-[#5a0a8f] font-semibold hover:text-purple-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">description</span>
                            View
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
                        No documents available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : customPage && customPage.pageType === 'table' && customPage.tableData ? (
            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#241b71] text-white">
                    <th className="py-4 px-6 text-center w-24 font-bold border-r border-[#3a2e8c]">Sr. No</th>
                    {customPage.tableData.headers.map((h, i) => (
                      <th key={i} className="py-4 px-6 font-bold border-r border-[#3a2e8c]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customPage.tableData.rows.length > 0 ? (
                    customPage.tableData.rows.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 text-center text-gray-600 font-medium">{index + 1}</td>
                        {row.map((cell, ci) => (
                          <td key={ci} className="py-4 px-6 text-gray-900">{cell}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={customPage.tableData.headers.length + 1} className="py-8 text-center text-gray-500">
                        No data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : customPage && customPage.pageType === 'people' && customPage.peopleSections ? (
            <div className="space-y-24">
              {customPage.peopleSections.map((section, si) => (
                <div key={si} className="mb-16">
                  {section.heading && (
                    <div className="relative mb-20 flex justify-center w-full max-w-7xl mx-auto">
                      <div className="bg-[#241b71] px-10 py-4 relative shadow-xl backdrop-blur-md">
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest text-center">
                          {section.heading}
                        </h2>
                        {/* Red angled accent */}
                        <div className="absolute right-[-20px] top-0 bottom-0 w-[40px] bg-[#f50057] transform skew-x-[-20deg] z-[-1] shadow-lg"></div>
                        {/* Blue angled start */}
                        <div className="absolute left-[-20px] top-0 bottom-0 w-[40px] bg-[#241b71] transform skew-x-[-20deg] z-[-1] shadow-lg"></div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-y-28 gap-x-8 max-w-6xl mx-auto px-4 mt-16">
                    {section.people.map((person, pi) => (
                      <div key={pi} className="flex flex-col items-center group pt-16">
                        <div className="relative bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 pt-24 w-full shadow-[0_10px_40px_-10px_rgba(36,27,113,0.15)] border border-white hover:shadow-[0_20px_50px_-10px_rgba(36,27,113,0.25)] transition-all duration-500 hover:-translate-y-2 flex flex-col items-center">
                          {/* Image Popping Out */}
                          <div className="absolute -top-20 w-44 h-44 rounded-full border-[6px] border-white shadow-[0_20px_40px_rgba(36,27,113,0.2)] bg-white group-hover:scale-105 transition-transform duration-500 z-10">
                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 relative">
                              {person.imageUrl ? (
                                <img 
                                  src={person.imageUrl} 
                                  alt={person.name} 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling;
                                    if (fallback) fallback.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 ${person.imageUrl ? 'hidden' : ''}`}>
                                <span className="material-symbols-outlined text-7xl">person</span>
                              </div>
                            </div>
                          </div>

                          <h3 className="text-xl font-black text-[#241b71] text-center px-2 tracking-tight">{person.name}</h3>
                          <div className="w-10 h-[3px] rounded-full bg-gradient-to-r from-[#f50057] to-[#ff4081] my-4 group-hover:w-16 transition-all duration-300"></div>
                          <p className="text-gray-500 font-semibold text-center text-[15px] px-4 leading-snug">{person.post}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : pageContent && title !== 'RTI' ? (
            <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap mb-16">
              {pageContent}
            </div>
          ) : title !== 'RTI' && !(title === 'Election Report' && content.aboutPage?.electionReports && content.aboutPage.electionReports.length > 0) ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-600 mb-16">
              <span className="material-symbols-outlined text-4xl mb-4 text-gray-400">pending</span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
              <p>The content for {title} is currently being updated. Please check back later.</p>
            </div>
          ) : null}

          {title === 'Election Report' && content.aboutPage?.electionReports && content.aboutPage.electionReports.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white mb-16">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#241b71] text-white">
                    <th className="py-4 px-6 text-center w-24 font-bold border-r border-[#3a2e8c]">Sr. No</th>
                    <th className="py-4 px-6 font-bold border-r border-[#3a2e8c]">Report Title</th>
                    <th className="py-4 px-6 font-bold w-48 text-center">Download Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {content.aboutPage.electionReports.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-center text-gray-600 font-medium">{index + 1}</td>
                      <td className="py-4 px-6 text-gray-900">{item.title}</td>
                      <td className="py-4 px-6 text-center">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-[#5a0a8f] font-semibold hover:text-purple-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">description</span>
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {title === 'Executive Board' && (
            <div className="space-y-16">
              {/* Office Bearers Table */}
              {content.aboutPage?.officeBearers && content.aboutPage.officeBearers.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-[#5a0a8f] mb-8 text-center border-b-2 border-gray-100 pb-4">Core Office Bearers</h2>
                  <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#5a0a8f] text-white">
                          <th className="p-4 border-b border-white/20 font-semibold w-48">Details</th>
                          {content.aboutPage.officeBearers.map((b, i) => (
                            <th key={i} className="p-4 border-b border-white/20 font-bold text-center">
                              {b.role}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-4 font-semibold text-gray-700 bg-gray-50 border-r border-gray-200">Name</td>
                          {content.aboutPage.officeBearers.map((b, i) => (
                            <td key={i} className="p-4 text-center font-bold text-gray-900 border-r border-gray-200 last:border-r-0">{b.name || '-'}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-4 font-semibold text-gray-700 bg-gray-50 border-r border-gray-200">Email ID</td>
                          {content.aboutPage.officeBearers.map((b, i) => (
                            <td key={i} className="p-4 text-center text-blue-600 border-r border-gray-200 last:border-r-0 whitespace-pre-line break-words max-w-[200px]">{b.email || '-'}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-4 font-semibold text-gray-700 bg-gray-50 border-r border-gray-200">Mobile</td>
                          {content.aboutPage.officeBearers.map((b, i) => (
                            <td key={i} className="p-4 text-center border-r border-gray-200 last:border-r-0">{b.mobile || '-'}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-4 font-semibold text-gray-700 bg-gray-50 border-r border-gray-200">Tenure till date</td>
                          {content.aboutPage.officeBearers.map((b, i) => (
                            <td key={i} className="p-4 text-center border-r border-gray-200 last:border-r-0">{b.tenure || '-'}</td>
                          ))}
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="p-4 font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 align-top">Address</td>
                          {content.aboutPage.officeBearers.map((b, i) => (
                            <td key={i} className="p-4 text-center text-gray-600 whitespace-pre-line border-r border-gray-200 last:border-r-0 align-top">{b.address || '-'}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Executive Board Members Grid */}
              {content.aboutPage?.executiveBoardMembers && content.aboutPage.executiveBoardMembers.length > 0 && (
                <div className="py-8">
                  <h2 className="text-4xl font-bold text-[#241b71] mb-16 text-center">Executive Board Members</h2>
                  
                  <div className="flex flex-col items-center gap-12">
                    {/* First Row (Top person) */}
                    <div className="flex justify-center w-full">
                      {(() => {
                        const member = content.aboutPage.executiveBoardMembers[0];
                        return (
                          <div className="flex flex-col items-center text-center max-w-sm">
                            <div className="w-56 h-56 rounded-full overflow-hidden mb-6 border-[6px] border-[#e2dcf8] shadow-sm relative group">
                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                              {member.imageUrl ? (
                                <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-6xl text-gray-300">person</span>
                                </div>
                              )}
                            </div>
                            <h4 className="text-xl font-bold text-[#241b71] mb-2">{member.name}</h4>
                            <div className="w-8 h-0.5 bg-[#f50057] mx-auto mb-3"></div>
                            <p className="text-[15px] text-gray-600 font-medium">{member.post}</p>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Subsequent Rows */}
                    {content.aboutPage.executiveBoardMembers.length > 1 && (
                      <div className="flex flex-wrap justify-center gap-16 sm:gap-32 w-full max-w-4xl mx-auto">
                        {content.aboutPage.executiveBoardMembers.slice(1).map((member, i) => (
                          <div key={i + 1} className="flex flex-col items-center text-center max-w-sm">
                            <div className="w-56 h-56 rounded-full overflow-hidden mb-6 border-[6px] border-[#e2dcf8] shadow-sm relative group">
                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                              {member.imageUrl ? (
                                <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-6xl text-gray-300">person</span>
                                </div>
                              )}
                            </div>
                            <h4 className="text-xl font-bold text-[#241b71] mb-2">{member.name}</h4>
                            <div className="w-8 h-0.5 bg-[#f50057] mx-auto mb-3"></div>
                            <p className="text-[15px] text-gray-600 font-medium">{member.post}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other Board Members Table */}
              {content.aboutPage?.otherBoardMemberPositions && content.aboutPage.otherBoardMemberPositions.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-[#5a0a8f] mb-8 text-center border-b-2 border-gray-100 pb-4">Other Board Members (2022 - 2026)</h2>
                  <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200 mx-auto max-w-4xl">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#5a0a8f] text-white">
                          <th className="p-4 border-b border-white/20 font-semibold w-1/2">POSITION</th>
                          <th className="p-4 border-b border-white/20 font-semibold w-1/2">NUMBER</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {content.aboutPage.otherBoardMemberPositions.map((pos, i) => (
                          <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-4 font-bold text-[#5a0a8f] border-r border-gray-200 align-top">
                              {pos.position}
                              {pos.details && (
                                <div className="mt-2 text-gray-600 font-normal whitespace-pre-line text-sm border-t border-gray-200 pt-2">
                                  {pos.details}
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-semibold text-gray-900 align-top text-xl">{pos.number}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Past Office Bearers Table */}
              {content.aboutPage?.pastOfficeBearers && content.aboutPage.pastOfficeBearers.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-[#5a0a8f] mb-8 text-center border-b-2 border-gray-100 pb-4">Officer Bearers Since Formation</h2>
                  <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#5a0a8f] text-white">
                          <th className="p-4 border-b border-white/20 font-semibold w-16 text-center">Sl. No.</th>
                          <th className="p-4 border-b border-white/20 font-semibold w-40">Tenure</th>
                          <th className="p-4 border-b border-white/20 font-semibold w-1/4">President</th>
                          <th className="p-4 border-b border-white/20 font-semibold w-1/4">Secretary General</th>
                          <th className="p-4 border-b border-white/20 font-semibold w-1/4">Treasurer</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-gray-700">
                        {content.aboutPage.pastOfficeBearers.map((bearer, i) => (
                          <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-4 text-center font-bold text-gray-900 border-r border-gray-200 align-top">{bearer.slNo}</td>
                            <td className="p-4 font-bold text-[#5a0a8f] border-r border-gray-200 align-top">{bearer.tenure}</td>
                            <td className="p-4 whitespace-pre-line border-r border-gray-200 align-top leading-relaxed">{bearer.president}</td>
                            <td className="p-4 whitespace-pre-line border-r border-gray-200 align-top leading-relaxed">{bearer.secretaryGeneral}</td>
                            <td className="p-4 whitespace-pre-line align-top leading-relaxed">{bearer.treasurer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {title === 'Member Unit' && (
            <div className="space-y-16">
              {[
                { title: content.aboutPage?.permanentMembersHeading || 'Permanent Members', data: content.aboutPage?.permanentMembers, secTitle: 'General Secretary / Treasurer' },
                { title: content.aboutPage?.associateMembersHeading || 'Associate Members', data: content.aboutPage?.associateMembers, secTitle: 'General Secretary / Treasurer' },
                { title: content.aboutPage?.academyMembersHeading || 'Academy Members', data: content.aboutPage?.academyMembers, secTitle: 'General Secretary' },
                { title: content.aboutPage?.hockeyMembersHeading || 'Hoc-Key Member', data: content.aboutPage?.hockeyMembers, secTitle: 'Secretary' }
              ].map((section, idx) => {
                if (!section.data || section.data.length === 0) return null
                return (
                  <div key={idx}>
                    <h2 className="text-3xl font-bold text-[#5a0a8f] mb-8 text-center border-b-2 border-gray-100 pb-4">{section.title}</h2>
                    <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200">
                      <table className="w-full text-left border-collapse bg-white">
                        <thead>
                          <tr className="bg-[#5a0a8f] text-white">
                            <th className="p-4 border-b border-white/20 font-semibold w-16 text-center">SN</th>
                            <th className="p-4 border-b border-white/20 font-semibold w-1/3">Unit</th>
                            <th className="p-4 border-b border-white/20 font-semibold w-1/4">President</th>
                            <th className="p-4 border-b border-white/20 font-semibold w-1/3">{section.secTitle}</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700">
                          {section.data.map((member, i) => (
                            <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-4 text-center font-bold text-gray-900 border-r border-gray-200 align-top">{member.slNo}</td>
                              <td className="p-4 font-bold text-[#5a0a8f] border-r border-gray-200 align-top whitespace-pre-line">{member.unit}</td>
                              <td className="p-4 whitespace-pre-line border-r border-gray-200 align-top leading-relaxed">{member.president}</td>
                              <td className="p-4 whitespace-pre-line align-top leading-relaxed">{member.secretary}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {title === 'RTI' && (
            <div className="space-y-16">
              {content.aboutPage?.rtiExecutiveBoard && content.aboutPage.rtiExecutiveBoard.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-[#5a0a8f] mb-8 text-center border-b-2 border-gray-100 pb-4">Executive Board</h2>
                  <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200 mx-auto max-w-3xl">
                    <table className="w-full text-left border-collapse bg-white">
                      <tbody className="text-sm text-gray-700">
                        {content.aboutPage.rtiExecutiveBoard.map((item, i) => (
                          <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-4 font-bold text-gray-900 border-r border-gray-200 w-2/3">{item.role}</td>
                            <td className="p-4 text-[#5a0a8f] font-semibold text-center">{item.number}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {content.aboutPage?.rtiOfficers && content.aboutPage.rtiOfficers.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-[#5a0a8f] mb-8 text-center border-b-2 border-gray-100 pb-4">Officers and Employees</h2>
                  <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200 mx-auto max-w-4xl">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#5a0a8f] text-white">
                          <th className="p-4 border-b border-white/20 font-semibold w-1/3">Name</th>
                          <th className="p-4 border-b border-white/20 font-semibold w-2/3">Designation</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-gray-700">
                        {content.aboutPage.rtiOfficers.map((officer, i) => (
                          <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-4 font-bold text-gray-900 border-r border-gray-200">{officer.name}</td>
                            <td className="p-4 text-[#5a0a8f]">{officer.designation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
