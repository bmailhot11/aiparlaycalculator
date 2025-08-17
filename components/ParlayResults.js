import { TrendingUp, Target, DollarSign, BarChart3, Clock, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

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

  // Handle both old and new data structures
  const parlayData = parlay.parlay_details || parlay;
  const { 
    parlay_legs, 
    total_american_odds, 
    total_decimal_odds,
    best_sportsbooks,
    confidence,
    risk_assessment,
    sportsbook_optimization,
    sport,
    games_available,
    sportsbooks_analyzed
  } = parlayData;

  // Legacy support
  const legs = parlay_legs || parlayData.legs || [];
  const totalOdds = total_american_odds || parlayData.total_odds || 'N/A';
  const ev_analysis = parlay.ev_analysis;
  const sportsbook_recommendations = parlay.sportsbook_recommendations;
  const strategy_notes = parlay.strategy_notes;
  const timing_analysis = parlay.timing_analysis;
  const data_source = parlay.data_source;

  // Calculate implied probability from decimal odds
  const impliedProbability = total_decimal_odds ? 
    `${(1 / parseFloat(total_decimal_odds) * 100).toFixed(1)}%` : 
    parlayData.implied_probability || 'Calculating...';

  if (!legs || legs.length === 0) {
    return (
      <div className="text-center py-12 text-red-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <p>Error: No parlay legs found</p>
        <div className="text-xs text-gray-600 mt-2 max-w-md mx-auto">
          <details>
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="text-left bg-gray-100 p-2 rounded mt-2 overflow-auto text-xs">
              {JSON.stringify(parlay, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 sm:mt-8 space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header - Mobile Optimized */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
          Generated with Live Data
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">🎯 AI Generated Parlay</h2>
        <div className="text-sm sm:text-base text-gray-600 flex flex-wrap justify-center gap-1 sm:gap-2">
          <span>{sport || 'Multi-Sport'}</span>
          <span>•</span>
          <span>{confidence || 'medium'} confidence</span>
          <span>•</span>
          <span>{legs.length} legs</span>
        </div>
        {data_source && (
          <p className="text-xs text-gray-500 mt-1 px-4">{data_source}</p>
        )}
      </div>

      {/* Parlay Overview - Mobile Stack */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-xl border border-blue-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
          <div className="min-w-0">
            <div className="text-lg sm:text-2xl font-bold text-blue-600 truncate">{totalOdds}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Odds</div>
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600 truncate">{impliedProbability}</div>
            <div className="text-xs sm:text-sm text-gray-600">Win Probability</div>
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-2xl font-bold text-purple-600 truncate">
              {ev_analysis?.mathematical_edge || confidence || 'Good'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Expected Value</div>
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-2xl font-bold text-orange-600 truncate">
              {best_sportsbooks?.length || sportsbooks_analyzed || 1}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Sportsbooks</div>
          </div>
        </div>
      </div>

      {/* Parlay Legs - Mobile Optimized */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 sm:w-5 sm:h-5" />
          Parlay Legs ({legs.length})
        </h3>
        <div className="space-y-3">
          {legs.map((leg, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow">
              {/* Mobile: Stack layout, Desktop: Side by side */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                      {leg.sport || sport || 'Sport'}
                    </span>
                    {(leg.bet_type || leg.market_type) && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {leg.bet_type || leg.market_type}
                      </span>
                    )}
                    {leg.sportsbook && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {leg.sportsbook}
                      </span>
                    )}
                  </div>
                  
                  {/* Game and Bet Info */}
                  <div className="font-semibold text-gray-800 text-sm sm:text-base mb-1 break-words">
                    {leg.game}
                  </div>
                  <div className="text-blue-600 font-medium text-sm sm:text-base mb-2 break-words">
                    {leg.bet || leg.selection}
                    {leg.point && ` ${leg.point}`}
                  </div>
                  
                  {/* Additional Info */}
                  {leg.ev_justification && (
                    <div className="text-xs sm:text-sm text-gray-600 mb-1 break-words">{leg.ev_justification}</div>
                  )}
                  {leg.market_context && (
                    <div className="text-xs text-green-600 break-words">💡 {leg.market_context}</div>
                  )}
                  {leg.reasoning && (
                    <div className="text-xs text-gray-600 italic break-words">{leg.reasoning}</div>
                  )}
                </div>
                
                {/* Odds and Confidence - Mobile: Full width, Desktop: Right aligned */}
                <div className="sm:text-right sm:ml-4 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 sm:gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="font-bold text-gray-800 text-base sm:text-lg">
                    {leg.odds}
                  </div>
                  <div className="flex flex-col sm:items-end text-xs sm:text-sm">
                    {leg.confidence && (
                      <div className="text-green-600">{leg.confidence}% confidence</div>
                    )}
                    {leg.decimal_odds && (
                      <div className="text-gray-500">{parseFloat(leg.decimal_odds).toFixed(2)} decimal</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Sportsbooks Section */}
      {best_sportsbooks && best_sportsbooks.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            Best Sportsbooks Used
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {best_sportsbooks.map((book, index) => (
              <div key={index} className="bg-white p-3 sm:p-4 rounded-lg border border-purple-300">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{book}</h4>
                  {index === 0 && (
                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-bold ml-2">
                      BEST
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Used for optimal odds on this parlay
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sportsbook Optimization */}
      {sportsbook_optimization && sportsbook_optimization.potential_improvements?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            Potential Improvements
          </h3>
          <div className="space-y-3">
            {sportsbook_optimization.potential_improvements.map((improvement, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-yellow-300">
                <div className="text-sm font-medium text-gray-800 mb-1 break-words">
                  {improvement.leg}
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-xs sm:text-sm">
                  <div className="text-gray-600">
                    Current: {improvement.current}
                  </div>
                  <div className="text-green-600 font-medium">
                    Better: {improvement.better} (+{improvement.improvement})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EV Analysis - Mobile Optimized */}
      {ev_analysis && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            Expected Value Analysis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Mathematical Edge</div>
              <div className="font-bold text-green-600 text-base sm:text-lg">
                {ev_analysis.mathematical_edge}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Risk Assessment</div>
              <div className="font-bold text-gray-800 text-sm sm:text-base break-words">
                {ev_analysis.risk_assessment}
              </div>
            </div>
          </div>
          {ev_analysis.market_inefficiencies && (
            <div className="mt-3 p-3 bg-white rounded border border-green-300">
              <div className="font-medium text-green-800 text-sm">Market Insights:</div>
              <div className="text-green-700 text-sm break-words">{ev_analysis.market_inefficiencies}</div>
            </div>
          )}
          {ev_analysis.key_correlations && (
            <div className="mt-2 text-sm text-orange-700 break-words">
              <strong>⚠️ Correlations:</strong> {ev_analysis.key_correlations}
            </div>
          )}
        </div>
      )}

      {/* Risk Assessment from Parlay Data */}
      {risk_assessment && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Risk Assessment
          </h3>
          <div className="text-sm text-blue-700 break-words">
            {risk_assessment}
          </div>
        </div>
      )}

      {/* Timing Analysis - Mobile Stack */}
      {timing_analysis && Object.keys(timing_analysis).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Timing Analysis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
            {timing_analysis.line_movement_trend && (
              <div>
                <div className="font-medium text-gray-700">Line Movement</div>
                <div className="text-blue-600 break-words">{timing_analysis.line_movement_trend}</div>
              </div>
            )}
            {timing_analysis.optimal_bet_timing && (
              <div>
                <div className="font-medium text-gray-700">Optimal Timing</div>
                <div className="text-blue-600 break-words">{timing_analysis.optimal_bet_timing}</div>
              </div>
            )}
            {timing_analysis.key_injury_concerns && (
              <div>
                <div className="font-medium text-gray-700">Injury Watch</div>
                <div className="text-orange-600 break-words">{timing_analysis.key_injury_concerns}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sportsbook Recommendations - Mobile Optimized */}
      {sportsbook_recommendations?.best_payouts && sportsbook_recommendations.best_payouts.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            Recommended Sportsbooks
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sportsbook_recommendations.best_payouts.slice(0, 3).map((book, index) => (
              <div key={index} className="bg-white p-3 sm:p-4 rounded-lg border border-purple-300">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{book.sportsbook}</h4>
                  {index === 0 && (
                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-bold ml-2">
                      BEST
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mb-2 break-words">{book.why_best}</div>
                <div className="text-xs text-green-600 mb-3 break-words">🎁 {book.signup_bonus}</div>
                <button className="w-full bg-purple-600 text-white py-2 px-3 rounded text-xs sm:text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-1">
                  <span>Visit {book.sportsbook}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          {sportsbook_recommendations.recommendation && (
            <div className="mt-3 sm:mt-4 p-3 bg-white rounded border border-purple-300">
              <div className="text-sm text-purple-700 break-words">
                <strong>Recommendation:</strong> {sportsbook_recommendations.recommendation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strategy Notes - Mobile Optimized */}
      {strategy_notes && strategy_notes.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            Strategy Notes
          </h3>
          <ul className="space-y-2">
            {strategy_notes.map((note, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                <span className="text-gray-700 break-words">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer - Mobile Optimized */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm text-yellow-800">
            <strong>Important:</strong> This analysis uses live odds data and AI modeling for educational purposes. 
            Always verify current odds with your chosen sportsbook before placing bets. Past performance doesn't guarantee future results.
          </div>
        </div>
      </div>
    </div>
  );
}