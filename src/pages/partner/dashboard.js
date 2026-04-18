import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function PartnerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [error, setError] = useState('');

  // Session data
  const [partnerName, setPartnerName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(0);

  useEffect(() => {
    // Check if partner is logged in
    const sessionToken = sessionStorage.getItem('partner_session');
    const name = sessionStorage.getItem('partner_name');
    const code = sessionStorage.getItem('promo_code');
    const commission = sessionStorage.getItem('commission_percent');

    if (!sessionToken) {
      router.push('/partner/login');
      return;
    }

    setPartnerName(name);
    setPromoCode(code);
    setCommissionPercent(parseInt(commission));
    
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async () => {
    try {
      const code = sessionStorage.getItem('promo_code');
      const params = new URLSearchParams({
        promoCode: code,
        period: period
      });

      if (period === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate);
        params.append('endDate', customEndDate);
      }

      const res = await fetch(`/api/partner/commission-data?${params}`);
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to fetch data');
        setLoading(false);
        return;
      }

      setData(result);
      setError('');
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error(err);
    }
    setLoading(false);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setLoading(true);
  };

  const handleApplyCustomDate = () => {
    setLoading(true);
    fetchCommissionData();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('partner_session');
    sessionStorage.removeItem('partner_id');
    sessionStorage.removeItem('partner_name');
    sessionStorage.removeItem('promo_code');
    sessionStorage.removeItem('commission_percent');
    router.push('/partner/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Partner Dashboard | Digital Hub Myanmar</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617] text-white">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/10 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 max-w-7xl flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">🤝 {partnerName}</h1>
              <p className="text-gray-400 text-sm">Promo Code: <span className="font-mono text-[#FF6B35]">{promoCode}</span></p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* Filter Section */}
          <div className="mb-8 flex flex-wrap items-center gap-4">
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="daily">Today</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
              <option value="custom">Custom Period</option>
            </select>

            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                />
                <span>to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                />
                <button
                  onClick={handleApplyCustomDate}
                  className="px-4 py-2 bg-[#FF6B35] rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 border border-white/20 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Commission Rate</p>
              <p className="text-3xl font-bold text-[#FF6B35]">{commissionPercent}%</p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Total Sales Amount</p>
              <p className="text-3xl font-bold text-green-400">
                {data?.totalAmount?.toLocaleString() || 0} MMK
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Total Commission</p>
              <p className="text-3xl font-bold text-blue-400">
                {data?.totalCommission?.toLocaleString() || 0} MMK
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Pending Commission</p>
              <p className="text-3xl font-bold text-yellow-400">
                {data?.pendingCommission?.toLocaleString() || 0} MMK
              </p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/10 border border-white/20 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Paid Commission</p>
              <p className="text-2xl font-bold text-purple-400">
                {data?.paidCommission?.toLocaleString() || 0} MMK
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Highest Commission</p>
              <p className="text-2xl font-bold text-pink-400">
                {data?.highestCommission?.toLocaleString() || 0} MMK
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Total Users</p>
              <p className="text-2xl font-bold text-cyan-400">
                {data?.users?.length || 0}
              </p>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 overflow-x-auto">
            <h2 className="text-xl font-bold mb-4">📊 User Commission Details</h2>
            <table className="w-full text-sm">
              <thead className="border-b border-white/20">
                <tr className="text-gray-400">
                  <th className="text-left py-3 px-2">Username</th>
                  <th className="text-right py-3 px-2">Total Purchase</th>
                  <th className="text-right py-3 px-2">Commission ({commissionPercent}%)</th>
                  <th className="text-center py-3 px-2">Orders</th>
                </tr>
              </thead>
              <tbody>
                {data?.users && data.users.length > 0 ? (
                  data.users.map((user, idx) => (
                    <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition">
                      <td className="py-3 px-2 font-medium">{user.username}</td>
                      <td className="py-3 px-2 text-right text-green-400">
                        {user.totalPurchase?.toLocaleString() || 0} MMK
                      </td>
                      <td className="py-3 px-2 text-right text-blue-400 font-bold">
                        {user.totalCommission?.toLocaleString() || 0} MMK
                      </td>
                      <td className="py-3 px-2 text-center text-gray-400">
                        {user.orders?.length || 0}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      No users found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payment History */}
          {data?.paymentHistory && data.paymentHistory.length > 0 && (
            <div className="mt-8 bg-white/10 border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">💳 Payment History</h2>
              <div className="space-y-3">
                {data.paymentHistory.map((payment, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="font-semibold">{payment.payment_method?.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-gray-400">
                        {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">{payment.amount?.toLocaleString() || 0} MMK</p>
                      {payment.notes && <p className="text-xs text-gray-400">{payment.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
