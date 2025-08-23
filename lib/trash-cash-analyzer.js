// Trash/Cash Analysis Engine
// Determines if a bet is "Cash" (good) or "Trash" (bad) based on multiple factors

import { OddsHistoryDB, GameResultsDB } from './database.js';

export class TrashCashAnalyzer {
  constructor() {
    this.weights = {
      expectedValue: 0.30,      // 30% - Most important factor
      lineMovement: 0.25,       // 25% - Sharp money indicator
      teamForm: 0.20,           // 20% - Recent team performance
      headToHead: 0.15,         // 15% - Historical matchups
      valueDiscrepancy: 0.10    // 10% - Odds differences across books
    };
  }

  // Main analysis function
  async analyzeBet(betData) {
    try {
      console.log('[TrashCashAnalyzer] Starting analysis for bet:', betData.type);
      
      const analysis = {
        overall: 'ANALYZING',
        score: 0,
        confidence: 0,
        factors: {},
        reasoning: [],
        recommendation: '',
        timestamp: new Date().toISOString()
      };

      // Analyze each leg of the bet
      const legAnalyses = [];
      for (const leg of betData.legs) {
        const legAnalysis = await this.analyzeLeg(leg);
        legAnalyses.push(legAnalysis);
      }

      // Calculate overall score
      analysis.score = this.calculateOverallScore(legAnalyses);
      analysis.confidence = this.calculateConfidence(legAnalyses);
      analysis.factors = this.aggregateFactors(legAnalyses);
      
      // Determine Cash vs Trash
      if (analysis.score >= 70) {
        analysis.overall = 'CASH';
        analysis.recommendation = 'Strong bet with positive expected value';
      } else if (analysis.score >= 50) {
        analysis.overall = 'LEAN CASH';
        analysis.recommendation = 'Decent bet but proceed with caution';
      } else if (analysis.score >= 30) {
        analysis.overall = 'LEAN TRASH';
        analysis.recommendation = 'Risky bet - consider smaller stake';
      } else {
        analysis.overall = 'TRASH';
        analysis.recommendation = 'Avoid this bet - poor value';
      }

      // Generate detailed reasoning
      analysis.reasoning = this.generateReasoning(analysis.factors, legAnalyses);

      console.log('[TrashCashAnalyzer] Analysis complete:', analysis.overall, `(${analysis.score}/100)`);
      return analysis;

    } catch (error) {
      console.error('[TrashCashAnalyzer] Error during analysis:', error);
      return {
        overall: 'ERROR',
        score: 0,
        confidence: 0,
        factors: {},
        reasoning: ['Unable to complete analysis due to data issues'],
        recommendation: 'Cannot determine bet quality',
        error: error.message
      };
    }
  }

  // Analyze individual bet leg
  async analyzeLeg(leg) {
    const analysis = {
      team: leg.team,
      market: leg.market,
      odds: leg.odds,
      factors: {
        expectedValue: 0,
        lineMovement: 0,
        teamForm: 0,
        headToHead: 0,
        valueDiscrepancy: 0
      },
      score: 0
    };

    try {
      // 1. Calculate Expected Value
      analysis.factors.expectedValue = await this.calculateExpectedValue(leg);
      
      // 2. Analyze Line Movement
      analysis.factors.lineMovement = await this.analyzeLineMovement(leg);
      
      // 3. Team Form Analysis
      analysis.factors.teamForm = await this.analyzeTeamForm(leg);
      
      // 4. Head-to-Head Analysis
      analysis.factors.headToHead = await this.analyzeHeadToHead(leg);
      
      // 5. Value Discrepancy (if multiple books available)
      analysis.factors.valueDiscrepancy = await this.analyzeValueDiscrepancy(leg);

      // Calculate weighted score for this leg
      analysis.score = this.calculateLegScore(analysis.factors);

      return analysis;

    } catch (error) {
      console.error('[TrashCashAnalyzer] Error analyzing leg:', error);
      analysis.factors = Object.fromEntries(Object.keys(analysis.factors).map(key => [key, 0]));
      return analysis;
    }
  }

