import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import productsData from '@/data/products.json';
import featuresData from '@/data/features.json';
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
      // Check for active orders
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
  const hasSpecialPrice = product.special_price && product.special_price > 0;
  const specialDiscountAmount = hasSpecialPrice ? product.hubby_price - product.special_price : 0;

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

  const priceVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <>
      <Head><title>{product.name} | Digital Hub Myanmar</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617] text-white">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          
          <motion.button 
            onClick={() => router.back()} 
            className="text-gray-400 hover:text-[#FF6B35] mb-6 inline-flex items-center gap-2"
            whileHover={{ x: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            ← နောက်သို့
          </motion.button>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Product Header */}
            <motion.div 
              className="bg-white/5 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10"
              variants={itemVariants}
              whileHover={{ borderColor: "rgba(255, 107, 53, 0.3)" }}
            >
              <div className="flex items-center gap-5">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {product.logo_url ? (
                    <img src={product.logo_url} className="rounded-xl object-contain" style={{ width: logoSize + 'px', height: logoSize + 'px' }} alt={product.name} />
                  ) : (
                    <div className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] flex items-center justify-center text-white font-bold text-2xl" style={{ width: logoSize + 'px', height: logoSize + 'px' }}>
                      {product.name?.charAt(0) || '?'}
                    </div>
                  )}
                </motion.div>
                <div>
                  <motion.h1 
                    className="text-2xl md:text-3xl font-bold"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    {product.name}
                  </motion.h1>
                  <motion.p 
                    className="text-gray-400 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    📅 {product.duration}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Price Section */}
            <motion.div 
              className="bg-white/5 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10"
              variants={itemVariants}
            >
              <h2 className="text-xl font-bold mb-4">💰 ဈေးနှုန်းအသေးစိတ်</h2>
              <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                {/* Market Price */}
                {product.market_price > 0 && (
                  <motion.div 
                    className="flex justify-between items-center pb-2 border-b border-white/10"
                    variants={itemVariants}
                  >
                    <span className="text-gray-300">ဈေးကွက် ပျမ်းမျှဈေး</span>
                    <span className="line-through text-gray-400">{product.market_price.toLocaleString()} MMK</span>
                  </motion.div>
                )}
                
                {/* Hubby Store Price */}
                <motion.div 
                  className="flex justify-between items-center pb-2 border-b border-white/10"
                  variants={itemVariants}
                >
                  <span className="text-gray-300">Hubby Store ဈေး</span>
                  <span className="text-[#FF6B35] font-bold text-lg">{product.hubby_price?.toLocaleString()} MMK</span>
                </motion.div>
                
                {/* Admin Special Discount */}
                {hasSpecialPrice && (
                  <motion.div 
                    className="flex justify-between items-center pb-2 border-b border-green-500/30 text-green-400"
                    variants={itemVariants}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span>✨ Admin Special Discount</span>
                    <span>-{specialDiscountAmount.toLocaleString()} MMK</span>
                  </motion.div>
                )}
                
                {/* First Purchase Discount */}
                {appliedDiscounts.filter(d => d.type === 'promo').map((discount, idx) => (
                  <motion.div 
                    key={idx} 
                    className="flex justify-between items-center pb-2 border-b border-green-500/30 text-green-400"
                    variants={itemVariants}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                  >
                    <span>{discount.label}</span>
                    <span>-{discount.amount.toLocaleString()} MMK</span>
                  </motion.div>
                ))}
                
                {/* Final Price */}
                <motion.div 
                  className="flex justify-between items-center pt-3 mt-2 border-t border-white/20"
                  variants={priceVariants}
                >
                  <span className="text-lg font-bold">Special price for you</span>
                  <motion.span 
                    className="text-[#FF6B35] font-bold text-xl"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {finalPrice.toLocaleString()} MMK
                  </motion.span>
                </motion.div>
                
                {/* First Purchase Note */}
                {isFirstPurchaseEligible && promoDiscountPercent > 0 && !hasActiveOrder && (
                  <motion.div 
                    className="text-xs text-green-500 text-center mt-2 bg-green-500/10 p-2 rounded-lg"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    🎉 First purchase discount ({promoDiscountPercent}% OFF) applied!
                  </motion.div>
                )}
                
                {/* Warning if user has active order */}
                {hasActiveOrder && promoDiscountPercent > 0 && (
                  <motion.div 
                    className="text-xs text-yellow-500 text-center mt-2 bg-yellow-500/10 p-2 rounded-lg"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    ⚠️ You already have an active order. First purchase discount is only for new users.
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            {/* Features Section */}
            {features.length > 0 && (
              <motion.div 
                className="bg-white/5 backdrop-blur-md rounded-2xl p-6 mb-6 overflow-x-auto border border-white/10"
                variants={itemVariants}
              >
                <h2 className="text-xl font-bold mb-4">✨ အင်္ဂါရပ်များ နှိုင်းယှဉ်ချက်</h2>
                <motion.table 
                  className="w-full border-collapse"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-2 text-gray-400">အင်္ဂါရပ်များ</th>
                      <th className="text-center py-3 px-2 text-gray-400 w-1/3">✨ အခမဲ့</th>
                      <th className="text-center py-3 px-2 bg-gradient-to-r from-[#FF6B35]/20 to-[#00D4FF]/20 text-[#FF6B35] font-bold w-1/3">💎 Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, idx) => (
                      <motion.tr 
                        key={feature.id} 
                        className={`border-b border-white/10 ${idx % 2 === 0 ? 'bg-white/5' : ''}`}
                        variants={itemVariants}
                        whileHover={{ backgroundColor: "rgba(255, 107, 53, 0.1)" }}
                      >
                        <td className="py-3 px-2 text-sm">{feature.feature_name}</td>
                        <td className="text-center py-3 px-2">
                          {feature.free ? <span className="text-green-400">✓ {feature.free}</span> : <span className="text-gray-500">—</span>}
                        </td>
                        <td className="text-center py-3 px-2 bg-gradient-to-r from-[#FF6B35]/10 to-[#00D4FF]/10">
                          <span className="text-[#FF6B35] font-semibold">✓ {feature.pro || feature.free || 'အပြည့်အစုံ'}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </motion.table>
              </motion.div>
            )}

            {/* NOTE BOX */}
            {productNote && productNote.content && productNote.content.trim() !== '' && (
              <motion.div 
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6"
                variants={itemVariants}
                whileHover={{ borderColor: "rgba(234, 179, 8, 0.6)" }}
              >
                <h3 className="text-yellow-500 font-bold mb-2">{productNote.title || '📌 မှတ်ချက်'}</h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{productNote.content}</p>
              </motion.div>
            )}

            {/* Buy Options */}
            {!showBuyOptions ? (
              <motion.button 
                onClick={() => setShowBuyOptions(true)} 
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-4 rounded-xl font-bold text-lg hover:opacity-90 cursor-pointer shadow-lg"
                variants={itemVariants}
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(255, 107, 53, 0.4)" }}
                whileTap={{ scale: 0.98 }}
              >
                🛒 အခုပဲ {finalPrice.toLocaleString()} MMK ဖြင့် ဝယ်ယူမည်
              </motion.button>
            ) : (
              <motion.div 
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="grid grid-cols-3 gap-3" variants={containerVariants} initial="hidden" animate="visible">
                  <motion.button 
                    onClick={() => handleExternalBuy('telegram', 'william815')} 
                    className="bg-[#26A5E4] text-white p-3 rounded-xl font-semibold"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📱 Telegram
                  </motion.button>
                  <motion.button 
                    onClick={() => handleExternalBuy('messenger', 'william72425')} 
                    className="bg-[#0084FF] text-white p-3 rounded-xl font-semibold"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    💬 Messenger
                  </motion.button>
                  <motion.button 
                    onClick={() => handleExternalBuy('viber', '09798268154')} 
                    className="bg-[#7360F2] text-white p-3 rounded-xl font-semibold"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📞 Viber
                  </motion.button>
                </motion.div>
                <motion.button 
                  onClick={handleDirectBuy} 
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white p-3 rounded-xl font-semibold"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🛍️ Buy Directly on Website
                </motion.button>
                <motion.button 
                  onClick={() => setShowBuyOptions(false)} 
                  className="w-full text-gray-400 text-sm py-2"
                  variants={itemVariants}
                  whileHover={{ color: "#FF6B35" }}
                >
                  ◀ နောက်သို့
                </motion.button>
              </motion.div>
            )}

            <motion.div 
              className="mt-6 p-3 bg-blue-500/10 rounded-lg text-center"
              variants={itemVariants}
            >
              <p className="text-gray-400 text-xs">💡 Note: နောက်ပိုင်းမှာ အခု web page ထဲကနေ တိုက်ရိုက်ဝယ်နိုင်အောင် ကြိုးစားသွားပါဦးမည်။</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
