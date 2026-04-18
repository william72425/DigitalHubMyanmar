import { db } from '@/utils/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promoId, partnerName, password, commissionPercent } = req.body;

    if (!promoId || !partnerName || !password || commissionPercent === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate commission percentage
    if (commissionPercent < 0 || commissionPercent > 100) {
      return res.status(400).json({ error: 'Commission percentage must be between 0 and 100' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update promo code with partner settings
    await updateDoc(doc(db, 'promo_codes', promoId), {
      is_partner_code: true,
      partner_name: partnerName,
      partner_password_hash: hashedPassword,
      partner_commission_percent: commissionPercent,
      updated_at: new Date()
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Partner settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating partner settings:', error);
    return res.status(500).json({ error: 'Failed to update partner settings' });
  }
}
