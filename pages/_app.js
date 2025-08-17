import { createContext, useState, useEffect } from 'react';
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
  const [premiumLoading, setPremiumLoading] = useState(false);

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

  // Initialize on mount with proper async handling
  useEffect(() => {
    const initializePremiumStatus = async () => {
      try {
        // Check localStorage first for immediate response
        const localPremium = localStorage.getItem('isPremium');
        console.log('📱 Initializing premium status. Cached:', localPremium);
        
        if (localPremium === 'true') {
          console.log('✅ Found cached premium status');
          setIsPremium(true);
          return; // Don't show loading for cached premium users
        }

        // Generate user identifier if missing (for new users)
        let userIdentifier = localStorage.getItem('userIdentifier');
        if (!userIdentifier) {
          userIdentifier = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('userIdentifier', userIdentifier);
          console.log('🆔 Generated new user identifier:', userIdentifier);
        }

        // For non-premium users, just set to false immediately
        const premiumEmail = localStorage.getItem('premiumEmail');
        if (!premiumEmail) {
          console.log('ℹ️ No premium email - setting to free user');
          setIsPremium(false);
          localStorage.setItem('isPremium', 'false');
          return;
        }

        // Only check server if we have premium email but no cached status
        console.log('🔍 Has premium email but no cached status - checking server');
        
        // 🚀 FIX: Properly await the async function and handle errors
        try {
          await checkPremiumStatus();
        } catch (error) {
          console.error('❌ Premium status check failed during initialization:', error);
          // Ensure loading is stopped even if check fails
          setIsPremium(false);
          localStorage.setItem('isPremium', 'false');
          setPremiumLoading(false);
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
    <PremiumContext.Provider value={premiumContextValue}>
      <Component {...pageProps} />
    </PremiumContext.Provider>
  );
}

export default MyApp;
export { PremiumContext };