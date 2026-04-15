import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db } from '@/utils/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';

const OptionFields = ({ optionType, settings, onChange }) => {
  switch (optionType) {
    case 'first_purchase_discount':
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-white">First Purchase Discount Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Discount Type</label>
              <select
                value={settings.discount_type || 'percent'}
                onChange={(e) => onChange('discount_type', e.target.value)}
                className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (MMK)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Discount Value</label>
              <input
                type="number"
                value={settings.discount_value || 0}
                onChange={(e) => onChange('discount_value', parseInt(e.target.value))}
                className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"
                placeholder="20 or 15000"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Minimum Purchase Amount (MMK)</label>
              <input
                type="number"
                value={settings.min_purchase || 0}
                onChange={(e) => onChange('min_purchase', parseInt(e.target.value))}
                className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"
                placeholder="0 = no limit"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Valid Duration</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settings.valid_duration_value || 30}
                  onChange={(e) => onChange('valid_duration_value', parseInt(e.target.value))}
                  className="w-24 p-2 rounded-lg bg-white/10 text-white border border-white/20"
                />
                <select
                  value={settings.valid_duration_unit || 'days'}
                  onChange={(e) => onChange('valid_duration_unit', e.target.value)}
                  className="flex-1 p-2 rounded-lg bg-white/10 text-white border border-white/20"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'giveaway':
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-white">Giveaway Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Giveaway Name</label>
              <input
                type="text"
                value={settings.giveaway_name || ''}
                onChange={(e) => onChange('giveaway_name', e.target.value)}
                className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"
                placeholder="April Super Giveaway"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Draw Date</label>
              <input
                type="date"
                value={settings.draw_date || ''}
                onChange={(e) => onChange('draw_date', e.target.value)}
                className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"
              />
            </div>
          </div>
        </div>
      );
      
    default:
      return <p className="text-gray-400">Select an option type above</p>;
  }
};

export default function AdminPromo() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState('first_purchase_discount');
  const [formData, setFormData] = useState({
    code: '',
    option_type: 'first_purchase_discount',
    usage_limit: 100,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    is_active: true,
    settings: {}
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else if (savedTheme === 'dark') setIsDarkMode(true);
    
    // Check admin auth
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }
    
    fetchPromoCodes();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'promo_codes'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPromoCodes(list);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    }
    setLoading(false);
  };

  const handleSettingChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }));
  };

  const createPromoCode = async () => {
    if (!formData.code.trim()) {
      alert('Please enter a promo code');
      return;
    }
    
    try {
      await addDoc(collection(db, 'promo_codes'), {
        code: formData.code.toUpperCase(),
        option_type: formData.option_type,
        usage_limit: formData.usage_limit,
        used_count: 0,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        is_active: true,
        settings: formData.settings,
        version: 1,
        created_at: new Date().toISOString()
      });
      alert('Promo code created!');
      setShowAddModal(false);
      setFormData({
        code: '',
        option_type: 'first_purchase_discount',
        usage_limit: 100,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        is_active: true,
        settings: {}
      });
      fetchPromoCodes();
    } catch (error) {
      alert('Failed to create promo code');
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
      <Head><title>Admin - Promo Codes | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-7xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🏷️ Promo Codes Management</h1>
            <button onClick={() => setShowAddModal(true)} className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg">+ Add Promo Code</button>
          </div>
          
          <div className={`rounded-2xl p-6 overflow-x-auto ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
            <table className="w-full text-sm">
              <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                <tr>
                  <th className="text-left py-2 px-2">Code</th>
                  <th className="text-left py-2 px-2">Option Type</th>
                  <th className="text-left py-2 px-2">Used/Limit</th>
                  <th className="text-left py-2 px-2">Valid From</th>
                  <th className="text-left py-2 px-2">Valid Until</th>
                  <th className="text-left py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.map((code) => (
                  <tr key={code.id} className="border-b border-white/10">
                    <td className="py-2 px-2 font-mono">{code.code}</td>
                    <td className="py-2 px-2">{code.option_type?.replace(/_/g, ' ')}</td>
                    <td className="py-2 px-2">{code.used_count || 0} / {code.usage_limit || '∞'}</td>
                    <td className="py-2 px-2">{code.valid_from || '-'}</td>
                    <td className="py-2 px-2">{code.valid_until || '-'}</td>
                    <td className="py-2 px-2">{code.is_active ? '✅ Active' : '❌ Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Create New Promo Code</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 text-2xl">&times;</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Promo Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                  placeholder="e.g., KSERIESMMSUB"
                />
              </div>
              
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Option Type</label>
                <select
                  value={formData.option_type}
                  onChange={(e) => setFormData({...formData, option_type: e.target.value})}
                  className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                >
                  <option value="first_purchase_discount">First Purchase Discount</option>
                  <option value="giveaway">Giveaway Entry</option>
                </select>
              </div>
              
              <OptionFields
                optionType={formData.option_type}
                settings={formData.settings}
                onChange={handleSettingChange}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({...formData, usage_limit: parseInt(e.target.value)})}
                    className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Valid From</label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                    className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Valid Until (Optional)</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                    className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                  />
                </div>
              </div>
              
              <button onClick={createPromoCode} className="w-full bg-green-600 text-white p-2 rounded-lg font-semibold">
                Create Promo Code
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
