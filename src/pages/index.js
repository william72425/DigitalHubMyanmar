import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/utils/supabase';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
    } else if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // Save theme to localStorage
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    if (categoriesData) setCategories([{ name: 'All', sort_order: 0 }, ...categoriesData]);
    if (servicesData) setServices(servicesData);
    setLoading(false);
  };

  const filteredServices = activeCategory === 'All'
    ? services
    : services.filter(s => s.category === activeCategory);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#020617]' : 'bg-gray-50'}`}>
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Digital Hub Myanmar - Hubby Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className={`min-h-screen transition-all duration-300 relative overflow-x-hidden ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' 
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
      }`}>
        
        {/* Background Decoration */}
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl ${
          isDarkMode ? 'bg-[#FF6B35]/10' : 'bg-blue-200/50'
        }`}></div>
        <div className={`absolute bottom-20 right-10 w-80 h-80 rounded-full blur-3xl ${
          isDarkMode ? 'bg-[#00D4FF]/10' : 'bg-cyan-200/50'
        }`}></div>

        {/* Theme Toggle Button - NOT fixed, scrolls with page */}
<div className="flex justify-end mb-2 px-4">
  <button
    onClick={toggleTheme}
    className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
      isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200/80 hover:bg-gray-300/80'
    }`}
  >
    {isDarkMode ? '☀️' : '🌙'}
  </button>
</div>

        <div className="container mx-auto px-4 py-4 max-w-7xl relative z-10">
          
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative text-center py-6 md:py-8 mb-2"
          >
            {/* Left Side - Hubby Character */}
            <div className="hidden lg:block absolute left-0 bottom-0">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full blur-xl absolute -inset-2 ${
                  isDarkMode ? 'bg-[#FF6B35]/20' : 'bg-blue-300/50'
                }`}></div>
                <Image
                  src="/hubby.png"
                  alt="Hubby Character"
                  width={100}
                  height={100}
                  className="relative z-10 drop-shadow-2xl"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-24 h-24 bg-gradient-to-br from-[#FF6B35] to-[#00D4FF] rounded-2xl flex items-center justify-center text-5xl shadow-2xl">🧸</div>';
                  }}
                />
              </div>
            </div>

            {/* Right Side - Welcome Message */}
            <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2">
              <div className={`backdrop-blur-md rounded-2xl p-3 border shadow-xl ${
                isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white/30 border-gray-300'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛸</span>
                  <div>
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-[#FF6B35]' : 'text-[#FF6B35]'}`}>မင်္ဂလာပါ!</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Hubby Store မှ ကြိုဆိုပါတယ်</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Title - 2 LINES with Professional Style */}
            <div className="inline-block relative px-4">
              <div className="text-center">
                {/* Line 1 - Digital Hub */}
                <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-2 ${
                  isDarkMode 
                    ? 'text-white drop-shadow-lg' 
                    : 'text-gray-800'
                }`}
                style={{
                  fontFamily: "'Playfair Display', serif",
                  textShadow: isDarkMode ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'
                }}>
                  <span className="bg-gradient-to-r from-[#FF6B35] via-[#FF8C42] to-[#FFB347] bg-clip-text text-transparent">
                    Digital
                  </span>
                  <span className={`mx-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Hub</span>
                </h1>
                
                {/* Line 2 - Myanmar */}
                <h2 className={`text-3xl md:text-5xl lg:text-6xl font-bold tracking-wide ${
                  isDarkMode ? 'text-white/90' : 'text-gray-700'
                }`}
                style={{
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: '2px'
                }}>
                  <span className="bg-gradient-to-r from-[#00D4FF] via-[#00B8FF] to-[#0099CC] bg-clip-text text-transparent">
                    Myanmar
                  </span>
                </h2>
                
                {/* Decorative line under title */}
                <div className="flex justify-center mt-4">
                  <div className="w-20 h-0.5 bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] rounded-full"></div>
                </div>
              </div>
            </div>
            
            <p className={`mt-4 text-sm md:text-base max-w-xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              🎁 <span className="text-[#FF6B35] font-semibold">Hubby Store</span> မှ ကြိုဆိုပါတယ်! 
              Special Discounts ရယူလိုက်ပါ!
            </p>
          </motion.div>

          {/* Hubby's Special Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-gradient-to-r from-[#FF6B35]/20 to-[#00D4FF]/20 rounded-2xl p-3 md:p-4 mb-6 border ${
              isDarkMode ? 'border-white/10' : 'border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-white/10' : 'bg-white/50'
                }`}>
                  <span className="text-xl">🎉</span>
                </div>
                <div>
                  <p className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    🎉 Hubby's Special!
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ဒီနေ့အတွက် သီးသန့် 50% လျှော့စျေး
                  </p>
                </div>
              </div>
              <div className={`backdrop-blur-sm rounded-full px-4 py-1.5 ${
                isDarkMode ? 'bg-white/10' : 'bg-white/50'
              }`}>
                <span className="text-[#FF6B35] text-xs font-bold">⏰ အချိန်အကန့်အသတ်နဲ့</span>
              </div>
            </div>
          </motion.div>

          {/* Category Tabs */}
          <div className="relative mb-6">
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide justify-center flex-wrap">
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                    activeCategory === cat.name
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white shadow-lg shadow-orange-500/30'
                      : isDarkMode 
                        ? 'bg-white/10 text-gray-400 hover:bg-white/20' 
                        : 'bg-gray-200/80 text-gray-600 hover:bg-gray-300/80'
                  }`}
                >
                  {cat.name === 'All' ? '📦 All' : cat.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Service Grid */}
          {filteredServices.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-4 md:gap-5"
              >
                {filteredServices.map((service, idx) => {
                  const logoSize = service.logo_size || 80;
                  const discount = service.discount || Math.round((1 - service.hubby_price / service.market_price) * 100);
                  
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className={`backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-5 relative border transition-all duration-300 group ${
                        isDarkMode 
                          ? 'bg-white/5 border-white/10 hover:border-[#FF6B35]/50' 
                          : 'bg-white/60 border-gray-200 hover:border-[#FF6B35]/50 shadow-sm'
                      }`}
                    >
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#FF6B35] to-red-500 text-white text-xs md:text-sm font-bold px-2 py-1 rounded-full z-10 shadow-lg">
                        🔥 {discount}% OFF
                      </div>
                      
                      <div className="flex flex-col items-center mb-3 md:mb-4">
                        <div 
                          className="flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105"
                          style={{ width: logoSize + 'px', height: logoSize + 'px' }}
                        >
                          {service.logo_url ? (
                            <img 
                              src={service.logo_url} 
                              className="w-full h-full object-contain" 
                              alt={service.name}
                              style={{ backgroundColor: 'transparent' }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#00D4FF] rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                              {service.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <h3 className={`font-semibold text-base md:text-lg mt-3 text-center group-hover:text-[#FF6B35] transition-colors ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {service.name}
                        </h3>
                        <p className={`text-xs md:text-sm text-center ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {service.category}
                        </p>
                      </div>
                      
                      <div className="text-center space-y-1 pt-2 border-t border-white/10">
                        <div className={`text-xs md:text-sm line-through ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-400'
                        }`}>
                          {service.market_price.toLocaleString()} MMK
                        </div>
                        <div className="text-[#FF6B35] font-bold text-lg md:text-xl">
                          {service.hubby_price.toLocaleString()} MMK
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-12">
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No services found in this category.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
          }
