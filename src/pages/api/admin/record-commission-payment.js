import { db } from '@/utils/firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promoCode, amount, paymentMethod, notes, period, startDate, endDate } = req.body;

    if (!promoCode || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Record the payment
    const paymentRecord = await addDoc(collection(db, 'partner_commission_payments'), {
      promo_code: promoCode,
      amount: amount,
      payment_method: paymentMethod || 'bank_transfer',
      notes: notes || '',
      period: period || 'custom',
      period_start: startDate || null,
      period_end: endDate || null,
      paid_at: serverTimestamp(),
      created_at: serverTimestamp()
    });

    return res.status(201).json({
      success: true,
      message: 'Commission payment recorded successfully',
      paymentId: paymentRecord.id
    });
  } catch (error) {
    console.error('Error recording commission payment:', error);
    return res.status(500).json({ error: 'Failed to record commission payment' });
  }
}
