import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

export default function CategoryRow({ category, products }) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  if (products.length === 0) return null;

  // Get 3:4 image for this category (from first product that has it)
  const categoryImage = products.find(p => p.category_3x4)?.category_3x4 || 
                        products.find(p => p.logo_url)?.logo_url;

  return (
    <div className="mb-8">
      {/* Category Header */}
      <div className="flex justify-between items-center px-2 mb-3">
        <div className="flex items-center gap-2">
          {categoryImage && (
            <img 
              src={categoryImage} 
              alt={category}
              className="w-8 h-10 rounded object-cover"
            />
          )}
          <h2 className="text-white text-xl font-bold">{category}</h2>
        </div>
        <Link 
          href={`/?category=${encodeURIComponent(category)}`} 
          className="text-[#FF6B35] text-sm hover:underline"
        >
          View All →
        </Link>
      </div>

      {/* Horizontal Scroll Row */}
      <div className="relative group">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-r-lg transition"
          >
            ◀
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => {
            const finalPrice = product.special_price || product.hubby_price;
            const hasDiscount = product.discount_percent && product.discount_percent > 0;
            const productImage = product.category_3x4 || product.logo_url;
            
            return (
              <Link href={`/products/${product.id}`} key={product.id}>
                <div className="flex-shrink-0 w-40 bg-white/5 backdrop-blur-md rounded-xl p-3 hover:bg-white/10 transition cursor-pointer border border-white/10">
                  {/* 3:4 Product Image */}
                  <div className="w-full aspect-[3/4] rounded-lg overflow-hidden mb-2">
                    {productImage ? (
                      <img 
                        src={productImage} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FF6B35]/50 to-[#00D4FF]/50 flex items-center justify-center">
                        <span className="text-white text-2xl">📦</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <h3 className="text-white font-semibold text-sm truncate">{product.name}</h3>
                  <p className="text-gray-400 text-xs">{product.duration}</p>
                  
                  {/* Price */}
                  <div className="mt-2">
                    {hasDiscount ? (
                      <>
                        <p className="text-gray-500 text-xs line-through">{product.hubby_price?.toLocaleString()} MMK</p>
                        <p className="text-[#FF6B35] font-bold text-sm">{finalPrice.toLocaleString()} MMK</p>
                        <span className="text-green-400 text-[10px]">-{product.discount_percent}%</span>
                      </>
                    ) : (
                      <p className="text-[#FF6B35] font-bold text-sm">{finalPrice.toLocaleString()} MMK</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-l-lg transition"
          >
            ▶
          </button>
        )}
      </div>
    </div>
  );
}
