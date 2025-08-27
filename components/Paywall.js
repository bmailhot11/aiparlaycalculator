import { useContext } from 'react';
import { useRouter } from 'next/router';
import { Crown, Lock, TrendingUp, Brain, Target, User } from 'lucide-react';
import { PremiumContext } from '../pages/_app';
import { useAuth } from '../contexts/AuthContext';

export default function Paywall({ feature = 'this feature', usageLimit = null }) {
  const { isPremium } = useContext(PremiumContext);
  const { user } = useAuth();
  const router = useRouter();
  
  const handleUpgrade = async () => {
    // Redirect to pricing page which will handle Stripe checkout
    router.push('/pricing');
  };

  const handleSignIn = () => {
    // Redirect to sign-in page
    router.push('/auth/signin');
  };

  if (isPremium) return null;

  // If user is not signed in, show sign-in prompt instead
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F14]/95 backdrop-blur-md">
        <div className="max-w-md w-full mx-4">
          <div className="bg-gradient-to-br from-[#1F2937] to-[#141C28] rounded-2xl p-8 border border-[#F4C430]/20 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#F4C430]/10 rounded-full mb-4">
                <User className="w-10 h-10 text-[#F4C430]" />
              </div>
              <h2 className="text-2xl font-bold text-[#E5E7EB] mb-2">
                Sign In Required
              </h2>
              <p className="text-[#9CA3AF] text-sm">
                Please sign in to access {feature}
              </p>
            </div>

            <button
              onClick={handleSignIn}
              className="w-full bg-[#F4C430] text-[#0B0F14] font-semibold py-3 px-6 rounded-lg hover:bg-[#e6b829] transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <User className="w-5 h-5" />
              Sign In
            </button>

            <div className="text-center">
              <p className="text-[#6B7280] text-sm mb-3">
                After signing in, you can upgrade to Premium for unlimited access
              </p>
              <button
                onClick={handleUpgrade}
                className="text-[#F4C430] hover:text-[#e6b829] transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <Crown className="w-4 h-4" />
                Learn about Premium
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F14]/95 backdrop-blur-md">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gradient-to-br from-[#1F2937] to-[#141C28] rounded-2xl p-8 border border-[#F4C430]/20 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#F4C430]/10 rounded-full mb-4">
              <Lock className="w-10 h-10 text-[#F4C430]" />
            </div>
            <h2 className="text-2xl font-bold text-[#E5E7EB] mb-2">
              Premium Feature
            </h2>
            {usageLimit ? (
              <p className="text-[#9CA3AF] text-sm">
                You've reached your daily limit of {usageLimit}
              </p>
            ) : (
              <p className="text-[#9CA3AF] text-sm">
                Unlock {feature} with betchekr Premium
              </p>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-green-400 mt-1">✓</div>
              <div>
                <p className="text-[#E5E7EB] font-medium">Unlimited Bet Analysis</p>
                <p className="text-[#6B7280] text-sm">Analyze as many bet slips as you want</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-400 mt-1">✓</div>
              <div>
                <p className="text-[#E5E7EB] font-medium">AI Parlay Generation</p>
                <p className="text-[#6B7280] text-sm">Generate unlimited optimized parlays</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-400 mt-1">✓</div>
              <div>
                <p className="text-[#E5E7EB] font-medium">Real-Time EV Lines</p>
                <p className="text-[#6B7280] text-sm">Access all positive EV opportunities</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-green-400 mt-1">✓</div>
              <div>
                <p className="text-[#E5E7EB] font-medium">Arbitrage Finder</p>
                <p className="text-[#6B7280] text-sm">Find guaranteed profit opportunities</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0B0F14]/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#E5E7EB] font-semibold">Premium Access</p>
                <p className="text-[#6B7280] text-sm">All features, no limits</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#F4C430]">$9.99</p>
                <p className="text-[#6B7280] text-xs">/month</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full bg-[#F4C430] text-[#0B0F14] font-semibold py-3 px-6 rounded-lg hover:bg-[#e6b829] transition-colors flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Upgrade to Premium
          </button>

          <p className="text-center text-[#6B7280] text-xs mt-4">
            Cancel anytime • Secure payment via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}