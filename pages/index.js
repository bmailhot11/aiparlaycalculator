import { useState, useContext, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  TrendingUp, 
  Target, 
  Brain, 
  Download, 
  Copy,
  Check,
  Crown,
  ChevronRight,
  AlertCircle,
  User,
  Trophy,
  ThumbsUp,
  ThumbsDown,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';
import { renderSlipImage, downloadImage, copyImageToClipboard } from '../utils/renderSlipImage';
import { apiFetch } from '../utils/api';
import AIPerformanceDashboard from '../components/AIPerformanceDashboard';

export default function Home() {
  const { isPremium } = useContext(PremiumContext);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usageData, setUsageData] = useState({ uploads: 0, generations: 0 });
  const [showPaywall, setShowPaywall] = useState(false);
  const fileInputRef = useRef(null);

  // Load user from localStorage and check usage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('betchekr_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('betchekr_user');
      }
    }
    
    // Check current usage if not premium
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


  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      setUploadedFile(file);
    }
  };

  const handleCheckBet = async () => {
    if (!uploadedFile) {
      alert('Please upload a bet slip image first');
      return;
    }

    // Check usage limits for free users
    if (!isPremium) {
      if (usageData.uploads >= 1) {
        setShowPaywall(true);
        return;
      }
      
      // Track usage before processing
      try {
        const userIdentifier = currentUser?.id || `anon_${Date.now()}`;
        const trackResponse = await apiFetch('/api/track-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload',
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

    setIsAnalyzing(true);
    
    try {
      // Convert image file to base64
      const reader = new FileReader();
      
      const processImage = () => new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });
      
      const base64Result = await processImage();
      // Extract base64 data (remove the data:image/...;base64, prefix)
      const base64String = base64Result.split(',')[1];
      
      // Call the analyze-slip API with base64 image
      const response = await apiFetch('/api/analyze-slip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64String,
          userId: currentUser?.id || '',
          username: currentUser?.username || ''
        }),
      });

      const result = await response.json();
      
      if (result.success && result.analysis) {
        // Use improved analysis data
        const hasImprovements = result.analysis.improved_bets?.some(bet => bet.improved) || false;
        const avgImprovement = result.analysis.improved_bets?.length > 0 
          ? result.analysis.improved_bets.reduce((sum, bet) => sum + (bet.improvement_percentage || 0), 0) / result.analysis.improved_bets.length 
          : 0;
        
        setAnalysisResult({
          trashCash: hasImprovements ? 'CASH' : (avgImprovement > 10 ? 'CASH' : 'TRASH'),
          score: hasImprovements ? Math.min(95, 60 + avgImprovement) : Math.max(30, 60 - Math.random() * 20),
          confidence: 85,
          recommendation: hasImprovements 
            ? `We found better odds that could increase your potential payout by ${avgImprovement.toFixed(1)}%` 
            : 'Your odds are competitive across major sportsbooks',
          reasoning: result.analysis.optimization_tips?.slice(0, 3) || ['Analysis complete'],
          legs: result.analysis.bet_slip_details?.extracted_bets || [],
          stake: result.analysis.bet_slip_details?.total_stake || 'N/A',
          potentialReturn: result.analysis.bet_slip_details?.potential_payout || 'N/A',
          date: new Date().toLocaleDateString(),
          communityStats: { message: `Analysis compared ${result.analysis.sportsbooks_analyzed} for optimal value` },
          improvedSlipImage: result.analysis.improved_slip_image,
          improvedBets: result.analysis.improved_bets
        });

        // Track the slip analysis if improvements were made
        if (hasImprovements && result.analysis.improved_bets) {
          await trackAIBet({
            user_id: currentUser?.id,
            bet_type: 'improved_slip',
            source_type: 'analyzed',
            original_data: result.analysis.bet_slip_details,
            recommended_legs: result.analysis.improved_bets,
            ai_reasoning: result.analysis.optimization_tips?.join(' ') || 'Slip analysis found better odds',
            improvement_percentage: avgImprovement,
            user_action: 'generated'
          });
        }
      } else {
        throw new Error(result.message || 'Failed to analyze bet slip');
      }
    } catch (error) {
      console.error('Error analyzing bet slip:', error);
      alert(error.message || 'Failed to analyze bet slip. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // User authentication functions
  const handleCreateUser = async () => {
    if (!usernameInput || usernameInput.length < 3) {
      alert('Username must be at least 3 characters long');
      return;
    }

    try {
      const response = await apiFetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: usernameInput.toLowerCase().trim()
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setCurrentUser(result.user);
        localStorage.setItem('betchekr_user', JSON.stringify(result.user));
        setShowUserModal(false);
        setUsernameInput('');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create account. Please try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('betchekr_user');
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

  const handleDownloadSlip = async () => {
    if (analysisResult) {
      // Use improved slip image if available, otherwise fall back to regular slip image
      if (analysisResult.improvedSlipImage) {
        // Create download link for the improved slip image
        const link = document.createElement('a');
        link.href = analysisResult.improvedSlipImage;
        link.download = 'betchekr-improved-slip.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Track download action
        if (analysisResult.improvedBets?.some(bet => bet.improved)) {
          await trackAIBet({
            user_id: currentUser?.id,
            bet_type: 'improved_slip',
            source_type: 'analyzed',
            recommended_legs: analysisResult.improvedBets,
            ai_reasoning: 'User downloaded improved slip',
            user_action: 'downloaded'
          });
        }
      } else {
        // Fall back to original slip image generation
        const imageData = await renderSlipImage({
          slip: analysisResult,
          logoUrl: '/betchekr_owl_logo.png',
          brand: 'betchekr'
        });
        downloadImage(imageData);
      }
    }
  };

  const handleCopySlip = async () => {
    if (analysisResult) {
      // Use improved slip image if available
      if (analysisResult.improvedSlipImage) {
        try {
          const blob = await fetch(analysisResult.improvedSlipImage).then(r => r.blob());
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          console.error('Failed to copy improved slip to clipboard:', error);
        }
      } else {
        // Fall back to original slip image generation
        const imageData = await renderSlipImage({
          slip: analysisResult,
          logoUrl: '/betchekr_owl_logo.png',
          brand: 'betchekr'
        });
        const success = await copyImageToClipboard(imageData);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <Header />
      
      {/* Paywall Overlay */}
      {showPaywall && (
        <Paywall 
          feature="bet slip analysis" 
          usageLimit="1 bet slip per day"
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
          <div className="flex items-center justify-between w-full max-w-[720px] mx-auto mb-6">
            <h1 className="text-left flex-1">
              Smart Betting, Simplified.
            </h1>
          </div>
          <p className="text-[#9CA3AF] text-lg max-w-[720px] mx-auto mb-10">
            Find positive EV bets, build optimized parlays, and catch arbitrage opportunities in real time, all powered by AI
          </p>
          
          {/* Bet Checker Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="card max-w-[800px] mx-auto"
          >
            {/* Upload Section */}
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-[#F4C430] bg-[#F4C430]/5' 
                    : 'border-[#1F2937] hover:border-[#253044] hover:bg-[#141C28]/50'
                }`}
                aria-label="Upload bet screenshot"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-[#6B7280]" />
                <p className="text-[#9CA3AF] mb-2">
                  {uploadedFile ? uploadedFile.name : 'Drop your bet slip here or click to browse'}
                </p>
                <p className="text-[#6B7280] text-sm">
                  Accepts JPG, PNG, WebP
                </p>
              </div>
              
              {/* CTA */}
              <button 
                onClick={handleCheckBet}
                disabled={isAnalyzing}
                className="btn btn-primary w-full"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {isPremium ? 'Analyze Bet Slip' : `Analyze (${Math.max(0, 1 - usageData.uploads)} remaining today)`}
                  </>
                )}
              </button>
              
              {/* Usage indicator for free users */}
              {!isPremium && (
                <div className="text-center mt-2">
                  <p className="text-[#6B7280] text-xs">
                    Free: {Math.max(0, 1 - usageData.uploads)} analysis remaining today | 
                    <Link href="/pricing" className="text-[#F4C430] hover:underline ml-1">
                      Upgrade for unlimited
                    </Link>
                  </p>
                </div>
              )}
              
              
              {/* Trash/Cash Analysis Result */}
              {analysisResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-6 bg-[#0B1220] rounded-lg border border-[#1F2937]"
                >
                  {/* Trash/Cash Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {analysisResult.trashCash === 'CASH' ? (
                        <>
                          <ThumbsUp className="w-8 h-8 text-green-400" />
                          <div>
                            <h3 className="text-green-400 font-bold text-xl">CASH 💰</h3>
                            <p className="text-green-300 text-sm">Good bet!</p>
                          </div>
                        </>
                      ) : analysisResult.trashCash === 'TRASH' ? (
                        <>
                          <ThumbsDown className="w-8 h-8 text-red-400" />
                          <div>
                            <h3 className="text-red-400 font-bold text-xl">TRASH 🗑️</h3>
                            <p className="text-red-300 text-sm">Avoid this bet</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Zap className="w-8 h-8 text-yellow-400" />
                          <div>
                            <h3 className="text-yellow-400 font-bold text-xl">{analysisResult.trashCash}</h3>
                            <p className="text-yellow-300 text-sm">Proceed with caution</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-[#F4C430] font-bold text-2xl">{analysisResult.score}/100</div>
                      <div className="text-[#6B7280] text-xs">{analysisResult.confidence}% confidence</div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="bg-[#0F172A] rounded-lg p-4 mb-4">
                    <p className="text-[#9CA3AF] text-sm">{analysisResult.recommendation}</p>
                  </div>

                  {/* Reasoning */}
                  {analysisResult.reasoning && analysisResult.reasoning.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[#E5E7EB] font-medium mb-2">Why this rating:</h4>
                      <ul className="space-y-1">
                        {analysisResult.reasoning.map((reason, index) => (
                          <li key={index} className="text-[#9CA3AF] text-sm flex items-start gap-2">
                            <span className="text-[#F4C430] mt-1">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Bet Details */}
                  <div className="space-y-2 mb-4">
                    {analysisResult.legs.map((leg, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#0F172A] rounded">
                        <div className="flex-1">
                          <span className="text-[#D1D5DB] text-sm font-medium">
                            {leg.home_team || leg.away_team ? `${leg.away_team} @ ${leg.home_team}` : 'Game'} - {leg.bet_type || leg.market}
                          </span>
                          <span className="text-[#6B7280] text-xs ml-2">
                            {leg.sportsbook || leg.book} • {leg.odds}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show improved bets if available */}
                    {analysisResult.improvedBets && analysisResult.improvedBets.some(bet => bet.improved) && (
                      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center mb-2">
                          <ThumbsUp className="w-4 h-4 text-green-400 mr-2" />
                          <span className="text-green-400 font-medium text-sm">Better Odds Found!</span>
                        </div>
                        {analysisResult.improvedBets.filter(bet => bet.improved).map((bet, index) => (
                          <div key={index} className="text-xs text-green-300 mb-1">
                            • {bet.selection}: {bet.original_odds} → {bet.odds} at {bet.sportsbook} 
                            (+{bet.improvement_percentage.toFixed(1)}% better)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Community Stats */}
                  {analysisResult.communityStats && (
                    <div className="bg-[#0F172A] rounded-lg p-3 mb-4">
                      <p className="text-[#6B7280] text-xs mb-1">Community Insight</p>
                      <p className="text-[#9CA3AF] text-sm">{analysisResult.communityStats.message}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={handleDownloadSlip}
                      className="btn btn-outline text-sm flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {analysisResult.improvedSlipImage ? 'Download Improved Slip' : 'Download Analysis'}
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
                          {analysisResult.improvedSlipImage ? 'Share Improved Slip' : 'Share Results'}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
          
        </motion.div>
      </section>

      {/* User Registration Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-[#0B0F14]/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1F2937] rounded-2xl p-6 max-w-md w-full border border-[#374151]"
          >
            <h2 className="text-[#E5E7EB] text-xl font-bold mb-4">Join the Community</h2>
            <p className="text-[#9CA3AF] text-sm mb-4">
              Create a username to track your bets, compete on leaderboards, and share your picks with the community.
            </p>
            
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              placeholder="Choose a username"
              className="input w-full mb-4"
              maxLength={20}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateUser()}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="btn btn-primary flex-1"
                disabled={!usernameInput || usernameInput.length < 3}
              >
                Create Account
              </button>
            </div>
            
            <p className="text-[#6B7280] text-xs mt-3 text-center">
              Usernames are 3-20 characters, letters/numbers only
            </p>
          </motion.div>
        </div>
      )}
      
      {/* Quick Access Tiles */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Positive EV Lines Tile */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="group relative overflow-hidden rounded-2xl border border-[#1F2937] bg-gradient-to-b from-transparent to-[#0C1222]/50"
            >
              <div className="absolute inset-0 bg-[#1F2937]/20 group-hover:bg-[#1F2937]/30 transition-colors" />
              <div className="relative p-8">
                <TrendingUp className="w-12 h-12 text-[#F4C430] mb-4" />
                <h3 className="text-[#E5E7EB] text-xl font-semibold mb-2">
                  Positive EV Finder
                </h3>
                <p className="text-[#9CA3AF] text-sm mb-4">
                  Instantly spot bets where the numbers work in your favor. Updated every minute across major sportsbooks.
                </p>
                <Link href="/positive-ev" className="inline-flex items-center text-[#F4C430] text-sm font-medium hover:gap-2 transition-all">
                  Explore now
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </motion.div>
            
            {/* AI-Generated Parlay Tile */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="group relative overflow-hidden rounded-2xl border border-[#1F2937] bg-gradient-to-b from-transparent to-[#0C1222]/50"
            >
              <div className="absolute inset-0 bg-[#1F2937]/20 group-hover:bg-[#1F2937]/30 transition-colors" />
              <div className="relative p-8">
                <Brain className="w-12 h-12 text-[#F4C430] mb-4" />
                <h3 className="text-[#E5E7EB] text-xl font-semibold mb-2">
                  AI Parlay Builder
                </h3>
                <p className="text-[#9CA3AF] text-sm mb-4">
                  Generate optimized parlays in one click. Smarter slips, less guesswork.
                </p>
                <Link href="/ai-parlay" className="inline-flex items-center text-[#F4C430] text-sm font-medium hover:gap-2 transition-all">
                  Build parlay
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </motion.div>
            
            {/* Arbitrage Opportunities Tile */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="group relative overflow-hidden rounded-2xl border border-[#1F2937] bg-gradient-to-b from-transparent to-[#0C1222]/50"
            >
              <div className="absolute inset-0 bg-[#1F2937]/20 group-hover:bg-[#1F2937]/30 transition-colors" />
              <div className="relative p-8">
                <Target className="w-12 h-12 text-[#F4C430] mb-4" />
                <h3 className="text-[#E5E7EB] text-xl font-semibold mb-2">
                  Arbitrage Alerts
                </h3>
                <p className="text-[#9CA3AF] text-sm mb-4">
                  See cross-book mismatches as they happen. Lock in guaranteed profits, no matter the outcome.
                </p>
                <Link href="/arbitrage" className="inline-flex items-center text-[#F4C430] text-sm font-medium hover:gap-2 transition-all">
                  Find arbs
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Performance Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-[#E5E7EB] text-3xl md:text-4xl font-bold mb-6">
              AI Performance Track Record
            </h2>
            <p className="text-[#9CA3AF] text-xl max-w-2xl mx-auto mb-4">
              See how our AI recommendations perform. Transparent results build confidence in our tools.
            </p>
            <p className="text-[#6B7280] text-sm">
              AI bet tracking began August 23, 2025
            </p>
          </motion.div>

          <AIPerformanceDashboard 
            period={30}
            user_id={currentUser?.id}
            showUserStats={false}
            compact={false}
          />
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[#E5E7EB] text-3xl md:text-4xl font-bold mb-6">
              Tools for bettors, not bookies.
            </h2>
            <p className="text-[#9CA3AF] text-xl max-w-2xl mx-auto">
              We don't sell picks or affiliate hype. Just clean, transparent analysis so you can make sharper decisions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Closing Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-[#1F2937]/50 to-[#374151]/30 rounded-3xl p-12 border border-[#374151]"
          >
            <h2 className="text-[#E5E7EB] text-3xl md:text-4xl font-bold mb-6">
              Bet with an edge.
            </h2>
            <Link 
              href="/positive-ev"
              className="inline-flex items-center bg-[#F4C430] text-[#0B0F14] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#F4C430]/90 transition-colors"
            >
              Start Winning Today
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}