import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ReviewCard({ review, index }) {
  const { isDarkMode } = useTheme();

  const hoverVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.1, duration: 0.5 },
    },
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
      variants={hoverVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="p-5 md:p-6 border-2 transition-all h-full backdrop-blur-sm"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      {/* User Info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-bold text-base md:text-lg" style={{ color: 'var(--text-primary)' }}>
            {review.userName}
          </h4>
          <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {formatDate(review.createdAt)}
          </p>
        </div>
      </div>

      {/* Rating Stars */}
      <div className="mb-4">
        {renderStars(review.rating)}
      </div>

      {/* Review Comment */}
      <p className={`text-sm md:text-base leading-relaxed ${review.adminReply ? '' : 'line-clamp-3'}`} style={{ color: 'var(--text-secondary)' }}>
        {review.comment}
      </p>

      {/* Admin Reply */}
      {review.adminReply && (
        <div className={`mt-4 p-3 rounded-lg border-l-4 ${
          isDarkMode
            ? 'bg-blue-500/10 border-blue-500/50'
            : 'bg-blue-50 border-blue-400'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Admin
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-blue-400">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <p className={`text-xs md:text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {review.adminReply}
          </p>
        </div>
      )}
    </motion.div>
  );
}
