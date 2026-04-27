import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function UserOrders() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const { isDarkMode, toggleMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
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
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(list);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      processing: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400'
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '⏳ စောင့်ဆိုင်းဆဲ',
      processing: '🔄 ဆောင်ရွက်နေဆဲ',
      completed: '✅ ပြီးပါပြီ',
      cancelled: '❌ ဖျက်သိမ်းပြီး'
    };
    return texts[status] || status;
  };

  const viewOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
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
        <Navbar />
        
        <div className="container mx-auto px-4 py-24 max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📦 My Orders</h1>
            <Link href="/" className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg text-sm">🛍️ Shop Now</Link>
          </div>
          
          {orders.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
              <p className="text-gray-400 mb-4">You haven't placed any orders yet.</p>
              <Link href="/" className="inline-block bg-[#FF6B35] text-white px-6 py-2 rounded-lg">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className={`rounded-2xl p-4 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{order.product_name}</p>
                      <p className="text-sm text-gray-400">Order ID: {order.id.slice(-8)}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#FF6B35] font-bold text-lg">{order.final_price?.toLocaleString()} MMK</p>
                      <p className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${getStatusBadge(order.status)}`}>
                        {getStatusText(order.status)}
                      </p>
                    </div>
                    <button
                      onClick={() => viewOrderDetail(order)}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Order Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-2xl">&times;</button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Order ID</span>
                <span className="font-mono text-sm">{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Product</span>
                <span>{selectedOrder.product_name}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Duration</span>
                <span>{selectedOrder.duration}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Original Price</span>
                <span className="line-through text-gray-500">{selectedOrder.original_price?.toLocaleString()} MMK</span>
              </div>
              {selectedOrder.discount_applied > 0 && (
                <div className="flex justify-between border-b border-green-500/30 pb-2 text-green-400">
                  <span>🎉 Discount</span>
                  <span>-{selectedOrder.discount_applied.toLocaleString()} MMK</span>
                </div>
              )}
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Total Paid</span>
                <span className="text-[#FF6B35] font-bold text-lg">{selectedOrder.final_price?.toLocaleString()} MMK</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Status</span>
                <span className={getStatusBadge(selectedOrder.status)}>{getStatusText(selectedOrder.status)}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Order Date</span>
                <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>
              {selectedOrder.promo_code_used && (
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">Promo Code Used</span>
                  <span className="font-mono text-sm">{selectedOrder.promo_code_used}</span>
                </div>
              )}
            </div>
            
            {selectedOrder.status === 'pending' && (
              <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-yellow-500 text-sm text-center">
                  💡 Your order is pending. Please send payment proof to Telegram: @william815
                </p>
              </div>
            )}
            
            {selectedOrder.status === 'completed' && (
              <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
                <p className="text-green-500 text-sm text-center">
                  ✅ Your order is complete! Check your email for account details.
                </p>
              </div>
            )}
            
            <button onClick={() => setShowModal(false)} className="w-full mt-4 bg-[#FF6B35] text-white p-2 rounded-lg">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
