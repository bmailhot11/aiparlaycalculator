/**
 * CLV Closing Line Collection API
 * Automatically collects closing lines and updates CLV for tracked bets
 * Should be called periodically (e.g., every 15 minutes before games start)
 */

import { supabase } from '../../../utils/supabaseClient';
import eventsCache from '../../../lib/events-cache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('📈 Starting closing line collection for CLV tracking...');

    // Get all bets that need closing line updates
    // (games starting in next 2 hours and don't have closing lines yet)
    const { data: pendingBets, error: fetchError } = await supabase
      .from('clv_bet_tracking')
      .select('*')
      .is('closing_odds_decimal', null)
      .gte('commence_time', new Date().toISOString())
      .lte('commence_time', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()); // Next 2 hours

    if (fetchError) {
      console.error('❌ Error fetching pending bets:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch pending bets'
      });
    }

    if (!pendingBets || pendingBets.length === 0) {
      console.log('ℹ️ No pending bets found for closing line collection');
      return res.status(200).json({
        success: true,
        message: 'No pending bets found',
        bets_processed: 0
      });
    }

    console.log(`🎯 Found ${pendingBets.length} bets needing closing line updates`);

    let successful = 0;
    let failed = 0;

    // Group bets by sport for efficient API calls
    const betsBySport = pendingBets.reduce((acc, bet) => {
      if (!acc[bet.sport]) {
        acc[bet.sport] = [];
      }
      acc[bet.sport].push(bet);
      return acc;
    }, {});

    // Process each sport
    for (const [sport, bets] of Object.entries(betsBySport)) {
      try {
        console.log(`🏈 Processing ${bets.length} bets for ${sport}...`);
        
        // Get current odds data for this sport
        const events = await eventsCache.cacheUpcomingEvents(sport);
        if (!events || events.length === 0) {
          console.log(`⚠️ No events found for ${sport}`);
          continue;
        }

        const markets = 'h2h,spreads,totals';
        const oddsData = await eventsCache.getOddsForEvents(events, markets, false);
        
        if (!oddsData || oddsData.length === 0) {
          console.log(`⚠️ No odds data found for ${sport}`);
          continue;
        }

        // Process each bet
        for (const bet of bets) {
          try {
            const closingLine = await findClosingLine(bet, oddsData);
            
            if (closingLine) {
              // Update the bet with closing line data
              const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/clv/update-closing`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  tracking_id: bet.id,
                  closing_odds_decimal: closingLine.odds_decimal,
                  closing_odds_american: closingLine.odds_american,
                  closing_sportsbook: closingLine.sportsbook
                })
              });

              if (updateResponse.ok) {
                const result = await updateResponse.json();
                console.log(`✅ Updated ${bet.selection}: CLV ${result.clv_metrics.clv_percent}%`);
                successful++;
              } else {
                console.error(`❌ Failed to update bet ${bet.id}:`, await updateResponse.text());
                failed++;
              }
            } else {
              console.log(`⚠️ No closing line found for: ${bet.selection} (${bet.market_type})`);
              failed++;
            }
          } catch (betError) {
            console.error(`❌ Error processing bet ${bet.id}:`, betError);
            failed++;
          }
        }
      } catch (sportError) {
        console.error(`❌ Error processing sport ${sport}:`, sportError);
        failed += bets.length;
      }
    }

    console.log(`📊 Closing line collection completed: ${successful} successful, ${failed} failed`);

    return res.status(200).json({
      success: true,
      message: 'Closing line collection completed',
      bets_processed: pendingBets.length,
      successful_updates: successful,
      failed_updates: failed
    });

  } catch (error) {
    console.error('❌ Closing line collection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during closing line collection'
    });
  }
}

/**
 * Find the best closing line for a tracked bet
 */
async function findClosingLine(bet, oddsData) {
  try {
    // Find matching game in odds data
    const matchingGames = oddsData.filter(game => {
      const gameTeams = `${game.away_team} @ ${game.home_team}`;
      const betTeams = `${bet.away_team} @ ${bet.home_team}`;
      
      return gameTeams === betTeams || 
             (game.home_team === bet.home_team && game.away_team === bet.away_team);
    });

    if (matchingGames.length === 0) {
      return null;
    }

    const game = matchingGames[0];
    
    // Find matching market
    let targetMarket = null;
    switch (bet.market_type) {
      case 'h2h':
        targetMarket = game.bookmakers?.find(b => b.markets?.find(m => m.key === 'h2h'));
        break;
      case 'spreads':
        targetMarket = game.bookmakers?.find(b => b.markets?.find(m => m.key === 'spreads'));
        break;
      case 'totals':
        targetMarket = game.bookmakers?.find(b => b.markets?.find(m => m.key === 'totals'));
        break;
      default:
        // Try to find market by bet.market_type
        targetMarket = game.bookmakers?.find(b => b.markets?.find(m => m.key === bet.market_type));
    }

    if (!targetMarket) {
      return null;
    }

    // Find the specific market and outcome
    const market = targetMarket.markets.find(m => 
      m.key === bet.market_type || 
      (bet.market_type === 'h2h' && m.key === 'h2h') ||
      (bet.market_type === 'spreads' && m.key === 'spreads') ||
      (bet.market_type === 'totals' && m.key === 'totals')
    );

    if (!market || !market.outcomes) {
      return null;
    }

    // Find matching outcome
    const outcome = market.outcomes.find(o => {
      // Try exact match first
      if (o.name === bet.selection) return true;
      
      // Try partial matches for team names
      const normalizedSelection = bet.selection.toLowerCase();
      const normalizedOutcome = o.name.toLowerCase();
      
      return normalizedSelection.includes(normalizedOutcome) || 
             normalizedOutcome.includes(normalizedSelection);
    });

    if (!outcome) {
      return null;
    }

    // Convert American odds to decimal
    const oddsDecimal = americanToDecimal(outcome.price);
    
    // Use Pinnacle if available, otherwise use the first available book
    const sportsbook = targetMarket.title;

    return {
      odds_decimal: oddsDecimal,
      odds_american: formatOdds(outcome.price),
      sportsbook: sportsbook
    };

  } catch (error) {
    console.error('Error finding closing line:', error);
    return null;
  }
}

// Helper functions
function americanToDecimal(americanOdds) {
  const odds = parseFloat(americanOdds);
  if (odds > 0) {
    return (odds / 100) + 1;
  } else {
    return (100 / Math.abs(odds)) + 1;
  }
}

function formatOdds(odds) {
  const numOdds = parseFloat(odds);
  return numOdds > 0 ? `+${numOdds}` : `${numOdds}`;
}