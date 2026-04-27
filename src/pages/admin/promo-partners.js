import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db } from '@/utils/firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import AdminNavbar from '@/components/AdminNavbar';
import { useTheme } from '@/context/ThemeContext';

export default function AdminPromoPartners() {
  const router = useRouter();
  const { isDarkMode, toggleMode } = useTheme();
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [partnerForm, setPartnerForm] = useState({
    partnerName: '',
    password: '',
    confirmPassword: '',
    commissionPercent: 10
  });
  const [message, setMessage] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'promo_codes'));
      const codes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPromoCodes(codes);
    } catch (error) {
      console.error(error);
      setMessage('❌ Failed to load promo codes');
    }
    setLoading(false);
  };


  const handleEditPartner = (code) => {
    setEditingCode(code);
    setPartnerForm({
      partnerName: code.partner_name || '',
      password: '',
      confirmPassword: '',
      commissionPercent: code.partner_commission_percent || 10
    });
    setShowPartnerModal(true);
  };

  const handleSavePartner = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!partnerForm.partnerName.trim()) {
      setMessage('❌ Partner name is required');
      return;
    }

    if (partnerForm.password && partnerForm.password !== partnerForm.confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }

    if (partnerForm.commissionPercent < 0 || partnerForm.commissionPercent > 100) {
      setMessage('❌ Commission percentage must be between 0 and 100');
      return;
    }

    try {
      const updateData = {
        is_partner_code: true,
        partner_name: partnerForm.partnerName,
        partner_commission_percent: partnerForm.commissionPercent,
        updated_at: new Date()
      };

      // Only update password if provided
      if (partnerForm.password) {
        // Hash password on backend
        const res = await fetch('/api/admin/update-promo-partner', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promoId: editingCode.id,
            partnerName: partnerForm.partnerName,
            password: partnerForm.password,
            commissionPercent: partnerForm.commissionPercent
          })
        });

        if (!res.ok) {
          setMessage('❌ Failed to update partner settings');
          return;
        }
      } else {
        // Update without password
        await updateDoc(doc(db, 'promo_codes', editingCode.id), {
          partner_name: partnerForm.partnerName,
          partner_commission_percent: partnerForm.commissionPercent,
          updated_at: new Date()
        });
      }

      setMessage('✅ Partner settings updated successfully');
      setShowPartnerModal(false);
      fetchPromoCodes();
    } catch (error) {
      console.error(error);
      setMessage('❌ Error updating partner settings');
    }
  };

  const getPartnerStats = async (promoCode) => {
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
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  const partnerCodes = promoCodes.filter(code => code.is_partner_code);

  return (
    <>
      <Head><title>Partner Management | Admin</title></Head>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-primary))' }}>
        <AdminNavbar />
        
        <div className="container mx-auto px-4 py-24 max-w-7xl">
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🤝 Partner Management</h1>

          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${message.includes('✅') ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-red-500/20 border-red-500/50 text-red-300'}`}>
              {message}
            </div>
          )}

          {/* Filter Section */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <select 
              value={filterPeriod} 
              onChange={(e) => setFilterPeriod(e.target.value)}
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
              </div>
            )}
          </div>

          {/* Partner Codes Table */}
          <div className={`rounded-2xl p-6 overflow-x-auto ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 shadow-sm border border-gray-200'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Partner Promo Codes</h2>
            
            {partnerCodes.length === 0 ? (
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No partner codes configured yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                  <tr className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    <th className="text-left py-3 px-2">Code</th>
                    <th className="text-left py-3 px-2">Partner Name</th>
                    <th className="text-center py-3 px-2">Commission %</th>
                    <th className="text-right py-3 px-2">Total Commission</th>
                    <th className="text-right py-3 px-2">Pending</th>
                    <th className="text-right py-3 px-2">Paid</th>
                    <th className="text-center py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partnerCodes.map((code) => (
                    <tr key={code.id} className={`border-b ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <td className="py-3 px-2 font-mono text-[#FF6B35]">{code.code}</td>
                      <td className={`py-3 px-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{code.partner_name || '-'}</td>
                      <td className="py-3 px-2 text-center text-blue-400 font-bold">{code.partner_commission_percent || 0}%</td>
                      <td className="py-3 px-2 text-right text-green-400">-</td>
                      <td className="py-3 px-2 text-right text-yellow-400">-</td>
                      <td className="py-3 px-2 text-right text-purple-400">-</td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleEditPartner(code)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition"
                        >
                          ⚙️ Configure
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Regular Promo Codes */}
          <div className={`mt-8 rounded-2xl p-6 overflow-x-auto ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-white/60 shadow-sm border border-gray-200'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Regular Promo Codes</h2>
            
            {promoCodes.filter(c => !c.is_partner_code).length === 0 ? (
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No regular promo codes found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                  <tr className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    <th className="text-left py-3 px-2">Code</th>
                    <th className="text-left py-3 px-2">Type</th>
                    <th className="text-center py-3 px-2">Used/Limit</th>
                    <th className="text-left py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.filter(c => !c.is_partner_code).map((code) => (
                    <tr key={code.id} className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                      <td className="py-3 px-2 font-mono text-[#FF6B35]">{code.code}</td>
                      <td className={`py-3 px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{code.option_type?.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-2 text-center text-gray-400">{code.used_count || 0} / {code.usage_limit || '∞'}</td>
                      <td className="py-3 px-2">{code.is_active ? '✅ Active' : '❌ Inactive'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Partner Settings Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-full max-w-md ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Partner Settings</h2>
              <button onClick={() => setShowPartnerModal(false)} className="text-gray-400 hover:text-white text-2xl transition">&times;</button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Promo Code</label>
                <input
                  type="text"
                  value={editingCode?.code || ''}
                  disabled
                  className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Partner Name *</label>
                <input
                  type="text"
                  value={partnerForm.partnerName}
                  onChange={(e) => setPartnerForm({ ...partnerForm, partnerName: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#FF6B35]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Password (Leave blank to keep current)</label>
                <input
                  type="password"
                  value={partnerForm.password}
                  onChange={(e) => setPartnerForm({ ...partnerForm, password: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              {partnerForm.password && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Confirm Password *</label>
                  <input
                    type="password"
                    value={partnerForm.confirmPassword}
                    onChange={(e) => setPartnerForm({ ...partnerForm, confirmPassword: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#FF6B35]"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Commission Percentage (%) *</label>
                <input
                  type="number"
                  value={partnerForm.commissionPercent}
                  onChange={(e) => setPartnerForm({ ...partnerForm, commissionPercent: parseInt(e.target.value) })}
                  min="0"
                  max="100"
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#FF6B35]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
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
