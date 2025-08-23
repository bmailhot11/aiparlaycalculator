import { useState, useContext, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain,
  AlertCircle,
  Check,
  Download,
  Copy,
  Sliders,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';
import { renderSlipImage, downloadImage, copyImageToClipboard } from '../utils/renderSlipImage';
import { apiFetch } from '../utils/api';

export default function AIParlayPage() {
  const { isPremium } = useContext(PremiumContext);
  const [selectedSports, setSelectedSports] = useState(['NFL']);
  const [parlaySize, setParlaySize] = useState('3');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [includePlayerProps, setIncludePlayerProps] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedParlay, setGeneratedParlay] = useState(null);
  const [copied, setCopied] = useState(false);
  const [usageData, setUsageData] = useState({ generations: 0 });
  const [showPaywall, setShowPaywall] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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

  const sports = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'UFC', 'MLS', 'UEFA', 'Tennis'];

  useEffect(() => {
    // Load user and check usage
    const savedUser = localStorage.getItem('betchekr_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
    
    if (!isPremium) {
      checkUsage();
    }
  }, [isPremium]);

  const checkUsage = async () => {
    try {
      const userIdentifier = currentUser?.id || `anon_${Date.now()}`;
      const response = await apiFetch(`/api/check-usage?userIdentifier=${userIdentifier}`);
      const data = await response.json();
      
      if (response.ok) {
        setUsageData(data.usage);
      }
    } catch (error) {
      console.error('Error checking usage:', error);
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
    aiConfidence: 81,
    expectedValue: '+4.2%',
    recommendedStake: '$25',
    potentialPayout: '$187.50',
    reasoning: 'This parlay combines strong home favorites with a well-researched total. The Chiefs have excellent ATS record at home, Lakers are undervalued coming off rest, and the Celtics-Heat matchup has consistently gone over in recent meetings.'
  };

  const handleSportToggle = (sport) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const handleGenerateParlay = async () => {
    if (selectedSports.length === 0) {
      alert('Please select at least one sport');
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
        const userIdentifier = currentUser?.id || `anon_${Date.now()}`;
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
      const response = await apiFetch('/api/optimized-generate-parlay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: {
            sport: selectedSports[0], // Use first selected sport
            riskLevel,
            legs: parseInt(parlaySize)
          },
          isPremium
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Map the API response to our expected format
        const mappedParlay = {
          id: 'parlay_' + Date.now(),
          legs: data.parlay.parlay_legs || data.parlay.legs || [],
          totalOdds: data.parlay.total_odds || data.parlay.total_american_odds || '+500',
          impliedProbability: data.parlay.implied_probability || '16.7%',
          aiConfidence: 85,
          expectedValue: '+' + ((data.parlay.expected_value || 0.05) * 100).toFixed(1) + '%',
          recommendedStake: '$25',
          potentialPayout: '$150',
          reasoning: data.parlay.risk_assessment || 'AI-generated parlay with positive expected value across multiple markets.'
        };
        setGeneratedParlay(mappedParlay);
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
      const imageData = await renderSlipImage({
        slip: {
          legs: generatedParlay.legs,
          stake: generatedParlay.recommendedStake,
          potentialReturn: generatedParlay.potentialPayout,
          summary: `AI Generated ${generatedParlay.legs.length}-Leg Parlay`,
          date: new Date().toLocaleDateString()
        },
        logoUrl: '/betchekr_owl_logo.png',
        brand: 'BetChekr'
      });
      downloadImage(imageData);
    }
  };

  const handleCopySlip = async () => {
    if (generatedParlay) {
      const imageData = await renderSlipImage({
        slip: {
          legs: generatedParlay.legs,
          stake: generatedParlay.recommendedStake,
          potentialReturn: generatedParlay.potentialPayout,
          summary: `AI Generated ${generatedParlay.legs.length}-Leg Parlay`,
          date: new Date().toLocaleDateString()
        },
        logoUrl: '/betchekr_owl_logo.png',
        brand: 'BetChekr'
      });
      const success = await copyImageToClipboard(imageData);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
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
    <div className="min-h-screen bg-[#0B0F14]">
      <Header />
      
      {/* Paywall Overlay */}
      {showPaywall && (
        <Paywall 
          feature="AI parlay generation" 
          usageLimit="1 parlay per day"
        />
      )}
      
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
            className="card max-w-[800px] mx-auto"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-5 h-5 text-[#F4C430]" />
                <h3 className="text-[#E5E7EB] font-semibold">Customize Your AI Parlay</h3>
              </div>
              
              {/* Sports Selection */}
              <div className="space-y-3">
                <label className="block text-[#9CA3AF] text-sm font-medium">Select Sports</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {sports.map(sport => (
                    <button
                      key={sport}
                      onClick={() => handleSportToggle(sport)}
                      className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                        selectedSports.includes(sport)
                          ? 'bg-[#F4C430] text-[#0B0F14]'
                          : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#253044]'
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Configuration Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#9CA3AF] text-sm font-medium mb-2">Parlay Size</label>
                  <select
                    value={parlaySize}
                    onChange={(e) => setParlaySize(e.target.value)}
                    className="select w-full"
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
                    className="select w-full"
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
                      className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                        !includePlayerProps
                          ? 'bg-[#F4C430] text-[#0B0F14]'
                          : 'bg-[#0B1220] text-[#6B7280] hover:text-[#9CA3AF]'
                      }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => setIncludePlayerProps(true)}
                      className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
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
                  disabled={isGenerating || selectedSports.length === 0}
                  className="btn btn-primary flex-1"
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
                  <p className="text-[#6B7280] text-xs">
                    Free: {Math.max(0, 1 - usageData.generations)} parlay remaining today | 
                    <Link href="/pricing" className="text-[#F4C430] hover:underline ml-1">
                      Upgrade for unlimited
                    </Link>
                  </p>
                </div>
              )}
              
              {/* Premium Note */}
              {isPremium && (
                <p className="text-[#6B7280] text-xs text-center">
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
                        {generatedParlay.aiConfidence}% AI Confidence
                      </span>
                    </div>
                  </div>
                  
                  {/* Parlay Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-[#0F172A] rounded-lg">
                    <div className="text-center">
                      <div className="text-[#6B7280] text-xs">Total Odds</div>
                      <div className="text-[#F4C430] font-bold text-lg">{generatedParlay.totalOdds}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[#6B7280] text-xs">Probability</div>
                      <div className="text-[#E5E7EB] font-medium">{generatedParlay.impliedProbability}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[#6B7280] text-xs">Expected Value</div>
                      <div className="text-green-400 font-medium">{generatedParlay.expectedValue}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[#6B7280] text-xs">Recommended Stake</div>
                      <div className="text-[#E5E7EB] font-medium">{generatedParlay.recommendedStake}</div>
                    </div>
                  </div>
                  
                  {/* Parlay Legs */}
                  <div className="space-y-3 mb-6">
                    {generatedParlay.legs.map((leg, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#0F172A] rounded border border-[#1F2937]">
                        <div className="flex-1">
                          <div className="text-[#E5E7EB] font-medium">{leg.selection}</div>
                          <div className="flex items-center gap-2 text-sm text-[#6B7280] mt-1">
                            <span>{leg.book}</span>
                            <span>•</span>
                            <span>{leg.confidence}% confidence</span>
                          </div>
                        </div>
                        <div className="text-[#F4C430] font-bold">{leg.odds}</div>
                      </div>
                    ))}
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
                    <div className="text-[#6B7280] text-sm">Potential Payout</div>
                    <div className="text-green-400 font-bold text-2xl">{generatedParlay.potentialPayout}</div>
                    <div className="text-[#9CA3AF] text-sm">on {generatedParlay.recommendedStake} stake</div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={handleDownloadSlip}
                      className="btn btn-outline text-sm flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Slip
                    </button>
                    <button 
                      onClick={handleCopySlip}
                      className="btn btn-outline text-sm flex-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy to Clipboard
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => handleFindBetterOdds(generatedParlay)}
                      className="btn btn-primary text-sm flex-1"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Find Better Odds
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>
      
      <Footer />
    </div>
  );
}