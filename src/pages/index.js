import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import productsData from '@/data/products.json';
import Navbar from '@/components/Navbar';
import EpicHeroCarousel from '@/components/EpicHeroCarousel';
import CategoryRow from '@/components/CategoryRow';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [userDiscountPercent, setUserDiscountPercent] = useState(0);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [theme, setTheme] = useState('normal');

  useEffect(() => {
    const sorted = [...productsData].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setServices(sorted);
    const uniqueCategories = ['All', ...new Set(sorted.map(p => p.category))];
    setCategories(uniqueCategories);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const res = await fetch('/api/admin/get-settings');
        const data = await res.json();
        setTheme(data.theme || 'normal');
      } catch (error) {
        setTheme('normal');
      }
    };
    loadTheme();
  }, []);

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
      const ordersQuery = query(
        collection(db, 'orders'),
        where('user_id', '==', userId),
        where('status', 'in', ['pending', 'processing', 'completed'])
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const hasOrder = !ordersSnapshot.empty;
      setHasActiveOrder(hasOrder);
      
      let discountPercent = 0;
      
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

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const filteredServices = activeCategory === 'All'
    ? services
    : services.filter(s => s.category === activeCategory);

  const getFinalPrice = (service) => {
    if (!user || loadingDiscounts || !userDataLoaded) {
      if (service.special_price && service.special_price > 0) {
        return { price: service.special_price, isSpecial: true, hasStackedDiscount: false };
      }
      return { price: service.hubby_price, isSpecial: false, hasStackedDiscount: false };
    }
    
    if (hasActiveOrder) {
      if (service.special_price && service.special_price > 0) {
        return { price: service.special_price, isSpecial: true, hasStackedDiscount: false };
      }
      return { price: service.hubby_price, isSpecial: false, hasStackedDiscount: false };
    }
    
    if (userDiscountPercent > 0) {
      let finalPrice = service.hubby_price;
      let hasDiscount = false;
      
      if (service.special_price && service.special_price > 0) {
        finalPrice = service.special_price;
      }
      
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
    
    if (service.special_price && service.special_price > 0) {
      return { price: service.special_price, isSpecial: true, hasStackedDiscount: false };
    }
    return { price: service.hubby_price, isSpecial: false, hasStackedDiscount: false };
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
        
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl ${
          isDarkMode ? 'bg-[#FF6B35]/10' : 'bg-blue-200/50'
        }`}></div>
        <div className={`absolute bottom-20 right-10 w-80 h-80 rounded-full blur-3xl ${
          isDarkMode ? 'bg-[#00D4FF]/10' : 'bg-cyan-200/50'
        }`}></div>

        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        <div className="container mx-auto px-4 py-20 max-w-6xl relative z-10">
          
         {/* EPIC THEME - Hero Carousel + Category Rows */}
{theme === 'epic' && (
  <>
    <EpicHeroCarousel />
    
    {/* Category Rows - Each category as horizontal swipe row */}
    {categories.filter(cat => cat !== 'All').map((category) => {
      const categoryProducts = services.filter(p => p.category === category);
      if (categoryProducts.length === 0) return null;
      return (
        <CategoryRow 
          key={category} 
          category={category} 
          products={categoryProducts} 
        />
      );
    })}
  </>
)}
          
          <div className="text-center py-6 md:py-8">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#FF6B35] via-yellow-500 to-[#00D4FF] bg-clip-text text-transparent">
              Digital Hub Myanmar
            </h1>
            <p className={`mt-2 text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              🎁 Hubby Store မှ ကြိုဆိုပါတယ်! အထူးလျှော့စျေးများ ရယူလိုက်ပါ!
            </p>
            {user && userDiscountPercent > 0 && !hasActiveOrder && userDataLoaded && (
              <div className="mt-2 inline-block bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full">
                🎉 You have {userDiscountPercent}% first purchase discount!
              </div>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 justify-center flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white shadow-lg'
                  : isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200/80 text-gray-600 hover:bg-gray-300/80'
              }`}>
                {cat === 'All' ? '📦 အားလုံး' : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const finalPriceData = getFinalPrice(service);
              const isSpecial = finalPriceData.isSpecial;
              const hasDiscount = service.discount_percent && service.discount_percent > 0;
              const logoSize = service.logo_size || 60;
              const hasStackedDiscount = finalPriceData.hasStackedDiscount;
              const discountPercent = finalPriceData.discountPercent;
              
              return (
                <Link href={`/products/${service.id}`} key={service.id}>
                  <div className={`
                    backdrop-blur-md rounded-2xl p-4 relative border-2 transition-all duration-300 cursor-pointer h-full
                    ${isDarkMode ? 'bg-white/5' : 'bg-white/60 shadow-sm'}
                    ${isSpecial || hasStackedDiscount
                      ? 'border-green-500 shadow-lg shadow-green-500/30 animate-pulse-slow' 
                      : isDarkMode ? 'border-white/10 hover:border-[#FF6B35]/50' : 'border-gray-200 hover:border-[#FF6B35]/50'
                    }
                  `}>
                    {hasDiscount && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#FF6B35] to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                        🔥 {service.discount_percent}% လျှော့
                      </div>
                    )}
                    
                    {(isSpecial || hasStackedDiscount) && (
                      <div className="absolute -top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 animate-pulse">
                        {hasStackedDiscount ? `✨ ${discountPercent}% OFF` : '✨ အထူးဈေး'}
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
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
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-base md:text-lg truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {service.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">📅 {service.duration}</p>
                        
                        <div className="mt-2 space-y-0.5">
                          {service.market_price > 0 && (
                            <div className="text-[10px] md:text-xs text-gray-500">
                              <span className="text-gray-400">ဈေးကွက်ဈေး:</span>{' '}
                              <span className="line-through">{service.market_price.toLocaleString()} MMK</span>
                            </div>
                          )}
                          
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
                          
                          {(isSpecial || hasStackedDiscount) && (
                            <div className="text-green-500 font-bold text-sm md:text-base">
                              <span className="text-green-600">
                                {hasStackedDiscount ? '🎉 Discounted Price:' : 'အထူးလျှော့ဈေး:'}
                              </span> {finalPriceData.price.toLocaleString()} MMK
                            </div>
                          )}
                          
                          {user && userDiscountPercent > 0 && !hasActiveOrder && userDataLoaded && (
                            <div className="text-[9px] text-blue-400 mt-1">
                              🎁 First purchase: {userDiscountPercent}% OFF included!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
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
