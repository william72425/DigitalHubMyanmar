import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
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
  
  // Order summary data - same as detail page
  const [orderData, setOrderData] = useState({
    marketPrice: 0,
    hubbyPrice: 0,
    specialPrice: 0,
    specialDiscount: 0,
    firstPurchaseDiscount: 0,
    finalPrice: 0,
    promoPercent: 0,
    hasSpecialPrice: false,
    hasFirstPurchaseDiscount: false
  });

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
      await loadProductAndCalculate();
    });

    return () => unsubscribe();
  }, [id]);

  const loadProductAndCalculate = async () => {
    if (!id) return;
    
    // Load product
    const found = productsData.find(p => p.id === parseInt(id));
    if (!found) {
      setLoading(false);
      return;
    }
    setProduct(found);
    
    // Load user data
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data());
      
      // Check for active orders
      const ordersQuery = query(collection(db, 'orders'), where('user_id', '==', user.uid), where('status', 'in', ['pending', 'processing', 'completed']));
      const ordersSnapshot = await getDocs(ordersQuery);
      const hasActiveOrder = !ordersSnapshot.empty;
      
      // Get promo discount if available
      let promoDiscountPercent = 0;
      const userDataObj = userDoc.data();
      if (!hasActiveOrder && userDataObj.used_promote_code && !userDataObj.first_purchase_discount_used) {
        try {
          const promoRes = await fetch(`/api/promo/check?code=${userDataObj.used_promote_code}&productId=${found.id}`);
          const promoData = await promoRes.json();
          if (promoData && promoData.option_type === 'first_purchase_discount') {
            promoDiscountPercent = promoData.settings?.discount_value || 0;
          }
        } catch (err) {
          console.error('Promo check failed:', err);
        }
      }
      
      // Calculate exactly like detail page
      let price = found.hubby_price;
      let specialDisc = 0;
      let firstDisc = 0;
      let hasSpecial = false;
      
      // Admin Special Price
      if (found.special_price && found.special_price > 0) {
        specialDisc = found.hubby_price - found.special_price;
        price = found.special_price;
        hasSpecial = true;
      }
      
      // First Purchase Discount
      if (promoDiscountPercent > 0 && !hasActiveOrder && !userDataObj.first_purchase_discount_used) {
        firstDisc = Math.round(price * promoDiscountPercent / 100);
        if (firstDisc > price) firstDisc = price;
        price = price - firstDisc;
      }
      
      setOrderData({
        marketPrice: found.market_price || 0,
        hubbyPrice: found.hubby_price,
        specialPrice: found.special_price || 0,
        specialDiscount: specialDisc,
        firstPurchaseDiscount: firstDisc,
        finalPrice: price,
        promoPercent: promoDiscountPercent,
        hasSpecialPrice: hasSpecial,
        hasFirstPurchaseDiscount: firstDisc > 0
      });
    }
    setLoading(false);
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
        final_price: orderData.finalPrice,
        special_discount: orderData.specialDiscount,
        first_purchase_discount: orderData.firstPurchaseDiscount,
        promo_code_used: userData?.used_promote_code || null,
        status: 'pending',
        payment_method: 'manual',
        created_at: new Date().toISOString()
      });
      
      if (userData?.used_promote_code && !userData?.first_purchase_discount_used && orderData.hasFirstPurchaseDiscount) {
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
          
          {/* Order Summary - Same as Detail Page */}
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
              
              {orderData.marketPrice > 0 && (
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">ဈေးကွက် ပျမ်းမျှဈေး</span>
                  <span className="line-through text-gray-400">{orderData.marketPrice.toLocaleString()} MMK</span>
                </div>
              )}
              
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Hubby Store ဈေး</span>
                <span className="text-[#FF6B35] font-bold">{orderData.hubbyPrice.toLocaleString()} MMK</span>
              </div>
              
              {orderData.hasSpecialPrice && orderData.specialDiscount > 0 && (
                <div className="flex justify-between py-2 border-b border-green-500/30 text-green-400">
                  <span>✨ Admin Special Discount</span>
                  <span>-{orderData.specialDiscount.toLocaleString()} MMK</span>
                </div>
              )}
              
              {orderData.hasFirstPurchaseDiscount && orderData.firstPurchaseDiscount > 0 && (
                <div className="flex justify-between py-2 border-b border-green-500/30 text-green-400">
                  <span>🎉 First Purchase ({orderData.promoPercent}% OFF)</span>
                  <span>-{orderData.firstPurchaseDiscount.toLocaleString()} MMK</span>
                </div>
              )}
              
              <div className="flex justify-between py-3 text-lg font-bold border-t border-white/20 pt-3">
                <span className="text-gray-300">Special price for you</span>
                <span className="text-[#FF6B35] text-xl">{orderData.finalPrice.toLocaleString()} MMK</span>
              </div>
              
              {orderData.hasFirstPurchaseDiscount && (
                <div className="text-xs text-green-500 text-center mt-2 bg-green-500/10 p-2 rounded-lg">
                  🎉 First purchase discount ({orderData.promoPercent}% OFF) applied!
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Instructions */}
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
            {processing ? 'Processing...' : `✅ Confirm Order - ${orderData.finalPrice.toLocaleString()} MMK`}
          </button>
          
          <p className="text-center text-gray-500 text-xs mt-4">
            By confirming, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </>
  );
}
