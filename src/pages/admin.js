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
  const [pendingChanges, setPendingChanges] = useState(false);

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
    setNotes(data.product_notes || []);
  };

  const saveToGitHub = async (updatedProducts) => {
    const res = await fetch('/api/admin/save-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: updatedProducts })
    });
    const data = await res.json();
    return data.success;
  };

  const saveFeaturesToGitHub = async (updatedFeatures, updatedNotes) => {
    const res = await fetch('/api/admin/save-features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        features: updatedFeatures, 
        product_notes: updatedNotes 
      })
    });
    const data = await res.json();
    return data.success;
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
          setMessage('✅ Logo uploaded! Click "Save All Changes" to deploy.');
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
    setPendingChanges(true);
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
    setPendingChanges(true);
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
    setMessage('✅ Product added! Click "Save All Changes" to deploy.');
    setTimeout(() => setMessage(''), 3000);
  };

  const deleteProduct = (id) => {
    if (confirm('Delete this product?')) {
      setPendingChanges(true);
      const newProducts = products.filter(p => p.id !== id);
      newProducts.forEach((p, i) => p.sort_order = i);
      setProducts(newProducts);
      setMessage('✅ Product deleted! Click "Save All Changes" to deploy.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

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
    setPendingChanges(true);
    let updatedFeatures;
    if (features.find(f => f.id === currentFeature.id)) {
      updatedFeatures = features.map(f => f.id === currentFeature.id ? currentFeature : f);
    } else {
      updatedFeatures = [...features, currentFeature];
    }
    setFeatures(updatedFeatures);
    setShowFeatureModal(false);
    setMessage('✅ Feature changed! Click "Save All Changes" to deploy.');
    setTimeout(() => setMessage(''), 3000);
    // ❌ NO auto save to GitHub
  };

  const deleteFeature = (id) => {
    if (confirm('Delete this feature?')) {
      setPendingChanges(true);
      const updatedFeatures = features.filter(f => f.id !== id);
      setFeatures(updatedFeatures);
      setMessage('✅ Feature deleted! Click "Save All Changes" to deploy.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const openNoteModal = () => {
    if (!selectedProductId) {
      setMessage('❌ Please select a product first');
      return;
    }
    const existingNote = notes.find(n => n.product_id === selectedProductId);
    if (existingNote) {
      setNoteTitle(existingNote.title || '');
      setNoteContent(existingNote.content || '');
    } else {
      setNoteTitle('');
      setNoteContent('');
    }
    setShowNoteModal(true);
  };

  const saveNote = () => {
    if (!selectedProductId) {
      setMessage('❌ Please select a product first');
      return;
    }
    
    setPendingChanges(true);
    let updatedNotes;
    if (noteContent.trim() === '') {
      updatedNotes = notes.filter(n => n.product_id !== selectedProductId);
    } else {
      const existingIndex = notes.findIndex(n => n.product_id === selectedProductId);
      const newNote = {
        id: existingIndex >= 0 ? notes[existingIndex].id : Date.now(),
        product_id: selectedProductId,
        title: noteTitle || '📌 မှတ်ချက်',
        content: noteContent
      };
      
      if (existingIndex >= 0) {
        updatedNotes = [...notes];
        updatedNotes[existingIndex] = newNote;
      } else {
        updatedNotes = [...notes, newNote];
      }
    }
    
    setNotes(updatedNotes);
    setShowNoteModal(false);
    setMessage(noteContent.trim() === '' ? '✅ Note removed! Click "Save All Changes" to deploy.' : '✅ Note saved! Click "Save All Changes" to deploy.');
    setTimeout(() => setMessage(''), 3000);
    // ❌ NO auto save to GitHub
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem !== null && draggedItem !== index) {
      setPendingChanges(true);
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

  const handleSaveAll = async () => {
    setLoading(true);
    setMessage('⏳ Saving all changes to GitHub...');
    
    let productsSaved = false;
    let featuresSaved = false;
    
    productsSaved = await saveToGitHub(products);
    featuresSaved = await saveFeaturesToGitHub(features, notes);
    
    if (productsSaved && featuresSaved) {
      setMessage('✅ ALL CHANGES SAVED! Website will update automatically.');
      setPendingChanges(false);
    } else if (productsSaved && !featuresSaved) {
      setMessage('⚠️ Products saved, but features/notes failed. Try again.');
    } else if (!productsSaved && featuresSaved) {
      setMessage('⚠️ Features saved, but products failed. Try again.');
    } else {
      setMessage('❌ Save failed. Check your connection and try again.');
    }
    
    setTimeout(() => setMessage(''), 4000);
    setLoading(false);
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
      sessionStorage.setItem('admin_password', password);
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
  const currentNote = notes.find(n => n.product_id === selectedProductId);

  return (
    <>
      <Head><title>Admin Panel</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#020617] to-[#0a0f2a] p-4">
        <div className="max-w-full mx-auto">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
            <h1 className="text-2xl font-bold text-white">🛸 Admin Panel</h1>
            <div className="flex gap-3">
              <button onClick={addProduct} className="bg-green-600 text-white px-4 py-2 rounded-lg">+ Add Product</button>
              <button 
                onClick={handleSaveAll} 
                disabled={loading || uploading || !pendingChanges} 
                className={`px-6 py-2 rounded-lg font-semibold disabled:opacity-50 ${
                  pendingChanges ? 'bg-[#FF6B35] text-white animate-pulse' : 'bg-gray-500 text-white'
                }`}
              >
                {loading ? 'Saving...' : uploading ? 'Uploading...' : pendingChanges ? '💾 Save All Changes' : '✓ All Saved'}
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-center ${message.includes('✅') ? 'bg-green-500/20 text-green-400' : message.includes('📤') ? 'bg-blue-500/20 text-blue-400' : message.includes('⚠️') ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
              {message}
            </div>
          )}
          
          {pendingChanges && (
            <div className="mb-4 p-2 bg-yellow-500/20 text-yellow-400 text-center rounded text-sm">
              ⚠️ You have unsaved changes. Click "Save All Changes" to deploy.
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
                              setPendingChanges(true);
                              const newProducts = products.map(p => p.id === product.id ? { ...p, logo_url: url } : p);
                              setProducts(newProducts);
                            }
                            e.target.value = '';
                          }
                        }} />
                        <div className="flex flex-col items-center">
                          <input type="range" min="40" max="120" value={logoSize} onChange={(e) => {
                            setPendingChanges(true);
                            const newSize = parseInt(e.target.value);
                            const newProducts = products.map(p => p.id === product.id ? { ...p, logo_size: newSize } : p);
                            setProducts(newProducts);
                          }} className="w-16 h-1 bg-white/20 rounded-full cursor-pointer" style={{ accentColor: '#FF6B35' }} />
                          <span className="text-[9px] text-gray-500">{logoSize}px</span>
                        </div>
                      </div>
                      
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

          {/* Features & Notes Management */}
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
                <button onClick={openNoteModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                  {currentNote ? '✏️ Edit Note' : '📝 Add Note'}
                </button>
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
                
                {currentNote && (
                  <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                    <p className="text-yellow-500 text-sm font-semibold">📌 Current Note:</p>
                    <p className="text-gray-300 text-sm mt-1">{currentNote.content}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 p-3 bg-blue-500/20 text-blue-400 rounded text-sm text-center">
            💡 Drag ⠿ to reorder | Discount % → auto special price | Logo size slider | Save All Changes button deploys everything at once
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
              <input type="text" placeholder="Free Plan" value={currentFeature.free || ''} onChange={(e) => setCurrentFeature({...currentFeature, free: e.target.value})} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" />
              <input type="text" placeholder="Premium Plan" value={currentFeature.pro || ''} onChange={(e) => setCurrentFeature({...currentFeature, pro: e.target.value})} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" />
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
            <h3 className="text-xl font-bold text-white mb-4">{currentNote ? '✏️ Edit Note' : '📝 Add Note'} for {products.find(p => p.id === selectedProductId)?.name}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Note Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" />
              <textarea placeholder="Note Content (leave empty to remove note)" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows="4" className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20" />
              <div className="flex gap-3">
                <button onClick={saveNote} className="flex-1 bg-green-600 text-white p-2 rounded-lg">Save Note</button>
                <button onClick={() => setShowNoteModal(false)} className="flex-1 bg-gray-600 text-white p-2 rounded-lg">Cancel</button>
              </div>
              {noteContent.trim() === '' && (
                <p className="text-red-400 text-xs text-center">⚠️ Empty content will remove the note</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
