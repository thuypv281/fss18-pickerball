import { calculateRankings } from '../data/tournamentData';

const TEAM_COLORS = {
  team1: 'team-color-1',
  team2: 'team-color-2',
  team3: 'team-color-3',
  team4: 'team-color-4',
};

export default function Rankings({ teams, matches }) {
  const rankings = calculateRankings(teams, matches);

  return (
    <div className="rankings-view">
      <h2>Bảng xếp hạng</h2>

      <div className="rankings-table-wrapper">
        <table className="rankings-table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Team</th>
              <th>Set thắng</th>
              <th>Set thua</th>
              <th>Điểm ghi</th>
              <th>Điểm thua</th>
              <th>Hiệu số</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => {
              const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              return (
              <tr key={r.teamId} className={i < 3 ? `top-${i + 1}` : ''}>
                <td className={`rank ${i >= 3 ? 'rank-number' : ''}`}>
                  {rankIcon ? <span className="rank-icon">{rankIcon}</span> : i + 1}
                </td>
                <td className="team-name"><span className={TEAM_COLORS[r.teamId] || 'team-color-1'}>{r.teamName}</span></td>
                <td>{r.setWins}</td>
                <td>{r.setLosses}</td>
                <td>{r.pointsFor}</td>
                <td>{r.pointsAgainst}</td>
                <td className={r.pointsFor - r.pointsAgainst >= 0 ? 'positive' : 'negative'}>
                  {r.pointsFor - r.pointsAgainst >= 0 ? '+' : ''}
                  {r.pointsFor - r.pointsAgainst}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      <div className="legend">
        <p>Xếp hạng theo Set thắng, cùng set thì xét Hiệu số điểm</p>
      </div>
    </div>
  );
}
