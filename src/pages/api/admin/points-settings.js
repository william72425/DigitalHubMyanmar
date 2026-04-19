import { db } from '@/utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'pointsConfig'));
      if (settingsDoc.exists()) {
        res.status(200).json(settingsDoc.data());
      } else {
        const defaultSettings = {
          referralInviterPoints: 100,
          referralInviteePoints: 50,
          ownPurchaseRatio: 0.01,
          inviteePurchaseRatio: 0.005,
          minPurchaseAmount: 1000,
        };
        res.status(200).json(defaultSettings);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  } else if (req.method === 'POST') {
    try {
      const settingsData = {
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'settings', 'pointsConfig'), settingsData);
      res.status(200).json({ success: true, data: settingsData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
