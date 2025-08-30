// Authentication context for managing user state
import { createContext, useContext, useEffect, useState } from 'react';
import { supabaseAuth as supabase } from '../utils/supabaseAuth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with timeout for faster loading
    const getInitialSession = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 3000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (error) {
          console.error('Error getting session:', error);
        }
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      } catch (error) {
        console.warn('Session check timed out, continuing without auth:', error.message);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);

        // Create or update user profile in database when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          await createOrUpdateUserProfile(session.user);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Create or update user profile in database
  const createOrUpdateUserProfile = async (user) => {
    try {
      console.log('📊 AuthContext: Creating/updating user profile...');
      
      // Add timeout to prevent hanging 
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile upsert timeout')), 2000)
      );
      
      const upsertPromise = supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          provider: user.app_metadata?.provider || 'email',
          last_sign_in: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      const { data, error } = await Promise.race([upsertPromise, timeoutPromise]);

      if (error) {
        console.error('❌ AuthContext: Error creating/updating user profile:', error);
      } else {
        console.log('✅ AuthContext: User profile updated successfully');
      }
    } catch (error) {
      if (error.message === 'Profile upsert timeout') {
        console.warn('⚠️ AuthContext: Profile upsert timed out (2s) - continuing...');
      } else {
        console.error('❌ AuthContext: Error in createOrUpdateUserProfile:', error);
      }
    }
  };

  // Sign up function
  const signUp = async (email, password, firstName, lastName) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`
          }
        }
      });

      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google (direct OAuth bypassing Supabase proxy)
  const signInWithGoogle = async () => {
    try {
      // Store current location for redirect after auth
      const redirectPath = window.location.pathname + window.location.search;
      
      // Redirect directly to our Google OAuth handler
      window.location.href = `/api/auth/google?redirect=${encodeURIComponent(redirectPath)}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};