import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { useTheme } from '@/context/ThemeContext';

export default function GiveawayPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { isDarkMode, toggleMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [giveaways, setGiveaways] = useState([]);
  const [userEntries, setUserEntries] = useState({});
  const [selectedGiveaway, setSelectedGiveaway] = useState(null);
  const [showEntries, setShowEntries] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);
      await loadGiveaways();
      await loadUserEntries(user.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadGiveaways = async () => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'promo_codes'),
      where('option_type', '==', 'giveaway'),
      where('is_active', '==', true)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter active giveaways by date
    const active = list.filter(g => {
      const endDate = g.settings?.end_date;
      return !endDate || endDate >= today;
    });
    setGiveaways(active);
  };

  const loadUserEntries = async (userId) => {
    const entries = {};
    for (const giveaway of giveaways) {
      const q = query(
        collection(db, 'giveaway_entries'),
        where('giveaway_id', '==', giveaway.id),
        where('user_id', '==', userId)
      );
      const snapshot = await getDocs(q);
      entries[giveaway.id] = snapshot.size;
    }
    setUserEntries(entries);
  };

  const enterGiveaway = async (giveaway) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    // Check if user already entered
    const q = query(
      collection(db, 'giveaway_entries'),
      where('giveaway_id', '==', giveaway.id),
      where('user_id', '==', user.uid)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.size > 0) {
      alert('You already entered this giveaway!');
      return;
    }
    
    await addDoc(collection(db, 'giveaway_entries'), {
      giveaway_id: giveaway.id,
      user_id: user.uid,
      promo_code: giveaway.code,
      entry_date: new Date().toISOString()
    });
    
    alert('Successfully entered giveaway!');
    await loadUserEntries(user.uid);
  };

  const viewEntries = async (giveaway) => {
    setSelectedGiveaway(giveaway);
    setShowEntries(true);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Giveaways | Digital Hub Myanmar</title></Head>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-primary))' }}>
        <Navbar />
        
        <div className="container mx-auto px-4 py-24 max-w-6xl">
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🎁 Active Giveaways</h1>
          
          {giveaways.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
              <p className="text-gray-400">No active giveaways at the moment. Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {giveaways.map((giveaway) => (
                <div key={giveaway.id} className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                  <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {giveaway.settings?.giveaway_name || 'Giveaway'}
                  </h2>
                  <p className="text-sm text-gray-400 mb-4">
                    Draw Date: {giveaway.settings?.draw_date || 'TBA'}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {giveaway.settings?.grand_prize_name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-500">🏆 Grand Prize</span>
                        <span>{giveaway.settings.grand_prize_name} ({giveaway.settings.grand_prize_quantity || 1})</span>
                      </div>
                    )}
                    {giveaway.settings?.first_prize_name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">🥇 1st Prize</span>
                        <span>{giveaway.settings.first_prize_name} ({giveaway.settings.first_prize_quantity || 1})</span>
                      </div>
                    )}
                    {giveaway.settings?.second_prize_name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">🥈 2nd Prize</span>
                        <span>{giveaway.settings.second_prize_name} ({giveaway.settings.second_prize_quantity || 1})</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                    <div className="text-sm">
                      <span className="text-gray-400">Your entries: </span>
                      <span className="text-[#FF6B35] font-bold">{userEntries[giveaway.id] || 0}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => enterGiveaway(giveaway)}
                        disabled={userEntries[giveaway.id] > 0}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          userEntries[giveaway.id] > 0
                            ? 'bg-gray-500 cursor-not-allowed'
                            : 'bg-[#FF6B35] hover:opacity-90'
                        } text-white transition`}
                      >
                        {userEntries[giveaway.id] > 0 ? 'Already Entered' : 'Enter Giveaway'}
                      </button>
                      <button
                        onClick={() => viewEntries(giveaway)}
                        className="px-4 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20 transition"
                      >
                        View Winners
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Winners Modal */}
      {showEntries && selectedGiveaway && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Winners - {selectedGiveaway.settings?.giveaway_name}
              </h2>
              <button onClick={() => setShowEntries(false)} className="text-gray-400 text-2xl">&times;</button>
            </div>
            <p className="text-gray-400 text-sm mb-4">Draw date: {selectedGiveaway.settings?.draw_date || 'Not scheduled yet'}</p>
            <div className="text-center py-8">
              <p className="text-gray-400">Winners will be announced on the draw date.</p>
            </div>
            <button onClick={() => setShowEntries(false)} className="w-full bg-[#FF6B35] text-white p-2 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
