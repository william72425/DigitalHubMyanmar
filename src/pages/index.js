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
    
    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    
    if (categoriesData) {
      setCategories([{ name: 'All', sort_order: 0 }, ...categoriesData]);
    }
    
    // Fetch services
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .order('sort_order');
    
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
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] bg-clip-text text-transparent">
              Digital Hub Myanmar
            </h1>
            <p className="text-gray-300 mt-4">Premium Digital Services at Hubby's Special Prices 🇲🇲</p>
          </motion.div>

          {/* Category Tabs */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
            {categories.map((cat, idx) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-5 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              {filteredServices.map((service, idx) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 relative"
                >
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#FF6B35] to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {service.discount || Math.round((1 - service.hubby_price/service.market_price) * 100)}% OFF
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    {service.logo_url ? (
                      <img src={service.logo_url} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] flex items-center justify-center text-white font-bold text-lg">
                        {service.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white text-sm">{service.name}</h3>
                      <p className="text-xs text-gray-400">{service.category}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 line-through">
                    {service.market_price.toLocaleString()} MMK
                  </div>
                  <div className="text-[#FF6B35] font-bold text-lg">
                    {service.hubby_price.toLocaleString()} MMK
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredServices.length === 0 && (
            <div className="text-center py-12 text-gray-400">No services found.</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
