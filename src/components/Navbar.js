import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function Navbar() {
  const router = useRouter();
  const { isDarkMode, toggleMode } = useTheme();
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setDrawerOpen(false);
    router.push('/auth');
  };

  // Only show navbar on the home page as requested
  if (router.pathname !== '/') return null;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#00D4FF] via-[#0072FF] to-[#00D4FF] bg-[length:200%_auto] animate-gradient-x">
                Digital Hub
              </span>
            </Link>
            
            <button 
              onClick={() => setDrawerOpen(true)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-90"
            >
              <span className="text-2xl text-white">&#9776;</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Professional Pop-up Menu */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-20 right-6 z-[70] w-[280px] bg-[#0a0f2a] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 px-2">Navigation</p>
                
                <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">🏠</span>
                  <span className="font-bold text-white">Main Page</span>
                </Link>

                <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
                  <span className="font-bold text-white">Referral Dashboard</span>
                </Link>

                <Link href="/orders" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">📦</span>
                  <span className="font-bold text-white">My Orders</span>
                </Link>

                <Link href="/profile" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group">
                  <span className="text-xl group-hover:scale-110 transition-transform">👤</span>
                  <span className="font-bold text-white">Account Profile</span>
                </Link>

                <div className="h-px bg-white/5 my-2 mx-2" />

                <button 
                  onClick={toggleMode}
                  className="w-full flex justify-between items-center p-4 rounded-2xl hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
                    <span className="font-bold text-white">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                </button>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group"
                >
                  <span className="text-xl group-hover:rotate-12 transition-transform">🚪</span>
                  <span className="font-bold">Log Out</span>
                </button>
              </div>

              <div className="p-4 bg-white/5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600">Digital Hub Myanmar</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
