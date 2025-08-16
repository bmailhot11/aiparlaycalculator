import openai from '../../lib/openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ 
      success: false, 
      message: 'No image data provided' 
    });
  }

  try {
    console.log('🔍 Analyzing bet slip with OpenAI and finding best odds...');

    // Use OpenAI Vision to analyze the bet slip image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this sports betting slip image and extract the betting information in a structured format. Focus on identifying:

1. All individual bets (teams, lines, bet types, odds, stake amounts)
2. Whether it's a parlay or individual bets
3. The sportsbook name if visible
4. Game details and timing

Return ONLY valid JSON in this exact format:
{
  "extracted_bets": [
    {
      "sport": "NFL/NBA/NHL/MLB/etc",
      "home_team": "Team Name",
      "away_team": "Team Name", 
      "bet_type": "moneyline/spread/total/prop",
      "bet_selection": "specific bet made",
      "line": "point spread or total if applicable",
      "odds": "odds in American format (+150, -110, etc)",
      "stake": "bet amount if visible",
      "game_time": "if visible"
    }
  ],
  "slip_details": {
    "sportsbook": "detected sportsbook name or unknown",
    "bet_structure": "parlay/individual/round_robin",
    "total_stake": "total amount wagered",
    "potential_payout": "potential winnings if visible",
    "number_of_legs": "count of individual bets"
  },
  "confidence": "high/medium/low based on image clarity"
}`
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1
    });

    const aiResponse = response.choices[0].message.content;
    console.log('🤖 OpenAI Response:', aiResponse);

    // Parse the JSON response
    let extractedData;
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      extractedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      
      return res.status(200).json({
        success: true,
        analysis: {
          message: "Could not clearly read the bet slip. Please try uploading a clearer image.",
          sportsbook_comparison: null,
          optimization_tips: ["Ensure the image is clear and well-lit", "Make sure all text is visible"]
        }
      });
    }

    // Find better odds for the extracted bets
    const sportsbookComparison = await findBetterOdds(extractedData.extracted_bets);
    
    // Generate analysis and recommendations
    const analysis = {
      bet_slip_details: {
        sportsbook: extractedData.slip_details.sportsbook,
        bet_type: extractedData.slip_details.bet_structure,
        total_stake: extractedData.slip_details.total_stake,
        potential_payout: extractedData.slip_details.potential_payout,
        number_of_legs: extractedData.slip_details.number_of_legs,
        extracted_bets: extractedData.extracted_bets
      },
      sportsbook_comparison: sportsbookComparison,
      optimization: generateOptimizationTips(extractedData.extracted_bets, sportsbookComparison),
      confidence_level: extractedData.confidence,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('❌ Analysis Error:', error);

    return res.status(200).json({
      success: true,
      analysis: {
        message: "Analysis service temporarily unavailable. Please try again in a moment.",
        error_type: "service_error",
        sportsbook_comparison: null,
        optimization_tips: ["Try again in a few moments", "Ensure your image is clear and readable"]
      }
    });
  }
}

async function findBetterOdds(extractedBets) {
  if (!extractedBets || extractedBets.length === 0) {
    return null;
  }

  try {
    // Fetch live odds from The Odds API for comparison
    const oddsComparisons = [];
    
    for (const bet of extractedBets) {
      const betterOdds = await findBetterOddsForBet(bet);
      if (betterOdds) {
        oddsComparisons.push(betterOdds);
      }
    }

    if (oddsComparisons.length === 0) {
      return {
        available: false,
        message: "Live odds comparison temporarily unavailable"
      };
    }

    // Calculate potential savings
    const totalSavings = oddsComparisons.reduce((sum, comparison) => {
      return sum + (comparison.potential_extra_winnings || 0);
    }, 0);

    return {
      available: true,
      comparisons: oddsComparisons,
      summary: {
        total_potential_savings: `$${totalSavings.toFixed(2)}`,
        best_overall_book: findBestOverallBook(oddsComparisons),
        recommendation: generateRecommendation(oddsComparisons)
      }
    };

  } catch (error) {
    console.error('Error finding better odds:', error);
    return {
      available: false,
      message: "Could not compare odds at this time"
    };
  }
}

async function findBetterOddsForBet(bet) {
  const API_KEY = process.env.ODDS_API_KEY;
  
  if (!API_KEY) {
    return null;
  }

  try {
    // Map sport to API key
    const sportMap = {
      'NFL': 'americanfootball_nfl',
      'NBA': 'basketball_nba',
      'NHL': 'icehockey_nhl', 
      'MLB': 'baseball_mlb',
      'NCAAF': 'americanfootball_ncaaf',
      'NCAAB': 'basketball_ncaab'
    };

    const sportKey = sportMap[bet.sport];
    if (!sportKey) {
      return null;
    }

    // Fetch live odds for this sport
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`
    );

    if (!response.ok) {
      return null;
    }

    const games = await response.json();
    
    // Find the matching game
    const matchingGame = games.find(game => 
      (game.home_team.includes(bet.home_team) || bet.home_team.includes(game.home_team)) &&
      (game.away_team.includes(bet.away_team) || bet.away_team.includes(game.away_team))
    );

    if (!matchingGame) {
      return {
        bet_description: `${bet.away_team} @ ${bet.home_team} - ${bet.bet_selection}`,
        original_odds: bet.odds,
        status: "Game not found in current lines",
        better_options: []
      };
    }

    // Find better odds across all bookmakers
    const betterOptions = [];
    const originalOdds = parseInt(bet.odds.replace('+', ''));

    for (const bookmaker of matchingGame.bookmakers) {
      for (const market of bookmaker.markets) {
        // Match the bet type and selection
        const matchingOutcome = findMatchingOutcome(market, bet);
        
        if (matchingOutcome) {
          const newOdds = matchingOutcome.price;
          const improvement = calculateOddsImprovement(originalOdds, newOdds);
          
          if (improvement.is_better) {
            betterOptions.push({
              sportsbook: bookmaker.title,
              odds: formatOdds(newOdds),
              improvement: improvement.improvement_text,
              potential_extra_winnings: improvement.extra_winnings,
              signup_bonus: getSignupBonus(bookmaker.title)
            });
          }
        }
      }
    }

    // Sort by best odds
    betterOptions.sort((a, b) => b.potential_extra_winnings - a.potential_extra_winnings);

    return {
      bet_description: `${bet.away_team} @ ${bet.home_team} - ${bet.bet_selection}`,
      original_odds: bet.odds,
      original_sportsbook: "Current",
      better_options: betterOptions.slice(0, 3), // Top 3
      potential_extra_winnings: betterOptions[0]?.potential_extra_winnings || 0
    };

  } catch (error) {
    console.error('Error fetching odds for bet:', error);
    return null;
  }
}

