import { db } from '../../../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'thantzin84727@gmail.com';

async function verifyFirebaseToken(idToken) {
  try {
    const apiKey = 'AIzaSyCHGG8jXfwQ4yPKatcngvTA85N_u2gDJYM';
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const user = data.users?.[0];
    return user?.email || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { themeId, password, authToken } = req.body;

  // Auth: accept ADMIN_PASSWORD or Firebase Auth token from admin email
  const adminPassword = process.env.ADMIN_PASSWORD;
  let isAuthorized = false;

  if (password && password === adminPassword) {
    isAuthorized = true;
  } else if (authToken) {
    const email = await verifyFirebaseToken(authToken);
    if (email === ADMIN_EMAIL) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
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
