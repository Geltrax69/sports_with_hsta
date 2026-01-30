/**
 * Tournament wadwdaBracket Visualizer Component
 * Displays tournament brackets in visual format similar to professional sports brackets
 */

import React from 'react';

export interface BracketMatch {
  matchId: string;
  team1: string;
  team2: string;
  bracket: 'winner' | 'loser';
  description: string;
}

export interface BracketRound {
  day: number;
  matches: BracketMatch[];
}

interface TournamentBracketVisualizerProps {
  rounds: BracketRound[];
  bracketType: 'single-elimination' | 'double-elimination' | 'round-robin' | 'custom';
  teamCount: number;
}

export const TournamentBracketVisualizer: React.FC<TournamentBracketVisualizerProps> = ({
  rounds,
  bracketType,
  teamCount,
}) => {
  // Calculate bracket width based on number of rounds
  const roundCount = Math.max(rounds.length, 1);
  const bracketWidth = roundCount * 250 + 100;

  return (
    <div className="w-full overflow-x-auto bg-gradient-to-b from-gray-900 to-gray-800 p-8 rounded-xl border-2 border-purple-400">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-white mb-2">🏆 Tournament Bracket</h2>
        <p className="text-purple-200 text-sm">
          {teamCount} Teams • {bracketType.replace('-', ' ').toUpperCase()} Format
        </p>
      </div>

      {/* Bracket Container */}
      <div className="relative" style={{ minWidth: `${bracketWidth}px` }}>
        {/* Single Elimination / Knockout Bracket */}
        {(bracketType === 'single-elimination' || bracketType === 'round-robin') && (
          <div className="flex gap-12 justify-between">
            {rounds.map((round) => (
              <div key={round.day} className="flex flex-col justify-center gap-8">
                {/* Round Title */}
                <div className="text-center mb-4">
                  <span className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                    Round {round.day}
                  </span>
                </div>

                {/* Matches in Round */}
                {round.matches.map((match) => (
                  <div
                    key={match.matchId}
                    className="bg-white rounded-lg border-2 border-purple-400 overflow-hidden shadow-lg min-w-[200px]"
                  >
                    {/* Match Container */}
                    <div className="p-4">
                      {/* Team 1 */}
                      <div className="bg-blue-50 border-2 border-blue-300 rounded px-3 py-2 mb-2">
                        <div className="font-bold text-gray-800 text-sm truncate">
                          {match.team1}
                        </div>
                        <div className="text-xs text-gray-600 text-right">Score: _</div>
                      </div>

                      {/* VS Divider */}
                      <div className="text-center py-1 font-black text-purple-600">VS</div>

                      {/* Team 2 */}
                      <div className="bg-orange-50 border-2 border-orange-300 rounded px-3 py-2">
                        <div className="font-bold text-gray-800 text-sm truncate">
                          {match.team2}
                        </div>
                        <div className="text-xs text-gray-600 text-right">Score: _</div>
                      </div>

                      {/* Match ID */}
                      <div className="text-xs text-gray-500 text-center mt-2 pt-2 border-t">
                        {match.matchId}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Winner Position */}
            <div className="flex flex-col justify-center items-center">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full p-8 shadow-xl border-4 border-yellow-600">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="font-black text-yellow-900 text-sm">CHAMPION</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Double Elimination Bracket */}
        {bracketType === 'double-elimination' && (
          <div className="space-y-12">
            {/* Winners Bracket */}
            <div>
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                <span className="bg-blue-600 px-3 py-1 rounded">🏆 Winners Bracket</span>
              </h3>
              <div className="flex gap-12 justify-between">
                {rounds.filter(r => r.matches.some(m => m.bracket === 'winner')).map((round) => (
                  <div key={round.day} className="flex flex-col justify-center gap-8">
                    <div className="text-center">
                      <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded font-bold text-xs">
                        R{round.day}
                      </span>
                    </div>
                    {round.matches
                      .filter(m => m.bracket === 'winner')
                      .map((match) => (
                        <div
                          key={match.matchId}
                          className="bg-blue-100 rounded-lg border-2 border-blue-400 overflow-hidden min-w-[180px]"
                        >
                          <div className="p-3">
                            <div className="bg-blue-50 border border-blue-300 rounded px-2 py-1 mb-1 text-xs font-bold text-gray-800 truncate">
                              {match.team1}
                            </div>
                            <div className="text-center text-xs font-black text-blue-600 py-1">VS</div>
                            <div className="bg-blue-50 border border-blue-300 rounded px-2 py-1 text-xs font-bold text-gray-800 truncate">
                              {match.team2}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Losers Bracket */}
            <div>
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                <span className="bg-orange-600 px-3 py-1 rounded">🔻 Losers Bracket</span>
              </h3>
              <div className="flex gap-12 justify-between">
                {rounds.filter(r => r.matches.some(m => m.bracket === 'loser')).map((round) => (
                  <div key={round.day} className="flex flex-col justify-center gap-8">
                    <div className="text-center">
                      <span className="inline-block bg-orange-600 text-white px-3 py-1 rounded font-bold text-xs">
                        R{round.day}
                      </span>
                    </div>
                    {round.matches
                      .filter(m => m.bracket === 'loser')
                      .map((match) => (
                        <div
                          key={match.matchId}
                          className="bg-orange-100 rounded-lg border-2 border-orange-400 overflow-hidden min-w-[180px]"
                        >
                          <div className="p-3">
                            <div className="bg-orange-50 border border-orange-300 rounded px-2 py-1 mb-1 text-xs font-bold text-gray-800 truncate">
                              {match.team1}
                            </div>
                            <div className="text-center text-xs font-black text-orange-600 py-1">VS</div>
                            <div className="bg-orange-50 border border-orange-300 rounded px-2 py-1 text-xs font-bold text-gray-800 truncate">
                              {match.team2}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Grand Final */}
            <div className="flex justify-center">
              <div className="bg-yellow-100 border-4 border-yellow-400 rounded-lg p-6 min-w-[200px]">
                <div className="text-center">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="font-black text-yellow-900">GRAND FINAL</div>
                  <div className="text-xs text-yellow-800 mt-2">WB Champion vs LB Champion</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t-2 border-purple-400">
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded border border-blue-600"></div>
            <span className="text-xs text-purple-100">Winner Bracket</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-400 rounded border border-orange-600"></div>
            <span className="text-xs text-purple-100">Loser Bracket</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded border border-yellow-600"></div>
            <span className="text-xs text-purple-100">Final</span>
          </div>
        </div>
      </div>
    </div>
  );
};
