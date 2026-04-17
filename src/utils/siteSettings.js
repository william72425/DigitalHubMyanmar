import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const SETTINGS_DOC_ID = 'site_settings';

export async function getTheme() {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().theme || 'normal';
    }
    return 'normal';
  } catch (error) {
    console.error('Error getting theme:', error);
    return 'normal';
  }
}

export async function setTheme(theme) {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await setDoc(docRef, { theme, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error setting theme:', error);
    return false;
  }
}

export async function getSiteSettings() {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return { theme: 'normal' };
  } catch (error) {
    console.error('Error getting settings:', error);
    return { theme: 'normal' };
  }
}
