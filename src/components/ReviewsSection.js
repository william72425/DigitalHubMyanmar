import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [displayType, setDisplayType] = useState('daily');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check dark mode from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else setIsDarkMode(true);

    fetchReviews('daily');
  }, []);

  const fetchReviews = async (type) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/fetch?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setTotalCount(data.totalCount);
        setDisplayType(type);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className={`w-full py-12 md:py-16 relative z-10 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#0a0f2a] via-[#020617] to-[#0a0f2a]' 
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center min-h-64">
            <motion.p 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
            >
              Loading reviews...
            </motion.p>
          </div>
        </div>
      </section>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className={`w-full py-16 md:py-20 relative z-10 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-[#0a0f2a] via-[#020617] to-[#0a0f2a]' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
    }`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className={`text-3xl md:text-5xl font-bold mb-3 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-[#FF6B35] via-yellow-500 to-[#00D4FF] bg-clip-text text-transparent'
              : 'text-gray-900'
          }`}>
            💬 Reviews
          </h2>
          <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {totalCount > 5
              ? `Showing ${displayType === 'daily' ? 'daily rotation' : displayType} reviews`
              : 'Customer reviews'}
          </p>
        </motion.div>

        {reviews.length > 0 ? (
          <>
            {/* Review Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {reviews.map((review, index) => (
                <motion.div key={review.id} variants={itemVariants}>
                  <ReviewCard review={review} index={index} isDarkMode={isDarkMode} />
                </motion.div>
              ))}
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              viewport={{ once: true }}
            >
              {totalCount > 5 && (
                <Link href="/reviews">
                  <motion.button 
                    className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                      isDarkMode
                        ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        : 'bg-white/60 text-gray-800 hover:bg-white/80 border border-gray-200'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📖 View All Reviews
                  </motion.button>
                </Link>
              )}
              
              <motion.button
                onClick={() => setIsFormOpen(true)}
                className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white transition-all whitespace-nowrap"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(255, 107, 53, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                ✏️ Write Review
              </motion.button>
            </motion.div>
          </>
        ) : (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No reviews yet. Be the first to review! 🎉
            </p>
          </motion.div>
        )}
      </div>

      <ReviewForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => fetchReviews(displayType)}
        isDarkMode={isDarkMode}
      />
    </section>
  );
}
