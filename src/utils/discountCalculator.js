export function calculateStackedDiscount(product, userDiscounts, userData) {
  let finalPrice = product.hubby_price;
  let appliedDiscounts = [];
  let discountAmount = 0;
  
  // Get base price (start from hubby price)
  let basePrice = product.hubby_price;
  
  // 1. Admin Special Price (if exists)
  const hasSpecialPrice = product.special_price && product.special_price > 0;
  let specialDiscountAmount = 0;
  if (hasSpecialPrice) {
    specialDiscountAmount = product.hubby_price - product.special_price;
    discountAmount += specialDiscountAmount;
    appliedDiscounts.push({ 
      type: 'special', 
      amount: specialDiscountAmount, 
      label: '✨ Admin Special Price' 
    });
    basePrice = product.special_price;
    finalPrice = product.special_price;
  }

  // 2. First Purchase Discount from Promo Code
  const hasFirstPurchaseDiscount = userDiscounts.promoDiscount && userDiscounts.promoDiscount > 0;
  const isFirstPurchase = !userData?.hasActiveOrder && !userData?.first_purchase_discount_used;
  
  if (hasFirstPurchaseDiscount && isFirstPurchase) {
    let promoAmount = 0;
    if (userDiscounts.promoType === 'percent') {
      promoAmount = Math.round(basePrice * userDiscounts.promoDiscount / 100);
    } else {
      promoAmount = userDiscounts.promoDiscount;
    }
    
    // Apply max discount cap if set
    if (userDiscounts.maxDiscountAmount > 0 && promoAmount > userDiscounts.maxDiscountAmount) {
      promoAmount = userDiscounts.maxDiscountAmount;
    }
    
    discountAmount += promoAmount;
    appliedDiscounts.push({ 
      type: 'promo', 
      amount: promoAmount, 
      label: `🎉 First Purchase (${userDiscounts.promoDiscount}% OFF)` 
    });
    finalPrice = basePrice - promoAmount;
  }

  // 3. Referral First Purchase Discount
  const hasReferralDiscount = userData?.referral_first_purchase_discount > 0;
  if (hasReferralDiscount && isFirstPurchase) {
    let referralAmount = Math.round(finalPrice * userData.referral_first_purchase_discount / 100);
    discountAmount += referralAmount;
    appliedDiscounts.push({ 
      type: 'referral', 
      amount: referralAmount, 
      label: `👥 Referral Discount (${userData.referral_first_purchase_discount}% OFF)` 
    });
    finalPrice = finalPrice - referralAmount;
  }

  finalPrice = Math.max(finalPrice, 0);

  return {
    originalPrice: product.hubby_price,
    finalPrice,
    discountAmount,
    appliedDiscounts,
    hasDiscount: discountAmount > 0,
    isFirstPurchaseEligible: isFirstPurchase && hasFirstPurchaseDiscount
  };
}
