import { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  DollarSign, 
  Calculator,
  ArrowLeft,
  Info,
  AlertTriangle
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';

export default function KellyCalculator() {
  const [betOdds, setBetOdds] = useState('');
  const [winProbability, setWinProbability] = useState('');
  const [bankroll, setBankroll] = useState('');
  const [results, setResults] = useState(null);
  const [oddsFormat, setOddsFormat] = useState('american');

  // Convert odds to decimal format
  const convertToDecimal = (odds, format) => {
    if (format === 'decimal') return parseFloat(odds);
    if (format === 'american') {
      const americanOdds = parseFloat(odds);
      if (americanOdds > 0) {
        return (americanOdds / 100) + 1;
      } else {
        return (100 / Math.abs(americanOdds)) + 1;
      }
    }
    if (format === 'fractional') {
      const [numerator, denominator] = odds.split('/').map(Number);
      return (numerator / denominator) + 1;
    }
    return 0;
  };

  const calculateKelly = () => {
    try {
      const decimalOdds = convertToDecimal(betOdds, oddsFormat);
      const probability = parseFloat(winProbability) / 100;
      const bankrollAmount = parseFloat(bankroll);

      if (!decimalOdds || !probability || !bankrollAmount || 
          probability <= 0 || probability >= 1 || 
          decimalOdds <= 1 || bankrollAmount <= 0) {
        throw new Error('Invalid inputs');
      }

      // Kelly Formula: f = (bp - q) / b
      // where:
      // f = fraction of bankroll to bet
      // b = odds received (decimal odds - 1)
      // p = probability of winning
      // q = probability of losing (1 - p)
      
      const b = decimalOdds - 1; // Net odds
      const p = probability;
      const q = 1 - probability;
      
      const kellyFraction = (b * p - q) / b;
      const kellyPercentage = kellyFraction * 100;
      const optimalBetSize = kellyFraction * bankrollAmount;
      
      // Calculate fractional Kelly (more conservative)
      const fractionalKelly25 = kellyFraction * 0.25;
      const fractionalBet25 = fractionalKelly25 * bankrollAmount;
      
      const fractionalKelly50 = kellyFraction * 0.5;
      const fractionalBet50 = fractionalKelly50 * bankrollAmount;

      // Calculate expected value
      const expectedValue = (probability * (decimalOdds - 1)) - (1 - probability);
      const expectedValuePercentage = expectedValue * 100;

      setResults({
        kellyPercentage: Math.max(0, kellyPercentage),
        optimalBetSize: Math.max(0, optimalBetSize),
        fractionalKelly25: Math.max(0, fractionalKelly25 * 100),
        fractionalBet25: Math.max(0, fractionalBet25),
        fractionalKelly50: Math.max(0, fractionalKelly50 * 100),
        fractionalBet50: Math.max(0, fractionalBet50),
        expectedValue: expectedValuePercentage,
        isPositiveEV: expectedValue > 0,
        decimalOdds
      });
    } catch (error) {
      alert('Please check your inputs. Make sure odds are valid, probability is between 1-99%, and bankroll is a positive number.');
    }
  };

  return (
    <div className="betchekr-premium">
      <Head>
        <title>Kelly Calculator - Optimal Bet Sizing | BetChekr</title>
        <meta name="description" content="Calculate optimal bet size using the Kelly Criterion. Manage risk and maximize long-term growth with smart bankroll management." />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href="/">
            <button className="flex items-center text-[#9CA3AF] hover:text-[#F4C430] mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <DollarSign className="w-12 h-12 text-[#F4C430] mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-4">
              Kelly Calculator
            </h1>
            <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto">
              Calculate optimal bet size using the Kelly Criterion to maximize long-term growth while managing risk
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#F4C430] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-[#E5E7EB] font-semibold mb-2">What is the Kelly Criterion?</h3>
                <p className="text-[#9CA3AF] text-sm leading-relaxed mb-3">
                  The Kelly Criterion is a mathematical formula that helps you determine the optimal size of a series of bets to maximize long-term growth of your bankroll. It balances maximizing returns with minimizing risk of ruin.
                </p>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">
                  <strong>Formula:</strong> f = (bp - q) / b, where f = fraction to bet, b = net odds, p = win probability, q = lose probability
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calculator Form */}
            <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
              <h2 className="text-[#E5E7EB] text-xl font-bold mb-6 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Calculator
              </h2>

              <div className="space-y-4">
                {/* Odds Format */}
                <div>
                  <label className="block text-[#E5E7EB] text-sm font-medium mb-2">
                    Odds Format
                  </label>
                  <select
                    value={oddsFormat}
                    onChange={(e) => setOddsFormat(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1F2937] border border-[#374151] rounded-lg text-[#E5E7EB] focus:border-[#F4C430] focus:outline-none"
                  >
                    <option value="american">American (e.g., +150, -110)</option>
                    <option value="decimal">Decimal (e.g., 2.50)</option>
                    <option value="fractional">Fractional (e.g., 3/2)</option>
                  </select>
                </div>

                {/* Bet Odds */}
                <div>
                  <label className="block text-[#E5E7EB] text-sm font-medium mb-2">
                    Bet Odds
                  </label>
                  <input
                    type="text"
                    value={betOdds}
                    onChange={(e) => setBetOdds(e.target.value)}
                    placeholder={oddsFormat === 'american' ? '+150' : oddsFormat === 'decimal' ? '2.50' : '3/2'}
                    className="w-full px-3 py-2 bg-[#1F2937] border border-[#374151] rounded-lg text-[#E5E7EB] focus:border-[#F4C430] focus:outline-none"
                  />
                </div>

                {/* Win Probability */}
                <div>
                  <label className="block text-[#E5E7EB] text-sm font-medium mb-2">
                    Win Probability (%)
                  </label>
                  <input
                    type="number"
                    value={winProbability}
                    onChange={(e) => setWinProbability(e.target.value)}
                    placeholder="60"
                    min="1"
                    max="99"
                    className="w-full px-3 py-2 bg-[#1F2937] border border-[#374151] rounded-lg text-[#E5E7EB] focus:border-[#F4C430] focus:outline-none"
                  />
                  <p className="text-[#6B7280] text-xs mt-1">Your estimated chance of winning this bet</p>
                </div>

                {/* Bankroll */}
                <div>
                  <label className="block text-[#E5E7EB] text-sm font-medium mb-2">
                    Total Bankroll ($)
                  </label>
                  <input
                    type="number"
                    value={bankroll}
                    onChange={(e) => setBankroll(e.target.value)}
                    placeholder="1000"
                    min="1"
                    className="w-full px-3 py-2 bg-[#1F2937] border border-[#374151] rounded-lg text-[#E5E7EB] focus:border-[#F4C430] focus:outline-none"
                  />
                </div>

                <button
                  onClick={calculateKelly}
                  className="w-full bg-[#F4C430] text-[#0B0F14] px-6 py-3 rounded-lg font-semibold hover:bg-[#e6b829] transition-colors"
                >
                  Calculate Optimal Bet Size
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
              <h2 className="text-[#E5E7EB] text-xl font-bold mb-6">
                Results
              </h2>

              {results ? (
                <div className="space-y-4">
                  {/* EV Check */}
                  <div className={`p-3 rounded-lg ${results.isPositiveEV ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <div className="flex items-center gap-2">
                      {results.isPositiveEV ? (
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`font-medium ${results.isPositiveEV ? 'text-green-400' : 'text-red-400'}`}>
                        {results.isPositiveEV ? 'Positive EV Bet' : 'Negative EV Bet'}
                      </span>
                    </div>
                    <p className="text-sm text-[#9CA3AF] mt-1">
                      Expected Value: {results.expectedValue > 0 ? '+' : ''}{results.expectedValue.toFixed(2)}%
                    </p>
                  </div>

                  {results.isPositiveEV ? (
                    <>
                      {/* Full Kelly */}
                      <div className="bg-[#1F2937] p-4 rounded-lg">
                        <h3 className="text-[#F4C430] font-semibold mb-2">Full Kelly (Aggressive)</h3>
                        <p className="text-[#E5E7EB] text-xl font-bold">
                          ${results.optimalBetSize.toFixed(2)}
                        </p>
                        <p className="text-[#9CA3AF] text-sm">
                          {results.kellyPercentage.toFixed(2)}% of bankroll
                        </p>
                      </div>

                      {/* Fractional Kelly Options */}
                      <div className="bg-[#1F2937] p-4 rounded-lg">
                        <h3 className="text-[#F4C430] font-semibold mb-3">Fractional Kelly (Conservative)</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[#9CA3AF] text-xs">1/2 Kelly</p>
                            <p className="text-[#E5E7EB] font-semibold">${results.fractionalBet50.toFixed(2)}</p>
                            <p className="text-[#9CA3AF] text-xs">{results.fractionalKelly50.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-[#9CA3AF] text-xs">1/4 Kelly</p>
                            <p className="text-[#E5E7EB] font-semibold">${results.fractionalBet25.toFixed(2)}</p>
                            <p className="text-[#9CA3AF] text-xs">{results.fractionalKelly25.toFixed(2)}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
                        <p className="text-blue-400 font-medium text-sm">
                          💡 Recommendation: Start with 1/4 or 1/2 Kelly for more conservative bankroll management
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="bg-[#1F2937] p-4 rounded-lg">
                      <h3 className="text-red-400 font-semibold mb-2">Not Recommended</h3>
                      <p className="text-[#9CA3AF] text-sm">
                        This bet has negative expected value. The Kelly Criterion suggests not betting on this outcome.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 text-[#374151] mx-auto mb-4" />
                  <p className="text-[#6B7280]">Enter your bet details to see the optimal bet size</p>
                </div>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-yellow-400 font-semibold mb-2">Important Notes</h3>
                <ul className="text-[#9CA3AF] text-sm space-y-2">
                  <li>• Kelly sizing can be aggressive. Consider fractional Kelly (1/4 or 1/2) for more conservative approach</li>
                  <li>• Only bet on positive expected value (+EV) opportunities</li>
                  <li>• Your win probability estimate is crucial - be realistic and conservative</li>
                  <li>• Never bet money you can't afford to lose</li>
                  <li>• This is a mathematical tool, not gambling advice</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </GradientBG>
    </div>
  );
}