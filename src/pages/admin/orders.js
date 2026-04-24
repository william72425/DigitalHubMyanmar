import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db } from '@/utils/firebase';
import { collection, getDocs, updateDoc, doc, query, where, getDoc } from 'firebase/firestore';
import AdminNavbar from '@/components/AdminNavbar';
import { awardPurchasePoints } from '@/utils/pointsSystem';

export default function AdminOrders() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Cancellation Reason
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else if (savedTheme === 'dark') setIsDarkMode(true);
    
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }
    fetchOrders();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(list);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus, reason = '') => {
    setUpdating(true);
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (reason) {
        updateData.cancellation_reason = reason;
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);
      
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      const orderData = orderDoc.data();
      
      if (orderData && orderData.user_id) {
        if (newStatus === 'cancelled') {
          await updateDoc(doc(db, 'users', orderData.user_id), {
            first_purchase_discount_used: false
          });
        }
        
        if (newStatus === 'completed') {
          await updateDoc(doc(db, 'users', orderData.user_id), {
            first_purchase_discount_used: true
          });
          
          try {
            const totalAmount = orderData.final_price || orderData.total_amount || 0;
            const inviterId = orderData.inviter_id || null;
            await awardPurchasePoints(orderData.user_id, totalAmount, inviterId);
          } catch (pointsError) {
            console.error('Error awarding points:', pointsError);
          }
        }
      }
      
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, cancellation_reason: reason });
      }
      setShowCancelModal(false);
      setCancelReason('');
      alert(`Order status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status: ' + error.message);
    }
    setUpdating(false);
  };

  const viewOrderDetail = async (order) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', order.user_id));
      const userData = userDoc.exists() ? userDoc.data() : null;
      setSelectedOrder({ ...order, userData });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setSelectedOrder(order);
    }
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-600/30 text-yellow-400 px-2 py-1 rounded-full text-xs">⏳ Pending</span>;
      case 'processing': return <span className="bg-blue-600/30 text-blue-400 px-2 py-1 rounded-full text-xs">🔄 Processing</span>;
      case 'completed': return <span className="bg-green-600/30 text-green-400 px-2 py-1 rounded-full text-xs">✅ Completed</span>;
      case 'cancelled': return <span className="bg-red-600/30 text-red-400 px-2 py-1 rounded-full text-xs">❌ Cancelled</span>;
      default: return <span className="bg-gray-600/30 text-gray-400 px-2 py-1 rounded-full text-xs">{status}</span>;
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
      <Head><title>Admin - Orders | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <AdminNavbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-7xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📦 Order Management</h1>
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  if(confirm('Are you sure you want to sync points for all completed orders?')) {
                    try {
                      const res = await fetch('/api/admin/sync-completed-points', { method: 'POST' });
                      const data = await res.json();
                      alert(`Sync Complete! Awarded: ${data.awarded}, Processed: ${data.processed}`);
                      fetchOrders();
                    } catch (e) { alert('Sync failed: ' + e.message); }
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                ✨ Sync Points
              </button>
              <button onClick={fetchOrders} className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg">🔄 Refresh</button>
            </div>
          </div>
          
          <div className={`rounded-2xl p-6 overflow-x-auto ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
            {orders.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No orders found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                <tr>
                  <th className="text-left py-3 px-2">Order ID</th>
                  <th className="text-left py-3 px-2">Customer</th>
                  <th className="text-left py-3 px-2">Product</th>
                  <th className="text-left py-3 px-2">Amount</th>
                  <th className="text-left py-3 px-2">Proof</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-2 font-mono text-xs">{order.id.slice(-8)}</td>
                      <td className="py-3 px-2">{order.username || order.user_id?.slice(-8)}</td>
                      <td className="py-3 px-2">{order.product_name}</td>
                      <td className="py-3 px-2 text-[#FF6B35] font-semibold">{order.final_price?.toLocaleString()} MMK</td>
                      <td className="py-3 px-2">
                        {order.payment_screenshot ? (
                          <span className="text-green-400 text-xs font-bold">✅ Uploaded</span>
                        ) : (
                          <span className="text-gray-500 text-xs">No Proof</span>
                        )}
                      </td>
                      <td className="py-3 px-2">{getStatusBadge(order.status)}</td>
                      <td className="py-3 px-2 text-xs">{new Date(order.created_at).toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <button onClick={() => viewOrderDetail(order)} className="text-blue-400 hover:text-blue-300 text-sm font-bold">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📋 Order Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 text-2xl hover:text-white transition">&times;</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Info */}
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer & Product</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Username:</span> <span>{selectedOrder.username}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Product:</span> <span className="font-bold">{selectedOrder.product_name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Duration:</span> <span>{selectedOrder.duration}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Amount:</span> <span className="text-[#FF6B35] font-bold">{selectedOrder.final_price?.toLocaleString()} MMK</span></div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">User Note</h3>
                  <p className="text-sm italic text-gray-300">
                    {selectedOrder.user_note || "No note provided by user."}
                  </p>
                </div>

                {selectedOrder.cancellation_reason && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Cancellation Reason</h3>
                    <p className="text-sm text-red-300">{selectedOrder.cancellation_reason}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4">
                  <button 
                    disabled={updating}
                    onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    🔄 Mark Processing
                  </button>
                  <button 
                    disabled={updating}
                    onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    ✅ Mark Completed
                  </button>
                  <button 
                    disabled={updating}
                    onClick={() => setShowCancelModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    ❌ Cancel Order
                  </button>
                </div>
              </div>

              {/* Right Column: Screenshot */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Proof</h3>
                {selectedOrder.payment_screenshot ? (
                  <div className="border border-white/10 rounded-xl overflow-hidden bg-black">
                    <img 
                      src={selectedOrder.payment_screenshot} 
                      className="w-full h-auto cursor-zoom-in" 
                      alt="Payment Proof" 
                      onClick={() => window.open(selectedOrder.payment_screenshot, '_blank')}
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl text-gray-500 text-sm">
                    No screenshot uploaded
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-red-500/30 shadow-2xl shadow-red-500/10`}>
            <h2 className="text-xl font-bold text-red-400 mb-4">❌ Cancel Order</h2>
            <p className="text-sm text-gray-400 mb-4">Please provide a reason for cancellation. This will be visible to the user.</p>
            <textarea 
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Screenshot မမှန်ကန်ပါ၊ ငွေမဝင်သေးပါ..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-500/50 focus:outline-none mb-4"
              rows="4"
            ></textarea>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-bold"
              >
                Go Back
              </button>
              <button 
                onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled', cancelReason)}
                disabled={!cancelReason || updating}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold disabled:opacity-50"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
