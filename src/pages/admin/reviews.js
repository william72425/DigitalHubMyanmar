import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminNavbar from '@/components/AdminNavbar';
import { Star, Eye, EyeOff, Trash2, MessageSquare, Send, X, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminReviews() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [actionLoading, setActionLoading] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [message, setMessage] = useState('');
  const [expandedReview, setExpandedReview] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else if (savedTheme === 'dark') setIsDarkMode(true);
    
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }
    fetchReviews();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reviews/fetch?type=all&admin=true');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setTotalCount(data.totalCount);
        setAverageRating(data.averageRating || 0);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
    setLoading(false);
  };

  const getAdminPassword = () => {
    return sessionStorage.getItem('admin_password') || '';
  };

  const handleAction = async (action, reviewId, extra = {}) => {
    setActionLoading(prev => ({ ...prev, [reviewId]: action }));
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewId,
          password: getAdminPassword(),
          ...extra,
        }),
      });

      if (response.ok) {
        setMessage(`Review ${action === 'hide' ? 'hidden' : action === 'unhide' ? 'unhidden' : action === 'delete' ? 'deleted' : action === 'reply' ? 'replied' : action === 'deleteReply' ? 'reply removed' : action} successfully`);
        await fetchReviews();
        if (action === 'reply') {
          setReplyingTo(null);
          setReplyText('');
        }
      } else {
        const data = await response.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
    setActionLoading(prev => ({ ...prev, [reviewId]: null }));
    setTimeout(() => setMessage(''), 3000);
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}
        />
      ))}
    </div>
  );

  // Filter and sort
  let filteredReviews = [...reviews];
  if (filterRating !== 'all') {
    filteredReviews = filteredReviews.filter(r => r.rating === parseInt(filterRating));
  }
  if (filterStatus === 'hidden') {
    filteredReviews = filteredReviews.filter(r => r.isHidden);
  } else if (filterStatus === 'visible') {
    filteredReviews = filteredReviews.filter(r => !r.isHidden);
  } else if (filterStatus === 'replied') {
    filteredReviews = filteredReviews.filter(r => r.adminReply);
  }

  if (sortBy === 'oldest') {
    filteredReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortBy === 'highest') {
    filteredReviews.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'lowest') {
    filteredReviews.sort((a, b) => a.rating - b.rating);
  } else if (sortBy === 'most_viewed') {
    filteredReviews.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  }
  // Default newest - already sorted from API

  const ratingDistribution = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rev => rev.rating === r).length,
    percent: reviews.length > 0 ? (reviews.filter(rev => rev.rating === r).length / reviews.length) * 100 : 0,
  }));

  return (
    <>
      <Head>
        <title>Admin - Reviews Management</title>
      </Head>

      <div className={`min-h-screen transition-all duration-300 ${
        isDarkMode
          ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]'
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
      }`}>
        <AdminNavbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        <div className="max-w-7xl mx-auto px-4 pt-20 pb-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
              isDarkMode
                ? 'bg-gradient-to-r from-[#FF6B35] via-yellow-500 to-[#00D4FF] bg-clip-text text-transparent'
                : 'text-gray-900'
            }`}>
              Reviews Management
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage customer reviews, reply as admin, and control visibility
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mb-6 p-3 rounded-lg text-sm font-medium ${
              message.startsWith('Error')
                ? isDarkMode ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-800'
                : isDarkMode ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-green-100 text-green-800'
            }`}>
              {message}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-96">
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading reviews...</p>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className={`p-4 rounded-xl border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                }`}>
                  <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Reviews</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalCount}</p>
                </div>
                <div className={`p-4 rounded-xl border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                }`}>
                  <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Average Rating</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>{averageRating.toFixed(1)}</p>
                    <Star size={18} className="fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                }`}>
                  <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hidden</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    {reviews.filter(r => r.isHidden).length}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                }`}>
                  <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Admin Replies</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {reviews.filter(r => r.adminReply).length}
                  </p>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className={`p-4 rounded-xl border mb-8 ${
                isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Rating Distribution
                </h3>
                <div className="space-y-2">
                  {ratingDistribution.map(({ rating, count, percent }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className={`text-xs w-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {rating} star
                      </span>
                      <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                        isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                      }`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className={`text-xs w-8 text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-6">
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Ratings</option>
                  {[5, 4, 3, 2, 1].map(r => (
                    <option key={r} value={r}>{r} Star</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="replied">With Reply</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                  <option value="most_viewed">Most Viewed</option>
                </select>

                <span className={`flex items-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Showing {filteredReviews.length} of {totalCount} reviews
                </span>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className={`p-4 md:p-5 rounded-xl border transition-all ${
                      review.isHidden
                        ? isDarkMode
                          ? 'bg-red-500/5 border-red-500/20 opacity-70'
                          : 'bg-red-50 border-red-200 opacity-70'
                        : isDarkMode
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Review Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {review.userName}
                          </h4>
                          {review.isHidden && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {renderStars(review.rating)}
                          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {review.userEmail}
                        </p>
                      </div>

                      {/* View Count & Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                          isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Eye size={12} />
                          <span>{review.viewCount || 0} views</span>
                        </div>

                        <button
                          onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                          }`}
                        >
                          {expandedReview === review.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Review Comment */}
                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {review.comment}
                    </p>

                    {/* Admin Reply Display */}
                    {review.adminReply && (
                      <div className={`p-3 rounded-lg mb-3 border-l-4 ${
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
                          {review.adminReplyAt && (
                            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatDate(review.adminReplyAt?.toDate?.() || review.adminReplyAt)}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {review.adminReply}
                        </p>
                      </div>
                    )}

                    {/* Expanded Actions */}
                    {expandedReview === review.id && (
                      <div className={`pt-3 mt-3 border-t flex flex-wrap gap-2 ${
                        isDarkMode ? 'border-white/10' : 'border-gray-200'
                      }`}>
                        {/* Hide/Unhide */}
                        <button
                          onClick={() => handleAction(review.isHidden ? 'unhide' : 'hide', review.id)}
                          disabled={!!actionLoading[review.id]}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            review.isHidden
                              ? isDarkMode
                                ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                              : isDarkMode
                                ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          } disabled:opacity-50`}
                        >
                          {review.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                          {actionLoading[review.id] === 'hide' || actionLoading[review.id] === 'unhide'
                            ? 'Processing...'
                            : review.isHidden ? 'Unhide' : 'Hide'}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to permanently delete this review?')) {
                              handleAction('delete', review.id);
                            }
                          }}
                          disabled={!!actionLoading[review.id]}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isDarkMode
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          } disabled:opacity-50`}
                        >
                          <Trash2 size={14} />
                          {actionLoading[review.id] === 'delete' ? 'Deleting...' : 'Delete'}
                        </button>

                        {/* Reply */}
                        {!review.adminReply ? (
                          <button
                            onClick={() => {
                              setReplyingTo(review.id);
                              setReplyText('');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isDarkMode
                                ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            <MessageSquare size={14} />
                            Reply
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction('deleteReply', review.id)}
                            disabled={!!actionLoading[review.id]}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isDarkMode
                                ? 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } disabled:opacity-50`}
                          >
                            <X size={14} />
                            {actionLoading[review.id] === 'deleteReply' ? 'Removing...' : 'Remove Reply'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reply Input */}
                    {replyingTo === review.id && (
                      <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                            Replying as Admin
                          </span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                        <div className="flex gap-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your admin reply..."
                            rows={2}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm border resize-none ${
                              isDarkMode
                                ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleAction('reply', review.id, { adminReply: replyText })}
                              disabled={!replyText.trim() || !!actionLoading[review.id]}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] text-white disabled:opacity-50"
                            >
                              <Send size={12} />
                              Send
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                isDarkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredReviews.length === 0 && (
                <div className="text-center py-16">
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    No reviews match your filters
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
