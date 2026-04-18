import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function PartnerLogin() {
  const router = useRouter();
  const [promoCode, setPromoCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/partner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store session
      sessionStorage.setItem('partner_session', data.sessionToken);
      sessionStorage.setItem('partner_id', data.partnerId);
      sessionStorage.setItem('partner_name', data.partnerName);
      sessionStorage.setItem('promo_code', data.promoCode);
      sessionStorage.setItem('commission_percent', data.commissionPercent);

      // Redirect to dashboard
      router.push('/partner/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <>
      <Head><title>Partner Login | Digital Hub Myanmar</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">🤝 Partner Portal</h1>
            <p className="text-gray-400">Sign in to manage your commissions</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-8 backdrop-blur-sm">
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Promo Code Input */}
              <div>
                <label className="block text-white font-semibold mb-2">Promo Code</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter your promo code"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35] transition"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-white font-semibold mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35] transition"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-orange-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
              <p>Don't have access? Contact the admin for credentials.</p>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-xs text-center">
            🔒 Your login credentials are secure and encrypted.
          </div>
        </div>
      </div>
    </>
  );
}
