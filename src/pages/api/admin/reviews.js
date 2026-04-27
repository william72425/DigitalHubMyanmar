import { db } from '../../../utils/firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, reviewId, adminReply, password } = req.body;

  // Verify admin password
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!reviewId) {
    return res.status(400).json({ error: 'Review ID is required' });
  }

  try {
    const reviewRef = doc(db, 'reviews', reviewId);

    switch (action) {
      case 'hide':
        await updateDoc(reviewRef, { isHidden: true });
        return res.status(200).json({ message: 'Review hidden successfully' });

      case 'unhide':
        await updateDoc(reviewRef, { isHidden: false });
        return res.status(200).json({ message: 'Review unhidden successfully' });

      case 'delete':
        await deleteDoc(reviewRef);
        return res.status(200).json({ message: 'Review deleted successfully' });

      case 'reply':
        if (!adminReply || adminReply.trim().length === 0) {
          return res.status(400).json({ error: 'Reply text is required' });
        }
        await updateDoc(reviewRef, {
          adminReply: adminReply.trim(),
          adminReplyAt: serverTimestamp(),
        });
        return res.status(200).json({ message: 'Reply added successfully' });

      case 'deleteReply':
        await updateDoc(reviewRef, {
          adminReply: null,
          adminReplyAt: null,
        });
        return res.status(200).json({ message: 'Reply deleted successfully' });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error managing review:', error);
    return res.status(500).json({ error: 'Failed to manage review' });
  }
}
