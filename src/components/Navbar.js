import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function Navbar() {
  const router = useRouter();
  const { isDarkMode, toggleMode } = useTheme();
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
        telegram_locked: true
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
      <nav className="fixed top-0 left-0 right-0 z-40" style={{ background: 'var(--surface)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black shadow-lg group-hover:scale-110 transition-transform" style={{ background: 'var(--accent-gradient)' }}>
                D
              </div>
              <span className="text-xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                Digital Hub <span style={{ color: 'var(--brand-secondary)' }}>MM</span>
              </span>
            </Link>
            
            <button 
              onClick={() => setDrawerOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all active:scale-90"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <span className="text-xl" style={{ color: 'var(--text-primary)' }}>&#9776;</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Right Side Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-[70] h-full w-[80%] md:w-[40%] lg:w-[30%] shadow-2xl flex flex-col"
              style={{ background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)' }}
            >
              <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <h2 className="text-lg font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Menu</h2>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
                >
                  &#10005;
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--text-muted)' }}>Main Navigation</p>
                  {[
                    { href: '/', icon: '🏠', label: 'Main Page' },
                    { href: '/dashboard', icon: '📊', label: 'Referral Dashboard' },
                    { href: '/orders', icon: '📦', label: 'My Orders' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 p-4 transition-all group" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                      <span className="text-xl group-hover:scale-125 transition-transform">{item.icon}</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link href="/admin-dashboard" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 p-4 transition-all group" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                      <span className="text-xl group-hover:scale-125 transition-transform">🛠️</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Admin Panel</span>
                    </Link>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--text-muted)' }}>Account Profile</p>
                  <div className="p-5 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Username</label>
                      <p className="text-sm font-bold p-3 opacity-70 cursor-not-allowed" style={{ color: 'var(--text-primary)', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        {userData?.username || 'User'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                      <p className="text-sm font-bold p-3 opacity-70 cursor-not-allowed" style={{ color: 'var(--text-primary)', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        {user?.email || 'email@example.com'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>Telegram Username</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          disabled={userData?.telegram_locked || isUpdating}
                          placeholder="@username"
                          className={`flex-1 text-sm font-bold p-3 focus:outline-none transition-all ${userData?.telegram_locked ? 'opacity-70 cursor-not-allowed' : ''}`}
                          style={{ color: 'var(--text-primary)', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                        />
                        {!userData?.telegram_locked && (
                          <button 
                            onClick={updateTelegram}
                            disabled={!telegram || isUpdating}
                            className="px-4 font-bold text-xs disabled:opacity-50 transition-all theme-btn-primary"
                          >
                            {isUpdating ? '...' : 'Save'}
                          </button>
                        )}
                      </div>
                      {userData?.telegram_locked && (
                        <p className="text-[9px] mt-2 italic" style={{ color: 'var(--text-muted)' }}>* အချက်အလက်ပြင်ဆင်ရန် Admin ဆီသို့ တိုက်ရိုက်ပြောပေးပါ</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--text-muted)' }}>Settings</p>
                  <button 
                    onClick={toggleMode}
                    className="w-full flex justify-between items-center p-4 transition-all"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                    <div className="w-10 h-5 rounded-full relative transition-all" style={{ background: isDarkMode ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
                    </div>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 p-4 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all group"
                    style={{ borderRadius: 'var(--radius-lg)' }}
                  >
                    <span className="text-xl group-hover:rotate-12 transition-transform">🚪</span>
                    <span className="font-bold text-red-400">Log Out</span>
                  </button>
                </div>
              </div>

              <div className="p-6 text-center" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>Digital Hub Myanmar v2.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
