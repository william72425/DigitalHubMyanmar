import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, addDoc, collection, updateDoc, query, where, getDocs } from 'firebase/firestore';
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
  const [discountDetails, setDiscountDetails] = useState({
    hasSpecialPrice: false,
    specialDiscountAmount: 0,
    hasFirstPurchaseDiscount: false,
    firstPurchaseDiscountAmount: 0,
    promoPercent: 0
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
      // Check for active orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('user_id', '==', userId),
        where('status', 'in', ['pending', 'processing', 'completed'])
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const hasActiveOrder = !ordersSnapshot.empty;
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      let discountPercent = 0;
      
      // Check for first purchase discount eligibility
      if (!hasActiveOrder && userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.used_promote_code && !userData.first_purchase_discount_used && product) {
          try {
            const promoRes = await fetch(`/api/promo/check?code=${userData.used_promote_code}&productId=${product.id}`);
            const promoData = await promoRes.json();
            if (promoData && promoData.option_type === 'first_purchase_discount') {
              discountPercent = promoData.settings?.discount_value || 0;
            }
          } catch (err) {
            console.error('Promo check failed:', err);
          }
        }
      }
      
      setUserData(userDoc.data());
      
      // Calculate final price
      if (product) {
        let price = product.hubby_price;
        let specialDiscountAmount = 0;
        let firstPurchaseDiscountAmount = 0;
        let hasSpecialPrice = false;
        let hasFirstPurchaseDiscount = false;
        
        // Step 1: Apply Admin Special Price
        if (product.special_price && product.special_price > 0) {
          specialDiscountAmount = product.hubby_price - product.special_price;
          price = product.special_price;
          hasSpecialPrice = true;
        }
        
        // Step 2: Apply First Purchase Discount
        if (discountPercent > 0 && !hasActiveOrder && !userDoc.data()?.first_purchase_discount_used) {
          const discountAmount = Math.round(price * discountPercent / 100);
          if (discountAmount > 0 && discountAmount < price) {
            firstPurchaseDiscountAmount = discountAmount;
            price = price - discountAmount;
            hasFirstPurchaseDiscount = true;
          }
        }
        
        setFinalPrice(price);
        setDiscountDetails({
          hasSpecialPrice,
          specialDiscountAmount,
          hasFirstPurchaseDiscount,
          firstPurchaseDiscountAmount,
          promoPercent: discountPercent
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      if (product) setFinalPrice(product.hubby_price);
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
        special_discount: discountDetails.specialDiscountAmount,
        first_purchase_discount: discountDetails.firstPurchaseDiscountAmount,
        promo_code_used: userData?.used_promote_code || null,
        status: 'pending',
        payment_method: 'manual',
        created_at: new Date().toISOString()
      });
      
      if (userData?.used_promote_code && !userData?.first_purchase_discount_used && discountDetails.hasFirstPurchaseDiscount) {
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
                  {discountDetails.hasSpecialPrice && discountDetails.specialDiscountAmount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>✨ Admin Special Discount</span>
                      <span>-{discountDetails.specialDiscountAmount.toLocaleString()} MMK</span>
                    </div>
                  )}
                  
                  {discountDetails.hasFirstPurchaseDiscount && discountDetails.firstPurchaseDiscountAmount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>🎉 First Purchase ({discountDetails.promoPercent}% OFF)</span>
                      <span>-{discountDetails.firstPurchaseDiscountAmount.toLocaleString()} MMK</span>
                    </div>
                  )}
                </div>
                
                <div className={`flex justify-between pt-4 mt-2 border-t-2 ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className={`text-2xl font-bold ${isDarkMode ? 'text-[#FF6B35]' : 'text-orange-600'}`}>
                    {finalPrice.toLocaleString()} MMK
                  </span>
                </div>
                
                {discountDetails.hasFirstPurchaseDiscount && (
                  <div className="mt-3 p-2 bg-green-500/10 rounded-lg text-center">
                    <p className="text-xs text-green-500">
                      🎉 First purchase discount ({discountDetails.promoPercent}% OFF) applied!
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
