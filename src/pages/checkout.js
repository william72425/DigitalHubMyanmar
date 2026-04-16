import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, addDoc, collection, updateDoc, query, where, getDocs } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { calculateStackedDiscount } from '@/utils/discountCalculator';
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
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const [isFirstPurchaseEligible, setIsFirstPurchaseEligible] = useState(false);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [calculationDone, setCalculationDone] = useState(false);
  const [calculationError, setCalculationError] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else if (savedTheme === 'dark') setIsDarkMode(true);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);
      await loadProduct();
      await loadUserData(user.uid);
    });

    return () => unsubscribe();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    const found = productsData.find(p => p.id === parseInt(id));
    setProduct(found);
    console.log('✅ Product loaded:', found?.name, 'Price:', found?.hubby_price);
  };

  const loadUserData = async (userId) => {
    try {
      console.log('🔄 Loading user data for:', userId);
      
      // Check for active orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('user_id', '==', userId),
        where('status', 'in', ['pending', 'processing', 'completed'])
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const hasOrder = !ordersSnapshot.empty;
      setHasActiveOrder(hasOrder);
      console.log('📦 Has active order:', hasOrder);
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      let discountPercent = 0;
      let promoType = 'percent';
      let maxDiscountAmount = 0;
      
      if (userDoc.exists()) {
        const userDataRaw = userDoc.data();
        setUserData(userDataRaw);
        console.log('👤 User data loaded:', { 
          used_promote_code: userDataRaw.used_promote_code,
          first_purchase_discount_used: userDataRaw.first_purchase_discount_used 
        });
        
        // Only apply first purchase discount if user has NO active orders
        if (!hasOrder && userDataRaw.used_promote_code && !userDataRaw.first_purchase_discount_used && product) {
          try {
            console.log('🔍 Checking promo code:', userDataRaw.used_promote_code);
            const promoRes = await fetch(`/api/promo/check?code=${userDataRaw.used_promote_code}&productId=${product.id}`);
            const promoData = await promoRes.json();
            console.log('📡 Promo API response:', promoData);
            
            if (promoData && promoData.option_type === 'first_purchase_discount') {
              discountPercent = promoData.settings?.discount_value || 0;
              promoType = promoData.settings?.discount_type || 'percent';
              maxDiscountAmount = promoData.settings?.max_discount || 0;
              console.log('🎉 First purchase discount found:', discountPercent, '%');
            } else {
              console.log('⚠️ Promo code not valid for first purchase discount');
            }
          } catch (err) {
            console.error('❌ Promo check failed:', err);
          }
        } else {
          console.log('ℹ️ User not eligible for first purchase discount');
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
        
        console.log('🧮 Calculating stacked discount with:', { userDiscountsObj, userDataObj });
        
        const result = calculateStackedDiscount(product, userDiscountsObj, userDataObj);
        
        console.log('✅ Calculation result:', {
          originalPrice: result.originalPrice,
          finalPrice: result.finalPrice,
          discountAmount: result.discountAmount,
          appliedDiscounts: result.appliedDiscounts,
          isFirstPurchaseEligible: result.isFirstPurchaseEligible
        });
        
        setFinalPrice(result.finalPrice);
        setAppliedDiscounts(result.appliedDiscounts);
        setIsFirstPurchaseEligible(result.isFirstPurchaseEligible);
        setCalculationError(null);
      } else {
        console.warn('⚠️ Product not loaded yet');
      }
      setCalculationDone(true);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setCalculationError(error.message);
      if (product) setFinalPrice(product.hubby_price);
      setCalculationDone(true);
      setLoading(false);
    }
  };

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
        discount_breakdown: appliedDiscounts,
        promo_code_used: userData?.used_promote_code || null,
        status: 'pending',
        payment_method: 'manual',
        created_at: new Date().toISOString()
      });
      
      if (userData?.used_promote_code && !userData?.first_purchase_discount_used && isFirstPurchaseEligible) {
        await updateDoc(doc(db, 'users', user.uid), { first_purchase_discount_used: true });
      }
      
      alert('Order created! Send payment proof to Telegram: @william815');
      router.push('/orders');
    } catch (error) {
      console.error('Order creation error:', error);
      alert('Failed to create order');
    }
    setProcessing(false);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  if (loading || !product || !calculationDone) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasSpecialPrice = product.special_price && product.special_price > 0;
  const specialDiscountAmount = hasSpecialPrice ? product.hubby_price - product.special_price : 0;

  return (
    <>
      <Head><title>Checkout | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-4xl">
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🛒 Checkout</h1>
          
          {calculationError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
              ⚠️ Calculation Error: {calculationError}
            </div>
          )}
          
          {/* Bill Card Style Order Summary */}
          <div className={`rounded-2xl overflow-hidden mb-6 ${isDarkMode ? 'bg-[#0a0f2a]' : 'bg-white'} shadow-2xl border ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}>
            <div className={`px-6 py-4 ${isDarkMode ? 'bg-[#FF6B35]/20 border-b border-white/10' : 'bg-orange-50 border-b border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🧾 Order Summary</h2>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Digital Hub Myanmar</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Product</span>
                  <div className="text-right">
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.duration}</div>
                  </div>
                </div>
                
                {product.market_price > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">ဈေးကွက် ပျမ်းမျှဈေး</span>
                    <span className="line-through text-gray-500">{product.market_price.toLocaleString()} MMK</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2 border-b border-dashed border-white/10">
                  <span className="text-gray-400">Hubby Store ဈေး</span>
                  <span className="font-medium">{product.hubby_price?.toLocaleString()} MMK</span>
                </div>
                
                <div className="space-y-2 pt-2">
                  {hasSpecialPrice && specialDiscountAmount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>✨ Admin Special Discount</span>
                      <span>-{specialDiscountAmount.toLocaleString()} MMK</span>
                    </div>
                  )}
                  
                  {appliedDiscounts.filter(d => d.type === 'promo').map((discount, idx) => (
                    <div key={idx} className="flex justify-between text-green-400">
                      <span>{discount.label}</span>
                      <span>-{discount.amount.toLocaleString()} MMK</span>
                    </div>
                  ))}
                </div>
                
                <div className={`flex justify-between pt-4 mt-2 border-t-2 ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className={`text-2xl font-bold ${isDarkMode ? 'text-[#FF6B35]' : 'text-orange-600'}`}>
                    {finalPrice.toLocaleString()} MMK
                  </span>
                </div>
                
                {isFirstPurchaseEligible && promoDiscountPercent > 0 && !hasActiveOrder && (
                  <div className="mt-3 p-2 bg-green-500/10 rounded-lg text-center">
                    <p className="text-xs text-green-500">
                      🎉 First purchase discount ({promoDiscountPercent}% OFF) applied!
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`px-6 py-3 ${isDarkMode ? 'bg-white/5 border-t border-white/10' : 'bg-gray-50 border-t border-gray-200'}`}>
              <p className="text-center text-xs text-gray-500">
                Thank you for shopping at Digital Hub Myanmar
              </p>
            </div>
          </div>
          
          <div className={`rounded-2xl p-6 mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>💳 Payment Instructions</h2>
            <div className="space-y-3 text-gray-400 text-sm">
              <p>1. Transfer the total amount to:</p>
              <p className="pl-4">🏦 KBZ Bank: 0987654321 (William)</p>
              <p className="pl-4">📱 WavePay: 09798268154</p>
              <p>2. Take a screenshot of the payment</p>
              <p>3. Click "Confirm Order" below</p>
              <p>4. Send the screenshot to Telegram: <span className="text-[#FF6B35]">@william815</span></p>
            </div>
          </div>
          
          <button
            onClick={createOrder}
            disabled={processing}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-4 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {processing ? 'Processing...' : `✅ Confirm Order - ${finalPrice.toLocaleString()} MMK`}
          </button>
          
          <p className="text-center text-gray-500 text-xs mt-4">
            By confirming, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </>
  );
}
