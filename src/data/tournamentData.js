// FSS18 - Giải picker ball
// 4 teams, 5 pair types, round robin, 3 courts

export const PAIR_TYPES = [
  { id: 'pair1', label: 'Chủ lực + Tb1' },
  { id: 'pair2', label: 'Tb1 + Tb2' },
  { id: 'pair3', label: 'Tb2 + Nữ' },
  { id: 'pair4', label: 'Nữ + Phong trào' },
  { id: 'pair5', label: 'Phong trào + Chủ lực' },
];

export const DEFAULT_TEAMS = [
  { id: 'team1', name: 'Đội 1' },
  { id: 'team2', name: 'Đội 2' },
  { id: 'team3', name: 'Đội 3' },
  { id: 'team4', name: 'Đội 4' },
];

const STORAGE_KEY = 'fss18-picker-ball';

export function getTeamMatches(teams) {
  const matches = [];
  let gameCounter = 0;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const games = PAIR_TYPES.map((pair, idx) => {
        const globalIdx = gameCounter++;
        return {
          pairId: pair.id,
          pairLabel: pair.label,
          team1Score: null,
          team2Score: null,
          court: (globalIdx % 3) + 1,
          round: Math.floor(globalIdx / 3),
        };
      });
      matches.push({
        id: `match-${teams[i].id}-${teams[j].id}`,
        team1Id: teams[i].id,
        team2Id: teams[j].id,
        games,
      });
    }
  }
  return matches;
}

export function getInitialState() {
  const teams = DEFAULT_TEAMS;
  const matches = getTeamMatches(teams);
  return {
    teams,
    matches,
  };
}

export function getAllScheduledGames(matches) {
  const allGames = [];
  matches.forEach((match) => {
    match.games.forEach((game, idx) => {
      allGames.push({
        ...game,
        matchId: match.id,
        team1Id: match.team1Id,
        team2Id: match.team2Id,
        gameIndex: idx,
      });
    });
  });
  return allGames.sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.court - b.court;
  });
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.teams || !data.matches) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Save failed:', e);
  }
}

export function calculateRankings(teams, matches) {
  const stats = {};
  teams.forEach((t) => {
    stats[t.id] = {
      teamId: t.id,
      teamName: t.name,
      matchWins: 0,
      matchLosses: 0,
      setWins: 0,
      setLosses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    };
  });

  matches.forEach((match) => {
    let team1Sets = 0;
    let team2Sets = 0;
    let team1Points = 0;
    let team2Points = 0;

    match.games.forEach((g) => {
      if (g.team1Score != null && g.team2Score != null) {
        team1Points += g.team1Score;
        team2Points += g.team2Score;
        if (g.team1Score > g.team2Score) team1Sets++;
        else if (g.team2Score > g.team1Score) team2Sets++;
      }
    });

    if (team1Sets > team2Sets) {
      stats[match.team1Id].matchWins++;
      stats[match.team2Id].matchLosses++;
    } else if (team2Sets > team1Sets) {
      stats[match.team2Id].matchWins++;
      stats[match.team1Id].matchLosses++;
    }

    stats[match.team1Id].setWins += team1Sets;
    stats[match.team1Id].setLosses += team2Sets;
    stats[match.team2Id].setWins += team2Sets;
    stats[match.team2Id].setLosses += team1Sets;
    stats[match.team1Id].pointsFor += team1Points;
    stats[match.team1Id].pointsAgainst += team2Points;
    stats[match.team2Id].pointsFor += team2Points;
    stats[match.team2Id].pointsAgainst += team1Points;
  });

  return Object.values(stats).sort((a, b) => {
    if (b.matchWins !== a.matchWins) return b.matchWins - a.matchWins;
    if (b.setWins !== a.setWins) return b.setWins - a.setWins;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    return diffB - diffA;
  });
}
