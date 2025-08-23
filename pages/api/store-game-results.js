// Store completed game results for analysis
import { GameResultsDB } from '../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { 
      results, // Array of game results
      sport,
      season,
      week 
    } = req.body;

    console.log('[Store Results] Processing game results:', results?.length || 0);

    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid results data provided'
      });
    }

    const stored = [];
    const errors = [];

    for (const result of results) {
      try {
        // Validate required fields
        if (!result.homeTeam || !result.awayTeam || 
            result.homeScore === undefined || result.awayScore === undefined) {
          errors.push({
            game: `${result.awayTeam} @ ${result.homeTeam}`,
            error: 'Missing required game data'
          });
          continue;
        }

        // Determine winner
        const winner = result.homeScore > result.awayScore 
          ? result.homeTeam 
          : result.awayTeam;

        // Store result
        const gameResult = {
          gameId: result.gameId || `${result.awayTeam}_${result.homeTeam}_${Date.now()}`,
          homeTeam: result.homeTeam,
          awayTeam: result.awayTeam,
          homeScore: parseInt(result.homeScore),
          awayScore: parseInt(result.awayScore),
          winner: winner,
          sport: sport || result.sport || 'NFL',
          completedAt: result.completedAt || new Date().toISOString(),
          season: season || result.season || new Date().getFullYear(),
          week: week || result.week || null
        };

        const resultId = GameResultsDB.storeGameResult(gameResult);
        
        stored.push({
          id: resultId,
          game: `${result.awayTeam} @ ${result.homeTeam}`,
          score: `${result.awayScore}-${result.homeScore}`,
          winner: winner
        });

      } catch (error) {
        errors.push({
          game: `${result.awayTeam} @ ${result.homeTeam}`,
          error: error.message
        });
      }
    }

    console.log(`[Store Results] Stored: ${stored.length}, Errors: ${errors.length}`);

    return res.status(200).json({
      success: true,
      message: `Stored ${stored.length} game results`,
      stored: stored,
      errors: errors,
      summary: {
        total: results.length,
        stored: stored.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('[Store Results] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to store game results',
      error: error.message
    });
  }
}