  // Calculate Expected Value based on implied probability vs real probability
  async calculateExpectedValue(leg) {
    try {
      // Convert American odds to decimal
      const decimalOdds = this.americanToDecimal(leg.odds);
      const impliedProbability = 1 / decimalOdds;

      // Estimate true probability based on historical data and team stats
      const trueProbability = await this.estimateTrueProbability(leg);

      if (trueProbability <= 0) {
        return 0; // No data available
      }

      // Calculate EV: (true_prob * payout) - (1 - true_prob) * stake
      const expectedValue = (trueProbability * (decimalOdds - 1)) - (1 - trueProbability);
      
      // Scale to 0-100 (positive EV = higher score)
      if (expectedValue > 0.1) return 100;
      if (expectedValue > 0.05) return 80;
      if (expectedValue > 0) return 60;
      if (expectedValue > -0.05) return 40;
      if (expectedValue > -0.1) return 20;
      return 0;

    } catch (error) {
      console.error('[EV Calculation Error]:', error);
      return 50; // Neutral if can't calculate
    }
  }

  // Analyze line movement (sharp money indicator)
  async analyzeLineMovement(leg) {
    try {
      if (!leg.gameId) {
        return 50; // Neutral if no game ID
      }

      const movement = OddsHistoryDB.calculateLineMovement(leg.gameId, leg.marketType || 'h2h');
      
      if (movement.trend === 'insufficient_data') {
        return 40; // Slight negative for lack of data
      }

      // Sharp money typically moves lines against public betting
      // If line is moving toward your bet, that's good
      // If moving away, that's concerning
      
      if (movement.trend === 'increasing' && leg.odds > 0) {
        return 80; // Line moving up on underdog = sharp money
      }
      if (movement.trend === 'decreasing' && leg.odds < 0) {
        return 80; // Line moving down on favorite = sharp money
      }
      if (movement.trend === 'stable') {
        return 60; // Stable lines can be good
      }
      
      return 30; // Movement against your position

    } catch (error) {
      console.error('[Line Movement Error]:', error);
      return 50;
    }
  }

  // Analyze team form
  async analyzeTeamForm(leg) {
    try {
      const teamName = this.extractTeamName(leg.team);
      const sport = this.determineSport(leg);
      
      if (!teamName || !sport) {
        return 50;
      }

      const teamStats = GameResultsDB.getTeamStats(teamName, sport, 10);
      
      if (teamStats.gamesPlayed < 3) {
        return 40; // Not enough data
      }

      const winRate = teamStats.winPercentage;
      
      // Score based on recent form
      if (winRate >= 80) return 90;
      if (winRate >= 70) return 80;
      if (winRate >= 60) return 70;
      if (winRate >= 50) return 60;
      if (winRate >= 40) return 40;
      if (winRate >= 30) return 30;
      return 20;

    } catch (error) {
      console.error('[Team Form Error]:', error);
      return 50;
    }
  }

  // Analyze head-to-head matchup
  async analyzeHeadToHead(leg) {
    try {
      const teams = this.extractMatchupTeams(leg);
      if (!teams || teams.length !== 2) {
        return 50;
      }

      const sport = this.determineSport(leg);
      const h2h = GameResultsDB.getHeadToHeadRecord(teams[0], teams[1], sport, 5);
      
      if (h2h.gamesPlayed < 2) {
        return 50; // Not enough historical data
      }

      // Determine which team you're betting on
      const yourTeam = this.extractTeamName(leg.team);
      
      if (yourTeam === teams[0]) {
        const winRate = (h2h.team1Wins / h2h.gamesPlayed) * 100;
        return this.winRateToScore(winRate);
      } else if (yourTeam === teams[1]) {
        const winRate = (h2h.team2Wins / h2h.gamesPlayed) * 100;
        return this.winRateToScore(winRate);
      }

      return 50;

    } catch (error) {
      console.error('[Head-to-Head Error]:', error);
      return 50;
    }
  }

  // Analyze value discrepancy across sportsbooks
  async analyzeValueDiscrepancy(leg) {
    try {
      // This would compare odds across different sportsbooks
      // For now, return neutral score since we need market data
      return 50;
    } catch (error) {
      return 50;
    }
  }

  // Calculate overall score from leg analyses
  calculateOverallScore(legAnalyses) {
    if (legAnalyses.length === 0) return 0;
    
    const totalScore = legAnalyses.reduce((sum, leg) => sum + leg.score, 0);
    const averageScore = totalScore / legAnalyses.length;
    
    // Apply parlay penalty (more legs = lower score)
    if (legAnalyses.length > 3) {
      return Math.max(0, averageScore - (legAnalyses.length - 3) * 5);
    }
    
    return Math.round(averageScore);
  }

  // Calculate confidence level
  calculateConfidence(legAnalyses) {
    const dataAvailability = legAnalyses.reduce((sum, leg) => {
      const dataPoints = Object.values(leg.factors).filter(score => score !== 50).length;
      return sum + dataPoints;
    }, 0);
    
    const maxDataPoints = legAnalyses.length * 5;
    return Math.round((dataAvailability / maxDataPoints) * 100);
  }

