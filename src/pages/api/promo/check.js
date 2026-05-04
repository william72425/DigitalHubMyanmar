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
        isUserCode = true;
        promoData = {
          code: code.toUpperCase(),
          option_type: 'first_purchase_discount',
          settings: { discount_value: 15, discount_type: 'percent' },
          is_active: true,
          used_count: 0,
          usage_limit: null
        };
      }
    }

    if (!promoData) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    // ⭐ CRITICAL FIX: For user referral codes, skip ALL date checks
    if (!isUserCode) {
      // Check if promo code is active
      if (promoData.is_active === false) {
        return res.status(400).json({ error: 'Promo code is inactive' });
      }
      
      // Check usage limit
      if (promoData.usage_limit && promoData.used_count >= promoData.usage_limit) {
        return res.status(400).json({ error: 'Promo code usage limit exceeded' });
      }
      
      // ⭐ FIXED: Date validation with proper handling of empty/undefined
      const today = new Date().toISOString().split('T')[0];
      
      // Check valid_from (if exists)
      if (promoData.valid_from && promoData.valid_from.trim() !== '') {
        if (promoData.valid_from > today) {
          return res.status(400).json({ error: 'Promo code not yet valid' });
        }
      }
      
      // Check valid_until (if exists and not empty)
      if (promoData.valid_until && promoData.valid_until.trim() !== '') {
        if (promoData.valid_until < today) {
          return res.status(400).json({ 
            error: 'Promo code has expired', 
            expired: true,
            valid_until: promoData.valid_until,
            today: today
          });
        }
      }
      // If valid_until is empty, null, or undefined → NEVER EXPIRE
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

    // Return success with promo data
    res.status(200).json({
      code: promoData.code,
      option_type: promoData.option_type,
      settings: promoData.settings,
      is_active: promoData.is_active,
      used_count: promoData.used_count,
      usage_limit: promoData.usage_limit,
      valid_from: promoData.valid_from || null,
      valid_until: promoData.valid_until || null,
      is_user_code: isUserCode
    });
  } catch (error) {
    console.error('Promo check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
    }
