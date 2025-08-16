import { useState } from 'react';
import { Mail, Key, CheckCircle, AlertCircle } from 'lucide-react';

export default function PremiumRestore() {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleRestore = async (e) => {
    e.preventDefault();
    setRestoring(true);
    setError('');

    try {
      const response = await fetch('/api/restore-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, accessCode }),
      });

      const result = await response.json();

      if (result.success) {
        // Restore premium in localStorage
        localStorage.setItem('isPremium', 'true');
        localStorage.setItem('premiumEmail', email);
        localStorage.setItem('accessCode', accessCode);
        setSuccess(true);
        
        // Refresh page to update UI
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setError(result.message || 'Failed to restore premium access');
      }
    } catch (err) {
      console.error('Premium restore error:', err);
      setError('Network error. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  if (success) {
    return (
      <div className="text-center p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
        <h3 className="text-lg font-semibold text-green-400 mb-2">Premium Restored!</h3>
        <p className="text-green-300">Your premium access has been restored. Page will reload...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
        <Key className="w-5 h-5 text-green-400" />
        Restore Premium Access
      </h3>
      
      <p className="text-gray-300 mb-6 text-sm">
        Enter the email and access code from your premium purchase to restore your account.
      </p>
      
      <form onSubmit={handleRestore} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-900 text-white placeholder-gray-400"
            placeholder="Enter your email from purchase"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Key className="w-4 h-4" />
            Access Code
          </label>
          <input
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-900 text-white placeholder-gray-400 font-mono tracking-wider"
            placeholder="XXXXXXXX"
            maxLength={8}
            style={{ textTransform: 'uppercase' }}
            required
          />
          <p className="text-xs text-gray-500 mt-1">8-character code from your purchase email</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={restoring || !email || !accessCode}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {restoring ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Restoring...
            </div>
          ) : (
            'Restore Premium Access'
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-600">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Need Help?</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Check your email for the 8-character access code after purchase</p>
          <p>• Access codes are valid for 30 days after purchase</p>
          <p>• Lost your code? Contact support with your purchase email</p>
          <p>• Issues? Email: support@betgenius.com</p>
        </div>
      </div>
    </div>
  );
}