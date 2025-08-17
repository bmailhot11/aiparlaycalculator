import { useState } from 'react';
import { Crown, Check, X, Loader, Mail, CreditCard, Zap, Target, TrendingUp, Shield } from 'lucide-react';

export default function PremiumUpgrade({ onClose, currentPlan = 'free' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('yearly'); // Default to yearly for better value

  const handleUpgrade = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      console.log('🚀 Starting premium upgrade for:', email, 'Plan:', selectedPlan);

      // Call your Stripe API with plan selection
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          plan: selectedPlan 
        }),
      });

      const result = await response.json();
      console.log('💳 Stripe response:', result);

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      if (result.url) {
        // Redirect to Stripe checkout
        console.log('✅ Redirecting to Stripe checkout:', result.url);
        window.location.href = result.url;
      } else {
        throw new Error('No checkout URL received from Stripe');
      }

    } catch (err) {
      console.error('❌ Premium upgrade error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, text: 'Unlimited parlay generations', highlight: true },
    { icon: Target, text: 'Unlimited bet slip analysis', highlight: true },
    { icon: TrendingUp, text: 'Advanced AI insights & market analysis', highlight: false },
    { icon: Shield, text: 'Priority customer support', highlight: false },
    { icon: Crown, text: 'Early access to new features', highlight: false },
  ];

  const planOptions = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$6.99',
      period: '/month',
      total: '$6.99/month',
      savings: null,
      popular: false
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '$49.99',
      period: '/year',
      total: '$4.17/month',
      savings: 'Save 40%',
      popular: true
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <Crown className="w-12 h-12 mx-auto mb-3 text-yellow-300" />
            <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
            <p className="text-purple-100">Unlock unlimited AI-powered betting analysis</p>
          </div>
        </div>

        {/* Current Plan Badge */}
        {currentPlan === 'free' && (
          <div className="px-6 pt-4">
            <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm text-center">
              Currently on Free Plan (3 generations/day)
            </div>
          </div>
        )}

        {/* Plan Selection */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Choose Your Plan</h3>
          
          <div className="space-y-3 mb-6">
            {planOptions.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${plan.popular ? 'ring-2 ring-purple-200' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === plan.id 
                        ? 'border-purple-500 bg-purple-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedPlan === plan.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    
                    <div>
                      <div className="font-semibold text-gray-800">{plan.name}</div>
                      <div className="text-sm text-gray-600">{plan.total}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-gray-800">
                      {plan.price}<span className="text-sm font-normal text-gray-600">{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <div className="text-xs text-green-600 font-semibold">{plan.savings}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Value Proposition for Yearly */}
          {selectedPlan === 'yearly' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <div className="text-center">
                <div className="text-green-700 font-semibold text-sm">🎉 Great Choice!</div>
                <div className="text-green-600 text-xs mt-1">
                  You'll save $33.89 compared to paying monthly
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-gray-800 text-sm">What's included:</h4>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className={`p-1 rounded-full ${feature.highlight ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Check className={`w-4 h-4 ${feature.highlight ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  <span className={`text-sm ${feature.highlight ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                    {feature.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upgrade Form */}
        <div className="px-6 pb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <div className="font-medium">Payment Error</div>
                <div>{error}</div>
              </div>
            )}

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>
                    {selectedPlan === 'yearly' 
                      ? 'Upgrade Now - $49.99/year' 
                      : 'Upgrade Now - $6.99/month'
                    }
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Shield className="w-3 h-3" />
              <span>Secure payment powered by Stripe</span>
            </div>
            <p>Your payment information is encrypted and secure</p>
          </div>
        </div>
      </div>
    </div>
  );
}