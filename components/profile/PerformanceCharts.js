import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function PerformanceCharts({ bets = [], clvData = [] }) {
  // Calculate performance metrics
  const settledBets = bets.filter(bet => bet.result !== 'pending');
  const wonBets = settledBets.filter(bet => bet.result === 'won');
  const lostBets = settledBets.filter(bet => bet.result === 'lost');
  
  const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0;
  const totalStaked = settledBets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalProfit = settledBets.reduce((sum, bet) => sum + bet.profit, 0);
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

  // Generate profit/loss timeline
  const profitTimeline = settledBets
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .reduce((acc, bet, index) => {
      const runningTotal = index === 0 ? bet.profit : acc[index - 1].cumulative + bet.profit;
      acc.push({
        date: bet.date,
        profit: bet.profit,
        cumulative: runningTotal
      });
      return acc;
    }, []);

  // Chart data
  const profitChartData = {
    labels: profitTimeline.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Cumulative P&L',
        data: profitTimeline.map(item => item.cumulative),
        borderColor: roi >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        backgroundColor: roi >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      }
    ]
  };

  const winRateChartData = {
    labels: ['Wins', 'Losses'],
    datasets: [
      {
        data: [wonBets.length, lostBets.length],
        backgroundColor: ['#22C55E', '#EF4444'],
        borderColor: ['#16A34A', '#DC2626'],
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 0,
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
      },
    },
  };

  // Performance stats
  const stats = [
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      color: winRate >= 55 ? 'text-green-400' : winRate >= 45 ? 'text-yellow-400' : 'text-red-400'
    },
    {
      label: 'ROI',
      value: `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`,
      icon: roi >= 0 ? TrendingUp : TrendingDown,
      color: roi >= 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      label: 'Total Staked',
      value: `$${totalStaked.toFixed(2)}`,
      icon: BarChart3,
      color: 'text-[#F4C430]'
    },
    {
      label: 'Net Profit',
      value: `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`,
      icon: totalProfit >= 0 ? TrendingUp : TrendingDown,
      color: totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
    }
  ];

  if (settledBets.length === 0) {
    return (
      <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[#E5E7EB] mb-6">Performance Analytics</h3>
        <div className="text-center py-8 text-[#9CA3AF]">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="mb-2">No settled bets yet</p>
          <p className="text-sm">Add some completed bets to see your performance analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Stats */}
      <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[#E5E7EB] mb-6">Performance Stats</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-[#0B0F14] border border-[#374151] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#9CA3AF]">{stat.label}</span>
                  <IconComponent className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className={`text-xl font-semibold ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit/Loss Timeline */}
        <div className="lg:col-span-2 bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#E5E7EB] mb-6">Profit & Loss Timeline</h3>
          <div className="h-64">
            <Line data={profitChartData} options={chartOptions} />
          </div>
        </div>

        {/* Win/Loss Distribution */}
        <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#E5E7EB] mb-6">Win/Loss Distribution</h3>
          <div className="h-48 mb-4">
            <Doughnut data={winRateChartData} options={doughnutOptions} />
          </div>
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-[#E5E7EB]">Wins: {wonBets.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-[#E5E7EB]">Losses: {lostBets.length}</span>
              </div>
            </div>
            <p className="text-lg font-semibold text-[#F4C430]">
              {winRate.toFixed(1)}% Win Rate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}