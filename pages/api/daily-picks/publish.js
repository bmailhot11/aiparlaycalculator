// API Route for Publishing Daily Recommendations
// Triggered by Vercel Cron at 11:00 AM CT daily

import { supabase } from '../../../utils/supabaseClient';
import { generateDailyRecommendations, validateRecommendations } from '../../../utils/betRecommendationEngine';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  console.log('🚀 Starting comprehensive daily workflow');

  const results = {
    grading: null,
    publishing: null,
    trackRecord: null
  };

  try {
    // Get current date in CT timezone
    const publishTime = new Date();
    const ctOffset = -5; // Central Time offset (-6 for CST, -5 for CDT - currently CDT in August)
    const ctTime = new Date(publishTime.getTime() + (ctOffset * 60 * 60 * 1000));
    const publishDate = ctTime.toISOString().split('T')[0];
    
    // STEP 1: Grade yesterday's picks first
    console.log('📊 Step 1: Grading yesterday\'s picks...');
    try {
      const yesterday = new Date(ctTime);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];
      
      const gradingResponse = await fetch(`${process.env.VERCEL_URL || req.headers.host ? `https://${req.headers.host}` : 'https://aiparlaycalculator-3yw4fy17r-benmailhots-projects.vercel.app'}/api/daily-picks/grade-bets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: yesterdayDate })
      });
      
      if (gradingResponse.ok) {
        const gradingData = await gradingResponse.json();
        results.grading = { success: true, data: gradingData };
        console.log('✅ Yesterday\'s picks graded successfully');
      } else {
        results.grading = { success: false, error: 'Grading API failed' };
        console.log('⚠️ Grading failed, continuing with publishing...');
      }
    } catch (gradingError) {
      results.grading = { success: false, error: gradingError.message };
      console.log('⚠️ Grading error:', gradingError.message);
    }
    
    // STEP 2: Generate and publish today's picks
    console.log('📝 Step 2: Publishing today\'s picks...');

    // Check if we already published today
    const { data: existingReco } = await supabase
      .from('daily_recos')
      .select('id, status')
      .eq('reco_date', publishDate)
      .single();

    if (existingReco && existingReco.status === 'published') {
      return res.status(200).json({
        success: true,
        message: 'Recommendations already published today',
        reco_id: existingReco.id,
        already_published: true
      });
    }

    // Fetch odds data across all sports
    console.log('📊 Fetching odds data across all sports...');
    const sportsToAnalyze = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'UFC'];
    const allOddsData = [];

    for (const sport of sportsToAnalyze) {
      try {
        const oddsData = await fetchSportOdds(sport);
        if (oddsData && oddsData.length > 0) {
          allOddsData.push(...oddsData);
          console.log(`✅ ${sport}: ${oddsData.length} games`);
        }
      } catch (error) {
        console.error(`❌ Error fetching ${sport} odds:`, error.message);
      }
    }

    console.log(`📈 Total games analyzed: ${allOddsData.length}`);

    if (allOddsData.length === 0) {
      return await publishNoBet(publishDate, publishTime, 'No games available across all sports');
    }

    // Generate recommendations
    const recommendations = await generateDailyRecommendations(allOddsData, publishTime);
    
    // Validate recommendations
    const validation = validateRecommendations(recommendations);
    if (!validation.isValid) {
      console.error('🚨 Validation failed:', validation.errors);
      return await publishNoBet(publishDate, publishTime, `Validation failed: ${validation.errors.join(', ')}`);
    }

    // Save recommendations to database
    const recoId = await saveRecommendations(publishDate, publishTime, recommendations);

    const duration = Date.now() - startTime;
    console.log(`✅ Successfully completed daily workflow in ${duration}ms`);

    return res.status(200).json({
      success: true,
      reco_id: recoId,
      publish_date: publishDate,
      workflow_results: {
        grading: results.grading,
        publishing: {
          success: true,
          recommendations: {
            single: !!recommendations.single,
            parlay2: !!recommendations.parlay2,
            parlay4: !!recommendations.parlay4,
            no_bet_reason: recommendations.noBetReason
          },
          metadata: recommendations.metadata
        }
      },
      duration_ms: duration
    });

  } catch (error) {
    console.error('🚨 Error publishing daily picks:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to publish daily picks',
      message: error.message,
      duration_ms: Date.now() - startTime
    });
  }
}

/**
 * Fetch odds data for a specific sport
 */
