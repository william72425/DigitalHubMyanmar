import { db } from '../../../utils/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type = 'daily' } = req.query;

  try {
    const reviewsRef = collection(db, 'reviews');
    // Simplified query - no composite index needed
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
      }))
      // Filter for public reviews in code
      .filter(review => review.isPublic !== false);

    let displayReviews;

    if (type === 'all') {
      // Return all reviews
      displayReviews = allReviews;
    } else if (type === 'random') {
      // Random 5 reviews
      displayReviews = allReviews.sort(() => Math.random() - 0.5).slice(0, 5);
    } else if (type === 'oldest') {
      // Oldest 5 reviews
      displayReviews = allReviews.reverse().slice(0, 5);
    } else if (type === 'recent') {
      // Recent 5 reviews
      displayReviews = allReviews.slice(0, 5);
    } else {
      // Daily rotation based on date
      const today = new Date().toDateString();
      const dayNumber = new Date().getDate();
      const startIndex = (dayNumber % Math.max(1, Math.ceil(allReviews.length / 5))) * 5;
      displayReviews = allReviews.slice(startIndex, startIndex + 5);
      if (displayReviews.length < 5) {
        displayReviews = [...displayReviews, ...allReviews.slice(0, 5 - displayReviews.length)];
      }
    }

    return res.status(200).json({
      reviews: displayReviews,
      totalCount: allReviews.length,
      type,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}
