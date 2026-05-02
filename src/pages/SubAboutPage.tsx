import { useWebsiteContent, type AboutPageSettings } from '../context/WebsiteContentContext'

export function SubAboutPage({ title }: { title: string }) {
  const { content } = useWebsiteContent()

  const fieldMapping: Record<string, keyof AboutPageSettings> = {
    'Executive Board': 'executiveBoardText',
    'Member Unit': 'memberUnitText',
    'RTI': 'rtiText',
    'Annual Report': 'annualReportText',
    'Election Report': 'electionReportText',
  }

  const field = fieldMapping[title]
  const pageContent = (field && content.aboutPage?.[field]) as string | undefined

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

      <section className="py-16 md:py-24 bg-white min-h-[40vh]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {pageContent ? (
            <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap mb-16">
              {pageContent}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-600 mb-16">
              <span className="material-symbols-outlined text-4xl mb-4 text-gray-400">pending</span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
              <p>The content for {title} is currently being updated. Please check back later.</p>
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
                <div>
                  <h2 className="text-3xl font-bold text-[#5a0a8f] mb-8 text-center border-b-2 border-gray-100 pb-4">Executive Board Members</h2>
                  <div className="grid justify-center grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {content.aboutPage.executiveBoardMembers.map((member, i) => (
                      <div key={i} className="group relative flex w-full max-w-xs flex-col overflow-hidden rounded-xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl bg-white border border-gray-100">
                        <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          {member.imageUrl ? (
                            <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <span className="material-symbols-outlined text-6xl text-gray-300">person</span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-5 bg-[#5a0a8f] text-center border-t-[6px] border-orange-500 z-20">
                          <h4 className="text-lg font-bold text-white mb-1">{member.name}</h4>
                          <p className="text-xs font-semibold text-orange-300 uppercase tracking-wider">{member.post}</p>
                        </div>
                      </div>
                    ))}
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
                { title: 'Permanent Members', data: content.aboutPage?.permanentMembers, secTitle: 'General Secretary / Treasurer' },
                { title: 'Associate Members', data: content.aboutPage?.associateMembers, secTitle: 'General Secretary / Treasurer' },
                { title: 'Academy Members', data: content.aboutPage?.academyMembers, secTitle: 'General Secretary' },
                { title: 'Hoc-Key Member', data: content.aboutPage?.hockeyMembers, secTitle: 'Secretary' }
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
        </div>
      </section>
    </main>
  )
}
