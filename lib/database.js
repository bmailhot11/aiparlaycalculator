// Simple file-based database for user data and historical odds
// In production, consider moving to PostgreSQL or MongoDB

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ODDS_HISTORY_FILE = path.join(DATA_DIR, 'odds-history.json');
const GAME_RESULTS_FILE = path.join(DATA_DIR, 'game-results.json');
const USER_BETS_FILE = path.join(DATA_DIR, 'user-bets.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
function initializeFile(filePath, defaultData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

initializeFile(USERS_FILE, []);
initializeFile(ODDS_HISTORY_FILE, []);
initializeFile(GAME_RESULTS_FILE, []);
initializeFile(USER_BETS_FILE, []);

// Helper functions for reading/writing data
function readJSONFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

function writeJSONFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// User Management Functions
export const UserDB = {
  // Create new user
  createUser: (userData) => {
    const users = readJSONFile(USERS_FILE);
    const existingUser = users.find(user => user.username === userData.username);
    
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const newUser = {
      id: Date.now().toString(),
      username: userData.username,
      email: userData.email || null,
      avatar: userData.avatar || null,
      createdAt: new Date().toISOString(),
      stats: {
        totalBets: 0,
        cashBets: 0,
        trashBets: 0,
        winRate: 0,
        totalProfit: 0
      },
      preferences: {
        favoriteLeagues: [],
        riskLevel: 'medium'
      }
    };

    users.push(newUser);
    writeJSONFile(USERS_FILE, users);
    return newUser;
  },

  // Get user by username
  getUserByUsername: (username) => {
    const users = readJSONFile(USERS_FILE);
    return users.find(user => user.username === username);
  },

  // Get user by ID
  getUserById: (userId) => {
    const users = readJSONFile(USERS_FILE);
    return users.find(user => user.id === userId);
  },

  // Update user stats
  updateUserStats: (userId, newStats) => {
    const users = readJSONFile(USERS_FILE);
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].stats = { ...users[userIndex].stats, ...newStats };
      writeJSONFile(USERS_FILE, users);
      return users[userIndex];
    }
    return null;
  },

  // Get all users for leaderboard
  getAllUsers: () => {
    const users = readJSONFile(USERS_FILE);
    return users.map(user => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      stats: user.stats,
      createdAt: user.createdAt
    }));
  }
};

// Odds History Functions
export const OddsHistoryDB = {
  // Store odds data with timestamp
  storeOddsSnapshot: (oddsData) => {
    const history = readJSONFile(ODDS_HISTORY_FILE);
    const timestamp = new Date().toISOString();
    
    const snapshot = {
      id: Date.now().toString(),
      timestamp,
      sport: oddsData.sport,
      games: oddsData.odds.map(game => ({
        gameId: game.id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        commenceTime: game.commence_time,
        bookmakers: game.bookmakers.map(book => ({
          name: book.key,
          markets: book.markets.map(market => ({
            key: market.key,
            outcomes: market.outcomes.map(outcome => ({
              name: outcome.name,
              price: outcome.price
            }))
          }))
        }))
      }))
    };

    history.push(snapshot);
    
    // Keep only last 30 days of data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter(entry => new Date(entry.timestamp) > thirtyDaysAgo);
    
    writeJSONFile(ODDS_HISTORY_FILE, filteredHistory);
    return snapshot.id;
  },

  // Get odds movement for a specific game
  getOddsMovement: (gameId, timeRange = 24) => {
    const history = readJSONFile(ODDS_HISTORY_FILE);
    const cutoffTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
    
    const relevantSnapshots = history.filter(snapshot => 
      new Date(snapshot.timestamp) > cutoffTime &&
      snapshot.games.some(game => game.gameId === gameId)
    );

    return relevantSnapshots.map(snapshot => {
      const game = snapshot.games.find(g => g.gameId === gameId);
      return {
        timestamp: snapshot.timestamp,
        game: game || null
      };
    });
  },

  // Calculate line movement trends
  calculateLineMovement: (gameId, market = 'h2h') => {
    const movement = OddsHistoryDB.getOddsMovement(gameId, 48);
    
    if (movement.length < 2) {
      return { trend: 'insufficient_data', movement: 0 };
    }

    const first = movement[0];
    const last = movement[movement.length - 1];
    
    if (!first.game || !last.game) {
      return { trend: 'insufficient_data', movement: 0 };
    }

    // Simple trend analysis for moneyline (h2h)
    try {
      const firstOdds = first.game.bookmakers[0]?.markets.find(m => m.key === market)?.outcomes[0]?.price;
      const lastOdds = last.game.bookmakers[0]?.markets.find(m => m.key === market)?.outcomes[0]?.price;
      
      if (!firstOdds || !lastOdds) {
        return { trend: 'insufficient_data', movement: 0 };
      }

      const movementAmount = lastOdds - firstOdds;
      const trend = movementAmount > 0 ? 'increasing' : movementAmount < 0 ? 'decreasing' : 'stable';
      
      return {
        trend,
        movement: movementAmount,
        snapshots: movement.length,
        timespan: '48h'
      };
    } catch (error) {
      return { trend: 'error', movement: 0, error: error.message };
    }
  }
};

