import { getAllScheduledGames, getPairMembers } from '../data/tournamentData';

const SCHEDULE_CONFIG = {
  startHour: 8,
  startMinute: 0,
  matchMinutes: 15, // thời gian thi đấu 1 trận
  breakMinutes: 3, // nghỉ giữa các trận
  totalRounds: 11, // 11 vòng để bù slot sân 5 bị khóa 9–10h
};

function getRoundTime(round) {
  const base = SCHEDULE_CONFIG.startHour * 60 + SCHEDULE_CONFIG.startMinute;
  const slot = SCHEDULE_CONFIG.matchMinutes + SCHEDULE_CONFIG.breakMinutes; // 18 phút / vòng
  const startTotal = base + round * slot;
  const endTotal = startTotal + SCHEDULE_CONFIG.matchMinutes; // chỉ tính 15 phút thi đấu
  const pad = (n) => String(n).padStart(2, '0');
  const sh = Math.floor(startTotal / 60);
  const sm = startTotal % 60;
  const eh = Math.floor(endTotal / 60);
  const em = endTotal % 60;
  // Hiển thị khung giờ thi đấu (15') – nghỉ 3' đã tính trong khoảng giữa các vòng
  return `${pad(sh)}:${pad(sm)} - ${pad(eh)}:${pad(em)}`;
}

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
}

const COURT_DISPLAY = { 1: 5, 2: 6, 3: 7 };

const TEAM_COLORS = {
  team1: 'team-color-1',
  team2: 'team-color-2',
  team3: 'team-color-3',
  team4: 'team-color-4',
};

export default function Schedule({ teams, matches }) {
  const games = getAllScheduledGames(matches);
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

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
      <h2>Kết quả thi đấu</h2>
      <p className="subtitle schedule-date">
        Dự kiến {getTomorrowDate()} từ 08:00 • Sân 5, 6, 7 • 11 vòng, mỗi vòng 15 phút thi đấu + 3 phút nghỉ (sân 5
        nghỉ 9–10h)
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
              const courtNum = COURT_DISPLAY[court] || court;
              const firstGame = courtGames[0];
              const t1Name = firstGame ? teamMap[firstGame.team1Id]?.name || '' : '';
              const t2Name = firstGame ? teamMap[firstGame.team2Id]?.name || '' : '';
              return (
                <div key={court} className="court-card">
                  <div className="court-label">
                    {firstGame ? (
                      <>Sân {courtNum} - <span className={TEAM_COLORS[firstGame.team1Id] || 'team-color-1'}>{t1Name}</span> vs <span className={TEAM_COLORS[firstGame.team2Id] || 'team-color-2'}>{t2Name}</span></>
                    ) : (
                      <>Sân {courtNum}</>
                    )}
                  </div>
                  {courtGames.map((g) => {
                    const t1 = teamMap[g.team1Id];
                    const t2 = teamMap[g.team2Id];
                    const m1 = getPairMembers(t1, g.pairId);
                    const m2 = getPairMembers(t2, g.pairId);
                    return (
                    <div key={`${g.matchId}-${g.gameIndex}`} className="game-card">
                      <div className="pair-type">{g.pairLabel}</div>
                      <div className="teams members-row">
                        {m1 && m2 ? (
                          <>
                            <span className={`members ${TEAM_COLORS[g.team1Id] || 'team-color-1'}`}>{m1}</span>
                            <span className="members-vs"> vs </span>
                            <span className={`members ${TEAM_COLORS[g.team2Id] || 'team-color-2'}`}>{m2}</span>
                          </>
                        ) : (
                          <span className="members">—</span>
                        )}
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
                  );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