async function fetchSportOdds(sport) {
  try {
    // Map sports to API sport keys
    const sportMap = {
      'NFL': 'americanfootball_nfl',
      'NBA': 'basketball_nba', 
      'MLB': 'baseball_mlb',
      'NHL': 'icehockey_nhl',
      'NCAAF': 'americanfootball_ncaaf',
      'NCAAB': 'basketball_ncaab',
      'UFC': 'mma_mixed_martial_arts'
    };

    const sportKey = sportMap[sport];
    if (!sportKey) return [];

    // Use existing live-odds API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/live-odds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport: sportKey })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.odds : [];

  } catch (error) {
    console.error(`Error fetching ${sport} odds:`, error);
    return [];
  }
}

/**
 * Save recommendations to database
 */
async function saveRecommendations(publishDate, publishTime, recommendations) {
  const transaction = supabase.rpc('begin_transaction');

  try {
    // Create daily_recos record
    const { data: dailyReco, error: recoError } = await supabase
      .from('daily_recos')
      .insert({
        reco_date: publishDate,
        published_at: publishTime.toISOString(),
        status: 'published',
        no_bet_reason: recommendations.noBetReason,
        metadata: recommendations.metadata
      })
      .select()
      .single();

    if (recoError) throw recoError;

    let singleBetId = null, parlay2Id = null, parlay4Id = null;

    // Save single bet
    if (recommendations.single) {
      singleBetId = await saveBet(dailyReco.id, 'single', recommendations.single);
    }

    // Save 2-leg parlay  
    if (recommendations.parlay2) {
      parlay2Id = await saveBet(dailyReco.id, 'parlay2', recommendations.parlay2);
    }

    // Save 4-leg parlay
    if (recommendations.parlay4) {
      parlay4Id = await saveBet(dailyReco.id, 'parlay4', recommendations.parlay4);
    }

    // Update daily_recos with bet IDs
    await supabase
      .from('daily_recos')
      .update({
        single_bet_id: singleBetId,
        parlay_2_id: parlay2Id,
        parlay_4_id: parlay4Id
      })
      .eq('id', dailyReco.id);

    console.log(`💾 Saved recommendations: ID=${dailyReco.id}, Single=${!!singleBetId}, 2-leg=${!!parlay2Id}, 4-leg=${!!parlay4Id}`);
    
    return dailyReco.id;

  } catch (error) {
    console.error('Error saving recommendations:', error);
    throw error;
  }
}

/**
 * Save individual bet and its legs
 */
async function saveBet(dailyRecoId, betType, bet) {
  // Save bet record
  const { data: betRecord, error: betError } = await supabase
    .from('reco_bets')
    .insert({
      daily_reco_id: dailyRecoId,
      bet_type: betType,
      total_legs: bet.legs.length,
      status: 'active',
      combined_odds: bet.combinedOdds,
      decimal_odds: bet.decimalOdds,
      edge_percentage: bet.edgePercentage,
      estimated_payout: bet.estimatedPayout,
      metadata: {
        confidence: bet.confidence
      }
    })
    .select()
    .single();

  if (betError) throw betError;

  // Save leg records
  for (let i = 0; i < bet.legs.length; i++) {
    const leg = bet.legs[i];
    
    const { error: legError } = await supabase
      .from('reco_bet_legs')
      .insert({
        reco_bet_id: betRecord.id,
        leg_index: i,
        sport: leg.sport,
        game_id: leg.gameId,
        home_team: leg.homeTeam,
        away_team: leg.awayTeam,
        commence_time: leg.commenceTime,
        market_type: leg.marketType,
        selection: leg.selection,
        selection_key: leg.selectionKey,
        best_sportsbook: leg.bestSportsbook,
        best_odds: leg.bestOdds,
        decimal_odds: leg.decimalOdds,
        pinnacle_odds: leg.pinnacleOdds,
        fair_odds: leg.fairOdds,
        edge_percentage: leg.edgePercentage,
        no_vig_probability: leg.impliedProbability,
        metadata: {
          calculation_method: leg.calculationMethod,
          confidence: leg.confidence,
          total_books: leg.metadata.totalBooks
        }
      });

    if (legError) throw legError;
  }

  console.log(`💾 Saved ${betType} bet with ${bet.legs.length} legs`);
  return betRecord.id;
}

/**
 * Publish a no-bet recommendation
 */
async function publishNoBet(publishDate, publishTime, reason) {
  const { data: dailyReco, error } = await supabase
    .from('daily_recos')
    .insert({
      reco_date: publishDate,
      published_at: publishTime.toISOString(),
      status: 'published',
      no_bet_reason: reason,
      metadata: {
        no_bet: true,
        reason: reason,
        analysis_time: new Date().toISOString()
      }
    })
    .select()
    .single();

  if (error) throw error;

  console.log(`📝 Published no-bet recommendation: ${reason}`);

  return {
    success: true,
    reco_id: dailyReco.id,
    no_bet: true,
    reason: reason
  };
}