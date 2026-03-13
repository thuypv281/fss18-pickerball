import { useMemo, useState } from 'react';
import { getAllScheduledGames, getPairMembers } from '../data/tournamentData';

export default function Admin({ teams, matches, onUpdateScore, onReset, onRenameTeam }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editScores, setEditScores] = useState({});

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t])),
    [teams],
  );

  const allGames = useMemo(
    () => getAllScheduledGames(matches),
    [matches],
  );

  const gamesByRound = useMemo(() => {
    const byRound = {};
    allGames.forEach((g) => {
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
  }, [allGames]);

  const scoreKey = (matchId, gameIndex) => `${matchId}:${gameIndex}`;

  const handleScoreChange = (matchId, gameIndex, which, value) => {
    const key = scoreKey(matchId, gameIndex);
    setEditScores((prev) => {
      const existing = prev[key] || {};
      return {
        ...prev,
        [key]: {
          ...existing,
          [which]: value,
        },
      };
    });
  };

  const handleSave = (matchId, gameIndex, game) => {
    const key = scoreKey(matchId, gameIndex);
    const current = editScores[key] || {};
    const s1Raw = current.team1 ?? (game.team1Score != null ? String(game.team1Score) : '');
    const s2Raw = current.team2 ?? (game.team2Score != null ? String(game.team2Score) : '');
    const s1 = parseInt(s1Raw, 10);
    const s2 = parseInt(s2Raw, 10);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return;
    onUpdateScore(matchId, gameIndex, s1, s2);
  };

  const handleReset = () => {
    onReset();
    setShowResetConfirm(false);
    setEditScores({});
  };

  return (
    <div className="admin-view">
      <h2>Quản lý tỷ số</h2>
      <p className="subtitle">Giao diện giống lịch thi đấu, cho phép nhập điểm từng set</p>

      <div className="team-names-section">
        <h3>Tên đội</h3>
        <div className="team-names-grid">
          {teams.map((t) => (
            <label key={t.id} className="team-name-edit">
              <span>{t.name || t.id.replace('team', 'Đội ')}</span>
              <input
                type="text"
                value={t.name}
                onChange={(e) => onRenameTeam?.(t.id, e.target.value)}
                placeholder="Tên đội"
              />
            </label>
          ))}
        </div>
      </div>

      <section className="overview-section">
        <h3>Lịch theo vòng & nhập tỷ số</h3>

        {gamesByRound.map(({ round, games }) => (
          <div key={round} className="round-block">
            <h3>
              Vòng {round + 1}
            </h3>
            <div className="courts-row">
              {[1, 2, 3].map((court) => {
                const courtGames = games.filter((g) => g.court === court);
                if (courtGames.length === 0) return null;
                const courtNum = court === 1 ? 5 : court === 2 ? 6 : 7;
                return (
                  <div key={court} className="court-card">
                    <div className="court-label">Sân {courtNum}</div>
                    {courtGames.map((g) => {
                      const match = matches.find((m) => m.id === g.matchId);
                      if (!match) return null;
                      const t1 = teamMap[g.team1Id];
                      const t2 = teamMap[g.team2Id];
                      const m1 = getPairMembers(t1, g.pairId);
                      const m2 = getPairMembers(t2, g.pairId);
                      const key = scoreKey(g.matchId, g.gameIndex);
                      const current = editScores[key] || {};
                      const v1 =
                        current.team1 ??
                        (g.team1Score != null ? String(g.team1Score) : '');
                      const v2 =
                        current.team2 ??
                        (g.team2Score != null ? String(g.team2Score) : '');
                      return (
                        <div
                          key={`${g.matchId}-${g.gameIndex}`}
                          className="game-card"
                        >
                          <div className="pair-type">{g.pairLabel}</div>
                          <div className="teams members-row">
                            {m1 && m2 ? (
                              <>
                                <span>{m1}</span>
                                <span className="members-vs"> vs </span>
                                <span>{m2}</span>
                              </>
                            ) : (
                              <span>
                                {t1?.name} vs {t2?.name}
                              </span>
                            )}
                          </div>
                          <div className="score-row admin-score-row">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={v1}
                              onChange={(e) =>
                                handleScoreChange(g.matchId, g.gameIndex, 'team1', e.target.value)
                              }
                              className="score-inline-input"
                            />
                            <span className="vs">-</span>
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={v2}
                              onChange={(e) =>
                                handleScoreChange(g.matchId, g.gameIndex, 'team2', e.target.value)
                              }
                              className="score-inline-input"
                            />
                            <button
                              type="button"
                              className="btn-primary btn-small"
                              onClick={() => handleSave(g.matchId, g.gameIndex, g)}
                            >
                              Lưu
                            </button>
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
      </section>

      <div className="admin-actions">
        <button
          className="btn-danger"
          onClick={() => setShowResetConfirm(true)}
        >
          Reset toàn bộ
        </button>
      </div>

      {showResetConfirm && (
        <div className="score-form-overlay">
          <div className="score-form">
            <h3>Xác nhận reset</h3>
            <p>Bạn có chắc muốn xóa toàn bộ tỷ số và bắt đầu lại?</p>
            <div className="form-actions">
              <button onClick={handleReset} className="btn-danger">
                Xác nhận
              </button>
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
