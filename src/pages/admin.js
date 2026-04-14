import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchProducts();
    }
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/admin/products');
    const data = await res.json();
    setProducts(data);
  };

  const saveToGitHub = async (updatedProducts) => {
    setLoading(true);
    setMessage('⏳ Saving...');
    
    const res = await fetch('/api/admin/save-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: updatedProducts })
    });
    
    const data = await res.json();
    
    if (data.success) {
      setMessage('✅ Saved! Website will update soon.');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Save failed: ' + (data.error || 'Unknown error'));
    }
    setLoading(false);
  };

  const updateField = (id, field, value) => {
    const updated = products.map(p => p.id === id ? { ...p, [field]: value } : p);
    setProducts(updated);
  };

  const updateDiscount = (id, percentValue) => {
    const product = products.find(p => p.id === id);
    const percent = parseFloat(percentValue);
    
    if (isNaN(percent) || percent <= 0) {
      updateField(id, 'discount_percent', null);
      updateField(id, 'special_price', null);
    } else {
      const hubbyPrice = product.hubby_price || 0;
      const specialPrice = hubbyPrice - (hubbyPrice * percent / 100);
      updateField(id, 'discount_percent', percent);
      updateField(id, 'special_price', Math.round(specialPrice));
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
      special_price: null,
      duration: '1 month',
      sort_order: products.length
    };
    setProducts([...products, newProduct]);
  };

  const deleteProduct = (id) => {
    if (confirm('Delete this product?')) {
      const updated = products.filter(p => p.id !== id);
      updated.forEach((p, i) => p.sort_order = i);
      setProducts(updated);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem !== null && draggedItem !== index) {
      const newProducts = [...products];
      const dragged = newProducts[draggedItem];
      newProducts.splice(draggedItem, 1);
      newProducts.splice(index, 0, dragged);
      newProducts.forEach((p, i) => p.sort_order = i);
      setProducts(newProducts);
      setDraggedItem(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSaveAll = () => {
    if (products.length === 0) {
      setMessage('❌ No products to save');
      return;
    }
    saveToGitHub(products);
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
      setMessage('❌ Wrong password');
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head><title>Admin Login</title></Head>
        <div className="min-h-screen bg-gradient-to-br from-[#020617] to-[#0a0f2a] flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md">
            <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h1>
            {message && <div className="mb-4 p-2 bg-red-500/20 text-red-400 text-center rounded">{message}</div>}
            <form onSubmit={handleLogin}>
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 mb-4" autoFocus />
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-3 rounded-lg font-semibold">
                {loading ? 'Checking...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Admin Panel</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#020617] to-[#0a0f2a] p-4">
        <div className="max-w-full mx-auto">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
            <h1 className="text-2xl font-bold text-white">Admin Panel (Drag ⠿ to Sort)</h1>
            <div className="flex gap-3">
              <button onClick={addProduct} className="bg-green-600 text-white px-4 py-2 rounded-lg">+ Add Product</button>
              <button onClick={handleSaveAll} disabled={loading} className="bg-[#FF6B35] text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50">
                {loading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-center ${message.includes('✅') ? 'bg-green-500/20 text-green-400' : message.includes('❌') ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {message}
            </div>
          )}
          
          <div className="space-y-3">
            {products.map((product, index) => (
              <div
                key={product.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 cursor-move"
              >
                <div className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center">
                  <div className="text-gray-400 text-2xl cursor-grab text-center">⠿</div>
                  
                  <input value={product.name} onChange={(e) => updateField(product.id, 'name', e.target.value)} className="bg-white/10 text-white p-2 rounded text-sm" placeholder="Name" />
                  
                  <select value={product.category} onChange={(e) => updateField(product.id, 'category', e.target.value)} className="bg-white/10 text-white p-2 rounded text-sm">
                    <option>Video Editing</option><option>Photo Editing</option><option>AI Tools</option><option>AI Chatbots</option><option>VPNs</option><option>Others</option>
                  </select>
                  
                  <select value={product.duration} onChange={(e) => updateField(product.id, 'duration', e.target.value)} className="bg-white/10 text-white p-2 rounded text-sm">
                    <option>7 days</option><option>1 month</option><option>3 months</option><option>1 year</option>
                  </select>
                  
                  <input type="number" value={product.market_price || 0} onChange={(e) => updateField(product.id, 'market_price', parseInt(e.target.value) || 0)} className="bg-white/10 text-white p-2 rounded text-sm" placeholder="Market Price" />
                  
                  <input type="number" value={product.hubby_price || 0} onChange={(e) => updateField(product.id, 'hubby_price', parseInt(e.target.value) || 0)} className="bg-white/10 text-white p-2 rounded text-sm" placeholder="Hubby Price" />
                  
                  <input type="number" value={product.discount_percent || ''} onChange={(e) => updateDiscount(product.id, e.target.value)} className="bg-white/10 text-white p-2 rounded text-sm" placeholder="Discount %" />
                  
                  <button onClick={() => deleteProduct(product.id)} className="bg-red-600/50 text-white px-3 py-2 rounded-lg text-sm">Delete</button>
                </div>
                
                {product.special_price > 0 && (
                  <div className="mt-2 text-xs text-green-400 ml-8">
                    ✨ Special Price: {product.special_price.toLocaleString()} MMK (was {product.hubby_price?.toLocaleString()} MMK)
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-3 bg-blue-500/20 text-blue-400 rounded text-sm text-center">
            Drag ⠿ to reorder. Enter discount % to show special price.
          </div>
        </div>
      </div>
    </>
  );
}
