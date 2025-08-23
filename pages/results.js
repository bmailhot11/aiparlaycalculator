// Public Results and Performance Page

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Calendar,
  Trophy,
  Percent,
  InfoIcon,
  CheckCircle,
  XCircle,
  Minus,
  Eye,
  HelpCircle
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ResultsPage() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [selectedPeriod]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/daily-picks/results?period=${selectedPeriod}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data);
      } else {
        setError(data.message || 'Failed to load results');
      }
    } catch (err) {
      setError('Network error loading results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <BarChart3 className="w-10 h-10 text-[#F4C430]" />
              <h1 className="text-4xl font-bold text-[#E5E7EB]">Track Record</h1>
            </div>
            <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto mb-4">
              Transparent performance tracking with complete methodology disclosure
            </p>
            <p className="text-[#6B7280] text-sm">
              Results tracking began August 23, 2025
            </p>
          </motion.div>

          {/* Period Selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg bg-[#1F2937] p-1">
              {[7, 30, 90, 365].map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedPeriod === period
                      ? 'bg-[#F4C430] text-[#0B0F14]'
                      : 'text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#374151]'
                  }`}
                >
                  {period === 365 ? '1 Year' : `${period} Days`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#9CA3AF]">Loading performance data...</p>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card max-w-2xl mx-auto text-center"
            >
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-semibold text-[#E5E7EB] mb-2">Error Loading Results</h3>
              <p className="text-[#9CA3AF] mb-6">{error}</p>
              <button 
                onClick={fetchResults}
                className="btn btn-outline"
              >
                Try Again
              </button>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {/* KPI Dashboard */}
              <KPIDashboard kpis={results.kpis} period={selectedPeriod} />

              {/* Bankroll Chart */}
              <BankrollChart data={results.bankroll_progression} />

              {/* Daily Results Table */}
              <DailyResultsTable results={results.daily_results.results} />

              {/* Methodology Section */}
              <MethodologySection 
                methodology={results.methodology}
                show={showMethodology}
                onToggle={() => setShowMethodology(!showMethodology)}
              />
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

/**
 * KPI Dashboard Component
 */
function KPIDashboard({ kpis, period }) {
  if (!kpis) return null;

  const periodKPIs = kpis.period;
  const allTimeKPIs = kpis.all_time;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Period Stats */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#E5E7EB]">
            {period === 365 ? '1 Year' : `${period} Day`} Performance
          </h2>
          <div className="text-[#6B7280] text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <KPICard
            title="ROI"
            value={`${periodKPIs.roi >= 0 ? '+' : ''}${periodKPIs.roi.toFixed(1)}%`}
            change={periodKPIs.roi}
            icon={TrendingUp}
            positive={periodKPIs.roi >= 0}
          />
          <KPICard
            title="Win Rate"
            value={`${periodKPIs.win_rate.toFixed(1)}%`}
            subtitle={`${periodKPIs.wins}W-${periodKPIs.losses}L`}
            icon={Target}
            positive={periodKPIs.win_rate >= 50}
          />
          <KPICard
            title="CLV Beat Rate"
            value={`${periodKPIs.clv_beat_rate.toFixed(1)}%`}
            subtitle="Beat closing lines"
            icon={Trophy}
            positive={periodKPIs.clv_beat_rate >= 50}
          />
          <KPICard
            title="Net P&L"
            value={`${periodKPIs.pnl >= 0 ? '+' : ''}$${periodKPIs.pnl.toFixed(0)}`}
            subtitle={`${periodKPIs.total_bets} bets`}
            icon={DollarSign}
            positive={periodKPIs.pnl >= 0}
          />
        </div>
      </div>

      {/* All-Time Stats */}
      <div className="card">
        <h2 className="text-xl font-bold text-[#E5E7EB] mb-6">All-Time Performance</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#F4C430] mb-1">
              {allTimeKPIs.total_roi >= 0 ? '+' : ''}{allTimeKPIs.total_roi.toFixed(1)}%
            </div>
            <div className="text-[#6B7280] text-sm">Total ROI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#E5E7EB] mb-1">
              {allTimeKPIs.total_bets}
            </div>
            <div className="text-[#6B7280] text-sm">Total Bets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {allTimeKPIs.win_rate.toFixed(1)}%
            </div>
            <div className="text-[#6B7280] text-sm">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {allTimeKPIs.clv_beat_rate.toFixed(1)}%
            </div>
            <div className="text-[#6B7280] text-sm">CLV Beat</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {allTimeKPIs.no_bet_days}
            </div>
            <div className="text-[#6B7280] text-sm">No Bet Days</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#374151]">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-lg font-semibold text-green-400 mb-1">
                {allTimeKPIs.total_wins}
              </div>
              <div className="text-[#6B7280] text-sm">Wins</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-400 mb-1">
                {allTimeKPIs.total_losses}
              </div>
              <div className="text-[#6B7280] text-sm">Losses</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#6B7280] mb-1">
                {allTimeKPIs.total_pushes}
              </div>
              <div className="text-[#6B7280] text-sm">Pushes</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Individual KPI Card Component
 */
function KPICard({ title, value, subtitle, change, icon: Icon, positive }) {
  return (
    <div className="text-center">
      <Icon className="w-6 h-6 mx-auto mb-2 text-[#F4C430]" />
      <div className={`text-2xl font-bold mb-1 ${
        positive ? 'text-green-400' : 'text-red-400'
      }`}>
        {value}
      </div>
      <div className="text-[#6B7280] text-sm">
        {title}
        {subtitle && (
          <div className="text-xs mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Bankroll Chart Component (Sparkline)
 */
function BankrollChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="card text-center py-8">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-[#6B7280]" />
        <p className="text-[#9CA3AF]">Bankroll chart will appear as data accumulates</p>
      </div>
    );
  }

  const minValue = Math.min(...data.map(d => d.bankroll));
  const maxValue = Math.max(...data.map(d => d.bankroll));
  const range = maxValue - minValue || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <h2 className="text-xl font-bold text-[#E5E7EB] mb-6">Bankroll Progression</h2>
      
      <div className="relative h-32 mb-4">
        <svg className="w-full h-full" viewBox="0 0 800 128">
          <defs>
            <linearGradient id="bankrollGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F4C430" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F4C430" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Chart Line */}
          <path
            d={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 800;
              const y = 128 - ((point.bankroll - minValue) / range) * 128;
              return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="#F4C430"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Fill Area */}
          <path
            d={`${data.map((point, index) => {
              const x = (index / (data.length - 1)) * 800;
              const y = 128 - ((point.bankroll - minValue) / range) * 128;
              return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
            }).join(' ')} L 800 128 L 0 128 Z`}
            fill="url(#bankrollGradient)"
          />
        </svg>
      </div>
      
      <div className="flex justify-between items-center text-sm text-[#6B7280]">
        <span>{new Date(data[0]?.date).toLocaleDateString()}</span>
        <span className="font-semibold">
          ${data[data.length - 1]?.bankroll.toLocaleString()}
        </span>
        <span>{new Date(data[data.length - 1]?.date).toLocaleDateString()}</span>
      </div>
    </motion.div>
  );
}

/**
 * Daily Results Table Component
 */
function DailyResultsTable({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="card text-center py-8">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-[#6B7280]" />
        <p className="text-[#9CA3AF]">Daily results will appear as bets are settled</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <h2 className="text-xl font-bold text-[#E5E7EB] mb-6">Daily Results</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#374151]">
              <th className="text-left py-3 text-[#9CA3AF] font-medium">Date</th>
              <th className="text-center py-3 text-[#9CA3AF] font-medium">Single</th>
              <th className="text-center py-3 text-[#9CA3AF] font-medium">2-Leg</th>
              <th className="text-center py-3 text-[#9CA3AF] font-medium">4-Leg</th>
              <th className="text-right py-3 text-[#9CA3AF] font-medium">Total P&L</th>
            </tr>
          </thead>
          <tbody>
            {results.slice(0, 15).map((day, index) => (
              <tr key={day.date} className="border-b border-[#1F2937]">
                <td className="py-3 text-[#E5E7EB]">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="text-center py-3">
                  {day.is_no_bet ? (
                    <span className="text-[#6B7280]">-</span>
                  ) : (
                    <PnLCell value={day.single_pnl} hasAction={day.bets_placed.single} />
                  )}
                </td>
                <td className="text-center py-3">
                  {day.is_no_bet ? (
                    <span className="text-[#6B7280]">-</span>
                  ) : (
                    <PnLCell value={day.parlay_2_pnl} hasAction={day.bets_placed.parlay2} />
                  )}
                </td>
                <td className="text-center py-3">
                  {day.is_no_bet ? (
                    <span className="text-[#6B7280]">-</span>
                  ) : (
                    <PnLCell value={day.parlay_4_pnl} hasAction={day.bets_placed.parlay4} />
                  )}
                </td>
                <td className="text-right py-3">
                  {day.is_no_bet ? (
                    <div className="flex items-center justify-end gap-2">
                      <Eye className="w-4 h-4 text-[#6B7280]" />
                      <span className="text-[#6B7280] text-sm">No Bet</span>
                    </div>
                  ) : (
                    <span className={`font-semibold ${
                      day.total_pnl > 0 ? 'text-green-400' : 
                      day.total_pnl < 0 ? 'text-red-400' : 'text-[#6B7280]'
                    }`}>
                      {day.total_pnl >= 0 ? '+' : ''}${day.total_pnl.toFixed(0)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/**
 * P&L Cell Component for table
 */
function PnLCell({ value, hasAction }) {
  if (!hasAction) {
    return <span className="text-[#6B7280]">-</span>;
  }

  if (value === 0) {
    return (
      <div className="flex items-center justify-center">
        <Minus className="w-4 h-4 text-[#6B7280]" />
      </div>
    );
  }

  const isPositive = value > 0;
  return (
    <div className="flex items-center justify-center gap-1">
      {isPositive ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400" />
      )}
      <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}${value.toFixed(0)}
      </span>
    </div>
  );
}

/**
 * Methodology Section Component
 */
function MethodologySection({ methodology, show, onToggle }) {
  if (!methodology) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 text-left"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-[#F4C430]" />
          <h2 className="text-xl font-bold text-[#E5E7EB]">Methodology</h2>
        </div>
        <div className={`transform transition-transform ${show ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 space-y-6"
        >
          <p className="text-[#9CA3AF]">{methodology.overview}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(methodology).filter(([key]) => key !== 'overview').map(([key, section]) => (
              <div key={key} className="bg-[#1F2937] rounded-lg p-4">
                <h3 className="font-semibold text-[#E5E7EB] mb-2">{section.title}</h3>
                <p className="text-[#9CA3AF] text-sm">{section.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}