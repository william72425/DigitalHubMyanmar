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
  
  const [formData, setFormData] = useState({
    name: '', category: '', market_price: '', hubby_price: '', logo_file: null
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      createStorageBucket();
    }
  }, [isAuthenticated]);

  const createStorageBucket = async () => {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'logos')) {
      await supabase.storage.createBucket('logos', { public: true });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .order('sort_order');
    
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    
    if (servicesData) setServices(servicesData);
    if (categoriesData) setCategories(categoriesData);
    
    setLoading(false);
  };

  const uploadLogo = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);
    
    return publicUrl;
  };

  const addService = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('Adding service...');
    
    try {
      let logoUrl = null;
      if (formData.logo_file) {
        logoUrl = await uploadLogo(formData.logo_file);
      }
      
      const maxOrder = Math.max(...services.map(s => s.sort_order || 0), 0);
      
      const { error } = await supabase.from('services').insert([{
        name: formData.name,
        category: formData.category,
        market_price: parseInt(formData.market_price),
        hubby_price: parseInt(formData.hubby_price),
        discount: Math.round((1 - parseInt(formData.hubby_price)/parseInt(formData.market_price)) * 100),
        logo_url: logoUrl,
        sort_order: maxOrder + 1
      }]);
      
      if (error) throw error;
      
      setMessage('✅ Service added successfully!');
      fetchData();
      setFormData({ name: '', category: categories[0]?.name || '', market_price: '', hubby_price: '', logo_file: null });
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    }
    setUploading(false);
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

  const addCategory = async () => {
    const newCat = prompt('Enter new category name:');
    if (!newCat || !newCat.trim()) return;
    
    const maxOrder = Math.max(...categories.map(c => c.sort_order || 0), 0);
    
    const { error } = await supabase.from('categories').insert([{
      name: newCat,
      sort_order: maxOrder + 1
    }]);
    
    if (error) {
      setMessage('❌ ' + error.message);
    } else {
      setMessage('✅ Category added!');
      fetchData();
    }
  };

  const moveServiceUp = async (index) => {
    if (index === 0) return;
    
    const newServices = [...services];
    [newServices[index - 1], newServices[index]] = [newServices[index], newServices[index - 1]];
    
    for (let i = 0; i < newServices.length; i++) {
      await supabase.from('services').update({ sort_order: i }).eq('id', newServices[i].id);
    }
    
    setServices(newServices);
    setMessage('✅ Order updated!');
    setTimeout(() => setMessage(''), 2000);
  };

  const moveServiceDown = async (index) => {
    if (index === services.length - 1) return;
    
    const newServices = [...services];
    [newServices[index + 1], newServices[index]] = [newServices[index], newServices[index + 1]];
    
    for (let i = 0; i < newServices.length; i++) {
      await supabase.from('services').update({ sort_order: i }).eq('id', newServices[i].id);
    }
    
    setServices(newServices);
    setMessage('✅ Order updated!');
    setTimeout(() => setMessage(''), 2000);
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
            <p className="text-gray-400 text-sm">Manage Services | Upload Logos | Edit Everything</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.open('/', '_blank')} className="bg-blue-600/30 text-blue-400 px-4 py-2 rounded-lg text-sm">
              View Live Site
            </button>
            <button onClick={fetchData} className="bg-green-600/30 text-green-400 px-4 py-2 rounded-lg text-sm">
              Refresh
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
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setFormData({...formData, logo_file: e.target.files[0]})}
                className="p-2 rounded-lg bg-white/10 text-white border border-white/20 w-full text-sm"
              />
            </div>
            <button type="submit" disabled={uploading} className="bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-3 rounded-lg font-semibold col-span-full md:col-span-1">
              {uploading ? 'Uploading...' : '+ Add Service'}
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

        {/* Service List */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            📦 All Services ({services.length})
            <span className="text-xs text-gray-400 ml-2">(Use ↑↓ to reorder)</span>
          </h2>
          
          <div className="space-y-3">
            {services.map((service, index) => (
              <div key={service.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex flex-wrap gap-3 items-start">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveServiceUp(index)} className="text-gray-400 hover:text-white text-sm">↑</button>
                    <button onClick={() => moveServiceDown(index)} className="text-gray-400 hover:text-white text-sm">↓</button>
                  </div>
                  
                  {/* Logo Preview */}
                  <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                    {service.logo_url ? (
                      <img src={service.logo_url} className="w-full h-full object-cover" alt={service.name} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] flex items-center justify-center text-white font-bold">
                        {service.name.charAt(0)}
                      </div>
                    )}
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
                <div className="mt-2 ml-8">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={async (e) => {
                      if (e.target.files[0]) {
                        setUploading(true);
                        const url = await uploadLogo(e.target.files[0]);
                        await updateService(service.id, { logo_url: url });
                        setUploading(false);
                      }
                    }}
                    className="text-xs text-gray-400"
                  />
                  <span className="text-xs text-gray-500 ml-2">Upload new logo</span>
                </div>
              </div>
            ))}
          </div>
          
          {services.length === 0 && (
            <div className="text-center py-8 text-gray-500">No services yet. Add your first service above!</div>
          )}
        </div>
      </div>
    </div>
  );
                }
