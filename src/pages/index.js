import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import productsData from '@/data/products.json';
import Navbar from '@/components/Navbar';
import ReviewsSection from '@/components/ReviewsSection';
import { useTheme } from '@/context/ThemeContext';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const { isDarkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [userDiscountPercent, setUserDiscountPercent] = useState(0);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  // Load products from JSON
  useEffect(() => {
    const sorted = [...productsData].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setServices(sorted);
    const uniqueCategories = ['All', ...new Set(sorted.map(p => p.category))];
    setCategories(uniqueCategories);
  }, []);

  // Auth and User Discounts
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        await loadUserDiscounts(user.uid);
      } else {
        setUser(null);
        setUserDiscountPercent(0);
        setHasActiveOrder(false);
        setLoadingDiscounts(false);
        setUserDataLoaded(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserDiscounts = async (userId) => {
    setLoadingDiscounts(true);
    try {
      // Check for active orders (pending, processing, completed)
      const ordersQuery = query(
        collection(db, 'orders'),
        where('user_id', '==', userId),
        where('status', 'in', ['pending', 'processing', 'completed'])
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const hasOrder = !ordersSnapshot.empty;
      setHasActiveOrder(hasOrder);
      
      let discountPercent = 0;
      
      // Only apply first purchase discount if user has NO orders
      if (!hasOrder) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.used_promote_code && !userData.first_purchase_discount_used) {
            try {
              const promoRes = await fetch(`/api/promo/check?code=${userData.used_promote_code}`);
              const promoData = await promoRes.json();
              if (promoData && promoData.option_type === 'first_purchase_discount') {
                discountPercent = promoData.settings?.discount_value || 0;
              }
            } catch (err) {
              console.error('Promo check failed:', err);
            }
          }
        }
      }
      
      setUserDiscountPercent(discountPercent);
      setUserDataLoaded(true);
    } catch (error) {
      console.error('Error loading user discounts:', error);
      setUserDataLoaded(true);
    }
    setLoadingDiscounts(false);
  };

  const filteredServices = activeCategory === 'All'
    ? services
    : services.filter(s => s.category === activeCategory);

  // Get final price with discounts applied
  const getFinalPrice = (service) => {
    // If no user or still loading, show regular price
    if (!user || loadingDiscounts || !userDataLoaded) {
      if (service.special_price && service.special_price > 0) {
        return { price: service.special_price, isSpecial: true, hasStackedDiscount: false };
      }
      return { price: service.hubby_price, isSpecial: false, hasStackedDiscount: false };
    }
    
    // If user has active order, no first purchase discount
    if (hasActiveOrder) {
      if (service.special_price && service.special_price > 0) {
        return { price: service.special_price, isSpecial: true, hasStackedDiscount: false };
      }
      return { price: service.hubby_price, isSpecial: false, hasStackedDiscount: false };
    }
    
    // Apply first purchase discount
    if (userDiscountPercent > 0) {
      let finalPrice = service.hubby_price;
      let hasDiscount = false;
      
      // Apply special price first if exists
      if (service.special_price && service.special_price > 0) {
        finalPrice = service.special_price;
      }
      
      // Apply first purchase discount
      const discountAmount = Math.round(finalPrice * userDiscountPercent / 100);
      if (discountAmount > 0 && discountAmount < finalPrice) {
        finalPrice = finalPrice - discountAmount;
        hasDiscount = true;
      }
      
      return {
        price: finalPrice,
        isSpecial: hasDiscount || (service.special_price && service.special_price > 0),
        hasStackedDiscount: hasDiscount,
        discountPercent: userDiscountPercent
      };
    }
    
    // No discount
    if (service.special_price && service.special_price > 0) {
      return { price: service.special_price, isSpecial: true, hasStackedDiscount: false };
    }
    return { price: service.hubby_price, isSpecial: false, hasStackedDiscount: false };
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const heroVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const cardHoverVariants = {
    hover: {
      y: -8,
      boxShadow: "0 20px 40px rgba(255, 107, 53, 0.3)",
      transition: { duration: 0.3 },
    },
  };

  return (
    <>
      <Head>
        <title>Digital Hub Myanmar - Hubby Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className={`min-h-screen transition-all duration-300 relative overflow-x-hidden ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' 
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
      }`}>
        
        <motion.div 
          className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl ${
            isDarkMode ? 'bg-[#FF6B35]/10' : 'bg-blue-200/50'
          }`}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        ></motion.div>
        <motion.div 
          className={`absolute bottom-20 right-10 w-80 h-80 rounded-full blur-3xl ${
            isDarkMode ? 'bg-[#00D4FF]/10' : 'bg-cyan-200/50'
          }`}
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        ></motion.div>

        <Navbar />

        <div className="container mx-auto px-4 py-20 max-w-6xl relative z-10">
          
          <motion.div 
            className="text-center py-6 md:py-8"
            variants={heroVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 
              className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#FF6B35] via-yellow-500 to-[#00D4FF] bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0%', '100%', '0%']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Digital Hub Myanmar
            </motion.h1>
            <motion.p 
              className={`mt-2 text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              🎁 Hubby Store မှ ကြိုဆိုပါတယ်! အထူးလျှော့စျေးများ ရယူလိုက်ပါ!
            </motion.p>
            {user && userDiscountPercent > 0 && !hasActiveOrder && userDataLoaded && (
              <motion.div 
                className="mt-2 inline-block bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              >
                🎉 You have {userDiscountPercent}% first purchase discount!
              </motion.div>
            )}
          </motion.div>

          <motion.div 
            className="flex gap-2 overflow-x-auto pb-4 mb-6 justify-center flex-wrap"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {categories.map((cat, idx) => (
              <motion.button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white shadow-lg'
                    : isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200/80 text-gray-600 hover:bg-gray-300/80'
                }`}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cat === 'All' ? '📦 အားလုံး' : cat}
              </motion.button>
            ))}
          </motion.div>

          {/* Product Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredServices.map((service) => {
              const finalPriceData = getFinalPrice(service);
              const isSpecial = finalPriceData.isSpecial;
              const hasDiscount = service.discount_percent && service.discount_percent > 0;
              const logoSize = service.logo_size || 60;
              const hasStackedDiscount = finalPriceData.hasStackedDiscount;
              const discountPercent = finalPriceData.discountPercent;
              
              return (
                <motion.div
                  key={service.id}
                  variants={itemVariants}
                  whileHover="hover"
                >
                  <Link href={`/products/${service.id}`}>
                    <motion.div 
                      className={`
                        backdrop-blur-md rounded-2xl p-4 relative border-2 transition-all duration-300 cursor-pointer h-full
                        ${isDarkMode ? 'bg-white/5' : 'bg-white/60 shadow-sm'}
                        ${isSpecial || hasStackedDiscount
                          ? 'border-green-500 shadow-lg shadow-green-500/30 animate-pulse-slow' 
                          : isDarkMode ? 'border-white/10 hover:border-[#FF6B35]/50' : 'border-gray-200 hover:border-[#FF6B35]/50'
                        }
                      `}
                      variants={cardHoverVariants}
                    >
                      {/* Discount Badge */}
                      {hasDiscount && (
                        <motion.div 
                          className="absolute -top-2 -right-2 bg-gradient-to-r from-[#FF6B35] to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10"
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          🔥 {service.discount_percent}% လျှော့
                        </motion.div>
                      )}
                      
                      {/* Special Badge */}
                      {(isSpecial || hasStackedDiscount) && (
                        <motion.div 
                          className="absolute -top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 animate-pulse"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          {hasStackedDiscount ? `✨ ${discountPercent}% OFF` : '✨ အထူးဈေး'}
                        </motion.div>
                      )}
                      
                      <div className="flex items-start gap-4">
                        <motion.div 
                          className="flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {service.logo_url ? (
                            <img 
                              src={service.logo_url} 
                              className="rounded-xl object-contain bg-white/5"
                              style={{ width: logoSize + 'px', height: logoSize + 'px' }}
                              alt={service.name}
                            />
                          ) : (
                            <div 
                              className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] flex items-center justify-center text-white font-bold text-xl"
                              style={{ width: logoSize + 'px', height: logoSize + 'px' }}
                            >
                              {service.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-base md:text-lg truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {service.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">📅 {service.duration}</p>
                          
                          <div className="mt-2 space-y-0.5">
                            {/* Market Price */}
                            {service.market_price > 0 && (
                              <div className="text-[10px] md:text-xs text-gray-500">
                                <span className="text-gray-400">ဈေးကွက်ဈေး:</span>{' '}
                                <span className="line-through">{service.market_price.toLocaleString()} MMK</span>
                              </div>
                            )}
                            
                            {/* Hubby Price (if special or stacked, show line-through) */}
                            {(isSpecial || hasStackedDiscount) ? (
                              <div className="text-[10px] md:text-xs text-gray-500">
                                <span className="text-gray-400">ဟပ်စတိုးဈေး:</span>{' '}
                                <span className="line-through">{service.hubby_price?.toLocaleString()} MMK</span>
                              </div>
                            ) : (
                              <div className="text-[#FF6B35] font-bold text-sm md:text-base">
                                {finalPriceData.price.toLocaleString()} MMK
                              </div>
                            )}
                            
                            {/* Final Price with Discount */}
                            {(isSpecial || hasStackedDiscount) && (
                              <motion.div 
                                className="text-green-500 font-bold text-sm md:text-base"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <span className="text-green-600">
                                  {hasStackedDiscount ? '🎉 Discounted Price:' : 'အထူးလျှော့ဈေး:'}
                                </span> {finalPriceData.price.toLocaleString()} MMK
                              </motion.div>
                            )}
                            
                            {/* First Purchase Discount Note */}
                            {user && userDiscountPercent > 0 && !hasActiveOrder && userDataLoaded && (
                              <div className="text-[9px] text-blue-400 mt-1">
                                🎁 First purchase: {userDiscountPercent}% OFF included!
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Reviews Section */}
        <ReviewsSection />
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(34, 197, 94, 0.3), 0 0 10px rgba(34, 197, 94, 0.2);
            border-color: rgba(34, 197, 94, 0.7);
          }
          50% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.3);
            border-color: rgba(34, 197, 94, 1);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 1.5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
