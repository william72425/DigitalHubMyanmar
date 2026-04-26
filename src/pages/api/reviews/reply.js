import { db } from '../../../utils/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reviewId, adminName, replyMessage } = req.body;

  // Validation
  if (!reviewId || !adminName || !replyMessage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (replyMessage.trim().length === 0 || replyMessage.trim().length > 500) {
    return res.status(400).json({ error: 'Reply must be between 1 and 500 characters' });
  }

  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    
    await updateDoc(reviewRef, {
      admin_replies: arrayUnion({
        adminName: adminName.trim(),
        message: replyMessage.trim(),
        timestamp: serverTimestamp(),
      }),
    });

    return res.status(200).json({
      message: 'Reply added successfully',
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    return res.status(500).json({ error: 'Failed to add reply' });
  }
}
