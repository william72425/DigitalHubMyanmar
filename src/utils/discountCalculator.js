export function calculateStackedDiscount(product, userDiscounts, userData) {
  // Start with hubby price
  let finalPrice = product.hubby_price;
  let appliedDiscounts = [];
  let discountAmount = 0;
  
  // 1. Check for Admin Special Price (this overrides hubby price)
  const hasSpecialPrice = product.special_price && product.special_price > 0;
  if (hasSpecialPrice) {
    const specialDiscountAmount = product.hubby_price - product.special_price;
    if (specialDiscountAmount > 0) {
      discountAmount += specialDiscountAmount;
      appliedDiscounts.push({ 
        type: 'special', 
        amount: specialDiscountAmount, 
        label: '✨ Admin Special Price' 
      });
      finalPrice = product.special_price;
    }
  }

  // 2. Check if user is eligible for first purchase discount
  const hasFirstPurchaseDiscount = userDiscounts.promoDiscount && userDiscounts.promoDiscount > 0;
  const isFirstPurchase = !userData?.hasActiveOrder && !userData?.first_purchase_discount_used;
  
  if (hasFirstPurchaseDiscount && isFirstPurchase && finalPrice > 0) {
    let promoAmount = 0;
    if (userDiscounts.promoType === 'percent') {
      promoAmount = Math.round(finalPrice * userDiscounts.promoDiscount / 100);
    } else {
      promoAmount = userDiscounts.promoDiscount;
    }
    
    // Apply max discount cap if set
    if (userDiscounts.maxDiscountAmount > 0 && promoAmount > userDiscounts.maxDiscountAmount) {
      promoAmount = userDiscounts.maxDiscountAmount;
    }
    
    // Make sure promo amount doesn't exceed final price
    if (promoAmount > finalPrice) {
      promoAmount = finalPrice;
    }
    
    if (promoAmount > 0) {
      discountAmount += promoAmount;
      appliedDiscounts.push({ 
        type: 'promo', 
        amount: promoAmount, 
        label: `🎉 First Purchase (${userDiscounts.promoDiscount}% OFF)` 
      });
      finalPrice = finalPrice - promoAmount;
    }
  }

  // Ensure final price is not negative
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