function findMatchingOutcome(market, bet) {
  // Simple matching logic - can be enhanced
  for (const outcome of market.outcomes) {
    if (bet.bet_type === 'moneyline' && market.key === 'h2h') {
      if (outcome.name.includes(bet.bet_selection) || bet.bet_selection.includes(outcome.name)) {
        return outcome;
      }
    } else if (bet.bet_type === 'spread' && market.key === 'spreads') {
      if (outcome.name.includes(bet.bet_selection) || bet.bet_selection.includes(outcome.name)) {
        return outcome;
      }
    } else if (bet.bet_type === 'total' && market.key === 'totals') {
      if ((bet.bet_selection.toLowerCase().includes('over') && outcome.name === 'Over') ||
          (bet.bet_selection.toLowerCase().includes('under') && outcome.name === 'Under')) {
        return outcome;
      }
    }
  }
  return null;
}

function calculateOddsImprovement(originalOdds, newOdds) {
  const originalDecimal = americanToDecimal(originalOdds);
  const newDecimal = americanToDecimal(newOdds);
  
  // Assume $100 bet for comparison
  const originalPayout = 100 * (originalDecimal - 1);
  const newPayout = 100 * (newDecimal - 1);
  const extraWinnings = newPayout - originalPayout;
  
  return {
    is_better: extraWinnings > 0,
    extra_winnings: Math.max(0, extraWinnings),
    improvement_text: extraWinnings > 0 ? `+$${extraWinnings.toFixed(2)} better` : "Same or worse"
  };
}

function americanToDecimal(americanOdds) {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

function formatOdds(odds) {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function getSignupBonus(bookmaker) {
  const bonuses = {
    'DraftKings': '$1000 bonus bet',
    'FanDuel': '$150 bonus bets',
    'BetMGM': '$1500 risk-free bet',
    'Caesars Sportsbook': '$1000 first bet',
    'BetRivers': '$500 bonus bet',
    'PointsBet': '$500 risk-free bet'
  };
  
  return bonuses[bookmaker] || '$500 welcome bonus';
}

function findBestOverallBook(comparisons) {
  const bookCounts = {};
  let maxCount = 0;
  let bestBook = "Multiple books recommended";
  
  for (const comparison of comparisons) {
    for (const option of comparison.better_options) {
      bookCounts[option.sportsbook] = (bookCounts[option.sportsbook] || 0) + 1;
      if (bookCounts[option.sportsbook] > maxCount) {
        maxCount = bookCounts[option.sportsbook];
        bestBook = option.sportsbook;
      }
    }
  }
  
  return bestBook;
}

function generateRecommendation(comparisons) {
  const totalSavings = comparisons.reduce((sum, comp) => sum + comp.potential_extra_winnings, 0);
  
  if (totalSavings > 50) {
    return "Significant savings available! Consider switching sportsbooks for these bets.";
  } else if (totalSavings > 20) {
    return "Moderate savings found. Worth comparing before placing bets.";
  } else if (totalSavings > 5) {
    return "Small improvements available across multiple books.";
  } else {
    return "Your current sportsbook offers competitive odds for these bets.";
  }
}

function generateOptimizationTips(extractedBets, sportsbookComparison) {
  const tips = [];
  
  if (sportsbookComparison && sportsbookComparison.available) {
    const totalSavings = parseFloat(sportsbookComparison.summary.total_potential_savings.replace('$', ''));
    
    if (totalSavings > 20) {
      tips.push(`💰 You could save ${sportsbookComparison.summary.total_potential_savings} by shopping for better odds`);
      tips.push(`🏆 ${sportsbookComparison.summary.best_overall_book} offers the best overall value for your bets`);
    }
  }
  
  // General tips based on bet structure
  if (extractedBets.length > 4) {
    tips.push("🎯 Consider breaking large parlays into smaller, higher-probability combinations");
  }
  
  if (extractedBets.some(bet => bet.odds && parseInt(bet.odds.replace('+', '')) > 300)) {
    tips.push("⚡ High-odds bets detected - ensure you're comfortable with the risk level");
  }
  
  tips.push("📊 Always verify odds before placing bets as lines move frequently");
  tips.push("🔄 Consider using our AI parlay generator for mathematically optimized combinations");
  
  return tips;
}