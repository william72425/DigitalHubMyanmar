import React, { useState, useEffect } from 'react';
import { auth, db } from '@/utils/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Get referral code from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      localStorage.setItem('referrer_code', ref);
    }
  }, []);

  // Generate random referral code
  const generateReferralCode = () => {
    return 'HUBBY' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      // Create user in Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      const newReferralCode = generateReferralCode();
      
      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        email: email,
        referral_code: newReferralCode,
        referred_by: referralCode || null,
        created_at: new Date().toISOString(),
        discount_used: false
      });
      
      // If referred by someone, add to referrals collection
      if (referralCode) {
        await setDoc(doc(db, 'referrals', Date.now().toString()), {
          referrer_code: referralCode,
          referred_user_id: user.uid,
          created_at: new Date().toISOString()
        });
        
        // Give discount to referrer (optional)
        setMessage('✅ Account created! You were referred!');
      } else {
        setMessage('✅ Account created! Share your referral code!');
      }
      
      // Clear form and switch to login
      setTimeout(() => {
        setIsLogin(true);
        setPassword('');
        setMessage('');
      }, 2000);
      
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Login | Digital Hub Myanmar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] bg-clip-text text-transparent">
              Digital Hub Myanmar
            </h1>
            <p className="text-gray-400 text-sm mt-2">Hubby Store Member Login</p>
            {referralCode && (
              <p className="text-[#FF6B35] text-xs mt-2">🎁 You were invited! Get 10% off on sign up!</p>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                isLogin 
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white shadow-lg' 
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                !isLogin 
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white shadow-lg' 
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-600/20 border border-red-500 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-600/20 border border-green-500 rounded-xl text-green-400 text-sm text-center">
              {message}
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <motion.form
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleLogin}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-[#FF6B35] outline-none"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-300 text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-[#FF6B35] outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </motion.form>
          ) : (
            // Register Form
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleRegister}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-[#FF6B35] outline-none"
                  placeholder="Choose a username"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-[#FF6B35] outline-none"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-[#FF6B35] outline-none"
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              {referralCode && (
                <div className="mb-4 p-2 bg-[#FF6B35]/20 rounded-lg">
                  <p className="text-[#FF6B35] text-xs text-center">🎉 You're joining with referral! Get 10% off!</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </motion.form>
          )}

          <p className="text-center text-gray-500 text-xs mt-6">
            🔐 Browser will ask to save password
          </p>
        </div>
      </div>
    </>
  );
    }
