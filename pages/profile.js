// User Profile Page
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  LogOut,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || ''
      }));
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      // Here you would implement profile update logic
      // For now, just show a success message
      setMessage({
        type: 'success',
        content: 'Profile updated successfully!'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        content: error.message || 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      if (profileData.newPassword !== profileData.confirmPassword) {
        setMessage({ type: 'error', content: 'New passwords do not match' });
        return;
      }

      if (profileData.newPassword.length < 6) {
        setMessage({ type: 'error', content: 'Password must be at least 6 characters' });
        return;
      }

      // Here you would implement password update logic
      setMessage({
        type: 'success',
        content: 'Password updated successfully!'
      });

      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setMessage({
        type: 'error',
        content: error.message || 'Failed to update password'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="betchekr-premium">
        <GradientBG>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#F4C430] mx-auto mb-4" />
              <p className="text-[#E5E7EB]">Loading...</p>
            </div>
          </div>
        </GradientBG>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="betchekr-premium">
      <Head>
        <title>Profile | BetChekr</title>
        <meta name="description" content="Manage your BetChekr account profile and settings" />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
        <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#E5E7EB] mb-2">Profile Settings</h1>
            <p className="text-[#9CA3AF]">Manage your account information and preferences</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info Card */}
            <div className="lg:col-span-1">
              <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-[#F4C430] rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-[#0B0F14]" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#E5E7EB] mb-1">
                    {user.user_metadata?.display_name || user.email}
                  </h2>
                  <p className="text-[#9CA3AF] mb-4">{user.email}</p>
                  
                  <div className="space-y-2 text-sm text-[#9CA3AF]">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className={user.email_confirmed_at ? 'text-green-400' : 'text-yellow-400'}>
                        {user.email_confirmed_at ? 'Email Verified' : 'Email Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Information Form */}
              <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="w-5 h-5 text-[#F4C430]" />
                  <h3 className="text-lg font-semibold text-[#E5E7EB]">Profile Information</h3>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#9CA3AF] cursor-not-allowed"
                    />
                    <p className="text-xs text-[#6B7280] mt-1">Email cannot be changed. Contact support if needed.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded-lg font-medium hover:bg-[#e6b829] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </form>
              </div>

              {/* Password Change Form */}
              {user.app_metadata?.provider === 'email' && (
                <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Settings className="w-5 h-5 text-[#F4C430]" />
                    <h3 className="text-lg font-semibold text-[#E5E7EB]">Change Password</h3>
                  </div>

                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="currentPassword"
                          name="currentPassword"
                          value={profileData.currentPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 pr-12 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                          placeholder="Enter current password"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                          New Password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="newPassword"
                          name="newPassword"
                          value={profileData.newPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                          placeholder="New password"
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                          Confirm Password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={profileData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-[#0B0F14] border border-[#374151] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#F4C430] focus:ring-1 focus:ring-[#F4C430] focus:outline-none"
                          placeholder="Confirm password"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded-lg font-medium hover:bg-[#e6b829] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Update Password
                    </button>
                  </form>
                </div>
              )}

              {/* Sign Out Section */}
              <div className="bg-[#141C28] border border-red-600 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <LogOut className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-[#E5E7EB]">Sign Out</h3>
                </div>
                <p className="text-[#9CA3AF] mb-4">
                  Sign out of your account. You'll need to sign in again to access your data.
                </p>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
        <Footer />
      </GradientBG>
    </div>
  );
}