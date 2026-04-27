import { db } from '../../../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { themeId, password } = req.body;

  // Verify admin password
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const validThemes = ['midnight-matrix', 'royal-amethyst', 'minimalist-slate'];
  if (!themeId || !validThemes.includes(themeId)) {
    return res.status(400).json({ error: 'Invalid theme ID' });
  }

  try {
    await setDoc(doc(db, 'settings', 'theme'), { themeId }, { merge: true });
    return res.status(200).json({ message: 'Theme updated successfully', themeId });
  } catch (error) {
    console.error('Error updating theme:', error);
    return res.status(500).json({ error: 'Failed to update theme' });
  }
}
