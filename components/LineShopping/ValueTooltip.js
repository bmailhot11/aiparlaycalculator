import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, TrendingUp, Target, Zap, Gem } from 'lucide-react';

const ValueTooltip = ({ type, children, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const tooltipContent = {
    ev: {
      title: "Expected Value (+EV)",
      icon: <TrendingUp className="w-5 h-5 text-green-400" />,
      explanation: "Expected Value shows if a bet is mathematically profitable long-term. A +3.2% EV means you expect to win 3.2% more than you risk over many bets.",
      example: "If you bet $100 on +3.2% EV bets 100 times, you'd expect to profit $320 total.",
      color: "border-green-400"
    },
    arbitrage: {
      title: "Arbitrage Opportunity",
      icon: <Zap className="w-5 h-5 text-blue-400" />,
      explanation: "Arbitrage lets you bet both sides of a game at different sportsbooks to guarantee profit regardless of outcome.",
      example: "Bet Team A at +110 (Book 1) and Team B at +110 (Book 2). One bet wins, covering the other bet with profit.",
      color: "border-blue-400"
    },
    clv: {
      title: "Closing Line Value (CLV)",
      icon: <Target className="w-5 h-5 text-purple-400" />,
      explanation: "CLV compares the odds you got vs. the final odds before the game. Positive CLV indicates you got better odds than the market's final assessment.",
      example: "You bet at +150, but the line closed at +130. Your +20 CLV suggests you found value.",
      color: "border-purple-400"
    },
    edge: {
      title: "High Edge Opportunity",
      icon: <Gem className="w-5 h-5 text-purple-400" />,
      explanation: "High edge (5%+ EV) bets are rare and valuable. These represent significant market inefficiencies that sharp bettors target.",
      example: "A 8.5% edge bet means the market is significantly undervaluing this outcome.",
      color: "border-purple-400"
    }
  };

  const content = tooltipContent[type];
  if (!content) return children;

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="cursor-help"
      >
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile/Touch: Full Screen Modal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setIsOpen(false)}
            >
              <div className="absolute inset-4 top-20">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gray-900 rounded-lg p-6 h-full overflow-y-auto"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {content.icon}
                      <h3 className="text-lg font-semibold text-white">
                        {content.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">What is this?</h4>
                      <p className="text-gray-400 leading-relaxed">
                        {content.explanation}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">Example</h4>
                      <p className="text-gray-400 leading-relaxed">
                        {content.example}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-500">
                        💡 Tip: Look for these opportunities consistently to improve your long-term results.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Desktop: Hover Tooltip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-80 bg-gray-900 border ${content.color} rounded-lg p-4 shadow-xl z-50 hidden md:block`}
            >
              <div className="flex items-start gap-3 mb-3">
                {content.icon}
                <h3 className="font-semibold text-white text-sm">
                  {content.title}
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-gray-300 leading-relaxed">
                  {content.explanation}
                </p>

                <div className="bg-gray-800 rounded p-3">
                  <p className="text-gray-400">
                    <span className="font-medium text-white">Example:</span> {content.example}
                  </p>
                </div>

                <p className="text-gray-500 text-xs">
                  💡 Click to learn more about betting concepts
                </p>
              </div>

              {/* Arrow */}
              <div className={`absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900`}></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Quick access educational tooltips
export const EducationalHints = ({ showHints = true }) => {
  if (!showHints) return null;

  return (
    <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-blue-400">New to line shopping?</span>
      </div>
      <div className="text-sm text-gray-300 space-y-1">
        <p>• Look for <span className="text-yellow-400">⭐ yellow stars</span> for +EV (profitable) bets</p>
        <p>• <span className="text-[#F4C430]">Gold highlights</span> show the best available odds</p>
        <p>• <span className="text-purple-400">💎 Gems</span> indicate rare high-value opportunities</p>
        <p>• Click any value indicator to learn more!</p>
      </div>
    </div>
  );
};

export default ValueTooltip;