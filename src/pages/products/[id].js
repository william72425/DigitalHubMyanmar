import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import productsData from '@/data/products.json';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const found = productsData.find(p => p.id === parseInt(id));
      setProduct(found);
      setLoading(false);
    }
  }, [id]);

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const logoSize = product.logo_size || 70;
  const displayPrice = product.special_price || product.hubby_price;

  return (
    <>
      <Head>
        <title>{product.name} | Digital Hub Myanmar</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617] text-white">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          
          <button onClick={() => router.back()} className="text-gray-400 hover:text-[#FF6B35] mb-6 flex items-center gap-2">
            ← နောက်သို့
          </button>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-5">
              {product.logo_url ? (
                <img 
                  src={product.logo_url} 
                  className="rounded-xl object-contain" 
                  style={{ width: logoSize + 'px', height: logoSize + 'px' }} 
                  alt={product.name}
                />
              ) : (
                <div 
                  className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] flex items-center justify-center text-white font-bold text-2xl"
                  style={{ width: logoSize + 'px', height: logoSize + 'px' }}
                >
                  {product.name?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
                <p className="text-gray-400 text-sm">📅 {product.duration}</p>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
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
              {product.special_price > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-green-500/30">
                  <span className="text-green-400 font-semibold">✨ အထူးလျှော့ဈေး</span>
                  <span className="text-green-400 font-bold text-xl">{product.special_price.toLocaleString()} MMK</span>
                </div>
              )}
            </div>
            
            <button className="w-full mt-6 bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white p-4 rounded-xl font-bold text-lg hover:opacity-90 transition">
              🛒 အခုပဲ {displayPrice.toLocaleString()} MMK ဖြင့် ဝယ်ယူမည်
            </button>
          </div>
          
          <div className="mt-6 p-3 bg-blue-500/10 rounded-lg text-center">
            <p className="text-gray-400 text-xs">💡 Note: နောက်ပိုင်းမှာ အခု web page ထဲကနေ တိုက်ရိုက်ဝယ်နိုင်အောင် ကြိုးစားသွားပါဦးမည်။</p>
          </div>
        </div>
      </div>
    </>
  );
    }
