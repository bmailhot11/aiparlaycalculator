import { TrendingUp, AlertTriangle, DollarSign, Target, BarChart3, Lightbulb } from 'lucide-react';

export default function AnalysisResults({ analysis }) {
  if (!analysis) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Upload a bet slip to see analysis results here</p>
      </div>
    );
  }

  const { bet_slip_details, optimization, alternatives, bankroll_management } = analysis;

  return (
    <div className="mt-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 Bet Slip Analysis</h2>
        <p className="text-gray-600">AI-powered optimization recommendations</p>
      </div>

      {/* Current Bet Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Current Bet Slip - {bet_slip_details.sportsbook}
        </h3>
        
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{bet_slip_details.total_odds}</div>
            <div className="text-sm text-gray-600">Total Odds</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{bet_slip_details.total_stake}</div>
            <div className="text-sm text-gray-600">Your Stake</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{bet_slip_details.potential_payout}</div>
            <div className="text-sm text-gray-600">Potential Payout</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{bet_slip_details.bet_type}</div>
            <div className="text-sm text-gray-600">Bet Type</div>
          </div>
        </div>

        {/* Bet Legs */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700">Bet Legs:</h4>
          {bet_slip_details.legs.map((leg, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">{leg.game}</div>
                <div className="text-blue-600">{leg.bet}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{leg.odds}</div>
                <div className="text-sm text-green-600">{leg.confidence}% confidence</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimization Analysis */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Risk Analysis
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${optimization.current_expected_value.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
              {optimization.current_expected_value}
            </div>
            <div className="text-sm text-gray-600">Current Expected Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{optimization.risk_level}</div>
            <div className="text-sm text-gray-600">Risk Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{optimization.variance}</div>
            <div className="text-sm text-gray-600">Variance</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">AI Recommendations:</h4>
          <ul className="space-y-2">
            {optimization.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Alternative Suggestions */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Better Alternatives
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {alternatives.map((alt, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-green-300">
              <h4 className="font-semibold text-gray-800 mb-2">{alt.description}</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Legs:</strong> {alt.legs.join(', ')}</div>
                <div><strong>Odds:</strong> {alt.odds}</div>
                <div className="text-green-600"><strong>Expected Value:</strong> {alt.expected_value}</div>
                <div className="text-gray-600 italic">{alt.recommendation}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bankroll Management */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Bankroll Management
        </h3>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{bankroll_management.recommended_stake}</div>
            <div className="text-sm text-gray-600">Recommended Stake</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{bankroll_management.risk_percentage}</div>
            <div className="text-sm text-gray-600">Risk %</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{bankroll_management.kelly_criterion}</div>
            <div className="text-sm text-gray-600">Kelly Criterion</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{bankroll_management.max_recommended}</div>
            <div className="text-sm text-gray-600">Max Stake</div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <strong>Demo Analysis:</strong> This is currently using mock data for demonstration. 
        Real AI analysis would require OCR and advanced statistical models to analyze your actual bet slip.
      </div>
    </div>
  );
}