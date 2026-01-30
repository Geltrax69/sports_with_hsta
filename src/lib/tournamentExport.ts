/**
 * Utilities for exporting tournament schedules
 * Supports exporting to Excel, CSV, and JSON formats
 */

export interface ScheduleExportData {
  tournament: string;
  format: string;
  teamCount: number;
  teams: string[];
  matches: Array<{
    round: number;
    matchNumber: number;
    team1: string;
    team2: string;
    bracketType: string;
  }>;
}

/**
 * Generate CSV content for tournament schedule
 */
export function generateCSV(data: ScheduleExportData): string {
  let csv = '';

  // Header
  csv += 'Tournament Schedule Export\n';
  csv += `Tournament,${data.tournament}\n`;
  csv += `Format,${data.format}\n`;
  csv += `Teams,${data.teamCount}\n`;
  csv += `Generated,${new Date().toLocaleString()}\n\n`;

  // Team List
  csv += 'Teams\n';
  data.teams.forEach(team => {
    csv += `${team}\n`;
  });
  csv += '\n';

  // Match Schedule
  csv += 'Match Schedule\n';
  csv += 'Round,Match #,Team 1,VS,Team 2,Bracket Type,Result\n';
  data.matches.forEach(match => {
    csv += `${match.round},${match.matchNumber},"${match.team1}",VS,"${match.team2}",${match.bracketType},\n`;
  });

  return csv;
}

/**
 * Generate Excel-like HTML table for tournament schedule
 */
export function generateExcelHTML(data: ScheduleExportData): string {
  let html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { color: #5a0a8f; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th { background-color: #5a0a8f; color: white; padding: 10px; text-align: left; border: 1px solid #333; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .header-section { background-color: #e6e6e6; padding: 10px; margin-bottom: 10px; }
          .info-row { display: flex; gap: 20px; margin-bottom: 10px; }
          .info-item { flex: 1; }
          .team-list { columns: 2; }
        </style>
      </head>
      <body>
        <h1>Tournament Schedule - ${data.tournament}</h1>
        
        <div class="header-section">
          <div class="info-row">
            <div class="info-item"><strong>Format:</strong> ${data.format}</div>
            <div class="info-item"><strong>Total Teams:</strong> ${data.teamCount}</div>
            <div class="info-item"><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
        </div>

        <h2>Teams</h2>
        <div class="team-list">
          ${data.teams.map(team => `<div>• ${team}</div>`).join('')}
        </div>

        <h2>Match Schedule</h2>
        <table>
          <thead>
            <tr>
              <th>Round</th>
              <th>Match #</th>
              <th>Team 1</th>
              <th>VS</th>
              <th>Team 2</th>
              <th>Bracket Type</th>
              <th>Result/Score</th>
            </tr>
          </thead>
          <tbody>
            ${data.matches
              .map(
                match => `
              <tr>
                <td>${match.round}</td>
                <td>${match.matchNumber}</td>
                <td>${match.team1}</td>
                <td>VS</td>
                <td>${match.team2}</td>
                <td>${match.bracketType}</td>
                <td></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <p style="color: #999; font-size: 12px;">
          This document was auto-generated. You can manually fill in results as matches are played.
        </p>
      </body>
    </html>
  `;

  return html;
}

/**
 * Download schedule as CSV file
 */
export function downloadAsCSV(data: ScheduleExportData, filename: string = 'tournament-schedule.csv'): void {
  const csv = generateCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/**
 * Download schedule as HTML/Excel file
 */
export function downloadAsHTML(data: ScheduleExportData, filename: string = 'tournament-schedule.html'): void {
  const html = generateExcelHTML(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/**
 * Download schedule as JSON file
 */
export function downloadAsJSON(data: ScheduleExportData, filename: string = 'tournament-schedule.json'): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/**
 * Copy schedule to clipboard as text
 */
export function copyToClipboard(data: ScheduleExportData): Promise<void> {
  const text = `
Tournament Schedule: ${data.tournament}
Format: ${data.format}
Teams: ${data.teamCount}
Generated: ${new Date().toLocaleString()}

Teams:
${data.teams.map(t => `• ${t}`).join('\n')}

Matches:
${data.matches
  .map(
    m =>
      `Round ${m.round}, Match ${m.matchNumber}: ${m.team1} vs ${m.team2} (${m.bracketType})`
  )
  .join('\n')}
  `;

  return navigator.clipboard.writeText(text);
}
