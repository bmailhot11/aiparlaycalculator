// API endpoint to migrate existing localStorage profile data to Supabase
import { supabase } from '../../../utils/supabaseClient';
import ProfileService from '../../../lib/services/profileService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, localData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Check if user already has profile data in Supabase
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, betting_history, bankroll_data')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    // If user has data and no local data to migrate, return existing
    if (existingProfile && !localData) {
      return res.status(200).json({
        success: true,
        message: 'Profile already exists in Supabase',
        hasData: true,
        source: 'supabase'
      });
    }

    // If user has local data to migrate
    if (localData) {
      console.log(`Migrating profile data for user ${userId}...`);

      // Prepare data for Supabase format
      const profileUpdate = {
        user_id: userId,
        bio: localData.bio || '',
        profile_image_url: localData.profileImage || null,
        bankroll_data: localData.bankroll || {
          current: 1000,
          deposits: [],
          withdrawals: [],
          history: []
        },
        betting_history: localData.bets || [],
        dashboard_settings: localData.settings || {
          autoLogBets: false,
          notifications: true,
          publicProfile: false
        },
        last_ai_report: localData.lastAIReport || null,
        updated_at: new Date().toISOString()
      };

      // Migrate to Supabase
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert(profileUpdate, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('Migration error:', upsertError);
        return res.status(500).json({
          error: 'Failed to migrate profile data',
          details: upsertError.message
        });
      }

      console.log('Profile migration successful');

      return res.status(200).json({
        success: true,
        message: 'Profile data migrated successfully',
        migrated: {
          bets: (localData.bets || []).length,
          bankrollHistory: (localData.bankroll?.history || []).length,
          hasBio: !!localData.bio,
          hasProfileImage: !!localData.profileImage
        }
      });
    }

    // No existing data, create default profile
    const defaultProfile = {
      user_id: userId,
      bio: '',
      profile_image_url: null,
      bankroll_data: {
        current: 1000,
        deposits: [],
        withdrawals: [],
        history: []
      },
      betting_history: [],
      dashboard_settings: {
        autoLogBets: false,
        notifications: true,
        publicProfile: false
      },
      updated_at: new Date().toISOString()
    };

    const { error: createError } = await supabase
      .from('user_profiles')
      .upsert(defaultProfile, { onConflict: 'user_id' });

    if (createError) {
      console.error('Error creating default profile:', createError);
      return res.status(500).json({
        error: 'Failed to create default profile',
        details: createError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Default profile created',
      hasData: false,
      source: 'new'
    });

  } catch (error) {
    console.error('Profile migration error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}