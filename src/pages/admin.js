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
  
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formMarketPrice, setFormMarketPrice] = useState('');
  const [formHubbyPrice, setFormHubbyPrice] = useState('');
  const [formLogoFile, setFormLogoFile] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  async function fetchData() {
    setLoading(true);
    const { data: servicesData } = await supabase.from('services').select('*').order('sort_order');
    const { data: categoriesData } = await supabase.from('categories').select('*').order('sort_order');
    if (servicesData) setServices(servicesData);
    if (categoriesData) setCategories(categoriesData);
    setLoading(false);
  }

  async function uploadLogo(file) {
    if (!file) return null;
    setUploading(true);
    try {
      const fileName = Date.now() + '.' + file.name.split('.').pop();
      const { error } = await supabase.storage.from('logos').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      setMessage('Upload error: ' + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function addService(e) {
    e.preventDefault();
    if (!formName || !formCategory || !formMarketPrice || !formHubbyPrice) {
      setMessage('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const logoUrl = formLogoFile ? await uploadLogo(formLogoFile) : null;
      const maxOrder = services.length + 1;
      const { error } = await supabase.from('services').insert([{
        name: formName,
        category: formCategory,
        market_price: parseInt(formMarketPrice),
        hubby_price: parseInt(formHubbyPrice),
        discount: 100 - Math.round((parseInt(formHubbyPrice) / parseInt(formMarketPrice)) * 100),
        logo_url: logoUrl,
        logo_size: 56,
        sort_order: maxOrder
      }]);
      if (error) throw error;
      setMessage('✅ Service added!');
      setFormName('');
      setFormCategory('');
      setFormMarketPrice('');
      setFormHubbyPrice('');
      setFormLogoFile(null);
      fetchData();
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
    setLoading(false);
  }

  async function updateService(id, field, value) {
    const { error } = await supabase.from('services').update({ [field]: value }).eq('id', id);
    if (!error) {
      setMessage('✅ Updated!');
      fetchData();
      setTimeout(() => setMessage(''), 1500);
    }
  }

  async function deleteService(id) {
    if (confirm('Delete this service?')) {
      await supabase.from('services').delete().eq('id', id);
      fetchData();
      setMessage('✅ Deleted!');
    }
  }

  // Drag & Drop Functions
  function handleDragStart(e, index) {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.4';
  }

  function handleDragEnd(e) {
    e.target.style.opacity = '';
    setDraggedItem(null);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (draggedItem === null) return;
    if (draggedItem !== index) {
      const newServices = [...services];
      const draggedService = newServices[draggedItem];
      newServices.splice(draggedItem, 1);
      newServices.splice(index, 0, draggedService);
      setServices(newServices);
      setDraggedItem(index);
    }
  }

  async function saveOrder() {
    setLoading(true);
    for (let i = 0; i < services.length; i++) {
      await supabase.from('services').update({ sort_order: i }).eq('id', services[i].id);
    }
    setMessage('✅ Order saved!');
    setTimeout(() => setMessage(''), 1500);
    setLoading(false);
  }

  async function addCategory() {
    const newCat = prompt('Enter new category name:');
    if (!newCat) return;
    const maxOrder = categories.length + 1;
    await supabase.from('categories').insert([{ name: newCat, sort_order: maxOrder }]);
    fetchData();
    setMessage('✅ Category added!');
  }

  function handleLogin(e) {
    e.preventDefault();
    if (password === 'hubby2024') {
      setIsAuthenticated(true);
    } else {
      alert('Wrong password');
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-white mb-4 border border-white/20"
            />
            <button type="submit" className="w-full bg-orange-500 text-white p-3 rounded-lg font-semibold">
              Login
            </button>
          </form>
          <p className="text-center text-gray-400 text-sm mt-4">Password: hubby2024</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-white">🛸 Admin Dashboard</h1>
          <div className="flex gap-2">
            <button onClick={saveOrder} disabled={loading} className="bg-yellow-500/30 text-yellow-400 px-3 py-2 rounded-lg text-sm">
              💾 Save Order
            </button>
            <a href="/" target="_blank" className="bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-sm">
              View Site
            </a>
            <button onClick={fetchData} className="bg-green-500/30 text-green-400 px-3 py-2 rounded-lg text-sm">
              Refresh
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-4 p-3 bg-green-600/20 border border-green-500 rounded-lg text-green-400 text-center">
            {message}
          </div>
        )}

        {/* Add Service Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">➕ Add New Service</h2>
          <form onSubmit={addService} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Service Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="p-3 rounded-lg bg-white/10 text-white border border-white/20"
              required
            />
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="p-3 rounded-lg bg-white/10 text-white border border-white/20"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Market Price"
              value={formMarketPrice}
              onChange={(e) => setFormMarketPrice(e.target.value)}
              className="p-3 rounded-lg bg-white/10 text-white border border-white/20"
              required
            />
            <input
              type="number"
              placeholder="Hubby Price"
              value={formHubbyPrice}
              onChange={(e) => setFormHubbyPrice(e.target.value)}
              className="p-3 rounded-lg bg-white/10 text-white border border-white/20"
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormLogoFile(e.target.files[0])}
              className="p-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
            />
            <button type="submit" disabled={loading || uploading} className="bg-orange-500 text-white p-3 rounded-lg font-semibold md:col-span-5">
              {loading ? 'Adding...' : uploading ? 'Uploading...' : '+ Add Service'}
            </button>
          </form>
        </div>

        {/* Categories */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">📂 Categories</h2>
            <button onClick={addCategory} className="bg-purple-500/30 text-purple-400 px-3 py-1 rounded-lg text-sm">
              + New Category
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span key={cat.id} className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        {/* Service List - Drag & Drop + Logo Size Slider */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            📦 Services ({services.length})
            <span className="text-xs text-gray-400 ml-2">(Drag the ⠿ icon to reorder)</span>
          </h2>
          
          <div className="space-y-3">
            {services.map((service, index) => {
              const logoSize = service.logo_size || 56;
              
              return (
                <div
                  key={service.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 cursor-move hover:bg-white/10 transition"
                >
                  <div className="flex flex-wrap gap-3 items-start">
                    {/* Drag Handle */}
                    <div className="text-gray-500 text-2xl cursor-grab active:cursor-grabbing" style={{ cursor: 'grab' }}>
                      ⠿
                    </div>
                    
                    {/* Logo with Size Slider */}
                    <div className="flex flex-col items-center gap-1">
                      <div 
                        className="rounded-full bg-white/10 overflow-hidden border-2 border-white/20 flex-shrink-0 transition-all"
                        style={{ width: logoSize + 'px', height: logoSize + 'px' }}
                      >
                        {service.logo_url ? (
                          <img src={service.logo_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-orange-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                            {service.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      {/* Size Slider */}
                      <div className="flex flex-col items-center">
                        <input
                          type="range"
                          min="40"
                          max="80"
                          value={logoSize}
                          onChange={async (e) => {
                            const newSize = parseInt(e.target.value);
                            await updateService(service.id, 'logo_size', newSize);
                          }}
                          className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                          style={{ accentColor: '#FF6B35' }}
                        />
                        <span className="text-[10px] text-gray-500">{logoSize}px</span>
                      </div>
                    </div>
                    
                    {/* Fields */}
                    <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <input
                        value={service.name}
                        onChange={(e) => updateService(service.id, 'name', e.target.value)}
                        className="bg-white/10 text-white p-2 rounded border border-white/20 text-sm"
                      />
                      <select
                        value={service.category}
                        onChange={(e) => updateService(service.id, 'category', e.target.value)}
                        className="bg-white/10 text-white p-2 rounded border border-white/20 text-sm"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={service.market_price}
                        onChange={(e) => updateService(service.id, 'market_price', parseInt(e.target.value))}
                        className="bg-white/10 text-white p-2 rounded border border-white/20 text-sm"
                      />
                      <input
                        type="number"
                        value={service.hubby_price}
                        onChange={(e) => updateService(service.id, 'hubby_price', parseInt(e.target.value))}
                        className="bg-white/10 text-orange-400 p-2 rounded border border-white/20 text-sm font-semibold"
                      />
                    </div>
                    
                    {/* Delete */}
                    <button onClick={() => deleteService(service.id)} className="bg-red-600/30 text-red-400 px-3 py-2 rounded-lg text-sm">
                      Delete
                    </button>
                  </div>
                  
                  {/* Logo Upload */}
                  <div className="mt-3 ml-10">
                    <label className="text-xs text-gray-400 block mb-1">Change Logo:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files[0]) {
                          const url = await uploadLogo(e.target.files[0]);
                          if (url) {
                            await supabase.from('services').update({ logo_url: url }).eq('id', service.id);
                            fetchData();
                          }
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
