
import { db } from '@/utils/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  try {
    const report = {
      settings: null,
      completedOrders: [],
      users: []
    };

    // 1. Check Settings
    const settingsSnap = await getDoc(doc(db, 'settings', 'pointsConfig'));
    report.settings = settingsSnap.exists() ? settingsSnap.data() : 'MISSING';

    // 2. Check Completed Orders
    const ordersSnap = await getDocs(query(collection(db, 'orders'), where('status', '==', 'completed')));
    report.completedOrders = ordersSnap.docs.map(d => ({
      id: d.id,
      user_id: d.data().user_id,
      final_price: d.data().final_price,
      total_amount: d.data().total_amount,
      inviter_id: d.data().inviter_id
    }));

    // 3. Check Users involved
    const userIds = [...new Set(report.completedOrders.map(o => o.user_id))];
    for (const uid of userIds) {
      if (uid) {
        const uSnap = await getDoc(doc(db, 'users', uid));
        report.users.push({
          id: uid,
          exists: uSnap.exists(),
          points_balance: uSnap.exists() ? uSnap.data().points_balance : null
        });
      }
    }

    return res.status(200).json(report);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
