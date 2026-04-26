import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export default function ReviewCard({ review, index, isDarkMode }) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.1, duration: 0.5 },
    },
  };

  const hoverVariants = {
    hover: {
      y: -4,
      boxShadow: isDarkMode 
        ? "0 20px 40px rgba(255, 107, 53, 0.2)"
        : "0 20px 40px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3 },
    },
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={18}
            className={`${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : isDarkMode ? 'text-gray-600' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'Recently';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={hoverVariants}
      className={`p-5 md:p-6 rounded-2xl border-2 transition-all h-full backdrop-blur-sm ${
        isDarkMode
          ? 'bg-white/5 border-white/10 hover:border-[#FF6B35]/50'
          : 'bg-white/60 border-gray-200 hover:border-[#FF6B35]/50'
      }`}
    >
      {/* User Info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className={`font-bold text-base md:text-lg ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {review.userName}
          </h4>
          <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {formatDate(review.createdAt)}
          </p>
        </div>
      </div>

      {/* Rating Stars */}
      <div className="mb-4">
        {renderStars(review.rating)}
      </div>

      {/* Review Comment */}
      <p className={`text-sm md:text-base leading-relaxed line-clamp-3 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {review.comment}
      </p>
    </motion.div>
  );
}
