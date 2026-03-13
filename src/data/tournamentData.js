// FSS18 - Giải picker ball
// 4 teams, 5 pair types, round robin, 3 courts

export const PAIR_TYPES = [
  { id: 'pair1', label: 'Chủ lực + Tb1', memberKeys: ['chuLuc', 'tb1'] },
  { id: 'pair2', label: 'Tb1 + Tb2', memberKeys: ['tb1', 'tb2'] },
  { id: 'pair3', label: 'Tb2 + Nữ', memberKeys: ['tb2', 'nu'] },
  { id: 'pair4', label: 'Nữ + Phong trào', memberKeys: ['nu', 'phongTrao'] },
  { id: 'pair5', label: 'Phong trào + Chủ lực', memberKeys: ['phongTrao', 'chuLuc'] },
];

export function getPairMembers(team, pairId) {
  return PAIR_TYPES.find((p) => p.id === pairId)?.memberKeys
    .map((k) => team.members?.[k] || '')
    .filter(Boolean)
    .join(' + ') || null;
}

export const MEMBER_KEYS = ['chuLuc', 'tb1', 'tb2', 'phongTrao', 'nu'];

export const DEFAULT_TEAMS = [
  {
    id: 'team1',
    name: 'Team Thùy',
    members: {
      chuLuc: 'Vũ Giáp Gianh',
      tb1: 'Lê Đức Mạnh',
      tb2: 'Nguyễn Đức Nam',
      phongTrao: 'Nguyễn Thành Nam',
      nu: 'Bì Bọt',
    },
  },
  {
    id: 'team2',
    name: 'Team Âu',
    members: {
      chuLuc: 'Lục Đình Vinh',
      tb1: 'Tiến Võ',
      tb2: 'Xuân Trường',
      phongTrao: 'Lộc RnD',
      nu: 'Âu Nguyễn',
    },
  },
  {
    id: 'team3',
    name: 'Team Hồng Linh',
    members: {
      chuLuc: 'Phùng Văn Thủy',
      tb1: 'Hải Long',
      tb2: 'Quang Tuấn',
      phongTrao: 'Lại Hữu Dương',
      nu: 'Hồng Linh',
    },
  },
  {
    id: 'team4',
    name: 'Team Cartherine',
    members: {
      chuLuc: 'Vũ Xuân Hạc',
      tb1: 'Trần Tuấn Minh',
      tb2: 'Ngô Xuân Giang',
      phongTrao: 'Phan Minh Thông',
      nu: 'Cartherine',
    },
  },
];

const STORAGE_KEY = 'fss18-picker-ball';

// Sắp xếp theo loại cặp: Chủ lực+Tb1 thi đấu trên cùng một sân (Sân 1)
// Rounds 0-5: pair1 Sân 1, pair2 Sân 2, pair3 Sân 3
// Rounds 6-11: pair4 Sân 1, pair5 Sân 2 (Sân 3 trống)
const PAIR_SCHEDULE = {
  pair1: { court: 1, roundOffset: 0 },
  pair2: { court: 2, roundOffset: 0 },
  pair3: { court: 3, roundOffset: 0 },
  pair4: { court: 1, roundOffset: 6 },
  pair5: { court: 2, roundOffset: 6 },
};

export function getTeamMatches(teams) {
  const matches = [];
  const gamesByPair = { pair1: 0, pair2: 0, pair3: 0, pair4: 0, pair5: 0 };
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const games = PAIR_TYPES.map((pair) => {
        const pairIdx = gamesByPair[pair.id];
        gamesByPair[pair.id]++;
        const { court, roundOffset } = PAIR_SCHEDULE[pair.id];
        const round = roundOffset + pairIdx;
        return {
          pairId: pair.id,
          pairLabel: pair.label,
          team1Score: null,
          team2Score: null,
          court,
          round,
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
    // Migrate: sync team names from DEFAULT_TEAMS (chỉ khi còn tên cũ "Đội 1"...) và thêm members nếu thiếu
    const OLD_NAMES = ['Đội 1', 'Đội 2', 'Đội 3', 'Đội 4'];
    data.teams = data.teams.map((t) => {
      const def = DEFAULT_TEAMS.find((d) => d.id === t.id);
      if (!def) return t;
      const needsNameUpdate = OLD_NAMES.includes(t.name);
      return {
        ...t,
        name: needsNameUpdate ? def.name : t.name,
        members: t.members || def.members,
      };
    });
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
