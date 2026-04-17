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
    const { referrerId, buyerId, purchaseAmount, productName } = req.body;

    if (!referrerId || !buyerId || !purchaseAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get referrer data
    const referrerDoc = await getDoc(doc(db, 'users', referrerId));
    if (!referrerDoc.exists()) {
      return res.status(404).json({ error: 'Referrer not found' });
    }

    const referrerData = referrerDoc.data();
    const currentBalance = referrerData.points_balance || 0;

    // Calculate points (e.g., 10% of purchase amount as points, minimum 100 points)
    const pointsEarned = Math.max(Math.floor(purchaseAmount * 0.1), 100);
    const newBalance = currentBalance + pointsEarned;

    // Log the transaction
    await addDoc(collection(db, 'points_history'), {
      user_id: referrerId,
      points: pointsEarned,
      label: `Referral purchase: ${productName}`,
      type: 'earn',
      metadata: { 
        buyerId, 
        purchaseAmount, 
        productName,
        referralType: 'purchase'
      },
      created_at: serverTimestamp(),
      previous_balance: currentBalance,
      new_balance: newBalance
    });

    // Update referrer's points
    const updateData = {
      points_balance: increment(pointsEarned),
      total_referral_earnings: increment(purchaseAmount)
    };

    // Update highest points if applicable
    if (newBalance > (referrerData.highest_points_claimed || 0)) {
      updateData.highest_points_claimed = newBalance;
    }

    await updateDoc(doc(db, 'users', referrerId), updateData);

    // Record referral transaction
    await addDoc(collection(db, 'referral_transactions'), {
      referrer_id: referrerId,
      buyer_id: buyerId,
      purchase_amount: purchaseAmount,
      points_earned: pointsEarned,
      product_name: productName,
      created_at: serverTimestamp()
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Referral points awarded!',
      pointsEarned: pointsEarned,
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Error awarding referral points:', error);
    return res.status(500).json({ error: 'Failed to award referral points' });
  }
}
