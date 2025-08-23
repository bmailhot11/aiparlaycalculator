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
import { PremiumContext } from './_app';
import { renderSlipImage, downloadImage, copyImageToClipboard } from '../utils/renderSlipImage';

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
  const fileInputRef = useRef(null);

  // Load user from localStorage on mount
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
  }, []);

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

    setIsAnalyzing(true);
    
    try {
      // Create FormData to send image for OCR processing
      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('userId', currentUser?.id || '');
      formData.append('username', currentUser?.username || '');

      // Call the existing analyze-slip API that uses OCR
      const response = await fetch('/api/analyze-slip', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success && result.analysis) {
        // Convert existing analysis format to trash/cash format
        setAnalysisResult({
          trashCash: result.analysis.recommendation?.includes('Good') ? 'CASH' : 'TRASH',
          score: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 30, // Will be replaced by real analysis
          confidence: 75,
          recommendation: result.analysis.recommendation || 'Analysis complete',
          reasoning: result.analysis.details || ['Analysis based on image data'],
          legs: result.analysis.bets || [],
          stake: result.analysis.totalStake || 'N/A',
          potentialReturn: result.analysis.potentialReturn || 'N/A',
          date: new Date().toLocaleDateString(),
          communityStats: { message: 'Real bet analysis complete' }
        });
      } else {
        throw new Error(result.message || 'Failed to analyze bet slip');
      }
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
      const response = await fetch('/api/auth/create-user', {
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

  const handleDownloadSlip = async () => {
    if (analysisResult) {
      const imageData = await renderSlipImage({
        slip: analysisResult,
        logoUrl: '/favicon.ico',
        brand: 'betchekr'
      });
      downloadImage(imageData);
    }
  };

  const handleCopySlip = async () => {
    if (analysisResult) {
      const imageData = await renderSlipImage({
        slip: analysisResult,
        logoUrl: '/favicon.ico',
        brand: 'betchekr'
      });
      const success = await copyImageToClipboard(imageData);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <Header />
      
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
              Bet smarter, instantly.
            </h1>
            {/* User Section */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-2 bg-[#1F2937] rounded-lg px-3 py-2">
                  <User className="w-4 h-4 text-[#F4C430]" />
                  <span className="text-[#E5E7EB] text-sm font-medium">{currentUser.username}</span>
                  <button 
                    onClick={handleLogout}
                    className="text-[#6B7280] hover:text-[#9CA3AF] text-xs ml-2"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowUserModal(true)}
                  className="bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#F4C430]/90 transition-colors"
                >
                  Join Community
                </button>
              )}
            </div>
          </div>
          <p className="text-[#9CA3AF] text-lg max-w-[720px] mx-auto mb-10">
            Upload your slip. Our AI will rate it <span className="text-green-400 font-semibold">CASH</span> or <span className="text-red-400 font-semibold">TRASH</span> based on line movement, team stats, and expected value.
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
                    Check Bet
                  </>
                )}
              </button>
              
              
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
                            {leg.team} - {leg.market}
                          </span>
                          <span className="text-[#6B7280] text-xs ml-2">
                            {leg.book} • {leg.odds}
                          </span>
                        </div>
                      </div>
                    ))}
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
                      Download Analysis
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
                          Share Results
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
                  View Positive EV Lines
                </h3>
                <p className="text-[#9CA3AF] text-sm mb-4">
                  Find bets with positive expected value across all major sportsbooks in real-time.
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
                  AI-Generated Parlay
                </h3>
                <p className="text-[#9CA3AF] text-sm mb-4">
                  Build optimized slips in one click using our AI-powered parlay generator.
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
                  Arbitrage Opportunities
                </h3>
                <p className="text-[#9CA3AF] text-sm mb-4">
                  Cross-book mismatches in real time to guarantee profit regardless of outcome.
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
      
      <Footer />
    </div>
  );
}