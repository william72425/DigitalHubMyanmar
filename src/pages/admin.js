import React, { useState, useEffect } from 'react';
import { servicesData, categories } from '@/data/servicesData';
import { useRouter } from 'next/router';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    name: '', category: 'Video Editing', marketPrice: '', hubbyPrice: '', discount: ''
  });

  const router = useRouter();

  // Login check (simple password - သင်ပြောင်းနိုင်)
  const handleLogin = (e) => {
    e.preventDefault();
    // ဒီ password ကို သင်စိတ်ကြိုက်ပြောင်းပါ
    if (password === 'Hubby2026@') {
      setIsAuthenticated(true);
      loadServices();
    } else {
      alert('Wrong password!');
    }
  };

  const loadServices = () => {
    const stored = localStorage.getItem('digitalHubServices');
    if (stored) {
      setServices(JSON.parse(stored));
    } else {
      setServices(servicesData);
      localStorage.setItem('digitalHubServices', JSON.stringify(servicesData));
    }
  };

  const saveToLocalStorage = (newServices) => {
    setServices(newServices);
    localStorage.setItem('digitalHubServices', JSON.stringify(newServices));
    alert('Service saved! But need to update servicesData.js manually for permanent storage');
  };

  const addService = (e) => {
    e.preventDefault();
    const newService = {
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      marketPrice: parseInt(formData.marketPrice),
      hubbyPrice: parseInt(formData.hubbyPrice),
      discount: parseInt(formData.discount)
    };
    saveToLocalStorage([...services, newService]);
    setFormData({ name: '', category: 'Video Editing', marketPrice: '', hubbyPrice: '', discount: '' });
  };

  const deleteService = (id) => {
    if (confirm('Delete this service?')) {
      saveToLocalStorage(services.filter(s => s.id !== id));
    }
  };

  // Export code to copy
  const exportToCode = () => {
    const exportData = services.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      marketPrice: s.marketPrice,
      hubbyPrice: s.hubbyPrice,
      discount: s.discount
    }));
    console.log('Copy this to servicesData.js:', JSON.stringify(exportData, null, 2));
    alert('Check browser console for the code to copy!');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="glassmorphism p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-4">Admin Login</h1>
          <p className="text-gray-400 text-sm mb-4">(Password: hubby2024)</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full p-3 rounded-lg bg-white/10 text-white mb-4"
            />
            <button type="submit" className="w-full bg-[#FF6B35] text-white p-3 rounded-lg">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button onClick={exportToCode} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
              Export Code
            </button>
            <button onClick={() => window.location.href='/'} className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
              View Site
            </button>
          </div>
        </div>

        {/* Add New Service Form */}
        <div className="glassmorphism p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Add New Service</h2>
          <form onSubmit={addService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Service Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="p-3 rounded-lg bg-white/10 text-white"
              required
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="p-3 rounded-lg bg-white/10 text-white"
            >
              {categories.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Market Price (MMK)"
              value={formData.marketPrice}
              onChange={(e) => setFormData({...formData, marketPrice: e.target.value})}
              className="p-3 rounded-lg bg-white/10 text-white"
              required
            />
            <input
              type="number"
              placeholder="Hubby Price (MMK)"
              value={formData.hubbyPrice}
              onChange={(e) => setFormData({...formData, hubbyPrice: e.target.value})}
              className="p-3 rounded-lg bg-white/10 text-white"
              required
            />
            <input
              type="number"
              placeholder="Discount %"
              value={formData.discount}
              onChange={(e) => setFormData({...formData, discount: e.target.value})}
              className="p-3 rounded-lg bg-white/10 text-white"
              required
            />
            <button type="submit" className="bg-[#FF6B35] text-white p-3 rounded-lg">
              + Add Service
            </button>
          </form>
        </div>

        {/* Service List */}
        <div className="glassmorphism p-6">
          <h2 className="text-xl font-bold text-white mb-4">Current Services ({services.length})</h2>
          <div className="space-y-2">
            {services.map(service => (
              <div key={service.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <span className="text-white font-medium">{service.name}</span>
                  <span className="text-gray-400 text-sm ml-2">({service.category})</span>
                  <div className="text-xs text-gray-500">
                    {service.hubbyPrice.toLocaleString()} MMK
                  </div>
                </div>
                <button
                  onClick={() => deleteService(service.id)}
                  className="bg-red-600/30 text-red-400 px-3 py-1 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center text-gray-500 text-sm">
          ⚠️ Note: Changes are temporary. To make permanent, copy the exported code and replace servicesData.js
        </div>
      </div>
    </div>
  );
      }
