import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db } from '@/utils/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminOrders() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);

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
      // Sort by created_at descending (newest first)
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(list);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      await fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      alert(`Order status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
    }
    setUpdating(false);
  };

  const viewOrderDetail = (order) => {
    setSelectedOrder(order);
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
            <button onClick={fetchOrders} className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg">🔄 Refresh</button>
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
                      <td className="py-3 px-2">{getStatusBadge(order.status)}</td>
                      <td className="py-3 px-2 text-xs">{new Date(order.created_at).toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <button onClick={() => viewOrderDetail(order)} className="text-blue-400 hover:text-blue-300 text-sm">
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
          <div className={`rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📋 Order Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 text-2xl">&times;</button>
            </div>
            
            <div className="space-y-4">
              {/* Order Info */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-400">Order ID:</span></div>
                  <div className="font-mono text-xs">{selectedOrder.id}</div>
                  <div><span className="text-gray-400">Customer:</span></div>
                  <div>{selectedOrder.username || selectedOrder.user_id}</div>
                  <div><span className="text-gray-400">Email:</span></div>
                  <div>{selectedOrder.user_email || '-'}</div>
                  <div><span className="text-gray-400">Date:</span></div>
                  <div>{new Date(selectedOrder.created_at).toLocaleString()}</div>
                  <div><span className="text-gray-400">Payment Method:</span></div>
                  <div>{selectedOrder.payment_method || 'Manual'}</div>
                </div>
              </div>
              
              {/* Product Info */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🛍️ Product</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-400">Product:</span></div>
                  <div>{selectedOrder.product_name}</div>
                  <div><span className="text-gray-400">Duration:</span></div>
                  <div>{selectedOrder.duration}</div>
                  <div><span className="text-gray-400">Original Price:</span></div>
                  <div>{selectedOrder.original_price?.toLocaleString()} MMK</div>
                  <div><span className="text-gray-400">Final Price:</span></div>
                  <div className="text-[#FF6B35] font-bold">{selectedOrder.final_price?.toLocaleString()} MMK</div>
                </div>
              </div>
              
              {/* Discount Breakdown */}
              {selectedOrder.discount_breakdown && selectedOrder.discount_breakdown.length > 0 && (
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🎁 Discounts Applied</h3>
                  <div className="space-y-1">
                    {selectedOrder.discount_breakdown.map((discount, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-green-400">
                        <span>{discount.label}</span>
                        <span>-{discount.amount.toLocaleString()} MMK</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Promo Code Used */}
              {selectedOrder.promo_code_used && (
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🏷️ Promo Code Used</h3>
                  <p className="text-sm font-mono">{selectedOrder.promo_code_used}</p>
                </div>
              )}
              
              {/* Status Update */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📌 Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'processing', 'completed', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={updating || selectedOrder.status === status}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        selectedOrder.status === status
                          ? 'bg-gray-500 cursor-not-allowed'
                          : status === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700'
                            : status === 'processing' ? 'bg-blue-600 hover:bg-blue-700'
                              : status === 'completed' ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                      } text-white`}
                    >
                      {status === 'pending' ? '⏳ Pending' : status === 'processing' ? '🔄 Processing' : status === 'completed' ? '✅ Completed' : '❌ Cancelled'}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Payment Proof Note */}
              <div className="p-4 bg-yellow-500/10 rounded-xl">
                <p className="text-yellow-500 text-sm">
                  📸 Payment proof should be sent to Telegram: <span className="font-bold">@william815</span>
                </p>
              </div>
            </div>
            
            <button onClick={() => setShowDetailModal(false)} className="w-full bg-[#FF6B35] text-white p-2 rounded-lg mt-4">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
