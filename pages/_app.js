// pages/_app.js
import React from 'react';
import { useEffect, useState, createContext } from 'react';
import '../styles/globals.css'
import { Analytics } from '@vercel/analytics/react';

// Premium Context Provider
export const PremiumContext = createContext({
  isPremium: false,
  setIsPremium: () => {},
  premiumLoading: false,
  checkPremiumStatus: () => {}
});

export default function App({ Component, pageProps }) {
  const [isPremium, setIsPremium] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(true);

  // 🚀 FIXED: Function with timeout and better error handling
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
      
      if (!userIdentifier && !premiumEmail) {
        console.log('❌ No user identifier or email found');
        setPremiumLoading(false);
        return false;
      }

      // 🚀 ADD TIMEOUT to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        let url = '/api/check-premium-status?';
        if (userIdentifier) url += `userIdentifier=${encodeURIComponent(userIdentifier)}`;
        if (premiumEmail) url += `${userIdentifier ? '&' : ''}email=${encodeURIComponent(premiumEmail)}`;
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
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
          // Set to false if server says not premium
          setIsPremium(false);
          localStorage.setItem('isPremium', 'false');
          setPremiumLoading(false);
          return false;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('❌ Premium status check timeout');
        } else {
          console.error('❌ Premium status fetch error:', fetchError);
        }
        
        // 🚀 FALLBACK: Use localStorage if server check fails, otherwise default to false
        if (localPremium === 'true') {
          console.log('📱 Using local premium status as fallback');
          setIsPremium(true);
          setPremiumLoading(false);
          return true;
        } else {
          setIsPremium(false);
          setPremiumLoading(false);
          return false;
        }
      }
      
    } catch (error) {
      console.error('❌ Premium status error:', error);
      setIsPremium(false);
      setPremiumLoading(false);
      return false;
    }
  };

  // 🚀 FIXED: Better initialization with timeout handling
  useEffect(() => {
    const initializePremiumStatus = async () => {
      try {
        // Check localStorage FIRST for immediate UI update
        const localPremium = localStorage.getItem('isPremium');
        if (localPremium === 'true') {
          console.log('📱 Found cached premium status - setting immediately');
          setIsPremium(true);
          setPremiumLoading(false); // Stop loading immediately if we have local data
          return; // Don't check server if we already have premium
        }

        // Generate user identifier if missing
        let userIdentifier = localStorage.getItem('userIdentifier');
        if (!userIdentifier) {
          userIdentifier = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('userIdentifier', userIdentifier);
          console.log('🆔 Generated new user identifier:', userIdentifier);
        }

        // Only check server if we don't have premium cached
        console.log('🔍 No cached premium - checking with server');
        setPremiumLoading(true);
        
        // Add timeout for server check
        setTimeout(async () => {
          try {
            await checkPremiumStatus();
          } catch (error) {
            console.log('⚠️ Server verification failed, defaulting to free');
            setIsPremium(false);
            setPremiumLoading(false);
          }
        }, 100); // Small delay to prevent blocking
        
      } catch (error) {
        console.error('Error initializing premium status:', error);
        setIsPremium(false);
        setPremiumLoading(false);
      }
    };

    initializePremiumStatus();
  }, []); // Only run once on mount

  // 🚀 ADDED: Backup timeout to prevent infinite loading
  useEffect(() => {
    const backupTimeout = setTimeout(() => {
      if (premiumLoading) {
        console.log('⏰ Backup timeout triggered - stopping premium loading');
        setPremiumLoading(false);
        
        // Check localStorage as final fallback
        const localPremium = localStorage.getItem('isPremium');
        if (localPremium === 'true') {
          setIsPremium(true);
          console.log('📱 Using localStorage fallback for premium status');
        } else {
          setIsPremium(false);
        }
      }
    }, 8000); // 8 second backup timeout

    return () => clearTimeout(backupTimeout);
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
      <Analytics />
    </PremiumContext.Provider>
  );
}