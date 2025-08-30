import { useState, useEffect, useRef, useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  User, 
  Camera,
  Edit3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Trophy,
  AlertCircle,
  Plus,
  Minus,
  Activity,
  Zap,
  Brain,
  LineChart,
  Settings,
  Upload
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import { useAuth } from '../contexts/AuthContext';
import BankrollChart from '../components/profile/BankrollChart';
import BetHistoryTable from '../components/profile/BetHistoryTable';
import PerformanceCharts from '../components/profile/PerformanceCharts';
import WeeklyAIReport from '../components/profile/WeeklyAIReport';
import ProfileService from '../lib/services/profileService';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = useContext(PremiumContext);
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  // Profile State
  const [profileImage, setProfileImage] = useState(null);
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Bankroll State
  const [bankroll, setBankroll] = useState({
    current: 0,
    deposits: [],
    withdrawals: [],
    history: []
  });
  
  // Bet History State
  const [bets, setBets] = useState([]);
  const [newBet, setNewBet] = useState({
    sport: '',
    teams: '',
    betType: '',
    odds: '',
    stake: '',
    sportsbook: '',
    status: 'pending'
  });
  
  // Analytics State
  const [analytics, setAnalytics] = useState({
    totalBets: 0,
    winRate: 0,
    roi: 0,
    totalProfit: 0,
    avgStake: 0,
    clvAvg: 0,
    favoriteMarket: 'Moneyline',
    favoriteSportsbook: 'DraftKings'
  });
  
  // Premium/Subscription State
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  // UI State
  const [showAddBet, setShowAddBet] = useState(false);
  const [showBankrollActions, setShowBankrollActions] = useState(false);
  const [showUploadSlip, setShowUploadSlip] = useState(false);
  const [uploadedSlip, setUploadedSlip] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const slipInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }
    
    if (user) {
      loadUserData();
    }
  }, [user, authLoading]);

  // Load subscription status separately (non-blocking)
  useEffect(() => {
    if (user) {
      loadSubscriptionStatus();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      console.log('🔄 Dashboard: Starting loadUserData for user:', user.id);
      setLoading(true);
      
      console.log('🔄 Dashboard: Calling ProfileService.getUserProfile...');
      const startTime = Date.now();
      const profileData = await ProfileService.getUserProfile(user.id);
      const endTime = Date.now();
      console.log(`✅ Dashboard: ProfileService completed in ${endTime - startTime}ms`);
      
      if (profileData) {
        console.log('🔄 Dashboard: Processing profile data...');
        setBio(profileData.bio || '');
        setProfileImage(profileData.profileImage || null);
        setBankroll(profileData.bankroll || {
          current: 0,
          deposits: [],
          withdrawals: [],
          history: []
        });
        setBets(profileData.bets || []);
        
        console.log('🔄 Dashboard: Calculating analytics...');
        calculateAnalytics(profileData.bets || []);
        
        console.log('✅ Dashboard: Profile loaded from:', profileData.source);
      }
      
      console.log('✅ Dashboard: loadUserData completed successfully');
      
    } catch (error) {
      console.error('❌ Dashboard: Error in loadUserData:', error);
    } finally {
      console.log('🔄 Dashboard: Setting loading to false');
      setLoading(false);
    }
  };

  // Load subscription status (non-blocking)
  const loadSubscriptionStatus = async () => {
    try {
      console.log('🔄 Dashboard: Loading subscription status...');
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/subscription/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const subscription = data.subscription || { subscription_status: 'none', has_premium_access: false };
        // Check if user has premium access based on subscription_status from Supabase
        setIsPremiumUser(subscription.has_premium_access || subscription.subscription_status === 'active' || subscription.subscription_status === 'trialing');
      } else {
        // If API fails, default to free user
        setIsPremiumUser(false);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Dashboard: Subscription API timed out (5s)');
      } else {
        console.error('❌ Dashboard: Error loading subscription status:', error);
      }
      // If subscription loading fails, default to free user (dashboard still works)
      setIsPremiumUser(false);
    } finally {
      console.log('✅ Dashboard: Subscription loading completed');
      setSubscriptionLoading(false);
    }
  };

  const calculateAnalytics = (betsData) => {
    if (!betsData.length) return;
    
    const settled = betsData.filter(bet => bet.result !== 'pending');
    const won = settled.filter(bet => bet.result === 'won');
    const totalStaked = settled.reduce((sum, bet) => sum + bet.stake, 0);
    const totalProfit = settled.reduce((sum, bet) => sum + bet.profit, 0);
    
    setAnalytics({
      totalBets: betsData.length,
      winRate: settled.length ? (won.length / settled.length * 100) : 0,
      roi: totalStaked ? (totalProfit / totalStaked * 100) : 0,
      totalProfit,
      avgStake: settled.length ? totalStaked / settled.length : 0,
      clvAvg: 2.3, // Sample CLV
      favoriteMarket: 'Moneyline',
      favoriteSportsbook: 'DraftKings'
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      try {
        // Upload to Supabase Storage (with base64 fallback)
        const uploadResult = await ProfileService.uploadProfileImage(user.id, file);
        
        if (uploadResult.success) {
          setProfileImage(uploadResult.url);
          await saveUserData({ profileImage: uploadResult.url });
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleBioSave = async () => {
    if (bio.split(' ').length > 50) {
      alert('Bio must be 50 words or less');
      return;
    }
    setIsEditingBio(false);
    await saveUserData({ bio });
  };

  const handleSlipUpload = async (file) => {
    if (!file) {
      console.error('No file provided for upload');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Extract base64 from data URL (remove data:image/jpeg;base64, prefix)
      const base64String = base64Data.split(',')[1] || base64Data;
      
      // Analyze the slip using the API
      const response = await fetch('/api/analyze-slip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64String,
          userIdentifier: user?.id || 'anonymous'
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.analysis) {
        // Convert analysis result to bet format and add to tracking  
        const parsedBets = parseSlipAnalysisIntoBets(result.analysis);
        
        if (parsedBets.length > 0) {
          // Add each bet to the user's tracking
          for (const bet of parsedBets) {
            const newBet = {
              id: Date.now() + Math.random(),
              date: new Date().toISOString().split('T')[0],
              sport: bet.sport || 'Unknown',
              market: bet.market || 'Unknown',
              selection: bet.selection || 'Unknown bet',
              odds: bet.odds || '+100',
              stake: bet.stake || 0,
              result: 'pending',
              payout: 0,
              profit: 0,
              sportsbook: bet.sportsbook || 'Unknown',
              source: 'slip_upload',
              metadata: {
                originalAnalysis: result.analysis,
                uploadedAt: new Date().toISOString()
              }
            };
            
            setBets(prev => [newBet, ...prev]);
          }
        } else {
          alert('No bets could be extracted from the slip. Please try again or add bets manually.');
          setShowUploadSlip(false);
          setIsAnalyzing(false);
          return;
        }
        
        calculateAnalytics([...bets, ...parsedBets]);
        await saveUserData({ bets: [...bets, ...parsedBets] });
        
        setShowUploadSlip(false);
        
        // Show success message
        alert(`Successfully added ${parsedBets.length} bet(s) to your tracking!`);
      } else {
        console.error('API response:', result);
        alert(`Failed to analyze slip: ${result.message || 'Unknown error'}. Please try again.`);
      }
    } catch (error) {
      console.error('Error analyzing slip:', error);
      alert(`Error analyzing slip: ${error.message || 'Network or processing error'}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseSlipAnalysisIntoBets = (analysis) => {
    const bets = [];
    
    // The API returns analysis.bet_slip_details.extracted_bets
    const extractedBets = analysis?.bet_slip_details?.extracted_bets || [];
    const sportsbook = analysis?.bet_slip_details?.sportsbook || 'Unknown';
    const totalStake = analysis?.bet_slip_details?.total_stake || 0;
    
    if (extractedBets && Array.isArray(extractedBets)) {
      extractedBets.forEach((bet, index) => {
        // Parse stake from string like "$50" to number
        const parseStake = (stakeStr) => {
          if (typeof stakeStr === 'number') return stakeStr;
          if (typeof stakeStr === 'string') {
            const match = stakeStr.match(/[\d\.]+/);
            return match ? parseFloat(match[0]) : 0;
          }
          return 0;
        };
        
        bets.push({
          sport: bet.sport || detectSportFromTeams(bet.home_team, bet.away_team),
          market: bet.bet_type || 'Unknown',
          selection: bet.bet_selection || `${bet.home_team || bet.away_team || 'Unknown'} bet`,
          odds: bet.odds || '+100',
          stake: parseStake(bet.stake) || (totalStake ? totalStake / extractedBets.length : 0),
          sportsbook: sportsbook
        });
      });
    }
    
    return bets;
  };
  
  const detectSportFromTeams = (homeTeam, awayTeam) => {
    // Simple sport detection based on common team names
    const teams = `${homeTeam} ${awayTeam}`.toLowerCase();
    if (teams.includes('lakers') || teams.includes('warriors') || teams.includes('celtics')) return 'NBA';
    if (teams.includes('chiefs') || teams.includes('patriots') || teams.includes('cowboys')) return 'NFL';
    if (teams.includes('yankees') || teams.includes('dodgers') || teams.includes('red sox')) return 'MLB';
    if (teams.includes('rangers') || teams.includes('bruins') || teams.includes('kings')) return 'NHL';
    return 'Unknown';
  };

  const exportBettingData = async () => {
    if (!user) {
      alert('Please sign in to export data');
      return;
    }

    try {
      // Option 1: Download as JSON
      const dataToExport = {
        bets,
        analytics,
        bankroll,
        exportedAt: new Date().toISOString(),
        summary: {
          totalBets: bets.length,
          settledBets: bets.filter(b => b.result !== 'pending').length,
          totalProfit: bets.reduce((sum, b) => sum + (b.profit || 0), 0),
          totalStaked: bets.reduce((sum, b) => sum + (b.stake || 0), 0)
        }
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `betting-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      alert('Betting data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  const handleBankrollAction = async (type, amount, description) => {
    const transaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type,
      amount: parseFloat(amount),
      description,
      balance: type === 'deposit' ? bankroll.current + parseFloat(amount) : bankroll.current - parseFloat(amount)
    };

    const newBankroll = {
      ...bankroll,
      current: transaction.balance,
      [type === 'deposit' ? 'deposits' : 'withdrawals']: [
        ...bankroll[type === 'deposit' ? 'deposits' : 'withdrawals'],
        transaction
      ],
      history: [...bankroll.history, {
        date: transaction.date,
        balance: transaction.balance,
        change: type === 'deposit' ? parseFloat(amount) : -parseFloat(amount)
      }]
    };

    setBankroll(newBankroll);
    await saveUserData({ bankroll: newBankroll });
    setShowBankrollActions(false);
  };

  const addBet = async () => {
    if (!newBet.teams || !newBet.odds || !newBet.stake) return;

    const bet = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...newBet,
      stake: parseFloat(newBet.stake),
      source: 'manual'
    };

    const updatedBets = [...bets, bet];
    setBets(updatedBets);
    calculateAnalytics(updatedBets);
    await saveUserData({ bets: updatedBets });
    
    setNewBet({
      sport: '',
      teams: '',
      betType: '',
      odds: '',
      stake: '',
      sportsbook: '',
      status: 'pending'
    });
    setShowAddBet(false);
  };

  const saveUserData = async (updates) => {
    try {
      // Get current profile data
      const currentData = localStorage.getItem(`user_profile_${user.id}`);
      const data = currentData ? JSON.parse(currentData) : {};
      
      const updatedData = {
        ...data,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      // Save to both Supabase and localStorage via ProfileService
      await ProfileService.saveUserProfile(user.id, {
        profileImage: updatedData.profileImage,
        bio: updatedData.bio,
        bankroll: updatedData.bankroll,
        bets: updatedData.bets,
        settings: updatedData.settings,
        lastAIReport: updatedData.lastAIReport
      });
      
      console.log('User data saved successfully');
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>Dashboard - BetChekr</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <GradientBG />
        <Header />
        <div className="container mx-auto px-4 pt-4 sm:pt-20 pb-8 relative z-10">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  // Check if user has any content to display
  const hasContent = bets.length > 0 || bankroll.current > 0 || analytics.totalBets > 0;

  return (
    <div className="text-white relative">
      <Head>
        <title>Dashboard - BetChekr</title>
        <meta name="description" content="Your personal betting dashboard and performance tracker" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <GradientBG />
      <Header />
      
      <div className="container mx-auto px-4 pt-4 sm:pt-20 pb-8 relative z-10">
        {!hasContent ? (
          /* Placeholder when no content */
          <div className="flex items-center justify-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center max-w-md mx-auto"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to your Dashboard</h2>
              <p className="text-white/70 mb-6">Start tracking your bets and manage your bankroll to see your performance analytics.</p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowAddBet(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Bet
                </button>
                <button
                  onClick={() => setShowBankrollActions(true)}
                  className="w-full bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Set Initial Bankroll
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <div 
                className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
                <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1 rounded-full">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Bettor'}
                </h1>
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                  Pro Bettor
                </span>
              </div>
              
              <p className="text-blue-200 mb-4">{user.email}</p>
              
              {/* Bio Section */}
              <div className="mb-4">
                {isEditingBio ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about your betting style... (max 50 words)"
                      className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 resize-none"
                      rows={3}
                      maxLength={300}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBioSave}
                        className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingBio(false)}
                        className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <span className="text-white/60 text-sm">
                        {bio.split(' ').length}/50 words
                      </span>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => setIsEditingBio(true)}
                  >
                    <p className="text-white/80">
                      {bio || "Click to add a bio about your betting style..."}
                    </p>
                    <Edit3 className="w-4 h-4 text-white/60 group-hover:text-white/80" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          
          {/* Premium Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 cursor-pointer hover:bg-white/15 transition-colors"
            onClick={() => !isPremiumUser && router.push('/pricing')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/80 font-medium">Status</h3>
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-xl font-bold text-white mb-1">
              {subscriptionLoading ? 'Loading...' : (isPremiumUser ? 'Premium' : 'Free')}
            </p>
            <p className="text-sm text-yellow-400">
              {subscriptionLoading ? 'Checking status...' : (isPremiumUser ? 'All features unlocked' : 'Click to upgrade')}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/80 font-medium">Bankroll</h3>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              ${bankroll.current.toFixed(2)}
            </p>
            <p className="text-sm text-white/60">
              {bankroll.history.length > 0 ? 'This month' : 'No data yet'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/80 font-medium">ROI</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {analytics.roi > 0 ? '+' : ''}{analytics.roi.toFixed(1)}%
            </p>
            <p className="text-sm text-blue-400">
              ${analytics.totalProfit > 0 ? '+' : ''}{analytics.totalProfit.toFixed(2)} profit
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/80 font-medium">Win Rate</h3>
              <Target className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {analytics.winRate.toFixed(1)}%
            </p>
            <p className="text-sm text-white/60">
              {analytics.totalBets} total bets
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/80 font-medium">CLV</h3>
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              +{analytics.clvAvg}%
            </p>
            <p className="text-sm text-purple-400">vs closing line</p>
          </motion.div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts and Analytics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bankroll Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-blue-400" />
                  Bankroll Progress
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBankrollActions(true)}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Deposit
                  </button>
                  <button
                    onClick={() => setShowBankrollActions(true)}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                    Withdraw
                  </button>
                </div>
              </div>
              <BankrollChart data={bankroll.history} />
            </motion.div>

            {/* Performance Charts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Performance Analytics
              </h2>
              <PerformanceCharts bets={bets} analytics={analytics} />
            </motion.div>

            {/* Bet History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-yellow-400" />
                  Bet History
                </h2>
                <button
                  onClick={() => setShowAddBet(true)}
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Bet
                </button>
              </div>
              <BetHistoryTable 
                bets={bets} 
                onAddBet={async (newBet) => {
                  const updatedBets = [...bets, newBet];
                  setBets(updatedBets);
                  calculateAnalytics(updatedBets);
                  await saveUserData({ bets: updatedBets });
                }}
                onEditBet={async (updatedBet) => {
                  const updatedBets = bets.map(bet => 
                    bet.id === updatedBet.id ? updatedBet : bet
                  );
                  setBets(updatedBets);
                  calculateAnalytics(updatedBets);
                  await saveUserData({ bets: updatedBets });
                }}
                onDeleteBet={async (betId) => {
                  const updatedBets = bets.filter(bet => bet.id !== betId);
                  setBets(updatedBets);
                  calculateAnalytics(updatedBets);
                  await saveUserData({ bets: updatedBets });
                }}
              />
            </motion.div>
          </div>

          {/* Right Column - AI Reports and Quick Actions */}
          <div className="space-y-6">
            {/* AI Weekly Report */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-pink-400" />
                AI Weekly Report
              </h2>
              <WeeklyAIReport bets={bets} analytics={analytics} user={user} />
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Quick Insights
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Favorite Market</span>
                  <span className="text-white font-semibold">{analytics.favoriteMarket}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Top Sportsbook</span>
                  <span className="text-white font-semibold">{analytics.favoriteSportsbook}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Avg Stake</span>
                  <span className="text-white font-semibold">${analytics.avgStake.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">This Week</span>
                  <span className="text-green-400 font-semibold">+5 bets</span>
                </div>
              </div>
            </motion.div>

            {/* System Integration */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                System Integrations
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => isPremiumUser ? setShowUploadSlip(true) : setShowPaywall(true)}
                  className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 p-3 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span>Bet Slip Upload</span>
                  <Upload className="w-4 h-4" />
                </button>
                <button 
                  onClick={exportBettingData}
                  className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 p-3 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span>Export Data</span>
                  <DollarSign className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => router.push('/arbitrage')}
                  className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 p-3 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span>Arbitrage Scanner</span>
                  <Target className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => router.push('/middle-bets')}
                  className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-3 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span>Middle Bets</span>
                  <Activity className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => router.push('/ai-parlay')}
                  className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 p-3 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span>AI Parlays</span>
                  <TrendingUp className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
        )}
      </div>

      {/* Add Bet Modal */}
      {showAddBet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-white mb-4">Add New Bet</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Sport"
                  value={newBet.sport}
                  onChange={(e) => setNewBet(prev => ({ ...prev, sport: e.target.value }))}
                  className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50"
                />
                <input
                  type="text"
                  placeholder="Bet Type"
                  value={newBet.betType}
                  onChange={(e) => setNewBet(prev => ({ ...prev, betType: e.target.value }))}
                  className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50"
                />
              </div>
              <input
                type="text"
                placeholder="Teams (e.g., Lakers vs Warriors)"
                value={newBet.teams}
                onChange={(e) => setNewBet(prev => ({ ...prev, teams: e.target.value }))}
                className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 w-full"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Odds (e.g., +150)"
                  value={newBet.odds}
                  onChange={(e) => setNewBet(prev => ({ ...prev, odds: e.target.value }))}
                  className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50"
                />
                <input
                  type="number"
                  placeholder="Stake ($)"
                  value={newBet.stake}
                  onChange={(e) => setNewBet(prev => ({ ...prev, stake: e.target.value }))}
                  className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50"
                />
              </div>
              <input
                type="text"
                placeholder="Sportsbook"
                value={newBet.sportsbook}
                onChange={(e) => setNewBet(prev => ({ ...prev, sportsbook: e.target.value }))}
                className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 w-full"
              />
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={addBet}
                className="flex-1 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white font-medium transition-colors"
              >
                Add Bet
              </button>
              <button
                onClick={() => setShowAddBet(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bankroll Actions Modal */}
      {showBankrollActions && (
        <BankrollModal
          onClose={() => setShowBankrollActions(false)}
          onAction={handleBankrollAction}
        />
      )}

      {/* Bet Slip Upload Modal */}
      {showUploadSlip && (
        <BetSlipUploadModal
          onClose={() => setShowUploadSlip(false)}
          onUpload={handleSlipUpload}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* Premium Paywall */}
      {showPaywall && (
        <Paywall 
          feature="premium dashboard features"
          usageLimit="Upgrade to unlock unlimited access"
        />
      )}

      <Footer />
    </div>
  );
}

// Bankroll Modal Component
function BankrollModal({ onClose, onAction }) {
  const [actionType, setActionType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    onAction(actionType, amount, description);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 w-full max-w-md"
      >
        <h3 className="text-xl font-bold text-white mb-4">Bankroll Transaction</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActionType('deposit')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                actionType === 'deposit' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActionType('withdrawal')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                actionType === 'withdrawal' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              Withdrawal
            </button>
          </div>
          <input
            type="number"
            placeholder="Amount ($)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 w-full"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 w-full"
          />
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          >
            {actionType === 'deposit' ? 'Add Funds' : 'Withdraw'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Bet Slip Upload Modal Component
function BetSlipUploadModal({ onClose, onUpload, isAnalyzing }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);

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

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      setUploadedFile(file);
    } else {
      alert('Please upload an image file (PNG, JPG, WEBP)');
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (uploadedFile) {
      onUpload(uploadedFile);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 w-full max-w-md"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Bet Slip Upload
        </h3>
        
        <div className="mb-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-400/10'
                : uploadedFile
                ? 'border-green-400 bg-green-400/10'
                : 'border-white/30 hover:border-white/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
            {uploadedFile ? (
              <div className="text-green-400">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-white/60 mt-1">Click to change file</p>
              </div>
            ) : (
              <div className="text-white/60">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium mb-1">Drop your bet slip here</p>
                <p className="text-sm">or click to select</p>
              </div>
            )}
          </div>
          
          {uploadedFile && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <p className="text-white/80 text-sm">
                <strong>Note:</strong> The bet slip will be analyzed and automatically added to your bet tracking. 
                You can edit details later if needed.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleAnalyze}
            disabled={!uploadedFile || isAnalyzing}
            className="flex-1 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Analyze & Add</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="flex-1 bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
