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

// Ràng buộc sắp lịch:
// 1) Mỗi vòng: 3 trận (3 sân), không cầu thủ nào xuất hiện ở 2 trận trong cùng vòng
// 2) Không cầu thủ nào đánh 3 vòng liên tiếp
// 3) 10 vòng tổng cộng (30 slot = 30 trận)
const PAIR_PLAYERS = {
  pair1: ['chuLuc', 'tb1'],
  pair2: ['tb1', 'tb2'],
  pair3: ['tb2', 'nu'],
  pair4: ['nu', 'phongTrao'],
  pair5: ['phongTrao', 'chuLuc'],
};

const TOTAL_ROUNDS = 10;
const COURTS_PER_ROUND = 3;

function buildSchedule(teams) {
  const teamIds = teams.map((t) => t.id);

  // Tạo danh sách tất cả trận (6 cặp đội x 5 loại pair = 30)
  const games = [];
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const team1Id = teamIds[i];
      const team2Id = teamIds[j];
      PAIR_TYPES.forEach((pair) => {
        games.push({
          team1Id,
          team2Id,
          pairId: pair.id,
        });
      });
    }
  }

  // Tạo 30 slot (10 vòng x 3 sân)
  const slots = [];
  for (let round = 0; round < TOTAL_ROUNDS; round++) {
    for (let court = 1; court <= COURTS_PER_ROUND; court++) {
      slots.push({ round, court });
    }
  }

  // Cấu trúc trạng thái cho backtracking
  const assigned = new Array(games.length).fill(false);
  const playerRounds = {}; // playerKey -> array các vòng đã đánh (theo thứ tự)

  function getPlayersInGame(game) {
    const res = [];
    const roles = PAIR_PLAYERS[game.pairId];
    roles.forEach((role) => {
      res.push(`${game.team1Id}:${role}`);
      res.push(`${game.team2Id}:${role}`);
    });
    return res;
  }

  // Kiểm tra ràng buộc cho 1 game tại slot (round)
  function canPlaceGameAt(gameIndex, round, roundPlayersSet) {
    const game = games[gameIndex];
    const players = getPlayersInGame(game);

    // Ràng buộc 1: không trùng người trong cùng vòng
    for (const p of players) {
      if (roundPlayersSet.has(p)) return false;
    }

    // Ràng buộc 2: không 3 vòng liên tiếp cho cùng người
    for (const p of players) {
      const arr = playerRounds[p] || [];
      const last = arr[arr.length - 1];
      const secondLast = arr[arr.length - 2];
      if (last === round - 1 && secondLast === round - 2) {
        return false;
      }
    }

    return true;
  }

  function placeGame(gameIndex, round) {
    assigned[gameIndex] = true;
    const game = games[gameIndex];
    const players = getPlayersInGame(game);
    players.forEach((p) => {
      const arr = playerRounds[p] || [];
      playerRounds[p] = [...arr, round];
    });
  }

  function removeGame(gameIndex) {
    assigned[gameIndex] = false;
    const game = games[gameIndex];
    const players = getPlayersInGame(game);
    players.forEach((p) => {
      const arr = playerRounds[p];
      if (!arr) return;
      arr.pop();
      if (arr.length === 0) {
        delete playerRounds[p];
      } else {
        playerRounds[p] = arr;
      }
    });
  }

  const assignment = new Array(slots.length).fill(null); // index game cho mỗi slot

  function backtrack(slotIndex) {
    if (slotIndex === slots.length) {
      // gán hết 30 slot
      return true;
    }

    const { round } = slots[slotIndex];

    // Tập người đã đánh trong round này (từ các slot trước trong cùng round)
    const roundPlayersSet = new Set();
    for (let i = round * COURTS_PER_ROUND; i < slotIndex; i++) {
      const gi = assignment[i];
      if (gi == null) continue;
      getPlayersInGame(games[gi]).forEach((p) => roundPlayersSet.add(p));
    }

    // Heuristic: ưu tiên những game chưa gán có nhiều ràng buộc (ở đây đơn giản là theo thứ tự)
    for (let gi = 0; gi < games.length; gi++) {
      if (assigned[gi]) continue;
      if (!canPlaceGameAt(gi, round, roundPlayersSet)) continue;

      assignment[slotIndex] = gi;
      placeGame(gi, round);

      if (backtrack(slotIndex + 1)) return true;

      removeGame(gi);
      assignment[slotIndex] = null;
    }

    return false;
  }

  const ok = backtrack(0);
  if (!ok) {
    // Nếu không tìm được lịch thỏa ràng buộc, fallback: trả về lịch rỗng để dễ debug
    // (UI vẫn chạy, chỉ không có trận)
    return [];
  }

  // Chuyển assignment -> danh sách rounds với thông tin trận + sân
  const roundsResult = [];
  for (let r = 0; r < TOTAL_ROUNDS; r++) {
    roundsResult[r] = [];
    for (let c = 0; c < COURTS_PER_ROUND; c++) {
      const slotIdx = r * COURTS_PER_ROUND + c;
      const gi = assignment[slotIdx];
      const game = games[gi];
      roundsResult[r].push({
        ...game,
        round: r,
        court: c + 1,
      });
    }
  }

  return roundsResult;
}

export function getTeamMatches(teams) {
  const rounds = buildSchedule(teams);
  const matchMap = {};

  // Khởi tạo matchMap cho 6 cặp đội
  teams.forEach((t, i) => {
    for (let j = i + 1; j < teams.length; j++) {
      const other = teams[j];
      const key = `${t.id}-${other.id}`;
      matchMap[key] = {
        id: `match-${t.id}-${other.id}`,
        team1Id: t.id,
        team2Id: other.id,
        games: [],
      };
    }
  });

  // Gán các game theo rounds vào matchMap
  rounds.forEach((roundGames, roundIdx) => {
    roundGames.forEach((g) => {
      const key = g.team1Id < g.team2Id ? `${g.team1Id}-${g.team2Id}` : `${g.team2Id}-${g.team1Id}`;
      const match = matchMap[key];
      if (!match) return;
      const pair = PAIR_TYPES.find((p) => p.id === g.pairId);
      match.games.push({
        pairId: g.pairId,
        pairLabel: pair?.label || '',
        team1Score: null,
        team2Score: null,
        court: g.court,
        round: roundIdx,
      });
    });
  });

  return Object.values(matchMap).map((m) => ({
    id: m.id,
    team1Id: m.team1Id,
    team2Id: m.team2Id,
    games: m.games.sort((a, b) => (a.round !== b.round ? a.round - b.round : a.court - b.court)),
  }));
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
