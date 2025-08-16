import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { Upload, Zap, Target, Brain, Crown, Check, Star, Shield, Calculator, TrendingUp, X, BarChart3, Activity, Download, Share2, ExternalLink, Copy } from 'lucide-react'

// Live Odds Display Component with Enhanced Error Handling
function LiveOddsDisplay() {
  const [liveOdds, setLiveOdds] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState('NFL')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isActive, setIsActive] = useState(true)
  const [manualRefresh, setManualRefresh] = useState(false)
  const [error, setError] = useState(null)

  const sports = ['NFL', 'NBA', 'NHL'] // Limited to 3 sports to save credits

  // Enhanced debug logging
  const debugLog = (message, data = null) => {
    console.log(`[LiveOdds Debug] ${message}`, data || '')
  }

  // Smart refresh interval based on time and user activity
  const getRefreshInterval = () => {
    const hour = new Date().getHours()
    
    // Peak hours: 6 PM - 11 PM (30 min intervals)
    if (hour >= 18 && hour <= 23 && isActive) {
      debugLog('Peak hours detected - 30min refresh interval')
      return 1800000 // 30 minutes
    } 
    // Business hours: 9 AM - 6 PM (60 min intervals)
    else if (hour >= 9 && hour <= 18 && isActive) {
      debugLog('Business hours detected - 60min refresh interval')
      return 3600000 // 60 minutes
    }
    // Off-peak: no auto-refresh (save credits)
    else {
      debugLog('Off-peak hours - manual refresh only')
      return null
    }
  }

  // Track if user is actively viewing the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      const newActiveState = !document.hidden
      setIsActive(newActiveState)
      debugLog(`Page visibility changed: ${newActiveState ? 'active' : 'hidden'}`)
    }

    const handleFocus = () => {
      setIsActive(true)
      debugLog('Window focused - setting active state')
    }

    const handleBlur = () => {
      setIsActive(false)
      debugLog('Window blurred - setting inactive state')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  useEffect(() => {
    debugLog(`Setting up odds fetching for sport: ${selectedSport}`)
    
    // Initial fetch
    fetchLiveOdds()
    
    // Set up smart interval
    const interval = getRefreshInterval()
    let intervalId = null
    
    if (interval && isActive) {
      debugLog(`Setting up auto-refresh every ${interval/60000} minutes`)
      intervalId = setInterval(fetchLiveOdds, interval)
    } else {
      debugLog('No auto-refresh scheduled')
    }

    return () => {
      if (intervalId) {
        debugLog('Cleaning up refresh interval')
        clearInterval(intervalId)
      }
    }
  }, [selectedSport, isActive])

  const fetchLiveOdds = async () => {
    try {
      setError(null)
      setManualRefresh(false)
      debugLog(`Fetching live odds for ${selectedSport}`)
      
      const response = await fetch('/api/live-odds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: selectedSport })
      })
      
      debugLog(`API response status: ${response.status}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      debugLog('API response data:', data)
      
      if (data.success) {
        const limitedOdds = data.odds.slice(0, 3) // Limit to 3 games to save credits
        setLiveOdds(limitedOdds)
        setLastUpdated(new Date())
        debugLog(`Successfully loaded ${limitedOdds.length} games`)
      } else {
        throw new Error(data.message || 'Failed to fetch odds')
      }
    } catch (error) {
      debugLog('Error fetching live odds:', error)
      console.error('Failed to fetch live odds:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = () => {
    debugLog('Manual refresh triggered')
    setManualRefresh(true)
    setLoading(true)
    fetchLiveOdds()
  }

  const handleSportChange = (sport) => {
    debugLog(`Sport changed to: ${sport}`)
    setSelectedSport(sport)
    setLoading(true)
  }

  const getNextUpdateTime = () => {
    if (!lastUpdated) return null
    
    const interval = getRefreshInterval()
    if (!interval) return null
    
    const nextUpdate = new Date(lastUpdated.getTime() + interval)
    return nextUpdate
  }

  const formatTimeUntilUpdate = () => {
    const nextUpdate = getNextUpdateTime()
    if (!nextUpdate) return "Manual refresh only"
    
    const now = new Date()
    const diff = nextUpdate - now
    
    if (diff <= 0) return "Updating soon..."
    
    const minutes = Math.floor(diff / 60000)
    return `Next update in ${minutes}m`
  }

  const isOffPeak = () => {
    const hour = new Date().getHours()
    return hour < 9 || hour > 23
  }

  // Get dynamic status indicator based on time and activity
  const getStatusIndicator = () => {
    if (isActive && !isOffPeak()) {
      return { color: 'bg-green-500', pulse: 'animate-pulse', text: 'Live Tracking' }
    } else if (isActive) {
      return { color: 'bg-yellow-500', pulse: 'animate-pulse', text: 'Monitoring' }
    } else {
      return { color: 'bg-gray-500', pulse: '', text: 'Standby' }
    }
  }

  const statusIndicator = getStatusIndicator()

  if (loading && !manualRefresh) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-bold text-white">🔥 Hot Odds & Lines</h3>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusIndicator.color} ${statusIndicator.pulse}`}></div>
          <h3 className="text-lg font-bold text-white">🔥 Hot Odds & Upcoming Lines</h3>
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={selectedSport}
            onChange={(e) => handleSportChange(e.target.value)}
            className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
          >
            {sports.map(sport => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
          
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded transition-colors disabled:opacity-50"
            title="Refresh odds data"
          >
            {loading ? '⟳' : '🔄'}
          </button>
        </div>
      </div>

      {/* Update Status */}
      <div className="text-xs text-gray-500 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className="text-blue-400">📊</span>
          {formatTimeUntilUpdate()}
        </span>
        {isOffPeak() && (
          <span className="text-yellow-400 flex items-center gap-1">
            <span>🌙</span>
            Off-peak - manual refresh
          </span>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
          <div className="text-red-400 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>Odds temporarily unavailable</span>
          </div>
          <button 
            onClick={handleManualRefresh}
            className="text-red-300 hover:text-red-200 text-xs mt-1 flex items-center gap-1"
          >
            <span>🔄</span>
            Retry connection →
          </button>
        </div>
      )}

      <div className="space-y-3">
        {liveOdds.length > 0 ? liveOdds.map((game, index) => (
          <div key={index} className="bg-gray-900 rounded-lg p-3 border border-gray-600 hover:border-green-500/30 transition-colors">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-white font-medium text-sm flex items-center gap-2">
                  <span className="text-green-400">⚡</span>
                  {game.away_team} @ {game.home_team}
                </div>
                <div className="text-gray-400 text-xs flex items-center gap-1">
                  <span>📅</span>
                  {new Date(game.commence_time).toLocaleDateString()} • 
                  <span className="text-blue-400">🕐</span>
                  {new Date(game.commence_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              
              <div className="flex gap-2 text-xs">
                {game.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h')?.outcomes?.map((outcome, i) => (
                  <div key={i} className="text-center bg-gray-800 px-2 py-1 rounded border border-gray-600 hover:border-green-400 transition-colors">
                    <div className="text-gray-400">{outcome.name.split(' ').pop()}</div>
                    <div className="text-green-400 font-bold">{outcome.price > 0 ? '+' : ''}{outcome.price}</div>
                  </div>
                )) || (
                  <div className="text-gray-500 text-xs flex items-center gap-1">
                    <span>⏳</span>
                    Lines loading...
                  </div>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-6 text-gray-400">
            <div className="text-4xl mb-2">🏈</div>
            <div className="text-lg font-medium text-white mb-1">No live odds available</div>
            <div className="text-sm mb-3">
              {selectedSport} season may be off-season or no games scheduled
            </div>
            <div className="text-xs text-gray-500 mb-3">
              Real-time data only - no mock data shown
            </div>
            <button 
              onClick={handleManualRefresh}
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm bg-gray-700 px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <span>🔄</span>
              Check for live games →
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <button className="text-green-400 hover:text-green-300 text-sm font-medium flex items-center justify-center gap-2 mx-auto bg-gray-700/50 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          <span>🤖</span>
          Generate AI Parlay with {selectedSport} →
        </button>
      </div>

      {/* Credit Conservation Notice */}
      <div className="mt-3 text-xs text-gray-500 text-center flex items-center justify-center gap-1">
        <span>💡</span>
        <span>Smart refresh: 30min peak hours, 60min business hours, manual off-peak</span>
      </div>
    </div>
  )
}

// Parlay Results Modal Component
function ParlayResultsModal({ parlay, isOpen, onClose }) {
  const [shareClicked, setShareClicked] = useState(false)
  const [downloadingImage, setDownloadingImage] = useState(false)
  const parlayCardRef = useRef(null)

  if (!isOpen || !parlay) return null

  const handleSaveImage = async () => {
    if (!parlayCardRef.current) return
    
    setDownloadingImage(true)
    try {
      // Import html2canvas dynamically since it's client-side only
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(parlayCardRef.current, {
        backgroundColor: '#111827', // gray-900
        scale: 2, // Higher quality
        logging: false,
        useCORS: true
      })
      
      // Create download link
      const link = document.createElement('a')
      link.download = `betgenius-parlay-${Date.now()}.png`
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
    const shareText = `🎯 Check out this BetGenius AI parlay!\n\n${parlay.parlay_details?.legs?.map(leg => `• ${leg.bet} (${leg.odds})`).join('\n') || 'AI Generated Parlay'}\n\nTotal Odds: ${parlay.parlay_details?.total_odds || 'TBD'}\nExpected Value: ${parlay.parlay_details?.expected_value || 'Calculated'}\n\nGenerated by BetGenius AI 🤖`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BetGenius AI Parlay',
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

  const getSportsbookIcon = (name) => {
    const icons = {
      'DraftKings': '👑',
      'FanDuel': '🔥', 
      'BetMGM': '🦁',
      'Caesars': '🏛️',
      'BetRivers': '🌊'
    }
    return icons[name] || '🎯'
  }

  const formatPayout = (stake, odds) => {
    const numericOdds = parseInt(odds.replace('+', '').replace('-', ''))
    const isPositive = odds.startsWith('+')
    
    if (isPositive) {
      return Math.round(stake * (numericOdds / 100))
    } else {
      return Math.round(stake / (numericOdds / 100))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Your AI Generated Parlay</h2>
              <p className="text-gray-400">Mathematical analysis complete</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Parlay Card - This will be captured for image */}
          <div 
            ref={parlayCardRef} 
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {/* Parlay Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 font-bold text-lg">BetGenius AI</span>
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-medium">
                    {parlay.parlay_details?.risk_level?.toUpperCase() || 'ANALYSIS'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {parlay.parlay_details?.leg_count || parlay.parlay_details?.legs?.length || 0}-Leg {parlay.parlay_details?.sport || 'Multi-Sport'} Parlay
                </h3>
                <p className="text-gray-400">{parlay.ev_analysis?.risk_assessment || 'AI-powered mathematical analysis'}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-green-400">{parlay.parlay_details?.total_odds || '+450'}</div>
                <div className="text-sm text-gray-400">{parlay.parlay_details?.implied_probability || '18.2%'} implied</div>
              </div>
            </div>

            {/* Parlay Legs */}
            <div className="space-y-3 mb-6">
              {(parlay.parlay_details?.legs || []).map((leg, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {leg.sport || 'Sport'}
                        </span>
                        <span className="text-xs text-gray-400">{leg.bet_type || 'Bet'}</span>
                      </div>
                      <h4 className="font-semibold text-white mb-1">{leg.game || 'Game'}</h4>
                      <p className="text-green-400 font-medium">{leg.bet || 'Bet Description'}</p>
                      {leg.ev_justification && (
                        <p className="text-gray-400 text-sm mt-1">{leg.ev_justification}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-white">{leg.odds || '+100'}</div>
                      <div className="text-sm text-gray-400">{leg.confidence || 65}% confidence</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* EV Analysis */}
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <h4 className="font-semibold text-green-400">Expected Value Analysis</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Mathematical Edge:</span>
                  <div className="text-green-400 font-bold">{parlay.ev_analysis?.mathematical_edge || '+8.2% expected value'}</div>
                </div>
                <div>
                  <span className="text-gray-400">Recommended Stake:</span>
                  <div className="text-white font-bold">{parlay.parlay_details?.recommended_stake || '$25'}</div>
                </div>
              </div>
              <p className="text-green-300 text-sm mt-2">{parlay.ev_analysis?.market_inefficiencies || 'Market inefficiencies identified across selected legs.'}</p>
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 text-sm">
              Generated by BetGenius AI • {new Date().toLocaleDateString()} • Mathematical Analysis Tool
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleSaveImage}
              disabled={downloadingImage}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {downloadingImage ? 'Generating...' : 'Save Image'}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              {shareClicked ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              {shareClicked ? 'Copied!' : 'Share Parlay'}
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Generate Another
            </button>
          </div>

          {/* Top 3 Sportsbooks */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              Best Places to Bet This Parlay
            </h3>
            
            {parlay.sportsbook_recommendations?.best_payouts ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {parlay.sportsbook_recommendations.best_payouts.slice(0, 3).map((book, index) => (
                  <div 
                    key={index} 
                    className={`relative bg-gray-900 rounded-lg p-4 border transition-all hover:shadow-lg cursor-pointer ${
                      index === 0 ? 'border-yellow-500 bg-yellow-500/5' : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                        BEST
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">{getSportsbookIcon(book.sportsbook)}</div>
                      <div>
                        <h4 className="font-bold text-white">{book.sportsbook}</h4>
                        <p className="text-sm text-gray-400">{book.why_best}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">$100 Bet Pays:</span>
                        <span className="font-bold text-green-400">
                          ${formatPayout(100, parlay.parlay_details?.total_odds || '+450')}
                        </span>
                      </div>
                      <div className="text-xs text-blue-400 font-medium">
                        🎁 {book.signup_bonus}
                      </div>
                    </div>

                    <button className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                      <span>Bet Now</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">Live sportsbook comparison coming soon!</div>
                <p className="text-sm text-gray-500">Real-time payout comparison across all major sportsbooks</p>
              </div>
            )}

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                💡 <strong>Pro Tip:</strong> Always compare odds across multiple books to maximize your potential payout
              </p>
            </div>
          </div>

          {/* Strategy Notes */}
          {parlay.strategy_notes && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-3">Strategy Notes</h3>
              <ul className="space-y-2">
                {parlay.strategy_notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
      // Convert to base64 (matching your API)
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const response = await fetch('/api/analyze-slip', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: e.target.result
            }),
          })

          if (!response.ok) {
            throw new Error('Analysis failed')
          }

          const result = await response.json()
          
          if (result.success) {
            onAnalysis(result.analysis)
          } else {
            alert(result.message || 'Analysis failed')
          }
        } catch (error) {
          console.error('Analysis error:', error)
          alert('Analysis failed. Please try again.')
        } finally {
          setAnalyzing(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('File processing error:', error)
      alert('Failed to process image')
      setAnalyzing(false)
    }
  }

  const canUpload = isPremium || uploadsToday < maxUploads

  return (
    <div className="mb-8">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragActive
            ? 'border-green-500 bg-gray-700'
            : canUpload
            ? 'border-gray-600 hover:border-green-500 bg-gray-800'
            : 'border-gray-700 bg-gray-900'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {analyzing ? (
          <div className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Analyzing Your Bet Slip</h3>
            <p className="text-gray-300">AI is processing your image...</p>
          </div>
        ) : (
          <>
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-white mb-2">Upload Your Bet Slip</h3>
            <p className="text-gray-300 mb-4">
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

function ParlayGenerator({ onGeneration, generationsToday, maxGenerations, isPremium, preSelectedSport = 'NFL' }) {
  const [generating, setGenerating] = useState(false)
  const [selectedSport, setSelectedSport] = useState(preSelectedSport)
  const [selectedRisk, setSelectedRisk] = useState('moderate')

  // Update selected sport when preSelectedSport changes
  useEffect(() => {
    setSelectedSport(preSelectedSport)
  }, [preSelectedSport])

  const sports = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'MMA', 'UFC', 'Soccer', 'Tennis', 'Golf', 'Boxing', 'Formula 1', 'NASCAR', 'Esports', 'Mixed']
  
  const riskLevels = [
    { 
      id: 'safe', 
      name: 'Safe', 
      icon: Shield,
      color: 'text-green-400', 
      borderColor: 'border-green-500',
      bgColor: 'bg-green-500/20',
      description: 'Lower risk, steady returns',
      details: '2-3 legs • 60-75% probability'
    },
    { 
      id: 'moderate', 
      name: 'Moderate', 
      icon: Target,
      color: 'text-yellow-400', 
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-500/20',
      description: 'Balanced risk/reward',
      details: '3-4 legs • 40-60% probability'
    },
    { 
      id: 'risky', 
      name: 'Risky', 
      icon: Zap,
      color: 'text-red-400', 
      borderColor: 'border-red-500',
      bgColor: 'bg-red-500/20',
      description: 'High risk, high reward',
      details: '4-6 legs • 15-40% probability'
    }
  ]

  const generateParlay = async () => {
    if (!isPremium && generationsToday >= maxGenerations) {
      alert('Daily generation limit reached. Upgrade to Premium for unlimited generations!')
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
          sport: selectedSport,
          riskLevel: selectedRisk
        }),
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const result = await response.json()
      
      if (result.success) {
        onGeneration(result.parlay)
      } else {
        alert(result.message || 'Generation failed')
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert('Parlay generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = isPremium || generationsToday < maxGenerations

  return (
    <div className="mb-8 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Select Sport</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`p-3 rounded-lg border font-medium transition-all ${
                selectedSport === sport
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-gray-600 hover:border-gray-500 text-gray-300 bg-gray-800'
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
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${selectedRisk === level.id ? 'text-green-400' : level.color}`} />
                  <div className={`font-bold text-lg ${selectedRisk === level.id ? 'text-green-400' : level.color}`}>
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
        disabled={generating || !canGenerate}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
          generating || !canGenerate
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
        }`}
      >
        {generating ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Generating AI Parlay...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Brain className="w-5 h-5" />
            Generate AI Parlay
          </div>
        )}
      </button>

      {!canGenerate && (
        <p className="text-red-400 mt-2 text-sm text-center">Generation limit reached for today</p>
      )}
    </div>
  )
}

function AnalysisResults({ analysis }) {
  if (!analysis) return null

  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-8 border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
        <BarChart3 className="w-6 h-6 text-green-500" />
        Analysis Results
      </h3>
      
      {analysis.bet_slip_details && (
        <div className="mb-6">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-600 mb-4">
            <h4 className="font-semibold text-white mb-2">Bet Slip Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Sportsbook:</span>
                <div className="text-white font-medium">{analysis.bet_slip_details.sportsbook || 'Not detected'}</div>
              </div>
              <div>
                <span className="text-gray-400">Bet Type:</span>
                <div className="text-white font-medium">{analysis.bet_slip_details.bet_type || 'Unknown'}</div>
              </div>
              <div>
                <span className="text-gray-400">Total Stake:</span>
                <div className="text-white font-medium">{analysis.bet_slip_details.total_stake || 'Not visible'}</div>
              </div>
              <div>
                <span className="text-gray-400">Potential Payout:</span>
                <div className="text-white font-medium">{analysis.bet_slip_details.potential_payout || 'Not visible'}</div>
              </div>
            </div>
          </div>

          {analysis.bet_slip_details.extracted_bets && analysis.bet_slip_details.extracted_bets.length > 0 && (
            <div className="space-y-3 mb-4">
              <h5 className="font-semibold text-white">Extracted Bets:</h5>
              {analysis.bet_slip_details.extracted_bets.map((bet, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-3 border border-gray-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-medium">{bet.away_team} @ {bet.home_team}</div>
                      <div className="text-green-400">{bet.bet_selection}</div>
                      {bet.line && <div className="text-gray-400 text-sm">Line: {bet.line}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{bet.odds}</div>
                      {bet.stake && <div className="text-gray-400 text-sm">{bet.stake}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {analysis.sportsbook_comparison && analysis.sportsbook_comparison.available && (
        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30 mb-4">
          <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Better Odds Found!
          </h4>
          
          <div className="mb-3">
            <div className="text-green-300 font-bold text-lg">
              {analysis.sportsbook_comparison.summary.total_potential_savings} in potential savings
            </div>
            <div className="text-green-200 text-sm">
              {analysis.sportsbook_comparison.summary.recommendation}
            </div>
          </div>

          {analysis.sportsbook_comparison.comparisons && (
            <div className="space-y-3">
              {analysis.sportsbook_comparison.comparisons.slice(0, 3).map((comparison, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-3">
                  <div className="text-white font-medium mb-1">{comparison.bet_description}</div>
                  <div className="text-gray-400 text-sm mb-2">
                    Current: {comparison.original_odds} → Best available: {comparison.better_options[0]?.odds || 'N/A'}
                  </div>
                  {comparison.better_options && comparison.better_options.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {comparison.better_options.slice(0, 2).map((option, i) => (
                        <span key={i} className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                          {option.sportsbook}: {option.odds} ({option.improvement})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {analysis.optimization && analysis.optimization.length > 0 && (
        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
          <h4 className="font-semibold text-blue-400 mb-2">Optimization Tips</h4>
          <ul className="space-y-1">
            {analysis.optimization.map((tip, index) => (
              <li key={index} className="text-blue-300 text-sm flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(!analysis.bet_slip_details && !analysis.sportsbook_comparison) && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            {analysis.message || 'Analysis complete - no specific recommendations at this time'}
          </div>
          {analysis.optimization_tips && (
            <div className="text-sm text-gray-500">
              {analysis.optimization_tips.join(' • ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ParlayResults({ parlay }) {
  if (!parlay) return null

  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-8 border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
        <Brain className="w-6 h-6 text-green-500" />
        Generated Parlay
      </h3>
      
      {parlay.picks && parlay.picks.length > 0 ? (
        <div className="space-y-4">
          {parlay.picks.map((pick, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-white">{pick.match || pick.game}</h4>
                <span className="text-sm text-gray-400">{pick.sport}</span>
              </div>
              <div className="text-green-400 font-medium mb-1">{pick.pick}</div>
              <p className="text-gray-300 text-sm">{pick.reasoning}</p>
              {pick.odds && <p className="text-sm mt-1 text-gray-400"><strong>Odds:</strong> {pick.odds}</p>}
              {pick.confidence && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Confidence:</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${pick.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-green-400">{pick.confidence}%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {parlay.summary && (
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30 mt-4">
              <h4 className="font-semibold text-green-400 mb-2">Parlay Summary</h4>
              <p className="text-green-300 text-sm">{parlay.summary}</p>
              {parlay.totalOdds && (
                <p className="text-green-400 font-semibold mt-2">
                  Combined Odds: {parlay.totalOdds}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-green-400 mb-2">🎯 Parlay Generated</div>
          <p className="text-gray-300">
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
      <p className="text-gray-300 mb-4">
        Enter the access code that was sent to your email when you purchased Premium.
      </p>
      <input
        type="text"
        value={accessCode}
        onChange={(e) => setAccessCode(e.target.value)}
        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4 bg-gray-800 text-white"
        placeholder="Enter your access code"
      />
      <button
        onClick={handleRestore}
        disabled={restoring}
        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
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
  const [selectedSport, setSelectedSport] = useState('NFL')
  const [showParlayModal, setShowParlayModal] = useState(false)

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
    setShowParlayModal(true) // Show the modal immediately
    if (!isPremium && typeof window !== 'undefined') {
      const newCount = generationsToday + 1
      setGenerationsToday(newCount)
      localStorage.setItem('generationsToday', newCount.toString())
    }
  }

  const handleUpgrade = async () => {
    if (!userEmail) {
      setShowEmailInput(true)
      return
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>BetGenius - AI-Powered Sports Betting Analysis & Best Odds Finder</title>
        <meta name="description" content="Professional AI parlay calculator with live odds comparison. Upload bet slips for mathematical insights, parlay optimization, and find the best sportsbook payouts. NFL, NBA, NHL, MLB coverage." />
        <meta name="keywords" content="AI parlay calculator, sports betting analysis, parlay optimizer, bet slip analyzer, best odds finder, NFL betting, NBA betting, sports betting strategy, mathematical betting analysis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://betgenius.com/" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://betgenius.com/" />
        <meta property="og:title" content="BetGenius - AI Sports Betting Analysis & Best Odds Finder" />
        <meta property="og:description" content="Professional AI parlay calculator with live odds comparison and best sportsbook finder. Upload bet slips for optimization insights." />
        <meta property="og:image" content="https://betgenius.com/og-image.jpg" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://betgenius.com/" />
        <meta name="twitter:title" content="BetGenius - AI Sports Betting Analysis" />
        <meta name="twitter:description" content="Professional AI parlay calculator with mathematical analysis and best odds finder." />
      </Head>

      <div className="min-h-screen bg-gray-900">
        {/* Header - bet365 style */}
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
          <nav className="container mx-auto px-4 flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-green-500">
              BetGenius
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-300 hover:text-green-400 font-medium transition-colors">Features</a>
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
          </nav>
        </header>

        {/* Hero - Dark theme */}
        <section className="bg-gradient-to-br from-gray-800 to-gray-900 text-white py-20 border-b border-gray-700">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
              AI-Powered Sports Betting Analysis
            </h1>
            <p className="text-xl md:text-2xl mb-3 opacity-95 text-green-400">
              Mathematical Optimization for Smarter Betting Decisions
            </p>
            <p className="text-lg md:text-xl opacity-85 max-w-2xl mx-auto mb-8 text-gray-300">
              Professional-grade analysis using advanced AI mathematics. Upload your bet slips for strategic insights, optimization recommendations, and find the best sportsbook payouts.
            </p>
            <a href="#app" className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-green-700 transition-all hover:-translate-y-1">
              <span>Start Analyzing</span>
              <Activity className="w-5 h-5" />
            </a>
          </div>
        </section>

        {/* Live Odds - POSITIONED RIGHT UNDER HERO */}
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <LiveOddsDisplay />
          </div>
        </section>

        {/* Main App - Dark container */}
        <main className="container mx-auto px-4" id="app">
          <div className="bg-gray-800 mx-auto max-w-6xl rounded-xl shadow-2xl overflow-hidden relative z-10 border border-gray-700">
            {/* Tabs - bet365 style */}
            <div className="flex border-b border-gray-700">
              <button
                className={`flex-1 py-5 px-6 font-semibold border-b-3 transition-all ${
                  activeTab === 'optimize'
                  ? 'text-green-400 border-green-500 bg-gray-700'
                  : 'text-gray-400 border-transparent hover:text-green-400 hover:bg-gray-750'
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
                  ? 'text-green-400 border-green-500 bg-gray-700'
                  : 'text-gray-400 border-transparent hover:text-green-400 hover:bg-gray-750'
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
                  {/* Usage Limits - Dark theme */}
                  <div className={`flex gap-5 mb-8 p-5 rounded-lg border-l-4 ${
                    isPremium
                      ? 'bg-yellow-500/10 border-yellow-500'
                      : 'bg-green-500/10 border-green-500'
                  }`}>
                    {isPremium ? (
                      <div className="flex items-center gap-3 flex-1">
                        <Crown className="w-6 h-6 text-yellow-400" />
                        <div>
                          <div className="font-semibold text-yellow-400">Premium Member</div>
                          <div className="text-sm text-gray-300">Unlimited uploads and generations</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 text-center">
                          <span className="block text-2xl font-bold text-green-400">2</span>
                          <span className="text-sm text-gray-300 font-medium">Free Daily Uploads</span>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="block text-2xl font-bold text-green-400">{uploadsToday}</span>
                          <span className="text-sm text-gray-300 font-medium">Used Today</span>
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
                  {/* Usage Limits - Dark theme */}
                  <div className={`flex gap-5 mb-8 p-5 rounded-lg border-l-4 ${
                    isPremium
                      ? 'bg-yellow-500/10 border-yellow-500'
                      : 'bg-green-500/10 border-green-500'
                  }`}>
                    {isPremium ? (
                      <div className="flex items-center gap-3 flex-1">
                        <Crown className="w-6 h-6 text-yellow-400" />
                        <div>
                          <div className="font-semibold text-yellow-400">Premium Member</div>
                          <div className="text-sm text-gray-300">Unlimited uploads and generations</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 text-center">
                          <span className="block text-2xl font-bold text-green-400">1</span>
                          <span className="text-sm text-gray-300 font-medium">Free Daily Generation</span>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="block text-2xl font-bold text-green-400">{generationsToday}</span>
                          <span className="text-sm text-gray-300 font-medium">Used Today</span>
                        </div>
                      </>
                    )}
                  </div>

                  <ParlayGenerator
                    onGeneration={handleGeneration}
                    generationsToday={generationsToday}
                    maxGenerations={1}
                    isPremium={isPremium}
                    preSelectedSport={selectedSport}
                  />

                  <ParlayResults parlay={generatedParlay} />
                </div>
              )}
            </div>
          </div>

          {/* Pricing Section - Dark theme */}
          {!isPremium && (
            <section id="pricing" className="py-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
                <p className="text-lg text-gray-300">Choose the plan that works for you</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Free Plan */}
                <div className="bg-gray-800 p-8 rounded-xl border-2 border-gray-700">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2 text-white">Free</h3>
                    <div className="text-4xl font-black text-white">$0</div>
                    <div className="text-gray-400">forever</div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">2 daily bet slip uploads</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">1 daily AI parlay generation</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Basic optimization analysis</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">5 sports coverage</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300"><strong>Best sportsbook finder</strong></span>
                    </li>
                  </ul>
                  <button className="w-full py-3 border-2 border-gray-600 text-gray-300 rounded-lg font-semibold hover:border-gray-500 transition-colors">
                    Current Plan
                  </button>
                </div>

                {/* Premium Plan */}
                <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-8 rounded-xl relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                      POPULAR
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">Premium</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-4xl font-black">$6.99</div>
                        <div className="opacity-80">per month</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-200">or $49.99/year</div>
                        <div className="text-sm opacity-80">(Save $34 annually!)</div>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-200" />
                      <span>Unlimited bet slip uploads</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-200" />
                      <span>Unlimited AI parlay generation</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-200" />
                      <span>Advanced mathematical analysis</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-200" />
                      <span>Priority AI processing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-200" />
                      <span>Detailed risk assessment</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-200" />
                      <span><strong>Best sportsbook finder</strong></span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-200" />
                      <span>Premium support</span>
                    </li>
                  </ul>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="w-full py-3 bg-white text-green-700 rounded-lg font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {upgrading ? 'Processing...' : 'Upgrade Now'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Features Section - Dark theme */}
          <section id="features" className="py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Professional Betting Analysis Tools</h2>
              <p className="text-lg text-gray-300">Advanced AI technology for smarter betting decisions</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="bg-gray-800 p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow border border-gray-700">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold mb-3 text-white">Best Sportsbook Finder</h3>
                <p className="text-gray-300">Compare odds across multiple sportsbooks and find the best payouts for your exact bets. Maximize your winnings with our line shopping tool.</p>
              </div>

              <div className="bg-gray-800 p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow border border-gray-700">
                <Brain className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold mb-3 text-white">Advanced Mathematical Analysis</h3>
                <p className="text-gray-300">AI-powered mathematical models analyze probability distributions, expected values, and risk-adjusted returns for optimal betting strategies.</p>
              </div>

              <div className="bg-gray-800 p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow border border-gray-700">
                <Target className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold mb-3 text-white">Multi-Sport Coverage</h3>
                <p className="text-gray-300">Comprehensive analysis across NFL, NBA, NHL, MLB, and MMA with sport-specific statistical models and betting patterns.</p>
              </div>

              <div className="bg-gray-800 p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow border border-gray-700">
                <Shield className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold mb-3 text-white">Risk Assessment</h3>
                <p className="text-gray-300">Sophisticated risk modeling with variance analysis, bankroll management recommendations, and probability-weighted outcomes.</p>
              </div>
            </div>
          </section>

          {/* Important Disclaimer - Dark theme */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 my-16 max-w-4xl mx-auto">
            <h3 className="flex items-center gap-2 text-yellow-400 font-bold mb-3">
              <Target className="w-6 h-6" />
              Important Disclaimer
            </h3>
            <p className="text-yellow-300 text-sm leading-relaxed">
              <strong>Educational Tool Only:</strong> BetGenius provides mathematical analysis and educational insights for sports betting research. We make no guarantees, promises, or warranties regarding winning outcomes, profitability, or investment success. All betting involves risk of loss. Past performance does not indicate future results. Users are solely responsible for their betting decisions and financial outcomes. This tool is intended for educational and entertainment purposes only. Please bet responsibly and within your means.
            </p>
          </div>
        </main>

        {/* Footer - Dark theme */}
        <footer className="bg-black text-gray-400 py-16 border-t border-gray-800">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-10 mb-10">
              <div>
                <h4 className="text-green-400 font-bold mb-4">BetGenius</h4>
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
                  <li>
                    <button 
                      onClick={() => {
                        setActiveTab('generate')
                        setSelectedSport('NFL')
                        document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="text-gray-400 hover:text-green-400 transition-colors text-left"
                    >
                      NFL Analysis
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {
                        setActiveTab('generate')
                        setSelectedSport('NBA')
                        document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="text-gray-400 hover:text-green-400 transition-colors text-left"
                    >
                      NBA Analysis
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {
                        setActiveTab('generate')
                        setSelectedSport('NHL')
                        document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="text-gray-400 hover:text-green-400 transition-colors text-left"
                    >
                      NHL Analysis
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {
                        setActiveTab('generate')
                        setSelectedSport('MLB')
                        document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="text-gray-400 hover:text-green-400 transition-colors text-left"
                    >
                      MLB Analysis
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {
                        setActiveTab('generate')
                        setSelectedSport('MMA')
                        document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="text-gray-400 hover:text-green-400 transition-colors text-left"
                    >
                      MMA Analysis
                    </button>
                  </li>
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

            <div className="text-center pt-5 border-t border-gray-800 text-sm">
              <p>&copy; 2024 BetGenius. All rights reserved. • Educational analysis tool only • No guarantees of profits or winnings</p>
            </div>
          </div>
        </footer>

        {/* Restore Premium Modal - Dark theme */}
        {showRestore && !isPremium && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Restore Premium Access</h2>
                <button onClick={() => setShowRestore(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <PremiumRestore />
              </div>
            </div>
          </div>
        )}

        {/* Email Input Modal - Dark theme */}
        {showEmailInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Enter Your Email</h2>
                <button onClick={() => setShowEmailInput(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-gray-300 mb-4">We'll send your access code to this email for future premium restoration.</p>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4 bg-gray-900 text-white"
                  placeholder="Enter your email address"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEmailInput(false)}
                    className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowEmailInput(false)
                      handleUpgrade()
                    }}
                    disabled={!userEmail || upgrading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Parlay Results Modal */}
        <ParlayResultsModal 
          parlay={generatedParlay}
          isOpen={showParlayModal}
          onClose={() => setShowParlayModal(false)}
        />
      </div>
    </>
  )
}