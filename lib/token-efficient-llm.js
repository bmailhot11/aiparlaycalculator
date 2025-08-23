// TOKEN-EFFICIENT LLM SYSTEM
// Rules: ≤100 tokens per response, aggressive caching, mathematical pre-computation

import OpenAI from 'openai';
import cacheLayer from './optimized-cache-layer.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class TokenEfficientLLM {
  constructor() {
    this.models = {
      micro: 'gpt-4o-mini',        // Cheapest for simple tasks
      standard: 'gpt-4o',         // For complex analysis only
      fallback: 'gpt-3.5-turbo'   // Emergency fallback
    };
    
    this.tokenLimits = {
      max_response_tokens: 100,    // NEVER exceed 100 tokens
      max_prompt_tokens: 500,      // Keep prompts concise
      cache_duration_hours: 24     // Aggressive caching
    };
    
    this.usage = {
      total_tokens: 0,
      cached_responses: 0,
      api_calls: 0
    };
  }

  // =============================================================================
  // 1. ULTRA-COMPACT PROMPTS (MATHEMATICAL PRE-COMPUTATION)
  // =============================================================================

  async generateBetAnalysis(betData, useCache = true) {
    // Pre-compute ALL math in JavaScript (NO LLM math calculations)
    const analysis = this.preComputeAnalysis(betData);
    
    // LLM only provides 1-line user-friendly summary
    const prompt = `EV:${analysis.ev}%, Prob:${analysis.probability}%, Risk:${analysis.risk_level}. 1-line summary:`;
    
    if (useCache) {
      const cached = await cacheLayer.getCachedLLMResponse(prompt, this.models.micro, 0.1);
      if (cached) {
        this.usage.cached_responses++;
        return { ...analysis, summary: cached.summary, cached: true };
      }
    }
    
    try {
      const response = await openai.chat.completions.create({
        model: this.models.micro,
        messages: [
          {
            role: 'system',
            content: 'Provide 1-line bet summary. Max 15 words. JSON: {"summary":"text"}'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 50, // Very restrictive
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      const tokenCount = response.usage.total_tokens;
      
      // Cache the response
      await cacheLayer.setCachedLLMResponse(prompt, this.models.micro, 0.1, result, tokenCount);
      
      this.usage.total_tokens += tokenCount;
      this.usage.api_calls++;
      
      return {
        ...analysis,
        summary: result.summary,
        cached: false,
        tokens_used: tokenCount
      };
    } catch (error) {
      console.error('❌ [LLM] Analysis failed:', error.message);
      return {
        ...analysis,
        summary: this.getFallbackSummary(analysis),
        cached: false,
        error: error.message
      };
    }
  }

  // ALL MATHEMATICAL CALCULATIONS DONE HERE (NO LLM TOKENS)
  preComputeAnalysis(betData) {
    const { odds, stake, probability, line_movement } = betData;
    
    // Expected Value calculation
    const decimal_odds = this.americanToDecimal(odds);
    const ev = ((probability / 100) * (decimal_odds - 1) - (1 - probability / 100)) * 100;
    
    // Risk assessment
    const risk_level = this.calculateRiskLevel(odds, line_movement);
    
    // Confidence score
    const confidence = this.calculateConfidence(probability, line_movement);
    
    // Kelly Criterion
    const kelly = probability > 0 ? ((probability / 100) * decimal_odds - 1) / (decimal_odds - 1) : 0;
    
    return {
      expected_value: parseFloat(ev.toFixed(2)),
      probability: probability,
      decimal_odds: decimal_odds,
      risk_level: risk_level,
      confidence_score: parseFloat(confidence.toFixed(2)),
      kelly_percentage: parseFloat((kelly * 100).toFixed(2)),
      break_even_rate: parseFloat((100 / decimal_odds).toFixed(2)),
      roi_potential: parseFloat(((decimal_odds - 1) * 100).toFixed(2)),
      computed_at: new Date().toISOString()
    };
  }

  // =============================================================================
  // 2. PARLAY ANALYSIS (MINIMAL TOKENS)
  // =============================================================================

  async generateParlayAnalysis(parlayLegs, useCache = true) {
    // Pre-compute parlay mathematics
    const analysis = this.preComputeParlayAnalysis(parlayLegs);
    
    // Ultra-compact prompt for LLM
    const prompt = `${parlayLegs.length}-leg parlay, ${analysis.total_odds}, ${analysis.win_probability}% win rate, ${analysis.expected_value}% EV. Risk assessment:`;
    
    if (useCache) {
      const cached = await cacheLayer.getCachedLLMResponse(prompt, this.models.micro, 0.1);
      if (cached) {
        this.usage.cached_responses++;
        return { ...analysis, assessment: cached.assessment, cached: true };
      }
    }
    
    try {
      const response = await openai.chat.completions.create({
        model: this.models.micro,
        messages: [
          {
            role: 'system',
            content: 'Risk assessment in 10 words max. JSON: {"assessment":"text","confidence":"high/medium/low"}'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 40,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      const tokenCount = response.usage.total_tokens;
      
      await cacheLayer.setCachedLLMResponse(prompt, this.models.micro, 0.1, result, tokenCount);
      
      this.usage.total_tokens += tokenCount;
      this.usage.api_calls++;
      
      return {
        ...analysis,
        assessment: result.assessment,
        ai_confidence: result.confidence,
        cached: false,
        tokens_used: tokenCount
      };
    } catch (error) {
      return {
        ...analysis,
        assessment: this.getFallbackParlayAssessment(analysis),
        ai_confidence: 'medium',
        cached: false,
        error: error.message
      };
    }
  }

  preComputeParlayAnalysis(legs) {
    const totalDecimalOdds = legs.reduce((product, leg) => 
      product * this.americanToDecimal(leg.odds), 1);
    
    const totalAmericanOdds = this.decimalToAmerican(totalDecimalOdds);
    const winProbability = legs.reduce((product, leg) => 
      product * (leg.probability || this.impliedProbability(leg.odds)) / 100, 1) * 100;
    
    const expectedValue = (winProbability / 100 * totalDecimalOdds - 1) * 100;
    
    const variance = legs.reduce((sum, leg) => {
      const prob = (leg.probability || this.impliedProbability(leg.odds)) / 100;
      return sum + prob * (1 - prob);
    }, 0);
    
    return {
      leg_count: legs.length,
      total_decimal_odds: parseFloat(totalDecimalOdds.toFixed(2)),
      total_odds: this.formatOdds(totalAmericanOdds),
      win_probability: parseFloat(winProbability.toFixed(2)),
      expected_value: parseFloat(expectedValue.toFixed(2)),
      variance: parseFloat(variance.toFixed(3)),
      risk_score: this.calculateParlayRisk(legs.length, variance),
      potential_payout: parseFloat((totalDecimalOdds - 1).toFixed(2)),
      break_even_rate: parseFloat((100 / totalDecimalOdds).toFixed(2))
    };
  }

  // =============================================================================
  // 3. MARKET MOVEMENT ANALYSIS (BATCH PROCESSING)
  // =============================================================================

  async batchAnalyzeMovements(movements, useCache = true) {
    // Process movements in batches to minimize API calls
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < movements.length; i += batchSize) {
      const batch = movements.slice(i, i + batchSize);
      const batchAnalysis = await this.analyzeBatchMovements(batch, useCache);
      results.push(...batchAnalysis);
    }
    
    return results;
  }

  async analyzeBatchMovements(batch, useCache = true) {
    // Pre-compute all movement statistics
    const stats = batch.map(movement => this.preComputeMovementStats(movement));
    
    // Create ultra-compact batch prompt
    const prompt = `Movements: ${stats.map(s => 
      `${s.direction}${s.magnitude}%`
    ).join(',')}. Trends:`;
    
    if (useCache) {
      const cached = await cacheLayer.getCachedLLMResponse(prompt, this.models.micro, 0.2);
      if (cached) {
        this.usage.cached_responses++;
        return stats.map((stat, idx) => ({
          ...stat,
          trend_analysis: cached.trends[idx] || 'stable',
          cached: true
        }));
      }
    }
    
    try {
      const response = await openai.chat.completions.create({
        model: this.models.micro,
        messages: [
          {
            role: 'system', 
            content: 'Analyze trends in 1-2 words each. JSON: {"trends":["word","word"]}'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 60,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      const tokenCount = response.usage.total_tokens;
      
      await cacheLayer.setCachedLLMResponse(prompt, this.models.micro, 0.2, result, tokenCount);
      
      this.usage.total_tokens += tokenCount;
      this.usage.api_calls++;
      
      return stats.map((stat, idx) => ({
        ...stat,
        trend_analysis: result.trends[idx] || 'stable',
        cached: false
      }));
    } catch (error) {
      return stats.map(stat => ({
        ...stat,
        trend_analysis: 'unknown',
        cached: false,
        error: error.message
      }));
    }
  }

  preComputeMovementStats(movement) {
    const { opening_odds, current_odds, volume, time_elapsed } = movement;
    
    const openingDecimal = this.americanToDecimal(opening_odds);
    const currentDecimal = this.americanToDecimal(current_odds);
    
    const percentChange = ((currentDecimal - openingDecimal) / openingDecimal) * 100;
    const direction = percentChange > 0 ? '+' : '';
    const velocity = Math.abs(percentChange) / (time_elapsed / 3600); // % per hour
    
    return {
      opening_odds,
      current_odds,
      percent_change: parseFloat(percentChange.toFixed(2)),
      direction: direction,
      magnitude: Math.abs(parseFloat(percentChange.toFixed(1))),
      velocity: parseFloat(velocity.toFixed(2)),
      volume_score: this.calculateVolumeScore(volume),
      significance: this.calculateMovementSignificance(percentChange, volume)
    };
  }

  // =============================================================================
  // 4. UTILITY FUNCTIONS (NO TOKEN USAGE)
  // =============================================================================

  americanToDecimal(american) {
    if (american > 0) {
      return (american / 100) + 1;
    } else {
      return (100 / Math.abs(american)) + 1;
    }
  }

  decimalToAmerican(decimal) {
    if (decimal >= 2) {
      return Math.round((decimal - 1) * 100);
    } else {
      return Math.round(-100 / (decimal - 1));
    }
  }

  impliedProbability(americanOdds) {
    const decimal = this.americanToDecimal(americanOdds);
    return (1 / decimal) * 100;
  }

  formatOdds(odds) {
    return odds > 0 ? `+${odds}` : `${odds}`;
  }

  calculateRiskLevel(odds, lineMovement) {
    const absOdds = Math.abs(odds);
    const movement = Math.abs(lineMovement || 0);
    
    if (absOdds > 200 || movement > 10) return 'high';
    if (absOdds > 150 || movement > 5) return 'medium';
    return 'low';
  }

  calculateConfidence(probability, lineMovement) {
    const stability = Math.max(0, 1 - Math.abs(lineMovement || 0) / 20);
    const probConfidence = probability > 60 ? 0.9 : probability > 45 ? 0.7 : 0.5;
    return stability * probConfidence * 100;
  }

  calculateParlayRisk(legCount, variance) {
    const baseRisk = Math.min(legCount * 0.2, 1);
    const varianceRisk = Math.min(variance * 2, 1);
    return Math.min(baseRisk + varianceRisk, 1) * 100;
  }

  calculateVolumeScore(volume) {
    if (!volume) return 0;
    if (volume > 1000) return 100;
    if (volume > 500) return 75;
    if (volume > 100) return 50;
    return 25;
  }

  calculateMovementSignificance(percentChange, volume) {
    const magnitude = Math.abs(percentChange);
    const volumeMultiplier = (volume || 0) > 500 ? 1.5 : 1;
    
    if (magnitude > 10) return 'high';
    if (magnitude > 5) return volume > 300 ? 'high' : 'medium';
    if (magnitude > 2) return volume > 500 ? 'medium' : 'low';
    return 'minimal';
  }

  // =============================================================================
  // 5. FALLBACK RESPONSES (ZERO TOKEN COST)
  // =============================================================================

  getFallbackSummary(analysis) {
    if (analysis.expected_value > 5) return 'Strong positive expected value bet';
    if (analysis.expected_value > 0) return 'Slight edge, positive expected value';
    if (analysis.expected_value > -3) return 'Close to fair value';
    return 'Below expected value';
  }

  getFallbackParlayAssessment(analysis) {
    if (analysis.leg_count > 5) return 'High-risk long shot parlay';
    if (analysis.expected_value > 0) return 'Positive EV parlay opportunity';
    if (analysis.win_probability > 25) return 'Reasonable win probability';
    return 'Long odds parlay bet';
  }

  // =============================================================================
  // 6. USAGE MONITORING & TOKEN LIMITS
  // =============================================================================

  getUsageStats() {
    return {
      ...this.usage,
      cache_hit_rate: this.usage.cached_responses > 0 ? 
        ((this.usage.cached_responses / (this.usage.cached_responses + this.usage.api_calls)) * 100).toFixed(1) + '%' : '0%',
      average_tokens_per_call: this.usage.api_calls > 0 ? 
        (this.usage.total_tokens / this.usage.api_calls).toFixed(1) : 0,
      estimated_cost: this.estimateCost(),
      token_efficiency: 'Optimized for <100 tokens per response'
    };
  }

  estimateCost() {
    // Rough cost estimation for GPT-4o-mini
    const costPerToken = 0.00015 / 1000; // $0.15 per 1M tokens
    return (this.usage.total_tokens * costPerToken).toFixed(4);
  }

  async resetUsageStats() {
    this.usage = {
      total_tokens: 0,
      cached_responses: 0,
      api_calls: 0
    };
    return { success: true, message: 'Usage stats reset' };
  }
}

// Export singleton
const tokenEfficientLLM = new TokenEfficientLLM();
export default tokenEfficientLLM;