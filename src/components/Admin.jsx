import { useState } from 'react';

export default function Admin({ teams, matches, onUpdateScore, onReset, onRenameTeam }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const handleSelectGame = (match, game, idx) => {
    setSelectedMatch(match);
    setSelectedGame(idx);
    setTeam1Score(game.team1Score != null ? String(game.team1Score) : '');
    setTeam2Score(game.team2Score != null ? String(game.team2Score) : '');
  };

  const handleSave = () => {
    if (!selectedMatch || selectedGame == null) return;
    const s1 = parseInt(team1Score, 10);
    const s2 = parseInt(team2Score, 10);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return;
    onUpdateScore(selectedMatch.id, selectedGame, s1, s2);
    setSelectedMatch(null);
    setSelectedGame(null);
    setTeam1Score('');
    setTeam2Score('');
  };

  const handleReset = () => {
    onReset();
    setShowResetConfirm(false);
    setSelectedMatch(null);
    setSelectedGame(null);
  };

  return (
    <div className="admin-view">
      <h2>Quản lý tỷ số</h2>
      <p className="subtitle">Chọn trận và nhập tỷ số (mỗi set đến 15)</p>

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

      <div className="matches-grid">
        {matches.map((match) => (
          <div key={match.id} className="match-card">
            <div className="match-header">
              {teamMap[match.team1Id]} vs {teamMap[match.team2Id]}
            </div>
            <div className="games-list">
              {match.games.map((game, idx) => (
                <button
                  key={game.pairId}
                  className={`game-btn ${selectedMatch?.id === match.id && selectedGame === idx ? 'selected' : ''} ${game.team1Score != null ? 'completed' : ''}`}
                  onClick={() => handleSelectGame(match, game, idx)}
                >
                  <span className="pair">{game.pairLabel}</span>
                  <span className="score">
                    {game.team1Score != null ? `${game.team1Score}-${game.team2Score}` : '—'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedMatch && selectedGame != null && (
        <div className="score-form-overlay">
          <div className="score-form">
            <h3>Nhập tỷ số</h3>
            <p>
              {teamMap[selectedMatch.team1Id]} vs {teamMap[selectedMatch.team2Id]} —{' '}
              {selectedMatch.games[selectedGame].pairLabel}
            </p>
            <div className="score-inputs">
              <label>
                <span>{teamMap[selectedMatch.team1Id]}</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                />
              </label>
              <span className="vs">-</span>
              <label>
                <span>{teamMap[selectedMatch.team2Id]}</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                />
              </label>
            </div>
            <div className="form-actions">
              <button onClick={handleSave} className="btn-primary">
                Lưu
              </button>
              <button onClick={() => setSelectedMatch(null)} className="btn-secondary">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

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
