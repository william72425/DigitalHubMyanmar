import { db } from '@/utils/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  collection,
  serverTimestamp,
  increment
} from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, redeemItemId } = req.body;

    if (!userId || !redeemItemId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const currentBalance = userData.points_balance || 0;

    // Get redeem item
    const redeemDoc = await getDoc(doc(db, 'redeem_items', redeemItemId));
    if (!redeemDoc.exists()) {
      return res.status(404).json({ error: 'Redeem item not found' });
    }

    const redeemData = redeemDoc.data();

    // Check if user has enough points
    if (currentBalance < redeemData.required_points) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Check spots limit if applicable
    if (redeemData.spots_limit) {
      const redeemQuery = await getDoc(doc(db, 'redeem_items', redeemItemId));
      const currentRedeems = redeemQuery.data().redeemed_count || 0;
      if (currentRedeems >= redeemData.spots_limit) {
        return res.status(400).json({ error: 'Redeem item is out of stock' });
      }
    }

    // Deduct points
    const newBalance = currentBalance - redeemData.required_points;
    await updateDoc(doc(db, 'users', userId), {
      points_balance: increment(-redeemData.required_points),
      total_used_points: increment(redeemData.required_points)
    });

    // Log the transaction
    await addDoc(collection(db, 'points_history'), {
      user_id: userId,
      points: -redeemData.required_points,
      label: `Redeemed: ${redeemData.name}`,
      type: 'use',
      metadata: { redeemItemId, redeemItemName: redeemData.name },
      created_at: serverTimestamp(),
      previous_balance: currentBalance,
      new_balance: newBalance
    });

    // Create redeem request record
    await addDoc(collection(db, 'redeem_requests'), {
      user_id: userId,
      username: userData.username,
      email: userData.email,
      redeem_item_id: redeemItemId,
      redeem_item_name: redeemData.name,
      points_used: redeemData.required_points,
      status: 'pending',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    // Increment redeemed count
    await updateDoc(doc(db, 'redeem_items', redeemItemId), {
      redeemed_count: increment(1)
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Redeem successful!',
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Error processing redeem:', error);
    return res.status(500).json({ error: 'Failed to process redeem' });
  }
}
