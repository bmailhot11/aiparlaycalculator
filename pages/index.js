import Head from 'next/head'
import { useState, useEffect } from 'react'
import { Upload, Zap, Target, Brain, Crown, Check, Star, Shield, Calculator, TrendingUp, X } from 'lucide-react'

// Simple inline components to replace the missing @/components imports
function UploadArea({ onAnalysis, uploadsToday, maxUploads, isPremium }) {
  const [dragActive, setDragActive] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragActive(false)
    
    if (!isPremium && uploadsToday >= maxUploads) {
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
    
    if (!isPremium && uploadsToday >= maxUploads) {
      alert('Daily upload limit reached. Upgrade to Premium for unlimited uploads!')
      return
    }

    await analyzeImage(file)
  }

  const analyzeImage = async (file) => {
    setAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/analyze-slip', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const result = await response.json()
      onAnalysis(result)
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const canUpload = isPremium || uploadsToday < maxUploads

  return (
    <div className="mb-8">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : canUpload
            ? 'border-gray-300 hover:border-blue-400'
            : 'border-gray-200 bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {analyzing ? (
          <div className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Analyzing Your Bet Slip</h3>
            <p className="text-gray-600">AI is processing your image...</p>
          </div>
        ) : (
          <>
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Your Bet Slip</h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your bet slip screenshot or click to browse
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
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Choose File
            </label>
            {!canUpload && (
              <p className="text-red-600 mt-2 text-sm">Upload limit reached for today</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ParlayGenerator({ onGeneration, generationsToday, maxGenerations, isPremium }) {
  const [generating, setGenerating] = useState(false)
  const [selectedSports, setSelectedSports] = useState(['NFL', 'NBA'])

  const sports = ['NFL', 'NBA', 'NCAAF', 'NCAAB', 'NHL', 'MLB']

  const generateParlay = async () => {
    if (!isPremium && generationsToday >= maxGenerations) {
      alert('Daily generation limit reached. Upgrade to Premium for unlimited generations!')
      return
    }

    if (selectedSports.length === 0) {
      alert('Please select at least one sport')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/generate-parlay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sports: selectedSports,
        }),
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const result = await response.json()
      onGeneration(result)
    } catch (error) {
      console.error('Generation error:', error)
      alert('Parlay generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const toggleSport = (sport) => {
    setSelectedSports(prev =>
      prev.includes(sport)
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    )
  }

  const canGenerate = isPremium || generationsToday < maxGenerations

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4">Select Sports</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {sports.map(sport => (
          <button
            key={sport}
            onClick={() => toggleSport(sport)}
            className={`p-3 rounded-lg border-2 font-medium transition-all ${
              selectedSports.includes(sport)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      <button
        onClick={generateParlay}
        disabled={generating || !canGenerate || selectedSports.length === 0}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
          generating || !canGenerate || selectedSports.length === 0
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
        }`}
      >
        {generating ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Generating AI Parlay...
          </div>
        ) : (
          'Generate AI Parlay'
        )}
      </button>

      {!canGenerate && (
        <p className="text-red-600 mt-2 text-sm text-center">Generation limit reached for today</p>
      )}
    </div>
  )
}

function AnalysisResults({ analysis }) {
  if (!analysis) return null

  return (
    <div className="bg-gray-50 rounded-xl p-6 mt-8">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Target className="w-6 h-6 text-blue-600" />
        Analysis Results
      </h3>
      
      {analysis.bets && analysis.bets.length > 0 ? (
        <div className="space-y-4">
          {analysis.bets.map((bet, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{bet.match || bet.game}</h4>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  bet.recommendation === 'Strong' ? 'bg-green-100 text-green-800' :
                  bet.recommendation === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {bet.recommendation || 'Analyzed'}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{bet.analysis || bet.pick}</p>
              {bet.odds && <p className="text-sm mt-1"><strong>Odds:</strong> {bet.odds}</p>}
            </div>
          ))}
          
          {analysis.summary && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
              <h4 className="font-semibold text-blue-800 mb-2">Summary</h4>
              <p className="text-blue-700 text-sm">{analysis.summary}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">✅ Analysis Complete</div>
          <p className="text-gray-600">
            {analysis.message || 'Your bet slip has been analyzed successfully.'}
          </p>
        </div>
      )}
    </div>
  )
}

function ParlayResults({ parlay }) {
  if (!parlay) return null

  return (
    <div className="bg-gray-50 rounded-xl p-6 mt-8">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Brain className="w-6 h-6 text-purple-600" />
        Generated Parlay
      </h3>
      
      {parlay.picks && parlay.picks.length > 0 ? (
        <div className="space-y-4">
          {parlay.picks.map((pick, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{pick.match || pick.game}</h4>
                <span className="text-sm text-gray-500">{pick.sport}</span>
              </div>
              <div className="text-blue-600 font-medium mb-1">{pick.pick}</div>
              <p className="text-gray-600 text-sm">{pick.reasoning}</p>
              {pick.odds && <p className="text-sm mt-1"><strong>Odds:</strong> {pick.odds}</p>}
              {pick.confidence && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${pick.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">{pick.confidence}%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {parlay.summary && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mt-4">
              <h4 className="font-semibold text-purple-800 mb-2">Parlay Summary</h4>
              <p className="text-purple-700 text-sm">{parlay.summary}</p>
              {parlay.totalOdds && (
                <p className="text-purple-800 font-semibold mt-2">
                  Combined Odds: {parlay.totalOdds}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">🎯 Parlay Generated</div>
          <p className="text-gray-600">
            {parlay.message || 'Your AI parlay has been generated successfully.'}
          </p>
        </div>
      )}
    </div>
  )
}

function PremiumRestore() {
  const [accessCode, setAccessCode] = useState('')
  const [restoring, setRestoring] = useState(false)

  const handleRestore = async () => {
    if (!accessCode.trim()) {
      alert('Please enter your access code')
      return
    }

    setRestoring(true)
    try {
      const response = await fetch('/api/restore-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      })

      if (!response.ok) {
        throw new Error('Invalid access code')
      }

      const result = await response.json()
      if (result.success) {
        localStorage.setItem('isPremium', 'true')
        alert('Premium access restored successfully!')
        window.location.reload()
      } else {
        alert('Invalid or expired access code')
      }
    } catch (error) {
      console.error('Restore error:', error)
      alert('Failed to restore premium access. Please check your code.')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div>
      <p className="text-gray-600 mb-4">
        Enter the access code that was sent to your email when you purchased Premium.
      </p>
      <input
        type="text"
        value={accessCode}
        onChange={(e) => setAccessCode(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
        placeholder="Enter your access code"
      />
      <button
        onClick={handleRestore}
        disabled={restoring}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {restoring ? 'Restoring...' : 'Restore Premium Access'}
      </button>
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('optimize')
  const [uploadsToday, setUploadsToday] = useState(0)
  const [generationsToday, setGenerationsToday] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [generatedParlay, setGeneratedParlay] = useState(null)
  const [upgrading, setUpgrading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showRestore, setShowRestore] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)

  // Load usage from localStorage - only on client side
  useEffect(() => {
    setMounted(true)

    // Only access localStorage after component mounts on client
    if (typeof window !== 'undefined') {
      const today = new Date().toDateString()
      const savedDate = localStorage.getItem('usageDate')

      if (savedDate === today) {
        setUploadsToday(parseInt(localStorage.getItem('uploadsToday') || '0'))
        setGenerationsToday(parseInt(localStorage.getItem('generationsToday') || '0'))
      } else {
        // Reset daily limits
        localStorage.setItem('usageDate', today)
        localStorage.setItem('uploadsToday', '0')
        localStorage.setItem('generationsToday', '0')
      }

      setIsPremium(localStorage.getItem('isPremium') === 'true')
    }
  }, [])

  const handleAnalysis = (analysisResult) => {
    setAnalysis(analysisResult)
    if (!isPremium && typeof window !== 'undefined') {
      const newCount = uploadsToday + 1
      setUploadsToday(newCount)
      localStorage.setItem('uploadsToday', newCount.toString())
    }
  }

  const handleGeneration = (parlayResult) => {
    setGeneratedParlay(parlayResult)
    if (!isPremium && typeof window !== 'undefined') {
      const newCount = generationsToday + 1
      setGenerationsToday(newCount)
      localStorage.setItem('generationsToday', newCount.toString())
    }
  }

  const handleUpgrade = async () => {
    if (!userEmail) {
      setShowEmailInput(true);
      return;
    }

    setUpgrading(true)
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      })

      if (response.ok) {
        const { url } = await response.json()

        if (url) {
          window.location.href = url
        }
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to start upgrade process. Please try again.')
    } finally {
      setUpgrading(false)
    }
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>AI Parlay Calculator - Advanced Sports Betting Analysis & Optimization Tool</title>
        <meta name="description" content="Professional AI parlay calculator with bet slip analysis. Upload screenshots for mathematical insights, parlay optimization, and strategic betting recommendations. NFL, NBA, NHL, MLB, MMA coverage." />
        <meta name="keywords" content="AI parlay calculator, sports betting analysis, parlay optimizer, bet slip analyzer, sports betting calculator, NFL betting, NBA betting, sports betting strategy, mathematical betting analysis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://aiparlaycalculator.com/" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://aiparlaycalculator.com/" />
        <meta property="og:title" content="AI Parlay Calculator - Advanced Sports Betting Analysis" />
        <meta property="og:description" content="Professional AI parlay calculator with mathematical analysis. Upload bet slips for optimization insights and strategic recommendations." />
        <meta property="og:image" content="https://aiparlaycalculator.com/og-image.jpg" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://aiparlaycalculator.com/" />
        <meta name="twitter:title" content="AI Parlay Calculator - Advanced Sports Betting Analysis" />
        <meta name="twitter:description" content="Professional AI parlay calculator with mathematical analysis and optimization." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <nav className="container mx-auto px-4 flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-blue-700">
              AI Parlay Calculator
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">Pricing</a>
              {isPremium ? (
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-semibold">        
                  <Crown className="w-4 h-4" />
                  Premium
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    className="text-sm text-gray-600 hover:text-blue-700 transition-colors"
                    onClick={() => setShowRestore(true)}
                  >
                    Restore Premium
                  </button>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="bg-gradient-to-r from-blue-700 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {upgrading ? 'Loading...' : 'Go Premium'}
                  </button>
                </div>
              )}
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-700 to-purple-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
              AI-Powered Sports Betting Analysis
            </h1>
            <p className="text-xl md:text-2xl mb-3 opacity-95">
              Mathematical Optimization for Smarter Betting Decisions
            </p>
            <p className="text-lg md:text-xl opacity-85 max-w-2xl mx-auto mb-8">
              Professional-grade analysis using advanced AI mathematics. Upload your bet slips for strategic insights and optimization recommendations.
            </p>
            <a href="#app" className="inline-flex items-center gap-2 bg-yellow-500 text-gray-900 px-8 py-4 rounded-xl text-lg font-bold hover:shadow-xl transition-all hover:-translate-y-1">
              <span>Start Analyzing</span>
              <Zap className="w-5 h-5" />
            </a>
          </div>
        </section>

        {/* Main App */}
        <main className="container mx-auto px-4" id="app">
          <div className="bg-white -mt-10 mx-auto max-w-6xl rounded-xl shadow-2xl overflow-hidden relative z-10">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                className={`flex-1 py-5 px-6 font-semibold border-b-3 transition-all ${
                  activeTab === 'optimize'
                  ? 'text-blue-700 border-blue-700 bg-blue-50'
                  : 'text-gray-600 border-transparent hover:text-blue-700'
                }`}
                onClick={() => setActiveTab('optimize')}
              >
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Optimize Bet Slip
                </div>
              </button>
              <button
                className={`flex-1 py-5 px-6 font-semibold border-b-3 transition-all ${
                  activeTab === 'generate'
                  ? 'text-blue-700 border-blue-700 bg-blue-50'
                  : 'text-gray-600 border-transparent hover:text-blue-700'
                }`}
                onClick={() => setActiveTab('generate')}
              >
                <div className="flex items-center justify-center gap-2">
                  <Brain className="w-5 h-5" />
                  Generate Parlay
                </div>
              </button>
            </div>

            <div className="p-10">
              {activeTab === 'optimize' && (
                <div>
                  {/* Usage Limits */}
                  <div className={`flex gap-5 mb-8 p-5 rounded-lg border-l-4 ${
                    isPremium
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-green-50 border-green-500'
                  }`}>
                    {isPremium ? (
                      <div className="flex items-center gap-3 flex-1">
                        <Crown className="w-6 h-6 text-yellow-600" />
                        <div>
                          <div className="font-semibold text-yellow-800">Premium Member</div>
                          <div className="text-sm text-yellow-700">Unlimited uploads and generations</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 text-center">
                          <span className="block text-2xl font-bold text-green-600">2</span>
                          <span className="text-sm text-gray-600 font-medium">Free Daily Uploads</span>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="block text-2xl font-bold text-green-600">{uploadsToday}</span>
                          <span className="text-sm text-gray-600 font-medium">Used Today</span>
                        </div>
                      </>
                    )}
                  </div>

                  <UploadArea
                    onAnalysis={handleAnalysis}
                    uploadsToday={uploadsToday}
                    maxUploads={2}
                    isPremium={isPremium}
                  />

                  <AnalysisResults analysis={analysis} />
                </div>
              )}

              {activeTab === 'generate' && (
                <div>
                  {/* Usage Limits */}
                  <div className={`flex gap-5 mb-8 p-5 rounded-lg border-l-4 ${
                    isPremium
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-green-50 border-green-500'
                  }`}>
                    {isPremium ? (
                      <div className="flex items-center gap-3 flex-1">
                        <Crown className="w-6 h-6 text-yellow-600" />
                        <div>
                          <div className="font-semibold text-yellow-800">Premium Member</div>
                          <div className="text-sm text-yellow-700">Unlimited uploads and generations</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 text-center">
                          <span className="block text-2xl font-bold text-green-600">1</span>
                          <span className="text-sm text-gray-600 font-medium">Free Daily Generation</span>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="block text-2xl font-bold text-green-600">{generationsToday}</span>
                          <span className="text-sm text-gray-600 font-medium">Used Today</span>
                        </div>
                      </>
                    )}
                  </div>

                  <ParlayGenerator
                    onGeneration={handleGeneration}
                    generationsToday={generationsToday}
                    maxGenerations={1}
                    isPremium={isPremium}
                  />

                  <ParlayResults parlay={generatedParlay} />
                </div>
              )}
            </div>
          </div>

          {/* Pricing Section */}
          {!isPremium && (
            <section id="pricing" className="py-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Simple, Transparent Pricing</h2>
                <p className="text-lg text-gray-600">Choose the plan that works for you</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Free Plan */}
                <div className="bg-white p-8 rounded-xl border-2 border-gray-200">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">Free</h3>
                    <div className="text-4xl font-black text-gray-800">$0</div>
                    <div className="text-gray-600">per month</div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>2 daily bet slip uploads</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>1 daily AI parlay generation</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Basic optimization analysis</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>5 sports coverage</span>
                    </li>
                  </ul>
                  <button className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-colors">
                    Current Plan
                  </button>
                </div>

                {/* Premium Plan */}
                <div className="bg-gradient-to-br from-blue-700 to-purple-600 text-white p-8 rounded-xl relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                      POPULAR
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">Premium</h3>
                    <div className="text-4xl font-black">$4.99</div>
                    <div className="opacity-80">per month</div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-yellow-400" />
                      <span>Unlimited bet slip uploads</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-yellow-400" />
                      <span>Unlimited AI parlay generation</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-yellow-400" />
                      <span>Advanced mathematical analysis</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-yellow-400" />
                      <span>Priority AI processing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-yellow-400" />
                      <span>Detailed risk assessment</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-yellow-400" />
                      <span>Premium support</span>
                    </li>
                  </ul>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="w-full py-3 bg-yellow-400 text-yellow-900 rounded-lg font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50"
                  >
                    {upgrading ? 'Processing...' : 'Upgrade Now'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Features Section */}
          <section id="features" className="py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Professional Betting Analysis Tools</h2>
              <p className="text-lg text-gray-600">Advanced AI technology for smarter betting decisions</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow">
                <Brain className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-bold mb-3">Advanced Mathematical Analysis</h3>
                <p className="text-gray-600">AI-powered mathematical models analyze probability distributions, expected values, and risk-adjusted returns for optimal betting strategies.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow">
                <Target className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-bold mb-3">Multi-Sport Coverage</h3>
                <p className="text-gray-600">Comprehensive analysis across NFL, NBA, NHL, MLB, and MMA with sport-specific statistical models and betting patterns.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow">
                <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-bold mb-3">Risk Assessment</h3>
                <p className="text-gray-600">Sophisticated risk modeling with variance analysis, bankroll management recommendations, and probability-weighted outcomes.</p>
              </div>
            </div>
          </section>

          {/* Important Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-400 rounded-xl p-6 my-16 max-w-4xl mx-auto">
            <h3 className="flex items-center gap-2 text-yellow-800 font-bold mb-3">
              <Target className="w-6 h-6" />
              Important Disclaimer
            </h3>
            <p className="text-yellow-800 text-sm leading-relaxed">
              <strong>Educational Tool Only:</strong> AI Parlay Calculator provides mathematical analysis and educational insights for sports betting research. We make no guarantees, promises, or warranties regarding winning outcomes, profitability, or investment success. All betting involves risk of loss. Past performance does not indicate future results. Users are solely responsible for their betting decisions and financial outcomes. This tool is intended for educational and entertainment purposes only. Please bet responsibly and within your means.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-10 mb-10">
              <div>
                <h4 className="text-white font-bold mb-4">AI Parlay Calculator</h4>
                <p className="text-sm leading-relaxed">Professional sports betting analysis using advanced mathematical models and AI technology.</p>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">Features</h4>
                <ul className="space-y-2 text-sm">
                  <li>Bet Slip Analysis</li>
                  <li>AI Parlay Generation</li>
                  <li>Mathematical Modeling</li>
                  <li>Risk Assessment</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">Sports Coverage</h4>
                <ul className="space-y-2 text-sm">
                  <li>NFL Analysis</li>
                  <li>NBA Analysis</li>
                  <li>NHL Analysis</li>
                  <li>MLB Analysis</li>
                  <li>MMA Analysis</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">About</h4>
                <ul className="space-y-2 text-sm">
                  <li>Educational Tool</li>
                  <li>Responsible Betting</li>
                  <li>Mathematical Analysis</li>
                  <li>AI Technology</li>
                </ul>
              </div>
            </div>

            <div className="text-center pt-5 border-t border-gray-700 text-sm">
              <p>&copy; 2024 AI Parlay Calculator. All rights reserved. • Educational analysis tool only • No guarantees of profits or winnings</p>
            </div>
          </div>
        </footer>

        {/* Restore Premium Modal */}
        {showRestore && !isPremium && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Restore Premium Access</h2>
                <button onClick={() => setShowRestore(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <PremiumRestore />
              </div>
            </div>
          </div>
        )}

        {/* Email Input Modal */}
        {showEmailInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Enter Your Email</h2>
                <button onClick={() => setShowEmailInput(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-gray-600 mb-4">We'll send your access code to this email for future premium restoration.</p>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  placeholder="Enter your email address"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEmailInput(false)}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowEmailInput(false);
                      handleUpgrade();
                    }}
                    disabled={!userEmail || upgrading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}