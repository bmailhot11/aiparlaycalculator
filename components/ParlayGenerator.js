import { useState } from 'react';
import { Brain, TrendingUp, Shield, Zap, Target } from 'lucide-react';

export default function ParlayGenerator({ onGeneration, generationsToday, maxGenerations, isPremium }) {
  const [selectedSport, setSelectedSport] = useState('NFL');
  const [selectedRisk, setSelectedRisk] = useState('moderate');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Add Mixed option to sports array
  const sports = ['NFL', 'NBA', 'NHL', 'MLB', 'MMA', 'Mixed'];
  
  const riskLevels = [
    { 
      id: 'safe', 
      name: 'Safe', 
      icon: Shield,
      color: 'text-green-600', 
      borderColor: 'border-green-500',
      bgColor: 'bg-green-50',
      description: 'Lower risk, steady returns',
      details: '2-3 legs • 60-75% probability'
    },
    { 
      id: 'moderate', 
      name: 'Moderate', 
      icon: Target,
      color: 'text-yellow-600', 
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-50',
      description: 'Balanced risk/reward',
      details: '3-4 legs • 40-60% probability'
    },
    { 
      id: 'risky', 
      name: 'Risky', 
      icon: Zap,
      color: 'text-red-600', 
      borderColor: 'border-red-500',
      bgColor: 'bg-red-50',
      description: 'High risk, high reward',
      details: '4-6 legs • 15-40% probability'
    }
  ];

  const handleGenerate = async () => {
    setError(null);
    
    // Check limits
    if (!isPremium && generationsToday >= maxGenerations) {
      setError('Daily generation limit reached. Upgrade to Premium for unlimited generations.');
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/generate-parlay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: selectedSport,
          riskLevel: selectedRisk
        }),
      });

      const result = await response.json();

      if (result.success) {
        onGeneration(result.parlay);
      } else {
        setError(result.message || 'Failed to generate parlay');
      }
    } catch (err) {
      setError('Failed to generate parlay');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Sport Selection */}
      <div>
        <label className="block font-semibold text-gray-700 mb-4 text-lg">Select Sport</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`p-4 border-2 rounded-xl font-semibold transition-all text-center ${
                selectedSport === sport
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Level Selection */}
      <div>
        <label className="block font-semibold text-gray-700 mb-4 text-lg">Risk Level</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {riskLevels.map(level => {
            const Icon = level.icon;
            return (
              <button
                key={level.id}
                onClick={() => setSelectedRisk(level.id)}
                className={`p-6 border-2 rounded-xl text-left transition-all ${
                  selectedRisk === level.id
                    ? `${level.borderColor} ${level.bgColor}`
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`w-6 h-6 ${level.color}`} />
                  <div className={`font-bold text-lg ${level.color}`}>
                    {level.name}
                  </div>
                </div>
                <div className="text-gray-600 text-sm mb-1">
                  {level.description}
                </div>
                <div className="text-gray-500 text-xs">
                  {level.details}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-gradient-to-r from-blue-700 to-purple-600 text-white py-4 rounded-xl text-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Generating AI Parlay...</span>
          </>
        ) : (
          <>
            <Brain className="w-6 h-6" />
            <span>Generate AI Parlay</span>
          </>
        )}
      </button>

      {/* Generation Info */}
      <div className="text-center text-sm text-gray-500">
        <p>AI generates optimized parlays based on mathematical analysis</p>
        <p>Always verify odds with your sportsbook before placing bets</p>
      </div>
    </div>
  );
}