  // Aggregate factors across all legs
  aggregateFactors(legAnalyses) {
    const factors = {
      expectedValue: 0,
      lineMovement: 0,
      teamForm: 0,
      headToHead: 0,
      valueDiscrepancy: 0
    };

    if (legAnalyses.length === 0) return factors;

    Object.keys(factors).forEach(factor => {
      const total = legAnalyses.reduce((sum, leg) => sum + leg.factors[factor], 0);
      factors[factor] = Math.round(total / legAnalyses.length);
    });

    return factors;
  }

  // Calculate weighted score for a single leg
  calculateLegScore(factors) {
    return Math.round(
      factors.expectedValue * this.weights.expectedValue +
      factors.lineMovement * this.weights.lineMovement +
      factors.teamForm * this.weights.teamForm +
      factors.headToHead * this.weights.headToHead +
      factors.valueDiscrepancy * this.weights.valueDiscrepancy
    );
  }

  // Generate human-readable reasoning
  generateReasoning(factors, legAnalyses) {
    const reasoning = [];
    
    // Expected Value reasoning
    if (factors.expectedValue >= 70) {
      reasoning.push("Strong positive expected value indicates good long-term profitability");
    } else if (factors.expectedValue <= 30) {
      reasoning.push("Poor expected value suggests this bet may lose money over time");
    }

    // Line Movement reasoning
    if (factors.lineMovement >= 70) {
      reasoning.push("Line movement indicates sharp money is on your side");
    } else if (factors.lineMovement <= 30) {
      reasoning.push("Line movement suggests you're betting against sharp money");
    }

    // Team Form reasoning
    if (factors.teamForm >= 70) {
      reasoning.push("Teams are in excellent recent form");
    } else if (factors.teamForm <= 30) {
      reasoning.push("Teams have been struggling recently");
    }

    // Parlay warning
    if (legAnalyses.length > 3) {
      reasoning.push(`${legAnalyses.length}-leg parlay significantly reduces win probability`);
    }

    return reasoning.length > 0 ? reasoning : ["Analysis based on limited available data"];
  }

  // Estimate true probability for a bet
  async estimateTrueProbability(leg) {
    try {
      const teamName = this.extractTeamName(leg.team);
      const sport = this.determineSport(leg);
      
      if (!teamName || !sport) {
        return 0.5; // 50% if no data
      }

      const teamStats = GameResultsDB.getTeamStats(teamName, sport, 10);
      
      if (teamStats.gamesPlayed < 3) {
        return 0.5;
      }

      // Simple model: recent win rate adjusted for market type
      let baseProbability = teamStats.winPercentage / 100;
      
      // Adjust based on bet type
      if (leg.market && leg.market.includes('ML')) {
        // Moneyline - use win rate directly
        return baseProbability;
      } else if (leg.market && leg.market.includes('spread')) {
        // Spread - adjust based on average margin
        return baseProbability * 0.9; // Conservative estimate
      } else if (leg.market && leg.market.includes('total')) {
        // Totals - harder to predict, use neutral
        return 0.5;
      }

      return baseProbability;

    } catch (error) {
      return 0.5;
    }
  }

  // Utility functions
  americanToDecimal(americanOdds) {
    const odds = parseInt(americanOdds);
    if (odds > 0) {
      return (odds / 100) + 1;
    } else {
      return (100 / Math.abs(odds)) + 1;
    }
  }

  winRateToScore(winRate) {
    if (winRate >= 80) return 90;
    if (winRate >= 70) return 80;
    if (winRate >= 60) return 70;
    if (winRate >= 50) return 60;
    if (winRate >= 40) return 40;
    if (winRate >= 30) return 30;
    return 20;
  }

  extractTeamName(teamString) {
    // Simple team name extraction
    if (typeof teamString !== 'string') return null;
    return teamString.split(' ')[0]; // Take first word as team name
  }

  extractMatchupTeams(leg) {
    // Extract both teams from leg data
    // This is a simplified version - you'd need to parse actual bet text
    if (leg.matchup) {
      return leg.matchup.split(' vs ');
    }
    return null;
  }

  determineSport(leg) {
    // Determine sport from leg data
    if (leg.sport) return leg.sport;
    if (leg.league) {
      const leagueMap = {
        'NFL': 'NFL',
        'NBA': 'NBA',
        'NHL': 'NHL',
        'MLB': 'MLB',
        'NCAAF': 'NCAAF',
        'NCAAB': 'NCAAB'
      };
      return leagueMap[leg.league] || 'NFL';
    }
    return 'NFL'; // Default
  }
}