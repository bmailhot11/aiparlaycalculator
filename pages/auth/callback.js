// OAuth callback page for Supabase Auth
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabaseAuth as supabase } from '../../utils/supabaseAuth';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/signin?error=callback_failed');
          return;
        }

        if (data.session) {
          console.log('Authentication successful, redirecting...');
          // Redirect to intended destination or home
          const redirectTo = localStorage.getItem('auth_redirect') || '/';
          localStorage.removeItem('auth_redirect');
          router.push(redirectTo);
        } else {
          console.log('No session found, redirecting to signin');
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/auth/signin?error=unexpected_error');
      }
    };

    // Wait a moment for the auth state to settle
    const timeout = setTimeout(handleAuthCallback, 500);
    
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4C430] mx-auto mb-4"></div>
        <p className="text-[#E5E7EB]">Completing sign in...</p>
      </div>
    </div>
  );
}