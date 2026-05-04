import React, { useState, useEffect } from 'react';
import { auth, db } from '@/utils/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [promoteCode, setPromoteCode] = useState('');
  const [promoteCodeValid, setPromoteCodeValid] = useState(null);
  const [promoteCodeDiscount, setPromoteCodeDiscount] = useState(0);
  const [promoteCodeType, setPromoteCodeType] = useState(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  // Check URL for referral code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setPromoteCode(ref);
      checkPromoteCode(ref);
    }
  }, []);

  const generatePromoteCode = () => {
    return 'HUBBY' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const checkPromoteCode = async (code) => {
    if (!code.trim()) {
      setPromoteCodeValid(null);
      setPromoteCodeDiscount(0);
      setPromoteCodeType(null);
      return;
    }
    
    setIsCheckingCode(true);
    setPromoteCodeValid(null);
    
    try {
      const promoQuery = query(collection(db, 'promo_codes'), where('code', '==', code.toUpperCase()));
      const promoSnapshot = await getDocs(promoQuery);
      
      if (!promoSnapshot.empty) {
        const promoData = promoSnapshot.docs[0].data();
        const discountValue = promoData.settings?.discount_value || 0;
        
        setPromoteCodeValid(true);
        setPromoteCodeDiscount(discountValue);
        setPromoteCodeType('partner');
        setIsCheckingCode(false);
        return;
      }
      
      const userQuery = query(collection(db, 'users'), where('promote_code', '==', code.toUpperCase()));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        setPromoteCodeValid(true);
        setPromoteCodeDiscount(15);
        setPromoteCodeType('user');
        setIsCheckingCode(false);
        return;
      }
      
      setPromoteCodeValid(false);
      setPromoteCodeDiscount(0);
      setPromoteCodeType(null);
    } catch (error) {
      console.error('Error checking promo code:', error);
      setPromoteCodeValid(false);
    }
    setIsCheckingCode(false);
  };

  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.match(/[a-z]/)) strength++;
    if (pass.match(/[0-9]/)) strength++;
    if (pass.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
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
    
    if (isCheckingCode) {
      setError('Please wait, validating promo code...');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      const newPromoteCode = generatePromoteCode();
      let usedPromoteCode = null;
      let referredBy = null;
      let discountPercent = 0;
      let promoValidUntil = null;
      let promoDurationDays = 0;
      
      if (promoteCodeValid && promoteCode) {
        usedPromoteCode = promoteCode.toUpperCase();
        discountPercent = promoteCodeDiscount;
        
        if (promoteCodeType === 'partner') {
          const promoQuery = query(collection(db, 'promo_codes'), where('code', '==', usedPromoteCode));
          const promoSnapshot = await getDocs(promoQuery);
          if (!promoSnapshot.empty) {
            const promoDoc = promoSnapshot.docs[0];
            await updateDoc(doc(db, 'promo_codes', promoDoc.id), {
              used_count: (promoDoc.data().used_count || 0) + 1
            });
            
            // 🆕 Get duration from promo code settings
            promoDurationDays = promoDoc.data().settings?.valid_duration_value || 30;
            const registeredAt = new Date();
            const validUntil = new Date(registeredAt);
            validUntil.setDate(validUntil.getDate() + promoDurationDays);
            promoValidUntil = validUntil.toISOString().split('T')[0];
          }
        }
        
        if (promoteCodeType === 'user') {
          const userQuery = query(collection(db, 'users'), where('promote_code', '==', usedPromoteCode));
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            referredBy = userSnapshot.docs[0].id;
            // Default 30 days for referral codes
            promoDurationDays = 30;
            const registeredAt = new Date();
            const validUntil = new Date(registeredAt);
            validUntil.setDate(validUntil.getDate() + 30);
            promoValidUntil = validUntil.toISOString().split('T')[0];
          }
        }
      }
      
      // 🆕 Save user with duration fields
      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        email: email,
        promote_code: newPromoteCode,
        used_promote_code: usedPromoteCode,
        referred_by: referredBy,
        discount_percent: discountPercent,
        discount_used: false,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        // 🆕 Duration tracking fields
        promo_registered_at: new Date().toISOString(),
        promo_valid_until: promoValidUntil,
        promo_duration_days: promoDurationDays
      });
      
      if (referredBy) {
        await setDoc(doc(db, 'referrals', Date.now().toString()), {
          referrer_id: referredBy,
          referred_user_id: user.uid,
          discount_percent: discountPercent,
          created_at: new Date().toISOString()
        });
      }
      
      if (usedPromoteCode && discountPercent > 0) {
        setMessage(`✅ Account created! You got ${discountPercent}% discount on your first purchase! Valid for ${promoDurationDays} days.`);
      } else {
        setMessage('✅ Account created! Share your promote code to get discounts!');
      }
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <>
      <Head><title>Digital Hub Myanmar - Login / Register</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
        
        {/* Animated Background Blobs */}
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 rounded-full bg-[#FF6B35]/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#00D4FF]/20 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Logo & Brand */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] shadow-lg mb-4">
              <span className="text-3xl font-black text-white">DH</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] bg-clip-text text-transparent">Digital Hub Myanmar</h1>
            <p className="text-gray-400 text-sm mt-2">Hubby Store Member Portal</p>
          </motion.div>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl backdrop-blur-sm">
            <button 
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }} 
              className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${isLogin ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); setPromoteCodeValid(null); }} 
              className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${!isLogin ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-sm text-center backdrop-blur-sm"
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {isLogin ? (
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin} 
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full p-3 rounded-xl bg-white/5 text-white border border-white/10 focus:border-[#FF6B35] outline-none transition-all focus:ring-2 focus:ring-[#FF6B35]/50" 
                    placeholder="your@email.com" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full p-3 rounded-xl bg-white/5 text-white border border-white/10 focus:border-[#FF6B35] outline-none transition-all focus:ring-2 focus:ring-[#FF6B35]/50" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : 'Login'}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form 
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleRegister} 
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    className="w-full p-3 rounded-xl bg-white/5 text-white border border-white/10 focus:border-[#FF6B35] outline-none transition-all focus:ring-2 focus:ring-[#FF6B35]/50" 
                    placeholder="Choose a username" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full p-3 rounded-xl bg-white/5 text-white border border-white/10 focus:border-[#FF6B35] outline-none transition-all focus:ring-2 focus:ring-[#FF6B35]/50" 
                    placeholder="your@email.com" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => { 
                      setPassword(e.target.value); 
                      checkPasswordStrength(e.target.value);
                    }} 
                    className="w-full p-3 rounded-xl bg-white/5 text-white border border-white/10 focus:border-[#FF6B35] outline-none transition-all focus:ring-2 focus:ring-[#FF6B35]/50" 
                    placeholder="At least 6 characters" 
                    required 
                  />
                  {password && (
                    <div className="mt-2 flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < passwordStrength ? 'bg-[#FF6B35]' : 'bg-white/20'}`} />
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Promo Code (Optional)</label>
                  <input 
                    type="text" 
                    value={promoteCode} 
                    onChange={(e) => { 
                      setPromoteCode(e.target.value); 
                      checkPromoteCode(e.target.value); 
                    }} 
                    className="w-full p-3 rounded-xl bg-white/5 text-white border border-white/10 focus:border-[#FF6B35] outline-none transition-all focus:ring-2 focus:ring-[#FF6B35]/50" 
                    placeholder="Enter promo code" 
                  />
                  <AnimatePresence>
                    {isCheckingCode && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Checking code...
                      </motion.p>
                    )}
                    {!isCheckingCode && promoteCodeValid === true && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 text-xs mt-1">
                        ✅ Valid! You'll get {promoteCodeDiscount}% OFF on first purchase!
                      </motion.p>
                    )}
                    {!isCheckingCode && promoteCodeValid === false && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">
                        ❌ Invalid promo code
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading || isCheckingCode} 
                  className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : 'Create Account'}
                </button>
              </div>
            </motion.form>
          )}
          
          <p className="text-center text-gray-500 text-xs mt-6">🔐 Secure authentication powered by Firebase</p>
        </div>
      </div>
    </>
  );
}
