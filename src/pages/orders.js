import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import AdminNavbar from '@/components/AdminNavbar';

export default function AdminOrders() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');

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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      await fetchOrders();
      setShowModal(false);
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      alert('Failed to update order status');
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
      <Head><title>Admin - Orders | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <AdminNavbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-7xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📦 Orders Management</h1>
            <button onClick={fetchOrders} className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg">⟳ Refresh</button>
          </div>
          
          <div className={`rounded-2xl p-6 overflow-x-auto ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
            <table className="w-full text-sm">
              <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                <tr>
                  <th className="text-left py-2 px-2">Order ID</th>
                  <th className="text-left py-2 px-2">Customer</th>
                  <th className="text-left py-2 px-2">Product</th>
                  <th className="text-left py-2 px-2">Amount</th>
                  <th className="text-left py-2 px-2">Promo Code</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-2 px-2 font-mono text-xs">{order.id.slice(-8)}</td>
                    <td className="py-2 px-2">{order.username || order.user_id?.slice(-8)}</td>
                    <td className="py-2 px-2">{order.product_name}</td>
                    <td className="py-2 px-2 font-semibold text-[#FF6B35]">{order.final_price?.toLocaleString()} MMK</td>
                    <td className="py-2 px-2 font-mono text-xs">{order.promo_code_used || '-'}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                        className="bg-blue-600/50 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Update Order Status
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-2xl">&times;</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Order ID</label>
                <p className="font-mono text-sm">{selectedOrder.id}</p>
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product</label>
                <p>{selectedOrder.product_name} ({selectedOrder.duration})</p>
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amount</label>
                <p className="text-[#FF6B35] font-bold">{selectedOrder.final_price?.toLocaleString()} MMK</p>
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Current Status</label>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>New Status</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                >
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <button
                onClick={() => updateOrderStatus(selectedOrder.id, statusUpdate)}
                disabled={!statusUpdate}
                className="w-full bg-[#FF6B35] text-white p-2 rounded-lg font-semibold disabled:opacity-50"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
