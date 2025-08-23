// AI Performance Dashboard Component for User Confidence Building
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Download,
  ThumbsUp,
  Award,
  BarChart3,
  Zap,
  CheckCircle,
  DollarSign,
  Star,
  Eye
} from 'lucide-react';

export default function AIPerformanceDashboard({ 
  period = 30, 
  user_id = null, 
  showUserStats = false,
  compact = false 
}) {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod, user_id]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period: selectedPeriod.toString(),
        bet_type: 'all'
      });
      
      if (user_id) {
        params.append('user_id', user_id);
      }

      const response = await fetch(`/api/ai-bets/performance?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPerformanceData(data);
      } else {
        setError(data.message || 'Failed to load AI performance data');
      }
    } catch (err) {
      setError('Network error loading AI performance');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-[#9CA3AF]">Loading AI performance...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <Brain className="w-12 h-12 mx-auto mb-4 text-[#6B7280]" />
        <p className="text-[#9CA3AF] mb-4">{error}</p>
        <button onClick={fetchPerformanceData} className="btn btn-outline">
          Try Again
        </button>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="card text-center py-8">
        <Brain className="w-12 h-12 mx-auto mb-4 text-[#6B7280]" />
        <p className="text-[#9CA3AF]">AI performance data will appear as bets are tracked</p>
      </div>
    );
  }

  if (compact) {
    return <CompactPerformanceView data={performanceData} />;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg bg-[#1F2937] p-1">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === days
                  ? 'bg-[#F4C430] text-[#0B0F14]'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#374151]'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Main Performance KPIs */}
      <AIPerformanceKPIs 
        data={performanceData.ai_performance} 
        period={selectedPeriod} 
      />

      {/* User-Specific Stats */}
      {showUserStats && performanceData.user_stats && (
        <UserAIStats data={performanceData.user_stats} />
      )}

      {/* Confidence Building Section */}
      <ConfidenceBuilders data={performanceData.confidence_metrics} />

      {/* Recent Success Stories */}
      <SuccessStories stories={performanceData.confidence_metrics?.success_stories || []} />
    </div>
  );
}

// Main AI Performance KPIs Component
function AIPerformanceKPIs({ data, period }) {
  if (!data) return null;

  const periodData = data.period;
  const allTimeData = data.all_time;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Period Performance */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-[#F4C430]" />
            <h2 className="text-xl font-bold text-[#E5E7EB]">
              AI Performance ({period} Days)
            </h2>
          </div>
          <div className="text-[#6B7280] text-sm">
            {periodData.total_generated} bets generated
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <PerformanceCard
            title="Adoption Rate"
            value={`${periodData.adoption_rate.toFixed(1)}%`}
            subtitle={`${periodData.total_downloaded} downloaded`}
            icon={Download}
            positive={periodData.adoption_rate >= 50}
            trend={periodData.adoption_rate >= 50 ? 'up' : 'stable'}
          />
          <PerformanceCard
            title="Win Rate"
            value={`${periodData.win_rate.toFixed(1)}%`}
            subtitle={`${periodData.wins}W-${periodData.losses}L`}
            icon={Target}
            positive={periodData.win_rate >= 50}
            trend={periodData.win_rate >= 50 ? 'up' : 'down'}
          />
          <PerformanceCard
            title="AI ROI"
            value={`${periodData.roi >= 0 ? '+' : ''}${periodData.roi.toFixed(1)}%`}
            subtitle="Return on investment"
            icon={TrendingUp}
            positive={periodData.roi >= 0}
            trend={periodData.roi >= 0 ? 'up' : 'down'}
          />
          <PerformanceCard
            title="Net Profit"
            value={`${periodData.net_profit >= 0 ? '+' : ''}$${periodData.net_profit.toFixed(0)}`}
            subtitle={`${periodData.total_settled} settled`}
            icon={DollarSign}
            positive={periodData.net_profit >= 0}
            trend={periodData.net_profit >= 0 ? 'up' : 'down'}
          />
        </div>
      </div>

      {/* All-Time Stats */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-[#F4C430]" />
          <h2 className="text-xl font-bold text-[#E5E7EB]">All-Time AI Performance</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#F4C430] mb-1">
              {allTimeData.total_generated.toLocaleString()}
            </div>
            <div className="text-[#6B7280] text-sm">Total AI Bets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {allTimeData.win_rate.toFixed(1)}%
            </div>
            <div className="text-[#6B7280] text-sm">Overall Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {allTimeData.cumulative_roi >= 0 ? '+' : ''}{allTimeData.cumulative_roi.toFixed(1)}%
            </div>
            <div className="text-[#6B7280] text-sm">Cumulative ROI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              ${allTimeData.cumulative_profit.toFixed(0)}
            </div>
            <div className="text-[#6B7280] text-sm">Total Profit</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Individual Performance Card Component
function PerformanceCard({ title, value, subtitle, icon: Icon, positive, trend }) {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  
  return (
    <div className="text-center">
      <Icon className="w-6 h-6 mx-auto mb-2 text-[#F4C430]" />
      <div className={`text-2xl font-bold mb-1 flex items-center justify-center gap-2 ${
        positive ? 'text-green-400' : 'text-red-400'
      }`}>
        {value}
        {trendIcon && <trendIcon className="w-4 h-4" />}
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

// User-Specific AI Stats Component
function UserAIStats({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-[#F4C430]" />
        <h2 className="text-xl font-bold text-[#E5E7EB]">Your AI Bet Performance</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#E5E7EB] mb-1">
            {data.personal_stats.total_generated}
          </div>
          <div className="text-[#6B7280] text-sm">AI Bets Generated</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {data.personal_stats.win_rate.toFixed(1)}%
          </div>
          <div className="text-[#6B7280] text-sm">Personal Win Rate</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold mb-1 ${
            data.personal_stats.profit >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {data.personal_stats.profit >= 0 ? '+' : ''}${data.personal_stats.profit.toFixed(0)}
          </div>
          <div className="text-[#6B7280] text-sm">Your Profit</div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-[#374151]">
        <div className="flex items-center justify-between">
          <span className="text-[#9CA3AF] text-sm">Confidence Level:</span>
          <span className="text-[#F4C430] font-medium capitalize">
            {data.personal_stats.confidence_level}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Confidence Building Metrics Component
function ConfidenceBuilders({ data }) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center gap-3 mb-6">
        <Star className="w-6 h-6 text-[#F4C430]" />
        <h2 className="text-xl font-bold text-[#E5E7EB]">Trust & Confidence Metrics</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0F172A] rounded-lg p-4 text-center">
          <ThumbsUp className="w-8 h-8 mx-auto mb-3 text-green-400" />
          <div className="text-2xl font-bold text-green-400 mb-1">
            {data.user_sentiment.positive_feedback_rate.toFixed(0)}%
          </div>
          <div className="text-[#6B7280] text-sm">Positive User Feedback</div>
          <div className="text-xs text-[#6B7280] mt-1">
            {data.user_sentiment.total_feedback_count} total reviews
          </div>
        </div>
        
        <div className="bg-[#0F172A] rounded-lg p-4 text-center">
          <Eye className="w-8 h-8 mx-auto mb-3 text-blue-400" />
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {data.trust_indicators.transparency_score}%
          </div>
          <div className="text-[#6B7280] text-sm">Transparency Score</div>
          <div className="text-xs text-[#6B7280] mt-1">
            Full methodology disclosed
          </div>
        </div>
        
        <div className="bg-[#0F172A] rounded-lg p-4 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-3 text-purple-400" />
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {data.trust_indicators.track_record_days}+
          </div>
          <div className="text-[#6B7280] text-sm">Days of Track Record</div>
          <div className="text-xs text-[#6B7280] mt-1">
            Consistent performance tracking
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Success Stories Component
function SuccessStories({ stories }) {
  if (!stories || stories.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-bold text-[#E5E7EB]">Recent AI Wins</h2>
      </div>
      
      <div className="space-y-4">
        {stories.slice(0, 3).map((story, index) => (
          <div key={index} className="bg-[#0F172A] rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#F4C430]" />
                <span className="text-[#E5E7EB] font-medium">
                  {story.total_legs}-Leg {story.bet_type.replace('_', ' ')}
                </span>
              </div>
              <div className="text-green-400 font-bold">
                WON ${story.actual_payout.toFixed(0)}
              </div>
            </div>
            {story.ai_reasoning && (
              <p className="text-[#9CA3AF] text-sm">
                {story.ai_reasoning.slice(0, 150)}...
              </p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Compact View for Smaller Spaces
function CompactPerformanceView({ data }) {
  const periodData = data.ai_performance?.period;
  
  if (!periodData) return null;

  return (
    <div className="bg-[#1F2937] rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-5 h-5 text-[#F4C430]" />
        <span className="text-[#E5E7EB] font-medium">AI Performance</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">
            {periodData.win_rate.toFixed(0)}%
          </div>
          <div className="text-[#6B7280] text-xs">Win Rate</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${
            periodData.roi >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {periodData.roi >= 0 ? '+' : ''}{periodData.roi.toFixed(0)}%
          </div>
          <div className="text-[#6B7280] text-xs">ROI</div>
        </div>
      </div>
    </div>
  );
}