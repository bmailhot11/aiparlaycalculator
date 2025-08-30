// Direct Google OAuth handler (bypasses Supabase proxy)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Google Client ID not configured' });
  }

  // Build direct Google OAuth URL
  const redirectUri = process.env.NODE_ENV === 'production' 
    ? 'https://betchekr.com/api/auth/google/callback'
    : `${req.headers.host?.includes('localhost') ? 'http' : 'https'}://${req.headers.host}/api/auth/google/callback`;

  const googleAuthUrl = 'https://accounts.google.com/oauth/authorize?' + 
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: req.query.redirect || '/' // Where to go after auth
    });

  // Redirect directly to Google (user will see "betchekr.com wants access")
  res.redirect(googleAuthUrl);
}