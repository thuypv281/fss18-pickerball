import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import {
  getInitialState,
  loadState,
  saveState,
} from './data/tournamentData';
import Schedule from './components/Schedule';
import Rankings from './components/Rankings';
import Statistics from './components/Statistics';
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

  const [tab, setTab] = useState('rankings');

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
          <button
            className={tab === 'rankings' ? 'active' : ''}
            onClick={() => setTab('rankings')}
          >
            Bảng xếp hạng
          </button>
          <button
            className={tab === 'stats' ? 'active' : ''}
            onClick={() => setTab('stats')}
          >
            Thống kê
          </button>
          <button
            className={tab === 'schedule' ? 'active' : ''}
            onClick={() => setTab('schedule')}
          >
            Kết quả thi đấu
          </button>
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {tab === 'rankings' && (
                  <Rankings
                    teams={state.teams}
                    matches={state.matches}
                    onRefresh={handleRefreshFromStorage}
                  />
                )}
                {tab === 'stats' && (
                  <Statistics teams={state.teams} matches={state.matches} />
                )}
                {tab === 'schedule' && (
                  <Schedule teams={state.teams} matches={state.matches} />
                )}
              </>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
