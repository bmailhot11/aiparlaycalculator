import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Crown, Check, Home } from "lucide-react";

export default function Success() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState(null);
  
  useEffect(() => {
    // Get session ID from URL parameters
    const { session_id } = router.query;
    if (session_id) {
      setSessionId(session_id);
      
      // Mark user as premium in localStorage (simple implementation)
      localStorage.setItem("betchekr_premium", "true");
      localStorage.setItem("betchekr_premium_expires", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
      
      // Force a page reload to update premium context
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }, [router.query]);

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-[#E5E7EB] mb-4">
            Welcome to Premium!
          </h1>
          
          <p className="text-[#9CA3AF] text-lg mb-8">
            Your subscription is now active. You have unlimited access to all betchekr features.
          </p>
          
          <div className="bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/20 border border-[#F4C430]/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-[#F4C430] mr-3" />
              <h2 className="text-xl font-semibold text-[#E5E7EB]">Premium Features Unlocked</h2>
            </div>
            
            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-[#E5E7EB]">Unlimited bet slip analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-[#E5E7EB]">Unlimited AI parlay generation</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-[#E5E7EB]">Full access to positive EV lines</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-[#E5E7EB]">Arbitrage opportunity finder</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push("/")}
              className="btn btn-primary"
            >
              <Home className="w-4 h-4 mr-2" />
              Start Using Premium Features
            </button>
          </div>
          
          <p className="text-[#6B7280] text-sm mt-6">
            Your subscription will auto-renew monthly. Cancel anytime.
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
