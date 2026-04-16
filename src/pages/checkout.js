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
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [finalPrice, setFinalPrice] = useState(0);
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const [isFirstPurchaseEligible, setIsFirstPurchaseEligible] = useState(false);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [calculationDone, setCalculationDone] = useState(false);

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
      
      setUserData(userDoc.data());
      setPromoDiscountPercent(discountPercent);
      
      if (product) {
        const userDiscountsObj = { promoDiscount: discountPercent, promoType, maxDiscountAmount };
        const userDataObj = { 
          hasActiveOrder: hasOrder,
          first_purchase_discount_used: userDoc.exists() ? userDoc.data().first_purchase_discount_used : false
        };
        const result = calculateStackedDiscount(product, userDiscountsObj, userDataObj);
        setFinalPrice(result.finalPrice);
        setAppliedDiscounts(result.appliedDiscounts);
        setIsFirstPurchaseEligible(result.isFirstPurchaseEligible);
      }
      setCalculationDone(true);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      if (product) setFinalPrice(product.hubby_price);
      setCalculationDone(true);
      setLoading(false);
    }
  };

  const sendToContact = (platform, contactId) => {
    const message = `ဟုတ်ကဲ့ပါ။ ${product.name} (${product.duration}) ကို ${finalPrice.toLocaleString()} MMK ဖြင့် ဝယ်ယူလိုပါသည်။\n\nPayment proof will be sent after transfer.`;
    let url = '';
    if (platform === 'telegram') {
      url = `https://t.me/${contactId}?text=${encodeURIComponent(message)}`;
    } else if (platform === 'messenger') {
      url = `https://m.me/${contactId}`;
    } else if (platform === 'viber') {
      url = `viber://chat?number=${contactId}`;
    }
    if (url) window.open(url, '_blank');
    setShowContactOptions(false);
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
      
      if (userData?.used_promote_code && !userData?.first_purchase_discount_used) {
        await updateDoc(doc(db, 'users', user.uid), { first_purchase_discount_used: true });
      }
      
      alert('Order created! Please send payment proof to Telegram: @william815');
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
          
          {/* Order Summary */}
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
              
              {product.market_price > 0 && (
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">ဈေးကွက် ပျမ်းမျှဈေး</span>
                  <span className="line-through text-gray-400">{product.market_price.toLocaleString()} MMK</span>
                </div>
              )}
              
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-gray-400">Hubby Store ဈေး</span>
                <span className="text-[#FF6B35] font-bold">{product.hubby_price?.toLocaleString()} MMK</span>
              </div>
              
              {hasSpecialPrice && (
                <div className="flex justify-between py-2 border-b border-green-500/30 text-green-400">
                  <span>✨ Admin Special Discount</span>
                  <span>-{specialDiscountAmount.toLocaleString()} MMK</span>
                </div>
              )}
              
              {appliedDiscounts.filter(d => d.type === 'promo').map((discount, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-green-500/30 text-green-400">
                  <span>{discount.label}</span>
                  <span>-{discount.amount.toLocaleString()} MMK</span>
                </div>
              ))}
              
              <div className="flex justify-between py-3 text-lg font-bold border-t border-white/20 pt-3">
                <span className="text-gray-300">Special price for you</span>
                <span className="text-[#FF6B35] text-xl">{finalPrice.toLocaleString()} MMK</span>
              </div>
              
              {isFirstPurchaseEligible && promoDiscountPercent > 0 && !hasActiveOrder && (
                <div className="text-xs text-green-500 text-center mt-2 bg-green-500/10 p-2 rounded-lg">
                  🎉 First purchase discount ({promoDiscountPercent}% OFF) applied!
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Instructions */}
          <div className={`rounded-2xl p-6 mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>💳 Payment Instructions</h2>
            <div className="space-y-3 text-gray-400 text-sm">
              <p>1. Choose contact method below to send payment proof</p>
              <p>2. Transfer the total amount to:</p>
              <p className="pl-4">🏦 KBZ Bank: 0987654321 (William)</p>
              <p className="pl-4">📱 WavePay: 09798268154</p>
              <p>3. Take a screenshot of the payment</p>
              <p>4. Send the screenshot to the selected contact</p>
              <p>5. Click "Confirm Order" after sending</p>
            </div>
          </div>
          
          {/* Contact Options */}
          {!showContactOptions ? (
            <button 
              onClick={() => setShowContactOptions(true)} 
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg mb-4"
            >
              📞 Choose Contact Method
            </button>
          ) : (
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => sendToContact('telegram', 'william815')} className="bg-[#26A5E4] text-white p-3 rounded-xl font-semibold hover:opacity-90">📱 Telegram</button>
                <button onClick={() => sendToContact('messenger', 'william72425')} className="bg-[#0084FF] text-white p-3 rounded-xl font-semibold hover:opacity-90">💬 Messenger</button>
                <button onClick={() => sendToContact('viber', '09798268154')} className="bg-[#7360F2] text-white p-3 rounded-xl font-semibold hover:opacity-90">📞 Viber</button>
              </div>
              <button onClick={() => setShowContactOptions(false)} className="w-full text-gray-400 text-sm py-2 hover:text-white">◀ Back</button>
            </div>
          )}
          
          {/* Confirm Order Button */}
          <button
            onClick={createOrder}
            disabled={processing}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {processing ? 'Processing...' : `✅ I've made payment - Confirm Order (${finalPrice.toLocaleString()} MMK)`}
          </button>
          
          <p className="text-center text-gray-500 text-xs mt-4">
            By confirming, you agree to our terms and conditions. Orders will be processed within 24 hours.
          </p>
        </div>
      </div>
    </>
  );
}
