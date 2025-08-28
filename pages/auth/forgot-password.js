// Forgot Password page
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import GradientBG from '../../components/theme/GradientBG';
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Loader2 
} from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [emailSent, setEmailSent] = useState(false);

  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    if (!email) {
      setMessage({ type: 'error', content: 'Please enter your email address' });
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setEmailSent(true);
        setMessage({ 
          type: 'success', 
          content: 'Password reset email sent! Check your inbox for instructions.' 
        });
      } else {
        setMessage({ type: 'error', content: result.error || 'Failed to send reset email' });
      }
    } catch (error) {
      setMessage({ type: 'error', content: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="betchekr-premium">
      <Head>
        <title>Reset Password | BetChekr</title>
        <meta name="description" content="Reset your BetChekr account password" />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>

        <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6 sm:p-8">
            {/* Back to Sign In */}
            <div className="mb-6">
              <Link 
                href="/auth/signin" 
                className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#E5E7EB] text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#E5E7EB] mb-2">
                Reset Your Password
              </h1>
              <p className="text-[#9CA3AF]">
                {emailSent 
                  ? "We've sent you a password reset link"
                  : "Enter your email and we'll send you a reset link"
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

            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                      placeholder="Enter your email address"
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
                  Send Reset Link
                </button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#E5E7EB]">Check Your Email</h3>
                  <p className="text-[#9CA3AF] text-sm">
                    We've sent a password reset link to <strong className="text-[#E5E7EB]">{email}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setEmailSent(false);
                      setMessage({ type: '', content: '' });
                      setEmail('');
                    }}
                    className="w-full bg-[#374151] text-[#E5E7EB] px-4 py-2 rounded-lg font-medium hover:bg-[#4B5563] transition-colors"
                  >
                    Send Another Email
                  </button>
                  
                  <Link 
                    href="/auth/signin"
                    className="block w-full text-center text-[#F4C430] hover:text-[#e6b829] text-sm font-medium"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            )}

            {/* Additional Help */}
            {!emailSent && (
              <div className="mt-6 text-center">
                <p className="text-[#9CA3AF] text-sm">
                  Remember your password?{' '}
                  <Link href="/auth/signin" className="text-[#F4C430] hover:text-[#e6b829] font-medium">
                    Sign in instead
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </GradientBG>
    </div>
  );
}