import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db } from '@/utils/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import AdminNavbar from '@/components/AdminNavbar';
import { useTheme } from '@/context/ThemeContext';

export default function AdminCommissionPayments() {
  const router = useRouter();
  const { isDarkMode, toggleMode } = useTheme();
  const [partnerCodes, setPartnerCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [commissionData, setCommissionData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
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
    fetchPartnerCodes();
  }, []);

  const fetchPartnerCodes = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'promo_codes'));
      const codes = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(code => code.is_partner_code);
      setPartnerCodes(codes);
    } catch (error) {
      console.error(error);
      setMessage('❌ Failed to load partner codes');
    }
    setLoading(false);
  };

  const fetchCommissionData = async (promoCode) => {
    try {
      const params = new URLSearchParams({
        promoCode: promoCode,
        period: filterPeriod
      });

      if (filterPeriod === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate);
        params.append('endDate', customEndDate);
      }

      const res = await fetch(`/api/partner/commission-data?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setMessage('❌ Failed to fetch commission data');
        return;
      }

      setCommissionData(data);
      setMessage('');
    } catch (error) {
      console.error(error);
      setMessage('❌ Error fetching commission data');
    }
  };

  const handleSelectPartner = (partner) => {
    setSelectedPartner(partner);
    fetchCommissionData(partner.code);
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
          period: filterPeriod,
          startDate: filterPeriod === 'custom' ? customStartDate : null,
          endDate: filterPeriod === 'custom' ? customEndDate : null
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
      
      // Refresh commission data
      fetchCommissionData(selectedPartner.code);
    } catch (error) {
      console.error(error);
      setMessage('❌ Error recording payment');
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
      <Head><title>Commission Payments | Admin</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <AdminNavbar />
        
        <div className="container mx-auto px-4 py-24 max-w-7xl">
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>💳 Commission Payments</h1>

          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${message.includes('✅') ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-red-500/20 border-red-500/50 text-red-300'}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Partner List */}
            <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 shadow-sm border border-gray-200'}`}>
              <h2 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Partners</h2>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {partnerCodes.length === 0 ? (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No partner codes found.</p>
                ) : (
                  partnerCodes.map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => handleSelectPartner(partner)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedPartner?.id === partner.id
                          ? isDarkMode
                            ? 'bg-[#FF6B35] text-white'
                            : 'bg-orange-500 text-white'
                          : isDarkMode
                          ? 'bg-white/5 hover:bg-white/10 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="font-semibold">{partner.partner_name}</p>
                      <p className="text-xs opacity-75">Code: {partner.code}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Commission Details */}
            <div className="lg:col-span-2">
              {selectedPartner ? (
                <>
                  {/* Filter Section */}
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <select 
                      value={filterPeriod} 
                      onChange={(e) => {
                        setFilterPeriod(e.target.value);
                        fetchCommissionData(selectedPartner.code);
                      }}
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
                        <button
                          onClick={() => fetchCommissionData(selectedPartner.code)}
                          className="px-3 py-1 bg-[#FF6B35] text-white rounded text-sm hover:bg-orange-600 transition"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>

                  {commissionData ? (
                    <>
                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Commission Rate</p>
                          <p className="text-2xl font-bold text-[#FF6B35]">{commissionData.commissionPercent}%</p>
                        </div>
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Sales</p>
                          <p className="text-2xl font-bold text-green-400">{(commissionData.totalAmount || 0).toLocaleString()} MMK</p>
                        </div>
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Commission</p>
                          <p className="text-2xl font-bold text-blue-400">{(commissionData.totalCommission || 0).toLocaleString()} MMK</p>
                        </div>
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending Payment</p>
                          <p className="text-2xl font-bold text-yellow-400">{(commissionData.pendingCommission || 0).toLocaleString()} MMK</p>
                        </div>
                      </div>

                      {/* Additional Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Paid</p>
                          <p className="text-xl font-bold text-purple-400">{(commissionData.paidCommission || 0).toLocaleString()} MMK</p>
                        </div>
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Highest</p>
                          <p className="text-xl font-bold text-pink-400">{(commissionData.highestCommission || 0).toLocaleString()} MMK</p>
                        </div>
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Users</p>
                          <p className="text-xl font-bold text-cyan-400">{commissionData.users?.length || 0}</p>
                        </div>
                      </div>

                      {/* Record Payment Button */}
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={!commissionData.pendingCommission || commissionData.pendingCommission === 0}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                      >
                        💰 Record Payment
                      </button>

                      {/* Payment History */}
                      {commissionData.paymentHistory && commissionData.paymentHistory.length > 0 && (
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
                          <h3 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Payment History</h3>
                          <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                            {commissionData.paymentHistory.map((payment, idx) => (
                              <div key={idx} className={`p-2 rounded text-sm ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold">{payment.amount?.toLocaleString()} MMK</span>
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                                {payment.notes && <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>{payment.notes}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={`rounded-xl p-8 text-center ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Select a partner to view commission data</p>
                    </div>
                  )}
                </>
              ) : (
                <div className={`rounded-xl p-8 text-center ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Select a partner from the list</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-full max-w-md ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-white text-2xl transition">&times;</button>
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
                <label className="block text-sm font-semibold mb-2 text-gray-300">Amount (MMK) *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#FF6B35]"
                  required
                  min="1"
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
