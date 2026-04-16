import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
  const [userDiscounts, setUserDiscounts] = useState({ promoDiscount: 0, promoType: 'percent', referralDiscount: 0 });
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [user, setUser] = useState(null);
  const [finalPrice, setFinalPrice] = useState(0);
  const [discountBreakdown, setDiscountBreakdown] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        await loadUserDiscounts(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserDiscounts = async (userId) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    let promoDiscount = 0;
    let promoType = 'percent';
    let stackWithSpecial = false;
    
    if (userData.used_promote_code && !userData.discount_used) {
      const promoQuery = await fetch(`/api/promo/check?code=${userData.used_promote_code}&productId=${product?.id}`);
      const promoData = await promoQuery.json();
      if (promoData.option_type === 'first_purchase_discount') {
        promoDiscount = promoData.settings?.discount_value || 0;
        promoType = promoData.settings?.discount_type || 'percent';
        stackWithSpecial = promoData.settings?.stack_with_special || false;
      }
    }
    
    setUserDiscounts({
      promoDiscount,
      promoType,
      stackWithSpecial,
      referralDiscount: userData.referral_discount || 0
    });
  }
};

  useEffect(() => {
    if (id) {
      const productId = parseInt(id);
      const found = productsData.find(p => p.id === productId);
      setProduct(found);
      
      const loadData = async () => {
        try {
          const res = await fetch('/api/admin/features');
          const freshData = await res.json();
          setFeatures(freshData.features?.filter(f => f.product_id === productId) || []);
          setProductNote(freshData.product_notes?.find(n => n.product_id === productId) || null);
        } catch (error) {
          console.error('Failed to load features:', error);
        }
      };
      
      loadData();
      setLoading(false);
    }
  }, [id]);

  // Calculate final price when product or discounts change
  useEffect(() => {
    if (product) {
      const result = calculateStackedDiscount(product, userDiscounts);
      setFinalPrice(result.finalPrice);
      setDiscountBreakdown(result.appliedDiscounts);
    }
  }, [product, userDiscounts]);

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const logoSize = product.logo_size || 70;

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

          {/* Price Section with Stacked Discounts */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">💰 ဈေးနှုန်းအသေးစိတ်</h2>
            <div className="space-y-3">
              {product.market_price > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-gray-300">ဈေးကွက် ပျမ်းမျှဈေး</span>
                  <span className="line-through text-gray-400">{product.market_price.toLocaleString()} MMK</span>
                </div>
              )}
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-gray-300">Hubby Store ဈေး</span>
                <span className="text-[#FF6B35] font-bold text-lg">{product.hubby_price?.toLocaleString()} MMK</span>
              </div>
              
              {/* Applied Discounts Breakdown */}
              {discountBreakdown.map((discount, idx) => (
                <div key={idx} className="flex justify-between items-center pb-2 border-b border-green-500/30 text-green-400">
                  <span>🎉 {discount.label}</span>
                  <span>-{discount.amount.toLocaleString()} MMK</span>
                </div>
              ))}
              
              {product.special_price > 0 && !userDiscounts.promoDiscount && (
                <div className="flex justify-between items-center pb-2 border-b border-green-500/30">
                  <span className="text-green-400 font-semibold">✨ အထူးလျှော့ဈေး</span>
                  <span className="text-green-400 font-bold text-xl">{product.special_price.toLocaleString()} MMK</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-white/20">
                <span className="text-lg font-bold">စုစုပေါင်း</span>
                <span className="text-[#FF6B35] font-bold text-xl">{finalPrice.toLocaleString()} MMK</span>
              </div>
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
                    </tr>
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

          {/* Buy Button */}
          {!showContactOptions ? (
            <button onClick={() => setShowContactOptions(true)} className="w-full bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-4 rounded-xl font-bold text-lg hover:opacity-90 cursor-pointer shadow-lg">
              🛒 အခုပဲ {finalPrice.toLocaleString()} MMK ဖြင့် ဝယ်ယူမည်
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => window.open('https://t.me/william815?text=' + encodeURIComponent(`ဟုတ်ကဲ့ပါ။ ${product.name} (${product.duration}) ကို ${finalPrice.toLocaleString()} MMK ဖြင့် ဝယ်ယူလိုပါသည်။`), '_blank')} className="bg-[#26A5E4] text-white p-3 rounded-xl font-semibold">📱 Telegram</button>
                <button onClick={() => window.open('https://m.me/william72425', '_blank')} className="bg-[#0084FF] text-white p-3 rounded-xl font-semibold">💬 Messenger</button>
                <button onClick={() => window.open('viber://chat?number=09798268154', '_blank')} className="bg-[#7360F2] text-white p-3 rounded-xl font-semibold">📞 Viber</button>
              </div>
              <button onClick={() => setShowContactOptions(false)} className="w-full text-gray-400 text-sm py-2">◀ နောက်သို့</button>
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
