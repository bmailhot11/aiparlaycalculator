import { useState } from 'react';
import { Mail, Key, CheckCircle } from 'lucide-react';

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
      setError('Network error. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  if (success) {
    return (
      <div className="text-center p-6 bg-green-50 border border-green-200 rounded-xl">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">Premium Restored!</h3>
        <p className="text-green-600">Your premium access has been restored. Page will reload...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Key className="w-5 h-5 text-blue-600" />
        Restore Premium Access
      </h3>
      
      <form onSubmit={handleRestore} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your email from purchase"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Access Code
          </label>
          <input
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your 8-character code"
            maxLength={8}
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={restoring}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {restoring ? 'Restoring...' : 'Restore Premium'}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>• Check your email for the access code after purchase</p>
        <p>• Lost your code? Contact support with your email</p>
      </div>
    </div>
  );
}