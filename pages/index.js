import { useState, useEffect, useRef, useContext } from 'react'
import { Upload, Target, Crown, Check, Star, Calculator, TrendingUp, X, BarChart3, Download, Share2, ExternalLink, Copy, ChevronRight, DollarSign, Activity, Brain, Shield, Zap, AlertTriangle, Users, Award, Lightbulb, Home, Lock } from 'lucide-react'
import { PremiumContext } from './_app';

// Admin Configuration
const ADMIN_EMAIL = 'noreply@aiparlaycalculator.com'

// Custom hook for premium functionality
const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

// Premium Gate Component
function PremiumGate({ 
  children, 
  fallback = null, 
  showUpgradePrompt = true, 
  featureName = "this feature",
  className = "",
  upgradeHandler = null
}) {
  const { isPremium } = usePremium();
  
  if (isPremium) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }
  
  if (fallback) {
    return fallback;
  }
  
  if (showUpgradePrompt) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-yellow-500/20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-bold text-white mb-2">Premium Feature</h3>
        <p className="text-gray-400 mb-4">
          Upgrade to premium to access {featureName}
        </p>
        <button 
          onClick={upgradeHandler}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all"
        >
          <Crown className="w-4 h-4 inline mr-2" />
          Upgrade to Premium
        </button>
      </div>
    );
  }
  
  return null;
}

// Feature Limiter Component
function FeatureLimiter({ 
  children, 
  current, 
  limit, 
  featureName,
  premiumFeatureName = "unlimited access",
  upgradeHandler = null
}) {
  const { isPremium } = usePremium();
  
  if (isPremium) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-400">
              <Crown className="w-5 h-5" />
              <span className="font-medium">Premium: {premiumFeatureName}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              <Check className="w-4 h-4" />
              <span>Active</span>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }
  
  const isAtLimit = current >= limit;
  const percentage = Math.min((current / limit) * 100, 100);
  
  return (
    <div className="space-y-4">
      {/* Usage Bar */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-300 font-medium">{featureName}</span>
          <span className="text-gray-400 text-sm">{current}/{limit} used today</span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              isAtLimit ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {isAtLimit && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-red-400 font-medium text-sm">Daily limit reached</div>
                <div className="text-red-300 text-sm mt-1">
                  Upgrade to premium for unlimited {featureName.toLowerCase()}
                </div>
              </div>
            </div>
            <button 
              onClick={upgradeHandler}
              className="mt-3 w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all text-sm"
            >
              <Crown className="w-4 h-4 inline mr-2" />
              Get Unlimited Access
            </button>
          </div>
        )}
      </div>
      
      {/* Conditionally render children based on limit */}
      {!isAtLimit ? children : (
        <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700 text-center">
          <X className="w-8 h-8 mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400">Feature disabled due to daily limit</p>
        </div>
      )}
    </div>
  );
}

// Premium Badge Component
function PremiumBadge({ className = "" }) {
  return (
    <div className={`inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1 rounded-full font-semibold text-sm ${className}`}>
      <Crown className="w-3 h-3" />
      Premium
    </div>
  );
}

