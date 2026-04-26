import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export default function ReviewCard({ review, index }) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.1, duration: 0.5 },
    },
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={`${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md dark:hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
            {review.userName}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {review.createdAt
              ? new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recently'}
          </p>
        </div>
      </div>

      <div className="mb-2">
        {renderStars(review.rating)}
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {review.comment}
      </p>
    </motion.div>
  );
}
