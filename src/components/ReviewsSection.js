import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import { useTheme } from '@/context/ThemeContext';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [displayType, setDisplayType] = useState('daily');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { isDarkMode } = useTheme();
  const [showAll, setShowAll] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  useEffect(() => {
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
        setAverageRating(data.averageRating || 0);
        setDisplayType(type);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAll = async () => {
    try {
      setLoadingAll(true);
      const response = await fetch('/api/reviews/fetch?type=all');
      if (response.ok) {
        const data = await response.json();
        setAllReviews(data.reviews);
        setShowAll(true);
      }
    } catch (error) {
      console.error('Error fetching all reviews:', error);
    } finally {
      setLoadingAll(false);
    }
  };

  const handleHideAll = () => {
    setShowAll(false);
    setAllReviews([]);
  };

  if (loading) {
    return (
      <section className={`w-full py-8 md:py-12 relative z-10 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#0a0f2a] via-[#020617] to-[#0a0f2a]' 
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center min-h-48">
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

  const displayedReviews = showAll ? allReviews : reviews;

  return (
    <section className={`w-full py-10 md:py-14 relative z-10 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-[#0a0f2a] via-[#020617] to-[#0a0f2a]' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
    }`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Rating Summary - compact layout */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className={`text-xl md:text-3xl font-bold mb-1 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-[#FF6B35] via-yellow-500 to-[#00D4FF] bg-clip-text text-transparent'
                  : 'text-gray-900'
              }`}>
                Reviews
              </h2>
              <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {showAll
                  ? `Showing all ${totalCount} reviews`
                  : totalCount > 5
                    ? 'Showing daily rotation'
                    : 'Customer reviews'}
              </p>
            </div>

            {/* Compact Overall Rating */}
            {totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className={`px-4 py-3 rounded-xl border backdrop-blur-sm ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                    : 'bg-yellow-50/60 border-yellow-200/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={`${
                          i < Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                    {averageRating.toFixed(1)}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ({totalCount} {totalCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {displayedReviews.length > 0 ? (
          <>
            {/* Review Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {displayedReviews.map((review, index) => (
                <motion.div key={review.id} variants={itemVariants}>
                  <ReviewCard review={review} index={index} />
                </motion.div>
              ))}
            </motion.div>
          </>
        ) : (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className={`text-base mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No reviews yet. Be the first to share your experience!
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          viewport={{ once: true }}
        >
          {totalCount > 5 && (
            <motion.button
              onClick={showAll ? handleHideAll : handleShowAll}
              disabled={loadingAll}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                isDarkMode
                  ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  : 'bg-white/60 text-gray-800 hover:bg-white/80 border border-gray-200'
              } disabled:opacity-50`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loadingAll ? 'Loading...' : showAll ? 'Show Less' : `See All Reviews (${totalCount})`}
            </motion.button>
          )}
          
          <motion.button
            onClick={() => setIsFormOpen(true)}
            className="px-5 py-2.5 rounded-lg font-medium text-sm bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white transition-all whitespace-nowrap"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(255, 107, 53, 0.3)" }}
            whileTap={{ scale: 0.95 }}
          >
            Write Review
          </motion.button>
        </motion.div>
      </div>

      <ReviewForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => fetchReviews(displayType)}
      />
    </section>
  );
}
