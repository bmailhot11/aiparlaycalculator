import { TrendingUp, Target, DollarSign, BarChart3 } from 'lucide-react';

export default function ParlayResults({ parlay }) {
  if (!parlay) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Generate a parlay to see results here</p>
      </div>
    );
  }

  console.log('🎯 ParlayResults received data:', parlay);

  const { parlay_details, analysis } = parlay;

  if (!parlay_details) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error: Invalid parlay data received</p>
        <pre className="text-xs text-gray-600 mt-2">{JSON.stringify(parlay, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 AI Generated Parlay</h2>
        <p className="text-gray-600">Optimized for {parlay_details.risk_level} risk profile</p>
      </div>

      {/* Parlay Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{parlay_details.total_odds}</div>
            <div className="text-sm text-gray-600">Total Odds</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{parlay_details.implied_probability}</div>
            <div className="text-sm text-gray-600">Win Probability</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{parlay_details.potential_roi}</div>
            <div className="text-sm text-gray-600">Potential ROI</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{parlay_details.recommended_stake}</div>
            <div className="text-sm text-gray-600">Recommended Stake</div>
          </div>
        </div>
      </div>

      {/* Parlay Legs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Parlay Legs ({parlay_details.legs.length})</h3>
        <div className="space-y-3">
          {parlay_details.legs.map((leg, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{leg.game}</div>
                  <div className="text-blue-600 font-medium">{leg.bet}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800">{leg.odds}</div>
                  <div className="text-sm text-green-600">{leg.confidence}% confidence</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis */}
      {analysis && (
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            AI Analysis
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Expected Value</div>
              <div className={`font-bold ${analysis.expected_value.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {analysis.expected_value}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Variance</div>
              <div className="font-bold text-gray-800">{analysis.variance}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Recommendation</div>
              <div className="font-bold text-gray-800">{analysis.recommendation}</div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <strong>Disclaimer:</strong> This is an AI-generated analysis for educational purposes. Always verify odds and make responsible betting decisions.
      </div>
    </div>
  );
}