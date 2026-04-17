import { useState, useEffect } from 'react';
import Link from 'next/link';
import productsData from '@/data/products.json';

export default function CategoryCarousel() {
  const [categories, setCategories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const uniqueCategories = [...new Set(productsData.map(p => p.category))];
    const categoriesWithImages = uniqueCategories.map(category => {
      const productWithImage = productsData.find(p => p.category === category && p.category_3x4);
      const anyProduct = productsData.find(p => p.category === category);
      return {
        name: category,
        image: productWithImage?.category_3x4 || anyProduct?.logo_url || null,
        productCount: productsData.filter(p => p.category === category).length,
        minPrice: Math.min(...productsData.filter(p => p.category === category).map(p => p.special_price || p.hubby_price))
      };
    });
    setCategories(categoriesWithImages);
  }, []);

  const nextSlide = () => {
    if (categories.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % categories.length);
  };

  const prevSlide = () => {
    if (categories.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + categories.length) % categories.length);
  };

  if (categories.length === 0) return null;

  const category = categories[currentIndex];

  return (
    <div className="relative w-full mb-8 group">
      <div className="flex justify-between items-center mb-3 px-2">
        <h2 className="text-white text-xl font-bold">📁 Shop by Category</h2>
        {categories.length > 1 && (
          <div className="flex gap-2">
            <button onClick={prevSlide} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">◀</button>
            <button onClick={nextSlide} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">▶</button>
          </div>
        )}
      </div>
      <Link href={`/?category=${encodeURIComponent(category.name)}`}>
        <div className="relative cursor-pointer rounded-2xl overflow-hidden">
          {category.image ? (
            <img src={category.image} alt={category.name} className="w-full aspect-[3/4] object-cover" />
          ) : (
            <div className="w-full aspect-[3/4] bg-gradient-to-br from-[#FF6B35]/50 to-[#00D4FF]/50 flex items-center justify-center">
              <span className="text-white text-6xl">📁</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white text-2xl font-bold">{category.name}</h3>
            <p className="text-gray-300 text-sm">{category.productCount} products</p>
            <p className="text-[#FF6B35] text-lg font-bold mt-1">From {category.minPrice.toLocaleString()} MMK</p>
          </div>
        </div>
      </Link>
      {categories.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {categories.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-[#FF6B35]' : 'w-3 bg-white/30'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
