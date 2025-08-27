// Reset Password page (after clicking email link)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabaseAuth as supabase } from '../../utils/supabaseAuth';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Loader2 
} from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isValidSession, setIsValidSession] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Check if we have a valid password reset session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          setIsValidSession(true);
        } else {
          // Check if there are hash fragments that indicate a password reset
          const hashFragment = window.location.hash;
          if (hashFragment.includes('access_token') && hashFragment.includes('type=recovery')) {
            setIsValidSession(true);
          } else {
            setMessage({ 
              type: 'error', 
              content: 'Invalid or expired reset link. Please request a new password reset.' 
            });
          }
        }
      } catch (error) {
        setMessage({ type: 'error', content: 'Session validation failed' });
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    // Validation
    if (!password || !confirmPassword) {
      setMessage({ type: 'error', content: 'Please fill in all fields' });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', content: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', content: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setPasswordReset(true);
      setMessage({ 
        type: 'success', 
        content: 'Password updated successfully! You can now sign in with your new password.' 
      });

      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);

    } catch (error) {
      setMessage({ 
        type: 'error', 
        content: error.message || 'Failed to update password' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession && !message.content) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#F4C430] mx-auto mb-4" />
          <p className="text-[#E5E7EB]">Validating reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Set New Password | BetChekr</title>
        <meta name="description" content="Set your new BetChekr account password" />
      </Head>

      <Header />

      <div className="min-h-screen bg-[#0B0F14] pt-20 pb-12">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#E5E7EB] mb-2">
                {passwordReset ? 'Password Reset Complete' : 'Set New Password'}
              </h1>
              <p className="text-[#9CA3AF]">
                {passwordReset 
                  ? 'You will be redirected to sign in shortly'
                  : 'Enter your new password below'
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

            {isValidSession && !passwordReset ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                      placeholder="Enter new password (min 6 characters)"
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

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                      placeholder="Confirm your new password"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F4C430] text-[#0B0F14] px-4 py-3 rounded-lg font-semibold hover:bg-[#e6b829] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Update Password
                </button>
              </form>
            ) : passwordReset ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                
                <div className="space-y-4">
                  <Link 
                    href="/auth/signin"
                    className="block w-full bg-[#F4C430] text-[#0B0F14] px-4 py-3 rounded-lg font-semibold hover:bg-[#e6b829] transition-colors text-center"
                  >
                    Continue to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                
                <div className="space-y-4">
                  <Link 
                    href="/auth/forgot-password"
                    className="block w-full bg-[#F4C430] text-[#0B0F14] px-4 py-3 rounded-lg font-semibold hover:bg-[#e6b829] transition-colors text-center"
                  >
                    Request New Reset Link
                  </Link>
                  
                  <Link 
                    href="/auth/signin"
                    className="block text-center text-[#9CA3AF] hover:text-[#E5E7EB] text-sm"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}