import { useMemo } from 'react';
import { getAllScheduledGames, PAIR_TYPES } from '../data/tournamentData';

const TEAM_COLORS = {
  team1: 'team-color-1',
  team2: 'team-color-2',
  team3: 'team-color-3',
  team4: 'team-color-4',
};

export default function Statistics({ teams, matches }) {
  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t])),
    [teams],
  );

  const allGames = useMemo(
    () => getAllScheduledGames(matches).filter(
      (g) => g.team1Score != null && g.team2Score != null,
    ),
    [matches],
  );

  // 1. Tổng quan giải
  const overview = useMemo(() => {
    const totalSets = allGames.length;
    const totalPoints = allGames.reduce(
      (acc, g) => acc + g.team1Score + g.team2Score,
      0,
    );
    const closeSets = allGames.filter(
      (g) => Math.abs(g.team1Score - g.team2Score) <= 2,
    ).length;
    return {
      totalSets,
      totalPoints,
      avgPerSet: totalSets ? Math.round((totalPoints / totalSets) * 10) / 10 : 0,
      closeSets,
    };
  }, [allGames]);

  // 2. Đối đầu từng cặp đội (set thắng - set thua)
  const headToHead = useMemo(() => {
    const h2h = {};
    matches.forEach((m) => {
      const key = [m.team1Id, m.team2Id].sort().join('-');
      let t1Sets = 0;
      let t2Sets = 0;
      m.games.forEach((g) => {
        if (g.team1Score != null && g.team2Score != null) {
          if (g.team1Score > g.team2Score) t1Sets++;
          else if (g.team2Score > g.team1Score) t2Sets++;
        }
      });
      if (!h2h[key]) h2h[key] = { team1Id: m.team1Id, team2Id: m.team2Id, t1Sets: 0, t2Sets: 0 };
      h2h[key].t1Sets += t1Sets;
      h2h[key].t2Sets += t2Sets;
    });
    return Object.values(h2h);
  }, [matches]);

  // 3. Theo loại cặp: đội nào thắng nhiều set nhất
  const byPairType = useMemo(() => {
    return PAIR_TYPES.map((pair) => {
      const byTeam = { team1: 0, team2: 0, team3: 0, team4: 0 };
      allGames.forEach((g) => {
        if (g.pairId !== pair.id) return;
        if (g.team1Score > g.team2Score) byTeam[g.team1Id] = (byTeam[g.team1Id] || 0) + 1;
        else if (g.team2Score > g.team1Score) byTeam[g.team2Id] = (byTeam[g.team2Id] || 0) + 1;
      });
      const sorted = Object.entries(byTeam)
        .filter(([, w]) => w > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([teamId, wins]) => ({ teamId, wins, name: teamMap[teamId]?.name }));
      return { pair, stats: sorted };
    });
  }, [allGames, teamMap]);

  // 4. Trận/set kịch tính (chênh lệch ≤ 2 điểm)
  const closeGames = useMemo(() => {
    return [...allGames]
      .filter((g) => Math.abs(g.team1Score - g.team2Score) <= 2)
      .sort((a, b) => {
        const diffA = Math.abs(a.team1Score - a.team2Score);
        const diffB = Math.abs(b.team1Score - b.team2Score);
        return diffA - diffB || (b.team1Score + b.team2Score) - (a.team1Score + a.team2Score);
      })
      .slice(0, 10);
  }, [allGames]);

  // 5. Thống kê theo cá nhân (mỗi cầu thủ: set đấu, thắng/thua, điểm)
  const playerStats = useMemo(() => {
    const byPlayer = {};
    allGames.forEach((g) => {
      const pair = PAIR_TYPES.find((p) => p.id === g.pairId);
      if (!pair) return;
      const t1 = teamMap[g.team1Id];
      const t2 = teamMap[g.team2Id];
      if (!t1?.members || !t2?.members) return;
      const win1 = g.team1Score > g.team2Score;
      const win2 = g.team2Score > g.team1Score;
      pair.memberKeys.forEach((key) => {
        const name1 = t1.members[key];
        const name2 = t2.members[key];
        if (name1) {
          const id = `${g.team1Id}-${key}`;
          if (!byPlayer[id]) byPlayer[id] = { teamId: g.team1Id, name: name1, setsPlayed: 0, setWins: 0, setLosses: 0, pointsFor: 0, pointsAgainst: 0 };
          byPlayer[id].setsPlayed += 1;
          if (win1) byPlayer[id].setWins += 1; else if (win2) byPlayer[id].setLosses += 1;
          byPlayer[id].pointsFor += g.team1Score;
          byPlayer[id].pointsAgainst += g.team2Score;
        }
        if (name2) {
          const id = `${g.team2Id}-${key}`;
          if (!byPlayer[id]) byPlayer[id] = { teamId: g.team2Id, name: name2, setsPlayed: 0, setWins: 0, setLosses: 0, pointsFor: 0, pointsAgainst: 0 };
          byPlayer[id].setsPlayed += 1;
          if (win2) byPlayer[id].setWins += 1; else if (win1) byPlayer[id].setLosses += 1;
          byPlayer[id].pointsFor += g.team2Score;
          byPlayer[id].pointsAgainst += g.team1Score;
        }
      });
    });
    return Object.values(byPlayer)
      .filter((p) => p.setsPlayed > 0)
      .map((p) => ({
        ...p,
        winRate: p.setsPlayed ? Math.round((p.setWins / p.setsPlayed) * 100) : 0,
        pointDiff: p.pointsFor - p.pointsAgainst,
      }))
      .sort((a, b) => b.setWins - a.setWins || b.pointDiff - a.pointDiff);
  }, [allGames, teamMap]);

  return (
    <div className="statistics-view">
      <h2>Thống kê</h2>
      <p className="subtitle">Tổng hợp từ kết quả các set đã thi đấu</p>

      {/* Tổng quan */}
      <section className="stats-section">
        <h3>Tổng quan giải</h3>
        <div className="stats-cards">
          <div className="stat-card">
            <span className="stat-value">{overview.totalSets}</span>
            <span className="stat-label">Set đã đấu</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{overview.totalPoints}</span>
            <span className="stat-label">Tổng điểm</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{overview.avgPerSet}</span>
            <span className="stat-label">Điểm/Set (TB)</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{overview.closeSets}</span>
            <span className="stat-label">Set kịch tính (≤2 điểm)</span>
          </div>
        </div>
      </section>

      {/* Đối đầu từng cặp */}
      <section className="stats-section">
        <h3>Đối đầu từng cặp đội</h3>
        <p className="subtitle small">Set thắng – Set thua giữa hai đội</p>
        <div className="h2h-grid">
          {headToHead.map((h) => (
            <div key={`${h.team1Id}-${h.team2Id}`} className="h2h-card">
              <span className={TEAM_COLORS[h.team1Id]}>{teamMap[h.team1Id]?.name}</span>
              <span className="h2h-score">
                {h.t1Sets} – {h.t2Sets}
              </span>
              <span className={TEAM_COLORS[h.team2Id]}>{teamMap[h.team2Id]?.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Theo loại cặp */}
      <section className="stats-section">
        <h3>Thống kê theo loại cặp</h3>
        <p className="subtitle small">Số set thắng theo từng loại (Chủ lực+Tb1, Tb2+Nữ, ...)</p>
        <div className="pair-stats-list">
          {byPairType.map(({ pair, stats }) => (
            <div key={pair.id} className="pair-stat-block">
              <h4>{pair.label}</h4>
              <ul>
                {stats.map(({ teamId, wins, name }) => (
                  <li key={teamId}>
                    <span className={TEAM_COLORS[teamId]}>{name}</span>
                    <span className="stat-num">{wins} set thắng</span>
                  </li>
                ))}
                {stats.length === 0 && <li className="muted">Chưa có dữ liệu</li>}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Thống kê theo cá nhân */}
      <section className="stats-section">
        <h3>Thống kê theo cá nhân</h3>
        <p className="subtitle small">Số set đã đấu, set thắng/thua, điểm và tỷ lệ thắng của từng cầu thủ</p>
        <div className="player-stats-wrapper">
          <table className="player-stats-table">
            <thead>
              <tr>
                <th>Cầu thủ</th>
                <th>Đội</th>
                <th>Set đấu</th>
                <th>Thắng</th>
                <th>Thua</th>
                <th>Điểm ghi</th>
                <th>Điểm thua</th>
                <th>Hiệu số</th>
                <th>TL thắng</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map((p) => (
                <tr key={`${p.teamId}-${p.name}`}>
                  <td className="player-name">{p.name}</td>
                  <td><span className={TEAM_COLORS[p.teamId]}>{teamMap[p.teamId]?.name}</span></td>
                  <td>{p.setsPlayed}</td>
                  <td>{p.setWins}</td>
                  <td>{p.setLosses}</td>
                  <td>{p.pointsFor}</td>
                  <td>{p.pointsAgainst}</td>
                  <td className={p.pointDiff >= 0 ? 'positive' : 'negative'}>
                    {p.pointDiff >= 0 ? '+' : ''}{p.pointDiff}
                  </td>
                  <td>{p.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Set kịch tính */}
      <section className="stats-section">
        <h3>Set kịch tính</h3>
        <p className="subtitle small">Các set có tỷ số sát nách (chênh lệch ≤ 2 điểm)</p>
        {closeGames.length === 0 ? (
          <p className="muted">Không có set nào chênh lệch ≤ 2 điểm.</p>
        ) : (
          <div className="close-games-list">
            {closeGames.map((g, i) => (
              <div key={`${g.matchId}-${g.gameIndex}-${i}`} className="close-game-item">
                <span className={TEAM_COLORS[g.team1Id]}>{teamMap[g.team1Id]?.name}</span>
                <span className="score">
                  {g.team1Score} – {g.team2Score}
                </span>
                <span className={TEAM_COLORS[g.team2Id]}>{teamMap[g.team2Id]?.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
