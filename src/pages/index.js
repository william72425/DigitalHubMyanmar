import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { servicesData, categories } from '@/data/servicesData';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [filteredServices, setFilteredServices] = useState(servicesData);

  useEffect(() => {
    if (activeCategory === 'All') {
      setFilteredServices(servicesData);
    } else {
      setFilteredServices(servicesData.filter(s => s.category === activeCategory));
    }
  }, [activeCategory]);

  return (
    <>
      <Head>
        <title>Digital Hub Myanmar - Premium Digital Services</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          
          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-hubby-orange to-hubby-cyan bg-clip-text text-transparent">
              Digital Hub Myanmar
            </h1>
            <p className="text-gray-300 mt-4">Premium Digital Services at Hubby's Special Prices 🇲🇲</p>
          </motion.div>

          {/* Category Tabs */}
          <div className="relative mb-8">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
              {categories.map((category, idx) => (
                <motion.button
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setActiveCategory(category)}
                  className={`px-5 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                    activeCategory === category 
                      ? 'bg-gradient-to-r from-hubby-orange to-hubby-cyan text-white' 
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Service Grid - 2 columns on mobile */}
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
                  className="glassmorphism p-4"
                >
                  {/* Discount Badge */}
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-hubby-orange to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {service.discount}% OFF
                  </div>
                  
                  {/* Logo & Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-hubby-orange to-hubby-cyan flex items-center justify-center text-white font-bold">
                      {service.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{service.name}</h3>
                      <p className="text-xs text-gray-400">{service.category}</p>
                    </div>
                  </div>
                  
                  {/* Prices */}
                  <div className="text-xs text-gray-400 line-through">
                    {service.marketPrice.toLocaleString()} MMK
                  </div>
                  <div className="text-hubby-orange font-bold text-lg">
                    {service.hubbyPrice.toLocaleString()} MMK
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </>
  );
                    }
