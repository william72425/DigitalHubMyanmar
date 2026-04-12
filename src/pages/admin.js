import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', category: '', market_price: '', hubby_price: '', logo_file: null
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true });
    
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (servicesData) setServices(servicesData);
    if (categoriesData) setCategories(categoriesData);
    
    setLoading(false);
  };

  const uploadLogo = async (file) => {
    if (!file) return null;
    
    setUploading(true);
    setMessage('Uploading logo...');
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);
      
      setMessage('Logo uploaded!');
      return publicUrl;
      
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('❌ Upload failed: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const addService = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.market_price || !formData.hubby_price) {
      setMessage('❌ Please fill all fields');
      return;
    }
    
    setLoading(true);
    setMessage('Adding service...');
    
    try {
      let logoUrl = null;
      if (formData.logo_file) {
        logoUrl = await uploadLogo(formData.logo_file);
      }
      
      const maxOrder = services.length > 0 
        ? Math.max(...services.map(s => s.sort_order || 0)) + 1 
        : 1;
      
      const { error } = await supabase.from('services').insert([{
        name: formData.name,
        category: formData.category,
        market_price: parseInt(formData.market_price),
        hubby_price: parseInt(formData.hubby_price),
        discount: Math.round((1 - parseInt(formData.hubby_price)/parseInt(formData.market_price)) * 100),
        logo_url: logoUrl,
        sort_order: maxOrder
      }]);
      
      if (error) throw error;
      
      setMessage('✅ Service added successfully!');
      setFormData({ name: '', category: categories[0]?.name || '', market_price: '', hubby_price: '', logo_file: null });
      fetchData();
      
      document.getElementById('logoInput').value = '';
      
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    }
    setLoading(false);
  };

  const updateService = async (id, updates) => {
    const { error } = await supabase.from('services').update(updates).eq('id', id);
    if (error) {
      setMessage('❌ Update failed: ' + error.message);
    } else {
      setMessage('✅ Updated!');
      fetchData();
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const deleteService = async (id) => {
    if (confirm('Delete this service permanently?')) {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) {
        setMessage('❌ Delete failed: ' + error.message);
      } else {
        setMessage('✅ Deleted!');
        fetchData();
      }
    }
  };

  // Drag & Drop Sort Functions
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    setDraggedItem(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;
    
    if (draggedItem !== index) {
      const newServices = [...services];
      const draggedService = newServices[draggedItem];
      newServices.splice(draggedItem, 1);
      newServices.splice(index, 0, draggedService);
      
      newServices.forEach((service, idx) => {
        service.sort_order = idx;
      });
      
      setServices(newServices);
      setDraggedItem(index);
    }
  };

  const saveOrder = async () => {
    setLoading(true);
    for (let i = 0; i < services.length; i++) {
      await supabase
        .from('services')
        .update({ sort_order: i })
        .eq('id', services[i].id);
    }
    setMessage('✅ Order saved to database!');
    setTimeout(() => setMessage(''), 2000);
    setLoading(false);
  };

  const handleLogoUpload = async (serviceId, file) => {
    if (!file) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${serviceId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);
      
      await updateService(serviceId, { logo_url: publicUrl });
      setMessage('✅ Logo updated!');
      
    } catch (error) {
      setMessage('❌ Logo upload failed: ' + error.message);
    }
    setUploading(false);
  };

  const addCategory = async () => {
    const newCat = prompt('Enter new category name:');
    if (!newCat || !newCat.trim()) return;
    
    const maxOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.sort_order || 0)) + 1 
      : 1;
    
    const { error } = await supabase.from('categories').insert([{
      name: newCat,
      sort_order: maxOrder
    }]);
    
    if (error) {
      setMessage('❌ ' + error.message);
    } else {
      setMessage('✅ Category added!');
      fetchData();
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'hubby2024') {
      setIsAuthenticated(true);
    } else {
      alert('Wrong password!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-400 text-sm mb-4">Digital Hub Myanmar Control Panel</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full p-3 rounded-lg bg-white/10 text-white mb-4 border border-white/20"
            />
            <button type="submit" className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-3 rounded-lg font-semibold">
              Login to Dashboard
            </button>
          </form>
          <p className="text-center text-gray-500 text-xs mt-4">Default: hubby2024</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">🛸 Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">Drag & Drop to Reorder | Upload Logos | Adjust Logo Size</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.open('/', '_blank')} className="bg-blue-600/30 text-blue-400 px-4 py-2 rounded-lg text-sm">
              View Live Site
            </button>
            <button onClick={fetchData} className="bg-green-600/30 text-green-400 px-4 py-2 rounded-lg text-sm">
              Refresh
            </button>
            <button onClick={saveOrder} disabled={loading} className="bg-yellow-600/30 text-yellow-400 px-4 py-2 rounded-lg text-sm">
              {loading ? 'Saving...' : '💾 Save Order'}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center ${message.includes('✅') ? 'bg-green-600/20 border-green-500/50 text-green-400' : 'bg-red-600/20 border-red-500/50 text-red-400'}`}>
            {message}
          </div>
        )}

        {/* Add New Service Form */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">➕ Add New Service</h2>
          <form onSubmit={addService} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Service Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-[#FF6B35] outline-none"
              required
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="p-3 rounded-lg bg-white/10 text-white border border-white/20"
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Market Price (MMK)"
              value={formData.market_price}
              onChange={(e) => setFormData({...formData, market_price: e.target.value})}
              className="p-3 rounded-lg bg-white/10 text-white border border-white/20"
              required
            />
            <input
              type="number"
              placeholder="Hubby Price (MMK)"
              value={formData.hubby_price}
              onChange={(e) => setFormData({...formData, hubby_price: e.target.value})}
              className="p-3 rounded-lg bg-white/10 text-white border border-white/20"
              required
            />
            <div>
              <input
                id="logoInput"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => setFormData({...formData, logo_file: e.target.files[0]})}
                className="p-2 rounded-lg bg-white/10 text-white border border-white/20 w-full text-sm"
              />
            </div>
            <button type="submit" disabled={loading || uploading} className="bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-3 rounded-lg font-semibold col-span-full md:col-span-1">
              {loading ? 'Adding...' : uploading ? 'Uploading...' : '+ Add Service'}
            </button>
          </form>
        </div>

        {/* Category Management */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">📂 Categories</h2>
          <button onClick={addCategory} className="bg-purple-600/30 text-purple-400 px-4 py-2 rounded-lg text-sm mb-4">
            + Add New Category
          </button>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <span key={cat.name} className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        {/* Service List with Drag & Drop and Logo Size Adjust */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            📦 All Services ({services.length})
            <span className="text-xs text-gray-400 ml-2">(Drag the ⠿ icon to reorder)</span>
          </h2>
          
          <div className="space-y-3">
            {services.map((service, index) => {
              const [logoSize, setLogoSize] = useState(service.logo_size || 48);
              
              return (
                <div
                  key={service.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 cursor-move transition-all hover:bg-white/10"
                  style={{ cursor: 'grab' }}
                >
                  <div className="flex flex-wrap gap-3 items-start">
                    {/* Drag Handle */}
                    <div className="text-gray-500 text-2xl cursor-grab active:cursor-grabbing" style={{ cursor: 'grab' }}>
                      ⠿
                    </div>
                    
                    {/* Logo Preview with Size Control */}
                    <div className="flex-shrink-0">
                      <div 
                        className="rounded-full bg-white/10 overflow-hidden border-2 border-white/20 transition-all"
                        style={{ 
                          width: `${logoSize}px`, 
                          height: `${logoSize}px`,
                        }}
                      >
                        {service.logo_url ? (
                          <img src={service.logo_url} className="w-full h-full object-cover" alt={service.name} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] flex items-center justify-center text-white font-bold text-xl">
                            {service.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      {/* Size Slider */}
                      <div className="mt-1 text-center">
                        <input
                          type="range"
                          min="32"
                          max="80"
                          value={logoSize}
                          onChange={(e) => {
                            const newSize = parseInt(e.target.value);
                            setLogoSize(newSize);
                            updateService(service.id, { logo_size: newSize });
                          }}
                          className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          style={{ accentColor: '#FF6B35' }}
                        />
                        <p className="text-[10px] text-gray-500">{logoSize}px</p>
                      </div>
                    </div>
                    
                    {/* Editable Fields */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        value={service.name}
                        onChange={(e) => updateService(service.id, { name: e.target.value })}
                        className="bg-white/10 text-white p-2 rounded border border-white/20"
                      />
                      <select
                        value={service.category}
                        onChange={(e) => updateService(service.id, { category: e.target.value })}
                        className="bg-white/10 text-white p-2 rounded border border-white/20"
                      >
                        {categories.map(cat => (
                          <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={service.market_price}
                        onChange={(e) => updateService(service.id, { market_price: parseInt(e.target.value) })}
                        className="bg-white/10 text-white p-2 rounded border border-white/20"
                      />
                      <input
                        type="number"
                        value={service.hubby_price}
                        onChange={(e) => updateService(service.id, { hubby_price: parseInt(e.target.value) })}
                        className="bg-white/10 text-[#FF6B35] p-2 rounded border border-white/20 font-semibold"
                      />
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteService(service.id)}
                      className="bg-red-600/30 text-red-400 px-3 py-2 rounded-lg text-sm hover:bg-red-600/50"
                    >
                      Delete
                    </button>
                  </div>
                  
                  {/* Logo Upload for existing service */}
                  <div className="mt-3 ml-8">
                    <label className="text-xs text-gray-400 block mb-1">Change Logo:</label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={async (e) => {
                        if (e.target.files[0]) {
                          await handleLogoUpload(service.id, e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                      className="text-xs text-gray-400 bg-white/5 p-1 rounded"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          {services.length === 0 && (
            <div className="text-center py-8 text-gray-500">No services yet. Add your first service above!</div>
          )}
        </div>
      </div>
    </div>
  );
  }
