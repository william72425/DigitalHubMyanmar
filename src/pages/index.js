import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import productsData from '@/data/products.json';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load products from JSON (0 API Request!)
  useEffect(() => {
    // Get unique categories from products
    const uniqueCategories = ['All', ...new Set(productsData.map(p => p.category))];
    setCategories(uniqueCategories);
    setServices(productsData);
  }, []);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
    } else if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const filteredServices = activeCategory === 'All'
    ? services
    : services.filter(s => s.category === activeCategory);

  return (
    <>
      <Head>
        <title>Digital Hub Myanmar - Hubby Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className={`min-h-screen transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' 
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
      }`}>
        
        {/* Theme Toggle */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full backdrop-blur-md shadow-lg ${
              isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200/80 hover:bg-gray-300/80'
            }`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="container mx-auto px-4 py-4 max-w-7xl">
          
          {/* Hero Section */}
          <div className="text-center py-6 md:py-8">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#FF6B35] via-yellow-500 to-[#00D4FF] bg-clip-text text-transparent">
              Digital Hub Myanmar
            </h1>
            <p className={`mt-2 text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              🎁 Hubby Store မှ ကြိုဆိုပါတယ်! Special Discounts ရယူလိုက်ပါ!
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 justify-center flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white shadow-lg'
                    : isDarkMode 
                      ? 'bg-white/10 text-gray-400 hover:bg-white/20' 
                      : 'bg-gray-200/80 text-gray-600 hover:bg-gray-300/80'
                }`}
              >
                {cat === 'All' ? '📦 All' : cat}
              </button>
            ))}
          </div>

          {/* Service Grid - 2 columns on mobile */}
          <div className="grid grid-cols-2 gap-4">
            {filteredServices.map((service) => {
              const discount = service.discount || Math.round((1 - service.hubby_price / service.market_price) * 100);
              
              return (
                <div
                  key={service.id}
                  className={`backdrop-blur-md rounded-xl p-4 relative border transition-all duration-300 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 hover:border-[#FF6B35]/50' 
                      : 'bg-white/60 border-gray-200 hover:border-[#FF6B35]/50 shadow-sm'
                  }`}
                >
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#FF6B35] to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
                    🔥 {discount}% OFF
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] flex items-center justify-center text-white font-bold text-xl">
                      {service.name.charAt(0)}
                    </div>
                    <h3 className={`font-semibold text-sm md:text-base mt-2 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {service.name}
                    </h3>
                    <p className="text-xs text-gray-400 text-center">{service.duration}</p>
                  </div>
                  
                  <div className="text-center mt-2 pt-2 border-t border-white/10">
                    <div className="text-xs text-gray-400 line-through">
                      {service.market_price.toLocaleString()} MMK
                    </div>
                    <div className="text-[#FF6B35] font-bold text-base">
                      {service.hubby_price.toLocaleString()} MMK
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
