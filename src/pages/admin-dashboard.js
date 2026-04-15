import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';

export default function AdminDashboard() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [users, setUsers] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [newCode, setNewCode] = useState({ code: '', discount_percent: 10, usage_limit: 100 });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else if (savedTheme === 'dark') setIsDarkMode(true);
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user || user.email !== 'thantzin84727@gmail.com') {
        router.push('/');
        return;
      }
      await fetchData();
    });
    
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
      
      const promoSnapshot = await getDocs(collection(db, 'promo_codes'));
      const promoList = promoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPromoCodes(promoList);
    } catch (error) {
      alert('Failed to load data');
    }
    setLoading(false);
  };

  const addPromoCode = async () => {
    if (!newCode.code.trim()) {
      alert('Please enter a promo code');
      return;
    }
    
    try {
      await addDoc(collection(db, 'promo_codes'), {
        code: newCode.code.toUpperCase(),
        discount_percent: newCode.discount_percent,
        usage_limit: newCode.usage_limit,
        used_count: 0,
        is_active: true,
        created_by: 'admin',
        created_at: new Date().toISOString()
      });
      alert('Promo code added!');
      setNewCode({ code: '', discount_percent: 10, usage_limit: 100 });
      fetchData();
    } catch (error) {
      alert('Failed to add promo code');
    }
  };

  const deletePromoCode = async (id) => {
    if (confirm('Delete this promo code?')) {
      await deleteDoc(doc(db, 'promo_codes', id));
      alert('Deleted!');
      fetchData();
    }
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
      <Head><title>Admin Dashboard | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-7xl">
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🔧 Admin Dashboard</h1>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/20 pb-2 flex-wrap">
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg ${activeTab === 'users' ? 'bg-[#FF6B35] text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              👥 Users ({users.length})
            </button>
            <button onClick={() => setActiveTab('promo')} className={`px-4 py-2 rounded-lg ${activeTab === 'promo' ? 'bg-[#FF6B35] text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              🏷️ Promo Codes ({promoCodes.length})
            </button>
          </div>
          
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className={`rounded-2xl p-4 overflow-x-auto ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
              <table className="w-full text-sm">
                <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                  <tr>
                    <th className="text-left py-2 px-2">Username</th>
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-left py-2 px-2">Referral Code</th>
                    <th className="text-left py-2 px-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/10">
                      <td className="py-2 px-2">{user.username || '-'}</td>
                      <td className="py-2 px-2">{user.email}</td>
                      <td className="py-2 px-2 text-xs font-mono">{user.referral_code || '-'}</td>
                      <td className="py-2 px-2 text-xs">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Promo Codes Tab */}
          {activeTab === 'promo' && (
            <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
              <div className={`p-4 rounded-xl mb-6 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>+ Add New Promo Code</h3>
                <div className="flex flex-wrap gap-3">
                  <input type="text" placeholder="Code" value={newCode.code} onChange={(e) => setNewCode({...newCode, code: e.target.value})} className={`px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-800'} border border-white/20`} />
                  <input type="number" placeholder="Discount %" value={newCode.discount_percent} onChange={(e) => setNewCode({...newCode, discount_percent: parseInt(e.target.value)})} className="w-24 px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20" />
                  <input type="number" placeholder="Limit" value={newCode.usage_limit} onChange={(e) => setNewCode({...newCode, usage_limit: parseInt(e.target.value)})} className="w-28 px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20" />
                  <button onClick={addPromoCode} className="bg-green-600 text-white px-4 py-2 rounded-lg">Add</button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                    <tr>
                      <th className="text-left py-2 px-2">Code</th>
                      <th className="text-left py-2 px-2">Discount</th>
                      <th className="text-left py-2 px-2">Used/Limit</th>
                      <th className="text-left py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((code) => (
                      <tr key={code.id} className="border-b border-white/10">
                        <td className="py-2 px-2 font-mono">{code.code}</td>
                        <td className="py-2 px-2">{code.discount_percent}%</td>
                        <td className="py-2 px-2">{code.used_count || 0} / {code.usage_limit}</td>
                        <td className="py-2 px-2">
                          <button onClick={() => deletePromoCode(code.id)} className="text-red-400">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
