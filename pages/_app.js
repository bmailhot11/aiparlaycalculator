import { createContext, useState, useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import SiteTheme from '../components/theme/SiteTheme';

// Premium Context
const PremiumContext = createContext({
  isPremium: false,
  setIsPremium: () => {},
  checkPremiumStatus: () => {}
});

function MyApp({ Component, pageProps }) {
  const [isPremium, setIsPremium] = useState(false);
  // Remove premiumLoading state completely - it was causing delays

  // Simplified premium check with proper error handling
  const checkPremiumStatus = async () => {
    try {
      console.log('🔍 Checking premium status...');
      
      const userIdentifier = localStorage.getItem('userIdentifier');
      const premiumEmail = localStorage.getItem('premiumEmail');
      const localPremium = localStorage.getItem('isPremium');
      
      // If we have local premium status and it's true, use it immediately
      if (localPremium === 'true') {
        console.log('📱 Using cached premium status');
        setIsPremium(true);
        return true;
      }
      
      // If no identification, user is free
      if (!userIdentifier && !premiumEmail) {
        console.log('ℹ️ No user identification - free user');
        setIsPremium(false);
        localStorage.setItem('isPremium', 'false');
        return false;
      }

      // Try to check with server with reduced timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
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
          return data.isPremium;
        } else {
          console.error('❌ Premium status check failed:', response.status);
          setIsPremium(false);
          localStorage.setItem('isPremium', 'false');
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
        return localPremium === 'true';
      }
    } catch (error) {
      console.error('❌ Premium status error:', error);
      setIsPremium(false);
      localStorage.setItem('isPremium', 'false');
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
        } else {
          console.log('ℹ️ Free user detected - setting status immediately');
          setIsPremium(false);
          localStorage.setItem('isPremium', 'false');
        }

        // ✅ BACKGROUND VERIFICATION: Skip background check on initial load for speed
        // Only verify if user actually tries to use premium features
        
      } catch (error) {
        console.error('Error initializing premium status:', error);
        setIsPremium(false);
        localStorage.setItem('isPremium', 'false');
      }
    };

    initializePremiumStatus();
  }, []); // Only run once on mount

  // Removed emergency timeout - it was causing the 10-second delay

  const premiumContextValue = {
    isPremium,
    setIsPremium,
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
      <AuthProvider>
        <PremiumContext.Provider value={premiumContextValue}>
          <SiteTheme>
            <Component {...pageProps} />
          </SiteTheme>
        </PremiumContext.Provider>
      </AuthProvider>
    </>
  );
}

export default MyApp;
export { PremiumContext };