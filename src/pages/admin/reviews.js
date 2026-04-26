import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronLeft, Trash2, MessageSquare, Star, Send } from 'lucide-react';
import { db } from '../utils/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [adminName, setAdminName] = useState('Admin');
  const [deletingId, setDeletingId] = useState(null);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else setIsDarkMode(true);

    // Check if already authenticated
    const savedAuth = sessionStorage.getItem('adminReviewsAuth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchReviews();
    } else {
      setLoading(false);
    }
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminReviewsAuth', 'true');
      fetchReviews();
      setPassword('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const reviewsRef = collection(db, 'reviews');
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      }));
      
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      setDeletingId(reviewId);
      const response = await fetch('/api/reviews/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
        setSelectedReview(null);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!selectedReview || !replyText.trim()) return;

    try {
      const response = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          adminName: adminName.trim(),
          replyMessage: replyText.trim(),
        }),
      });

      if (response.ok) {
        setReplyText('');
        // Update local review with new reply
        const updatedReviews = reviews.map(r => {
          if (r.id === selectedReview.id) {
            return {
              ...r,
              admin_replies: [
                ...(r.admin_replies || []),
                {
                  adminName: adminName.trim(),
                  message: replyText.trim(),
                  timestamp: new Date(),
                },
              ],
            };
          }
          return r;
        });
        setReviews(updatedReviews);
        const updated = updatedReviews.find(r => r.id === selectedReview.id);
        setSelectedReview(updated);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Login Form
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin - Reviews</title>
        </Head>
        <div className={`min-h-screen flex items-center justify-center p-4 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]'
            : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
        }`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md rounded-2xl border-2 backdrop-blur-md p-8 ${
              isDarkMode
                ? 'bg-[#0a0f2a] border-white/10'
                : 'bg-white border-gray-200'
            }`}
          >
            <h1 className={`text-3xl font-bold text-center mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Admin Dashboard
            </h1>
            <p className={`text-center text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Reviews Management
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg text-sm font-medium ${
                    isDarkMode
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {passwordError}
                </motion.div>
              )}

              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition-all ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white"
              >
                Login
              </motion.button>
            </form>
          </motion.div>
        </div>
      </>
    );
  }

  // Admin Dashboard
  return (
    <>
      <Head>
        <title>Admin - Reviews</title>
      </Head>
      <div className={`min-h-screen ${
        isDarkMode
          ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]'
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link href="/">
              <motion.button 
                className={`flex items-center gap-2 font-medium mb-6 transition-all ${
                  isDarkMode ? 'text-[#FF6B35]' : 'text-blue-600'
                }`}
                whileHover={{ x: -4 }}
              >
                <ChevronLeft size={20} />
                Back to Store
              </motion.button>
            </Link>

            <h1 className={`text-4xl font-bold mb-2 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] bg-clip-text text-transparent'
                : 'text-gray-900'
            }`}>
              Reviews Management
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {reviews.length} total reviews
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reviews List */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="text-center py-12">
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No reviews yet</p>
                </div>
              ) : (
                <motion.div className="space-y-4">
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedReview(review)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedReview?.id === review.id
                          ? isDarkMode
                            ? 'bg-white/10 border-[#FF6B35]/50'
                            : 'bg-white/80 border-blue-400'
                          : isDarkMode
                          ? 'bg-white/5 border-white/10 hover:border-white/30'
                          : 'bg-white/60 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {review.userName}
                          </h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isDarkMode 
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {review.rating} ⭐
                          </span>
                        </div>
                      </div>
                      <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {review.comment}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {renderStars(review.rating)}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Selected Review Detail & Reply Panel */}
            {selectedReview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-lg border-2 backdrop-blur-md overflow-hidden ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/60 border-gray-200'
                }`}
              >
                <div className={`p-4 border-b-2 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                  <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Review Details
                  </h3>
                </div>

                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {/* Review Info */}
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Author
                    </p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                      {selectedReview.userName}
                    </p>
                  </div>

                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Rating
                    </p>
                    <div className="flex gap-1">
                      {renderStars(selectedReview.rating)}
                    </div>
                  </div>

                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Comment
                    </p>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedReview.comment}
                    </p>
                  </div>

                  {/* Admin Replies */}
                  {selectedReview.admin_replies && selectedReview.admin_replies.length > 0 && (
                    <div>
                      <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Admin Replies
                      </p>
                      <div className="space-y-2">
                        {selectedReview.admin_replies.map((reply, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded text-sm ${
                              isDarkMode
                                ? 'bg-blue-500/10 text-blue-300'
                                : 'bg-blue-50 text-blue-800'
                            }`}
                          >
                            <p className="font-semibold">{reply.adminName}:</p>
                            <p>{reply.message}</p>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              {formatDate(reply.timestamp)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleReply} className={`p-4 border-t-2 space-y-3 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className={`w-full px-2 py-1 rounded text-sm border focus:outline-none focus:ring-2 focus:ring-[#FF6B35] ${
                        isDarkMode
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Reply
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      maxLength={500}
                      rows={3}
                      className={`w-full px-2 py-1 rounded text-sm border focus:outline-none focus:ring-2 focus:ring-[#FF6B35] resize-none ${
                        isDarkMode
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {replyText.length}/500
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      type="submit"
                      disabled={!replyText.trim()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white font-medium disabled:opacity-50"
                    >
                      <Send size={16} />
                      Reply
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => handleDeleteReview(selectedReview.id)}
                      disabled={deletingId === selectedReview.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-3 py-2 rounded bg-red-500/20 text-red-400 font-medium disabled:opacity-50 hover:bg-red-500/30"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
