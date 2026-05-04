import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import { useTheme } from '@/context/ThemeContext';

const CACHE_KEY = 'cached_reviews';
const CACHE_TIMESTAMP_KEY = 'cached_reviews_timestamp';

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

  // Cache helpers
  const getCachedReviews = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  };

  const setCachedReviews = (data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {}
  };

  const fetchReviews = useCallback(async (type, skipCache = false) => {
    try {
      // Check cache first if not skipping
      if (!skipCache) {
        const cached = getCachedReviews();
        if (cached && cached.type === type) {
          setReviews(cached.reviews);
          setTotalCount(cached.totalCount);
          setAverageRating(cached.averageRating || 0);
          setDisplayType(type);
          setLoading(false);
          
          // Still check for updates in background
          checkForUpdates(type);
          return;
        }
      }
      
      setLoading(true);
      const response = await fetch(`/api/reviews/fetch?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setTotalCount(data.totalCount);
        setAverageRating(data.averageRating || 0);
        setDisplayType(type);
        
        // Cache the result
        setCachedReviews({
          type,
          reviews: data.reviews,
          totalCount: data.totalCount,
          averageRating: data.averageRating,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkForUpdates = async (type) => {
    try {
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      const response = await fetch(`/api/reviews/fetch?type=${type}&since=${cachedTimestamp || 0}`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasUpdates && data.reviews) {
          // Update state and cache with new data
          setReviews(data.reviews);
          setTotalCount(data.totalCount);
          setAverageRating(data.averageRating || 0);
          setCachedReviews({
            type,
            reviews: data.reviews,
            totalCount: data.totalCount,
            averageRating: data.averageRating,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Error checking updates:', error);
    }
  };

  useEffect(() => {
    fetchReviews('daily');
  }, [fetchReviews]);

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

  if (loading && reviews.length === 0) {
    return (
      <section className={`w-full py-8 md:py-12 relative z-10 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#0a0f2a] via-[#020617] to-[#0a0f2a]' 
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center min-h-48">
            <div className={`animate-pulse ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading reviews...
            </div>
          </div>
        </div>
      </section>
    );
  }

  const displayedReviews = showAll ? allReviews : reviews;

  return (
    <section className={`w-full py-10 md:py-14 relative z-10 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-[#0a0f2a] via-[#020617] to-[#0a0f2a]' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
    }`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Rating Summary - compact layout */}
        <div className="mb-8">
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

            {totalCount > 0 && (
              <div
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
              </div>
            )}
          </div>
        </div>

        {displayedReviews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
              {displayedReviews.map((review, index) => (
                <ReviewCard key={review.id} review={review} index={index} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className={`text-base mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No reviews yet. Be the first to share your experience!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {totalCount > 5 && (
            <button
              onClick={showAll ? handleHideAll : handleShowAll}
              disabled={loadingAll}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                isDarkMode
                  ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  : 'bg-white/60 text-gray-800 hover:bg-white/80 border border-gray-200'
              } disabled:opacity-50`}
            >
              {loadingAll ? 'Loading...' : showAll ? 'Show Less' : `See All Reviews (${totalCount})`}
            </button>
          )}
          
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-5 py-2.5 rounded-lg font-medium text-sm bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white transition-all whitespace-nowrap"
          >
            Write Review
          </button>
        </div>
      </div>

      <ReviewForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          // Clear cache and refresh
          localStorage.removeItem(CACHE_KEY);
          fetchReviews(displayType, true);
        }}
      />
    </section>
  );
                }
