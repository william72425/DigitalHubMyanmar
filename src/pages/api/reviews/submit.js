import { db } from '../../../utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userName, rating, comment, userId, userEmail } = req.body;

  // Validation
  if (!userName || !rating || !comment || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  if (comment.trim().length === 0 || comment.trim().length > 1000) {
    return res.status(400).json({ error: 'Comment must be between 1 and 1000 characters' });
  }

  if (userName.trim().length === 0 || userName.trim().length > 100) {
    return res.status(400).json({ error: 'Username must be between 1 and 100 characters' });
  }

  try {
    const reviewsRef = collection(db, 'reviews');
    const docRef = await addDoc(reviewsRef, {
      userName: userName.trim(),
      rating: parseInt(rating),
      comment: comment.trim(),
      userId: userId,
      userEmail: userEmail,
      isPublic: true,
      createdAt: serverTimestamp(),
    });

    return res.status(201).json({
      id: docRef.id,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
}
