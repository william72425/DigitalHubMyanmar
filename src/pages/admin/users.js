import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db } from '@/utils/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import AdminNavbar from '@/components/AdminNavbar';
import { useTheme } from '@/context/ThemeContext';

export default function AdminUsers() {
  const router = useRouter();
  const { isDarkMode, toggleMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, daily, weekly, monthly, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [selectedCodeUsers, setSelectedCodeUsers] = useState([]);
  const [showCodeUsers, setShowCodeUsers] = useState(false);

  useEffect(() => {
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Fetch all completed orders for purchase amount calculation
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersList = ordersSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          let createdAtDate = new Date();
          
          if (data.created_at) {
            if (typeof data.created_at.toDate === 'function') {
              createdAtDate = data.created_at.toDate();
            } else {
              createdAtDate = new Date(data.created_at);
            }
          }

          return { 
            id: doc.id, 
            ...data,
            created_at: createdAtDate
          };
        })
        .filter(o => o.status === 'completed');
      
      setUsers(usersList);
      setOrders(ordersList);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
    setLoading(false);
  };

  const getFilteredOrders = () => {
    if (filterPeriod === 'all') return orders;
    
    const now = new Date();
    let start = new Date();
    
    if (filterPeriod === 'daily') {
      start.setHours(0, 0, 0, 0);
    } else if (filterPeriod === 'weekly') {
      start.setDate(now.getDate() - 7);
    } else if (filterPeriod === 'monthly') {
      start.setMonth(now.getMonth() - 1);
    } else if (filterPeriod === 'custom') {
      if (customStartDate) start = new Date(customStartDate);
      let end = customEndDate ? new Date(customEndDate) : new Date();
      end.setHours(23, 59, 59, 999);
      return orders.filter(o => o.created_at >= start && o.created_at <= end);
    }
    
    return orders.filter(o => o.created_at >= start);
  };

  const calculateUserTotal = (userId) => {
    const filteredOrders = getFilteredOrders();
    return filteredOrders
      .filter(o => o.user_id === userId)
      .reduce((sum, o) => sum + (Number(o.final_price) || 0), 0);
  };


  const viewCodeUsers = async (code) => {
    const q = query(collection(db, 'users'), where('used_promote_code', '==', code));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSelectedCodeUsers(list);
    setShowCodeUsers(true);
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
      <Head><title>Admin - Users | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <AdminNavbar />
        
        <div className="container mx-auto px-4 py-24 max-w-7xl">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>👥 Users ({users.length})</h1>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={filterPeriod} 
                onChange={(e) => setFilterPeriod(e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm border-2 ${isDarkMode ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
              >
                <option value="all">All Time</option>
                <option value="daily">Today</option>
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
                <option value="custom">Custom Period</option>
              </select>
              
              {filterPeriod === 'custom' && (
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={customStartDate} 
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className={`px-2 py-1 rounded text-sm ${isDarkMode ? 'bg-white/10 text-white border-white/10' : 'bg-white text-gray-800 border-gray-200'}`}
                  />
                  <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>to</span>
                  <input 
                    type="date" 
                    value={customEndDate} 
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className={`px-2 py-1 rounded text-sm ${isDarkMode ? 'bg-white/10 text-white border-white/10' : 'bg-white text-gray-800 border-gray-200'}`}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-2xl p-4 overflow-x-auto ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 shadow-sm border border-gray-200'}`}>
            <table className="w-full text-sm">
              <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                <tr className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  <th className="text-left py-3 px-2">Username</th>
                  <th className="text-left py-3 px-2">Email</th>
                  <th className="text-left py-3 px-2">Promote Code</th>
                  <th className="text-left py-3 px-2">Used Promo</th>
                  <th className="text-right py-3 px-2">Purchase Amount</th>
                  <th className="text-center py-3 px-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map((user) => {
                  const totalPurchase = calculateUserTotal(user.id);
                  return (
                    <tr key={user.id} className={`border-b ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <td className={`py-3 px-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{user.username || '-'}</td>
                      <td className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user.email}</td>
                      <td className="py-3 px-2 font-mono text-xs text-[#FF6B35]">{user.promote_code || '-'}</td>
                      <td className="py-3 px-2">
                        <button 
                          onClick={() => user.used_promote_code && viewCodeUsers(user.used_promote_code)} 
                          className="text-blue-400 text-xs hover:underline"
                        >
                          {user.used_promote_code || '-'}
                        </button>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-green-500">
                        {totalPurchase > 0 ? `${totalPurchase.toLocaleString()} MMK` : '-'}
                      </td>
                      <td className={`py-3 px-2 text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user.created_at ? (typeof user.created_at.toDate === 'function' ? user.created_at.toDate().toLocaleDateString() : new Date(user.created_at).toLocaleDateString()) : '-'}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCodeUsers && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-full max-w-2xl ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Users who used this code</h2>
              <button onClick={() => setShowCodeUsers(false)} className="text-gray-400 hover:text-white text-2xl transition">&times;</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                  <tr className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    <th className="text-left py-2 px-2">Username</th>
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-right py-2 px-2">Total Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCodeUsers.map((user) => {
                    const total = calculateUserTotal(user.id);
                    return (
                      <tr key={user.id} className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                        <td className={`py-3 px-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{user.username || '-'}</td>
                        <td className={`py-3 px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</td>
                        <td className="py-3 px-2 text-right font-bold text-green-500">
                          {total > 0 ? `${total.toLocaleString()} MMK` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {selectedCodeUsers.length === 0 && (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-gray-500">No users found for this code.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button 
              onClick={() => setShowCodeUsers(false)} 
              className="w-full bg-[#FF6B35] text-white p-3 rounded-xl mt-6 font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-500/30"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
