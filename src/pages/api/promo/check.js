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
    // 1. Check in promo_codes collection first
    let promoQuery = query(collection(db, 'promo_codes'), where('code', '==', code.toUpperCase()));
    let snapshot = await getDocs(promoQuery);
    let promoData = null;
    let isUserCode = false;

    if (!snapshot.empty) {
      promoData = snapshot.docs[0].data();
    } else {
      // 2. If not found, check in users collection (Referral code)
      const userQuery = query(collection(db, 'users'), where('promote_code', '==', code.toUpperCase()));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        // It's a valid user referral code
        isUserCode = true;
        promoData = {
          code: code.toUpperCase(),
          option_type: 'first_purchase_discount',
          settings: { discount_value: 15, discount_type: 'percent' }, // 15% for referral
          is_active: true,
          used_count: 0,
          usage_limit: null
        };
      }
    }

    if (!promoData) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    // If it's a user code, skip admin checks (like usage_limit, date range)
    if (!isUserCode) {
      if (!promoData.is_active) return res.status(400).json({ error: 'Promo code is inactive' });
      if (promoData.usage_limit && promoData.used_count >= promoData.usage_limit) return res.status(400).json({ error: 'Promo code usage limit exceeded' });
      
      const today = new Date().toISOString().split('T')[0];
      if (promoData.valid_from && promoData.valid_from > today) return res.status(400).json({ error: 'Promo code not yet valid' });
      if (promoData.valid_until && promoData.valid_until < today) return res.status(400).json({ error: 'Promo code has expired' });
    }

    // Check first purchase eligibility
    if (userId && promoData.option_type === 'first_purchase_discount') {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.first_purchase_discount_used === true) {
          return res.status(400).json({ error: 'First purchase discount already used' });
        }
      }
    }

    // Product eligibility
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
      valid_until: promoData.valid_until,
      is_user_code: isUserCode
    });
  } catch (error) {
    console.error('Promo check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
