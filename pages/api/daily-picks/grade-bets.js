// API Route for Grading Bets and Updating KPIs
// Triggered by Vercel Cron hourly from 11:00 PM to 6:00 AM CT

import { supabase } from '../../../utils/supabaseClient';
import { calculateCLV, decimalToAmerican } from '../../../utils/oddsCalculations';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  console.log('🏆 Starting bet grading process');

  try {
    // Get all unsettled legs from recent bets (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: unsettledLegs, error: fetchError } = await supabase
      .from('reco_bet_legs')
      .select(`
        *,
        reco_bet:reco_bet_id (
          id,
          bet_type,
          status,
          daily_reco_id
        )
      `)
      .is('result', null)
      .gte('commence_time', thirtyDaysAgo.toISOString())
      .lte('commence_time', new Date().toISOString()) // Only grade games that should have finished
      .order('commence_time', { ascending: true });

    if (fetchError) throw fetchError;

    console.log(`🎯 Found ${unsettledLegs.length} unsettled legs to grade`);

    let gradesProcessed = 0;
    let gradesSuccessful = 0;

    // Grade each unsettled leg
    for (const leg of unsettledLegs) {
      try {
        const gradeResult = await gradeBetLeg(leg);
        if (gradeResult.graded) {
          gradesSuccessful++;
          console.log(`✅ Graded ${leg.sport} ${leg.home_team} vs ${leg.away_team}: ${gradeResult.result}`);
        }
        gradesProcessed++;
      } catch (error) {
        console.error(`❌ Error grading leg ${leg.id}:`, error.message);
        gradesProcessed++;
      }
    }

    // Update bet statuses and calculate results
    await updateBetStatuses();

    // Update daily KPIs
    await updateDailyKPIs();

    const duration = Date.now() - startTime;
    console.log(`🏁 Grading complete: ${gradesSuccessful}/${gradesProcessed} successful in ${duration}ms`);

    return res.status(200).json({
      success: true,
      legs_processed: gradesProcessed,
      legs_graded: gradesSuccessful,
      duration_ms: duration
    });

  } catch (error) {
    console.error('🚨 Error in bet grading:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Bet grading failed',
      message: error.message,
      duration_ms: Date.now() - startTime
    });
  }
}

/**
 * Grade a single bet leg
 */
async function gradeBetLeg(leg) {
  try {
    // Check if game should be finished (at least 4 hours after start time)
    const gameTime = new Date(leg.commence_time);
    const now = new Date();
    const hoursElapsed = (now - gameTime) / (1000 * 60 * 60);

    if (hoursElapsed < 4) {
      return { graded: false, reason: 'Game too recent' };
    }

    // Fetch game result
    const gameResult = await fetchGameResult(leg);
    
    if (!gameResult || gameResult.status !== 'final') {
      return { graded: false, reason: 'Game not final or result unavailable' };
    }

    // Determine bet result based on market type and selection
    const betResult = determineBetResult(leg, gameResult);
    
    // Fetch closing odds for CLV calculation
    const closingOdds = await fetchClosingOdds(leg);
    let clvPercentage = null;
    
    if (closingOdds) {
      const clv = calculateCLV(leg.best_odds, closingOdds);
      clvPercentage = clv.clvPercentage;
    }

    // Update leg with result
    const { error: updateError } = await supabase
      .from('reco_bet_legs')
      .update({
        result: betResult.result,
        closing_odds: closingOdds,
        clv_percentage: clvPercentage,
        settled_at: new Date().toISOString()
      })
      .eq('id', leg.id);

    if (updateError) throw updateError;

    // Record settlement details
    await supabase
      .from('reco_settlements')
      .insert({
        reco_bet_leg_id: leg.id,
        home_score: gameResult.homeScore,
        away_score: gameResult.awayScore,
        total_score: gameResult.totalScore,
        game_status: gameResult.status,
        settlement_logic: betResult.logic,
        settled_by: 'auto',
        metadata: {
          game_result: gameResult,
          bet_details: betResult
        }
      });

    return {
      graded: true,
      result: betResult.result,
      clv: clvPercentage
    };

  } catch (error) {
    console.error(`Error grading leg ${leg.id}:`, error);
    throw error;
  }
}

/**
 * Fetch game result from external API
 */
