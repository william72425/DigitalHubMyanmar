import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const { isDarkMode, toggleMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
      setOrders(list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-secondary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>My Orders | Digital Hub Myanmar</title></Head>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Navbar />
        
        <div className="container mx-auto px-4 py-24 max-w-4xl">
          <h1 className={`text-3xl font-black mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📦 My Orders</h1>
          
          {orders.length === 0 ? (
            <div className={`text-center py-20 rounded-3xl border-2 border-dashed ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
              <span className="text-5xl mb-4 block">🛒</span>
              <p className="text-gray-400 font-medium">You haven't placed any orders yet.</p>
              <button 
                onClick={() => router.push('/')} 
                className="mt-6 bg-[#FF6B35] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-[#FF6B35]/20 hover:scale-105 transition-all"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.map((order) => (
                <motion.div 
                  key={order.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowDetailModal(true);
                  }}
                  className={`group cursor-pointer rounded-3xl p-6 border transition-all ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#FF6B35]/30' 
                      : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center text-xl">
                        📦
                      </div>
                      <div>
                        <h2 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{order.product_name}</h2>
                        <p className="text-[10px] font-mono text-[#FF6B35] uppercase tracking-wider">#{order.display_id || order.id.slice(-8)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                      order.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-gray-500 font-medium">
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Amount Paid</p>
                      <p className="text-lg font-black text-[#FF6B35]">{order.final_price?.toLocaleString()} <span className="text-xs">MMK</span></p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#0a0f2a] border border-white/10' : 'bg-white'}`}
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-white">Order Details</h2>
                  <p className="text-[10px] font-mono text-[#FF6B35] uppercase tracking-widest mt-1">#{selectedOrder.display_id || selectedOrder.id.slice(-8)}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Status Section */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</span>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                    selectedOrder.status === 'completed' ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' :
                    selectedOrder.status === 'pending' ? 'bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 
                    selectedOrder.status === 'processing' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                    'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Product</p>
                    <p className="text-sm font-bold text-white">{selectedOrder.product_name}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Duration</p>
                    <p className="text-sm font-bold text-white">{selectedOrder.duration}</p>
                  </div>
                </div>

                {/* Note Section */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">My Note to Admin</p>
                  <p className="text-sm text-gray-300 italic">{selectedOrder.user_note || "No note provided."}</p>
                </div>

                {/* Admin Reason Section (if cancelled) */}
                {selectedOrder.status === 'cancelled' && selectedOrder.cancellation_reason && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Admin Feedback</p>
                    <p className="text-sm text-red-200">{selectedOrder.cancellation_reason}</p>
                  </div>
                )}

                {/* Payment Proof */}
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Payment Screenshot</p>
                  {selectedOrder.payment_screenshot ? (
                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
                      <img src={selectedOrder.payment_screenshot} className="w-full h-auto" alt="Payment Proof" />
                    </div>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-2xl text-gray-500 text-xs">
                      No screenshot uploaded
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-white/5 border-t border-white/5 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Paid</span>
                <span className="text-2xl font-black text-[#FF6B35]">{selectedOrder.final_price?.toLocaleString()} MMK</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
