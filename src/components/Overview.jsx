import { useMemo } from 'react';
import { getAllScheduledGames } from '../data/tournamentData';

const SCHEDULE_CONFIG = {
  startHour: 8,
  startMinute: 0,
  matchMinutes: 15, // thời gian thi đấu 1 trận
  breakMinutes: 3, // nghỉ giữa các trận
  totalRounds: 11, // 11 vòng để bù slot sân 5 bị khóa 9–10h
};

const ROLE_LABELS = {
  chuLuc: 'Chủ lực',
  tb1: 'TB1',
  tb2: 'TB2',
  phongTrao: 'Phong trào',
  nu: 'Nữ',
};

const PAIR_PLAYERS = {
  pair1: ['chuLuc', 'tb1'],
  pair2: ['tb1', 'tb2'],
  pair3: ['tb2', 'nu'],
  pair4: ['nu', 'phongTrao'],
  pair5: ['phongTrao', 'chuLuc'],
};

const TEAM_COLORS = {
  team1: 'team-color-1',
  team2: 'team-color-2',
  team3: 'team-color-3',
  team4: 'team-color-4',
};

function getRoundTime(round) {
  const baseMin = SCHEDULE_CONFIG.startHour * 60 + SCHEDULE_CONFIG.startMinute;
  const slot = SCHEDULE_CONFIG.matchMinutes + SCHEDULE_CONFIG.breakMinutes; // 18 phút / vòng
  const startTotal = baseMin + round * slot;
  const endTotal = startTotal + SCHEDULE_CONFIG.matchMinutes; // chỉ tính 15 phút thi đấu
  const pad = (n) => String(n).padStart(2, '0');
  const sh = Math.floor(startTotal / 60);
  const sm = startTotal % 60;
  const eh = Math.floor(endTotal / 60);
  const em = endTotal % 60;
  return `${pad(sh)}:${pad(sm)} - ${pad(eh)}:${pad(em)}`;
}

export default function Overview({ teams, matches }) {
  const games = useMemo(() => getAllScheduledGames(matches), [matches]);
  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t])),
    [teams],
  );

  const rounds = useMemo(() => {
    const byRound = {};
    games.forEach((g) => {
      if (!byRound[g.round]) byRound[g.round] = [];
      byRound[g.round].push(g);
    });
    return Object.keys(byRound)
      .map(Number)
      .sort((a, b) => a - b)
      .map((r) => ({
        round: r,
        games: byRound[r].sort((a, b) =>
          a.court !== b.court ? a.court - b.court : a.gameIndex - b.gameIndex,
        ),
      }));
  }, [games]);

  const playerRounds = useMemo(() => {
    const map = {};
    games.forEach((g) => {
      const pairRoles = PAIR_PLAYERS[g.pairId] || [];
      const t1 = teamMap[g.team1Id];
      const t2 = teamMap[g.team2Id];
      pairRoles.forEach((role) => {
        const n1 = t1?.members?.[role];
        const n2 = t2?.members?.[role];
        if (n1) {
          if (!map[n1]) map[n1] = { teamId: t1.id, rounds: new Set() };
          map[n1].rounds.add(g.round + 1);
        }
        if (n2) {
          if (!map[n2]) map[n2] = { teamId: t2.id, rounds: new Set() };
          map[n2].rounds.add(g.round + 1);
        }
      });
    });
    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        teamId: data.teamId,
        rounds: Array.from(data.rounds).sort((a, b) => a - b),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [games, teams]);

  return (
    <div className="overview-view">
      <h2>Thông tin giải & giờ thi đấu</h2>
      <p className="subtitle">
        FSS18 - Giải picker ball • 4 team • 5 loại cặp • 11 vòng • 3 sân (5, 6, 7, sân 5 nghỉ 9–10h)
      </p>

      <section className="overview-section">
        <h3>Thành viên từng team</h3>
        <div className="overview-table-wrapper">
          <table className="overview-table">
            <thead>
              <tr>
                <th>Vị trí</th>
                {teams.map((t) => (
                  <th
                    key={t.id}
                    className={TEAM_COLORS[t.id] || 'team-color-1'}
                  >
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <tr key={key}>
                  <td>{label}</td>
                  {teams.map((t) => (
                    <td key={t.id}>
                      {t.members?.[key] ? (
                        <span className={TEAM_COLORS[t.id] || 'team-color-1'}>
                          {t.members[key]}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overview-section">
        <h3>Lịch thi đấu theo vòng (kèm giờ dự kiến)</h3>
        <p className="subtitle small">
          Mỗi vòng 15 phút thi đấu + 3 phút nghỉ (18 phút/vòng), bắt đầu từ 08:00. Sân 5, 6,
          7 được ánh xạ lần lượt từ Court 1, 2, 3.
        </p>
        {rounds.map(({ round, games: roundGames }) => (
          <div key={round} className="round-block">
            <h4>
              Vòng {round + 1}{' '}
              <span className="round-time-inline">{getRoundTime(round)}</span>
            </h4>
            <div className="courts-row overview-courts-row">
              {[1, 2, 3].map((court) => {
                const courtGames = roundGames.filter((g) => g.court === court);
                if (courtGames.length === 0) return null;
                const courtNum = court === 1 ? 5 : court === 2 ? 6 : 7;
                return (
                  <div key={court} className="court-card">
                    <div className="court-label">Sân {courtNum}</div>
                    {courtGames.map((g) => (
                      <div
                        key={`${g.matchId}-${g.gameIndex}`}
                        className="game-card overview-game-card"
                      >
                        <div className="pair-type">{g.pairLabel}</div>
                        <div className="teams">
                          <span className={TEAM_COLORS[g.team1Id] || 'team-color-1'}>
                            {teamMap[g.team1Id]?.name}
                          </span>{' '}
                          vs{' '}
                          <span className={TEAM_COLORS[g.team2Id] || 'team-color-2'}>
                            {teamMap[g.team2Id]?.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="overview-section">
        <h3>Lịch thi đấu theo từng người</h3>
        <div className="overview-table-wrapper">
          <table className="overview-table">
            <thead>
              <tr>
                <th>Người chơi</th>
                <th>Vòng thi đấu</th>
              </tr>
            </thead>
            <tbody>
              {playerRounds.map((p) => (
                <tr key={p.name}>
                  <td>
                    <span className={TEAM_COLORS[p.teamId] || 'team-color-1'}>
                      {p.name}
                    </span>
                  </td>
                  <td>Vòng {p.rounds.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