async function fetchGameResult(leg) {
  try {
    // Map sport to The Odds API sport key
    const sportMap = {
      'NFL': 'americanfootball_nfl',
      'NBA': 'basketball_nba',
      'MLB': 'baseball_mlb',
      'NHL': 'icehockey_nhl'
    };

    const sportKey = sportMap[leg.sport];
    if (!sportKey) return null;

    // Use The Odds API scores endpoint
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${process.env.ODDS_API_KEY}&daysFrom=7&dateFormat=iso`
    );

    if (!response.ok) return null;

    const scores = await response.json();
    
    // Find matching game
    const gameScore = scores.find(game => 
      game.id === leg.game_id ||
      (game.home_team === leg.home_team && 
       game.away_team === leg.away_team &&
       new Date(game.commence_time).getTime() === new Date(leg.commence_time).getTime())
    );

    if (!gameScore || !gameScore.scores) return null;

    return {
      status: gameScore.completed ? 'final' : 'incomplete',
      homeScore: gameScore.scores.find(s => s.name === leg.home_team)?.score || 0,
      awayScore: gameScore.scores.find(s => s.name === leg.away_team)?.score || 0,
      totalScore: gameScore.scores.reduce((sum, team) => sum + (team.score || 0), 0)
    };

  } catch (error) {
    console.error('Error fetching game result:', error);
    return null;
  }
}

/**
 * Determine bet result based on selection and game outcome
 */
function determineBetResult(leg, gameResult) {
  const { homeScore, awayScore, totalScore } = gameResult;
  const selection = leg.selection.toLowerCase();

  let result = 'loss';
  let logic = '';

  try {
    if (leg.market_type === 'h2h') {
      // Moneyline bets
      if (selection.includes(leg.home_team.toLowerCase())) {
        result = homeScore > awayScore ? 'win' : 'loss';
        logic = `${leg.home_team} ${homeScore > awayScore ? 'won' : 'lost'} ${homeScore}-${awayScore}`;
      } else if (selection.includes(leg.away_team.toLowerCase())) {
        result = awayScore > homeScore ? 'win' : 'loss';
        logic = `${leg.away_team} ${awayScore > homeScore ? 'won' : 'lost'} ${awayScore}-${homeScore}`;
      }
    } else if (leg.market_type === 'totals') {
      // Over/Under bets
      const totalMatch = selection.match(/(over|under)\s*([\d.]+)/i);
      if (totalMatch) {
        const isOver = totalMatch[1].toLowerCase() === 'over';
        const line = parseFloat(totalMatch[2]);
        
        if (totalScore === line) {
          result = 'push';
          logic = `Total ${totalScore} pushed on line ${line}`;
        } else if (isOver) {
          result = totalScore > line ? 'win' : 'loss';
          logic = `Total ${totalScore} ${totalScore > line ? 'went over' : 'stayed under'} ${line}`;
        } else {
          result = totalScore < line ? 'win' : 'loss';
          logic = `Total ${totalScore} ${totalScore < line ? 'stayed under' : 'went over'} ${line}`;
        }
      }
    } else if (leg.market_type === 'spreads') {
      // Point spread bets
      const spreadMatch = selection.match(/(.*?)\s*([+-]?\d+\.?\d*)/);
      if (spreadMatch) {
        const team = spreadMatch[1].trim();
        const spread = parseFloat(spreadMatch[2]);
        
        let teamScore, opponentScore;
        if (team.toLowerCase().includes(leg.home_team.toLowerCase())) {
          teamScore = homeScore;
          opponentScore = awayScore;
        } else {
          teamScore = awayScore;
          opponentScore = homeScore;
        }
        
        const adjustedScore = teamScore + spread;
        
        if (adjustedScore === opponentScore) {
          result = 'push';
          logic = `${team} ${adjustedScore} pushed vs ${opponentScore}`;
        } else {
          result = adjustedScore > opponentScore ? 'win' : 'loss';
          logic = `${team} ${teamScore} ${spread >= 0 ? '+' : ''}${spread} = ${adjustedScore} vs ${opponentScore}`;
        }
      }
    }

  } catch (error) {
    console.error(`Error determining result for leg ${leg.id}:`, error);
    result = 'void';
    logic = `Error in settlement: ${error.message}`;
  }

  return { result, logic };
}

/**
 * Fetch closing odds for CLV calculation
 */
async function fetchClosingOdds(leg) {
  // For now, return null - would need to implement historical odds tracking
  // In a full implementation, you'd store odds snapshots throughout the day
  return null;
}

/**
 * Update bet statuses after legs are graded
 */
async function updateBetStatuses() {
  // Get all bets with at least one graded leg
  const { data: betsToUpdate } = await supabase
    .from('reco_bets')
    .select(`
      id,
      bet_type,
      status,
      decimal_odds,
      reco_bet_legs (
        id,
        result,
        decimal_odds
      )
    `)
    .eq('status', 'active')
    .not('reco_bet_legs.result', 'is', null);

  for (const bet of betsToUpdate || []) {
    const legs = bet.reco_bet_legs;
    const settledLegs = legs.filter(leg => leg.result);
    
    if (settledLegs.length === 0) continue;

    let betResult = null;
    let grossReturn = 0;
    let netPnl = 0;

    if (settledLegs.length === legs.length) {
      // All legs settled
      const hasVoid = settledLegs.some(leg => leg.result === 'void');
      const hasLoss = settledLegs.some(leg => leg.result === 'loss');
      const allWins = settledLegs.every(leg => leg.result === 'win' || leg.result === 'push');
      
      if (hasVoid && !hasLoss) {
        // Void bet - recalculate odds without voided legs
        betResult = 'void';
      } else if (hasLoss) {
        betResult = 'loss';
        netPnl = -100; // Assume $100 bet size
      } else if (allWins) {
        betResult = 'win';
        grossReturn = bet.decimal_odds * 100; // Assume $100 bet
        netPnl = grossReturn - 100;
      } else {
        betResult = 'push';
        netPnl = 0;
      }

      await supabase
        .from('reco_bets')
        .update({
          status: 'settled',
          result: betResult,
          gross_return: grossReturn,
          net_pnl: netPnl,
          settled_at: new Date().toISOString()
        })
        .eq('id', bet.id);
    }
  }
}

/**
 * Update daily KPIs based on settled bets
 */
async function updateDailyKPIs() {
  // Get settled bets from today and calculate daily P&L
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayBets } = await supabase
    .from('reco_bets')
    .select(`
      bet_type,
      result,
      net_pnl,
      daily_reco:daily_reco_id (reco_date)
    `)
    .eq('status', 'settled')
    .eq('daily_reco.reco_date', today);

  let singlePnl = 0, parlay2Pnl = 0, parlay4Pnl = 0;

  (todayBets || []).forEach(bet => {
    if (bet.bet_type === 'single') singlePnl += bet.net_pnl || 0;
    else if (bet.bet_type === 'parlay2') parlay2Pnl += bet.net_pnl || 0;
    else if (bet.bet_type === 'parlay4') parlay4Pnl += bet.net_pnl || 0;
  });

  const totalDailyPnl = singlePnl + parlay2Pnl + parlay4Pnl;

  // Calculate running totals
  const { data: allBets } = await supabase
    .from('reco_bets')
    .select('result, net_pnl, clv_percentage')
    .eq('status', 'settled');

  const totalBetsPlaced = allBets?.length || 0;
  const totalBetsWon = allBets?.filter(b => b.result === 'win').length || 0;
  const totalBetsLost = allBets?.filter(b => b.result === 'loss').length || 0;
  const totalBetsPushed = allBets?.filter(b => b.result === 'push').length || 0;
  const totalBetsVoided = allBets?.filter(b => b.result === 'void').length || 0;
  
  const cumulativePnl = allBets?.reduce((sum, bet) => sum + (bet.net_pnl || 0), 0) || 0;
  const totalRoi = totalBetsPlaced > 0 ? (cumulativePnl / (totalBetsPlaced * 100)) * 100 : 0;
  const hitRate = totalBetsPlaced > 0 ? (totalBetsWon / (totalBetsWon + totalBetsLost)) * 100 : 0;
  
  const betsWithClv = allBets?.filter(b => b.clv_percentage !== null) || [];
  const clvBeatPercentage = betsWithClv.length > 0 ? 
    (betsWithClv.filter(b => b.clv_percentage > 0).length / betsWithClv.length) * 100 : 0;

  // Update or insert daily KPI record
  await supabase
    .from('reco_daily_kpis')
    .upsert({
      kpi_date: today,
      single_pnl: singlePnl,
      parlay_2_pnl: parlay2Pnl,
      parlay_4_pnl: parlay4Pnl,
      total_daily_pnl: totalDailyPnl,
      total_bets_placed: totalBetsPlaced,
      total_bets_won: totalBetsWon,
      total_bets_lost: totalBetsLost,
      total_bets_pushed: totalBetsPushed,
      total_bets_voided: totalBetsVoided,
      cumulative_pnl: cumulativePnl,
      total_roi_percentage: totalRoi,
      hit_rate_percentage: hitRate,
      clv_beat_percentage: clvBeatPercentage
    }, {
      onConflict: 'kpi_date'
    });

  console.log(`📊 Updated KPIs: Daily P&L = $${totalDailyPnl.toFixed(2)}, Total ROI = ${totalRoi.toFixed(1)}%`);
}