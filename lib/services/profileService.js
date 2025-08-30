// Profile Service - Handles user profile data with Supabase integration
import { supabase } from '../../utils/supabaseClient';

class ProfileService {
  constructor() {
    this.cache = new Map();
  }

  // Get user profile data (with localStorage fallback and timeout)
  async getUserProfile(userId) {
    // First, immediately try localStorage for fast loading
    try {
      const localData = localStorage.getItem(`user_profile_${userId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        console.log('Using localStorage profile data for fast loading');
        
        // Load Supabase data in background (non-blocking)
        this.loadSupabaseDataInBackground(userId);
        
        return {
          ...parsed,
          source: 'localStorage_fast'
        };
      }
    } catch (error) {
      console.warn('Error reading localStorage:', error);
    }

    // If no localStorage, try Supabase with timeout
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 3000)
      );
      
      const supabasePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data, error } = await Promise.race([supabasePromise, timeoutPromise]);

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('Error fetching profile from Supabase:', error);
      }

      if (data) {
        const profileData = {
          profileImage: data.profile_image_url,
          bio: data.bio || '',
          bankroll: data.bankroll_data || { current: 0, deposits: [], withdrawals: [], history: [] },
          bets: data.betting_history || [],
          settings: data.dashboard_settings || {},
          lastAIReport: data.last_ai_report,
          source: 'supabase'
        };
        
        // Cache to localStorage for next time
        localStorage.setItem(`user_profile_${userId}`, JSON.stringify(profileData));
        return profileData;
      }

      // Return default profile if no data found
      return this.getDefaultProfile();

    } catch (error) {
      console.error('Error in getUserProfile:', error);
      
      // Fallback to localStorage on any error
      try {
        const localData = localStorage.getItem(`user_profile_${userId}`);
        if (localData) {
          return { ...JSON.parse(localData), source: 'localStorage_fallback' };
        }
      } catch (localError) {
        console.warn('localStorage fallback failed:', localError);
      }
      
      return this.getDefaultProfile();
    }
  }

  // Load Supabase data in background without blocking
  async loadSupabaseDataInBackground(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        const profileData = {
          profileImage: data.profile_image_url,
          bio: data.bio || '',
          bankroll: data.bankroll_data || { current: 0, deposits: [], withdrawals: [], history: [] },
          bets: data.betting_history || [],
          settings: data.dashboard_settings || {},
          lastAIReport: data.last_ai_report
        };
        
        // Update localStorage with fresh data
        localStorage.setItem(`user_profile_${userId}`, JSON.stringify(profileData));
        console.log('Background sync with Supabase completed');
      }
    } catch (error) {
      console.log('Background Supabase sync failed (non-blocking):', error.message);
    }
  }

  // Save user profile data
  async saveUserProfile(userId, profileData) {
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          profile_image_url: profileData.profileImage,
          bio: profileData.bio,
          bankroll_data: profileData.bankroll,
          betting_history: profileData.bets,
          dashboard_settings: profileData.settings || {},
          last_ai_report: profileData.lastAIReport,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Error saving to Supabase:', error);
        // Continue to save locally as backup
      }

      // Also save to localStorage as backup
      localStorage.setItem(`user_profile_${userId}`, JSON.stringify({
        ...profileData,
        lastUpdated: new Date().toISOString()
      }));

      return { success: true };

    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Fallback to localStorage only
      localStorage.setItem(`user_profile_${userId}`, JSON.stringify({
        ...profileData,
        lastUpdated: new Date().toISOString()
      }));

      return { success: true, fallback: true };
    }
  }

  // Upload profile image to Supabase Storage
  async uploadProfileImage(userId, file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/profile.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return { 
        success: true, 
        url: publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error('Error uploading profile image:', error);
      
      // Fallback to base64 encoding for localStorage
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            success: true,
            url: e.target.result,
            fallback: true
          });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // Migrate localStorage data to Supabase
  async migrateToSupabase(userId, localData) {
    try {
      console.log('Migrating localStorage data to Supabase...');
      
      await this.saveUserProfile(userId, localData);
      
      // Keep localStorage data for now as backup
      console.log('Migration completed successfully');
      
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  // Get default profile structure
  getDefaultProfile() {
    return {
      profileImage: null,
      bio: '',
      bankroll: { 
        current: 1000, 
        deposits: [], 
        withdrawals: [], 
        history: [] 
      },
      bets: [],
      settings: {
        autoLogBets: false,
        notifications: true,
        publicProfile: false
      },
      source: 'default'
    };
  }

  // Log bet to user's history
  async logBet(userId, betData) {
    try {
      const profile = await this.getUserProfile(userId);
      const updatedBets = [...profile.bets, betData];
      
      await this.saveUserProfile(userId, {
        ...profile,
        bets: updatedBets
      });

      return { success: true };

    } catch (error) {
      console.error('Error logging bet:', error);
      return { success: false, error: error.message };
    }
  }

  // Update bankroll
  async updateBankroll(userId, transaction) {
    try {
      const profile = await this.getUserProfile(userId);
      const bankroll = profile.bankroll;

      const updatedBankroll = {
        current: transaction.type === 'deposit' 
          ? bankroll.current + transaction.amount 
          : bankroll.current - transaction.amount,
        deposits: transaction.type === 'deposit' 
          ? [...bankroll.deposits, transaction]
          : bankroll.deposits,
        withdrawals: transaction.type === 'withdrawal'
          ? [...bankroll.withdrawals, transaction]
          : bankroll.withdrawals,
        history: [...bankroll.history, {
          date: transaction.date,
          balance: transaction.balance,
          change: transaction.type === 'deposit' ? transaction.amount : -transaction.amount
        }]
      };

      await this.saveUserProfile(userId, {
        ...profile,
        bankroll: updatedBankroll
      });

      return { success: true, bankroll: updatedBankroll };

    } catch (error) {
      console.error('Error updating bankroll:', error);
      return { success: false, error: error.message };
    }
  }

  // Save AI report
  async saveAIReport(userId, report) {
    try {
      const profile = await this.getUserProfile(userId);
      
      await this.saveUserProfile(userId, {
        ...profile,
        lastAIReport: {
          ...report,
          savedAt: new Date().toISOString()
        }
      });

      return { success: true };

    } catch (error) {
      console.error('Error saving AI report:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ProfileService();