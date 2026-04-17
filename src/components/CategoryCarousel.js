import { useState } from 'react';
import Link from 'next/link';
import productsData from '@/data/products.json';

export default function CategoryCarousel() {
  const categories = [...new Set(productsData.map(p => p.category))];
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % categories.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + categories.length) % categories.length);
  };

  const getCategoryImage = (category) => {
    const product = productsData.find(p => p.category === category);
    return product?.logo_url || null;
  };

  if (categories.length === 0) return null;

  const category = categories[currentIndex];
  const categoryImage = getCategoryImage(category);
  const productCount = productsData.filter(p => p.category === category).length;

  return (
    <div className="relative w-full mb-8 group">
      <div className="flex justify-between items-center mb-3 px-2">
        <h2 className="text-white text-xl font-bold">📁 Categories</h2>
        <div className="flex gap-2">
          <button onClick={prevSlide} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
            ◀
          </button>
          <button onClick={nextSlide} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
            ▶
          </button>
        </div>
      </div>

      <Link href={`/?category=${encodeURIComponent(category)}`}>
        <div className="relative cursor-pointer rounded-2xl overflow-hidden">
          {/* 3:4 Image Container */}
          {categoryImage ? (
            <img 
              src={categoryImage} 
              alt={category}
              className="w-full aspect-[3/4] object-cover"
            />
          ) : (
            <div className="w-full aspect-[3/4] bg-gradient-to-br from-[#FF6B35]/50 to-[#00D4FF]/50 flex items-center justify-center">
              <span className="text-white text-4xl">📁</span>
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          
          {/* Category Info */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white text-2xl font-bold">{category}</h3>
            <p className="text-gray-300 text-sm">{productCount} products</p>
          </div>
        </div>
      </Link>

      {/* Indicators */}
      <div className="flex justify-center gap-2 mt-3">
        {categories.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1 rounded-full transition-all ${
              idx === currentIndex ? 'w-6 bg-[#FF6B35]' : 'w-3 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
