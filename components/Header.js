import { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, Crown, User, Check, LogOut, Settings } from 'lucide-react';
import { PremiumContext } from '../pages/_app';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isPremium } = useContext(PremiumContext);
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  const navLinks = [
    { href: '/line-shopping', label: 'Line Shopping' },
    { href: '/ai-parlay', label: 'AI-Generated Parlay' },
    { href: '/arbitrage', label: 'Arbitrage Opportunities' },
    { href: '/daily-picks', label: 'Daily Picks' },
    { href: '/learn', label: 'Learn' },
    { href: '/results', label: 'Results' }
  ];

  const isActiveLink = (href) => router.pathname === href;

  return (
    <header className="sticky top-0 z-50 h-[72px] bg-[#0B0F14]/60 backdrop-blur-[10px] border-b border-[#1F2937]">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img 
              src="/betchekr_owl_logo.png" 
              alt="BetChekr Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-[#E5E7EB] text-xl font-bold tracking-[-0.01em]" style={{ fontWeight: 700 }}>
              BetChekr
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors relative py-2 ${
                  isActiveLink(link.href) 
                    ? 'text-[#F4C430]' 
                    : 'text-[#9CA3AF] hover:text-[#F4C430]'
                }`}
              >
                {link.label}
                {isActiveLink(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F4C430]" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Premium Button */}
            {!isPremium && (
              <Link 
                href="/pricing"
                className="hidden sm:inline-flex items-center px-5 py-2.5 bg-[#F4C430] text-[#0B0F14] font-semibold text-sm rounded-lg hover:bg-[#e6b829] transition-colors shadow-[0_6px_16px_rgba(244,196,48,0.35)] focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:ring-offset-2"
              >
                <Crown className="w-4 h-4 mr-2" />
                Go Premium
              </Link>
            )}
            {isPremium && (
              <div className="hidden sm:inline-flex items-center px-5 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-lg">
                <Check className="w-4 h-4 mr-2" />
                Premium
              </div>
            )}

            {/* User Menu / Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1F2937] hover:bg-[#374151] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:ring-offset-2"
                  aria-label="User menu"
                >
                  <User className="w-5 h-5 text-[#9CA3AF]" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-[#0F172A] border border-[#1F2937] py-1">
                    <div className="px-4 py-2 text-xs text-[#6B7280] border-b border-[#1F2937]">
                      {user.email}
                    </div>
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#9CA3AF] hover:bg-[#141C28] hover:text-[#F4C430] transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Profile
                    </Link>
                    <hr className="my-1 border-[#1F2937]" />
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[#9CA3AF] hover:bg-[#141C28] hover:text-red-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/signin" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#9CA3AF] hover:text-[#F4C430] border border-[#374151] rounded-lg hover:border-[#F4C430] transition-colors">
                <User className="w-4 h-4" />
                Sign in
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[#141C28] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:ring-offset-2"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#9CA3AF]" />
              ) : (
                <Menu className="w-6 h-6 text-[#9CA3AF]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 bg-[#0B0F14]/95 backdrop-blur-lg border-b border-[#1F2937]">
          <nav className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActiveLink(link.href)
                    ? 'bg-[#141C28] text-[#F4C430]'
                    : 'text-[#9CA3AF] hover:bg-[#141C28] hover:text-[#F4C430]'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!isPremium ? (
              <Link
                href="/pricing"
                className="flex items-center justify-center px-4 py-3 bg-[#F4C430] text-[#0B0F14] font-semibold text-sm rounded-lg hover:bg-[#e6b829] transition-colors mt-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Crown className="w-4 h-4 mr-2" />
                Go Premium
              </Link>
            ) : (
              <div className="flex items-center justify-center px-4 py-3 bg-green-600 text-white font-semibold text-sm rounded-lg mt-4">
                <Check className="w-4 h-4 mr-2" />
                Premium
              </div>
            )}
            {!isLoggedIn && (
              <Link href="/pricing" className="block w-full text-center px-4 py-3 text-sm font-medium text-[#9CA3AF] hover:text-[#F4C430] transition-colors">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}