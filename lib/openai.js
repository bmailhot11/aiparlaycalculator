// Temporary mock version for testing uploads
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

  // Mock response for testing
  const mockAnalysis = {
    bet_slip_details: {
      sportsbook: "DraftKings",
      bet_type: "3-Leg Parlay",
      total_stake: "$25.00",
      potential_payout: "$187.50",
      total_odds: "+650",
      legs: [
        {
          game: "Chiefs vs Bills",
          bet: "Chiefs ML",
          odds: "-110",
          stake: "$8.33",
          confidence: 75
        },
        {
          game: "Lakers vs Warriors",
          bet: "Over 225.5 Points",
          odds: "+105",
          stake: "$8.33",
          confidence: 68
        },
        {
          game: "Rangers vs Bruins",
          bet: "Under 6.5 Goals",
          odds: "-115",
          stake: "$8.34",
          confidence: 72
        }
      ]
    },
    optimization: {
      current_expected_value: "+2.4%",
      optimized_expected_value: "+4.1%",
      risk_level: "Medium",
      variance: "Medium",
      recommendations: [
        "Consider reducing stake on lowest confidence leg",
        "Lakers/Warriors total has good value at current line",
        "Chiefs ML is fairly priced but safe pick"
      ]
    },
    alternatives: [
      {
        description: "Higher confidence 2-leg parlay",
        legs: ["Chiefs ML", "Under 6.5 Goals Rangers/Bruins"],
        odds: "+280",
        expected_value: "+5.2%",
        recommendation: "Better risk/reward ratio with higher confidence picks"
      }
    ],
    bankroll_management: {
      recommended_stake: "$20.00",
      risk_percentage: "2.0%",
      kelly_criterion: "1.8%",
      max_recommended: "$30.00"
    }
  };

  return res.status(200).json({
    success: true,
    analysis: mockAnalysis
  });
}