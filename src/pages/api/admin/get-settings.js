import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const docRef = doc(db, 'settings', 'site_settings');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return res.status(200).json(docSnap.data());
    } else {
      return res.status(200).json({ theme: 'normal' });
    }
  } catch (error) {
    console.error('Error getting settings:', error);
    return res.status(500).json({ error: 'Failed to get settings' });
  }
}
