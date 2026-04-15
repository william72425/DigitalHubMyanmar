import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminUsers() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCodeUsers, setSelectedCodeUsers] = useState([]);
  const [showCodeUsers, setShowCodeUsers] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else if (savedTheme === 'dark') setIsDarkMode(true);
    
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (adminAuth !== 'true') { router.push('/admin'); return; }
    fetchUsers();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(list);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const viewCodeUsers = async (code) => {
    const q = query(collection(db, 'users'), where('used_promote_code', '==', code));
    const snapshot = await getDocs(q);
    setSelectedCodeUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setShowCodeUsers(true);
  };

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <>
      <Head><title>Admin - Users</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <AdminNavbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        <div className="container mx-auto px-4 py-24 max-w-7xl">
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>👥 Users</h1>
          <div className={`rounded-2xl p-4 overflow-x-auto ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
            <table className="w-full text-sm">
              <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                <tr>
                  <th className="text-left py-2 px-2">Username</th>
                  <th className="text-left py-2 px-2">Email</th>
                  <th className="text-left py-2 px-2">Promote Code</th>
                  <th className="text-left py-2 px-2">Used Promo</th>
                  <th className="text-left py-2 px-2">Discount %</th>
                  <th className="text-left py-2 px-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/10">
                    <td className="py-2 px-2">{user.username || '-'}</td>
                    <td className="py-2 px-2">{user.email}</td>
                    <td className="py-2 px-2 font-mono text-xs">{user.promote_code || '-'}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => user.used_promote_code && viewCodeUsers(user.used_promote_code)} className="text-blue-400 text-xs">
                        {user.used_promote_code || '-'}
                      </button>
                    </td>
                    <td className="py-2 px-2 text-green-400">{user.discount_percent || 0}%</td>
                    <td className="py-2 px-2 text-xs">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCodeUsers && (<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className={`rounded-2xl p-6 w-full max-w-2xl ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20`}><div className="flex justify-between items-center mb-4"><h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Users who used this code</h2><button onClick={() => setShowCodeUsers(false)} className="text-gray-400 text-2xl">&times;</button></div><table className="w-full text-sm"><thead className="border-b border-white/20"><tr><th className="text-left py-2">Username</th><th className="text-left py-2">Email</th></tr></thead><tbody>{selectedCodeUsers.map((user) => (<tr key={user.id}><td className="py-2">{user.username || '-'}</td><td className="py-2">{user.email}</td></tr>))}</tbody></table><button onClick={() => setShowCodeUsers(false)} className="w-full bg-[#FF6B35] text-white p-2 rounded-lg mt-4">Close</button></div></div>)}
    </>
  );
}
