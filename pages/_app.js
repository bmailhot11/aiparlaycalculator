import { createContext, useState, useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';

// Premium Context
const PremiumContext = createContext({
  isPremium: false,
  setIsPremium: () => {},
  premiumLoading: false,
  checkPremiumStatus: () => {}
});

function MyApp({ Component, pageProps }) {
  const [isPremium, setIsPremium] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(false); // ✅ REMOVED LOADING: Set to false by default

  // Simplified premium check with proper error handling
  const checkPremiumStatus = async () => {
    try {
      setPremiumLoading(true);
      console.log('🔍 Checking premium status...');
      
      const userIdentifier = localStorage.getItem('userIdentifier');
      const premiumEmail = localStorage.getItem('premiumEmail');
      const localPremium = localStorage.getItem('isPremium');
      
      // If we have local premium status and it's true, use it immediately
      if (localPremium === 'true') {
        console.log('📱 Using cached premium status');
        setIsPremium(true);
        setPremiumLoading(false);
        return true;
      }
      
      // If no identification, user is free
      if (!userIdentifier && !premiumEmail) {
        console.log('ℹ️ No user identification - free user');
        setIsPremium(false);
        localStorage.setItem('isPremium', 'false');
        setPremiumLoading(false);
        return false;
      }

      // Try to check with server
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        let url = '/api/check-premium-status?';
        if (userIdentifier) url += `userIdentifier=${encodeURIComponent(userIdentifier)}`;
        if (premiumEmail) url += `${userIdentifier ? '&' : ''}email=${encodeURIComponent(premiumEmail)}`;
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Premium status response:', data);
          setIsPremium(data.isPremium);
          localStorage.setItem('isPremium', data.isPremium.toString());
          setPremiumLoading(false);
          return data.isPremium;
        } else {
          console.error('❌ Premium status check failed:', response.status);
          setIsPremium(false);
          localStorage.setItem('isPremium', 'false');
          setPremiumLoading(false);
          return false;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('❌ Premium status fetch error:', fetchError);
        
        // Fallback to localStorage or default to false
        if (localPremium === 'true') {
          console.log('📱 Using local premium status as fallback');
          setIsPremium(true);
        } else {
          setIsPremium(false);
          localStorage.setItem('isPremium', 'false');
        }
        setPremiumLoading(false);
        return localPremium === 'true';
      }
    } catch (error) {
      console.error('❌ Premium status error:', error);
      setIsPremium(false);
      localStorage.setItem('isPremium', 'false');
      setPremiumLoading(false);
      return false;
    }
  };

  // ✅ IMPROVED: Immediate premium recognition without loading screens
  useEffect(() => {
    const initializePremiumStatus = () => {
      try {
        // Always check localStorage first for immediate UI response
        const localPremium = localStorage.getItem('isPremium');
        const premiumEmail = localStorage.getItem('premiumEmail');
        
        console.log('📱 Initializing premium status. Cached:', localPremium);
        
        // Generate user identifier if missing (for new users)
        let userIdentifier = localStorage.getItem('userIdentifier');
        if (!userIdentifier) {
          userIdentifier = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('userIdentifier', userIdentifier);
          console.log('🆔 Generated new user identifier:', userIdentifier);
        }

        // ✅ IMMEDIATE PREMIUM RECOGNITION: Set status from localStorage instantly
        if (localPremium === 'true') {
          console.log('✅ Premium user detected - setting status immediately');
          setIsPremium(true);
          setPremiumLoading(false);
        } else {
          console.log('ℹ️ Free user detected - setting status immediately');
          setIsPremium(false);
          setPremiumLoading(false);
          localStorage.setItem('isPremium', 'false');
        }

        // ✅ BACKGROUND VERIFICATION: Optionally verify with server without blocking UI
        if (premiumEmail && checkPremiumStatus) {
          console.log('🔍 Background verification for premium email:', premiumEmail);
          checkPremiumStatus().catch(error => {
            console.warn('Background premium check failed:', error);
            // Don't change UI state on background check failure
          });
        }
        
      } catch (error) {
        console.error('Error initializing premium status:', error);
        setIsPremium(false);
        localStorage.setItem('isPremium', 'false');
        setPremiumLoading(false);
      }
    };

    initializePremiumStatus();
  }, []); // Only run once on mount

  // 🚀 FIX: Add emergency timeout to prevent infinite loading
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (premiumLoading) {
        console.warn('⚠️ Emergency timeout: Premium check took too long, stopping loading');
        setPremiumLoading(false);
        
        // Use cached status or default to free
        const localPremium = localStorage.getItem('isPremium');
        if (localPremium === 'true') {
          setIsPremium(true);
          console.log('📱 Emergency fallback: Using cached premium status');
        } else {
          setIsPremium(false);
          localStorage.setItem('isPremium', 'false');
          console.log('📱 Emergency fallback: Setting to free user');
        }
      }
    }, 10000); // 10 second emergency timeout

    return () => clearTimeout(emergencyTimeout);
  }, [premiumLoading]);

  const premiumContextValue = {
    isPremium,
    setIsPremium,
    premiumLoading,
    checkPremiumStatus
  };

  return (
    <>
      <Head>
        <title>BetChekr - Smart Betting Analysis</title>
        <link rel="icon" href="/betchekr_owl_logo.ico" />
        <link rel="apple-touch-icon" href="/betchekr_owl_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PremiumContext.Provider value={premiumContextValue}>
        <Component {...pageProps} />
      </PremiumContext.Provider>
    </>
  );
}

export default MyApp;
export { PremiumContext };