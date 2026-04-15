import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { db } from '@/utils/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import AdminNavbar from '@/components/AdminNavbar';

// ============ OPTION 1: FIRST PURCHASE DISCOUNT ============
const FirstPurchaseDiscountFields = ({ settings, onChange }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-white">💰 First Purchase Discount Settings</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className="block text-gray-400 text-sm mb-1">Discount Type</label><select value={settings.discount_type || 'percent'} onChange={(e) => onChange('discount_type', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="percent">Percentage (%)</option><option value="fixed">Fixed Amount (MMK)</option></select></div>
      <div><label className="block text-gray-400 text-sm mb-1">Discount Value</label><input type="number" value={settings.discount_value || 0} onChange={(e) => onChange('discount_value', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" placeholder="20 or 15000" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Minimum Purchase Amount (MMK)</label><input type="number" value={settings.min_purchase || 0} onChange={(e) => onChange('min_purchase', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" placeholder="0 = no limit" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Maximum Discount Amount (MMK)</label><input type="number" value={settings.max_discount || 0} onChange={(e) => onChange('max_discount', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" placeholder="0 = no limit" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Valid Duration</label><div className="flex gap-2"><input type="number" value={settings.valid_duration_value || 30} onChange={(e) => onChange('valid_duration_value', parseInt(e.target.value))} className="w-24 p-2 rounded-lg bg-white/10 text-white border border-white/20" /><select value={settings.valid_duration_unit || 'days'} onChange={(e) => onChange('valid_duration_unit', e.target.value)} className="flex-1 p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></div></div>
      <div><label className="block text-gray-400 text-sm mb-1">Applicable Products</label><select value={settings.applicable_products || 'all'} onChange={(e) => onChange('applicable_products', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="all">All Products</option><option value="selected">Selected Products</option></select></div>
      <div><label className="block text-gray-400 text-sm mb-1">Stack with Special Price</label><select value={settings.stack_with_special ? 'yes' : 'no'} onChange={(e) => onChange('stack_with_special', e.target.value === 'yes')} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="yes">Yes (Add together)</option><option value="no">No (Replace)</option></select></div>
      <div><label className="block text-gray-400 text-sm mb-1">One Time Use Only</label><select value={settings.one_time_only ? 'yes' : 'no'} onChange={(e) => onChange('one_time_only', e.target.value === 'yes')} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="yes">Yes (First purchase only)</option><option value="no">No (Every purchase)</option></select></div>
      <div><label className="block text-gray-400 text-sm mb-1">New Users Only</label><select value={settings.new_users_only ? 'yes' : 'no'} onChange={(e) => onChange('new_users_only', e.target.value === 'yes')} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="yes">Yes (New accounts only)</option><option value="no">No (All users)</option></select></div>
      <div><label className="block text-gray-400 text-sm mb-1">Auto Apply at Checkout</label><select value={settings.auto_apply ? 'yes' : 'no'} onChange={(e) => onChange('auto_apply', e.target.value === 'yes')} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="yes">Yes</option><option value="no">No (User must enter code)</option></select></div>
    </div>
  </div>
);

// ============ OPTION 2: GIVEAWAY ENTRY ============
const GiveawayFields = ({ settings, onChange }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-white">🎁 Giveaway Settings</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className="block text-gray-400 text-sm mb-1">Giveaway Name</label><input type="text" value={settings.giveaway_name || ''} onChange={(e) => onChange('giveaway_name', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" placeholder="April Super Giveaway" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Start Date</label><input type="date" value={settings.start_date || ''} onChange={(e) => onChange('start_date', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">End Date</label><input type="date" value={settings.end_date || ''} onChange={(e) => onChange('end_date', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Draw Date</label><input type="date" value={settings.draw_date || ''} onChange={(e) => onChange('draw_date', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Entry Method</label><select value={settings.entry_method || 'register'} onChange={(e) => onChange('entry_method', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="register">Register Only</option><option value="register_purchase">Register + First Purchase</option><option value="register_invite">Register + Invite Friend</option><option value="register_purchase_invite">Register + Purchase + Invite</option></select></div>
      <div><label className="block text-gray-400 text-sm mb-1">Entries Per User</label><input type="number" value={settings.entries_per_user || 1} onChange={(e) => onChange('entries_per_user', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Bonus Entry for Invite</label><input type="number" value={settings.bonus_entry_invite || 0} onChange={(e) => onChange('bonus_entry_invite', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Bonus Entry for Purchase</label><input type="number" value={settings.bonus_entry_purchase || 0} onChange={(e) => onChange('bonus_entry_purchase', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Winner Announcement</label><select value={settings.announcement_method || 'auto'} onChange={(e) => onChange('announcement_method', e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="auto">Auto (On Draw Date)</option><option value="manual">Manual (Admin Only)</option></select></div>
      <div><label className="block text-gray-400 text-sm mb-1">Email Notification</label><select value={settings.email_notification ? 'yes' : 'no'} onChange={(e) => onChange('email_notification', e.target.value === 'yes')} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="yes">Yes (Send email to winners)</option><option value="no">No</option></select></div>
    </div>
    <h4 className="font-semibold text-white mt-4">🏆 Prize Pool</h4>
    <div className="space-y-2">
      {['grand_prize', 'first_prize', 'second_prize', 'third_prize', 'consolation'].map((prize) => (
        <div key={prize} className="grid grid-cols-2 gap-2">
          <input type="text" placeholder={`${prize.replace('_', ' ').toUpperCase()} Name`} value={settings[`${prize}_name`] || ''} onChange={(e) => onChange(`${prize}_name`, e.target.value)} className="p-2 rounded-lg bg-white/10 text-white border border-white/20" />
          <input type="number" placeholder="Quantity" value={settings[`${prize}_quantity`] || 0} onChange={(e) => onChange(`${prize}_quantity`, parseInt(e.target.value))} className="p-2 rounded-lg bg-white/10 text-white border border-white/20" />
        </div>
      ))}
    </div>
  </div>
);

// ============ OPTION 3: TIERED REWARDS ============
const TieredRewardsFields = ({ settings, onChange }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-white">📊 Tiered Rewards Settings</h3>
    <div className="space-y-3">
      {['bronze', 'silver', 'gold', 'platinum'].map((tier) => (
        <div key={tier} className="p-3 bg-white/5 rounded-lg">
          <h4 className="font-semibold text-white capitalize">{tier}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            <input type="number" placeholder="Min Users" value={settings[`${tier}_min`] || 0} onChange={(e) => onChange(`${tier}_min`, parseInt(e.target.value))} className="p-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm" />
            <input type="number" placeholder="Max Users" value={settings[`${tier}_max`] || 0} onChange={(e) => onChange(`${tier}_max`, parseInt(e.target.value))} className="p-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm" />
            <input type="text" placeholder="Reward" value={settings[`${tier}_reward`] || ''} onChange={(e) => onChange(`${tier}_reward`, e.target.value)} className="p-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm" />
            <select value={settings[`${tier}_reward_type`] || 'coupon'} onChange={(e) => onChange(`${tier}_reward_type`, e.target.value)} className="p-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"><option value="coupon">Coupon</option><option value="free_product">Free Product</option><option value="cashback">Cashback</option></select>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============ OPTION 4: STACKABLE DISCOUNT ============
const StackableDiscountFields = ({ settings, onChange }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-white">📚 Stackable Discount Settings</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className="block text-gray-400 text-sm mb-1">Maximum Total Discount (%)</label><input type="number" value={settings.max_total_discount || 50} onChange={(e) => onChange('max_total_discount', parseInt(e.target.value))} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" /></div>
      <div><label className="block text-gray-400 text-sm mb-1">Discount Valid Duration</label><div className="flex gap-2"><input type="number" value={settings.discount_valid_value || 30} onChange={(e) => onChange('discount_valid_value', parseInt(e.target.value))} className="w-24 p-2 rounded-lg bg-white/10 text-white border border-white/20" /><select value={settings.discount_valid_unit || 'days'} onChange={(e) => onChange('discount_valid_unit', e.target.value)} className="flex-1 p-2 rounded-lg bg-white/10 text-white border border-white/20"><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></div></div>
    </div>
    <h4 className="font-semibold text-white mt-4">✅ Actions & Discounts</h4>
    <div className="space-y-2">
      {[
        { action: 'register', label: 'Register with Promo Code', default: 5 },
        { action: 'first_purchase', label: 'Make First Purchase', default: 5 },
        { action: 'invite_1_friend', label: 'Invite 1 Friend', default: 2 },
        { action: 'invite_3_friends', label: 'Invite 3 Friends', default: 5 },
        { action: 'invite_5_friends', label: 'Invite 5 Friends', default: 8 },
        { action: 'social_share_facebook', label: 'Share on Facebook', default: 3 },
        { action: 'social_share_twitter', label: 'Share on Twitter', default: 2 },
        { action: 'write_review', label: 'Write a Product Review', default: 5 },
        { action: 'make_3_purchases', label: 'Make 3 Purchases', default: 5 },
        { action: 'make_5_purchases', label: 'Make 5 Purchases', default: 10 }
      ].map((item) => (
        <div key={item.action} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
          <span className="text-sm text-gray-300">{item.label}</span>
          <div className="flex items-center gap-2"><input type="number" value={settings[`${item.action}_discount`] || item.default} onChange={(e) => onChange(`${item.action}_discount`, parseInt(e.target.value))} className="w-20 p-1 rounded bg-white/10 text-white text-center" /><span className="text-sm text-gray-400">%</span></div>
        </div>
      ))}
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
  
  const createPromoCode = async () => {
    if (!formData.code.trim()) { alert('Please enter a promo code'); return; }
    try {
      await addDoc(collection(db, 'promo_codes'), {
        code: formData.code.toUpperCase(), option_type: formData.option_type, usage_limit: formData.usage_limit, used_count: 0,
        valid_from: formData.valid_from, valid_until: formData.valid_until, is_active: true, settings: formData.settings,
        created_at: new Date().toISOString()
      });
      alert('Promo code created!'); setShowAddModal(false); setFormData({ code: '', option_type: 'first_purchase_discount', usage_limit: 100, used_count: 0, valid_from: new Date().toISOString().split('T')[0], valid_until: '', is_active: true, settings: {} }); fetchPromoCodes();
    } catch (error) { alert('Failed to create promo code'); }
  };

  const editPromoCode = (promoCode) => { setEditingCode(promoCode); setFormData({ code: promoCode.code, option_type: promoCode.option_type, usage_limit: promoCode.usage_limit, valid_from: promoCode.valid_from, valid_until: promoCode.valid_until || '', is_active: promoCode.is_active, settings: promoCode.settings || {} }); setShowAddModal(true); };
  
  const updatePromoCode = async () => {
    if (!formData.code.trim()) { alert('Please enter a promo code'); return; }
    try {
      await updateDoc(doc(db, 'promo_codes', editingCode.id), {
        code: formData.code.toUpperCase(), option_type: formData.option_type, usage_limit: formData.usage_limit,
        valid_from: formData.valid_from, valid_until: formData.valid_until, is_active: formData.is_active,
        settings: formData.settings, updated_at: new Date().toISOString()
      });
      alert('Promo code updated!'); setShowAddModal(false); setEditingCode(null); setFormData({ code: '', option_type: 'first_purchase_discount', usage_limit: 100, used_count: 0, valid_from: new Date().toISOString().split('T')[0], valid_until: '', is_active: true, settings: {} }); fetchPromoCodes();
    } catch (error) { alert('Failed to update promo code'); }
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
            <button onClick={() => { setEditingCode(null); setFormData({ code: '', option_type: 'first_purchase_discount', usage_limit: 100, used_count: 0, valid_from: new Date().toISOString().split('T')[0], valid_until: '', is_active: true, settings: {} }); setShowAddModal(true); }} className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg">+ Add Promo Code</button>
          </div>
          <div className={`rounded-2xl p-6 overflow-x-auto ${isDarkMode ? 'bg-white/10' : 'bg-white/60'}`}>
            <table className="w-full text-sm">
              <thead className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                <tr>
                  <th className="text-left py-2 px-2">Code</th>
                  <th className="text-left py-2 px-2">Option</th>
                  <th className="text-left py-2 px-2">Used/Limit</th>
                  <th className="text-left py-2 px-2">Valid From</th>
                  <th className="text-left py-2 px-2">Valid Until</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Actions</th>
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
              <div><label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Promo Code</label><input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`} /></div>
              <div><label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Option Type</label><select value={formData.option_type} onChange={(e) => { setFormData({...formData, option_type: e.target.value, settings: {}}); }} className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                <option value="first_purchase_discount">🎯 First Purchase Discount</option><option value="giveaway">🎁 Giveaway Entry</option><option value="tiered_rewards">📊 Tiered Rewards</option><option value="stackable_discount">📚 Stackable Discount</option>
              </select></div>
              <OptionFields optionType={formData.option_type} settings={formData.settings} onChange={handleSettingChange} />
              <div className="grid grid-cols-2 gap-4">
                <div><label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Usage Limit</label><input type="number" value={formData.usage_limit} onChange={(e) => setFormData({...formData, usage_limit: parseInt(e.target.value)})} className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`} /></div>
                <div><label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Valid From</label><input type="date" value={formData.valid_from} onChange={(e) => setFormData({...formData, valid_from: e.target.value})} className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`} /></div>
                <div><label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Valid Until (Optional)</label><input type="date" value={formData.valid_until} onChange={(e) => setFormData({...formData, valid_until: e.target.value})} className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-800 border-gray-300'}`} /></div>
              </div>
              <button onClick={editingCode ? updatePromoCode : createPromoCode} className="w-full bg-green-600 text-white p-2 rounded-lg font-semibold">{editingCode ? 'Update Promo Code' : 'Create Promo Code'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
