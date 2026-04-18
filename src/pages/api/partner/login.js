import { db } from '@/utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promoCode, password } = req.body;

    if (!promoCode || !password) {
      return res.status(400).json({ error: 'Promo code and password are required' });
    }

    // Find promo code in database
    const q = query(
      collection(db, 'promo_codes'),
      where('code', '==', promoCode),
      where('is_partner_code', '==', true)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid promo code' });
    }

    const promoDoc = snapshot.docs[0];
    const promoData = promoDoc.data();

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, promoData.partner_password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Return partner session token (you can use JWT or session storage)
    return res.status(200).json({
      success: true,
      partnerId: promoDoc.id,
      partnerName: promoData.partner_name,
      promoCode: promoData.code,
      commissionPercent: promoData.partner_commission_percent,
      sessionToken: Buffer.from(`${promoDoc.id}:${promoCode}`).toString('base64')
    });
  } catch (error) {
    console.error('Error during partner login:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}
