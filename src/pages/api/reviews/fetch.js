import { db } from '../../../utils/firebase';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type = 'daily', admin } = req.query;

  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    const allReviews = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      }));

    // For admin, return all reviews including hidden ones
    if (admin === 'true') {
      const averageRating = allReviews.length > 0
        ? (allReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / allReviews.length).toFixed(1)
        : 0;

      return res.status(200).json({
        reviews: allReviews,
        totalCount: allReviews.length,
        averageRating: parseFloat(averageRating),
        type: 'all',
      });
    }

    // For public, filter out hidden reviews
    const publicReviews = allReviews.filter(review => review.isPublic !== false && review.isHidden !== true);

    // Track view count for non-admin requests
    if (type !== 'all') {
      const displayedIds = [];
      let displayReviews;

      if (type === 'random') {
        displayReviews = [...publicReviews].sort(() => Math.random() - 0.5).slice(0, 5);
      } else if (type === 'oldest') {
        displayReviews = [...publicReviews].reverse().slice(0, 5);
      } else if (type === 'recent') {
        displayReviews = publicReviews.slice(0, 5);
      } else {
        // Daily rotation
        const dayNumber = new Date().getDate();
        const startIndex = (dayNumber % Math.max(1, Math.ceil(publicReviews.length / 5))) * 5;
        displayReviews = publicReviews.slice(startIndex, startIndex + 5);
        if (displayReviews.length < 5 && publicReviews.length >= 5) {
          displayReviews = [...displayReviews, ...publicReviews.slice(0, 5 - displayReviews.length)];
        }
      }

      // Increment view counts for displayed reviews
      for (const review of displayReviews) {
        displayedIds.push(review.id);
        try {
          await updateDoc(doc(db, 'reviews', review.id), {
            viewCount: increment(1)
          });
        } catch (e) {
          // Ignore view count errors
        }
      }

      const averageRating = publicReviews.length > 0
        ? (publicReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / publicReviews.length).toFixed(1)
        : 0;

      return res.status(200).json({
        reviews: displayReviews,
        totalCount: publicReviews.length,
        averageRating: parseFloat(averageRating),
        type,
      });
    }

    // type === 'all' for public
    const averageRating = publicReviews.length > 0
      ? (publicReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / publicReviews.length).toFixed(1)
      : 0;

    return res.status(200).json({
      reviews: publicReviews,
      totalCount: publicReviews.length,
      averageRating: parseFloat(averageRating),
      type,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}
