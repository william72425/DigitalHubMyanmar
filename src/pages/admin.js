import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Features & Notes State
  const [features, setFeatures] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentFeature, setCurrentFeature] = useState({ 
    id: null, 
    product_id: null, 
    feature_name: '', 
    free: '', 
    pro: '', 
    sort_order: 0 
  });
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchProducts();
      fetchFeatures();
    }
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/admin/products');
    const data = await res.json();
    setProducts(data);
  };

  const fetchFeatures = async () => {
    const res = await fetch('/api/admin/features');
    const data = await res.json();
    setFeatures(data.features || []);
    setNotes(data.notes || []);
    if (data.notes && data.notes.length > 0) {
      setNoteTitle(data.notes[0]?.title || '');
      setNoteContent(data.notes[0]?.content || '');
    }
  };

  const saveToGitHub = async (updatedProducts) => {
    setLoading(true);
    setMessage('⏳ Saving products...');
    
    const res = await fetch('/api/admin/save-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: updatedProducts })
    });
    
    const data = await res.json();
    
    if (data.success) {
      setMessage('✅ Products saved!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Save failed');
    }
    setLoading(false);
  };

  const saveFeaturesToGitHub = async (updatedFeatures, updatedNotes) => {
  setLoading(true);
  setMessage('⏳ Saving features...');
  
  try {
    const res = await fetch('/api/admin/save-features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: updatedFeatures, notes: updatedNotes })
    });
    
    const data = await res.json();
    
    if (data.success) {
      setMessage('✅ Features saved!');
      setTimeout(() => setMessage(''), 2000);
    } else {
      console.error('Save error:', data);
      setMessage(`❌ Save failed: ${data.error || 'Unknown error'}`);
      setTimeout(() => setMessage(''), 4000);
    }
  } catch (error) {
    console.error('Network error:', error);
    setMessage('❌ Network error - check console');
  }
  setLoading(false);
};

  const uploadLogoToGitHub = async (file, productId) => {
    setUploading(true);
    setMessage('📤 Uploading logo...');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        
        const res = await fetch('/api/admin/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo: base64, productId })
        });
        
        const data = await res.json();
        
        if (res.ok && data.logoUrl) {
          setMessage('✅ Logo uploaded!');
          resolve(data.logoUrl);
        } else {
          setMessage('❌ Upload failed');
          reject(data.error);
        }
        setUploading(false);
      };
      reader.onerror = () => {
        setMessage('❌ File read error');
        setUploading(false);
        reject();
      };
      reader.readAsDataURL(file);
    });
  };

  const updateProduct = (id, field, value) => {
    const newProducts = products.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        
        if (field === 'discount_percent') {
          const percent = parseFloat(value);
          if (!isNaN(percent) && percent > 0 && updated.hubby_price) {
            updated.special_price = Math.round(updated.hubby_price - (updated.hubby_price * percent / 100));
          } else {
            updated.special_price = null;
          }
        }
        
        if (field === 'hubby_price') {
          const percent = parseFloat(updated.discount_percent);
          if (!isNaN(percent) && percent > 0 && value) {
            updated.special_price = Math.round(value - (value * percent / 100));
          } else {
            updated.special_price = null;
          }
        }
        
        return updated;
      }
      return p;
    });
    setProducts(newProducts);
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
      logo_url: null,
      logo_size: 70,
      duration: '1 month',
      sort_order: products.length
    };
    setProducts([...products, newProduct]);
  };

  const deleteProduct = (id) => {
    if (confirm('Delete this product?')) {
      const newProducts = products.filter(p => p.id !== id);
      newProducts.forEach((p, i) => p.sort_order = i);
      setProducts(newProducts);
    }
  };

  // Feature Functions
  const addFeature = () => {
    if (!selectedProductId) {
      setMessage('❌ Please select a product first');
      return;
    }
    setCurrentFeature({
      id: Date.now(),
      product_id: selectedProductId,
      feature_name: '',
      free: '',
      pro: '',
      sort_order: features.filter(f => f.product_id === selectedProductId).length
    });
    setShowFeatureModal(true);
  };

  const editFeature = (feature) => {
    setCurrentFeature(feature);
    setShowFeatureModal(true);
  };

  const saveFeature = () => {
    if (!currentFeature.feature_name.trim()) {
      setMessage('❌ Feature name required');
      return;
    }
    let updatedFeatures;
    if (features.find(f => f.id === currentFeature.id)) {
      updatedFeatures = features.map(f => f.id === currentFeature.id ? currentFeature : f);
    } else {
      updatedFeatures = [...features, currentFeature];
    }
    setFeatures(updatedFeatures);
    saveFeaturesToGitHub(updatedFeatures, notes);
    setShowFeatureModal(false);
    setCurrentFeature({ id: null, product_id: null, feature_name: '', free: '', pro: '', sort_order: 0 });
  };

  const deleteFeature = (id) => {
    if (confirm('Delete this feature?')) {
      const updatedFeatures = features.filter(f => f.id !== id);
      setFeatures(updatedFeatures);
      saveFeaturesToGitHub(updatedFeatures, notes);
    }
  };

  // Note Functions
  const saveNote = () => {
    const updatedNotes = [{ id: 1, title: noteTitle, content: noteContent }];
    setNotes(updatedNotes);
    saveFeaturesToGitHub(features, updatedNotes);
    setShowNoteModal(false);
    setMessage('✅ Note saved!');
    setTimeout(() => setMessage(''), 2000);
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
      fetchFeatures();
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

  const productFeatures = features.filter(f => f.product_id === selectedProductId);

  return (
    <>
      <Head><title>Admin Panel</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#020617] to-[#0a0f2a] p-4">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
            <h1 className="text-2xl font-bold text-white">🛸 Admin Panel</h1>
            <div className="flex gap-3">
              <button onClick={addProduct} className="bg-green-600 text-white px-4 py-2 rounded-lg">+ Add Product</button>
              <button onClick={handleSaveAll} disabled={loading || uploading} className="bg-[#FF6B35] text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50">
                {loading ? 'Saving...' : uploading ? 'Uploading...' : '💾 Save Products'}
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-center ${message.includes('✅') ? 'bg-green-500/20 text-green-400' : message.includes('📤') ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
              {message}
            </div>
          )}
          
          {/* Products List */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">📦 Products ({products.length})</h2>
            <div className="space-y-4">
              {products.map((product, index) => {
                const logoSize = product.logo_size || 70;
                
                return (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/20 cursor-move"
                  >
                    <div className="flex flex-wrap gap-3 items-start">
                      <div className="text-gray-400 text-2xl cursor-grab">⠿</div>
                      
                      {/* Logo */}
                      <div className="flex flex-col items-center gap-1">
                        {product.logo_url ? (
                          <img src={product.logo_url} className="rounded-lg object-contain bg-white/5" style={{ width: logoSize + 'px', height: logoSize + 'px' }} alt={product.name} />
                        ) : (
                          <div className="rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] flex items-center justify-center text-white font-bold text-xl" style={{ width: logoSize + 'px', height: logoSize + 'px' }}>
                            {product.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="text-[10px] text-gray-400 w-20" onChange={async (e) => {
                          if (e.target.files[0]) {
                            const url = await uploadLogoToGitHub(e.target.files[0], product.id);
                            if (url) {
                              const newProducts = products.map(p => p.id === product.id ? { ...p, logo_url: url } : p);
                              setProducts(newProducts);
                            }
                            e.target.value = '';
                          }
                        }} />
                        <div className="flex flex-col items-center">
                          <input type="range" min="40" max="120" value={logoSize} onChange={(e) => {
                            const newSize = parseInt(e.target.value);
                            const newProducts = products.map(p => p.id === product.id ? { ...p, logo_size: newSize } : p);
                            setProducts(newProducts);
                          }} className="w-16 h-1 bg-white/20 rounded-full cursor-pointer" style={{ accentColor: '#FF6B35' }} />
                          <span className="text-[9px] text-gray-500">{logoSize}px</span>
                        </div>
                      </div>
                      
                      {/* Product Fields */}
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-2">
                        <input type="text" value={product.name || ''} onChange={(e) => updateProduct(product.id, 'name', e.target.value)} className="bg-white/10 text-white p-2 rounded text-sm col-span-2" placeholder="Name" />
                        <select value={product.category || 'Others'} onChange={(e) => updateProduct(product.id, 'category', e.target.value)} className="bg-white/10 text-white p-2 rounded text-sm">
                          <option>Video Editing</option><option>Photo Editing</option><option>AI Tools</option><option>AI Chatbots</option><option>VPNs</option><option>Others</option>
                        </select>
                        <select value={product.duration || '1 month'} onChange={(e) => updateProduct(product.id, 'duration', e.target.value)} className="bg-white/10 text-white p-2 rounded text-sm">
                          <option>7 days</option><option>1 month</option><option>3 months</option><option>1 year</option>
                        </select>
                        <input type="number" value={product.market_price || 0} onChange={(e) => updateProduct(product.id, 'market_price', parseInt(e.target.value) || 0)} className="bg-white/10 text-white p-2 rounded text-sm" placeholder="Market" />
                        <input type="number" value={product.hubby_price || 0} onChange={(e) => updateProduct(product.id, 'hubby_price', parseInt(e.target.value) || 0)} className="bg-white/10 text-white p-2 rounded text-sm" placeholder="Hubby" />
                        <input type="number" value={product.discount_percent || ''} onChange={(e) => updateProduct(product.id, 'discount_percent', e.target.value)} className="bg-white/10 text-white p-2 rounded text-sm" placeholder="%" />
                      </div>
                      
                      <button onClick={() => deleteProduct(product.id)} className="bg-red-600/50 text-white px-3 py-2 rounded-lg text-sm">Delete</button>
                    </div>
                    {product.special_price > 0 && (
                      <div className="mt-2 text-xs text-green-400 ml-8">✨ Special: {product.special_price.toLocaleString()} MMK</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features Management Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold text-white">✨ Features & Notes Management</h2>
              <div className="flex gap-3">
                <select
                  value={selectedProductId || ''}
                  onChange={(e) => setSelectedProductId(parseInt(e.target.value))}
                  className="bg-white/10 text-white p-2 rounded-lg text-sm"
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button onClick={addFeature} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">+ Add Feature</button>
                <button onClick={() => setShowNoteModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">✏️ Edit Note</button>
              </div>
            </div>

            {selectedProductId && (
              <div className="overflow-x-auto">
                {productFeatures.length > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2 px-2 text-gray-400 text-sm">Feature Name</th>
                        <th className="text-left py-2 px-2 text-gray-400 text-sm">Free</th>
                        <th className="text-left py-2 px-2 text-gray-400 text-sm">Premium/Pro</th>
                        <th className="text-center py-2 px-2 text-gray-400 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productFeatures.map((feature) => (
                        <tr key={feature.id} className="border-b border-white/10">
                          <td className="py-2 px-2 text-sm">{feature.feature_name}</td>
                          <td className="py-2 px-2 text-sm text-green-400">{feature.free || '—'}</td>
                          <td className="py-2 px-2 text-sm text-[#FF6B35]">{feature.pro || feature.free || '—'}</td>
                          <td className="py-2 px-2 text-center">
                            <button onClick={() => editFeature(feature)} className="bg-yellow-600/50 text-white px-2 py-1 rounded text-xs mr-2">Edit</button>
                            <button onClick={() => deleteFeature(feature.id)} className="bg-red-600/50 text-white px-2 py-1 rounded text-xs">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-400 text-center py-4">No features for this product. Click "+ Add Feature"</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 p-3 bg-blue-500/20 text-blue-400 rounded text-sm text-center">
            💡 Drag ⠿ to reorder | Discount % → auto special price | Logo size slider
          </div>
        </div>
      </div>

      {/* Feature Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0f2a] rounded-2xl p-6 w-full max-w-md border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">{currentFeature.id ? 'Edit Feature' : 'Add Feature'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Feature Name" value={currentFeature.feature_name} onChange={(e) => setCurrentFeature({...currentFeature, feature_name: e.target.value})} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" />
              <input type="text" placeholder="Free Plan (e.g., Basic access)" value={currentFeature.free || ''} onChange={(e) => setCurrentFeature({...currentFeature, free: e.target.value})} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" />
              <input type="text" placeholder="Premium Plan (e.g., Full access)" value={currentFeature.pro || ''} onChange={(e) => setCurrentFeature({...currentFeature, pro: e.target.value})} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" />
              <div className="flex gap-3">
                <button onClick={saveFeature} className="flex-1 bg-green-600 text-white p-2 rounded-lg">Save</button>
                <button onClick={() => setShowFeatureModal(false)} className="flex-1 bg-gray-600 text-white p-2 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0f2a] rounded-2xl p-6 w-full max-w-md border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">📌 Edit Note Box</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Note Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" />
              <textarea placeholder="Note Content" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows="4" className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" />
              <div className="flex gap-3">
                <button onClick={saveNote} className="flex-1 bg-green-600 text-white p-2 rounded-lg">Save Note</button>
                <button onClick={() => setShowNoteModal(false)} className="flex-1 bg-gray-600 text-white p-2 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
