import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Check, LogIn } from 'lucide-react';
import { auth, db } from '@/utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function ReviewForm({ isOpen, onClose, onSuccess, isDarkMode = true }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check current user
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Get user data from Firestore to get username
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.username || user.email);
          } else {
            setUserName(user.email);
          }
        } catch (err) {
          setUserName(user.email);
        }
      } else {
        setCurrentUser(null);
        setUserName('');
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Please login to write a review');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName,
          rating: parseInt(rating),
          comment,
          userId: currentUser.uid,
          userEmail: currentUser.email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setRating(5);
      setComment('');

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (checkingAuth) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
        isDarkMode ? 'bg-black/70' : 'bg-black/40'
      }`}>
        <motion.div
          className={`rounded-2xl max-w-md w-full border-2 backdrop-blur-md ${
            isDarkMode
              ? 'bg-[#0a0f2a] border-white/10'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="p-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className={`inline-block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full"></div>
            </motion.div>
            <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Checking authentication...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
        isDarkMode ? 'bg-black/70' : 'bg-black/40'
      }`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`rounded-2xl max-w-md w-full border-2 backdrop-blur-md ${
            isDarkMode
              ? 'bg-[#0a0f2a] border-white/10'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className={`flex items-center justify-between p-6 border-b-2 ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Login Required
            </h2>
            <motion.button
              onClick={onClose}
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
              className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <X size={24} />
            </motion.button>
          </div>

          <div className="p-6 text-center space-y-4">
            <LogIn size={48} className={`mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Sign in to write a review
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              You need to be logged in to share your experience with our community.
            </p>

            <div className="flex gap-3 pt-4">
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all border-2 ${
                  isDarkMode
                    ? 'border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-50'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                }`}
              >
                Cancel
              </motion.button>
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white transition-all"
                >
                  Login / Register
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
      isDarkMode ? 'bg-black/70' : 'bg-black/40'
    }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`rounded-2xl max-w-md w-full border-2 backdrop-blur-md ${
          isDarkMode
            ? 'bg-[#0a0f2a] border-white/10'
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b-2 ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Share Your Review
          </h2>
          <motion.button
            onClick={onClose}
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
            className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <X size={24} />
          </motion.button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 p-3 rounded-lg ${
                isDarkMode
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-green-100 text-green-800 border border-green-300'
              }`}
            >
              <Check size={20} />
              <span className="font-medium">Thank you for your review!</span>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg text-sm font-medium ${
                isDarkMode
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {error}
            </motion.div>
          )}

          {/* Username (Auto-filled) */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition-all ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Auto-filled from your account
            </p>
          </div>

          {/* Rating */}
          <div>
            <label className={`block text-sm font-semibold mb-3 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Rating ({rating}/5)
            </label>
            <div className="flex gap-3 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  className="focus:outline-none transition-transform"
                >
                  <Star
                    size={40}
                    className={`${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              maxLength={1000}
              required
              rows={4}
              className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition-all resize-none ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
            <p className={`text-xs mt-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {comment.length}/1000 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <motion.button
              type="button"
              onClick={onClose}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all border-2 ${
                isDarkMode
                  ? 'border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              }`}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading || !comment}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
