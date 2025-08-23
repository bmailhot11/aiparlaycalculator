import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Head from 'next/head';
import { Lock, Mail, Key, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

export default function PremiumSignIn() {
  const [formData, setFormData] = useState({
    email: '',
    accessCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.toUpperCase() // Access codes are uppercase
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const response = await fetch('/api/restore-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          accessCode: formData.accessCode
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ 
          type: 'success', 
          content: 'Premium access restored successfully! Redirecting...' 
        });
        
        // Store premium status in localStorage
        localStorage.setItem('isPremium', 'true');
        localStorage.setItem('premiumEmail', formData.email);
        localStorage.setItem('premiumActivatedAt', new Date().toISOString());

        // Redirect to premium dashboard or comparison page
        setTimeout(() => {
          router.push('/compare?restored=true');
        }, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          content: result.message || 'Invalid credentials. Please check your access code.' 
        });
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setMessage({ 
        type: 'error', 
        content: 'Connection error. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Premium Sign In - BetChekr</title>
        <meta name="description" content="Sign in to your BetChekr premium account and access advanced betting analysis tools." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/betchekr_owl_logo.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="bg-blue-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Lock className="w-10 h-10 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-gray-300">Sign in to access your premium features</p>
            </div>

            {/* Sign In Form */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Access Code Field */}
                <div>
                  <label htmlFor="accessCode" className="block text-sm font-medium text-gray-300 mb-2">
                    Access Code
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="accessCode"
                      name="accessCode"
                      value={formData.accessCode}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-wider"
                      placeholder="Enter 8-character code"
                      maxLength="8"
                      pattern="[A-Z0-9]{8}"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    8 characters, letters and numbers (found in your purchase confirmation)
                  </p>
                </div>

                {/* Message Display */}
                {message.content && (
                  <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success' 
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                      : 'bg-red-500/20 border border-red-500/30 text-red-400'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="text-sm">{message.content}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Help Links */}
            <div className="text-center mt-8 space-y-4">
              <div className="text-gray-400 text-sm">
                <p>Don't have an access code?</p>
                <a 
                  href="/pricing" 
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Get Premium Access →
                </a>
              </div>
              
              <div className="text-gray-400 text-sm">
                <p>Lost your access code?</p>
                <a 
                  href="mailto:support@betchekr.com?subject=Lost Access Code" 
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Contact Support →
                </a>
              </div>
            </div>

            {/* Test Credentials (for development) */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-8">
              <h3 className="text-yellow-400 font-bold text-sm mb-2">Test Credentials</h3>
              <div className="text-yellow-300 text-xs space-y-1">
                <p>Email: test@betchekr.com</p>
                <p>Access Codes: TEST1234, PREMIUM1, or DEMO8888</p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}