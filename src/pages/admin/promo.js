import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db } from '@/utils/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import AdminNavbar from '@/components/AdminNavbar';
import productsData from '@/data/products.json';

// Product Selector Component
const ProductSelector = ({ settings, onChange }) => {
  const [selectedProducts, setSelectedProducts] = useState(settings.selected_products || []);
  
  const toggleProduct = (productId) => {
    const newSelection = selectedProducts.includes(productId)
      ? selectedProducts.filter(id => id !== productId)
      : [...selectedProducts, productId];
    setSelectedProducts(newSelection);
    onChange('selected_products', newSelection);
  };
  
  if (settings.applicable_products !== 'selected') return null;
  
  return (
    <div className="mt-4">
      <label className="block text-gray-400 text-sm mb-2">Select Products</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-white/5 rounded-lg">
        {productsData.map((product) => (
          <label key={product.id} className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={selectedProducts.includes(product.id)}
              onChange={() => toggleProduct(product.id)}
              className="w-4 h-4 rounded border-white/20"
            />
            {product.name}
          </label>
        ))}
      </div>
    </div>
  );
};

// Option 1: First Purchase Discount Fields
const FirstPurchaseDiscountFields = ({ settings, onChange }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-white">💰 First Purchase Discount Settings</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className="block text-gray-400 text-sm mb-1">Discount Type</label><select value={settings.discount_type || 'percent'} onChange={(e) => onChange('discount_type', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="percent">Percentage (%)</option><option value="fixed">Fixed Amount (MMK)</option></select></div>
      <div><label className="block text-gray-400 text-sm mb-1">Discount Value</label><input type="number" value={settings.discount_value || 0} onChange={(e) => onChange('discount_value', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" placeholder="20 or 15000" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Minimum Purchase Amount</label><input type="number" value={settings.min_purchase || 0} onChange={(e) => onChange('min_purchase', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" placeholder="0 = no limit" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Maximum Discount Amount</label><input type="number" value={settings.max_discount || 0} onChange={(e) => onChange('max_discount', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" placeholder="0 = no limit" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Valid Duration</label><div className="flex gap-2"><input type="number" value={settings.valid_duration_value || 30} onChange={(e) => onChange('valid_duration_value', parseInt(e.target.value))} className="w-24 p-2 rounded-lg bg-white/10 text-white border border-white/20" /><select value={settings.valid_duration_unit || 'days'} onChange={(e) => onChange('valid_duration_unit', e.target.value)} className="flex-1 p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></div></div>
      <div><label className="block text-gray-400 text-sm mb-1">Applicable Products</label><select value={settings.applicable_products || 'all'} onChange={(e) => onChange('applicable_products', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="all">All Products</option><option value="selected">Selected Products</option></select></div>
      <div><label className="block text-gray-400 text-sm mb-1">Stack with Special Price</label><select value={settings.stack_with_special ? 'yes' : 'no'} onChange={(e) => onChange('stack_with_special', e.target.value === 'yes')} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="yes">Yes (Add together)</option><option value="no">No (Replace)</option></select></div>
    </div>
    <ProductSelector settings={settings} onChange={onChange} />
  </div>
);

// Option 2: Giveaway Entry Fields
const GiveawayFields = ({ settings, onChange }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-white">🎁 Giveaway Settings</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className="block text-gray-400 text-sm mb-1">Giveaway Name</label><input type="text" value={settings.giveaway_name || ''} onChange={(e) => onChange('giveaway_name', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Draw Date</label><input type="date" value={settings.draw_date || ''} onChange={(e) => onChange('draw_date', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Grand Prize</label><input type="text" placeholder="Prize name" value={settings.grand_prize_name || ''} onChange={(e) => onChange('grand_prize_name', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Grand Prize Quantity</label><input type="number" value={settings.grand_prize_quantity || 1} onChange={(e) => onChange('grand_prize_quantity', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
    </div>
  </div>
);

// Option 3: Tiered Rewards Fields
const TieredRewardsFields = ({ settings, onChange }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-white">📊 Tiered Rewards Settings</h3>
    <div className="space-y-3">
      {['bronze', 'silver', 'gold', 'platinum'].map((tier) => (
        <div key={tier} className="p-3 bg-white/5 rounded-lg">
          <h4 className="font-semibold text-white capitalize">{tier}</h4>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <input type="number" placeholder="Min Users" value={settings[`${tier}_min`] || 0} onChange={(e) => onChange(`${tier}_min`, parseInt(e.target.value))} className="p-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm" />
            <input type="number" placeholder="Max Users" value={settings[`${tier}_max`] || 0} onChange={(e) => onChange(`${tier}_max`, parseInt(e.target.value))} className="p-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm" />
            <input type="text" placeholder="Reward" value={settings[`${tier}_reward`] || ''} onChange={(e) => onChange(`${tier}_reward`, e.target.value)} className="p-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Option 4: Stackable Discount Fields
const StackableDiscountFields = ({ settings, onChange }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-white">📚 Stackable Discount Settings</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className="block text-gray-400 text-sm mb-1">Maximum Total Discount (%)</label><input type="number" value={settings.max_total_discount || 50} onChange={(e) => onChange('max_total_discount', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Discount Valid Duration</label><div className="flex gap-2"><input type="number" value={settings.discount_valid_value || 30} onChange={(e) => onChange('discount_valid_value', parseInt(e.target.value))} className="w-24 p-2 rounded-lg bg-white/10 text-white border border-white/20" /><select value={settings.discount_valid_unit || 'days'} onChange={(e) => onChange('discount_valid_unit', e.target.value)} className="flex-1 p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></div></div>
    </div>
  </div>
);

const OptionFields = ({ optionType, settings, onChange }) => {
  switch (optionType) {
    case 'first_purchase_discount': return <FirstPurchaseDiscountFields settings={settings} onChange={onChange} />;
    case 'giveaway': return <GiveawayFields settings={settings} onChange={onChange} />;
    case 'tiered_rewards': return <TieredRewardsFields settings={settings} onChange={onChange} />;
    case 'stackable_discount': return <StackableDiscountFields settings={settings} onChange={onChange} />;
    default: return <p className="text-gray-400">Select an option type above</p>;
  }
};

export default function AdminPromo() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  
  // Partner Settings State
  const [isPartner, setIsPartner] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(10);

  const [formData, setFormData] = useState({
    code: '', option_type: 'first_purchase_discount', usage_limit: 100, used_count: 0, valid_from: new Date().toISOString().split('T')[0], valid_until: '', is_active: true, settings: {}
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else if (savedTheme === 'dark') setIsDarkMode(true);
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (adminAuth !== 'true') { router.push('/admin'); return; }
    fetchPromoCodes();
  }, []);

  const toggleTheme = () => { const newTheme = !isDarkMode; setIsDarkMode(newTheme); localStorage.setItem('theme', newTheme ? 'dark' : 'light'); };
  const fetchPromoCodes = async () => { setLoading(true); try { const snapshot = await getDocs(collection(db, 'promo_codes')); setPromoCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); } catch (error) { console.error(error); } setLoading(false); };
  const handleSettingChange = (key, value) => { setFormData(prev => ({ ...prev, settings: { ...prev.settings, [key]: value } })); };
  
  const resetForm = () => {
    setFormData({ code: '', option_type: 'first_purchase_discount', usage_limit: 100, used_count: 0, valid_from: new Date().toISOString().split('T')[0], valid_until: '', is_active: true, settings: {} });
    setIsPartner(false);
    setPartnerName('');
    setPartnerPassword('');
    setCommissionPercent(10);
    setEditingCode(null);
  };

  const createPromoCode = async () => {
    if (!formData.code.trim()) { alert('Please enter a promo code'); return; }
    try {
      const promoData = {
        code: formData.code.toUpperCase(), 
        option_type: formData.option_type, 
        usage_limit: formData.usage_limit, 
        used_count: 0,
        valid_from: formData.valid_from, 
        valid_until: formData.valid_until, 
        is_active: true, 
        settings: formData.settings,
        created_at: new Date().toISOString()
      };

      if (isPartner) {
        if (!partnerName.trim() || !partnerPassword.trim()) {
          alert('Partner name and password are required for partner codes');
          return;
        }
        
        // Use backend API to hash password and save
        const res = await fetch('/api/admin/update-promo-partner', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promoId: 'NEW', // Indicator for new code
            promoData: promoData,
            partnerName: partnerName,
            password: partnerPassword,
            commissionPercent: commissionPercent
          })
        });

        if (!res.ok) throw new Error('Failed to create partner promo code');
      } else {
        await addDoc(collection(db, 'promo_codes'), promoData);
      }

      alert('Promo code created!'); 
      setShowAddModal(false); 
      resetForm();
      fetchPromoCodes();
    } catch (error) { 
      console.error(error);
      alert('Failed to create promo code'); 
    }
  };

  const editPromoCode = (promoCode) => { 
    setEditingCode(promoCode); 
    setFormData({ 
      code: promoCode.code, 
      option_type: promoCode.option_type, 
      usage_limit: promoCode.usage_limit, 
      valid_from: promoCode.valid_from, 
      valid_until: promoCode.valid_until || '', 
      is_active: promoCode.is_active, 
      settings: promoCode.settings || {} 
    });
    setIsPartner(promoCode.is_partner_code || false);
    setPartnerName(promoCode.partner_name || '');
    setPartnerPassword(''); // Don't show hashed password
    setCommissionPercent(promoCode.partner_commission_percent || 10);
    setShowAddModal(true); 
  };
  
  const updatePromoCode = async () => {
    if (!formData.code.trim()) { alert('Please enter a promo code'); return; }
    try {
      const promoData = {
        code: formData.code.toUpperCase(), 
        option_type: formData.option_type, 
        usage_limit: formData.usage_limit,
        valid_from: formData.valid_from, 
        valid_until: formData.valid_until, 
        is_active: formData.is_active,
        settings: formData.settings, 
        updated_at: new Date().toISOString()
      };

      if (isPartner) {
        // Use backend API to update with password hashing
        const res = await fetch('/api/admin/update-promo-partner', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promoId: editingCode.id,
            partnerName: partnerName,
            password: partnerPassword, // Only updated if not empty
            commissionPercent: commissionPercent
          })
        });

        if (!res.ok) throw new Error('Failed to update partner settings');
        
        // Also update the base promo data
        await updateDoc(doc(db, 'promo_codes', editingCode.id), promoData);
      } else {
        await updateDoc(doc(db, 'promo_codes', editingCode.id), {
          ...promoData,
          is_partner_code: false // Reset if unchecked
        });
      }

      alert('Promo code updated!'); 
      setShowAddModal(false); 
      resetForm();
      fetchPromoCodes();
    } catch (error) { 
      console.error(error);
      alert('Failed to update promo code'); 
    }
  };

  const deletePromoCode = async (id) => { if (confirm('Delete this promo code?')) { await deleteDoc(doc(db, 'promo_codes', id)); fetchPromoCodes(); } };

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <>
      <Head><title>Admin - Promo Codes</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <AdminNavbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        <div className="container mx-auto px-4 py-24 max-w-7xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🏷️ Promo Codes</h1>
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg">+ Add Promo Code</button>
          </div>
          <div className={`rounded-2xl p-6 overflow-x-auto ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
            <table className="w-full text-sm">
              <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                <tr>
                  <th className="text-left py-2 px-2">Code</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Partner</th>
                  <th className="text-left py-2 px-2">Used/Limit</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.map((code) => (
                  <tr key={code.id} className="border-b border-white/10">
                    <td className="py-2 px-2 font-mono">{code.code}</td>
                    <td className="py-2 px-2">{code.option_type?.replace(/_/g, ' ')}</td>
                    <td className="py-2 px-2">{code.is_partner_code ? `🤝 ${code.partner_name}` : '-'}</td>
                    <td className="py-2 px-2">{code.used_count || 0} / {code.usage_limit || '∞'}</td>
                    <td className="py-2 px-2">{code.is_active ? '✅ Active' : '❌ Inactive'}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => editPromoCode(code)} className="text-blue-400 mr-2">Edit</button>
                      <button onClick={() => deletePromoCode(code.id)} className="text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} border border-white/20`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{editingCode ? 'Edit Promo Code' : 'Create New Promo Code'}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Promo Code</label><input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`} /></div>
                <div><label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Option Type</label><select value={formData.option_type} onChange={(e) => { setFormData({...formData, option_type: e.target.value, settings: {}}); }} className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                  <option value="first_purchase_discount">🎯 First Purchase Discount</option><option value="giveaway">🎁 Giveaway Entry</option><option value="tiered_rewards">📊 Tiered Rewards</option><option value="stackable_discount">📚 Stackable Discount</option>
                </select></div>
              </div>

              {/* Partner Settings Section */}
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={isPartner} onChange={(e) => setIsPartner(e.target.checked)} className="w-4 h-4" />
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🤝 Is Partner Promo Code?</span>
                </label>
                
                {isPartner && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Partner Name</label>
                      <input type="text" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className={`w-full p-2 rounded-lg border text-sm ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-white text-gray-800 border-gray-300'}`} placeholder="e.g., John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Login Password {editingCode && '(Leave blank to keep)'}</label>
                      <input type="password" value={partnerPassword} onChange={(e) => setPartnerPassword(e.target.value)} className={`w-full p-2 rounded-lg border text-sm ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-white text-gray-800 border-gray-300'}`} placeholder="Password for dashboard" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Commission %</label>
                      <input type="number" value={commissionPercent} onChange={(e) => setCommissionPercent(parseInt(e.target.value))} className={`w-full p-2 rounded-lg border text-sm ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-white text-gray-800 border-gray-300'}`} />
                    </div>
                  </div>
                )}
              </div>

              <OptionFields optionType={formData.option_type} settings={formData.settings} onChange={handleSettingChange} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Usage Limit</label><input type="number" value={formData.usage_limit} onChange={(e) => setFormData({...formData, usage_limit: parseInt(e.target.value)})} className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`} /></div>
                <div><label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Valid From</label><input type="date" value={formData.valid_from} onChange={(e) => setFormData({...formData, valid_from: e.target.value})} className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`} /></div>
                <div><label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Valid Until</label><input type="date" value={formData.valid_until} onChange={(e) => setFormData({...formData, valid_until: e.target.value})} className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`} /></div>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4" />
                <label className={isDarkMode ? 'text-white' : 'text-gray-800'}>Active</label>
              </div>

              <button onClick={editingCode ? updatePromoCode : createPromoCode} className="w-full bg-[#FF6B35] text-white p-3 rounded-xl font-bold text-lg hover:bg-orange-600 transition shadow-lg shadow-orange-500/30">
                {editingCode ? 'Update Promo Code' : 'Create Promo Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
