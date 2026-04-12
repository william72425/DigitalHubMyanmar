import React, { useState, useEffect } from 'react';
import Head from 'next/head';
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
    
    if (categoriesData) {
      setCategories([{ name: 'All', sort_order: 0 }, ...categoriesData]);
    }
    
    if (servicesData) {
      setServices(servicesData);
    }
    
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
        <title>Digital Hub Myanmar - Premium Digital Services</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#020617]">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 md:py-12">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] bg-clip-text text-transparent">
              Digital Hub Myanmar
            </h1>
            <p className="text-gray-300 mt-2 text-sm md:text-base">Premium Digital Services at Hubby's Special Prices 🇲🇲</p>
          </motion.div>

          {/* Category Tabs */}
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 mb-6 md:mb-8 scrollbar-hide">
            {categories.map((cat, idx) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-4 md:px-5 py-2 rounded-full font-medium text-xs md:text-sm whitespace-nowrap transition-all ${
                  activeCategory === cat.name 
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white' 
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>

          {/* Service Grid */}
          {filteredServices.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-3 md:gap-4"
              >
                {filteredServices.map((service, idx) => {
                  // Get logo size from database, default to 70 (bigger)
                  const logoSize = service.logo_size || 70;
                  // Calculate discount if not present
                  const discount = service.discount || Math.round((1 - service.hubby_price / service.market_price) * 100);
                  
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      whileHover={{ y: -3 }}
                      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 relative"
                    >
                      {/* Discount Badge */}
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#FF6B35] to-red-500 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full z-10">
                        {discount}% OFF
                      </div>
                      
                      {/* Logo - SQUARE Frame with background for transparency support */}
                      <div className="flex flex-col items-center mb-3 md:mb-4">
                        <div 
                          className="rounded-xl bg-[#0f1425] border-2 border-white/20 shadow-lg flex items-center justify-center overflow-hidden"
                          style={{ 
                            width: logoSize + 'px', 
                            height: logoSize + 'px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                          }}
                        >
                          {service.logo_url ? (
                            <img 
                              src={service.logo_url} 
                              className="w-full h-full object-contain p-1" 
                              alt={service.name}
                              style={{ backgroundColor: 'transparent' }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#00D4FF] flex items-center justify-center text-white font-bold text-xl">
                              {service.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-white text-sm md:text-base mt-2 text-center">
                          {service.name}
                        </h3>
                        <p className="text-[10px] md:text-xs text-gray-400 text-center">
                          {service.category}
                        </p>
                      </div>
                      
                      {/* Prices */}
                      <div className="text-center space-y-0.5 pt-2 border-t border-white/10">
                        <div className="text-[10px] md:text-xs text-gray-400 line-through">
                          {service.market_price.toLocaleString()} MMK
                        </div>
                        <div className="text-[#FF6B35] font-bold text-base md:text-lg">
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
      `}</style>
    </>
  );
}
