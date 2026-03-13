import { calculateRankings } from '../data/tournamentData';

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
              <th>Đội</th>
              <th>Thắng</th>
              <th>Thua</th>
              <th>Set thắng</th>
              <th>Set thua</th>
              <th>Điểm ghi</th>
              <th>Điểm thua</th>
              <th>Hiệu số</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr key={r.teamId} className={i < 3 ? `top-${i + 1}` : ''}>
                <td className="rank">{i + 1}</td>
                <td className="team-name">{r.teamName}</td>
                <td>{r.matchWins}</td>
                <td>{r.matchLosses}</td>
                <td>{r.setWins}</td>
                <td>{r.setLosses}</td>
                <td>{r.pointsFor}</td>
                <td>{r.pointsAgainst}</td>
                <td className={r.pointsFor - r.pointsAgainst >= 0 ? 'positive' : 'negative'}>
                  {r.pointsFor - r.pointsAgainst >= 0 ? '+' : ''}
                  {r.pointsFor - r.pointsAgainst}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="legend">
        <p>Xếp hạng: Thắng trận → Set thắng → Hiệu số điểm</p>
      </div>
    </div>
  );
}
