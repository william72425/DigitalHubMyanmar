import { useState, useEffect } from 'react';
import Link from 'next/link';
import productsData from '@/data/products.json';

export default function EpicHeroCarousel() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const featured = productsData.filter(p => p.is_featured === true).slice(0, 10);
    setFeaturedProducts(featured);
  }, []);

  const nextSlide = () => {
    if (featuredProducts.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const prevSlide = () => {
    if (featuredProducts.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
  };

  if (featuredProducts.length === 0) return null;

  const product = featuredProducts[currentIndex];
  const posterImage = product.poster_16x9 || product.logo_url;
  const finalPrice = product.special_price || product.hubby_price;
  const originalPrice = product.hubby_price;
  const discountPercent = product.discount_percent;
  const discountAmount = originalPrice - finalPrice;
  const discountPercentTotal = Math.round((discountAmount / originalPrice) * 100);

  return (
    <div className="relative w-full mb-8 group">
      {/* Hero Section Label */}
      <div className="mb-3 px-2">
        <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
          🔥 Featured Discounts
        </span>
      </div>

      <Link href={`/products/${product.id}`}>
        <div className="relative cursor-pointer rounded-2xl overflow-hidden">
          {posterImage ? (
            <img 
              src={posterImage} 
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
          
          {/* Price & Discount Overlay - Epic Games Style */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex justify-between items-end">
              <div>
                {discountPercent && (
                  <span className="bg-cyan-500 text-black font-bold text-sm px-2 py-1 rounded-full">
                    -{discountPercent}%
                  </span>
                )}
                <div className="mt-2">
                  {discountPercent ? (
                    <>
                      <p className="text-gray-300 text-sm line-through">{originalPrice.toLocaleString()} MMK</p>
                      <p className="text-white text-2xl font-bold">{finalPrice.toLocaleString()} MMK</p>
                    </>
                  ) : (
                    <p className="text-white text-2xl font-bold">{finalPrice.toLocaleString()} MMK</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold text-lg">{product.name}</p>
                <p className="text-gray-300 text-sm">{product.duration}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Navigation Buttons */}
      {featuredProducts.length > 1 && (
        <>
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
        </>
      )}

      {/* Indicators */}
      {featuredProducts.length > 1 && (
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
      )}
    </div>
  );
}
