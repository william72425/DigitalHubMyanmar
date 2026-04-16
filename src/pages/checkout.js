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
  const [discountBreakdown, setDiscountBreakdown] = useState([]);
  const [finalPrice, setFinalPrice] = useState(0);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);
  const [isFirstPurchaseEligible, setIsFirstPurchaseEligible] = useState(false);

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
  };

  const loadUserData = async (userId) => {
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
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      let promoDiscount = 0;
      let promoType = 'percent';
      let stackWithSpecial = false;
      let maxDiscountAmount = 0;
      let isFirstPurchase = false;
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        
        // Only apply first purchase discount if user has NO active orders
        if (!hasOrder && data.used_promote_code && !data.first_purchase_discount_used && product) {
          try {
            const promoRes = await fetch(`/api/promo/check?code=${data.used_promote_code}&productId=${product.id}`);
            const promoData = await promoRes.json();
            if (promoData && promoData.option_type === 'first_purchase_discount') {
              promoDiscount = promoData.settings?.discount_value || 0;
              promoType = promoData.settings?.discount_type || 'percent';
              stackWithSpecial = promoData.settings?.stack_with_special || false;
              maxDiscountAmount = promoData.settings?.max_discount || 0;
              isFirstPurchase = true;
            }
          } catch (err) {
            console.error('Promo check failed:', err);
          }
        }
      }
      
      setPromoDiscountPercent(promoDiscount);
      setIsFirstPurchaseEligible(isFirstPurchase);
      
      const discounts = {
        promoDiscount,
        promoType,
        stackWithSpecial,
        maxDiscountAmount
      };
      
      if (product) {
        const userDataObj = { 
          hasActiveOrder: hasOrder,
          first_purchase_discount_used: userDoc.exists() ? userDoc.data().first_purchase_discount_used : false
        };
        const result = calculateStackedDiscount(product, discounts, userDataObj);
        setFinalPrice(result.finalPrice);
        setDiscountBreakdown(result.appliedDiscounts);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback: show regular price
      if (product) {
        setFinalPrice(product.hubby_price);
      }
      setLoading(false);
    }
  };

  const createOrder = async () => {
    setProcessing(true);
    try {
      const orderData = {
        user_id: user.uid,
        username: userData?.username,
        product_id: product.id,
        product_name: product.name,
        duration: product.duration,
        original_price: product.hubby_price,
        discount_breakdown: discountBreakdown,
        final_price: finalPrice,
        promo_code_used: userData?.used_promote_code || null,
        status: 'pending',
        payment_method: 'manual',
        created_at: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'orders'), orderData);
      
      // Mark discount as used when order is created (pending)
      if (userData?.used_promote_code && !userData?.first_purchase_discount_used) {
        await updateDoc(doc(db, 'users', user.uid), { 
          first_purchase_discount_used: true 
        });
      }
      
      alert('Order created! Please send payment proof to Telegram: @william815');
      router.push('/orders');
    } catch (error) {
      console.error('Order creation error:', error);
      alert('Failed to create order: ' + error.message);
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
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Checkout | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-4xl">
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🛒 Checkout</h1>
          
          <div className={`rounded-2xl p-6 mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Product</span>
                <span className="font-semibold">{product.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Duration</span>
                <span>{product.duration}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Original Price</span>
                <span>{product.hubby_price?.toLocaleString()} MMK</span>
              </div>
              
              {discountBreakdown.map((discount, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-green-500/30 text-green-400">
                  <span>🎉 {discount.label}</span>
                  <span>-{discount.amount.toLocaleString()} MMK</span>
                </div>
              ))}
              
              <div className="flex justify-between py-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-[#FF6B35]">{finalPrice.toLocaleString()} MMK</span>
              </div>
              
              {isFirstPurchaseEligible && promoDiscountPercent > 0 && !hasActiveOrder && (
                <div className="text-xs text-green-500 text-center mt-2 bg-green-500/10 p-2 rounded-lg">
                  🎉 First purchase discount ({promoDiscountPercent}% OFF) applied!
                </div>
              )}
              
              {hasActiveOrder && promoDiscountPercent > 0 && (
                <div className="text-xs text-yellow-500 text-center mt-2 bg-yellow-500/10 p-2 rounded-lg">
                  ⚠️ You already have an active order. First purchase discount is only for new users.
                </div>
              )}
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
            {processing ? 'Processing...' : `Confirm Order - ${finalPrice.toLocaleString()} MMK`}
          </button>
          
          <p className="text-center text-gray-500 text-xs mt-4">
            By confirming, you agree to our terms and conditions. Orders will be processed within 24 hours.
          </p>
        </div>
      </div>
    </>
  );
}
