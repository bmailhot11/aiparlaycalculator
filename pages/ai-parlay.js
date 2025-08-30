import { useState, useContext, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { 
  Brain,
  AlertCircle,
  Check,
  Download,
  Copy,
  Sliders,
  Target,
  TrendingUp,
  Zap,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';
import { useAuth } from '../contexts/AuthContext';
import { renderSlipImage, downloadImage, copyImageToClipboard } from '../utils/renderSlipImage';
import { generateImprovedSlipImage, downloadImprovedSlip } from '../utils/generateImprovedSlipImage';
import { apiFetch } from '../utils/api';

export default function AIParlayPage() {
  const { isPremium } = useContext(PremiumContext);
  const { user } = useAuth();
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('NFL');
  const [selectedLeague, setSelectedLeague] = useState('All Games');
  const [parlaySize, setParlaySize] = useState('3');
  const [riskLevel, setRiskLevel] = useState('moderate');
  const [includePlayerProps, setIncludePlayerProps] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedParlay, setGeneratedParlay] = useState(null);
  const [copied, setCopied] = useState(false);
  const [usageData, setUsageData] = useState({ generations: 0 });
  const [showPaywall, setShowPaywall] = useState(false);
  const [useEnhancedEV, setUseEnhancedEV] = useState(true); // Use enhanced EV calculations

  // Hero background images (sports-related)
  const backgroundImages = [
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150'
  ];

  // Sport and league options
  const sportOptions = {
    'NFL': ['All Games', 'Primetime', 'Division Games', 'Favorites', 'Underdogs'],
    'NBA': ['All Games', 'National TV', 'Division', 'Home Favorites', 'Road Dogs'],
    'NHL': ['All Games', 'Division', 'Original Six', 'Favorites', 'Totals'],
    'MLB': ['All Games', 'Division', 'Day Games', 'Night Games', 'Run Lines'],
    'NCAAF': ['All Games', 'Top 25', 'Conference', 'Ranked vs Ranked'],
    'NCAAB': ['All Games', 'Top 25', 'Conference', 'Tournament']
  };

  useEffect(() => {
    if (!isPremium && user) {
      checkUsage();
    }
  }, [isPremium, user]);

  const checkUsage = async () => {
    if (!user) return;
    
    try {
      const response = await apiFetch(`/api/check-usage?userIdentifier=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setUsageData(data.usage);
      }
    } catch (error) {
      console.error('Error checking usage:', error);
    }
  };

  const handlePremiumClick = (e) => {
    e.preventDefault();
    if (!user) {
      localStorage.setItem('redirectAfterAuth', '/pricing');
      router.push('/auth/signin');
    } else {
      router.push('/pricing');
    }
  };

  const sampleParlay = {
    id: 'parlay_001',
    legs: [
      { team: 'Chiefs', selection: 'Chiefs -3.5', odds: '-110', book: 'DraftKings', confidence: 85 },
      { team: 'Lakers', selection: 'Lakers ML', odds: '+120', book: 'FanDuel', confidence: 78 },
      { team: 'Celtics vs Heat', selection: 'Over 215.5', odds: '-105', book: 'BetMGM', confidence: 82 }
    ],
    totalOdds: '+650',
    impliedProbability: '13.3%',
    expectedValue: '+4.2%',
    recommendedStake: '$25',
    potentialPayout: '$187.50',
    reasoning: 'This parlay combines strong home favorites with a well-researched total. The Chiefs have excellent ATS record at home, Lakers are undervalued coming off rest, and the Celtics-Heat matchup has consistently gone over in recent meetings.'
  };

  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    setSelectedLeague('All Games'); // Reset to all games when sport changes
  };

  const handleGenerateParlay = async () => {
    // Check if user is signed in first
    if (!user) {
      localStorage.setItem('redirectAfterAuth', '/ai-parlay');
      router.push('/auth/signin');
      return;
    }
    
    if (!selectedSport) {
      alert('Please select a sport');
      return;
    }

    // Check usage limits for free users
    if (!isPremium) {
      if (usageData.generations >= 1) {
        setShowPaywall(true);
        return;
      }
      
      // Track usage before processing
      try {
        const userIdentifier = user?.id || `anon_${Date.now()}`;
        const trackResponse = await fetch('/api/track-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generation',
            userIdentifier: userIdentifier
          }),
        });
        
        if (!trackResponse.ok) {
          const error = await trackResponse.json();
          if (trackResponse.status === 429) {
            setShowPaywall(true);
            return;
          }
        } else {
          const trackData = await trackResponse.json();
          setUsageData(trackData.usage);
        }
      } catch (error) {
        console.error('Error tracking usage:', error);
      }
    }

    setIsGenerating(true);
    
    try {
      // Use enhanced EV endpoint if enabled, otherwise use regular endpoint
      const endpoint = useEnhancedEV ? '/api/generate-parlay-ev' : '/api/generate-parlay';
      
      const response = await apiFetch('/api/generate-parlay-optimized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: selectedSport,
          league: selectedLeague || 'All Games',
          riskLevel,
          legs: parseInt(parlaySize),
          includePlayerProps: includePlayerProps
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Calculate real payout based on $10 stake
        const stake = 10;
        const totalDecimalOdds = parseFloat(data.parlay.total_decimal_odds) || 2.0;
        const potentialPayout = (stake * totalDecimalOdds).toFixed(2);
        const profit = (potentialPayout - stake).toFixed(2);
        
        // Calculate implied probability from decimal odds
        const impliedProb = ((1 / totalDecimalOdds) * 100).toFixed(1);
        
        // Map the API response to our expected format with real data
        const mappedParlay = {
          id: 'parlay_' + Date.now(),
          legs: data.parlay.parlay_legs || data.parlay.legs || [],
          totalOdds: data.parlay.total_american_odds || '+500',
          impliedProbability: impliedProb + '%',
          expectedValue: data.parlay.expected_value ? 
            (data.parlay.expected_value >= 0 ? '+' : '') + (data.parlay.expected_value * 100).toFixed(1) + '%' : 
            'N/A',
          potentialPayout: '$' + potentialPayout,
          profit: '$' + profit,
          stake: '$10',
          reasoning: data.parlay.risk_assessment || data.parlay.edge_analysis || 'AI-generated parlay optimized for value across premium sportsbooks.'
        };
        setGeneratedParlay(mappedParlay);
        
        // Track the AI-generated parlay
        await trackAIBet({
          user_id: user?.id,
          bet_type: 'ai_parlay',
          source_type: 'generated',
          original_data: {
            preferences: {
              sport: selectedSport,
              riskLevel,
              legs: parseInt(parlaySize)
            }
          },
          recommended_legs: data.parlay.parlay_legs || data.parlay.legs || [],
          ai_reasoning: data.parlay.risk_assessment || data.parlay.edge_analysis || 'AI-generated parlay optimized for value',
          expected_value: data.parlay.expected_value,
          user_action: 'generated'
        });
      } else {
        console.error('API Error:', data);
        alert(`Failed to generate parlay: ${data.message || 'Unknown error'}`);
        // Don't use sample data - show real error
        setGeneratedParlay(null);
      }
    } catch (error) {
      console.error('Error generating parlay:', error);
      alert(`Network error: Unable to connect to server`);
      // Don't use sample data - show real error
      setGeneratedParlay(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSlip = async () => {
    if (generatedParlay) {
      try {
        // Format parlay data for the BetChekr template
        const improvedBets = generatedParlay.legs.map((leg, index) => ({
          league: selectedLeague || selectedSport,
          matchup: leg.game || `${leg.selection} Match`,
          market: getBetTypeDisplayForTemplate(leg.bet_type, leg.point),
          selection: leg.selection,
          odds: leg.odds,
          decimal_odds: convertAmericanToDecimal(leg.odds).toFixed(2),
          sportsbook: leg.sportsbook || leg.book || 'Sportsbook',
          improved: false, // AI parlay legs are optimally selected
          improvement_percentage: 0,
          original_odds: leg.odds
        }));

        const explanation = `AI-Generated ${generatedParlay.legs.length}-Leg Parlay: ${generatedParlay.reasoning}`;

        // Generate BetChekr template image
        const imageData = await generateImprovedSlipImage({
          originalSlip: {
            sportsbook: 'BetChekr AI',
            total_stake: generatedParlay.stake,
            potential_payout: generatedParlay.potentialPayout
          },
          improvedBets: improvedBets,
          explanation: explanation,
          analysis: {
            expectedValue: generatedParlay.expectedValue,
            impliedProbability: generatedParlay.impliedProbability
          }
        });

        if (imageData) {
          // Create download link for the improved slip image
          const link = document.createElement('a');
          link.href = imageData;
          link.download = 'betchekr-ai-parlay.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Track download action
          await trackAIBet({
            user_id: user?.id,
            bet_type: 'ai_parlay',
            source_type: 'generated',
            recommended_legs: improvedBets,
            ai_reasoning: explanation,
            user_action: 'downloaded'
          });
        } else {
          // Fallback to original slip image generation
          const fallbackImageData = await renderSlipImage({
            slip: {
              legs: generatedParlay.legs,
              stake: generatedParlay.stake,
              potentialReturn: generatedParlay.potentialPayout,
              summary: `AI Generated ${generatedParlay.legs.length}-Leg Parlay`,
              date: new Date().toLocaleDateString()
            },
            logoUrl: '/betchekr_owl_logo.png',
            brand: 'BetChekr'
          });
          downloadImage(fallbackImageData);
        }
      } catch (error) {
        console.error('Failed to generate slip image:', error);
        // Fallback to original slip image generation
        const fallbackImageData = await renderSlipImage({
          slip: {
            legs: generatedParlay.legs,
            stake: generatedParlay.stake,
            potentialReturn: generatedParlay.potentialPayout,
            summary: `AI Generated ${generatedParlay.legs.length}-Leg Parlay`,
            date: new Date().toLocaleDateString()
          },
          logoUrl: '/betchekr_owl_logo.png',
          brand: 'BetChekr'
        });
        downloadImage(fallbackImageData);
      }
    }
  };

  const handleCopySlip = async () => {
    if (generatedParlay) {
      try {
        // Format parlay data for the BetChekr template
        const improvedBets = generatedParlay.legs.map((leg, index) => ({
          league: selectedLeague || selectedSport,
          matchup: leg.game || `${leg.selection} Match`,
          market: getBetTypeDisplayForTemplate(leg.bet_type, leg.point),
          selection: leg.selection,
          odds: leg.odds,
          decimal_odds: convertAmericanToDecimal(leg.odds).toFixed(2),
          sportsbook: leg.sportsbook || leg.book || 'Sportsbook',
          improved: false,
          improvement_percentage: 0,
          original_odds: leg.odds
        }));

        const explanation = `AI-Generated ${generatedParlay.legs.length}-Leg Parlay: ${generatedParlay.reasoning}`;

        // Generate BetChekr template image
        const imageData = await generateImprovedSlipImage({
          originalSlip: {
            sportsbook: 'BetChekr AI',
            total_stake: generatedParlay.stake,
            potential_payout: generatedParlay.potentialPayout
          },
          improvedBets: improvedBets,
          explanation: explanation,
          analysis: {
            expectedValue: generatedParlay.expectedValue,
            impliedProbability: generatedParlay.impliedProbability
          }
        });

        if (imageData) {
          // Copy BetChekr template image to clipboard
          const blob = await fetch(imageData).then(r => r.blob());
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);

          // Track share action
          await trackAIBet({
            user_id: user?.id,
            bet_type: 'ai_parlay',
            source_type: 'generated',
            recommended_legs: improvedBets,
            ai_reasoning: explanation,
            user_action: 'shared'
          });
        } else {
          // Fallback to original slip image generation
          const fallbackImageData = await renderSlipImage({
            slip: {
              legs: generatedParlay.legs,
              stake: generatedParlay.stake,
              potentialReturn: generatedParlay.potentialPayout,
              summary: `AI Generated ${generatedParlay.legs.length}-Leg Parlay`,
              date: new Date().toLocaleDateString()
            },
            logoUrl: '/betchekr_owl_logo.png',
            brand: 'BetChekr'
          });
          const success = await copyImageToClipboard(fallbackImageData);
          if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        }
      } catch (error) {
        console.error('Failed to copy slip image:', error);
        // Fallback to original slip image generation
        const fallbackImageData = await renderSlipImage({
          slip: {
            legs: generatedParlay.legs,
            stake: generatedParlay.stake,
            potentialReturn: generatedParlay.potentialPayout,
            summary: `AI Generated ${generatedParlay.legs.length}-Leg Parlay`,
            date: new Date().toLocaleDateString()
          },
          logoUrl: '/betchekr_owl_logo.png',
          brand: 'BetChekr'
        });
        const success = await copyImageToClipboard(fallbackImageData);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    }
  };

  // Helper function to convert American odds to decimal
  const convertAmericanToDecimal = (americanOdds) => {
    if (!americanOdds) return 2.0;
    const odds = parseInt(americanOdds.replace('+', ''));
    if (isNaN(odds)) return 2.0;
    
    if (odds > 0) {
      return (odds / 100) + 1;
    } else {
      return (100 / Math.abs(odds)) + 1;
    }
  };

  // Helper function to get league name from sport selection
  const getLeagueFromSportSelection = (sport) => {
    const sportMap = {
      'NFL': 'NFL',
      'NBA': 'NBA', 
      'NHL': 'NHL',
      'MLB': 'MLB',
      'NCAAF': 'NCAAF',
      'NCAAB': 'NCAAB',
    };
    return sportMap[sport] || sport || 'League';
  };

  // Helper function to format bet type display
  const getBetTypeDisplayForTemplate = (betType, point) => {
    switch(betType) {
      case 'h2h': return 'Moneyline';
      case 'spreads': return point ? `Spread (${point > 0 ? '+' : ''}${point})` : 'Spread';
      case 'totals': return point ? `Total ${point > 0 ? 'Over' : 'Under'} ${Math.abs(point)}` : 'Total';
      default: return betType || 'Standard';
    }
  };

  // Function to track AI bet generation and user actions
  const trackAIBet = async (betData) => {
    try {
      const response = await apiFetch('/api/ai-bets/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(betData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ AI bet tracked:', result.ai_bet_id);
        return result.ai_bet_id;
      }
    } catch (error) {
      console.error('Failed to track AI bet:', error);
    }
    return null;
  };

  const handleFindBetterOdds = async (parlay) => {
    try {
      const response = await fetch('/api/compare-parlay-odds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parlay: parlay.legs || parlay.parlay_legs
        }),
      });

      const data = await response.json();
      
      if (data.success && data.comparison?.sportsbooks?.length > 0) {
        // Update parlay with better odds if found
        alert(`Found better odds! Best sportsbook: ${data.comparison.sportsbooks[0].name} with ${data.comparison.sportsbooks[0].totalOdds} odds`);
      } else {
        alert(data.message || 'No better odds found at this time. Your current selection appears optimal!');
      }
    } catch (error) {
      console.error('Error finding better odds:', error);
      alert('Unable to compare odds right now. Please try again later.');
    }
  };

  return (
    <div className="betchekr-premium">
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
      
      {/* Paywall Overlay */}
      {showPaywall && (
        <Paywall 
          feature="AI parlay generation" 
          usageLimit="1 parlay per day"
        />
      )}

      {/* Authentication Gate */}
      {!user ? (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background Image Grid */}
          <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-5 gap-2 opacity-20">
            {backgroundImages.map((_, index) => (
              <div 
                key={index}
                className="relative w-full h-32 md:h-40 bg-[#1F2937] rounded-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] to-transparent" />
              </div>
            ))}
          </div>
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-[#0B0F14]/70" />
          
          {/* Auth Gate Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center"
          >
            <UserPlus className="w-16 h-16 mx-auto mb-6 text-[#F4C430]" />
            <h1 className="text-4xl md:text-5xl font-bold text-[#E5E7EB] mb-6">
              Create Account to Generate AI Parlays
            </h1>
            <p className="text-xl text-[#9CA3AF] max-w-3xl mx-auto mb-8">
              Sign up for a free account to generate AI-powered parlays with optimal EV calculations. 
              Free users get 1 parlay per day, premium users get unlimited access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signin">
                <button className="bg-[#F4C430] text-[#0B0F14] px-8 py-4 rounded-lg font-semibold hover:bg-[#e6b829] transition-colors min-h-[44px] text-lg">
                  Sign In
                </button>
              </Link>
              <Link href="/auth/signin?mode=signup">
                <button className="border border-[#F4C430] text-[#F4C430] px-8 py-4 rounded-lg font-semibold hover:bg-[#F4C430]/10 transition-colors min-h-[44px] text-lg">
                  Create Free Account
                </button>
              </Link>
            </div>
          </motion.div>
        </section>
      ) : (
        <>
      
      {/* Hero Section with Background Collage */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image Grid */}
        <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-5 gap-2 opacity-20">
          {backgroundImages.map((_, index) => (
            <div 
              key={index}
              className="relative w-full h-32 md:h-40 bg-[#1F2937] rounded-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] to-transparent" />
            </div>
          ))}
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-[#0B0F14]/70" />
        
        {/* Hero Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h1 className="mb-6">
            <Brain className="w-16 h-16 mx-auto mb-4 text-[#F4C430]" />
            AI-Generated Parlay
          </h1>
          <p className="text-[#9CA3AF] text-lg max-w-[720px] mx-auto mb-10">
            Build optimized slips in one click using our AI-powered parlay generator.
          </p>
          
          {/* Parlay Generator Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="card max-w-[800px] mx-auto w-full"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-5 h-5 text-[#F4C430]" />
                <h3 className="text-[#E5E7EB] font-semibold">Customize Your AI Parlay</h3>
              </div>
              
              {/* Sport Selection - Single Select */}
              <div className="space-y-3">
                <label className="block text-[#9CA3AF] text-sm font-medium">Select Sport</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.keys(sportOptions).map(sport => (
                    <button
                      key={sport}
                      onClick={() => handleSportChange(sport)}
                      className={`py-3 px-3 rounded-lg font-medium transition-all text-xs sm:text-sm min-h-[44px] ${
                        selectedSport === sport
                          ? 'bg-[#F4C430] text-[#0B0F14] shadow-lg'
                          : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#253044]'
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* League/Filter Selection - Shows after sport is selected */}
              {selectedSport && (
                <div className="space-y-3">
                  <label className="block text-[#9CA3AF] text-sm font-medium">Filter Games (Optional)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {sportOptions[selectedSport].map(league => (
                      <button
                        key={league}
                        onClick={() => setSelectedLeague(league)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          selectedLeague === league
                            ? 'bg-[#253044] text-[#F4C430] border border-[#F4C430]'
                            : 'bg-[#1F2937] text-[#6B7280] hover:text-[#9CA3AF] hover:bg-[#253044]'
                        }`}
                      >
                        {league}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Configuration Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#9CA3AF] text-sm font-medium mb-2">Parlay Size</label>
                  <select
                    value={parlaySize}
                    onChange={(e) => setParlaySize(e.target.value)}
                    className="select w-full min-h-[44px] py-3 px-4 text-sm sm:text-base"
                  >
                    <option value="2">2 Legs</option>
                    <option value="3">3 Legs</option>
                    <option value="4">4 Legs</option>
                    <option value="5">5 Legs</option>
                    <option value="6">6 Legs</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#9CA3AF] text-sm font-medium mb-2">Risk Level</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value)}
                    className="select w-full min-h-[44px] py-3 px-4 text-sm sm:text-base"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="medium">Medium</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#9CA3AF] text-sm font-medium mb-2">Include Player Props</label>
                  <div className="flex rounded-lg overflow-hidden border border-[#1F2937] h-10">
                    <button
                      onClick={() => setIncludePlayerProps(false)}
                      className={`flex-1 px-3 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                        !includePlayerProps
                          ? 'bg-[#F4C430] text-[#0B0F14]'
                          : 'bg-[#0B1220] text-[#6B7280] hover:text-[#9CA3AF]'
                      }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => setIncludePlayerProps(true)}
                      className={`flex-1 px-3 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                        includePlayerProps
                          ? 'bg-[#F4C430] text-[#0B0F14]'
                          : 'bg-[#0B1220] text-[#6B7280] hover:text-[#9CA3AF]'
                      }`}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
              
              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleGenerateParlay}
                  disabled={isGenerating || !selectedSport}
                  className="btn btn-primary flex-1 min-h-[44px] py-4 px-6 text-sm sm:text-base"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin mr-2" />
                      Generating AI Parlay...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      {isPremium ? 'Generate AI Parlay' : `Generate Parlay (${Math.max(0, 1 - usageData.generations)} remaining today)`}
                    </>
                  )}
                </button>
              </div>
              
              {/* Usage indicator for free users */}
              {!isPremium && (
                <div className="text-center mt-2">
                  <p className="text-[#6B7280] text-xs sm:text-sm">
                    Free: {Math.max(0, 1 - usageData.generations)} parlay remaining today | 
                    <button onClick={handlePremiumClick} className="text-[#F4C430] hover:underline ml-1">
                      Upgrade for unlimited
                    </button>
                  </p>
                </div>
              )}
              
              {/* Premium Note */}
              {isPremium && (
                <p className="text-[#6B7280] text-xs sm:text-sm text-center">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Premium active - unlimited generations and advanced features.
                </p>
              )}
              
              {/* Generated Parlay Results */}
              {generatedParlay && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-6 bg-[#0B1220] rounded-lg border border-[#1F2937]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#E5E7EB] font-semibold">AI Generated Parlay</h3>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#F4C430]" />
                      <span className="text-[#F4C430] text-sm font-medium">
                        {generatedParlay.legs.length} Selections
                      </span>
                    </div>
                  </div>
                  
                  {/* Parlay Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 p-4 bg-[#0F172A] rounded-lg">
                    <div className="text-center">
                      <div className="text-[#6B7280] text-xs sm:text-sm">Total Odds</div>
                      <div className="text-[#F4C430] font-bold text-lg">{generatedParlay.totalOdds}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[#6B7280] text-xs sm:text-sm">Probability</div>
                      <div className="text-[#E5E7EB] font-medium">{generatedParlay.impliedProbability}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[#6B7280] text-xs sm:text-sm">Expected Value</div>
                      <div className="text-green-400 font-medium">{generatedParlay.expectedValue}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[#6B7280] text-xs sm:text-sm">$10 Bet Pays</div>
                      <div className="text-green-400 font-medium">{generatedParlay.potentialPayout}</div>
                    </div>
                  </div>
                  
                  {/* Parlay Legs */}
                  <div className="space-y-4 sm:space-y-6 mb-6">
                    {generatedParlay.legs.map((leg, index) => {
                      // Format the game date and time
                      const formatGameTime = (commenceTime) => {
                        if (!commenceTime) return 'TBD';
                        const date = new Date(commenceTime);
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        
                        let dateStr;
                        if (date.toDateString() === today.toDateString()) {
                          dateStr = 'Today';
                        } else if (date.toDateString() === tomorrow.toDateString()) {
                          dateStr = 'Tomorrow';
                        } else {
                          dateStr = date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            weekday: 'short'
                          });
                        }
                        
                        const timeStr = date.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        });
                        
                        return `${dateStr} ${timeStr}`;
                      };
                      
                      const getBetTypeDisplay = (betType, point) => {
                        switch(betType) {
                          case 'h2h': return 'Moneyline';
                          case 'spreads': return point ? `Spread (${point > 0 ? '+' : ''}${point})` : 'Spread';
                          case 'totals': return point ? `Total ${point > 0 ? 'Over' : 'Under'} ${Math.abs(point)}` : 'Total';
                          default: return betType || 'Standard';
                        }
                      };
                      
                      return (
                        <div key={index} className="p-4 bg-[#0F172A] rounded-lg border border-[#1F2937] hover:border-[#253044] transition-colors">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                            <div className="flex-1">
                              {/* Game Info */}
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-[#E5E7EB] font-medium text-sm sm:text-base break-words mb-1">
                                    {leg.game || `${leg.selection} Match`}
                                  </h4>
                                  {leg.commence_time && formatGameTime(leg.commence_time) !== 'TBD' && (
                                    <div className="text-xs text-[#6B7280] mb-2">
                                      {formatGameTime(leg.commence_time)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Bet Selection */}
                              <div className="bg-[#1F2937] rounded-lg p-3 mb-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-green-400 font-medium text-sm sm:text-base">{leg.selection}</span>
                                  <span className="text-[#F4C430] font-bold text-lg">{leg.odds}</span>
                                </div>
                                <div className="text-xs text-[#6B7280]">
                                  {getBetTypeDisplay(leg.bet_type, leg.point)}
                                </div>
                              </div>
                              
                              {/* Details */}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7280]">
                                <div className="flex items-center gap-1">
                                  <span>{leg.sportsbook || leg.book}</span>
                                </div>
                                {leg.expected_probability && (
                                  <div className="flex items-center gap-1">
                                    <span>{leg.expected_probability}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* AI Reasoning */}
                  <div className="p-4 bg-[#0F172A] rounded-lg mb-6">
                    <h4 className="text-[#E5E7EB] font-medium mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-[#F4C430]" />
                      AI Analysis & Reasoning
                    </h4>
                    <p className="text-[#9CA3AF] text-sm leading-relaxed">
                      {generatedParlay.reasoning}
                    </p>
                  </div>
                  
                  {/* Potential Payout */}
                  <div className="text-center p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg mb-4">
                    <div className="text-[#6B7280] text-sm">Total Payout</div>
                    <div className="text-green-400 font-bold text-2xl">{generatedParlay.potentialPayout}</div>
                    <div className="text-[#9CA3AF] text-sm">on $10 bet (${generatedParlay.profit} profit)</div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                    <button 
                      onClick={handleDownloadSlip}
                      className="btn btn-outline text-sm flex-1 min-h-[44px] py-3 px-4"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Download BetChekr Slip</span>
                      <span className="sm:hidden">Download</span>
                    </button>
                    <button 
                      onClick={handleCopySlip}
                      className="btn btn-outline text-sm flex-1 min-h-[44px] py-3 px-4"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Share BetChekr Slip</span>
                          <span className="sm:hidden">Share</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => handleFindBetterOdds(generatedParlay)}
                      className="btn btn-primary text-sm flex-1 min-h-[44px] py-3 px-4"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Find Better Odds</span>
                      <span className="sm:hidden">Better Odds</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>
        </>
      )}
      
        <Footer />
      </GradientBG>
    </div>
  );
}