import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import productsData from '@/data/products.json';

export default function Checkout() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [finalPrice, setFinalPrice] = useState(0);
  const [specialDiscount, setSpecialDiscount] = useState(0);
  const [firstPurchaseDiscount, setFirstPurchaseDiscount] = useState(0);
  const [promoPercent, setPromoPercent] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

  // Load everything in one go
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      // Get user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push('/auth');
        return;
      }
      setUser(currentUser);
      
      // Load product from JSON
      const found = productsData.find(p => p.id === parseInt(id));
      if (!found) {
        setLoading(false);
        return;
      }
      setProduct(found);
      
      // Load user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      
      // Calculate price directly
      let price = found.hubby_price;
      let specialDisc = 0;
      let firstDisc = 0;
      let promoDiscountPercent = 0;
      
      // Check for admin special price
      if (found.special_price && found.special_price > 0) {
        specialDisc = found.hubby_price - found.special_price;
        price = found.special_price;
      }
      
      // Check for first purchase discount
      const userInfo = userDoc.data();
      if (userInfo && userInfo.used_promote_code && !userInfo.first_purchase_discount_used) {
        try {
          const promoRes = await fetch(`/api/promo/check?code=${userInfo.used_promote_code}&productId=${found.id}`);
          const promoData = await promoRes.json();
          if (promoData && promoData.option_type === 'first_purchase_discount') {
            promoDiscountPercent = promoData.settings?.discount_value || 0;
            if (promoDiscountPercent > 0) {
              firstDisc = Math.round(price * promoDiscountPercent / 100);
              if (firstDisc > price) firstDisc = price;
              price = price - firstDisc;
            }
          }
        } catch (err) {
          console.error('Promo check failed:', err);
        }
      }
      
      setPromoPercent(promoDiscountPercent);
      setSpecialDiscount(specialDisc);
      setFirstPurchaseDiscount(firstDisc);
      setFinalPrice(price);
      setLoading(false);
    };
    
    loadData();
  }, [id, router]);

  const createOrder = async () => {
    setProcessing(true);
    try {
      await addDoc(collection(db, 'orders'), {
        user_id: user.uid,
        username: userData?.username,
        product_id: product.id,
        product_name: product.name,
        duration: product.duration,
        original_price: product.hubby_price,
        final_price: finalPrice,
        special_discount: specialDiscount,
        first_purchase_discount: firstPurchaseDiscount,
        promo_code_used: userData?.used_promote_code || null,
        status: 'pending',
        payment_method: 'manual',
        created_at: new Date().toISOString()
      });
      
      if (userData?.used_promote_code && !userData?.first_purchase_discount_used && firstPurchaseDiscount > 0) {
        await updateDoc(doc(db, 'users', user.uid), { first_purchase_discount_used: true });
      }
      
      alert('Order created! Send payment proof to Telegram: @william815');
      router.push('/orders');
    } catch (error) {
      alert('Failed to create order');
    }
    setProcessing(false);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
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

  const displayPrice = finalPrice > 0 ? finalPrice : product.hubby_price;

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

  const stepVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <>
      <Head><title>Checkout | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-4xl">
          <motion.h1 
            className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            🛒 Checkout
          </motion.h1>
          
          {/* Progress Steps */}
          <motion.div 
            className="flex justify-between mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[1, 2, 3].map((step) => (
              <motion.div 
                key={step}
                className="flex flex-col items-center flex-1"
                variants={itemVariants}
              >
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                    currentStep >= step
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white'
                      : isDarkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}
                  animate={currentStep === step ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {step}
                </motion.div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {step === 1 ? 'Review' : step === 2 ? 'Payment' : 'Confirm'}
                </span>
                {step < 3 && (
                  <motion.div
                    className={`h-1 flex-1 mx-2 mt-2 ${
                      currentStep > step
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF]'
                        : isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                    }`}
                    layoutId={`step-${step}`}
                  ></motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
          
          {/* Order Summary */}
          <motion.div 
            className={`rounded-2xl p-6 mb-6 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 shadow-sm border-gray-200'}`}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              📦 Order Summary
            </h2>
            <motion.div 
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="flex justify-between py-2 border-b border-white/10" variants={itemVariants}>
                <span className="text-gray-400">Product</span>
                <span className="font-semibold">{product.name}</span>
              </motion.div>
              <motion.div className="flex justify-between py-2 border-b border-white/10" variants={itemVariants}>
                <span className="text-gray-400">Duration</span>
                <span>{product.duration}</span>
              </motion.div>
              
              {product.market_price > 0 && (
                <motion.div className="flex justify-between py-2 border-b border-white/10" variants={itemVariants}>
                  <span className="text-gray-400">ဈေးကွက် ပျမ်းမျှဈေး</span>
                  <span className="line-through text-gray-400">{product.market_price.toLocaleString()} MMK</span>
                </motion.div>
              )}
              
              <motion.div className="flex justify-between py-2 border-b border-white/10" variants={itemVariants}>
                <span className="text-gray-400">Hubby Store ဈေး</span>
                <span className="text-[#FF6B35] font-bold">{product.hubby_price?.toLocaleString()} MMK</span>
              </motion.div>
              
              {specialDiscount > 0 && (
                <motion.div 
                  className="flex justify-between py-2 border-b border-green-500/30 text-green-400"
                  variants={itemVariants}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span>✨ Admin Special Discount</span>
                  <span>-{specialDiscount.toLocaleString()} MMK</span>
                </motion.div>
              )}
              
              {firstPurchaseDiscount > 0 && (
                <motion.div 
                  className="flex justify-between py-2 border-b border-green-500/30 text-green-400"
                  variants={itemVariants}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                >
                  <span>🎉 First Purchase ({promoPercent}% OFF)</span>
                  <span>-{firstPurchaseDiscount.toLocaleString()} MMK</span>
                </motion.div>
              )}
              
              <motion.div 
                className="flex justify-between py-3 text-lg font-bold border-t border-white/20 pt-3"
                variants={itemVariants}
              >
                <span className="text-gray-300">Special price for you</span>
                <motion.span 
                  className="text-[#FF6B35] text-xl"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {displayPrice.toLocaleString()} MMK
                </motion.span>
              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Payment Instructions */}
          <motion.div 
            className={`rounded-2xl p-6 mb-6 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 shadow-sm border-gray-200'}`}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              💳 Payment Instructions
            </h2>
            <motion.div 
              className="space-y-3 text-gray-400 text-sm"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={stepVariants} className="flex items-start gap-3">
                <span className="text-[#FF6B35] font-bold min-w-fit">1.</span>
                <span>Transfer the total amount to:</span>
              </motion.div>
              <motion.div variants={stepVariants} className="pl-8 space-y-2">
                <motion.p 
                  className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10"
                  whileHover={{ backgroundColor: "rgba(255, 107, 53, 0.1)", borderColor: "rgba(255, 107, 53, 0.3)" }}
                >
                  🏦 KBZ Bank: 0987654321 (William)
                </motion.p>
                <motion.p 
                  className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10"
                  whileHover={{ backgroundColor: "rgba(255, 107, 53, 0.1)", borderColor: "rgba(255, 107, 53, 0.3)" }}
                >
                  📱 WavePay: 09798268154
                </motion.p>
              </motion.div>
              <motion.div variants={stepVariants} className="flex items-start gap-3">
                <span className="text-[#FF6B35] font-bold min-w-fit">2.</span>
                <span>Take a screenshot of the payment</span>
              </motion.div>
              <motion.div variants={stepVariants} className="flex items-start gap-3">
                <span className="text-[#FF6B35] font-bold min-w-fit">3.</span>
                <span>Click "Confirm Order" below</span>
              </motion.div>
              <motion.div variants={stepVariants} className="flex items-start gap-3">
                <span className="text-[#FF6B35] font-bold min-w-fit">4.</span>
                <span>Send the screenshot to Telegram: <span className="text-[#FF6B35] font-semibold">@william815</span></span>
              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Confirm Button */}
          <motion.button
            onClick={() => {
              setCurrentStep(2);
              setTimeout(() => setCurrentStep(3), 500);
            }}
            disabled={processing}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-4 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50 mb-4"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {processing ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Processing...
              </motion.span>
            ) : (
              `✅ Confirm Order - ${displayPrice.toLocaleString()} MMK`
            )}
          </motion.button>

          {/* Actual Create Order Button (hidden, triggered by confirm) */}
          <motion.button
            onClick={createOrder}
            disabled={processing}
            className="w-full hidden bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-xl font-bold text-lg"
            id="hidden-create-order"
          >
            Create Order
          </motion.button>

          {/* Update the confirm button to actually create order */}
          <motion.button
            onClick={createOrder}
            disabled={processing}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-4 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {processing ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Processing...
              </motion.span>
            ) : (
              `✅ Confirm Order - ${displayPrice.toLocaleString()} MMK`
            )}
          </motion.button>
          
          <motion.p 
            className="text-center text-gray-500 text-xs mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            By confirming, you agree to our terms and conditions.
          </motion.p>
        </div>
      </div>
    </>
  );
}
