import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, productId, userId } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Promo code required' });
  }

  try {
    // Check promo code
    const q = query(collection(db, 'promo_codes'), where('code', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    const promoDoc = snapshot.docs[0];
    const promoData = promoDoc.data();

    // Check if promo code is active
    if (!promoData.is_active) {
      return res.status(400).json({ error: 'Promo code is inactive' });
    }

    // Check usage limit
    if (promoData.usage_limit && promoData.used_count >= promoData.usage_limit) {
      return res.status(400).json({ error: 'Promo code usage limit exceeded' });
    }

    // Check valid date range
    const today = new Date().toISOString().split('T')[0];
    if (promoData.valid_from && promoData.valid_from > today) {
      return res.status(400).json({ error: 'Promo code not yet valid' });
    }
    if (promoData.valid_until && promoData.valid_until < today) {
      return res.status(400).json({ error: 'Promo code has expired' });
    }

    // Check if user has already used first purchase discount
    if (userId && promoData.option_type === 'first_purchase_discount') {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.first_purchase_discount_used === true) {
          return res.status(400).json({ error: 'First purchase discount already used' });
        }
      }
    }

    // Check if the product is applicable
    if (promoData.settings?.applicable_products === 'selected') {
      const selectedProducts = promoData.settings?.selected_products || [];
      if (productId && !selectedProducts.includes(parseInt(productId))) {
        return res.status(400).json({ error: 'Promo code not applicable for this product' });
      }
    }

    res.status(200).json({
      code: promoData.code,
      option_type: promoData.option_type,
      settings: promoData.settings,
      is_active: promoData.is_active,
      used_count: promoData.used_count,
      usage_limit: promoData.usage_limit,
      valid_from: promoData.valid_from,
      valid_until: promoData.valid_until
    });
  } catch (error) {
    console.error('Promo check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
