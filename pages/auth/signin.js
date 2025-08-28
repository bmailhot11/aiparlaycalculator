// Sign in and sign up page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import GradientBG from '../../components/theme/GradientBG';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Chrome,
  Crown
} from 'lucide-react';

export default function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already signed in, redirect
    if (user) {
      // Check for stored redirect from premium button
      const storedRedirect = localStorage.getItem('redirectAfterAuth');
      const redirectTo = storedRedirect || router.query.redirect || '/';
      
      // Clear stored redirect
      if (storedRedirect) {
        localStorage.removeItem('redirectAfterAuth');
      }
      
      router.push(redirectTo);
    }

    // Check for error messages from callback
    if (router.query.error) {
      const errorMessages = {
        callback_failed: 'Authentication failed. Please try again.',
        unexpected_error: 'An unexpected error occurred. Please try again.'
      };
      setMessage({
        type: 'error',
        content: errorMessages[router.query.error] || 'An error occurred during sign in.'
      });
    }
  }, [user, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      if (isSignUp) {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setMessage({ type: 'error', content: 'Passwords do not match' });
          setLoading(false);
          return;
        }

        // Validate password strength
        if (formData.password.length < 6) {
          setMessage({ type: 'error', content: 'Password must be at least 6 characters' });
          setLoading(false);
          return;
        }

        const result = await signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName
        );

        if (result.success) {
          setMessage({
            type: 'success',
            content: 'Account created! Please check your email to verify your account.'
          });
          // Clear form
          setFormData({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            confirmPassword: ''
          });
        } else {
          setMessage({ type: 'error', content: result.error });
        }
      } else {
        const result = await signIn(formData.email, formData.password);

        if (result.success) {
          setMessage({ type: 'success', content: 'Signed in successfully!' });
          // Redirect will happen automatically via useEffect
        } else {
          setMessage({ type: 'error', content: result.error });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', content: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      // Store redirect URL for after Google auth
      if (router.query.redirect) {
        localStorage.setItem('auth_redirect', router.query.redirect);
      }

      const result = await signInWithGoogle();
      
      if (!result.success) {
        setMessage({ type: 'error', content: result.error });
        setLoading(false);
      }
      // If successful, the redirect happens automatically
    } catch (error) {
      setMessage({ type: 'error', content: 'Google sign in failed' });
      setLoading(false);
    }
  };

  return (
    <div className="betchekr-premium">
      <Head>
        <title>{isSignUp ? 'Create Account' : 'Sign In'} | BetChekr</title>
        <meta name="description" content={isSignUp ? 'Create your BetChekr account' : 'Sign in to your BetChekr account'} />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>

        <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#E5E7EB] mb-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p className="text-[#9CA3AF]">
                {isSignUp 
                  ? 'Sign up to access daily picks and track your performance'
                  : 'Sign in to access your daily picks and performance data'
                }
              </p>
            </div>

            {/* Message Display */}
            {message.content && (
              <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-900/30 border-green-700 text-green-400'
                  : 'bg-red-900/30 border-red-700 text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{message.content}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Chrome className="w-5 h-5" />
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-[#374151]"></div>
              <span className="text-[#9CA3AF] text-sm">or</span>
              <div className="flex-1 h-px bg-[#374151]"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name fields for sign up */}
              {isSignUp && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required={isSignUp}
                        className="w-full pl-10 pr-4 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required={isSignUp}
                        className="w-full pl-10 pr-4 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                    placeholder={isSignUp ? "Minimum 6 characters" : "Enter your password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] hover:text-[#E5E7EB]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password for sign up */}
              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required={isSignUp}
                      className="w-full pl-10 pr-4 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F4C430] text-[#0B0F14] px-4 py-3 rounded-lg font-semibold hover:bg-[#e6b829] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Toggle between sign in and sign up */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage({ type: '', content: '' });
                  setFormData({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    confirmPassword: ''
                  });
                }}
                className="text-[#F4C430] hover:text-[#e6b829] text-sm font-medium"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>

            {/* Forgot password link for sign in */}
            {!isSignUp && (
              <div className="mt-4 text-center">
                <Link href="/auth/forgot-password" className="text-[#9CA3AF] hover:text-[#E5E7EB] text-sm">
                  Forgot your password?
                </Link>
              </div>
            )}

            {/* Premium upgrade option */}
            <div className="mt-6 pt-6 border-t border-[#374151]">
              <div className="text-center">
                <p className="text-[#9CA3AF] text-sm mb-3">
                  Want unlimited access to all features?
                </p>
                <Link href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F4C430] to-[#e6b829] text-[#0B0F14] font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity">
                  <Crown className="w-4 h-4" />
                  Go Premium - $9.99/mo
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </GradientBG>
    </div>
  );
}