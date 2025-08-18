import openai from '../../lib/openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { parlay, totalOdds } = req.body;
  
  if (!parlay || !Array.isArray(parlay) || parlay.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Parlay legs required' 
    });
  }

  try {
    console.log(`🔍 Finding best sportsbook for ${parlay.length}-leg parlay...`);
    
    // Use GPT to calculate final returns and analyze the parlay
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a sports betting analyst. Calculate precise returns and recommend the best sportsbook. Return valid JSON only."
        },
        {
          role: "user",
          content: `Analyze this ${parlay.length}-leg parlay and calculate final returns:

PARLAY DETAILS:
${parlay.map((leg, i) => `${i+1}. ${leg.game || 'Game'} - ${leg.selection} ${leg.odds} (${leg.sportsbook || 'Unknown'})`).join('\n')}

TOTAL ODDS: ${totalOdds || 'Calculate from individual legs'}

Calculate and return JSON:
{
  "calculated_total_odds": "precise total odds in +XXX format",
  "decimal_odds": "decimal version like 4.25",
  "confidence_assessment": "High/Medium/Low confidence with brief reason",
  "risk_profile": "Conservative/Balanced/Aggressive risk assessment", 
  "payout_100": "exact payout for $100 bet",
  "payout_50": "exact payout for $50 bet", 
  "payout_25": "exact payout for $25 bet",
  "recommended_sportsbook": "best sportsbook for this specific parlay",
  "sportsbook_reasoning": "why this book is best (1 sentence)",
  "win_probability": "estimated probability this parlay wins",
  "key_insights": ["2-3 brief strategic insights about this parlay"]
}`
        }
      ],
      max_tokens: 600,
      temperature: 0.3
    });

    const aiResponse = analysisResponse.choices[0].message.content;
    
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const analysis = JSON.parse(cleanedResponse);
      
      return res.status(200).json({
        success: true,
        analysis: analysis,
        parlay_summary: {
          legs: parlay.length,
          total_stake_recommended: parlay.length <= 3 ? 50 : parlay.length <= 5 ? 25 : 10,
          risk_level: parlay.length <= 3 ? 'Low' : parlay.length <= 5 ? 'Medium' : 'High'
        }
      });
      
    } catch (parseError) {
      console.error('Failed to parse GPT response:', parseError);
      
      // Fallback calculation
      const fallbackDecimal = parlay.reduce((total, leg) => {
        const odds = parseInt(leg.odds?.replace(/[+\-]/g, '') || '100');
        const decimal = leg.odds?.startsWith('-') ? (100 / odds) + 1 : (odds / 100) + 1;
        return total * decimal;
      }, 1);
      
      const fallbackAmerican = fallbackDecimal >= 2 ? 
        `+${Math.round((fallbackDecimal - 1) * 100)}` : 
        `${Math.round(-100 / (fallbackDecimal - 1))}`;
      
      return res.status(200).json({
        success: true,
        analysis: {
          calculated_total_odds: fallbackAmerican,
          decimal_odds: fallbackDecimal.toFixed(2),
          confidence_assessment: "Medium - mathematical calculation",
          risk_profile: parlay.length <= 3 ? "Conservative" : "Aggressive",
          payout_100: (100 * fallbackDecimal).toFixed(2),
          payout_50: (50 * fallbackDecimal).toFixed(2),
          payout_25: (25 * fallbackDecimal).toFixed(2),
          recommended_sportsbook: "DraftKings",
          sportsbook_reasoning: "Reliable odds and fast payouts",
          win_probability: `${(100 / fallbackDecimal).toFixed(1)}%`,
          key_insights: ["Mathematical parlay calculation", "Consider smaller stake for higher leg counts"]
        },
        parlay_summary: {
          legs: parlay.length,
          total_stake_recommended: parlay.length <= 3 ? 50 : 25,
          risk_level: parlay.length <= 3 ? 'Medium' : 'High'
        }
      });
    }

  } catch (error) {
    console.error('❌ Best sportsbook analysis error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze parlay',
      error: error.message
    });
  }
}