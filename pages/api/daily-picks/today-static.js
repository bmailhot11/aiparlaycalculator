// Static daily picks for today - manual override
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const today = new Date().toISOString().split('T')[0];
  
  // Static picks for August 23, 2025
  const dailyPicks = {
    success: true,
    date: today,
    published_at: new Date().toISOString(),
    status: 'active',
    single: {
      legs: [{
        sport: 'MLB',
        homeTeam: 'Pittsburgh Pirates',
        awayTeam: 'Colorado Rockies',
        selection: 'Colorado Rockies',
        bestOdds: '+120',
        bestSportsbook: 'DraftKings',
        marketType: 'Moneyline',
        edgePercentage: 4.2
      }],
      combinedOdds: '+120',
      estimatedPayout: 220,
      edgePercentage: 4.2,
      impliedProbability: 45.5
    },
    parlay2: {
      legs: [{
        sport: 'MLB',
        homeTeam: 'Pittsburgh Pirates',
        awayTeam: 'Colorado Rockies',
        selection: 'Over 8.5',
        bestOdds: '-110',
        bestSportsbook: 'FanDuel',
        marketType: 'Total',
        edgePercentage: 3.1
      }, {
        sport: 'MLB',
        homeTeam: 'Arizona Diamondbacks',
        awayTeam: 'San Diego Padres',
        selection: 'San Diego Padres',
        bestOdds: '-125',
        bestSportsbook: 'BetMGM',
        marketType: 'Moneyline',
        edgePercentage: 2.8
      }],
      combinedOdds: '+275',
      estimatedPayout: 375,
      edgePercentage: 5.9,
      impliedProbability: 26.7
    },
    parlay4: {
      legs: [{
        sport: 'MLB',
        homeTeam: 'Pittsburgh Pirates',
        awayTeam: 'Colorado Rockies',
        selection: 'Over 8.5',
        bestOdds: '-110',
        bestSportsbook: 'FanDuel',
        marketType: 'Total',
        edgePercentage: 3.1
      }, {
        sport: 'MLB',
        homeTeam: 'Arizona Diamondbacks',
        awayTeam: 'San Diego Padres',
        selection: 'San Diego Padres',
        bestOdds: '-125',
        bestSportsbook: 'BetMGM',
        marketType: 'Moneyline',
        edgePercentage: 2.8
      }, {
        sport: 'MLB',
        homeTeam: 'Oakland Athletics',
        awayTeam: 'Texas Rangers',
        selection: 'Under 9.0',
        bestOdds: '-105',
        bestSportsbook: 'Caesars',
        marketType: 'Total',
        edgePercentage: 2.4
      }, {
        sport: 'MLB',
        homeTeam: 'Los Angeles Angels',
        awayTeam: 'Houston Astros',
        selection: 'Houston Astros',
        bestOdds: '-140',
        bestSportsbook: 'DraftKings',
        marketType: 'Moneyline',
        edgePercentage: 1.9
      }],
      combinedOdds: '+850',
      estimatedPayout: 950,
      edgePercentage: 10.2,
      impliedProbability: 10.5
    }
  };

  return res.status(200).json(dailyPicks);
}