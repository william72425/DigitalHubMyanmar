import React, { useState, useEffect } from 'react';
import { auth, db } from '@/utils/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [promoteCode, setPromoteCode] = useState('');
  const [promoteCodeValid, setPromoteCodeValid] = useState(null);
  const [promoteCodeDiscount, setPromoteCodeDiscount] = useState(0);
  const [promoteCodeType, setPromoteCodeType] = useState(null); // 'partner' or 'user'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Get promote code from URL (for referral)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setPromoteCode(ref);
    }
  }, []);

  // Generate random promote code for user
  const generatePromoteCode = () => {
    return 'HUBBY' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Check promote code validity
  const checkPromoteCode = async (code) => {
    if (!code.trim()) {
      setPromoteCodeValid(null);
      setPromoteCodeDiscount(0);
      setPromoteCodeType(null);
      return;
    }
    
    try {
      // First check if it's a partner promo code
      const partnerQuery = query(collection(db, 'promo_codes'), where('code', '==', code.toUpperCase()));
      const partnerSnapshot = await getDocs(partnerQuery);
      
      if (!partnerSnapshot.empty) {
        const promoData = partnerSnapshot.docs[0].data();
        if (promoData.is_active && promoData.used_count < promoData.usage_limit) {
          setPromoteCodeValid(true);
          setPromoteCodeDiscount(promoData.discount_percent || 0);
          setPromoteCodeType('partner');
          return;
        }
      }
      
      // Then check if it's a user promote code
      const userQuery = query(collection(db, 'users'), where('promote_code', '==', code.toUpperCase()));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        setPromoteCodeValid(true);
        setPromoteCodeDiscount(10); // 10% discount for user referral
        setPromoteCodeType('user');
        return;
      }
      
      setPromoteCodeValid(false);
      setPromoteCodeDiscount(0);
      setPromoteCodeType(null);
    } catch (error) {
      setPromoteCodeValid(false);
    }
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
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      const newPromoteCode = generatePromoteCode();
      let usedPromoteCode = null;
      let referredBy = null;
      let discountPercent = 0;
      
      // If promote code was used
      if (promoteCodeValid && promoteCode) {
        usedPromoteCode = promoteCode.toUpperCase();
        discountPercent = promoteCodeDiscount;
        
        // If it's a partner code, update usage count
        if (promoteCodeType === 'partner') {
          const partnerQuery = query(collection(db, 'promo_codes'), where('code', '==', usedPromoteCode));
          const partnerSnapshot = await getDocs(partnerQuery);
          if (!partnerSnapshot.empty) {
            const promoDoc = partnerSnapshot.docs[0];
            await updateDoc(doc(db, 'promo_codes', promoDoc.id), {
              used_count: (promoDoc.data().used_count || 0) + 1
            });
          }
        }
        
        // If it's a user code, record who referred
        if (promoteCodeType === 'user') {
          const userQuery = query(collection(db, 'users'), where('promote_code', '==', usedPromoteCode));
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            referredBy = userSnapshot.docs[0].id;
          }
        }
      }
      
      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        email: email,
        promote_code: newPromoteCode,
        used_promote_code: usedPromoteCode,
        referred_by: referredBy,
        discount_percent: discountPercent,
        discount_used: false,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      });
      
      // If referred by someone, add to referrals collection
      if (referredBy) {
        await setDoc(doc(db, 'referrals', Date.now().toString()), {
          referrer_id: referredBy,
          referred_user_id: user.uid,
          discount_percent: discountPercent,
          created_at: new Date().toISOString()
        });
      }
      
      if (usedPromoteCode && discountPercent > 0) {
        setMessage(`✅ Account created! You got ${discountPercent}% discount on your first purchase!`);
      } else {
        setMessage('✅ Account created! Share your promote code to get discounts!');
      }
      
      setTimeout(() => {
        setIsLogin(true);
        setPassword('');
        setPromoteCode('');
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
            {promoteCode && !isLogin && (
              <p className="text-[#FF6B35] text-xs mt-2">🎁 Promote code detected! You'll get discount on first purchase!</p>
            )}
          </div>

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
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); setPromoteCodeValid(null); }}
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
              
              {/* Promote Code Field - Only one field */}
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Promote Code (Optional)</label>
                <input
                  type="text"
                  value={promoteCode}
                  onChange={(e) => {
                    setPromoteCode(e.target.value);
                    checkPromoteCode(e.target.value);
                  }}
                  className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-[#FF6B35] outline-none"
                  placeholder="Enter promote code if you have"
                />
                {promoteCodeValid === true && (
                  <p className="text-green-400 text-xs mt-1">
                    ✅ Valid! You'll get {promoteCodeDiscount}% discount on first purchase!
                  </p>
                )}
                {promoteCodeValid === false && (
                  <p className="text-red-400 text-xs mt-1">
                    ❌ Invalid promote code
                  </p>
                )}
              </div>
              
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
