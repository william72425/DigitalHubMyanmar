import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '@/components/Navbar';

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);

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
      await loadOrders(user.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadOrders = async (userId) => {
    try {
      const q = query(collection(db, 'orders'), where('user_id', '==', userId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Error loading orders:', error);
    }
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
      <Head><title>My Orders | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-6xl">
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📦 My Orders</h1>
          
          {orders.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
              <p className="text-gray-400">You haven't placed any orders yet.</p>
              <button onClick={() => router.push('/')} className="mt-4 bg-[#FF6B35] text-white px-4 py-2 rounded-lg">Browse Products</button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-4">
                    <div>
                      <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{order.product_name}</h2>
                      <p className="text-sm text-gray-400">{order.duration} • {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'completed' ? 'bg-green-600/30 text-green-400' :
                      order.status === 'pending' ? 'bg-yellow-600/30 text-yellow-400' : 'bg-red-600/30 text-red-400'
                    }`}>
                      {order.status === 'completed' ? '✅ Completed' : order.status === 'pending' ? '⏳ Pending' : '❌ Cancelled'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Original Price</span>
                      <span>{order.original_price?.toLocaleString()} MMK</span>
                    </div>
                    {order.discount_breakdown?.map((discount, idx) => (
                      <div key={idx} className="flex justify-between text-green-400">
                        <span>{discount.label}</span>
                        <span>-{discount.amount.toLocaleString()} MMK</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-white/10 font-bold">
                      <span>Total Paid</span>
                      <span className="text-[#FF6B35]">{order.final_price?.toLocaleString()} MMK</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
