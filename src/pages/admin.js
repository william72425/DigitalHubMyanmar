import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [draggedItem, setDraggedItem] = useState(null);

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
      showMessage('✅ သိမ်းဆည်းပြီးပါပြီ!', 'success');
    } else {
      showMessage(`❌ သိမ်းဆည်းမရပါ: ${data.error || 'Unknown error'}`, 'error');
    }
    setLoading(false);
  };

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

  // Simple discount update
  const updateDiscountPercent = (id, value) => {
    const numValue = value === '' ? null : parseFloat(value);
    const product = products.find(p => p.id === id);
    const hubbyPrice = product?.hubby_price || 0;
    
    if (numValue === null || isNaN(numValue)) {
      updateField(id, 'discount_percent', null);
      updateField(id, 'special_price', null);
    } else {
      const discountAmount = (hubbyPrice * numValue) / 100;
      const finalPrice = hubbyPrice - discountAmount;
      updateField(id, 'discount_percent', numValue);
      updateField(id, 'discount_amount', null);
      updateField(id, 'special_price', finalPrice > 0 ? Math.round(finalPrice) : 0);
    }
  };

  const updateDiscountAmount = (id, value) => {
    const numValue = value === '' ? null : parseFloat(value);
    const product = products.find(p => p.id === id);
    const hubbyPrice = product?.hubby_price || 0;
    
    if (numValue === null || isNaN(numValue)) {
      updateField(id, 'discount_amount', null);
      updateField(id, 'special_price', null);
    } else {
      updateField(id, 'discount_amount', numValue);
      updateField(id, 'discount_percent', null);
      updateField(id, 'special_price', hubbyPrice - numValue > 0 ? hubbyPrice - numValue : 0);
    }
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
    if (products.length === 0) {
      showMessage('❌ သိမ်းဆည်းရန် Product မရှိပါ', 'error');
      return;
    }
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
        <div className="max-w-full mx-auto overflow-x-auto">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
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
          
          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-2 mb-2 px-4 text-xs text-gray-400 font-semibold min-w-[950px]">
            <div className="col-span-1">Sort</div>
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1">Duration</div>
            <div className="col-span-2">Market Price</div>
            <div className="col-span-2">Hubby Price</div>
            <div className="col-span-1">% OFF</div>
            <div className="col-span-1">Actions</div>
          </div>
          
          <div className="space-y-3 min-w-[950px]">
            {products.map((product, index) => (
              <div
                key={product.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 cursor-move"
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 text-gray-400 text-2xl cursor-grab text-center">⠿</div>
                  
                  <input 
                    value={product.name} 
                    onChange={(e) => updateField(product.id, 'name', e.target.value)} 
                    className="col-span-2 bg-white/10 text-white p-2 rounded text-sm" 
                    placeholder="Name" 
                  />
                  
                  <select 
                    value={product.category} 
                    onChange={(e) => updateField(product.id, 'category', e.target.value)} 
                    className="col-span-2 bg-white/10 text-white p-2 rounded text-sm"
                  >
                    <option>Video Editing</option>
                    <option>Photo Editing</option>
                    <option>AI Tools</option>
                    <option>AI Chatbots</option>
                    <option>VPNs</option>
                    <option>Others</option>
                  </select>
                  
                  <select 
                    value={product.duration} 
                    onChange={(e) => updateField(product.id, 'duration', e.target.value)} 
                    className="col-span-1 bg-white/10 text-white p-2 rounded text-sm"
                  >
                    <option>7 days</option>
                    <option>1 month</option>
                    <option>3 months</option>
                    <option>6 months</option>
                    <option>1 year</option>
                  </select>
                  
                  <input 
                    type="number" 
                    value={product.market_price || 0} 
                    onChange={(e) => updateField(product.id, 'market_price', parseInt(e.target.value) || 0)} 
                    className="col-span-2 bg-white/10 text-white p-2 rounded text-sm" 
                    placeholder="Market Price" 
                  />
                  
                  <input 
                    type="number" 
                    value={product.hubby_price || 0} 
                    onChange={(e) => updateField(product.id, 'hubby_price', parseInt(e.target.value) || 0)} 
                    className="col-span-2 bg-white/10 text-white p-2 rounded text-sm" 
                    placeholder="Hubby Price" 
                  />
                  
                  {/* Discount % Only - Simple */}
                  <input 
                    type="number" 
                    value={product.discount_percent || ''} 
                    onChange={(e) => updateDiscountPercent(product.id, e.target.value)} 
                    className="col-span-1 bg-white/10 text-white p-2 rounded text-sm" 
                    placeholder="%" 
                  />
                  
                  <button 
                    onClick={() => deleteProduct(product.id)} 
                    className="col-span-1 bg-red-600/50 text-white px-2 py-2 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
                
                {/* Special Sale Info */}
                {product.special_price > 0 && (
                  <div className="mt-2 text-xs text-green-400 ml-12">
                    ✨ Special Sale: {product.special_price.toLocaleString()} MMK (was {product.hubby_price?.toLocaleString()} MMK)
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-3 bg-blue-500/20 text-blue-400 rounded text-sm text-center">
            💡 Drag ⠿ to reorder. Enter discount % to show special sale price.
          </div>
        </div>
      </div>
    </>
  );
}
