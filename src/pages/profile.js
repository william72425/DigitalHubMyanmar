import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [telegram, setTelegram] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push('/auth');
        return;
      }
      setUser(currentUser);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setTelegram(data.telegram_username || '');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

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

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Account Profile | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#020617]' : 'bg-gray-50'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-8 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-xl'}`}
          >
            <h1 className={`text-3xl font-black mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>👤 Account Profile</h1>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Username</label>
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'} font-bold opacity-70`}>
                  {userData?.username || 'User'}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Email Address</label>
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'} font-bold opacity-70`}>
                  {user?.email || 'email@example.com'}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Telegram Username</label>
                <div className="flex gap-3">
                  <input 
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    disabled={userData?.telegram_locked || isUpdating}
                    placeholder="@username"
                    className={`flex-1 p-4 rounded-2xl border transition-all focus:outline-none ${
                      isDarkMode 
                        ? 'bg-white/5 border-white/10 text-white focus:border-[#FF6B35]/50' 
                        : 'bg-white border-gray-200 text-gray-800 focus:border-[#FF6B35]'
                    } ${userData?.telegram_locked ? 'opacity-70 cursor-not-allowed' : ''} font-bold`}
                  />
                  {!userData?.telegram_locked && (
                    <button 
                      onClick={updateTelegram}
                      disabled={!telegram || isUpdating}
                      className="bg-[#FF6B35] text-white px-8 rounded-2xl font-bold hover:bg-[#FF8C35] disabled:opacity-50 transition-all shadow-lg shadow-[#FF6B35]/20"
                    >
                      {isUpdating ? '...' : 'Save'}
                    </button>
                  )}
                </div>
                {userData?.telegram_locked && (
                  <p className="text-xs text-gray-500 mt-3 italic">* ပြန်ပြင်ချင်ပါက Admin ကို ပြောပေးပါ</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
