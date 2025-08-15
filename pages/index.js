import Head from 'next/head'
import { useState, useEffect } from 'react'
import { Upload, Zap, Target, Brain, Crown, Check, Star, Shield, Calculator, TrendingUp, X } from 'lucide-react'
import UploadArea from '@/components/UploadArea'
import ParlayGenerator from '@/components/ParlayGenerator'
import AnalysisResults from '@/components/AnalysisResults'
import ParlayResults from '@/components/ParlayResults'
import PremiumRestore from '@/components/PremiumRestore'

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
      // Mock upgrade process - replace with actual Stripe integration
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
            <a href="/" className="text-2xl font-bold text-blue-700">
              AI Parlay Calculator
            </a>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">Pricing</a>
              <a href="/terms" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">Terms</a>
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
                <h4 className="text-white font-bold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</a></li>
                  <li><a href="/responsible-betting" className="hover:text-white transition-colors">Responsible Betting</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="/api" className="hover:text-white transition-colors">API Documentation</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">Sports</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/nfl-analysis" className="hover:text-white transition-colors">NFL Analysis</a></li>
                  <li><a href="/nba-analysis" className="hover:text-white transition-colors">NBA Analysis</a></li>
                  <li><a href="/nhl-analysis" className="hover:text-white transition-colors">NHL Analysis</a></li>
                  <li><a href="/mlb-analysis" className="hover:text-white transition-colors">MLB Analysis</a></li>
                  <li><a href="/mma-analysis" className="hover:text-white transition-colors">MMA Analysis</a></li>
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