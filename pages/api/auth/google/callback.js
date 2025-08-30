// Google OAuth callback - exchanges code for tokens and creates Supabase session
import { supabaseAuth } from '../../../../utils/supabaseAuth';

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    console.error('Google OAuth error:', error);
    return res.redirect(`/auth/signin?error=oauth_error&message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect('/auth/signin?error=no_code');
  }

  try {
    // Exchange code for Google tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.NODE_ENV === 'production'
          ? 'https://betchekr.com/api/auth/google/callback'
          : `${req.headers.host?.includes('localhost') ? 'http' : 'https'}://${req.headers.host}/api/auth/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to get user info: ${userResponse.status}`);
    }

    const googleUser = await userResponse.json();

    // Check if user already exists
    const { data: existingUsers } = await supabaseAuth.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === googleUser.email);

    let user;
    if (existingUser) {
      // Update existing user
      const { data: updatedUser } = await supabaseAuth.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          full_name: googleUser.name,
          avatar_url: googleUser.picture,
          provider: 'google',
          provider_id: googleUser.id,
        },
      });
      user = updatedUser.user;
    } else {
      // Create new user
      const { data: newUser } = await supabaseAuth.auth.admin.createUser({
        email: googleUser.email,
        email_confirm: true,
        user_metadata: {
          full_name: googleUser.name,
          avatar_url: googleUser.picture,
          provider: 'google',
          provider_id: googleUser.id,
        },
      });
      user = newUser.user;
    }

    if (user) {
      // Create a proper Supabase session
      const sessionData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        token_type: 'bearer',
        user: user
      };

      // Set session cookies for Supabase client
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      
      res.setHeader('Set-Cookie', [
        `sb-access-token=${tokens.access_token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`,
        `sb-refresh-token=${tokens.refresh_token || ''}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`,
        `sb-provider-token=${tokens.access_token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      ]);
    }

    // Redirect to intended destination
    const redirectTo = state || '/';
    res.redirect(redirectTo);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`/auth/signin?error=callback_failed&message=${encodeURIComponent(error.message)}`);
  }
}