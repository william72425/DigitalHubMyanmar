import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import productsData from '@/data/products.json';
import { calculateStackedDiscount } from '@/utils/discountCalculator';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [features, setFeatures] = useState([]);
  const [productNote, setProductNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalPrice, setFinalPrice] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const [isFirstPurchaseEligible, setIsFirstPurchaseEligible] = useState(false);
  const [showBuyOptions, setShowBuyOptions] = useState(false);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  // Load product first
  useEffect(() => {
    if (id) {
      const productId = parseInt(id);
      const found = productsData.find(p => p.id === productId);
      setProduct(found);
      
      const loadFeatures = async () => {
        try {
          const res = await fetch('/api/admin/features');
          const freshData = await res.json();
          setFeatures(freshData.features?.filter(f => f.product_id === productId) || []);
          setProductNote(freshData.product_notes?.find(n => n.product_id === productId) || null);
        } catch (error) {
          console.error('Failed to load features:', error);
        }
      };
      loadFeatures();
    }
  }, [id]);

  // Auth and user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsLoggedIn(true);
        await loadUserDiscounts(user.uid);
      } else {
        if (product) {
          setFinalPrice(product.hubby_price);
          setAppliedDiscounts([]);
          setTotalDiscount(0);
          setIsFirstPurchaseEligible(false);
          setPromoDiscountPercent(0);
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [product]);

  const loadUserDiscounts = async (userId) => {
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('user_id', '==', userId),
        where('status', 'in', ['pending', 'processing', 'completed'])
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const hasOrder = !ordersSnapshot.empty;
      setHasActiveOrder(hasOrder);
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      let discountPercent = 0;
      let promoType = 'percent';
      let maxDiscountAmount = 0;
      
      if (!hasOrder && userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.used_promote_code && !userData.first_purchase_discount_used && product) {
          try {
            const promoRes = await fetch(`/api/promo/check?code=${userData.used_promote_code}&productId=${product.id}`);
            const promoData = await promoRes.json();
            if (promoData && promoData.option_type === 'first_purchase_discount') {
              discountPercent = promoData.settings?.discount_value || 0;
              promoType = promoData.settings?.discount_type || 'percent';
              maxDiscountAmount = promoData.settings?.max_discount || 0;
            }
          } catch (err) {
            console.error('Promo check failed:', err);
          }
        }
      }
      setPromoDiscountPercent(discountPercent);
      
      if (product) {
        const userDiscountsObj = {
          promoDiscount: discountPercent,
          promoType,
          maxDiscountAmount
        };
        const userDataObj = { 
          hasActiveOrder: hasOrder,
          first_purchase_discount_used: userDoc.exists() ? userDoc.data().first_purchase_discount_used : false
        };
        
        const result = calculateStackedDiscount(product, userDiscountsObj, userDataObj);
        setFinalPrice(result.finalPrice);
        setTotalDiscount(result.totalDiscount);
        setAppliedDiscounts(result.appliedDiscounts);
        setIsFirstPurchaseEligible(result.isFirstPurchaseEligible);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      if (product) {
        setFinalPrice(product.hubby_price);
        setAppliedDiscounts([]);
      }
      setLoading(false);
    }
  };

  const handleExternalBuy = (platform, contactId) => {
    const message = `ဟုတ်ကဲ့ပါ။ ${product.name} (${product.duration}) ကို ${finalPrice.toLocaleString()} MMK ဖြင့် ဝယ်ယူလိုပါသည်။`;
    let url = '';
    if (platform === 'telegram') {
      url = `https://t.me/${contactId}?text=${encodeURIComponent(message)}`;
    } else if (platform === 'messenger') {
      url = `https://m.me/${contactId}`;
    } else if (platform === 'viber') {
      url = `viber://chat?number=${contactId}`;
    }
    if (url) window.open(url, '_blank');
  };

  const handleDirectBuy = () => {
    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }
    router.push(`/checkout?id=${product.id}`);
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <motion.div 
          className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        ></motion.div>
      </div>
    );
  }

  const logoSize = product.logo_size || 70;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <>
      <Head><title>{product.name} | Digital Hub Myanmar</title></Head>
      <div className="min-h-screen bg-[#020617] text-white selection:bg-[#FF6B35]/30">
        {/* Background glow effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF6B35]/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00D4FF]/10 blur-[120px] rounded-full" />
        </div>

        <div className="container mx-auto px-4 py-6 max-w-2xl relative z-10">
          
          <motion.button 
            onClick={() => router.back()} 
            className="text-gray-400 hover:text-[#FF6B35] mb-6 inline-flex items-center gap-2 group transition-colors"
            whileHover={{ x: -5 }}
          >
            <span className="text-xl group-hover:scale-110 transition-transform">←</span> 
            <span className="text-sm font-medium">နောက်သို့</span>
          </motion.button>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* Product Header Card */}
            <motion.div 
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-2xl"
              variants={itemVariants}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35] to-[#00D4FF] opacity-20 blur-lg rounded-2xl" />
                  {product.logo_url ? (
                    <img src={product.logo_url} className="rounded-2xl object-contain relative z-10 bg-[#0a0f2a] p-2" style={{ width: '80px', height: '80px' }} alt={product.name} />
                  ) : (
                    <div className="rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#00D4FF] flex items-center justify-center text-white font-bold text-3xl relative z-10" style={{ width: '80px', height: '80px' }}>
                      {product.name?.charAt(0) || '?'}
                    </div>
                  )}
                </motion.div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] text-[10px] font-bold uppercase tracking-wider">
                      Premium
                    </span>
                    <span className="text-gray-400 text-xs font-medium">
                      📅 {product.duration}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Price Detail Card */}
            <motion.div 
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl overflow-hidden relative"
              variants={itemVariants}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-6xl">💰</span>
              </div>
              
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                <span className="text-[#FF6B35]">|</span> ဈေးနှုန်းအသေးစိတ်
              </h2>
              
              <div className="space-y-4">
                {product.market_price > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">ဈေးကွက် ပျမ်းမျှဈေး</span>
                    <span className="line-through text-gray-500 font-medium">{product.market_price.toLocaleString()} MMK</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Hubby Store ဈေး</span>
                  <span className="text-orange-400 font-bold">{product.hubby_price.toLocaleString()} MMK</span>
                </div>
                
                <AnimatePresence>
                  {appliedDiscounts.map((discount, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex justify-between items-center text-sm py-2 px-3 bg-green-500/10 rounded-xl border border-green-500/20"
                    >
                      <span className="text-green-400 flex items-center gap-2 font-medium">
                        <span className="text-xs">✨</span> {discount.label}
                      </span>
                      <span className="text-green-400 font-bold">-{discount.amount.toLocaleString()} MMK</span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="pt-4 mt-2 border-t border-white/10 flex justify-between items-end">
                  <span className="text-gray-300 font-bold">သင့်အတွက် အထူးဈေး</span>
                  <div className="text-right">
                    <motion.div 
                      className="text-3xl font-black text-[#FF6B35] tracking-tighter"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {finalPrice.toLocaleString()} <span className="text-sm">MMK</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features Card */}
            {features.length > 0 && (
              <motion.div 
                className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl"
                variants={itemVariants}
              >
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <span className="text-[#00D4FF]">|</span> အင်္ဂါရပ်များ နှိုင်းယှဉ်ချက်
                </h2>
                
                <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-400">
                        <th className="p-3 font-bold">အင်္ဂါရပ်များ</th>
                        <th className="p-3 text-center">✨ အခမဲ့</th>
                        <th className="p-3 text-center bg-gradient-to-br from-[#FF6B35]/20 to-[#00D4FF]/20 text-white font-black">💎 Premium</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {features.map((feature, idx) => (
                        <tr key={idx} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 text-gray-300 font-medium">{feature.name}</td>
                          <td className="p-3 text-center text-red-400/60">
                            {feature.free_value === '✓' ? '✅' : feature.free_value === '✗' ? '❌' : feature.free_value}
                          </td>
                          <td className="p-3 text-center font-bold text-[#00D4FF] bg-gradient-to-r from-[#FF6B35]/5 to-[#00D4FF]/5">
                            {feature.premium_value === '✓' ? '✅' : feature.premium_value === '✗' ? '❌' : feature.premium_value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Product Note */}
            {productNote && (
              <motion.div 
                className="bg-blue-500/10 backdrop-blur-xl rounded-2xl p-4 border border-blue-500/20"
                variants={itemVariants}
              >
                <p className="text-blue-300 text-xs leading-relaxed flex gap-3">
                  <span className="text-lg">ℹ️</span>
                  <span>{productNote.note}</span>
                </p>
              </motion.div>
            )}

            {/* Buy Buttons */}
            <motion.div 
              className="grid grid-cols-1 gap-3 pt-4"
              variants={itemVariants}
            >
              <motion.button 
                onClick={handleDirectBuy}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C35] text-white py-4 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(255,107,53,0.3)] hover:shadow-[0_15px_40px_rgba(255,107,53,0.4)] transition-all flex items-center justify-center gap-3 group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>🛒 အခုပဲ ဝယ်ယူမည်</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </motion.button>

              <button 
                onClick={() => setShowBuyOptions(!showBuyOptions)}
                className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all"
              >
                {showBuyOptions ? '🔼 ပိတ်ရန်' : '💬 အခြားနည်းလမ်းဖြင့် ဝယ်ယူရန်'}
              </button>

              <AnimatePresence>
                {showBuyOptions && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-2"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => handleExternalBuy('telegram', 'william815')} className="flex flex-col items-center gap-2 p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                        <span className="text-2xl">✈️</span>
                        <span className="text-[10px] font-bold">Telegram</span>
                      </button>
                      <button onClick={() => handleExternalBuy('messenger', 'william815')} className="flex flex-col items-center gap-2 p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 hover:bg-purple-500/20 transition-all">
                        <span className="text-2xl">💬</span>
                        <span className="text-[10px] font-bold">Messenger</span>
                      </button>
                      <button onClick={() => handleExternalBuy('viber', '09798268154')} className="flex flex-col items-center gap-2 p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">
                        <span className="text-2xl">🟣</span>
                        <span className="text-[10px] font-bold">Viber</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.p 
              className="text-center text-gray-500 text-[10px] pt-4"
              variants={itemVariants}
            >
              Payment proof should be sent to Telegram: <span className="font-bold text-gray-400">@william815</span>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