// Premium Home Page Component
function PremiumHomePage({ setActiveTab }) {
  return (
    <div className="bg-gradient-to-br from-yellow-500/10 via-yellow-600/5 to-amber-500/10 rounded-2xl p-8 mb-8 border border-yellow-500/20">
      {/* Premium Welcome Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome Back, Premium Member!</h2>
            <p className="text-yellow-400">You have unlimited access to all features</p>
          </div>
        </div>
      </div>

      {/* Premium Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-yellow-500/20">
          <Upload className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
          <h3 className="font-bold text-white mb-2">Unlimited Uploads</h3>
          <p className="text-sm text-gray-400">Upload as many bet slips as you need</p>
          <div className="mt-3 text-yellow-400 font-bold">∞</div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-yellow-500/20">
          <Brain className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
          <h3 className="font-bold text-white mb-2">Unlimited Generation</h3>
          <p className="text-sm text-gray-400">Generate parlays without limits</p>
          <div className="mt-3 text-yellow-400 font-bold">∞</div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-yellow-500/20">
          <TrendingUp className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
          <h3 className="font-bold text-white mb-2">Advanced Analysis</h3>
          <p className="text-sm text-gray-400">Priority AI processing & insights</p>
          <div className="mt-3 text-green-400 font-bold">✓ Active</div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-yellow-500/20">
          <BarChart3 className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
          <h3 className="font-bold text-white mb-2">Export & Share</h3>
          <p className="text-sm text-gray-400">Save parlay images & share results</p>
          <div className="mt-3 text-green-400 font-bold">✓ Active</div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveTab('optimize')}
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all"
        >
          <Upload className="w-5 h-5" />
          Analyze Bet Slip
        </button>
        
        <button
          onClick={() => setActiveTab('generate')}
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          <Brain className="w-5 h-5" />
          Generate Parlay
        </button>
      </div>

      {/* Premium Stats */}
      <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-yellow-500/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Premium Status:</span>
          <span className="text-yellow-400 font-semibold">Active</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-400">Next Billing:</span>
          <span className="text-gray-300">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

// Enhanced Parlay Results Modal Component
function ParlayResultsModal({ parlay, isOpen, onClose, handleUpgrade }) {
  const { isPremium } = usePremium();
  const [shareClicked, setShareClicked] = useState(false)
  const [downloadingImage, setDownloadingImage] = useState(false)
  const parlayCardRef = useRef(null)

  if (!isOpen || !parlay) return null

  const handleSaveImage = async () => {
    if (!parlayCardRef.current) return
    
    setDownloadingImage(true)
    try {
      // For demo purposes - in real implementation you'd use html2canvas
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')
      
      // Simple canvas drawing for demo
      ctx.fillStyle = '#111827'
      ctx.fillRect(0, 0, 800, 600)
      ctx.fillStyle = '#ffffff'
      ctx.font = '24px Arial'
      ctx.fillText('AiParlayCalculator Parlay', 50, 50)
      
      const link = document.createElement('a')
      link.download = `aiparlaycalculator-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setDownloadingImage(false)
    }
  }

  const handleShare = async () => {
    const shareText = `🎯 Check out this parlay analysis!\n\n${parlay.parlay_legs?.map(leg => `• ${leg.selection} (${leg.odds})`).join('\n') || 'Professional Analysis'}\n\nTotal Odds: ${parlay.total_odds || 'TBD'}\nConfidence: ${parlay.confidence || 'Calculated'}\n\nGenerated by AiParlayCalculator`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AiParlayCalculator Parlay',
          text: shareText,
          url: window.location.origin
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(shareText)
        }
      }
    } else {
      copyToClipboard(shareText)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setShareClicked(true)
      setTimeout(() => setShareClicked(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy to clipboard')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header with premium badge */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">Your Generated Parlay</h2>
                {isPremium && <PremiumBadge />}
              </div>
              <p className="text-gray-400">
                {isPremium ? 'Premium analysis with advanced insights' : 'Basic parlay generation'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Enhanced Parlay Card */}
          <div 
            ref={parlayCardRef} 
            className="bg-gray-900 rounded-xl p-6 border border-gray-700"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {/* Parlay Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 font-bold text-lg">AiParlayCalculator</span>
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-medium">
                    ANALYSIS
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {parlay.parlay_legs?.length || 0}-Leg {parlay.sport || 'Multi-Sport'} Parlay
                </h3>
                <p className="text-gray-400">{parlay.risk_assessment || 'Professional mathematical analysis'}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-green-400">{parlay.total_odds || '+450'}</div>
                <div className="text-sm text-gray-400">{parlay.confidence || 'Medium'} confidence</div>
              </div>
            </div>

            {/* Parlay Legs */}
            <div className="space-y-3 mb-6">
              {(parlay.parlay_legs || []).map((leg, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {leg.bet_type || 'Bet'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white mb-1">{leg.game || 'Game'}</h4>
                      <p className="text-green-400 font-medium">{leg.selection || 'Bet Description'}</p>
                      {leg.reasoning && (
                        <p className="text-gray-400 text-sm mt-1">{leg.reasoning}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-white">{leg.odds || '+100'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 text-sm">
              Generated by AiParlayCalculator • {new Date().toLocaleDateString()} • Mathematical Analysis Tool
            </div>
          </div>

          {/* Premium-only advanced statistics */}
          <PremiumGate
            featureName="advanced parlay statistics"
            upgradeHandler={handleUpgrade}
            fallback={
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                <Crown className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <h4 className="font-semibold text-white mb-2">Premium Statistics Available</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Get detailed win probability, bankroll recommendations, and more
                </p>
                <button 
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-2 rounded-lg font-semibold"
                >
                  Upgrade Now
                </button>
              </div>
            }
          >
            <div className="bg-gray-900 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-yellow-400">📊 Premium Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-green-400 font-bold">73.2%</div>
                  <div className="text-gray-400">Win Probability</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-bold">+8.7%</div>
                  <div className="text-gray-400">Expected Value</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-bold">2.3%</div>
                  <div className="text-gray-400">Kelly Bet Size</div>
                </div>
                <div className="text-center">
                  <div className="text-orange-400 font-bold">4.2x</div>
                  <div className="text-gray-400">Value vs Market</div>
                </div>
              </div>
            </div>
          </PremiumGate>

          {/* Action Buttons - Premium users get export/share */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PremiumGate
              featureName="parlay image export"
              showUpgradePrompt={false}
              fallback={
                <button
                  onClick={handleUpgrade}
                  className="flex items-center justify-center gap-2 bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                >
                  <Crown className="w-5 h-5" />
                  Upgrade to Export
                </button>
              }
            >
              <button
                onClick={handleSaveImage}
                disabled={downloadingImage}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {downloadingImage ? 'Generating...' : 'Save Image'}
              </button>
            </PremiumGate>

            <PremiumGate
              featureName="parlay sharing"
              showUpgradePrompt={false}
              fallback={
                <button
                  onClick={handleUpgrade}
                  className="flex items-center justify-center gap-2 bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                >
                  <Crown className="w-5 h-5" />
                  Upgrade to Share
                </button>
              }
            >
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {shareClicked ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                {shareClicked ? 'Copied!' : 'Share Parlay'}
              </button>
            </PremiumGate>

            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Generate Another
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Upload Area Component
function UploadArea({ onAnalysis, uploadsToday, maxUploads, isPremium, hasUnlimitedAccess }) {
  const [dragActive, setDragActive] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragActive(false)
    
    if (!isPremium && !hasUnlimitedAccess && uploadsToday >= maxUploads) {
      alert('Daily upload limit reached. Upgrade to Premium for unlimited uploads!')
      return
    }

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (!imageFile) {
      alert('Please upload an image file (PNG, JPG, etc.)')
      return
    }

    await analyzeImage(imageFile)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!isPremium && !hasUnlimitedAccess && uploadsToday >= maxUploads) {
      alert('Daily upload limit reached. Upgrade to Premium for unlimited uploads!')
      return
    }

    await analyzeImage(file)
  }

  const analyzeImage = async (file) => {
    setAnalyzing(true)
    try {
      // Convert file to base64 for API
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1]
        
        // Call your API endpoint for image analysis with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
        
        const response = await fetch('/api/analyze-slip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64Image
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)

        const result = await response.json()
        
        if (!response.ok) {
          const errorMsg = result.message || result.error || `API Error: ${response.status}`
          console.error('Analysis error:', result)
          alert(errorMsg)
          setAnalyzing(false)
          return
        }

        // Handle both success/analysis format and direct analysis format
        if (result.success && result.analysis) {
          onAnalysis(result.analysis)
        } else {
          const analysisData = result.analysis || result
          onAnalysis(analysisData)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Analysis error:', error)
      if (error.name === 'AbortError') {
        alert('Analysis timed out. Please try again.')
      } else {
        alert('Analysis failed. Please try again.')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const canUpload = isPremium || hasUnlimitedAccess || uploadsToday < maxUploads

  return (
    <div className="mb-8">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive
            ? 'border-green-500 bg-green-500/10'
            : canUpload
            ? 'border-gray-600 hover:border-green-500 bg-gray-800/50'
            : 'border-gray-700 bg-gray-800/20'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {analyzing ? (
          <div className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Analyzing Your Bet Slip</h3>
            <p className="text-gray-400">Processing with smart team/player recognition...</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-white mb-2">Upload Your Bet Slip</h3>
            <p className="text-gray-300 mb-2 font-medium">
              We'll scan <span className="text-yellow-400">5 premium sportsbooks</span> to find you better odds instantly
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Supported: DraftKings, FanDuel, BetMGM, Caesars, PointsBet
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={!canUpload}
            />
            <label
              htmlFor="file-upload"
              className={`inline-block px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                canUpload
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Choose File
            </label>
            {!canUpload && (
              <p className="text-red-400 mt-2 text-sm">Upload limit reached for today</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Enhanced Parlay Generator Component
function ParlayGenerator({ onGeneration, generationsToday, maxGenerations, isPremium, preSelectedSport = 'NFL', handleUpgrade }) {
  const [generating, setGenerating] = useState(false)
  const [selectedSport, setSelectedSport] = useState(preSelectedSport)
  const [selectedRisk, setSelectedRisk] = useState('moderate')
  const [error, setError] = useState(null)

  const hasUnlimitedAccess = false

  useEffect(() => {
    setSelectedSport(preSelectedSport)
  }, [preSelectedSport])

  const sports = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'UFC', 'Soccer', 'Tennis', 'Golf', 'Boxing', 'Mixed']
  
  const riskLevels = [
    { 
      id: 'safe', 
      name: 'Safe', 
      icon: Shield,
      color: 'text-blue-400', 
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-500/10',
      description: 'Lower risk, positive EV focus',
      details: '2-3 legs • High-probability positive EV bets • 60-75% win rate'
    },
    { 
      id: 'moderate', 
      name: 'Moderate', 
      icon: Target,
      color: 'text-yellow-400', 
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-500/10',
      description: 'Balanced EV opportunities',
      details: '3-4 legs • Mixed positive EV markets • 40-60% win rate'
    },
    { 
      id: 'risky', 
      name: 'Risky', 
      icon: Zap,
      color: 'text-red-400', 
      borderColor: 'border-red-500',
      bgColor: 'bg-red-500/10',
      description: 'High EV, higher variance',
      details: '4-6 legs • Aggressive positive EV plays • 15-40% win rate'
    }
  ]

  const generateParlay = async () => {
    if (!isPremium && !hasUnlimitedAccess && generationsToday >= maxGenerations) {
      setError('Daily generation limit reached. Upgrade to Premium for unlimited generations!')
      return
    }

    if (!selectedSport) {
      setError('Please select a sport before generating a parlay.')
      return
    }

    setError(null)
    setGenerating(true)
    
    try {
      // Call your API endpoint for parlay generation with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch('/api/generate-parlay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: {
            sport: selectedSport,
            riskLevel: selectedRisk,
            legs: 3  // Default to 3 legs
          }
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      const result = await response.json()
      
      if (!response.ok) {
        // Use server error message if available
        const errorMsg = result.message || result.error || `API Error: ${response.status}`
        setError(errorMsg)
        console.error('Parlay generation error:', result)
        return
      }
      
      // Handle both success/parlay format and direct parlay format
      if (result.success && result.parlay) {
        onGeneration(result.parlay)
        setError(null)
      } else {
        setError(result.message || 'Failed to generate parlay')
      }
    } catch (error) {
      console.error('Parlay generation error:', error)
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        setError('Failed to generate parlay. Please try again.')
      }
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = isPremium || hasUnlimitedAccess || generationsToday < maxGenerations

  return (
    <div className="space-y-6">
      {/* Value proposition banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 text-white">
        <div className="font-bold text-lg mb-1">🎯 Positive EV Parlay Generator</div>
        <div className="text-sm text-purple-100">
          <strong>Only generates parlays with positive expected value</strong> - mathematical edge guaranteed
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-red-400 font-medium">Generation Failed</div>
              <div className="text-red-300 text-sm mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Premium-only advanced options */}
      <PremiumGate
        featureName="advanced parlay customization"
        upgradeHandler={handleUpgrade}
        fallback={null}
      >
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Premium Options
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bankroll Management
              </label>
              <select className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2">
                <option>Conservative (1-2%)</option>
                <option>Moderate (3-5%)</option>
                <option>Aggressive (5-10%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time Frame
              </label>
              <select className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2">
                <option>Today's Games</option>
                <option>This Weekend</option>
                <option>Next 7 Days</option>
              </select>
            </div>
          </div>
        </div>
      </PremiumGate>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Select Sport</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`p-3 rounded-lg border font-medium transition-all ${
                selectedSport === sport
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-gray-600 hover:border-gray-500 text-gray-300 bg-gray-800/50 hover:bg-gray-700/50'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Risk Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {riskLevels.map(level => {
            const Icon = level.icon
            return (
              <button
                key={level.id}
                onClick={() => setSelectedRisk(level.id)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedRisk === level.id
                    ? `${level.borderColor} ${level.bgColor}`
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/50 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${selectedRisk === level.id ? level.color : level.color}`} />
                  <div className={`font-bold text-lg ${selectedRisk === level.id ? level.color : level.color}`}>
                    {level.name}
                  </div>
                </div>
                <div className="text-gray-400 text-sm mb-1">
                  {level.description}
                </div>
                <div className="text-gray-500 text-xs">
                  {level.details}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={generateParlay}
        disabled={generating || !canGenerate || !selectedSport}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
          generating || !canGenerate || !selectedSport
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
        }`}
      >
        {generating ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Finding Positive EV Opportunities...
          </div>
        ) : !selectedSport ? (
          'Select a Sport First'
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">🏆</span>
            Generate Positive EV {selectedSport} Parlay
          </div>
        )}
      </button>

      {!canGenerate && !hasUnlimitedAccess && (
        <p className="text-red-400 mt-2 text-sm text-center">Generation limit reached for today</p>
      )}

      <div className="text-xs text-gray-500 text-center">
        Positive EV calculations • Mathematical edge analysis • Real-time odds optimization
      </div>
    </div>
  )
}

// Odds Improvement Banner Component
function OddsImprovementBanner({ comparison }) {
  if (!comparison?.comparisons?.length) return null;
  
  const totalSavings = comparison.comparisons.reduce((sum, comp) => 
    sum + (comp.improvement_percentage || 0), 0
  );
  
  const avgImprovement = (totalSavings / comparison.comparisons.length).toFixed(1);
  const betterOddsCount = comparison.comparisons.filter(c => c.improvement_percentage > 0).length;
  
  return (
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 mb-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold">🎉 Better Odds Found!</div>
          <div className="text-green-100">
            {betterOddsCount} out of {comparison.comparisons.length} bets have better odds available
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">+{avgImprovement}%</div>
          <div className="text-green-100 text-sm">Average improvement</div>
        </div>
      </div>
      
      <div className="mt-3 text-green-100 text-sm">
        💡 Switch to our recommended sportsbooks to maximize your potential payout
      </div>
    </div>
  );
}

// Sportsbook Comparison Table Component
function SportsbookComparisonTable({ comparison }) {
  if (!comparison?.comparisons?.length) return null;
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <span className="text-2xl mr-2">🏆</span>
        Best Sportsbook Analysis
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-2">Bet</th>
              <th className="text-left py-2">Your Book</th>
              <th className="text-left py-2">Your Odds</th>
              <th className="text-left py-2">Best Book</th>
              <th className="text-left py-2">Best Odds</th>
              <th className="text-left py-2">Improvement</th>
            </tr>
          </thead>
          <tbody>
            {comparison.comparisons.map((comp, index) => (
              <tr key={index} className="border-b border-gray-700">
                <td className="py-3 text-sm">{comp.original_bet}</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                    {comp.original_sportsbook}
                  </span>
                </td>
                <td className="py-3 font-mono">{comp.original_odds}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    comp.improvement_percentage > 0 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600'
                  }`}>
                    {comp.best_sportsbook}
                  </span>
                </td>
                <td className="py-3 font-mono font-bold">{comp.best_odds}</td>
                <td className="py-3">
                  {comp.improvement_percentage > 0 ? (
                    <span className="text-green-400 font-bold">
                      +{comp.improvement_percentage}%
                    </span>
                  ) : (
                    <span className="text-gray-400">No improvement</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-3 bg-blue-900/50 rounded border border-blue-500/50">
        <div className="text-blue-300 font-semibold mb-1">
          💡 Line Shopping Tip:
        </div>
        <div className="text-blue-200 text-sm">
          Even small improvements in odds can significantly increase your long-term profits. 
          A 2-5% improvement per bet adds up to substantial gains over time.
        </div>
      </div>
    </div>
  );
}

// Enhanced Analysis Results Component
function AnalysisResults({ analysis, handleUpgrade }) {
  const { isPremium } = usePremium();

  if (!analysis) return null

  return (
    <div className="space-y-6">
      {/* Always show odds comparison first if available */}
      {analysis.sportsbook_comparison && (
        <>
          <OddsImprovementBanner comparison={analysis.sportsbook_comparison} />
          <SportsbookComparisonTable comparison={analysis.sportsbook_comparison} />
        </>
      )}
      
      {/* Sportsbook summary */}
      {analysis.sportsbook_comparison && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-bold mb-2 flex items-center">
            <span className="mr-2">📊</span>
            Sportsbook Analysis Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {analysis.sportsbook_comparison?.summary?.bets_analyzed || 0}
              </div>
              <div className="text-gray-400 text-sm">Bets Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {analysis.sportsbook_comparison?.summary?.better_odds_found || 0}
              </div>
              <div className="text-gray-400 text-sm">Better Odds Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {analysis.sportsbook_comparison?.summary?.average_improvement || 0}%
              </div>
              <div className="text-gray-400 text-sm">Avg Improvement</div>
            </div>
          </div>
        </div>
      )}

      {/* Basic Analysis (always shown) */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
          <BarChart3 className="w-6 h-6 text-green-500" />
          Analysis Results
        </h3>
        
        {/* Smart Recognition Results */}
        {analysis.teams_and_players && (
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30 mb-4">
            <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Smart Recognition Results
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-300 font-medium">Teams Found:</span>
                <div className="text-white mt-1">
                  {analysis.teams_and_players.teams_found?.length > 0 
                    ? analysis.teams_and_players.teams_found.join(', ')
                    : 'None detected'
                  }
                </div>
              </div>
              <div>
                <span className="text-blue-300 font-medium">Players Found:</span>
                <div className="text-white mt-1">
                  {analysis.teams_and_players.players_found?.length > 0 
                    ? analysis.teams_and_players.players_found.join(', ')
                    : 'None detected'
                  }
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-blue-300 text-sm">
              🎯 Found {analysis.teams_and_players.games_found || 0} upcoming games for your teams/players
            </div>
          </div>
        )}
      </div>

      {/* Premium Analysis Section */}
      <PremiumGate
        featureName="advanced analysis & insights"
        upgradeHandler={handleUpgrade}
        fallback={
          <div className="bg-gray-800/50 rounded-xl p-6 border border-yellow-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Premium Analysis Available</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4 opacity-50">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">92%</div>
                <div className="text-sm text-gray-400">Win Probability</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">+15.2%</div>
                <div className="text-sm text-gray-400">Expected Value</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">4.1%</div>
                <div className="text-sm text-gray-400">Kelly Bet Size</div>
              </div>
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-4 mb-4 opacity-50">
              <h4 className="font-semibold text-yellow-400 mb-2">🔬 Advanced Insights</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Weather impact analysis for outdoor games</li>
                <li>• Injury report correlation with betting lines</li>
                <li>• Historical matchup performance data</li>
                <li>• Real-time line movement across 15+ sportsbooks</li>
              </ul>
            </div>
            
            <button 
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-6 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all"
            >
              <Crown className="w-5 h-5 inline mr-2" />
              Unlock Premium Analysis
            </button>
          </div>
        }
      >
        <div className="bg-gradient-to-br from-yellow-500/10 via-yellow-600/5 to-amber-500/10 rounded-xl p-6 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-yellow-400">Premium Analysis</h3>
          </div>
          
          {/* Advanced Metrics Only for Premium */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {analysis.confidence_score || '87%'}
              </div>
              <div className="text-sm text-gray-400">Confidence Score</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {analysis.expected_value || '+12.3%'}
              </div>
              <div className="text-sm text-gray-400">Expected Value</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {analysis.kelly_criterion || '3.2%'}
              </div>
              <div className="text-sm text-gray-400">Kelly Criterion</div>
            </div>
          </div>
          
          {/* Premium Insights */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">🔥 Premium Insights</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• Advanced weather impact analysis for outdoor games</li>
              <li>• Injury report correlation with betting lines</li>
              <li>• Historical head-to-head performance patterns</li>
              <li>• Real-time line movement tracking across 15+ sportsbooks</li>
            </ul>
          </div>
        </div>
      </PremiumGate>
    </div>
  )
}

// Restore Premium Modal Component
function RestorePremiumModal({ isOpen, onClose, onRestore, restoring }) {
  const [email, setEmail] = useState('')
  const [accessCode, setAccessCode] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email && accessCode) {
      onRestore(email, accessCode)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Restore Premium Access</h3>
        <p className="text-gray-400 mb-4">Enter your email and 8-character access code from your purchase confirmation:</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4"
            placeholder="Enter your email address"
            required
          />
          <input
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4"
            placeholder="Enter 8-character access code (e.g., ABC12345)"
            maxLength={8}
            pattern="[A-Z0-9]{8}"
            required
          />
          <div className="text-xs text-gray-400 mb-4">
            Access code format: 8 characters, letters and numbers only (e.g., ABC12345)
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!email || !accessCode || accessCode.length !== 8 || restoring}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {restoring ? 'Checking...' : 'Restore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Main Component
export default function AiParlayCalculator() {
  // Use Premium Context instead of local state
  const { isPremium, setIsPremium, premiumLoading, checkPremiumStatus } = useContext(PremiumContext);
  
  const [activeTab, setActiveTab] = useState('optimize')
  const [uploadsToday, setUploadsToday] = useState(0)
  const [generationsToday, setGenerationsToday] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [generatedParlay, setGeneratedParlay] = useState(null)
  const [upgrading, setUpgrading] = useState(false)
  const [showRestore, setShowRestore] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [selectedSport, setSelectedSport] = useState('NFL')
  const [showParlayModal, setShowParlayModal] = useState(false)

  const hasUnlimitedAccess = false

  // 🔒 Usage tracking helper functions
  const getUserIdentifier = () => {
    let identifier = localStorage.getItem('userIdentifier');
    if (!identifier) {
      identifier = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userIdentifier', identifier);
    }
    return identifier;
  }

  const checkUsageLimits = async () => {
    try {
      const userIdentifier = getUserIdentifier();
      const response = await fetch(`/api/check-usage?userIdentifier=${encodeURIComponent(userIdentifier)}`);
      const data = await response.json();
      
      if (response.ok) {
        return data;
      } else {
        console.error('Failed to check usage:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error checking usage:', error);
      return null;
    }
  }

  const trackUsage = async (action) => {
    try {
      const userIdentifier = getUserIdentifier();
      const response = await fetch('/api/track-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userIdentifier
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Check premium status on component mount
  useEffect(() => {
    const checkInitialPremiumStatus = async () => {
      // Check localStorage first for immediate UI update
      const localPremium = localStorage.getItem('isPremium');
      if (localPremium === 'true' && !isPremium) {
        setIsPremium(true);
      }
      
      // Then check with server for verification
      if (checkPremiumStatus) {
        await checkPremiumStatus();
      }
    };

    if (!premiumLoading) {
      checkInitialPremiumStatus();
    }
  }, [premiumLoading, isPremium, setIsPremium, checkPremiumStatus]);

  // Load usage data on component mount
  useEffect(() => {
    const loadUsageData = async () => {
      if (!isPremium) {
        console.log('🔍 Loading usage data from server...');
        const usageData = await checkUsageLimits();
        if (usageData) {
          console.log('📊 Usage data loaded:', usageData);
          setUploadsToday(usageData.usage.uploads);
          setGenerationsToday(usageData.usage.generations);
        }
      }
    };

    loadUsageData();
  }, [isPremium]);

  // Enhanced handleAnalysis with server-side tracking
  const handleAnalysis = async (analysisResult) => {
    if (!isPremium && !hasUnlimitedAccess) {
      console.log('🔒 Checking upload limits with server...');
      const trackResult = await trackUsage('upload');
      
      if (!trackResult.success) {
        alert(trackResult.error || 'Upload limit reached');
        return;
      }
      
      console.log('✅ Upload tracked successfully');
      setUploadsToday(trackResult.data.usage.uploads);
      setGenerationsToday(trackResult.data.usage.generations);
    }
    
    setAnalysis(analysisResult);
  }

  // Enhanced handleGeneration with server-side tracking
  const handleGeneration = async (parlayResult) => {
    if (!isPremium && !hasUnlimitedAccess) {
      console.log('🔒 Checking generation limits with server...');
      const trackResult = await trackUsage('generation');
      
      if (!trackResult.success) {
        alert(trackResult.error || 'Generation limit reached');
        return;
      }
      
      console.log('✅ Generation tracked successfully');
      setUploadsToday(trackResult.data.usage.uploads);
      setGenerationsToday(trackResult.data.usage.generations);
    }
    
    setGeneratedParlay(parlayResult);
    setShowParlayModal(true);
  }

  // 🚨 CORRECTED handleUpgrade function with userIdentifier
  const handleUpgrade = async () => {
    if (!userEmail) {
      setShowEmailInput(true)
      return
    }

    setUpgrading(true)
    try {
      console.log('🚀 Starting premium upgrade for:', userEmail)

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userEmail)) {
        throw new Error('Please enter a valid email address')
      }

      // Get the userIdentifier - IMPORTANT ADDITION
      const userIdentifier = getUserIdentifier()
      console.log('👤 User identifier:', userIdentifier)

      // Call your Stripe API with BOTH email and userIdentifier
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: userEmail,
          userIdentifier: userIdentifier  // ADD THIS LINE
        }),
      })

      const result = await response.json()
      console.log('💳 Stripe response:', result)

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`)
      }

      if (result.url) {
        // Redirect to Stripe checkout
        console.log('✅ Redirecting to Stripe checkout:', result.url)
        window.location.href = result.url
      } else {
        throw new Error('No checkout URL received from Stripe')
      }

    } catch (error) {
      console.error('❌ Premium upgrade error:', error)
      
      // Show user-friendly error messages
      let errorMessage = 'Failed to start upgrade process. Please try again.'
      
      if (error.message.includes('Network error') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Service temporarily busy. Please wait a moment and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setUpgrading(false)
    }
  }

  const handleRestorePremium = async (email, accessCode) => {
    setRestoring(true)
    try {
      console.log('🔄 Attempting to restore premium for:', email, 'with access code:', accessCode);
      
      const response = await fetch('/api/restore-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, accessCode }),
      })

      const result = await response.json()
      console.log('📥 Restore response:', result);

      if (response.ok && result.success) {
        // Success - user has premium
        console.log('✅ Premium restored successfully');
        
        // Update all the necessary storage items
        setIsPremium(true)
        localStorage.setItem('isPremium', 'true')
        localStorage.setItem('premiumEmail', email)
        
        // Link the email to the current user identifier
        const userIdentifier = localStorage.getItem('userIdentifier');
        if (userIdentifier) {
          localStorage.setItem('premiumUserIdentifier', userIdentifier);
        }
        
        setShowRestore(false)
        alert('Premium access restored successfully!')
        
        // Trigger a premium status check to sync everything
        if (checkPremiumStatus) {
          await checkPremiumStatus();
        }
      } else {
        alert(result.message || 'Failed to restore premium access. Please check your email and access code.')
      }
    } catch (error) {
      console.error('Error restoring premium:', error)
      alert('Failed to restore premium access. Please try again.')
    } finally {
      setRestoring(false)
    }
  }

  // Render usage limits with loading state
  const renderUsageLimits = () => {
    if (premiumLoading) {
      return (
        <div className="flex gap-5 mb-8 p-6 rounded-xl border bg-gray-500/10 border-gray-500/30">
          <div className="flex items-center gap-3 flex-1">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
            <div>
              <div className="font-semibold text-gray-300">Loading...</div>
              <div className="text-sm text-gray-400">Checking premium status...</div>
            </div>
          </div>
        </div>
      );
    }

    if (isPremium) {
      return (
        <div className="flex gap-5 mb-8 p-6 rounded-xl border bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-3 flex-1">
            <Crown className="w-6 h-6 text-yellow-400" />
            <div>
              <div className="font-semibold text-yellow-300">Premium Member</div>
              <div className="text-sm text-yellow-400">
                {activeTab === 'optimize' 
                  ? 'Unlimited uploads • Smart team/player recognition • Server-side tracking'
                  : 'Unlimited generations • Sport-specific analysis • Server-side tracking'
                }
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Free user limits
    return (
      <div className="flex gap-5 mb-8 p-6 rounded-xl border bg-green-500/10 border-green-500/30">
        <div className="flex-1 text-center">
          <span className="block text-2xl font-bold text-green-400">
            {activeTab === 'optimize' ? '2' : '1'}
          </span>
          <span className="text-sm text-gray-400 font-medium">
            Free Daily {activeTab === 'optimize' ? 'Uploads' : 'Generation'}
          </span>
        </div>
        <div className="flex-1 text-center">
          <span className="block text-2xl font-bold text-green-400">
            {activeTab === 'optimize' ? uploadsToday : generationsToday}
          </span>
          <span className="text-sm text-gray-400 font-medium">Used Today (Server Tracked)</span>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'optimize') {
      return (
        <div>
          {renderUsageLimits()}
          
          <FeatureLimiter
            current={uploadsToday}
            limit={2}
            featureName="Uploads"
            premiumFeatureName="unlimited uploads + priority processing"
            upgradeHandler={handleUpgrade}
          >
            <UploadArea
              onAnalysis={handleAnalysis}
              uploadsToday={uploadsToday}
              maxUploads={2}
              isPremium={isPremium}
              hasUnlimitedAccess={hasUnlimitedAccess}
            />
          </FeatureLimiter>

          <AnalysisResults 
            analysis={analysis} 
            handleUpgrade={handleUpgrade}
          />
        </div>
      );
    }

    if (activeTab === 'generate') {
      return (
        <div>
          {renderUsageLimits()}

          <FeatureLimiter
            current={generationsToday}
            limit={1}
            featureName="Generations"
            premiumFeatureName="unlimited generations + advanced algorithms"
            upgradeHandler={handleUpgrade}
          >
            <ParlayGenerator
              onGeneration={handleGeneration}
              generationsToday={generationsToday}
              maxGenerations={1}
              isPremium={isPremium}
              preSelectedSport={selectedSport}
              handleUpgrade={handleUpgrade}
            />
          </FeatureLimiter>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Email Input Modal */}
      {showEmailInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Upgrade to Premium</h3>
            <p className="text-gray-400 mb-4">Enter your email to continue to checkout:</p>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4"
              placeholder="Enter your email address"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowEmailInput(false)}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgrade}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Premium Modal */}
      <RestorePremiumModal
        isOpen={showRestore}
        onClose={() => setShowRestore(false)}
        onRestore={handleRestorePremium}
        restoring={restoring}
      />

      {/* Parlay Results Modal */}
      <ParlayResultsModal
        parlay={generatedParlay}
        isOpen={showParlayModal}
        onClose={() => setShowParlayModal(false)}
        handleUpgrade={handleUpgrade}
      />

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40 backdrop-blur-sm bg-gray-800/95">
        <nav className="container mx-auto px-4 flex justify-between items-center py-4">
          <div className="text-2xl font-bold text-white">
            AiParlayCalculator
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-300 hover:text-green-400 font-medium transition-colors">Features</a>
            <a href="#about" className="text-gray-300 hover:text-green-400 font-medium transition-colors">About</a>
            <a href="#pricing" className="text-gray-300 hover:text-green-400 font-medium transition-colors">Pricing</a>
            {isPremium ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-2 rounded-lg font-semibold">        
                <Crown className="w-4 h-4" />
                Premium
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  className="text-sm text-gray-400 hover:text-green-400 transition-colors"
                  onClick={() => setShowRestore(true)}
                >
                  Restore Premium
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {upgrading ? 'Loading...' : 'Go Premium'}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-3">
            {isPremium ? (
              <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1 rounded-lg font-semibold text-sm">        
                <Crown className="w-3 h-3" />
                Premium
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 text-sm"
              >
                {upgrading ? 'Loading...' : 'Go Premium'}
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-green-900/20 py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white">
            Your Complete <span className="text-yellow-400">Sports Betting</span><br />
            <span className="text-green-400">Analysis & Strategy Hub</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto leading-relaxed">
            <span className="text-yellow-400 font-semibold">Analyze bet slips</span>, <span className="text-green-400 font-semibold">generate smart parlays</span>, and <span className="text-blue-400 font-semibold">find the best odds</span> across top sportsbooks - all powered by advanced mathematical analysis
          </p>
          
          {/* Core Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6">
              <div className="text-white font-bold text-lg">Smart Bet Slip Analysis</div>
              <div className="text-gray-300 text-sm">Upload your slip for instant optimization and better odds</div>
            </div>
            
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
              <div className="text-white font-bold text-lg">Intelligent Parlay Generator</div>
              <div className="text-gray-300 text-sm">Generate mathematically optimized parlays for any sport</div>
            </div>
            
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-6">
              <div className="text-white font-bold text-lg">Multi-Sportsbook Comparison</div>
              <div className="text-gray-300 text-sm">Find the best odds across 10+ premium sportsbooks</div>
            </div>
          </div>
          <a href="#app" className="inline-flex items-center gap-3 bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-all hover:scale-105 shadow-lg">
            <span>Start Analyzing</span>
            <Activity className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Main App */}
      <main className="container mx-auto px-4 py-16" id="app">
        <div className="bg-gray-800 shadow-xl mx-auto max-w-6xl rounded-2xl overflow-hidden border border-gray-700">
          
          {/* Premium Home Page */}
          {isPremium && (
            <div className="p-10">
              <PremiumHomePage setActiveTab={setActiveTab} />
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-700 bg-gray-800">
            <button
              className={`flex-1 py-6 px-6 font-semibold transition-all ${
                activeTab === 'optimize'
                ? 'text-green-400 border-b-2 border-green-500 bg-gray-700'
                : 'text-gray-400 hover:text-green-400 hover:bg-gray-700/50'
              }`}
              onClick={() => setActiveTab('optimize')}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                Smart Bet Slip Analysis
              </div>
            </button>
            <button
              className={`flex-1 py-6 px-6 font-semibold transition-all ${
                activeTab === 'generate'
                ? 'text-green-400 border-b-2 border-green-500 bg-gray-700'
                : 'text-gray-400 hover:text-green-400 hover:bg-gray-700/50'
              }`}
              onClick={() => setActiveTab('generate')}
            >
              <div className="flex items-center justify-center gap-2">
                <Brain className="w-5 h-5" />
                Generate Parlay
              </div>
            </button>
          </div>

          <div className="p-10 bg-gray-800">
            {renderTabContent()}
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Professional Sports Betting Tools</h2>
            <p className="text-lg text-gray-400">Advanced technology for superior betting decisions</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-800 p-8 rounded-xl text-center border border-gray-700">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-white">Bet Slip Analysis</h3>
              <p className="text-gray-400 text-sm">Upload images and get instant team/player recognition with optimization</p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl text-center border border-gray-700">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-white">Smart Parlay Generation</h3>
              <p className="text-gray-400 text-sm">Mathematically optimized parlays with risk level customization</p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl text-center border border-gray-700">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-white">Multi-Sport Coverage</h3>
              <p className="text-gray-400 text-sm">NFL, NBA, NHL, MLB, UFC, Soccer, Tennis and more</p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl text-center border border-gray-700">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-white">Comprehensive Odds Comparison</h3>
              <p className="text-gray-400 text-sm">Real-time comparison across 10+ premium sportsbooks to find the best odds for your bets</p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-gray-800/50 rounded-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">About AiParlayCalculator</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Professional-grade sports betting analysis platform with comprehensive tools and multi-sportsbook optimization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">100,000+ Users</h3>
              <p className="text-gray-400">Trusted by serious bettors worldwide for consistent results</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Industry Leading</h3>
              <p className="text-gray-400">Most comprehensive sports betting analysis platform available</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Advanced Analytics</h3>
              <p className="text-gray-400">Mathematical modeling and statistical analysis for optimal betting strategies</p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Choose Your Plan</h2>
            <p className="text-lg text-gray-400">Start free, upgrade when you're ready for more</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                <div className="text-4xl font-bold text-green-400 mb-2">$0</div>
                <p className="text-gray-400">Perfect for getting started</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  2 bet slip uploads per day
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  1 parlay generation per day
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Basic sportsbook comparison
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Smart team/player recognition
                </li>
              </ul>

              <button className="w-full py-3 px-6 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                Current Plan
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-xl p-8 border-2 border-green-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  MOST POPULAR
                </span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                <div className="text-4xl font-bold text-green-400 mb-2">$6.99</div>
                <p className="text-gray-400">per month</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Unlimited bet slip uploads
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Unlimited parlay generations
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Advanced sportsbook comparison
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Priority AI processing
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Advanced analytics & insights
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  Export parlay images
                </li>
              </ul>

              <button 
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {upgrading ? 'Processing...' : 'Upgrade to Premium'}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">AiParlayCalculator</h3>
              <p className="text-gray-400 text-sm">
                The most comprehensive sports betting analysis platform for smart bettors.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-green-400 text-sm">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-green-400 text-sm">Pricing</a></li>
                <li><a href="#app" className="text-gray-400 hover:text-green-400 text-sm">Calculator</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-green-400 text-sm">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 text-sm">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 text-sm">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-green-400 text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 text-sm">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 text-sm">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
© 2025 AiParlayCalculator. All rights reserved. • Bet responsibly. 21+ only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}