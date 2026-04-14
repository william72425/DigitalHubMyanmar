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
      setMessage('❌ စကားဝှက် မှားနေပါသည်');
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
    const res = await fetch('/api/admin/save-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: updatedProducts })
    });
    if (res.ok) {
      setMessage('✅ သိမ်းဆည်းပြီးပါပြီ');
      setTimeout(() => setMessage(''), 2000);
    } else {
      setMessage('❌ သိမ်းဆည်းမရပါ');
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
    saveToGitHub(products);
  };

  const updateField = (id, field, value) => {
    const updated = products.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    );
    setProducts(updated);
    saveToGitHub(updated);
  };

  const addProduct = () => {
    const newProduct = {
      id: Date.now(),
      name: 'New Product',
      category: 'Others',
      market_price: 0,
      hubby_price: 0,
      discount: null,
      logo_url: '',
      duration: '1 month',
      features: [],
      sort_order: products.length
    };
    const updated = [...products, newProduct];
    setProducts(updated);
    saveToGitHub(updated);
  };

  const deleteProduct = async (id) => {
    if (confirm('ဖျက်မှာ သေချာလား?')) {
      const updated = products.filter(p => p.id !== id);
      updated.forEach((p, i) => p.sort_order = i);
      setProducts(updated);
      saveToGitHub(updated);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head><title>Admin Login</title></Head>
        <div className="min-h-screen bg-gradient-to-br from-[#020617] to-[#0a0f2a] flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20">
            <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h1>
            {message && <div className="mb-4 p-2 bg-red-500/20 text-red-400 text-center rounded">{message}</div>}
            <form onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="စကားဝှက် ထည့်ပါ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 mb-4"
                autoFocus
              />
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-3 rounded-lg font-semibold">
                {loading ? 'စစ်ဆေးနေသည်...' : 'ဝင်ရောက်မည်'}
              </button>
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
            <button onClick={addProduct} className="bg-green-600 text-white px-4 py-2 rounded-lg">+ Add Product</button>
          </div>
          
          {message && (
            <div className="mb-4 p-2 bg-green-500/20 text-green-400 text-center rounded">{message}</div>
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
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="text-gray-400 text-2xl cursor-grab">⠿</div>
                  
                  <input
                    value={product.name}
                    onChange={(e) => updateField(product.id, 'name', e.target.value)}
                    className="bg-white/10 text-white p-2 rounded w-40"
                    placeholder="Name"
                  />
                  
                  <select
                    value={product.category}
                    onChange={(e) => updateField(product.id, 'category', e.target.value)}
                    className="bg-white/10 text-white p-2 rounded"
                  >
                    <option>Video Editing</option>
                    <option>Photo Editing</option>
                    <option>AI Tools</option>
                    <option>AI Chatbots</option>
                    <option>VPNs</option>
                    <option>Others</option>
                  </select>
                  
                  <input
                    type="number"
                    value={product.market_price || 0}
                    onChange={(e) => updateField(product.id, 'market_price', parseInt(e.target.value) || 0)}
                    className="bg-white/10 text-white p-2 rounded w-28"
                    placeholder="Market Price"
                  />
                  
                  <input
                    type="number"
                    value={product.hubby_price || 0}
                    onChange={(e) => updateField(product.id, 'hubby_price', parseInt(e.target.value) || 0)}
                    className="bg-white/10 text-white p-2 rounded w-28"
                    placeholder="Hubby Price"
                  />
                  
                  <input
                    type="number"
                    value={product.discount || ''}
                    onChange={(e) => updateField(product.id, 'discount', e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-white/10 text-white p-2 rounded w-20"
                    placeholder="Discount %"
                  />
                  
                  <select
                    value={product.duration || '1 month'}
                    onChange={(e) => updateField(product.id, 'duration', e.target.value)}
                    className="bg-white/10 text-white p-2 rounded"
                  >
                    <option>7 days</option>
                    <option>1 month</option>
                    <option>3 months</option>
                    <option>1 year</option>
                  </select>
                  
                  <button onClick={() => deleteProduct(product.id)} className="bg-red-600/50 text-white px-3 py-2 rounded-lg">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
