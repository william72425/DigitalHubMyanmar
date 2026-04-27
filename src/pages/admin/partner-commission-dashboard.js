import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db } from '@/utils/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import AdminNavbar from '@/components/AdminNavbar';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function PartnerCommissionDashboard() {
  const router = useRouter();
  const { isDarkMode, toggleMode } = useTheme();
  const [partnerCodes, setPartnerCodes] = useState([]);
  const [commissionDataMap, setCommissionDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'bank_transfer',
    notes: ''
  });

  useEffect(() => {
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }
    fetchAllPartnerData();
  }, []);

  const fetchAllPartnerData = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'promo_codes'));
      const codes = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(code => code.is_partner_code);
      setPartnerCodes(codes);

      // Fetch commission data for all partners
      const dataMap = {};
      for (const code of codes) {
        try {
          const res = await fetch(`/api/partner/commission-data?promoCode=${code.code}&period=all`);
          const data = await res.json();
          if (res.ok) {
            dataMap[code.code] = data;
          }
        } catch (error) {
          console.error(`Failed to fetch data for ${code.code}:`, error);
        }
      }
      setCommissionDataMap(dataMap);
    } catch (error) {
      console.error(error);
      setMessage('❌ Failed to load partner codes');
    }
    setLoading(false);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!paymentForm.amount || paymentForm.amount <= 0) {
      setMessage('❌ Please enter a valid amount');
      return;
    }

    try {
      const res = await fetch('/api/admin/record-commission-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoCode: selectedPartner.code,
          amount: paymentForm.amount,
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes,
          period: 'all'
        })
      });

      if (!res.ok) {
        setMessage('❌ Failed to record payment');
        return;
      }

      setMessage('✅ Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentForm({
        amount: 0,
        paymentMethod: 'bank_transfer',
        notes: ''
      });
      
      // Refresh data
      fetchAllPartnerData();
    } catch (error) {
      console.error(error);
      setMessage('❌ Error recording payment');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  const totalEarned = Object.values(commissionDataMap).reduce((sum, d) => sum + (d?.totalCommission || 0), 0);
  const totalPending = Object.values(commissionDataMap).reduce((sum, d) => sum + (d?.pendingCommission || 0), 0);
  const totalPaid = Object.values(commissionDataMap).reduce((sum, d) => sum + (d?.paidCommission || 0), 0);

  return (
    <>
      <Head><title>Partner Commission Dashboard | Admin</title></Head>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-primary))' }}>
        <AdminNavbar />
        
        <div className="container mx-auto px-4 py-24 max-w-7xl">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>💼 Partner Commission Dashboard</h1>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage all partner commissions and payouts</p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${message.includes('✅') ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-red-500/20 border-red-500/50 text-red-300'}`}>
              {message}
            </div>
          )}

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-xs font-bold uppercase mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Total Partners</p>
              <p className={`text-3xl font-black ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>{partnerCodes.length}</p>
            </div>
            <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
              <p className={`text-xs font-bold uppercase mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>Total Earned</p>
              <p className={`text-2xl font-black ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>{totalEarned.toLocaleString()}</p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-green-400/70' : 'text-green-600/70'}`}>MMK</p>
            </div>
            <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'}`}>
              <p className={`text-xs font-bold uppercase mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>Pending Payout</p>
              <p className={`text-2xl font-black ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>{totalPending.toLocaleString()}</p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-yellow-400/70' : 'text-yellow-600/70'}`}>MMK</p>
            </div>
            <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`}>
              <p className={`text-xs font-bold uppercase mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>Total Paid</p>
              <p className={`text-2xl font-black ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>{totalPaid.toLocaleString()}</p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}`}>MMK</p>
            </div>
          </div>

          {/* Partners Table */}
          <div className={`rounded-2xl overflow-hidden ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 shadow-sm border border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'bg-white/5 text-gray-300 border-b border-white/10' : 'bg-gray-100 text-gray-600 border-b border-gray-200'}`}>
                    <th className="text-left py-4 px-6">Partner Name</th>
                    <th className="text-left py-4 px-6">Promo Code</th>
                    <th className="text-right py-4 px-6">Commission Rate</th>
                    <th className="text-right py-4 px-6">Total Earned</th>
                    <th className="text-right py-4 px-6">Pending</th>
                    <th className="text-right py-4 px-6">Paid</th>
                    <th className="text-center py-4 px-6">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-200'}`}>
                  {partnerCodes.map((partner) => {
                    const data = commissionDataMap[partner.code];
                    return (
                      <tr 
                        key={partner.id} 
                        className={`transition ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                      >
                        <td className={`py-4 px-6 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {partner.partner_name}
                        </td>
                        <td className={`py-4 px-6 font-mono text-sm ${isDarkMode ? 'text-[#FF6B35]' : 'text-orange-600'}`}>
                          {partner.code}
                        </td>
                        <td className={`py-4 px-6 text-right font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {data?.commissionPercent || 0}%
                        </td>
                        <td className={`py-4 px-6 text-right font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {(data?.totalCommission || 0).toLocaleString()} MMK
                        </td>
                        <td className={`py-4 px-6 text-right font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                          {(data?.pendingCommission || 0).toLocaleString()} MMK
                        </td>
                        <td className={`py-4 px-6 text-right font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                          {(data?.paidCommission || 0).toLocaleString()} MMK
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => {
                              setSelectedPartner(partner);
                              setShowPaymentModal(true);
                            }}
                            disabled={!data?.pendingCommission || data.pendingCommission === 0}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${
                              data?.pendingCommission && data.pendingCommission > 0
                                ? isDarkMode
                                  ? 'bg-[#FF6B35] text-white hover:bg-orange-600'
                                  : 'bg-orange-500 text-white hover:bg-orange-600'
                                : isDarkMode
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Pay
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Partner Details Section */}
          {selectedPartner && commissionDataMap[selectedPartner.code] && (
            <div className={`mt-8 rounded-2xl p-6 ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {selectedPartner.partner_name} - Payment History
              </h2>
              
              {commissionDataMap[selectedPartner.code]?.paymentHistory && commissionDataMap[selectedPartner.code].paymentHistory.length > 0 ? (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {commissionDataMap[selectedPartner.code].paymentHistory.map((payment, idx) => (
                    <div key={idx} className={`p-4 rounded-lg flex justify-between items-center ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-gray-100 border border-gray-200'}`}>
                      <div>
                        <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {payment.amount?.toLocaleString()} MMK
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {payment.paymentMethod?.replace('_', ' ').toUpperCase()}
                        </p>
                        {payment.notes && (
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                            {payment.notes}
                          </p>
                        )}
                      </div>
                      <div className={`text-right text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <p className="font-semibold">
                          {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No payment history yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-full max-w-md ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Record Payment</h2>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-gray-400 hover:text-white text-2xl transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Partner</label>
                <input
                  type="text"
                  value={selectedPartner?.partner_name || ''}
                  disabled
                  className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Pending Amount</label>
                <input
                  type="text"
                  value={(commissionDataMap[selectedPartner.code]?.pendingCommission || 0).toLocaleString() + ' MMK'}
                  disabled
                  className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-yellow-400 cursor-not-allowed font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Payment Amount (MMK) *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#FF6B35]"
                  required
                  min="1"
                  max={commissionDataMap[selectedPartner.code]?.pendingCommission || 0}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#FF6B35]"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="mobile_payment">Mobile Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#FF6B35]"
                  rows="3"
                  placeholder="Optional notes about this payment"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
