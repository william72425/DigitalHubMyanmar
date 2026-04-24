import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ isDarkMode, toggleTheme }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [telegram, setTelegram] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setTelegram(data.telegram_username || '');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setDrawerOpen(false);
    router.push('/auth');
  };

  const updateTelegram = async () => {
    if (!telegram || isUpdating) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        telegram_username: telegram,
        telegram_locked: true // Lock after first update
      });
      setUserData({ ...userData, telegram_username: telegram, telegram_locked: true });
      alert('Telegram username saved successfully!');
    } catch (error) {
      alert('Failed to update telegram username');
    }
    setIsUpdating(false);
  };

  const isAdmin = user?.email === 'thantzin84727@gmail.com';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF8C35] flex items-center justify-center text-white font-black shadow-lg shadow-[#FF6B35]/20 group-hover:scale-110 transition-transform">
                D
              </div>
              <span className="text-xl font-black tracking-tighter text-white">
                Digital Hub <span className="text-[#FF6B35]">MM</span>
              </span>
            </Link>
            
            <button 
              onClick={() => setDrawerOpen(true)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
            >
              <span className="text-xl">☰</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Right Side Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
            />
            
            {/* Drawer Content */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-[70] h-full w-[80%] md:w-[40%] lg:w-[30%] bg-[#020617] border-l border-white/10 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Menu</h2>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Section 1: Navigation */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Main Navigation</p>
                  <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-[#FF6B35]/10 hover:border-[#FF6B35]/30 transition-all group">
                    <span className="text-xl group-hover:scale-125 transition-transform">🏠</span>
                    <span className="font-bold text-gray-200">Main Page</span>
                  </Link>
                  <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-[#FF6B35]/10 hover:border-[#FF6B35]/30 transition-all group">
                    <span className="text-xl group-hover:scale-125 transition-transform">📊</span>
                    <span className="font-bold text-gray-200">Referral Dashboard</span>
                  </Link>
                  <Link href="/orders" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-[#FF6B35]/10 hover:border-[#FF6B35]/30 transition-all group">
                    <span className="text-xl group-hover:scale-125 transition-transform">📦</span>
                    <span className="font-bold text-gray-200">My Orders</span>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin-dashboard" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group">
                      <span className="text-xl group-hover:scale-125 transition-transform">🔧</span>
                      <span className="font-bold text-gray-200">Admin Panel</span>
                    </Link>
                  )}
                </div>

                {/* Section 2: Account Profile */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Account Profile</p>
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Username</label>
                      <p className="text-sm font-bold text-white bg-white/5 p-3 rounded-xl border border-white/5 opacity-70 cursor-not-allowed">
                        {userData?.username || 'User'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Email Address</label>
                      <p className="text-sm font-bold text-white bg-white/5 p-3 rounded-xl border border-white/5 opacity-70 cursor-not-allowed">
                        {user?.email || 'email@example.com'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Telegram Username</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          disabled={userData?.telegram_locked || isUpdating}
                          placeholder="@username"
                          className={`flex-1 text-sm font-bold text-white bg-white/5 p-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#FF6B35]/50 transition-all ${userData?.telegram_locked ? 'opacity-70 cursor-not-allowed' : ''}`}
                        />
                        {!userData?.telegram_locked && (
                          <button 
                            onClick={updateTelegram}
                            disabled={!telegram || isUpdating}
                            className="bg-[#FF6B35] text-white px-4 rounded-xl font-bold text-xs hover:bg-[#FF8C35] disabled:opacity-50 transition-all"
                          >
                            {isUpdating ? '...' : 'Save'}
                          </button>
                        )}
                      </div>
                      {userData?.telegram_locked && (
                        <p className="text-[9px] text-gray-500 mt-2 italic">* ပြန်ပြင်ချင်ပါက Admin ကို ပြောပေးပါ</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Settings */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Settings</p>
                  <button 
                    onClick={toggleTheme}
                    className="w-full flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
                      <span className="font-bold text-gray-200">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-all ${isDarkMode ? 'bg-[#FF6B35]' : 'bg-gray-600'}`}>
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
                    </div>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all group"
                  >
                    <span className="text-xl group-hover:rotate-12 transition-transform">🚪</span>
                    <span className="font-bold text-red-400">Log Out</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-white/10 bg-white/5 text-center">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">Digital Hub Myanmar v2.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
