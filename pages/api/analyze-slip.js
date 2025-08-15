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
    console.log('🔍 Analyzing bet slip with OpenAI...');

    // Use OpenAI Vision to analyze the bet slip image
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use GPT-4 with vision
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this sports betting slip image and provide a detailed analysis in JSON format. Extract:

1. All bet details (teams, lines, odds, stake amounts)
2. Calculate risk assessment and expected value
3. Provide optimization recommendations
4. Suggest better alternatives
5. Give bankroll management advice

Return ONLY valid JSON in this exact format:
{
  "bet_slip_details": {
    "sportsbook": "detected sportsbook name",
    "bet_type": "type of bet (parlay, single, etc)",
    "total_stake": "$X.XX",
    "potential_payout": "$X.XX", 
    "total_odds": "+XXX or -XXX",
    "legs": [
      {
        "game": "Team A vs Team B",
        "bet": "bet description",
        "odds": "+XXX or -XXX",
        "stake": "$X.XX",
        "confidence": 1-100
      }
    ]
  },
  "optimization": {
    "current_expected_value": "+X.X% or -X.X%",
    "optimized_expected_value": "+X.X% or -X.X%",
    "risk_level": "Low/Medium/High/Very High",
    "variance": "Low/Medium/High/Very High",
    "recommendations": ["recommendation 1", "recommendation 2"]
  },
  "alternatives": [
    {
      "description": "alternative bet description",
      "legs": ["leg 1", "leg 2"],
      "odds": "+XXX",
      "expected_value": "+X.X%",
      "recommendation": "why this is better"
    }
  ],
  "bankroll_management": {
    "recommended_stake": "$X.XX",
    "risk_percentage": "X.X%",
    "kelly_criterion": "X.X%",
    "max_recommended": "$X.XX"
  }
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
      max_tokens: 2000,
      temperature: 0.3
    });

    const aiResponse = response.choices[0].message.content;
    console.log('🤖 OpenAI Response:', aiResponse);

    // Parse the JSON response
    let analysis;
    try {
      // Remove any markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      
      // Fallback to mock data if parsing fails
      analysis = {
        bet_slip_details: {
          sportsbook: "Unable to detect",
          bet_type: "Analysis Error",
          total_stake: "$0.00",
          potential_payout: "$0.00",
          total_odds: "+100",
          legs: [{
            game: "Image Analysis Failed",
            bet: "Please try uploading a clearer image",
            odds: "+100",
            stake: "$0.00",
            confidence: 0
          }]
        },
        optimization: {
          current_expected_value: "0%",
          optimized_expected_value: "0%",
          risk_level: "Unknown",
          variance: "Unknown",
          recommendations: ["Please upload a clearer bet slip image", "Ensure all text is visible and readable"]
        },
        alternatives: [],
        bankroll_management: {
          recommended_stake: "$0.00",
          risk_percentage: "0%",
          kelly_criterion: "0%",
          max_recommended: "$0.00"
        }
      };
    }

    return res.status(200).json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('❌ OpenAI API Error:', error);

    // Return error but with helpful message
    return res.status(200).json({
      success: true,
      analysis: {
        bet_slip_details: {
          sportsbook: "Analysis Error",
          bet_type: "API Error", 
          total_stake: "$0.00",
          potential_payout: "$0.00",
          total_odds: "+100",
          legs: [{
            game: "OpenAI API Error",
            bet: "Please check your API key and try again",
            odds: "+100",
            stake: "$0.00",
            confidence: 0
          }]
        },
        optimization: {
          current_expected_value: "0%",
          optimized_expected_value: "0%", 
          risk_level: "Unknown",
          variance: "Unknown",
          recommendations: [
            "OpenAI API error occurred",
            "Please check your API configuration",
            error.message || "Unknown error"
          ]
        },
        alternatives: [],
        bankroll_management: {
          recommended_stake: "$0.00",
          risk_percentage: "0%",
          kelly_criterion: "0%",
          max_recommended: "$0.00"
        }
      }
    });
  }
}