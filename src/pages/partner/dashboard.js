import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

export default function PartnerDashboard() {
  const router = useRouter();
  const [partnerName, setPartnerName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
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
    
    fetchDashboardData(code, 'all');
  }, []);

  const fetchDashboardData = async (code, period, start = '', end = '') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ promoCode: code, period });
      if (period === 'custom' && start && end) {
        params.append('startDate', start);
        params.append('endDate', end);
      }
      
      const res = await fetch(`/api/partner/commission-data?${params}`);
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || 'Failed to fetch data');
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
    setLoading(false);
  };

  const handleFilterChange = (period) => {
    setFilterPeriod(period);
    if (period !== 'custom') {
      fetchDashboardData(promoCode, period);
    }
  };

  const applyCustomFilter = () => {
    if (customStartDate && customEndDate) {
      fetchDashboardData(promoCode, 'custom', customStartDate, customEndDate);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('partner_session');
    sessionStorage.removeItem('partner_id');
    sessionStorage.removeItem('partner_name');
    sessionStorage.removeItem('promo_code');
    sessionStorage.removeItem('commission_percent');
    router.push('/partner/login');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-[#FF6B35]/30">
      <Head>
        <title>Partner Elite Dashboard | Digital Hub Myanmar</title>
      </Head>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#FF6B35] to-[#f97316] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white font-black text-xl">D</span>
            </div>
            <div>
              <h1 className="text-white font-bold tracking-tight">PARTNER ELITE</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Digital Hub Myanmar</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-all active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-32 pb-20">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Header & Welcome */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-white mb-2">Welcome back, {partnerName}</h2>
              <p className="text-slate-400">Track your performance and earnings for code <span className="text-[#FF6B35] font-mono font-bold">{promoCode}</span></p>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
              {['all', 'daily', 'weekly', 'monthly', 'custom'].map((p) => (
                <button
                  key={p}
                  onClick={() => handleFilterChange(p)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    filterPeriod === p 
                    ? 'bg-[#FF6B35] text-white shadow-lg shadow-orange-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Custom Date Picker */}
          <AnimatePresence>
            {filterPeriod === 'custom' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date</label>
                    <input 
                      type="date" 
                      value={customStartDate} 
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-[#FF6B35] outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">End Date</label>
                    <input 
                      type="date" 
                      value={customEndDate} 
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-[#FF6B35] outline-none transition-all"
                    />
                  </div>
                  <button 
                    onClick={applyCustomFilter}
                    className="mt-5 px-6 py-2.5 bg-white text-[#020617] font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95 text-sm"
                  >
                    Apply Filter
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div variants={itemVariants} className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-sm flex items-center gap-3">
              <span className="text-xl">⚠️</span> {error}
            </motion.div>
          )}

          {/* Top Key Metrics - High Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="relative overflow-hidden group bg-gradient-to-br from-[#FF6B35] to-[#f97316] p-8 rounded-[2rem] shadow-2xl shadow-orange-500/20"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-1.84-.18-3.52-1.11-4.59-2.59l1.52-1.12c.79 1.13 2.05 1.83 3.42 1.95v-3.32l-2.61-.65c-1.78-.44-3.03-2.03-3.03-3.87 0-2.23 1.8-4.04 4.04-4.04V3h2.82v1.91c1.84.18 3.52 1.11 4.59 2.59l-1.52 1.12c-.79-1.13-2.05-1.83-3.42-1.95v3.32l2.61.65c1.78.44 3.03 2.03 3.03 3.87 0 2.23-1.8 4.04-4.04 4.04zM9.41 8.87c0 .8.54 1.48 1.32 1.67l2.61.65v-3.32c-1.37.12-2.62.82-3.42 1.95.12-.41.51-.95.82-1.27.31-.32.67-.68 1.13-.95z"/></svg>
              </div>
              <p className="text-white/70 font-bold text-xs uppercase tracking-[0.2em] mb-2">Pending Commission</p>
              <h3 className="text-5xl font-black text-white">
                {loading ? '...' : (data?.pendingCommission || 0).toLocaleString()} <span className="text-2xl font-medium opacity-70">MMK</span>
              </h3>
              <div className="mt-6 flex items-center gap-2 text-white/80 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                Awaiting Payout
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="relative overflow-hidden group bg-[#0f172a] border border-white/5 p-8 rounded-[2rem] shadow-xl"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
              </div>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mb-2">Total Commission Earned</p>
              <h3 className="text-5xl font-black text-white">
                {loading ? '...' : (data?.totalCommission || 0).toLocaleString()} <span className="text-2xl font-medium text-slate-500">MMK</span>
              </h3>
              <div className="mt-6 flex items-center gap-2 text-green-400 text-xs font-bold bg-green-400/10 w-fit px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Lifetime Earnings
              </div>
            </motion.div>
          </div>

          {/* Grid Stats - 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/[0.08] transition-colors">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Sales</p>
                <p className="text-2xl font-black text-white">{(data?.totalAmount || 0).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-1">MMK Generated</p>
              </div>
              <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/[0.08] transition-colors">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Paid Amount</p>
                <p className="text-2xl font-black text-purple-400">{(data?.paidCommission || 0).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-1">MMK Disbursed</p>
              </div>
              <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/[0.08] transition-colors">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Commission Rate</p>
                <p className="text-2xl font-black text-[#FF6B35]">{commissionPercent || 0}%</p>
                <p className="text-[10px] text-slate-400 mt-1">Per Sale</p>
              </div>
              <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-white/[0.08] transition-colors">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Highest Comm.</p>
                <p className="text-2xl font-black text-pink-400">{(data?.highestCommission || 0).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-1">Single Sale Record</p>
              </div>
            </motion.div>

            {/* Invitee Overview */}
            <motion.div variants={itemVariants} className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-white">Invitee Performance</h3>
                  <span className="px-3 py-1 bg-[#FF6B35]/10 text-[#FF6B35] text-[10px] font-black rounded-full uppercase tracking-widest">
                    {data?.users?.length || 0} Total Invites
                  </span>
                </div>
                <div className="space-y-4">
                  {data?.users?.slice(0, 3).map((u, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[10px] font-bold">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{u.username}</p>
                          <p className="text-[10px] text-slate-500">{u.orders?.length || 0} Purchases</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-[#FF6B35]">+{u.totalCommission.toLocaleString()} MMK</p>
                    </div>
                  ))}
                  {!data?.users?.length && <p className="text-center text-slate-500 py-4 text-sm">No invitee data yet.</p>}
                </div>
              </div>
              <button className="w-full mt-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 transition-all">
                Scroll to View All
              </button>
            </motion.div>
          </div>

          {/* Payout History Section */}
          {data?.paymentHistory && data.paymentHistory.length > 0 && (
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-purple-500/20 flex justify-between items-center">
                <h3 className="text-xl font-black text-white">💳 Payout History</h3>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
              <div className="p-8">
                <div className="space-y-4">
                  {data.paymentHistory.map((payment, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold">
                          💰
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{payment.paymentMethod?.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-xs text-slate-400">
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
                      <div className="text-right">
                        <p className="text-lg font-black text-purple-300">{payment.amount?.toLocaleString()} MMK</p>
                        {payment.notes && <p className="text-[10px] text-slate-400 mt-1">{payment.notes}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Detailed Transaction List */}
          <motion.div variants={itemVariants} className="bg-[#0f172a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black text-white">Recent Transactions</h3>
              <div className="w-2 h-2 bg-[#FF6B35] rounded-full"></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">
                    <th className="text-left py-6 px-8">Invitee</th>
                    <th className="text-left py-6 px-8">Product</th>
                    <th className="text-right py-6 px-8">Sale Amount</th>
                    <th className="text-right py-6 px-8">Your Commission</th>
                    <th className="text-right py-6 px-8">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data?.users?.flatMap(u => u.orders.map(o => ({ ...o, username: u.username }))).sort((a,b) => new Date(b.date) - new Date(a.date)).map((order, i) => (
                    <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center text-[10px] font-black">
                            {order.username.substring(0, 1).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-white">{order.username}</span>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-sm text-slate-400 font-medium">{order.productName}</td>
                      <td className="py-6 px-8 text-right text-sm font-bold text-white">{order.amount.toLocaleString()} MMK</td>
                      <td className="py-6 px-8 text-right">
                        <span className="text-sm font-black text-[#FF6B35]">+{order.commission.toLocaleString()} MMK</span>
                      </td>
                      <td className="py-6 px-8 text-right text-xs text-slate-500 font-bold">
                        {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {(!data?.users || data.users.length === 0) && (
                    <tr>
                      <td colSpan="5" className="py-20 text-center text-slate-500 font-medium">No transactions found for the selected period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Background Decorations */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FF6B35]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: #020617;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #020617;
        }
        ::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
