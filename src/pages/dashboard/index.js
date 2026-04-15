import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [referralStats, setReferralStats] = useState({ count: 0, earnings: 0 });
  const [activeGiveaways, setActiveGiveaways] = useState([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else if (savedTheme === 'dark') setIsDarkMode(true);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);
      await loadUserData(user.uid);
      await loadReferralStats(user.uid);
      await loadActiveGiveaways();
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      setUserData(userDoc.data());
    }
  };

  const loadReferralStats = async (userId) => {
    const q = query(collection(db, 'users'), where('referred_by', '==', userId));
    const snapshot = await getDocs(q);
    setReferralStats({
      count: snapshot.size,
      earnings: snapshot.size * 5000 // 5000 MMK per referral (example)
    });
  };

  const loadActiveGiveaways = async () => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, 'promo_codes'), where('option_type', '==', 'giveaway'), where('is_active', '==', true));
    const snapshot = await getDocs(q);
    const giveaways = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setActiveGiveaways(giveaways);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
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

  const inviteLink = `${window.location.origin}/auth?ref=${userData?.promote_code || ''}`;

  return (
    <>
      <Head><title>My Dashboard | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-6xl">
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>👋 Welcome, {userData?.username || user?.email}</h1>
          
          {/* Promote Code Section */}
          <div className={`rounded-2xl p-6 mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🎁 Your Promote Code</h2>
            <div className="flex flex-wrap gap-3 items-center">
              <code className={`px-4 py-2 rounded-lg font-mono text-lg ${isDarkMode ? 'bg-black/30 text-[#FF6B35]' : 'bg-gray-100 text-[#FF6B35]'}`}>
                {userData?.promote_code || 'Loading...'}
              </code>
              <button onClick={() => copyToClipboard(userData?.promote_code)} className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg">📋 Copy Code</button>
              <button onClick={() => copyToClipboard(inviteLink)} className="bg-green-600 text-white px-4 py-2 rounded-lg">🔗 Copy Invite Link</button>
            </div>
            <p className="text-sm text-gray-400 mt-3">Share your code with friends. When they register, you'll earn rewards!</p>
          </div>
          
          {/* Referral Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>👥 Referrals</h2>
              <div className="text-center">
                <div className={`text-5xl font-bold ${isDarkMode ? 'text-[#FF6B35]' : 'text-[#FF6B35]'}`}>{referralStats.count}</div>
                <p className="text-gray-400 mt-2">Friends joined</p>
              </div>
            </div>
            <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>💰 Total Earnings</h2>
              <div className="text-center">
                <div className={`text-5xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{referralStats.earnings.toLocaleString()} MMK</div>
                <p className="text-gray-400 mt-2">From referrals</p>
              </div>
            </div>
          </div>
          
          {/* Active Giveaways */}
          {activeGiveaways.length > 0 && (
            <div className={`rounded-2xl p-6 mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🎁 Active Giveaways</h2>
              <div className="space-y-3">
                {activeGiveaways.map((giveaway) => (
                  <div key={giveaway.id} className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{giveaway.settings?.giveaway_name || 'Giveaway'}</h3>
                        <p className="text-sm text-gray-400">Draw Date: {giveaway.settings?.draw_date || 'TBA'}</p>
                      </div>
                      <Link href="/giveaway" className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg text-sm">View Details</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick Links */}
          <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🔗 Quick Links</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} transition`}>🛍️ Browse Products</Link>
              <Link href="/giveaway" className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} transition`}>🎁 Giveaways</Link>
              <Link href="/orders" className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} transition`}>📦 My Orders</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
