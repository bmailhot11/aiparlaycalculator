import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Target, Lightbulb, Calendar, Loader2 } from 'lucide-react';

export default function WeeklyAIReport({ bets = [], bankrollData = [], user }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);

  useEffect(() => {
    // Check if we have a cached report from this week
    const cached = localStorage.getItem('weeklyAIReport');
    const cacheDate = localStorage.getItem('weeklyAIReportDate');
    
    if (cached && cacheDate) {
      const weekStart = getWeekStart(new Date());
      const cachedWeekStart = getWeekStart(new Date(cacheDate));
      
      if (weekStart.getTime() === cachedWeekStart.getTime()) {
        setReport(JSON.parse(cached));
        setLastGenerated(new Date(cacheDate));
      }
    }
  }, []);

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const generateReport = async () => {
    if (bets.length === 0) return;

    setLoading(true);
    try {
      // Prepare data for AI analysis
      const recentBets = bets
        .filter(bet => {
          const betDate = new Date(bet.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return betDate >= weekAgo;
        })
        .slice(0, 50); // Limit to recent 50 bets

      const bettingData = {
        bets: recentBets,
        bankroll: bankrollData.length > 0 ? {
          current: bankrollData[bankrollData.length - 1]?.balance || 1000,
          history: bankrollData.slice(-7) // Last 7 days
        } : {
          current: 1000,
          history: []
        },
        timeframe: 'weekly'
      };

      // Call the AI API for professional analysis
      const response = await fetch('/api/ai-report/generate-weekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bettingData,
          userId: user?.id || 'guest_' + Date.now()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI report');
      }

      const result = await response.json();
      
      if (result.success) {
        const newReport = {
          ...result.report,
          generatedAt: new Date().toISOString(),
          period: `Week of ${getWeekStart(new Date()).toLocaleDateString()}`,
          type: 'ai_generated'
        };

        setReport(newReport);
        setLastGenerated(new Date());
        
        // Cache the report
        localStorage.setItem('weeklyAIReport', JSON.stringify(newReport));
        localStorage.setItem('weeklyAIReportDate', new Date().toISOString());
      } else {
        throw new Error(result.error || 'Unknown error generating report');
      }
      
    } catch (error) {
      console.error('Failed to generate report:', error);
      // Fallback to simplified analysis
      generateFallbackReport();
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackReport = () => {
    const recentBets = bets
      .filter(bet => {
        const betDate = new Date(bet.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return betDate >= weekAgo;
      });

    const settledBets = recentBets.filter(bet => bet.result !== 'pending');
    const totalProfit = settledBets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
    const totalStaked = settledBets.reduce((sum, bet) => sum + bet.stake, 0);
    const winRate = settledBets.length > 0 ? (settledBets.filter(bet => bet.result === 'won').length / settledBets.length * 100) : 0;

    const fallbackReport = {
      summary: `You placed ${recentBets.length} bets this week with a ${winRate.toFixed(1)}% win rate, generating ${totalProfit >= 0 ? 'a profit' : 'a loss'} of $${totalProfit.toFixed(2)}.`,
      kpis: `Win Rate: ${winRate.toFixed(1)}%, ROI: ${totalStaked > 0 ? ((totalProfit/totalStaked)*100).toFixed(1) : 0}%, Total Staked: $${totalStaked.toFixed(2)}`,
      diagnostics: 'Continue tracking your bets to unlock detailed AI analysis and recommendations.',
      habits: 'Betting pattern analysis will be available once you have more historical data.',
      clv: 'CLV analysis requires more betting history and closing line data.',
      risk: 'Keep your stakes consistent and within your bankroll management rules.',
      actionPlan: '1. Continue logging all bets\n2. Track your closing line value\n3. Review your worst performing markets\n4. Maintain consistent stake sizing',
      narrative: `This week you showed ${winRate >= 55 ? 'strong' : winRate >= 45 ? 'decent' : 'concerning'} betting performance. Focus on data collection to unlock deeper insights.`,
      type: 'fallback'
    };

    setReport(fallbackReport);
    setLastGenerated(new Date());
  };

  const generateInsights = (data) => {
    const insights = [];

    // Performance insight
    if (data.winRate > 0.6) {
      insights.push({
        type: 'positive',
        category: 'Performance',
        title: 'Strong Win Rate',
        content: `You're maintaining an excellent ${(data.winRate * 100).toFixed(1)}% win rate. This suggests good bet selection and discipline.`
      });
    } else if (data.winRate < 0.4) {
      insights.push({
        type: 'warning',
        category: 'Performance',
        title: 'Win Rate Concerns',
        content: `Your ${(data.winRate * 100).toFixed(1)}% win rate is below optimal. Consider reviewing your bet selection criteria.`
      });
    }

    // Bankroll management
    if (data.avgStake > 0) {
      const stakePercent = (data.avgStake / (data.bankrollTrend + data.totalProfit)) * 100;
      if (stakePercent > 5) {
        insights.push({
          type: 'warning',
          category: 'Bankroll',
          title: 'Stake Size Alert',
          content: 'Your average stake size may be too large relative to your bankroll. Consider implementing stricter unit sizing.'
        });
      } else if (stakePercent < 1) {
        insights.push({
          type: 'neutral',
          category: 'Bankroll',
          title: 'Conservative Approach',
          content: 'Your stake sizing is very conservative, which is good for bankroll preservation but may limit growth potential.'
        });
      }
    }

    // Sport/market diversification
    if (data.sports.length === 1) {
      insights.push({
        type: 'neutral',
        category: 'Strategy',
        title: 'Sport Focus',
        content: `You're focusing exclusively on ${data.sports[0]}. Consider diversifying across sports to spread risk.`
      });
    } else if (data.sports.length > 5) {
      insights.push({
        type: 'warning',
        category: 'Strategy',
        title: 'Over-Diversification',
        content: 'You may be spreading too thin across multiple sports. Focus on markets you understand best.'
      });
    }

    // Profit/loss patterns
    if (data.totalProfit > 0) {
      insights.push({
        type: 'positive',
        category: 'Results',
        title: 'Profitable Period',
        content: `You've generated $${data.totalProfit.toFixed(2)} in profit this period. Keep following your proven strategies.`
      });
    }

    // Add default insights if none generated
    if (insights.length === 0) {
      insights.push({
        type: 'neutral',
        category: 'Analysis',
        title: 'Building Your Track Record',
        content: 'Continue tracking your bets to unlock deeper AI insights about your betting patterns and performance.'
      });
    }

    return insights;
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default: return <Target className="w-5 h-5 text-blue-400" />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive': return 'bg-green-900/30 border-green-700';
      case 'warning': return 'bg-yellow-900/30 border-yellow-700';
      default: return 'bg-blue-900/30 border-blue-700';
    }
  };

  return (
    <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-[#F4C430]" />
          <h3 className="text-lg font-semibold text-[#E5E7EB]">AI Weekly Report</h3>
        </div>
        <button
          onClick={generateReport}
          disabled={loading || bets.length === 0}
          className="flex items-center gap-2 bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded-lg font-medium hover:bg-[#e6b829] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4" />
          )}
          {loading ? 'Analyzing...' : 'Generate Report'}
        </button>
      </div>

      {!report && bets.length === 0 && (
        <div className="text-center py-8 text-[#9CA3AF]">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="mb-2">No betting data available</p>
          <p className="text-sm">Add some bets to generate AI-powered insights</p>
        </div>
      )}

      {!report && bets.length > 0 && (
        <div className="text-center py-8 text-[#9CA3AF]">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="mb-4">AI insights are ready to be generated</p>
          <p className="text-sm mb-4">Click "Generate Report" to get personalized AI analysis of your betting patterns</p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="flex items-center gap-2 text-sm text-[#9CA3AF] pb-4 border-b border-[#374151]">
            <Calendar className="w-4 h-4" />
            <span>{report.period}</span>
            <span>•</span>
            <span>Generated {new Date(report.generatedAt).toLocaleDateString()}</span>
            <span className="ml-auto px-2 py-1 bg-[#F4C430]/20 text-[#F4C430] rounded text-xs">
              {report.type === 'ai_generated' ? 'AI Analysis' : 'Basic Report'}
            </span>
          </div>

          {/* Summary Section */}
          <div className="bg-[#0B0F14] border border-[#374151] rounded-lg p-4">
            <h4 className="text-md font-semibold text-[#E5E7EB] mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              Weekly Summary
            </h4>
            <p className="text-sm text-[#E5E7EB]/90 leading-relaxed">{report.summary}</p>
          </div>

          {/* KPIs Section */}
          <div className="bg-[#0B0F14] border border-[#374151] rounded-lg p-4">
            <h4 className="text-md font-semibold text-[#E5E7EB] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Key Performance Indicators
            </h4>
            <div className="text-sm text-[#E5E7EB]/90 whitespace-pre-line">{report.kpis}</div>
          </div>

          {/* Diagnostics & Recommendations */}
          <div className="bg-[#0B0F14] border border-[#374151] rounded-lg p-4">
            <h4 className="text-md font-semibold text-[#E5E7EB] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Diagnostics & Recommendations
            </h4>
            <div className="text-sm text-[#E5E7EB]/90 whitespace-pre-line">{report.diagnostics}</div>
          </div>

          {/* Betting Habits Analysis */}
          <div className="bg-[#0B0F14] border border-[#374151] rounded-lg p-4">
            <h4 className="text-md font-semibold text-[#E5E7EB] mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Betting Habits & Patterns
            </h4>
            <div className="text-sm text-[#E5E7EB]/90 whitespace-pre-line">{report.habits}</div>
          </div>

          {/* CLV Analysis */}
          <div className="bg-[#0B0F14] border border-[#374151] rounded-lg p-4">
            <h4 className="text-md font-semibold text-[#E5E7EB] mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Closing Line Value (CLV) Analysis
            </h4>
            <div className="text-sm text-[#E5E7EB]/90 whitespace-pre-line">{report.clv}</div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-[#0B0F14] border border-red-700/50 rounded-lg p-4">
            <h4 className="text-md font-semibold text-[#E5E7EB] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Risk Assessment
            </h4>
            <div className="text-sm text-[#E5E7EB]/90 whitespace-pre-line">{report.risk}</div>
          </div>

          {/* Action Plan */}
          <div className="bg-[#0B0F14] border border-[#F4C430]/30 rounded-lg p-4">
            <h4 className="text-md font-semibold text-[#E5E7EB] mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#F4C430]" />
              Action Plan
            </h4>
            <div className="text-sm text-[#E5E7EB]/90 whitespace-pre-line">{report.actionPlan}</div>
          </div>

          {/* Quick Email-Style Narrative */}
          <div className="bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/5 border border-[#F4C430]/30 rounded-lg p-4">
            <h4 className="text-md font-semibold text-[#E5E7EB] mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#F4C430]" />
              Weekly Recap Summary
            </h4>
            <div className="text-sm text-[#E5E7EB]/90 italic">{report.narrative}</div>
          </div>

          {lastGenerated && (
            <div className="text-center pt-4 border-t border-[#374151]">
              <p className="text-xs text-[#6B7280]">
                📅 Reports generate every Monday at noon • Next update: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}