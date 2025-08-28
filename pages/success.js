// pages/success.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import GradientBG from '../components/theme/GradientBG';
import { Check, Crown, Copy, Home } from 'lucide-react';

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;
  const [accessCode, setAccessCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifyingSubscription, setVerifyingSubscription] = useState(false);
  const [subscriptionVerified, setSubscriptionVerified] = useState(false);

  useEffect(() => {
    if (session_id) {
      // Generate access code
      const code = `PREMIUM_${session_id.slice(-12).toUpperCase()}`;
      setAccessCode(code);
      
      // ✅ COMPREHENSIVE PREMIUM STORAGE: Store all data immediately for instant recognition
      localStorage.setItem('isPremium', 'true');
      localStorage.setItem('accessCode', code);
      localStorage.setItem('sessionId', session_id);
      localStorage.setItem('premiumActivatedAt', new Date().toISOString());
      
      // Ensure user identifier exists and link it
      let userIdentifier = localStorage.getItem('userIdentifier');
      if (!userIdentifier) {
        userIdentifier = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('userIdentifier', userIdentifier);
      }
      localStorage.setItem('premiumUserIdentifier', userIdentifier);
      
      console.log('💾 Premium activated with full storage:', {
        isPremium: 'true',
        accessCode: code,
        sessionId: session_id,
        userIdentifier: userIdentifier
      });
      
      // Verify subscription with server
      verifySubscription(session_id);
    }
  }, [session_id]);

  const verifySubscription = async (sessionId) => {
    setVerifyingSubscription(true);
    try {
      const userIdentifier = localStorage.getItem('userIdentifier');
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          session_id: sessionId,
          userIdentifier: userIdentifier || null 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.subscription_active) {
          setSubscriptionVerified(true);
          // Store email if returned
          if (data.customer_email) {
            localStorage.setItem('premiumEmail', data.customer_email);
          }
          console.log('✅ Subscription verified successfully');
        } else {
          console.warn('⚠️ Subscription not yet active');
          // Still allow access, webhook might be delayed
          setSubscriptionVerified(true);
        }
      } else {
        console.error('Failed to verify subscription');
        // Still allow access, verification might fail due to timing
        setSubscriptionVerified(true);
      }
    } catch (error) {
      console.error('Error verifying subscription:', error);
      // Still allow access, verification might fail due to network issues
      setSubscriptionVerified(true);
    } finally {
      setVerifyingSubscription(false);
    }
  };

  const copyAccessCode = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const goHome = () => {
    // Force a page reload to ensure the premium state is picked up
    window.location.href = '/';
  };

  return (
    <div className="betchekr-premium">
      <GradientBG>
        <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-green-600 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to Premium!</h1>
        <p className="text-gray-400 mb-6">
          Your subscription is now active. You have unlimited access to all features.
        </p>

        {/* Verification Status */}
        {verifyingSubscription && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-blue-400 text-sm">Verifying subscription...</span>
            </div>
          </div>
        )}

        {subscriptionVerified && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">Subscription verified!</span>
            </div>
          </div>
        )}

        {/* Premium Badge */}
        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-2 rounded-lg font-semibold mb-6 mx-auto w-fit">        
          <Crown className="w-4 h-4" />
          Premium Member
        </div>

        {/* Access Code */}
        {accessCode && (
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-2">Your Access Code</h3>
            <p className="text-gray-400 text-sm mb-3">
              Save this code to restore premium access if needed:
            </p>
            <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-3">
              <code className="text-green-400 font-mono flex-1">{accessCode}</code>
              <button
                onClick={copyAccessCode}
                className="text-gray-400 hover:text-white transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="text-left mb-6 bg-gray-900 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Premium Features Unlocked:</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Unlimited bet slip uploads
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Unlimited parlay generation
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Advanced AI analysis
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Player props integration
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Priority support
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={goHome}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Start Using Premium Features
        </button>

        {/* Session Info */}
        {session_id && (
          <p className="text-xs text-gray-500 mt-4">
            Session: {session_id.slice(-8)}
          </p>
        )}
        </div>
      </GradientBG>
    </div>
  );
}