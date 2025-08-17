// lib/enhanced-ev-calculator.js
// Enhanced EV calculator that maintains quality while optimizing costs

class EnhancedEVCalculator {
  constructor() {
    this.sharpBookmakers = ['Pinnacle', 'Circa', 'BetCRIS', 'Bookmaker'];
    this.recreationalBooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];
    this.historicalCache = new Map();
    this.marketEfficiencyData = new Map();
  }

  // ENHANCED: Sophisticated EV calculation with market analysis
  async calculateTrueEV(bet, marketData) {
    // Step 1: Sharp vs Recreational line analysis
    const sharpConsensus = this.getSharpConsensus(bet, marketData);
    const recLineValue = this.analyzeRecreationalValue(bet, marketData);
    
    // Step 2: Market efficiency scoring
    const marketEfficiency = this.calculateMarketEfficiency(bet, marketData);
    
    // Step 3: Advanced probability modeling
    const trueProbability = await this.calculateTrueProbability(
      bet,
      sharpConsensus,
      recLineValue,
      marketEfficiency
    );
    
    // Step 4: Dynamic vig calculation (not flat estimates)
    const actualVig = this.calculateDynamicVig(bet, marketData);
    
    // Step 5: Calculate EV with confidence intervals
    const ev = this.calculateEVWithConfidence(bet, trueProbability, actualVig);
    
    return {
      expected_value: ev.value,
      confidence_interval: ev.confidence,
      edge_quality: this.classifyEdgeQuality(ev, marketEfficiency),
      betting_recommendation: this.generateRecommendation(ev, bet)
    };
  }

  // Analyze sharp bookmaker consensus for true line
  getSharpConsensus(bet, marketData) {
    const sharpLines = marketData.filter(m => 
      this.sharpBookmakers.includes(m.bookmaker)
    );
    
    if (sharpLines.length === 0) {
      return null;
    }
    
    // Weight by volume and time
    const weightedOdds = sharpLines.reduce((acc, line) => {
      const weight = this.getLineWeight(line);
      return acc + (line.odds * weight);
    }, 0) / sharpLines.length;
    
    return {
      consensus_odds: weightedOdds,
      sharp_books_count: sharpLines.length,
      line_movement: this.detectLineMovement(sharpLines),
      steam_move: this.detectSteamMove(sharpLines)
    };
  }

  // Find value in recreational sportsbook inefficiencies
  analyzeRecreationalValue(bet, marketData) {
    const recLines = marketData.filter(m => 
      this.recreationalBooks.includes(m.bookmaker)
    );
    
    // Look for outliers and slow-moving lines
    const outliers = [];
    const mean = this.calculateMeanOdds(recLines);
    const stdDev = this.calculateStdDev(recLines, mean);
    
    for (const line of recLines) {
      const zScore = Math.abs((line.odds - mean) / stdDev);
      if (zScore > 1.5) { // 1.5 standard deviations
        outliers.push({
          bookmaker: line.bookmaker,
          odds: line.odds,
          z_score: zScore,
          value_type: line.odds > mean ? 'positive_outlier' : 'negative_outlier'
        });
      }
    }
    
    return {
      outliers,
      has_value: outliers.length > 0,
      best_value: outliers[0] || null,
      mean_recreational_odds: mean
    };
  }

  // Calculate market efficiency score
  calculateMarketEfficiency(bet, marketData) {
    const metrics = {
      book_agreement: this.calculateBookmakerAgreement(marketData),
      liquidity_score: this.estimateLiquidity(bet, marketData),
      line_stability: this.calculateLineStability(marketData),
      vig_consistency: this.calculateVigConsistency(marketData)
    };
    
    // Weighted efficiency score
    const efficiency = (
      metrics.book_agreement * 0.3 +
      metrics.liquidity_score * 0.25 +
      metrics.line_stability * 0.25 +
      metrics.vig_consistency * 0.2
    );
    
    return {
      score: efficiency,
      metrics,
      market_type: this.classifyMarket(efficiency),
      arbitrage_potential: this.detectArbitrage(marketData)
    };
  }

  // Advanced probability calculation using multiple models
  async calculateTrueProbability(bet, sharpConsensus, recValue, efficiency) {
    const models = [];
    
    // Model 1: Sharp line de-vigging
    if (sharpConsensus) {
      const sharpProb = this.deVigProbability(sharpConsensus.consensus_odds);
      models.push({ prob: sharpProb, weight: 0.4, source: 'sharp_consensus' });
    }
    
    // Model 2: Market efficiency-based
    const efficiencyProb = this.efficiencyBasedProbability(bet, efficiency);
    models.push({ prob: efficiencyProb, weight: 0.3, source: 'market_efficiency' });
    
    // Model 3: Historical performance (if available)
    const historicalProb = await this.getHistoricalProbability(bet);
    if (historicalProb) {
      models.push({ prob: historicalProb, weight: 0.2, source: 'historical' });
    }
    
    // Model 4: Line movement analysis
    if (sharpConsensus?.line_movement) {
      const movementProb = this.lineMovementProbability(sharpConsensus.line_movement);
      models.push({ prob: movementProb, weight: 0.1, source: 'line_movement' });
    }
    
    // Weighted average with confidence adjustment
    const totalWeight = models.reduce((sum, m) => sum + m.weight, 0);
    const weightedProb = models.reduce((sum, m) => 
      sum + (m.prob * m.weight / totalWeight), 0
    );
    
    return {
      probability: weightedProb,
      models_used: models.length,
      confidence: this.calculateProbabilityConfidence(models),
      primary_model: models[0]?.source || 'market_based'
    };
  }

  // Dynamic vig calculation based on actual market conditions
  calculateDynamicVig(bet, marketData) {
    // Calculate actual vig from both sides of market
    const vigData = [];
    
    for (const book of marketData) {
      if (book.markets?.h2h) {
        const homeOdds = book.markets.h2h.home;
        const awayOdds = book.markets.h2h.away;
        
        const homeProb = this.oddsToImpliedProb(homeOdds);
        const awayProb = this.oddsToImpliedProb(awayOdds);
        
        const totalProb = homeProb + awayProb;
        const vig = (totalProb - 1) / totalProb;
        
        vigData.push({
          bookmaker: book.bookmaker,
          vig: vig,
          is_sharp: this.sharpBookmakers.includes(book.bookmaker)
        });
      }
    }
    
    // Weight sharp book vig more heavily
    const weightedVig = vigData.reduce((sum, v) => {
      const weight = v.is_sharp ? 0.7 : 0.3;
      return sum + (v.vig * weight);
    }, 0) / vigData.length;
    
    return {
      actual_vig: weightedVig,
      vig_range: {
        min: Math.min(...vigData.map(v => v.vig)),
        max: Math.max(...vigData.map(v => v.vig))
      },
      market_average: vigData.reduce((sum, v) => sum + v.vig, 0) / vigData.length
    };
  }

  // Calculate EV with confidence intervals
  calculateEVWithConfidence(bet, trueProbability, vigData) {
    const impliedProb = this.oddsToImpliedProb(bet.odds);
    const noVigProb = impliedProb / (1 + vigData.actual_vig);
    
    // Base EV calculation
    const decimal = this.americanToDecimal(bet.odds);
    const ev = (trueProbability.probability * decimal) - 1;
    
    // Calculate confidence interval using Monte Carlo simulation
    const simulations = 1000;
    const evResults = [];
    
    for (let i = 0; i < simulations; i++) {
      // Add variance to probability estimate
      const variance = (Math.random() - 0.5) * 0.1; // ±5% variance
      const simProb = Math.max(0.01, Math.min(0.99, 
        trueProbability.probability + variance
      ));
      
      const simEV = (simProb * decimal) - 1;
      evResults.push(simEV);
    }
    
    evResults.sort((a, b) => a - b);
    
    return {
      value: ev,
      confidence: {
        lower_95: evResults[Math.floor(simulations * 0.025)],
        lower_68: evResults[Math.floor(simulations * 0.16)],
        median: evResults[Math.floor(simulations * 0.5)],
        upper_68: evResults[Math.floor(simulations * 0.84)],
        upper_95: evResults[Math.floor(simulations * 0.975)]
      },
      probability_confidence: trueProbability.confidence,
      kelly_fraction: this.calculateKellyFraction(ev, trueProbability.probability)
    };
  }

  // Classify edge quality based on multiple factors
  classifyEdgeQuality(ev, marketEfficiency) {
    const evPercent = ev.value * 100;
    const confidence = ev.confidence;
    const efficiency = marketEfficiency.score;
    
    // High quality edge criteria
    if (evPercent > 5 && confidence.lower_68 > 0.02 && efficiency < 0.7) {
      return {
        grade: 'A',
        description: 'Premium edge - strong value with high confidence',
        bet_sizing: 'Full Kelly (2-3% of bankroll)'
      };
    }
    
    if (evPercent > 3 && confidence.lower_68 > 0.01 && efficiency < 0.8) {
      return {
        grade: 'B',
        description: 'Good edge - solid value opportunity',
        bet_sizing: 'Half Kelly (1-1.5% of bankroll)'
      };
    }
    
    if (evPercent > 2 && confidence.median > 0) {
      return {
        grade: 'C',
        description: 'Moderate edge - acceptable value',
        bet_sizing: 'Quarter Kelly (0.5-1% of bankroll)'
      };
    }
    
    return {
      grade: 'D',
      description: 'Marginal edge - consider passing',
      bet_sizing: 'Minimal or pass'
    };
  }

  // Generate specific betting recommendation
  generateRecommendation(ev, bet) {
    const evPercent = ev.value * 100;
    const kelly = ev.kelly_fraction;
    
    return {
      should_bet: evPercent > 2 && ev.confidence.lower_68 > 0,
      optimal_stake_percentage: Math.min(kelly * 0.25, 0.03), // Quarter Kelly, max 3%
      confidence_level: this.getConfidenceLevel(ev.probability_confidence),
      expected_roi: evPercent.toFixed(2) + '%',
      break_even_price: this.calculateBreakEvenPrice(bet, ev),
      notes: this.generateBettingNotes(ev, bet)
    };
  }

  // Helper methods
  oddsToImpliedProb(americanOdds) {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }

  americanToDecimal(americanOdds) {
    if (americanOdds > 0) {
      return (americanOdds / 100) + 1;
    } else {
      return (100 / Math.abs(americanOdds)) + 1;
    }
  }

  calculateKellyFraction(ev, probability) {
    // Kelly = (p * b - q) / b
    // where p = probability of winning, q = probability of losing, b = odds received
    const q = 1 - probability;
    const b = ev + 1; // decimal odds - 1
    
    const kelly = (probability * b - q) / b;
    return Math.max(0, Math.min(kelly, 0.25)); // Cap at 25%
  }

  deVigProbability(odds) {
    const implied = this.oddsToImpliedProb(odds);
    // Remove estimated vig (this should be more sophisticated)
    return implied * 0.97; // Simple 3% vig removal
  }

  // Additional helper methods would go here...
  calculateBookmakerAgreement(marketData) {
    // Calculate standard deviation of odds across books
    return 0.75; // Placeholder
  }

  estimateLiquidity(bet, marketData) {
    // Estimate based on sport, market type, and book coverage
    return 0.8; // Placeholder
  }

  calculateLineStability(marketData) {
    // Analyze line movement patterns
    return 0.7; // Placeholder
  }

  calculateVigConsistency(marketData) {
    // Check vig variance across books
    return 0.85; // Placeholder
  }

  classifyMarket(efficiency) {
    if (efficiency > 0.9) return 'highly_efficient';
    if (efficiency > 0.7) return 'moderately_efficient';
    if (efficiency > 0.5) return 'somewhat_efficient';
    return 'inefficient';
  }

  detectArbitrage(marketData) {
    // Check for arbitrage opportunities
    return false; // Placeholder
  }

  efficiencyBasedProbability(bet, efficiency) {
    // Use market efficiency to estimate true probability
    return 0.5; // Placeholder
  }

  async getHistoricalProbability(bet) {
    // Fetch historical performance data
    return null; // Placeholder
  }

  lineMovementProbability(movement) {
    // Analyze line movement for probability insights
    return 0.5; // Placeholder
  }

  calculateProbabilityConfidence(models) {
    // Calculate confidence based on model agreement
    return 0.7; // Placeholder
  }

  getLineWeight(line) {
    // Weight lines by recency and volume
    return 1.0; // Placeholder
  }

  detectLineMovement(lines) {
    // Detect significant line movements
    return null; // Placeholder
  }

  detectSteamMove(lines) {
    // Detect steam moves (sharp action)
    return false; // Placeholder
  }

  calculateMeanOdds(lines) {
    const sum = lines.reduce((acc, line) => acc + line.odds, 0);
    return sum / lines.length;
  }

  calculateStdDev(lines, mean) {
    const variance = lines.reduce((acc, line) => 
      acc + Math.pow(line.odds - mean, 2), 0
    ) / lines.length;
    return Math.sqrt(variance);
  }

  getConfidenceLevel(confidence) {
    if (confidence > 0.8) return 'HIGH';
    if (confidence > 0.6) return 'MEDIUM';
    return 'LOW';
  }

  calculateBreakEvenPrice(bet, ev) {
    // Calculate the odds at which EV = 0
    const probability = ev.probability_confidence;
    const decimal = 1 / probability;
    
    if (decimal >= 2) {
      return '+' + Math.round((decimal - 1) * 100);
    } else {
      return Math.round(-100 / (decimal - 1));
    }
  }

  generateBettingNotes(ev, bet) {
    const notes = [];
    
    if (ev.value > 0.05) {
      notes.push('Strong positive EV opportunity');
    }
    
    if (ev.confidence.lower_68 > 0.02) {
      notes.push('High confidence in edge');
    }
    
    if (ev.kelly_fraction > 0.03) {
      notes.push('Consider larger position size');
    }
    
    return notes.join('. ');
  }
}

export default new EnhancedEVCalculator();