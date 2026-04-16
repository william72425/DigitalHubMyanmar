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
  const [specialDiscount, setSpecialDiscount] = useState(0);
  const [firstPurchaseDiscount, setFirstPurchaseDiscount] = useState(0);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [promoPercent, setPromoPercent] = useState(0);
  const [hasSpecialPrice, setHasSpecialPrice] = useState(false);
  const [productLoaded, setProductLoaded] = useState(false);

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
    });

    return () => unsubscribe();
  }, [id]);

  const loadProduct = async () => {
    if (!id) {
      console.log('No product ID');
      return;
    }
    const found = productsData.find(p => p.id === parseInt(id));
    if (found) {
      setProduct(found);
      setProductLoaded(true);
      console.log('Product loaded:', found.name, found.hubby_price);
      await loadUserData(user?.uid);
    } else {
      console.log('Product not found for id:', id);
      setLoading(false);
    }
  };

  const loadUserData = async (userId) => {
    if (!userId || !product) {
      console.log('Missing userId or product for user data');
      return;
    }
    
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
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        console.log('User data:', { 
          used_promote_code: data.used_promote_code, 
          first_purchase_discount_used: data.first_purchase_discount_used 
        });
        
        // Only apply first purchase discount if user has NO active orders
        if (!hasOrder && data.used_promote_code && !data.first_purchase_discount_used && product) {
          try {
            const promoRes = await fetch(`/api/promo/check?code=${data.used_promote_code}&productId=${product.id}`);
            const promoData = await promoRes.json();
            console.log('Promo API response:', promoData);
            if (promoData && promoData.option_type === 'first_purchase_discount') {
              discountPercent = promoData.settings?.discount_value || 0;
              console.log('First purchase discount percent:', discountPercent);
            }
          } catch (err) {
            console.error('Promo check failed:', err);
          }
        }
      }
      
      setPromoPercent(discountPercent);
      
      // MANUAL CALCULATION
      if (product) {
        let price = product.hubby_price;
        let specialDisc = 0;
        let firstDisc = 0;
        let hasSpecial = false;
        
        console.log('Starting price:', price);
        
        // STEP 1: Admin Special Price
        if (product.special_price && product.special_price > 0) {
          specialDisc = product.hubby_price - product.special_price;
          price = product.special_price;
          hasSpecial = true;
          console.log('After special price:', price);
        }
        
        // STEP 2: First Purchase Discount
        const isEligible = discountPercent > 0 && !hasOrder && !userDoc.data()?.first_purchase_discount_used;
        console.log('First purchase eligible:', isEligible, 'Discount percent:', discountPercent);
        
        if (isEligible) {
          firstDisc = Math.round(price * discountPercent / 100);
          if (firstDisc > price) firstDisc = price;
          price = price - firstDisc;
          console.log('After first purchase discount:', price);
        }
        
        setHasSpecialPrice(hasSpecial);
        setSpecialDiscount(specialDisc);
        setFirstPurchaseDiscount(firstDisc);
        setFinalPrice(price);
        
        console.log('FINAL PRICE:', price);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
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
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const displayPrice = (finalPrice > 0) ? finalPrice : product.hubby_price;

  return (
    <>
      <Head><title>Checkout | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-4xl">
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🛒 Checkout</h1>
          
          {/* Bill Card */}
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
                
                {hasSpecialPrice && specialDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>✨ Admin Special Discount</span>
                    <span>-{specialDiscount.toLocaleString()} MMK</span>
                  </div>
                )}
                
                {firstPurchaseDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>🎉 First Purchase ({promoPercent}% OFF)</span>
                    <span>-{firstPurchaseDiscount.toLocaleString()} MMK</span>
                  </div>
                )}
                
                <div className={`flex justify-between pt-4 mt-2 border-t-2 ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className={`text-2xl font-bold ${isDarkMode ? 'text-[#FF6B35]' : 'text-orange-600'}`}>
                    {displayPrice.toLocaleString()} MMK
                  </span>
                </div>
                
                {firstPurchaseDiscount > 0 && (
                  <div className="mt-3 p-2 bg-green-500/10 rounded-lg text-center">
                    <p className="text-xs text-green-500">
                      🎉 First purchase discount ({promoPercent}% OFF) applied!
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`px-6 py-3 ${isDarkMode ? 'bg-white/5 border-t border-white/10' : 'bg-gray-50 border-t border-gray-200'}`}>
              <p className="text-center text-xs text-gray-500">Thank you for shopping at Digital Hub Myanmar</p>
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
            {processing ? 'Processing...' : `✅ Confirm Order - ${displayPrice.toLocaleString()} MMK`}
          </button>
          
          <p className="text-center text-gray-500 text-xs mt-4">
            By confirming, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </>
  );
}
