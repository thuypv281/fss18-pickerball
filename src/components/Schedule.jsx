import { getAllScheduledGames } from '../data/tournamentData';

const SCHEDULE_CONFIG = {
  startHour: 8,
  startMinute: 0,
  matchMinutes: 15,
  breakMinutes: 3,
};

function getRoundTime(round) {
  const totalMinutes = SCHEDULE_CONFIG.startHour * 60 + SCHEDULE_CONFIG.startMinute
    + round * (SCHEDULE_CONFIG.matchMinutes + SCHEDULE_CONFIG.breakMinutes);
  const startM = totalMinutes % 60;
  const startH = Math.floor(totalMinutes / 60) % 24;
  const endM = (totalMinutes + SCHEDULE_CONFIG.matchMinutes) % 60;
  const endH = Math.floor((totalMinutes + SCHEDULE_CONFIG.matchMinutes) / 60) % 24;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(startH)}:${pad(startM)} - ${pad(endH)}:${pad(endM)}`;
}

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function Schedule({ teams, matches }) {
  const games = getAllScheduledGames(matches);
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const byRound = {};
  games.forEach((g) => {
    if (!byRound[g.round]) byRound[g.round] = [];
    byRound[g.round].push(g);
  });
  const rounds = Object.keys(byRound)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="schedule-view">
      <h2>Lịch thi đấu</h2>
      <p className="subtitle schedule-date">
        Dự kiến {getTomorrowDate()} lúc 08:00 • 3 sân • Mỗi trận 15 phút, nghỉ giữa vòng 3 phút
      </p>

      {rounds.map((round) => (
        <div key={round} className="round-block">
          <h3>
            Vòng {round + 1}
            <span className="round-time">{getRoundTime(round)}</span>
          </h3>
          <div className="courts-row">
            {[1, 2, 3].map((court) => {
              const courtGames = byRound[round].filter((g) => g.court === court);
              return (
                <div key={court} className="court-card">
                  <div className="court-label">Sân {court}</div>
                  {courtGames.map((g) => (
                    <div key={`${g.matchId}-${g.gameIndex}`} className="game-card">
                      <div className="pair-type">{g.pairLabel}</div>
                      <div className="teams">
                        {teamMap[g.team1Id]} vs {teamMap[g.team2Id]}
                      </div>
                      <div className="score-row">
                        {g.team1Score != null && g.team2Score != null ? (
                          <span className="score">
                            {g.team1Score} - {g.team2Score}
                          </span>
                        ) : (
                          <span className="pending">Chưa thi đấu</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
