import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
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
  const [user, setUser] = useState(null);
  const [finalPrice, setFinalPrice] = useState(0);
  const [discountBreakdown, setDiscountBreakdown] = useState([]);
  const [isFirstPurchaseEligible, setIsFirstPurchaseEligible] = useState(false);
  const [showBuyOptions, setShowBuyOptions] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
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
        setUser(user);
        await loadUserDiscounts(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

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
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      let discountPercent = 0;
      let promoType = 'percent';
      let stackWithSpecial = false;
      let maxDiscountAmount = 0;
      
      // Only apply first purchase discount if user has NO orders
      if (!hasOrder && userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.used_promote_code && !userData.first_purchase_discount_used && product) {
          try {
            const promoRes = await fetch(`/api/promo/check?code=${userData.used_promote_code}&productId=${product.id}`);
            const promoData = await promoRes.json();
            if (promoData.option_type === 'first_purchase_discount') {
              discountPercent = promoData.settings?.discount_value || 0;
              promoType = promoData.settings?.discount_type || 'percent';
              stackWithSpecial = promoData.settings?.stack_with_special || false;
              maxDiscountAmount = promoData.settings?.max_discount || 0;
            }
          } catch (err) {
            console.error('Promo check failed:', err);
          }
        }
      }
      
      setPromoDiscount(discountPercent);
      
      // Calculate final price
      if (product) {
        const userDiscounts = {
          promoDiscount: discountPercent,
          promoType,
          stackWithSpecial,
          maxDiscountAmount
        };
        const userDataObj = { hasActiveOrder: hasOrder };
        
        const result = calculateStackedDiscount(product, userDiscounts, userDataObj);
        setFinalPrice(result.finalPrice);
        setDiscountBreakdown(result.appliedDiscounts);
        setIsFirstPurchaseEligible(result.isFirstPurchaseEligible);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
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
    if (!user) {
      router.push('/auth');
      return;
    }
    router.push(`/checkout?id=${product.id}`);
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const logoSize = product.logo_size || 70;
  const hasSpecialPrice = product.special_price && product.special_price > 0;

  return (
    <>
      <Head><title>{product.name} | Digital Hub Myanmar</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617] text-white">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          
          <button onClick={() => router.back()} className="text-gray-400 hover:text-[#FF6B35] mb-6">← နောက်သို့</button>

          {/* Product Header */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-5">
              {product.logo_url ? (
                <img src={product.logo_url} className="rounded-xl object-contain" style={{ width: logoSize + 'px', height: logoSize + 'px' }} alt={product.name} />
              ) : (
                <div className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] flex items-center justify-center text-white font-bold text-2xl" style={{ width: logoSize + 'px', height: logoSize + 'px' }}>
                  {product.name?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
                <p className="text-gray-400 text-sm">📅 {product.duration}</p>
              </div>
            </div>
          </div>

          {/* Price Section */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">💰 ဈေးနှုန်းအသေးစိတ်</h2>
            <div className="space-y-3">
              {/* Market Price */}
              {product.market_price > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-gray-300">ဈေးကွက် ပျမ်းမျှဈေး</span>
                  <span className="line-through text-gray-400">{product.market_price.toLocaleString()} MMK</span>
                </div>
              )}
              
              {/* Hubby Store Price */}
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-gray-300">Hubby Store ဈေး</span>
                <span className="text-[#FF6B35] font-bold text-lg">{product.hubby_price?.toLocaleString()} MMK</span>
              </div>
              
              {/* Admin Special Price */}
              {hasSpecialPrice && (
                <div className="flex justify-between items-center pb-2 border-b border-green-500/30 text-green-400">
                  <span>✨ Admin Special Price</span>
                  <span>{product.special_price.toLocaleString()} MMK</span>
                </div>
              )}
              
              {/* First Purchase Discount */}
              {discountBreakdown.map((discount, idx) => (
                <div key={idx} className="flex justify-between items-center pb-2 border-b border-green-500/30 text-green-400">
                  <span>🎉 {discount.label}</span>
                  <span>-{discount.amount.toLocaleString()} MMK</span>
                </div>
              ))}
              
              {/* Final Price */}
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-white/20">
                <span className="text-lg font-bold">စုစုပေါင်း</span>
                <span className="text-[#FF6B35] font-bold text-xl">{finalPrice.toLocaleString()} MMK</span>
              </div>
              
              {/* First Purchase Note */}
              {isFirstPurchaseEligible && promoDiscount > 0 && !hasActiveOrder && (
                <div className="text-xs text-green-500 text-center mt-2 bg-green-500/10 p-2 rounded-lg">
                  🎉 First purchase discount ({promoDiscount}% OFF) applied!
                </div>
              )}
            </div>
          </div>

          {/* Features Section */}
          {features.length > 0 && (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 mb-6 overflow-x-auto">
              <h2 className="text-xl font-bold mb-4">✨ အင်္ဂါရပ်များ နှိုင်းယှဉ်ချက်</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-2 text-gray-400">အင်္ဂါရပ်များ</th>
                    <th className="text-center py-3 px-2 text-gray-400 w-1/3">✨ အခမဲ့</th>
                    <th className="text-center py-3 px-2 bg-gradient-to-r from-[#FF6B35]/20 to-[#00D4FF]/20 text-[#FF6B35] font-bold w-1/3">💎 Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, idx) => (
                    <tr key={feature.id} className={`border-b border-white/10 ${idx % 2 === 0 ? 'bg-white/5' : ''}`}>
                      <td className="py-3 px-2 text-sm">{feature.feature_name}</td>
                      <td className="text-center py-3 px-2">
                        {feature.free ? <span className="text-green-400">✓ {feature.free}</span> : <span className="text-gray-500">—</span>}
                      </td>
                      <td className="text-center py-3 px-2 bg-gradient-to-r from-[#FF6B35]/10 to-[#00D4FF]/10">
                        <span className="text-[#FF6B35] font-semibold">✓ {feature.pro || feature.free || 'အပြည့်အစုံ'}</span>
                      </td>
                    <tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* NOTE BOX */}
          {productNote && productNote.content && productNote.content.trim() !== '' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6">
              <h3 className="text-yellow-500 font-bold mb-2">{productNote.title || '📌 မှတ်ချက်'}</h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{productNote.content}</p>
            </div>
          )}

          {/* Buy Options */}
          {!showBuyOptions ? (
            <button 
              onClick={() => setShowBuyOptions(true)} 
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-4 rounded-xl font-bold text-lg hover:opacity-90 cursor-pointer shadow-lg"
            >
              🛒 အခုပဲ {finalPrice.toLocaleString()} MMK ဖြင့် ဝယ်ယူမည်
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => handleExternalBuy('telegram', 'william815')} className="bg-[#26A5E4] text-white p-3 rounded-xl font-semibold">📱 Telegram</button>
                <button onClick={() => handleExternalBuy('messenger', 'william72425')} className="bg-[#0084FF] text-white p-3 rounded-xl font-semibold">💬 Messenger</button>
                <button onClick={() => handleExternalBuy('viber', '09798268154')} className="bg-[#7360F2] text-white p-3 rounded-xl font-semibold">📞 Viber</button>
              </div>
              <button onClick={handleDirectBuy} className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white p-3 rounded-xl font-semibold">🛍️ Buy Directly on Website</button>
              <button onClick={() => setShowBuyOptions(false)} className="w-full text-gray-400 text-sm py-2">◀ နောက်သို့</button>
            </div>
          )}

          <div className="mt-6 p-3 bg-blue-500/10 rounded-lg text-center">
            <p className="text-gray-400 text-xs">💡 Note: နောက်ပိုင်းမှာ အခု web page ထဲကနေ တိုက်ရိုက်ဝယ်နိုင်အောင် ကြိုးစားသွားပါဦးမည်။</p>
          </div>
        </div>
      </div>
    </>
  );
}
