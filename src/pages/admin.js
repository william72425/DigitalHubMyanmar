import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [draggedItem, setDraggedItem] = useState(null);
  const [discountType, setDiscountType] = useState({}); // 'percent' or 'amount'

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchProducts();
    }
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      fetchProducts();
    } else {
      showMessage('❌ စကားဝှက် မှားနေပါသည်', 'error');
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/admin/products');
    const data = await res.json();
    setProducts(data);
    // Initialize discount type tracking
    const types = {};
    data.forEach(p => {
      types[p.id] = p.discount_amount ? 'amount' : 'percent';
    });
    setDiscountType(types);
  };

  const saveToGitHub = async (updatedProducts) => {
    setLoading(true);
    showMessage('⏳ သိမ်းဆည်းနေသည်...', 'info');
    
    const res = await fetch('/api/admin/save-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: updatedProducts })
    });
    
    const data = await res.json();
    
    if (data.success) {
      showMessage('✅ သိမ်းဆည်းပြီးပါပြီ! Website ကို ခဏအကြာတွင် ပြန်လည်စစ်ဆေးပါ။', 'success');
    } else {
      showMessage(`❌ သိမ်းဆည်းမရပါ: ${data.error || 'Unknown error'}`, 'error');
    }
    setLoading(false);
  };

  // Drag & Drop
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;
    if (draggedItem !== index) {
      const newProducts = [...products];
      const draggedProduct = newProducts[draggedItem];
      newProducts.splice(draggedItem, 1);
      newProducts.splice(index, 0, draggedProduct);
      newProducts.forEach((p, i) => p.sort_order = i);
      setProducts(newProducts);
      setDraggedItem(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const updateField = (id, field, value) => {
    const updated = products.map(p => p.id === id ? { ...p, [field]: value } : p);
    setProducts(updated);
  };

  const updateDiscount = (id, type, value) => {
    const numValue = parseFloat(value) || 0;
    const product = products.find(p => p.id === id);
    
    if (type === 'percent') {
      const discountAmount = (product.hubby_price * numValue) / 100;
      const finalPrice = product.hubby_price - discountAmount;
      updateField(id, 'discount_percent', numValue);
      updateField(id, 'discount_amount', null);
      updateField(id, 'special_price', finalPrice > 0 ? finalPrice : 0);
    } else {
      updateField(id, 'discount_amount', numValue);
      updateField(id, 'discount_percent', null);
      updateField(id, 'special_price', product.hubby_price - numValue > 0 ? product.hubby_price - numValue : 0);
    }
    setDiscountType(prev => ({ ...prev, [id]: type }));
  };

  const addProduct = () => {
    const newProduct = {
      id: Date.now(),
      name: 'New Product',
      category: 'Others',
      market_price: 0,
      hubby_price: 0,
      discount_percent: null,
      discount_amount: null,
      special_price: null,
      logo_url: '',
      duration: '1 month',
      sort_order: products.length,
      features: []
    };
    setProducts([...products, newProduct]);
  };

  const deleteProduct = async (id) => {
    if (confirm('ဖျက်မှာ သေချာလား?')) {
      const updated = products.filter(p => p.id !== id);
      updated.forEach((p, i) => p.sort_order = i);
      setProducts(updated);
    }
  };

  const handleSaveAll = () => {
    saveToGitHub(products);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head><title>Admin Login</title></Head>
        <div className="min-h-screen bg-gradient-to-br from-[#020617] to-[#0a0f2a] flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20">
            <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h1>
            {message.text && <div className={`mb-4 p-2 text-center rounded ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{message.text}</div>}
            <form onSubmit={handleLogin}>
              <input type="password" placeholder="စကားဝှက် ထည့်ပါ" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 mb-4" autoFocus />
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-3 rounded-lg font-semibold">{loading ? 'စစ်ဆေးနေသည်...' : 'ဝင်ရောက်မည်'}</button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Admin Panel | Product Manager</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#020617] to-[#0a0f2a] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">🛸 Admin Panel (Drag ⠿ to Sort)</h1>
            <div className="flex gap-3">
              <button onClick={addProduct} className="bg-green-600 text-white px-4 py-2 rounded-lg">+ Add Product</button>
              <button onClick={handleSaveAll} disabled={loading} className="bg-[#FF6B35] text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50">
                {loading ? 'Saving...' : '💾 Save All Changes'}
              </button>
            </div>
          </div>
          
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-center ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {message.text}
            </div>
          )}
          
          <div className="space-y-3">
            {products.map((product, index) => (
              <div key={product.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 cursor-move">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="text-gray-400 text-2xl cursor-grab">⠿</div>
                  
                  <input value={product.name} onChange={(e) => updateField(product.id, 'name', e.target.value)} className="bg-white/10 text-white p-2 rounded w-36" placeholder="Name" />
                  
                  <select value={product.category} onChange={(e) => updateField(product.id, 'category', e.target.value)} className="bg-white/10 text-white p-2 rounded">
                    <option>Video Editing</option><option>Photo Editing</option><option>AI Tools</option><option>AI Chatbots</option><option>VPNs</option><option>Others</option>
                  </select>
                  
                  <select value={product.duration} onChange={(e) => updateField(product.id, 'duration', e.target.value)} className="bg-white/10 text-white p-2 rounded">
                    <option>7 days</option><option>1 month</option><option>3 months</option><option>6 months</option><option>1 year</option>
                  </select>
                  
                  <input type="number" value={product.market_price || 0} onChange={(e) => updateField(product.id, 'market_price', parseInt(e.target.value) || 0)} className="bg-white/10 text-white p-2 rounded w-28" placeholder="Market Price" />
                  
                  <input type="number" value={product.hubby_price || 0} onChange={(e) => updateField(product.id, 'hubby_price', parseInt(e.target.value) || 0)} className="bg-white/10 text-white p-2 rounded w-28" placeholder="Hubby Price" />
                  
                  <div className="flex gap-1 items-center">
                    <select value={discountType[product.id] || 'percent'} onChange={(e) => setDiscountType(prev => ({ ...prev, [product.id]: e.target.value }))} className="bg-white/10 text-white p-2 rounded text-sm w-20">
                      <option value="percent">%</option>
                      <option value="amount">Amount</option>
                    </select>
                    <input type="number" value={discountType[product.id] === 'percent' ? (product.discount_percent || 0) : (product.discount_amount || 0)} onChange={(e) => updateDiscount(product.id, discountType[product.id], e.target.value)} className="bg-white/10 text-white p-2 rounded w-24" placeholder="Discount" />
                  </div>
                  
                  <button onClick={() => deleteProduct(product.id)} className="bg-red-600/50 text-white px-3 py-2 rounded-lg">Delete</button>
                </div>
                {product.special_price > 0 && (
                  <div className="mt-2 text-xs text-green-400 ml-8">💰 Special Sale Price: {product.special_price.toLocaleString()} MMK (after discount)</div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-3 bg-blue-500/20 text-blue-400 rounded text-sm text-center">
            💡 Drag the ⠿ icon to reorder. Click "Save All Changes" to update the live website.
          </div>
        </div>
      </div>
    </>
  );
}
