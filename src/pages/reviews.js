import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';
import { ChevronLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { isDarkMode } = useTheme();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const reviewsPerPage = 10;

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviews/fetch?type=all');
      if (response.ok) {
        const data = await response.json();
        const sortedReviews = data.reviews.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        setReviews(sortedReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const paginatedReviews = reviews.slice(startIndex, endIndex);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  return (
    <>
      <Head>
        <title>All Reviews - Digital Hub Myanmar</title>
        <meta name="description" content="Read all customer reviews for Digital Hub Myanmar services" />
      </Head>

      <div className={`min-h-screen transition-all duration-300 relative overflow-x-hidden ${
        isDarkMode
          ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]'
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 relative z-10">
          {/* Header */}
          <div className="mb-12">
            <Link href="/">
              <button className={`flex items-center gap-2 font-medium mb-8 transition-all ${
                isDarkMode
                  ? 'text-[#FF6B35] hover:text-[#00D4FF]'
                  : 'text-blue-600 hover:text-blue-700'
              }`}>
                <ChevronLeft size={20} />
                Back to Products
              </button>
            </Link>

            <h1 className={`text-4xl md:text-5xl font-bold mb-3 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-[#FF6B35] via-yellow-500 to-[#00D4FF] bg-clip-text text-transparent'
                : 'text-gray-900'
            }`}>
              💬 All Reviews
            </h1>
            <p className={`text-base md:text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} from our customers
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className={`animate-pulse ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading reviews...
              </div>
            </div>
          ) : reviews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">
                {paginatedReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} isDarkMode={isDarkMode} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mb-12">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                      isDarkMode
                        ? 'border-white/10 text-white hover:bg-white/10 disabled:opacity-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                    }`}
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg font-medium transition-all border-2 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white border-transparent'
                            : isDarkMode
                            ? 'border-white/10 text-white hover:bg-white/10'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                      isDarkMode
                        ? 'border-white/10 text-white hover:bg-white/10 disabled:opacity-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-8 py-4 rounded-lg font-semibold bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white transition-all"
                >
                  ✏️ Write Your Review
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No reviews yet. Be the first to review! 🎉
              </p>
              <Link href="/">
                <button className={`font-medium transition-all ${
                  isDarkMode
                    ? 'text-[#FF6B35] hover:text-[#00D4FF]'
                    : 'text-blue-600 hover:text-blue-700'
                }`}>
                  Back to Shopping →
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <ReviewForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => fetchAllReviews()}
        isDarkMode={isDarkMode}
      />
    </>
  );
    }
