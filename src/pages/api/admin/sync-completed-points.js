
import { db } from '@/utils/firebase';
import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Fetch points settings
    const settingsRef = doc(db, 'settings', 'pointsConfig');
    const settingsSnap = await getDoc(settingsRef);
    
    let settings = {
      ownPurchaseRatio: 0.01,
      inviteePurchaseRatio: 0.02,
      minPurchaseAmount: 1000
    };

    if (settingsSnap.exists()) {
      settings = { ...settings, ...settingsSnap.data() };
    }

    // 2. Fetch all completed orders
    const ordersQuery = query(collection(db, 'orders'), where('status', '==', 'completed'));
    const ordersSnap = await getDocs(ordersQuery);
    
    let processedCount = 0;
    let awardedCount = 0;
    const results = [];

    for (const orderDoc of ordersSnap.docs) {
      const orderData = orderDoc.data();
      const orderId = orderDoc.id;
      console.log(`Processing order ${orderId} for user ${orderData.user_id}, amount ${orderData.final_price || orderData.total_amount}`);
      
      // Check if points were already awarded for this order
      const historyQuery = query(
        collection(db, 'points_history'), 
        where('metadata.orderId', '==', orderId)
      );
      const historySnap = await getDocs(historyQuery);
      
      if (!historySnap.empty) {
        results.push({ orderId, status: 'skipped', reason: 'Points already awarded' });
        continue;
      }

      const userId = orderData.user_id;
      // Try multiple field names for price
      const totalAmount = orderData.final_price || orderData.total_amount || orderData.price || 0;
      const inviterId = orderData.inviter_id || null;

      if (!userId || totalAmount < (settings.minPurchaseAmount || 0)) {
        results.push({ orderId, status: 'skipped', reason: 'Invalid user or low amount' });
        continue;
      }

      // Award to Buyer
      const ownPoints = Math.floor(totalAmount * (settings.ownPurchaseRatio || 0));
      if (ownPoints > 0) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentBalance = userSnap.data().points_balance || 0;
          await addDoc(collection(db, 'points_history'), {
            user_id: userId,
            points: ownPoints,
            label: 'Purchase Reward (Retroactive)',
            type: 'earn',
            metadata: { orderId, amount: totalAmount, type: 'own_purchase' },
            created_at: serverTimestamp(),
            previous_balance: currentBalance,
            new_balance: currentBalance + ownPoints
          });
          await updateDoc(userRef, {
            points_balance: increment(ownPoints)
          });
        }
      }

      // Award to Inviter
      if (inviterId) {
        const referralPoints = Math.floor(totalAmount * (settings.inviteePurchaseRatio || 0));
        if (referralPoints > 0) {
          const inviterRef = doc(db, 'users', inviterId);
          const inviterSnap = await getDoc(inviterRef);
          if (inviterSnap.exists()) {
            const currentBalance = inviterSnap.data().points_balance || 0;
            await addDoc(collection(db, 'points_history'), {
              user_id: inviterId,
              points: referralPoints,
              label: 'Referral Purchase Reward (Retroactive)',
              type: 'earn',
              metadata: { orderId, amount: totalAmount, type: 'referral_purchase', purchaserId: userId },
              created_at: serverTimestamp(),
              previous_balance: currentBalance,
              new_balance: currentBalance + referralPoints
            });
            await updateDoc(inviterRef, {
              points_balance: increment(referralPoints)
            });
          }
        }
      }

      awardedCount++;
      results.push({ orderId, status: 'awarded', points: ownPoints });
    }

    return res.status(200).json({ 
      success: true, 
      processed: ordersSnap.size, 
      awarded: awardedCount,
      details: results
    });

  } catch (error) {
    console.error('Sync Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
