import { useState, useEffect } from 'react';
import Link from 'next/link';
import productsData from '@/data/products.json';

export default function EpicHeroCarousel() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Get products with discount or special price for featured
    const featured = productsData
      .filter(p => p.discount_percent || p.special_price)
      .slice(0, 5);
    setFeaturedProducts(featured);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
  };

  if (featuredProducts.length === 0) return null;

  const product = featuredProducts[currentIndex];
  const finalPrice = product.special_price || product.hubby_price;
  const discountPercent = product.discount_percent;

  return (
    <div className="relative w-full mb-8 group">
      <Link href={`/products/${product.id}`}>
        <div className="relative cursor-pointer rounded-2xl overflow-hidden">
          {/* 16:9 Poster Image */}
          {product.logo_url ? (
            <img 
              src={product.logo_url} 
              alt={product.name}
              className="w-full aspect-video object-cover object-center"
            />
          ) : (
            <div className="w-full aspect-video bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{product.name}</span>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          {/* Price & Discount Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div>
              {discountPercent && (
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                  🔥 {discountPercent}% OFF
                </span>
              )}
              <div className="mt-2">
                <p className="text-white text-2xl font-bold">{finalPrice.toLocaleString()} MMK</p>
                {product.market_price > finalPrice && (
                  <p className="text-gray-300 text-sm line-through">{product.market_price.toLocaleString()} MMK</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold text-lg">{product.name}</p>
              <p className="text-gray-300 text-sm">{product.duration}</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Navigation Buttons */}
      <button 
        onClick={prevSlide} 
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
      >
        ◀
      </button>
      <button 
        onClick={nextSlide} 
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
      >
        ▶
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {featuredProducts.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition ${
              idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