// Game Results Functions
export const GameResultsDB = {
  // Store game result
  storeGameResult: (result) => {
    const results = readJSONFile(GAME_RESULTS_FILE);
    
    const gameResult = {
      id: Date.now().toString(),
      gameId: result.gameId,
      homeTeam: result.homeTeam,
      awayTeam: result.awayTeam,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      winner: result.winner,
      sport: result.sport,
      completedAt: result.completedAt,
      season: result.season || new Date().getFullYear(),
      week: result.week || null
    };

    results.push(gameResult);
    writeJSONFile(GAME_RESULTS_FILE, results);
    return gameResult.id;
  },

  // Get team performance stats
  getTeamStats: (teamName, sport, games = 10) => {
    const results = readJSONFile(GAME_RESULTS_FILE);
    
    const teamGames = results
      .filter(game => 
        game.sport === sport && 
        (game.homeTeam === teamName || game.awayTeam === teamName)
      )
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, games);

    const wins = teamGames.filter(game => game.winner === teamName).length;
    const losses = teamGames.length - wins;
    
    const averagePointsScored = teamGames.reduce((sum, game) => {
      const teamScore = game.homeTeam === teamName ? game.homeScore : game.awayScore;
      return sum + teamScore;
    }, 0) / teamGames.length;

    const averagePointsAllowed = teamGames.reduce((sum, game) => {
      const opponentScore = game.homeTeam === teamName ? game.awayScore : game.homeScore;
      return sum + opponentScore;
    }, 0) / teamGames.length;

    return {
      teamName,
      gamesPlayed: teamGames.length,
      wins,
      losses,
      winPercentage: teamGames.length > 0 ? (wins / teamGames.length) * 100 : 0,
      averagePointsScored: Math.round(averagePointsScored * 10) / 10,
      averagePointsAllowed: Math.round(averagePointsAllowed * 10) / 10,
      recentForm: teamGames.slice(0, 5).map(game => game.winner === teamName ? 'W' : 'L')
    };
  },

  // Get head-to-head record
  getHeadToHeadRecord: (team1, team2, sport, games = 5) => {
    const results = readJSONFile(GAME_RESULTS_FILE);
    
    const h2hGames = results
      .filter(game => 
        game.sport === sport && 
        ((game.homeTeam === team1 && game.awayTeam === team2) || 
         (game.homeTeam === team2 && game.awayTeam === team1))
      )
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, games);

    const team1Wins = h2hGames.filter(game => game.winner === team1).length;
    const team2Wins = h2hGames.length - team1Wins;

    return {
      team1,
      team2,
      gamesPlayed: h2hGames.length,
      team1Wins,
      team2Wins,
      recentGames: h2hGames.map(game => ({
        date: game.completedAt,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        winner: game.winner
      }))
    };
  }
};

// User Bets Functions
export const UserBetsDB = {
  // Store user bet submission
  storeBet: (betData) => {
    const bets = readJSONFile(USER_BETS_FILE);
    
    const bet = {
      id: Date.now().toString(),
      userId: betData.userId,
      username: betData.username,
      type: betData.type, // 'single' or 'parlay'
      legs: betData.legs,
      stake: betData.stake,
      potentialPayout: betData.potentialPayout,
      submittedAt: new Date().toISOString(),
      analysis: betData.analysis, // trash/cash result
      status: 'pending', // pending, won, lost
      actualPayout: null,
      settledAt: null
    };

    bets.push(bet);
    writeJSONFile(USER_BETS_FILE, bets);
    return bet.id;
  },

  // Get user's bet history
  getUserBets: (userId, limit = 20) => {
    const bets = readJSONFile(USER_BETS_FILE);
    return bets
      .filter(bet => bet.userId === userId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, limit);
  },

  // Get recent community bets
  getRecentCommunityBets: (limit = 10) => {
    const bets = readJSONFile(USER_BETS_FILE);
    return bets
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, limit)
      .map(bet => ({
        ...bet,
        // Don't expose full user details for privacy
        userId: null
      }));
  },

  // Update bet result
  updateBetResult: (betId, result) => {
    const bets = readJSONFile(USER_BETS_FILE);
    const betIndex = bets.findIndex(bet => bet.id === betId);
    
    if (betIndex !== -1) {
      bets[betIndex] = {
        ...bets[betIndex],
        status: result.status,
        actualPayout: result.actualPayout,
        settledAt: new Date().toISOString()
      };
      writeJSONFile(USER_BETS_FILE, bets);
      return bets[betIndex];
    }
    return null;
  }
};