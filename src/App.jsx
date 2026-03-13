import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  getInitialState,
  loadState,
  saveState,
} from './data/tournamentData';
import Schedule from './components/Schedule';
import Rankings from './components/Rankings';
import Overview from './components/Overview';
import Admin from './components/Admin';
import './App.css';

function App() {
  const [state, setState] = useState(() => {
    const saved = loadState();
    return saved || getInitialState();
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleRefreshFromStorage = () => {
    const saved = loadState();
    if (saved) {
      setState(saved);
    }
  };

  const handleUpdateScore = (matchId, gameIndex, team1Score, team2Score) => {
    setState((prev) => {
      const matches = prev.matches.map((m) => {
        if (m.id !== matchId) return m;
        const games = [...m.games];
        games[gameIndex] = {
          ...games[gameIndex],
          team1Score,
          team2Score,
        };
        return { ...m, games };
      });
      return { ...prev, matches };
    });
  };

  const handleReset = () => {
    setState(getInitialState());
  };

  const handleRenameTeam = (teamId, name) => {
    setState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === teamId ? { ...t, name: name || t.name } : t
      ),
    }));
  };

  const [tab, setTab] = useState('schedule');
  const location = useLocation();

  const isAdmin = location.pathname === '/admin';

  return (
    <div className="app">
      <header className="header">
        <h1 className="title-with-refresh">
          <Link to="/" className="logo-link">FSS18 - Giải picker ball</Link>
          <button
            type="button"
            className="refresh-icon-btn"
            onClick={handleRefreshFromStorage}
            title="Refresh dữ liệu từ trình duyệt"
          >
            🔄
          </button>
        </h1>
        <nav className="tabs">
          {!isAdmin ? (
            <>
              <button
                className={tab === 'schedule' ? 'active' : ''}
                onClick={() => setTab('schedule')}
              >
                Lịch thi đấu
              </button>
              <button
                className={tab === 'rankings' ? 'active' : ''}
                onClick={() => setTab('rankings')}
              >
                Bảng xếp hạng
              </button>
              <button
                className={tab === 'overview' ? 'active' : ''}
                onClick={() => setTab('overview')}
              >
                Thông tin & giờ đấu
              </button>
            </>
          ) : (
            <Link to="/" className="tab-link">← Về trang chủ</Link>
          )}
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {tab === 'schedule' && (
                  <Schedule teams={state.teams} matches={state.matches} />
                )}
                {tab === 'rankings' && (
                  <Rankings
                    teams={state.teams}
                    matches={state.matches}
                    onRefresh={handleRefreshFromStorage}
                  />
                )}
                {tab === 'overview' && (
                  <Overview teams={state.teams} matches={state.matches} />
                )}
              </>
            }
          />
          <Route
            path="/admin"
            element={
              <Admin
                teams={state.teams}
                matches={state.matches}
                onUpdateScore={handleUpdateScore}
                onReset={handleReset}
                onRenameTeam={handleRenameTeam}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
