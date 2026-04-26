import { db } from '../../../utils/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reviewId } = req.body;

  if (!reviewId) {
    return res.status(400).json({ error: 'Review ID is required' });
  }

  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    await deleteDoc(reviewRef);

    return res.status(200).json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ error: 'Failed to delete review' });
  }
}
