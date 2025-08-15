// API Route: /pages/api/generate-parlay.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { sport, riskLevel } = req.body;

  // Extensive betting line templates by sport
  const betTemplates = {
    NFL: [
      // Quarterback Props
      { type: "QB Passing Yards", line: "Over 275.5", odds: ["+110", "-120", "+105"] },
      { type: "QB Passing TDs", line: "Over 2.5", odds: ["+115", "-125", "+110"] },
      { type: "QB Interceptions", line: "Under 0.5", odds: ["+130", "-140", "+125"] },
      { type: "QB Completions", line: "Over 24.5", odds: ["+105", "-115", "+100"] },
      { type: "QB Rush Yards", line: "Over 25.5", odds: ["+140", "-150", "+135"] },
      { type: "QB Longest Completion", line: "Over 35.5", odds: ["+120", "-130", "+115"] },
      
      // Running Back Props
      { type: "RB Rushing Yards", line: "Under 85.5", odds: ["+115", "-110", "+120"] },
      { type: "RB Rushing TDs", line: "Over 0.5", odds: ["+125", "-135", "+120"] },
      { type: "RB Receiving Yards", line: "Over 35.5", odds: ["+130", "-140", "+125"] },
      { type: "RB Receptions", line: "Over 3.5", odds: ["+110", "-120", "+105"] },
      { type: "RB Longest Rush", line: "Over 18.5", odds: ["+135", "-145", "+130"] },
      { type: "RB Total Yards", line: "Over 110.5", odds: ["+105", "-115", "+100"] },
      
      // Wide Receiver Props
      { type: "WR Receiving Yards", line: "Over 65.5", odds: ["+125", "-115", "+105"] },
      { type: "WR Receptions", line: "Over 5.5", odds: ["+110", "-120", "+105"] },
      { type: "WR Receiving TDs", line: "Over 0.5", odds: ["+140", "-150", "+135"] },
      { type: "WR Longest Reception", line: "Over 28.5", odds: ["+120", "-130", "+115"] },
      { type: "WR Target Share", line: "Over 8.5", odds: ["+115", "-125", "+110"] },
      
      // Team & Game Props
      { type: "Team Total Points", line: "Over 24.5", odds: ["+110", "-105", "+115"] },
      { type: "First Half Total", line: "Under 21.5", odds: ["+120", "-110", "+105"] },
      { type: "Game Total Points", line: "Over 47.5", odds: ["+105", "-115", "+110"] },
      { type: "Total Turnovers", line: "Over 3.5", odds: ["+115", "-125", "+110"] }
    ],
    
    NBA: [
      // Point Guard Props
      { type: "PG Points", line: "Over 22.5", odds: ["+115", "-120", "+110"] },
      { type: "PG Assists", line: "Over 8.5", odds: ["+110", "-120", "+105"] },
      { type: "PG Rebounds", line: "Over 5.5", odds: ["+125", "-135", "+120"] },
      { type: "PG Steals", line: "Over 1.5", odds: ["+140", "-150", "+135"] },
      { type: "PG 3-Pointers Made", line: "Over 2.5", odds: ["+120", "-130", "+115"] },
      
      // Center Props
      { type: "C Points", line: "Over 14.5", odds: ["+115", "-125", "+110"] },
      { type: "C Rebounds", line: "Over 11.5", odds: ["+120", "-110", "+105"] },
      { type: "C Blocks", line: "Over 2.5", odds: ["+130", "-140", "+125"] },
      
      // Team & Game Props
      { type: "Team Total Points", line: "Over 112.5", odds: ["+105", "-120", "+115"] },
      { type: "First Quarter Total", line: "Under 28.5", odds: ["+115", "-105", "+110"] },
      { type: "Total 3-Pointers Made", line: "Over 25.5", odds: ["+115", "-125", "+110"] }
    ],
    
    NHL: [
      // Goalie Props
      { type: "Goalie Saves", line: "Over 28.5", odds: ["+110", "-115", "+105"] },
      { type: "Goalie Save %", line: "Over 92.5%", odds: ["+120", "-130", "+115"] },
      { type: "Goalie Goals Against", line: "Under 2.5", odds: ["+115", "-125", "+110"] },
      
      // Player Props
      { type: "Center Goals", line: "Over 0.5", odds: ["+140", "-150", "+125"] },
      { type: "Center Points", line: "Over 0.5", odds: ["+140", "-150", "+125"] },
      { type: "Winger Shots on Goal", line: "Over 2.5", odds: ["+120", "-130", "+115"] },
      
      // Team & Game Props
      { type: "Team Total Goals", line: "Over 3.5", odds: ["+115", "-125", "+110"] },
      { type: "Game Total Goals", line: "Under 6.5", odds: ["+105", "-115", "+100"] },
      { type: "First Period Goals", line: "Over 1.5", odds: ["+125", "-135", "+120"] }
    ],
    
    MLB: [
      // Pitcher Props
      { type: "Starting Pitcher Strikeouts", line: "Over 6.5", odds: ["+110", "-120", "+105"] },
      { type: "Starting Pitcher Innings", line: "Over 5.5", odds: ["+115", "-125", "+110"] },
      { type: "Starting Pitcher Earned Runs", line: "Under 2.5", odds: ["+120", "-130", "+115"] },
      
      // Batter Props
      { type: "First Baseman Hits", line: "Over 1.5", odds: ["+120", "-130", "+115"] },
      { type: "Shortstop Total Bases", line: "Over 1.5", odds: ["+120", "-130", "+115"] },
      { type: "Outfielder RBIs", line: "Over 1.5", odds: ["+140", "-150", "+135"] },
      
      // Team & Game Props
      { type: "Team Total Runs", line: "Over 4.5", odds: ["+105", "-115", "+100"] },
      { type: "Game Total Runs", line: "Under 8.5", odds: ["+110", "-120", "+105"] },
      { type: "Total Home Runs", line: "Over 2.5", odds: ["+125", "-135", "+120"] }
    ],
    
    MMA: [
      // Fight Duration & Method
      { type: "Fight Duration", line: "Over 2.5 rounds", odds: ["+120", "-130", "+115"] },
      { type: "Method of Victory", line: "Decision", odds: ["+150", "-170", "+140"] },
      { type: "Method of Victory", line: "KO/TKO", odds: ["+180", "-200", "+170"] },
      { type: "Fight Finish", line: "Goes Distance", odds: ["+110", "-120", "+105"] },
      
      // Fighter Props
      { type: "Striker Significant Strikes", line: "Over 45.5", odds: ["+115", "-125", "+110"] },
      { type: "Grappler Takedowns", line: "Over 2.5", odds: ["+140", "-150", "+135"] },
      { type: "Total Significant Strikes", line: "Over 85.5", odds: ["+110", "-120", "+105"] }
    ]
  };

  // Generic team matchups for demonstration
  const teamMatchups = {
    NFL: ["AFC East Team vs AFC West Team", "NFC North Team vs NFC South Team", "Division Leader vs Wild Card Team", "Home Favorite vs Road Underdog"],
    NBA: ["Eastern Conference Team vs Western Conference Team", "Atlantic Division vs Pacific Division", "Playoff Team vs Lottery Team", "High-Scoring Team vs Defensive Team"],
    NHL: ["Eastern Conference vs Western Conference", "Original Six Team vs Expansion Team", "Metro Division vs Central Division", "Fast-Paced Team vs Defensive Team"],
    MLB: ["American League vs National League", "AL East vs NL West", "Contender vs Rebuilding Team", "High-Offense Team vs Pitching-Strong Team"],
    MMA: ["Striking Specialist vs Grappling Specialist", "Veteran vs Rising Prospect", "Championship Bout", "Title Eliminator", "Co-Main Event Bout"]
  };

  // Generate parlay based on risk level
  function generateParlay(selectedSport, risk) {
    let numLegs, confidenceRange;
    
    switch(risk) {
      case 'safe':
        numLegs = Math.floor(Math.random() * 2) + 2; // 2-3 legs
        confidenceRange = [70, 85];
        break;
      case 'moderate':
        numLegs = Math.floor(Math.random() * 2) + 3; // 3-4 legs
        confidenceRange = [55, 75];
        break;
      case 'risky':
        numLegs = Math.floor(Math.random() * 3) + 4; // 4-6 legs
        confidenceRange = [40, 65];
        break;
      default:
        numLegs = 3;
        confidenceRange = [60, 75];
    }

    const legs = [];
    const usedBets = new Set();
    const availableSports = selectedSport === 'Mixed' ? Object.keys(betTemplates) : [selectedSport];
    
    for (let i = 0; i < numLegs; i++) {
      const sportForLeg = availableSports[Math.floor(Math.random() * availableSports.length)];
      const availableBets = betTemplates[sportForLeg].filter(bet => !usedBets.has(`${sportForLeg}-${bet.type}-${bet.line}`));
      
      if (availableBets.length === 0) continue;
      
      const selectedBet = availableBets[Math.floor(Math.random() * availableBets.length)];
      const selectedOdds = selectedBet.odds[Math.floor(Math.random() * selectedBet.odds.length)];
      const confidence = Math.floor(Math.random() * (confidenceRange[1] - confidenceRange[0] + 1)) + confidenceRange[0];
      const matchup = teamMatchups[sportForLeg][Math.floor(Math.random() * teamMatchups[sportForLeg].length)];
      
      legs.push({
        game: `${sportForLeg}: ${matchup}`,
        bet: `${selectedBet.type} ${selectedBet.line}`,
        odds: selectedOdds,
        confidence: confidence,
        sport: sportForLeg
      });
      
      usedBets.add(`${sportForLeg}-${selectedBet.type}-${selectedBet.line}`);
    }

    // Calculate combined odds (simplified)
    const totalOdds = legs.length === 2 ? "+280" : 
                     legs.length === 3 ? "+450" :
                     legs.length === 4 ? "+750" :
                     legs.length === 5 ? "+1200" : "+1800";
    
    const avgConfidence = Math.round(legs.reduce((sum, leg) => sum + leg.confidence, 0) / legs.length);
    const impliedProb = legs.length === 2 ? "26.3%" :
                       legs.length === 3 ? "18.2%" :
                       legs.length === 4 ? "11.8%" :
                       legs.length === 5 ? "7.7%" : "5.3%";

    return {
      parlay_details: {
        sport: selectedSport === 'Mixed' ? 'Multi-Sport' : selectedSport,
        risk_level: risk,
        total_odds: totalOdds,
        implied_probability: impliedProb,
        recommended_stake: risk === 'safe' ? "$50" : risk === 'moderate' ? "$25" : "$10",
        potential_roi: legs.length === 2 ? "180%" :
                      legs.length === 3 ? "350%" :
                      legs.length === 4 ? "650%" :
                      legs.length === 5 ? "1100%" : "1700%",
        legs: legs
      },
      analysis: {
        expected_value: avgConfidence > 65 ? "+3.2%" : avgConfidence > 55 ? "+1.1%" : "-0.8%",
        variance: risk === 'safe' ? "Low" : risk === 'moderate' ? "Medium" : "High",
        recommendation: `${legs.length}-leg ${risk} parlay with ${avgConfidence}% average confidence`
      }
    };
  }

  // Check if we have the required data
  if (!sport || !riskLevel) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing sport or riskLevel in request body' 
    });
  }

  // Allow mixed sport parlays
  const finalSport = sport === 'Mixed' ? 'Mixed' : sport;
  const mockParlay = generateParlay(finalSport, riskLevel);

  return res.status(200).json({
    success: true,
    parlay: mockParlay
  });
}