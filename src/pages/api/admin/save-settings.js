import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { theme } = req.body;

  try {
    const docRef = doc(db, 'settings', 'site_settings');
    await setDoc(docRef, { 
      theme, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return res.status(500).json({ error: 'Failed to save settings' });
  }
}
