
  const isRegistered = (userId: string, type: string) =>
    registrations.some((r) => r.userId === userId && r.registerAs === type)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/admin/tournaments" className="text-[#5a0a8f] hover:underline text-sm font-medium flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Tournaments
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900">{tournament.title}</h1>
              <p className="text-gray-600 mt-1">
                {tournament.venueName && `${tournament.venueName} · `}
                {eventTypeLabel(matchEventType)} · {tournament.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setIsQuickRegModalOpen(true)} className="px-4 py-2 bg-white border-2 border-[#5a0a8f] text-[#5a0a8f] rounded-lg font-bold hover:bg-purple-50">Quick Registration</button>
              <button type="button" onClick={startCreateMatch} className="px-4 py-2 bg-[#5a0a8f] text-white rounded-lg font-bold hover:bg-[#4a087a]">Create Match</button>
              <button type="button" onClick={handleDownloadSchedulePdf} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900">Download Schedule PDF</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-800' },
            { label: 'Pending', value: stats.pending, color: 'bg-amber-100 text-amber-800' },
            { label: 'Approved', value: stats.approved, color: 'bg-green-100 text-green-800' },
            { label: 'Rejected', value: stats.rejected, color: 'bg-red-100 text-red-800' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <p className="text-sm font-semibold opacity-80">{s.label}</p>
              <p className="text-2xl font-black">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['registrations', 'matches', 'winners'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-bold capitalize border-b-2 -mb-px ${
                activeTab === tab ? 'border-[#5a0a8f] text-[#5a0a8f]' : 'border-transparent text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>}

        {activeTab === 'registrations' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
                <option value="all">All types</option>
                <option value="player">Players</option>
                <option value="coach">Coaches</option>
                <option value="referee">Referees</option>
              </select>
            </div>
            {loading ? (
              <p className="text-gray-500">Loading registrations...</p>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold">Name</th>
                      <th className="text-left px-4 py-3 font-bold">ID</th>
                      <th className="text-left px-4 py-3 font-bold">Type</th>
                      <th className="text-left px-4 py-3 font-bold">District</th>
                      <th className="text-left px-4 py-3 font-bold">Status</th>
                      <th className="text-right px-4 py-3 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((r) => (
                      <tr key={r._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{r.applicant?.fullName || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{r.applicant?.playerId || r.userId}</td>
                        <td className="px-4 py-3 capitalize">{r.registerAs}</td>
                        <td className="px-4 py-3">{r.applicant?.district || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'approved' ? 'bg-green-100 text-green-800' : r.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {r.status === 'pending' && (
                            <>
                              <button type="button" onClick={() => handleApprove(r._id)} className="text-green-600 font-bold hover:underline">Approve</button>
                              <button type="button" onClick={() => handleReject(r._id)} className="text-red-600 font-bold hover:underline">Reject</button>
                            </>
                          )}
                          <button type="button" onClick={() => handleDeleteRegistration(r._id)} className="text-gray-500 hover:text-red-600 font-bold">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRegistrations.length === 0 && <p className="p-8 text-center text-gray-500">No registrations found.</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <p className="text-gray-500">No matches yet. Create a match to get started.</p>
            ) : (
              matches.map((match) => (
                <div key={match._id} className="bg-white rounded-xl border p-4 flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-bold text-lg">{match.team1} vs {match.team2}</p>
                    <p className="text-sm text-gray-600">{match.date} {match.time} · {match.status || 'scheduled'}{match.description && ` · ${match.description}`}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setSelectedMatchForScore(match); setIsScoreModalOpen(true) }} className="px-3 py-1.5 bg-[#5a0a8f] text-white rounded-lg text-sm font-bold">Update Score</button>
                    <button type="button" onClick={() => openScorecardDownload(match)} className="px-3 py-1.5 border-2 border-[#5a0a8f] text-[#5a0a8f] rounded-lg text-sm font-bold">Score Card</button>
                    <button type="button" onClick={() => handleDeleteMatch(match._id, match.team1, match.team2)} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm font-bold">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'winners' && (
          <div className="space-y-6">
            {renderWinnerPlace('first', '1st Place', 'p-6 rounded-xl border-2 border-yellow-200 bg-yellow-50/40', 'bg-yellow-500')}
            {renderWinnerPlace('second', '2nd Place', 'p-6 rounded-xl border-2 border-gray-200 bg-gray-50', 'bg-gray-500')}
            {renderWinnerPlace('third', '3rd Place', 'p-6 rounded-xl border-2 border-orange-200 bg-orange-50/40', 'bg-orange-600')}
            <button type="button" onClick={handleSaveWinners} disabled={savingWinners} className="px-6 py-3 bg-[#5a0a8f] text-white rounded-xl font-bold disabled:opacity-60">{savingWinners ? 'Saving…' : 'Save Winners'}</button>
          </div>
        )}
      </div>

      <UpdateScoreModal isOpen={isScoreModalOpen} onClose={() => { setIsScoreModalOpen(false); setSelectedMatchForScore(null); if (tournamentId) fetchMatches(tournamentId) }} preSelectedTournamentId={tournamentId} preSelectedMatch={selectedMatchForScore || undefined} />
      <ScorecardRemarksModal isOpen={scorecardRemarksOpen} matchLabel={scorecardRemarksMatch ? `${scorecardRemarksMatch.team1} vs ${scorecardRemarksMatch.team2}` : undefined} remarks={scorecardRemarksText} downloading={downloadingScorecard} onRemarksChange={setScorecardRemarksText} onDownload={() => downloadScorecardPdf(scorecardRemarksText)} onClose={() => { if (!downloadingScorecard) { setScorecardRemarksOpen(false); setScorecardRemarksMatch(null) } }} />

      {isQuickRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-[#5a0a8f] text-white p-5 flex justify-between items-center">
              <h2 className="text-xl font-black">Quick Registration</h2>
              <button type="button" onClick={resetQuickRegModal} className="text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">District</label>
                <select value={quickRegDistrict} onChange={(e) => handleQuickRegDistrictChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select district</option>
                  {districts.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div className="flex gap-2">
                {(['player', 'coach', 'referee'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => { setQuickRegType(t); if (quickRegDistrict) handleQuickRegDistrictChange(quickRegDistrict) }} className={`px-3 py-1.5 rounded-lg text-sm font-bold capitalize ${quickRegType === t ? 'bg-[#5a0a8f] text-white' : 'bg-gray-100 text-gray-700'}`}>{t}</button>
                ))}
              </div>
              <input type="text" placeholder="Filter by name (optional)..." value={quickRegSearch} onChange={(e) => handleQuickRegSearch(e.target.value)} disabled={!quickRegDistrict} className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100" />
              {quickRegSuccessMsg && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">{quickRegSuccessMsg}</div>}
              {quickRegLoading ? <p className="text-gray-500 text-sm">Loading...</p> : !quickRegDistrict ? <p className="text-gray-500 text-sm">Select a district to see people.</p> : quickRegResults.length === 0 ? <p className="text-gray-500 text-sm">No {quickRegType}s found for this district.</p> : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {quickRegResults.map((person: { _id: string; fullName: string; playerId?: string }) => {
                    const already = isRegistered(person._id, quickRegType)
                    return (
                      <div key={person._id} className="flex justify-between items-center border rounded-lg p-3">
                        <div>
                          <p className="font-bold text-gray-900">{person.fullName}</p>
                          <p className="text-xs text-gray-500">{person.playerId || person._id}</p>
                        </div>
                        {already ? <span className="text-green-600 text-sm font-bold">Registered</span> : (
                          <button type="button" onClick={() => handleQuickRegister(person._id, person.fullName)} className="px-3 py-1 bg-[#5a0a8f] text-white rounded-lg text-sm font-bold">Register</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
