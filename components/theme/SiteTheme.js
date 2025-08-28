import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SiteTheme({ children }) {
  const router = useRouter();
  const [isPremiumTheme, setIsPremiumTheme] = useState(false);
  const isPremiumRoute = router.pathname === '/premium-preview';

  useEffect(() => {
    // Apply premium theme only on premium preview route
    if (isPremiumRoute) {
      setIsPremiumTheme(true);
      document.body.classList.add('betchekr-premium');
    } else {
      setIsPremiumTheme(false);
      document.body.classList.remove('betchekr-premium');
    }

    return () => {
      document.body.classList.remove('betchekr-premium');
    };
  }, [isPremiumRoute]);

  const toggleTheme = () => {
    if (isPremiumRoute) {
      setIsPremiumTheme(!isPremiumTheme);
      if (!isPremiumTheme) {
        document.body.classList.add('betchekr-premium');
      } else {
        document.body.classList.remove('betchekr-premium');
      }
    }
  };

  return (
    <>
      {children}
      {/* Dev-only theme toggle on premium preview */}
      {isPremiumRoute && process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className="px-3 py-2 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg text-white text-sm font-medium hover:bg-black/70 transition-colors"
          >
            {isPremiumTheme ? '🎨 Premium ON' : '🎨 Premium OFF'}
          </button>
        </div>
      )}
    </>
  );
}