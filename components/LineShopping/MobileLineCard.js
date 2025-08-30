import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  TrendingUp,
  Clock,
  Bookmark,
  BarChart3,
  Star,
  Flame,
  Gem,
  Zap
} from 'lucide-react';

const MobileLineCard = ({ line, isSaved, onToggleSaved, onTrackBet }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const primaryMarket = Object.values(line.markets)[0];

  const getValueIcon = (value) => {
    if (value >= 8) return <Gem className="w-4 h-4 text-purple-400" />;
    if (value >= 5) return <Flame className="w-4 h-4 text-orange-400" />;
    if (value >= 2) return <Star className="w-4 h-4 text-yellow-400" />;
    return null;
  };

  const getValueColor = (value) => {
    if (value >= 5) return 'text-green-400';
    if (value >= 2) return 'text-yellow-400';
    if (value > 0) return 'text-blue-400';
    return 'text-gray-400';
  };

  const formatOdds = (odds) => {
    if (typeof odds === 'string' && odds.includes('+')) return odds;
    return odds > 0 ? `+${odds}` : odds;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden"
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getValueIcon(line.maxEV)}
              <h3 className="font-semibold text-white text-lg leading-tight">
                {line.game}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-3 h-3" />
              {line.gameTime}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onToggleSaved(line.id)}
              className={`p-2 rounded-lg transition-colors ${
                isSaved 
                  ? 'bg-[#F4C430] text-black' 
                  : 'bg-white/10 text-gray-300'
              }`}
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Market Info */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-gray-400 mb-1">
              {primaryMarket.selection.includes('+') || primaryMarket.selection.includes('-') ? 'Spread' : 'Moneyline'}
            </div>
            <div className="text-xs text-gray-500">
              {primaryMarket.selection}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-[#F4C430] mb-1">
              {primaryMarket.bestOdds}
            </div>
            <div className="text-sm text-[#F4C430]">
              {primaryMarket.bestBook}
            </div>
          </div>
        </div>

        {/* Value Indicator */}
        {primaryMarket.isEV && (
          <div className={`flex items-center gap-1 mb-3 ${getValueColor(primaryMarket.value)}`}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">
              +{primaryMarket.value.toFixed(1)}% Expected Value
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 bg-white/10 text-white py-2 px-4 rounded-lg font-medium transition-colors hover:bg-white/20 flex items-center justify-center gap-2"
          >
            <span>View All Markets</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          <button
            onClick={() => onTrackBet(line.id)}
            className="bg-blue-500/20 text-blue-400 py-2 px-4 rounded-lg font-medium transition-colors hover:bg-blue-500/30 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Track
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {Object.entries(line.markets).map(([marketType, market]) => (
                <div key={marketType} className="space-y-2">
                  <h4 className="font-medium text-gray-300 uppercase text-sm tracking-wide">
                    {marketType === 'moneyline' ? 'Moneyline' : 
                     marketType === 'spread' ? 'Point Spread' :
                     marketType === 'total' ? 'Total Points' : marketType}
                  </h4>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    {market.selection}
                  </div>

                  <div className="space-y-1">
                    {market.allBooks.slice(0, 3).map((book, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <div className="flex items-center gap-2">
                          {idx === 0 && (
                            <div className="px-2 py-0.5 bg-[#F4C430]/20 text-[#F4C430] text-xs rounded font-medium">
                              BEST
                            </div>
                          )}
                          <span className={idx === 0 ? 'text-[#F4C430] font-medium text-sm' : 'text-gray-300 text-sm'}>
                            {book.name}
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <div className={`font-mono text-sm ${idx === 0 ? 'text-[#F4C430] font-bold' : 'text-white'}`}>
                            {formatOdds(book.odds)}
                          </div>
                          {book.value > 0 && (
                            <div className={`text-xs ${getValueColor(book.value)}`}>
                              +{book.value.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileLineCard;