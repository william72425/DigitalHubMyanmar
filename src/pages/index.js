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
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Digital Hub Myanmar - Hubby Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617] relative overflow-x-hidden">
        {/* Background Decoration */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF6B35]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#00D4FF]/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 py-6 max-w-7xl relative z-10">
          
          {/* Hero Section with Hubby Character */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative text-center py-8 md:py-12 mb-8"
          >
            {/* Left Side - Hubby Character */}
            <div className="hidden lg:block absolute left-0 bottom-0">
              <div className="relative">
                <div className="w-40 h-40 bg-gradient-to-br from-[#FF6B35]/20 to-[#00D4FF]/20 rounded-full blur-xl absolute -inset-2"></div>
                <Image
                  src="/hubby.png"
                  alt="Hubby Character"
                  width={120}
                  height={120}
                  className="relative z-10 drop-shadow-2xl"
                  onError={(e) => {
                    // If image doesn't exist, show emoji instead
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-32 h-32 bg-gradient-to-br from-[#FF6B35] to-[#00D4FF] rounded-2xl flex items-center justify-center text-6xl shadow-2xl">🧸</div>';
                  }}
                />
                <p className="text-center text-[#FF6B35] text-xs font-semibold mt-2 animate-bounce">
                  Hubby 🤍
                </p>
              </div>
            </div>

            {/* Right Side - Welcome Message Card */}
            <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛸</span>
                  <div>
                    <p className="text-[#FF6B35] text-sm font-bold">မင်္ဂလာပါ!</p>
                    <p className="text-gray-300 text-xs">Hubby Store မှ ကြိုဆိုပါတယ်</p>
                  </div>
                </div>
                <div className="mt-2 h-0.5 w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] rounded-full"></div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">✨ Today's Special ✨</p>
              </div>
            </div>

            {/* Main Title */}
            <div className="inline-block relative">
              {/* Small Hubby icons around title */}
              <div className="absolute -left-12 -top-6 z-20 animate-bounce">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-2 border border-white/20">
                  <span className="text-2xl">🛸</span>
                </div>
              </div>
              <div className="absolute -right-12 -top-6 z-20 animate-pulse">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-2 border border-white/20">
                  <span className="text-2xl">⭐</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#FF6B35] via-yellow-500 to-[#00D4FF] bg-clip-text text-transparent px-4 py-2">
                Digital Hub Myanmar
              </h1>
            </div>
            
            <p className="text-gray-300 mt-4 text-sm md:text-base max-w-2xl mx-auto">
              🎁 <span className="text-[#FF6B35] font-semibold">Hubby Store</span> မှ ကြိုဆိုပါတယ်! 
              အခုပဲ ဝယ်ယူပြီး <span className="text-[#FF6B35] font-semibold">Special Discounts</span> ရယူလိုက်ပါ!
            </p>
          </motion.div>

          {/* Category Tabs */}
          <div className="relative mb-8">
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 scrollbar-hide justify-center flex-wrap">
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`px-4 md:px-5 py-2 rounded-full font-medium text-xs md:text-sm whitespace-nowrap transition-all ${
                    activeCategory === cat.name
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white shadow-lg shadow-orange-500/30'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {cat.name === 'All' ? '📦 All' : cat.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Store Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-[#FF6B35]/20 to-[#00D4FF]/20 rounded-2xl p-3 md:p-4 mb-8 border border-white/10"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-xl">🛸</span>
                </div>
                <div>
                  <p className="text-white text-sm md:text-base font-semibold">🎉 Hubby's Special!</p>
                  <p className="text-gray-400 text-xs">ဒီနေ့အတွက် သီးသန့် 50% လျှော့စျေး</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
                <span className="text-[#FF6B35] text-xs font-bold">⏰ အချိန်အကန့်အသတ်နဲ့</span>
              </div>
            </div>
          </motion.div>

          {/* Service Grid */}
          {filteredServices.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-3 md:gap-5"
              >
                {filteredServices.map((service, idx) => {
                  const logoSize = service.logo_size || 70;
                  const discount = service.discount || Math.round((1 - service.hubby_price / service.market_price) * 100);
                  
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="bg-white/5 backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-4 relative border border-white/10 hover:border-[#FF6B35]/50 transition-all duration-300 group"
                    >
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#FF6B35] to-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
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
                        <h3 className="font-semibold text-white text-sm md:text-base mt-3 text-center group-hover:text-[#FF6B35] transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-[10px] md:text-xs text-gray-400 text-center">
                          {service.category}
                        </p>
                      </div>
                      
                      <div className="text-center space-y-1 pt-2 border-t border-white/10">
                        <div className="text-[10px] md:text-xs text-gray-400 line-through">
                          {service.market_price.toLocaleString()} MMK
                        </div>
                        <div className="text-[#FF6B35] font-bold text-base md:text-lg">
                          {service.hubby_price.toLocaleString()} MMK
                        </div>
                      </div>
                      
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs bg-white/10 p-1.5 rounded-full">🛒</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No services found in this category.</p>
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
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce {
          animation: bounce 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
    }
