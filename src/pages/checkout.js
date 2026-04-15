import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';

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
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

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
      await loadUserData(user.uid);
      await loadProduct();
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const loadUserData = async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      setUserData(userDoc.data());
    }
  };

  const loadProduct = async () => {
    if (!id) return;
    try {
      const res = await fetch('/api/admin/products');
      const products = await res.json();
      const found = products.find(p => p.id === parseInt(id));
      setProduct(found);
      
      // Calculate discount if first purchase and has promo code
      if (userData?.used_promote_code && !userData?.discount_used) {
        // Check if promo code is first_purchase_discount type
        const promoQuery = await fetch(`/api/promo/check?code=${userData.used_promote_code}`);
        const promoData = await promoQuery.json();
        
        if (promoData.option_type === 'first_purchase_discount') {
          const discountPercent = promoData.settings?.discount_value || 20;
          const discountAmt = Math.round(found.hubby_price * discountPercent / 100);
          setDiscountAmount(discountAmt);
          setFinalPrice(found.hubby_price - discountAmt);
          setDiscountApplied(true);
        } else {
          setFinalPrice(found.hubby_price);
        }
      } else {
        setFinalPrice(found?.hubby_price || 0);
      }
    } catch (error) {
      console.error('Error loading product:', error);
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
        discount_applied: discountAmount,
        final_price: finalPrice,
        promo_code_used: userData?.used_promote_code || null,
        status: 'pending',
        payment_method: 'manual',
        created_at: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'orders'), orderData);
      
      // Mark discount as used
      if (discountApplied && !userData?.discount_used) {
        await updateDoc(doc(db, 'users', user.uid), {
          discount_used: true
        });
      }
      
      alert('Order created! Please send payment proof to Telegram: @william815');
      router.push('/dashboard/orders');
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
              
              {discountApplied && (
                <div className="flex justify-between py-2 border-b border-green-500/30 text-green-400">
                  <span>🎉 First Purchase Discount</span>
                  <span>-{discountAmount.toLocaleString()} MMK</span>
                </div>
              )}
              
              <div className="flex justify-between py-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-[#FF6B35]">{finalPrice.toLocaleString()} MMK</span>
              </div>
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
