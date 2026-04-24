import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import productsData from '@/data/products.json';

export default function Checkout() {
  const router = useRouter();
  const { id } = router.query;
  const fileInputRef = useRef(null);
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
  
  // New features: Note and Screenshot
  const [userNote, setUserNote] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Load everything in one go
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push('/auth');
        return;
      }
      setUser(currentUser);
      
      const found = productsData.find(p => p.id === parseInt(id));
      if (!found) {
        setLoading(false);
        return;
      }
      setProduct(found);
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      
      let price = found.hubby_price;
      let specialDisc = 0;
      let firstDisc = 0;
      let promoDiscountPercent = 0;
      
      if (found.special_price && found.special_price > 0) {
        specialDisc = found.hubby_price - found.special_price;
        price = found.special_price;
      }
      
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large (max 5MB)');
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const createOrder = async () => {
    if (!screenshot) {
      alert('ကျေးဇူးပြု၍ ငွေလွှဲ Screenshot တင်ပေးပါခင်ဗျာ။');
      return;
    }
    
    setProcessing(true);
    try {
      // In a real app, you would upload to Firebase Storage or S3
      // For this sandbox, we'll store the base64 preview for demonstration 
      // but in production, you should use a proper storage URL.
      const screenshotUrl = screenshotPreview; 

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
        user_note: userNote,
        payment_screenshot: screenshotUrl,
        created_at: new Date().toISOString()
      });
      
      if (userData?.used_promote_code && !userData?.first_purchase_discount_used && firstPurchaseDiscount > 0) {
        await updateDoc(doc(db, 'users', user.uid), { first_purchase_discount_used: true });
      }
      
      router.push('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
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
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <>
      <Head><title>Checkout | Digital Hub Myanmar</title></Head>
      <div className="min-h-screen bg-[#020617] text-white selection:bg-[#FF6B35]/30">
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-2xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <h1 className="text-3xl font-black tracking-tight">🛒 Checkout</h1>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Order ID</span>
              <span className="text-xs font-mono text-[#FF6B35]">#DH-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
            </div>
          </motion.div>
          
          {/* Progress Steps */}
          <motion.div 
            className="flex justify-between mb-10 relative"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="absolute top-5 left-0 w-full h-[2px] bg-white/5 z-0" />
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                    currentStep >= step
                      ? 'bg-[#FF6B35] border-[#FF6B35] text-white shadow-[0_0_20px_rgba(255,107,53,0.4)]'
                      : 'bg-[#0a0f2a] border-white/10 text-gray-500'
                  }`}
                  animate={currentStep === step ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {step === 1 ? '📋' : step === 2 ? '💳' : '✅'}
                </motion.div>
                <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${currentStep >= step ? 'text-white' : 'text-gray-500'}`}>
                  {step === 1 ? 'Review' : step === 2 ? 'Payment' : 'Confirm'}
                </span>
              </div>
            ))}
          </motion.div>
          
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Order Summary Card */}
            <motion.div 
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl"
              variants={itemVariants}
            >
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                <span className="text-[#FF6B35]">|</span> အော်ဒါအနှစ်ချုပ်
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Product</span>
                  <span className="font-bold text-white">{product.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-gray-300 font-medium">{product.duration}</span>
                </div>
                
                <div className="h-px bg-white/5 my-2" />
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Hubby Store ဈေး</span>
                  <span className="text-gray-300 font-bold">{product.hubby_price?.toLocaleString()} MMK</span>
                </div>
                
                {specialDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs py-2 px-3 bg-green-500/10 rounded-xl border border-green-500/20 text-green-400 font-bold">
                    <span>✨ Admin Special Discount</span>
                    <span>-{specialDiscount.toLocaleString()} MMK</span>
                  </div>
                )}
                
                {firstPurchaseDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs py-2 px-3 bg-green-500/10 rounded-xl border border-green-500/20 text-green-400 font-bold">
                    <span>🎁 First Purchase Discount ({promoPercent}%)</span>
                    <span>-{firstPurchaseDiscount.toLocaleString()} MMK</span>
                  </div>
                )}
                
                <div className="pt-4 flex justify-between items-end">
                  <span className="text-gray-300 font-black uppercase tracking-widest text-xs">Total Amount</span>
                  <div className="text-right">
                    <motion.div 
                      className="text-3xl font-black text-[#FF6B35] tracking-tighter"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {displayPrice.toLocaleString()} <span className="text-sm">MMK</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Payment Instructions Card */}
            <motion.div 
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl"
              variants={itemVariants}
            >
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                <span className="text-[#00D4FF]">|</span> ငွေပေးချေရန် လမ်းညွှန်ချက်
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-[#FF6B35]/30 transition-all group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">🏦 KBZ Bank</span>
                      <span className="text-[10px] text-[#FF6B35] font-black">SCAN TO PAY</span>
                    </div>
                    <p className="text-lg font-black text-white group-hover:text-[#FF6B35] transition-colors">0987654321</p>
                    <p className="text-xs text-gray-500 font-bold">Name: William</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-[#00D4FF]/30 transition-all group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">📱 WavePay</span>
                    </div>
                    <p className="text-lg font-black text-white group-hover:text-[#00D4FF] transition-colors">09798268154</p>
                    <p className="text-xs text-gray-500 font-bold">Name: Digital Hub Myanmar</p>
                  </div>
                </div>

                {/* New Feature: Screenshot Upload */}
                <div className="pt-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    📸 Upload Payment Screenshot
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${
                      screenshotPreview 
                        ? 'border-green-500/50 bg-green-500/5' 
                        : 'border-white/10 bg-white/5 hover:border-[#FF6B35]/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      hidden 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    {screenshotPreview ? (
                      <div className="relative w-full aspect-video">
                        <img src={screenshotPreview} className="w-full h-full object-contain rounded-lg" alt="Preview" />
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full text-xs">✅</div>
                      </div>
                    ) : (
                      <>
                        <span className="text-3xl mb-2">📤</span>
                        <span className="text-xs text-gray-400 font-medium">Click to upload screenshot</span>
                        <span className="text-[10px] text-gray-500 mt-1">Max 5MB (JPG, PNG)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* New Feature: Note to Admin */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    📝 Note to Admin (Optional)
                  </label>
                  <textarea 
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Account Email သို့မဟုတ် အခြားမှတ်ချက်များ ရေးပေးပါ..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#FF6B35]/50 focus:outline-none transition-all"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </motion.div>
            
            {/* Confirm Button */}
            <motion.div variants={itemVariants} className="pt-4">
              <motion.button
                onClick={createOrder}
                disabled={processing}
                className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${
                  screenshot 
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C35] text-white shadow-[0_10px_30px_rgba(255,107,53,0.3)]' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                whileHover={screenshot ? { scale: 1.02, y: -2 } : {}}
                whileTap={screenshot ? { scale: 0.98 } : {}}
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <span>✅ Confirm Order</span>
                    <span className="text-sm opacity-80">| {displayPrice.toLocaleString()} MMK</span>
                  </>
                )}
              </motion.button>
              
              {!screenshot && (
                <p className="text-center text-red-400 text-[10px] mt-2 font-bold animate-pulse">
                  * ကျေးဇူးပြု၍ ငွေလွှဲ Screenshot အရင်တင်ပေးပါ
                </p>
              )}
              
              <p className="text-center text-gray-500 text-[10px] mt-6 leading-relaxed">
                Order တင်ပြီးပါက ကျွန်ုပ်တို့ဘက်မှ အမြန်ဆုံး စစ်ဆေးပေးသွားမည် ဖြစ်ပါသည်။
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
