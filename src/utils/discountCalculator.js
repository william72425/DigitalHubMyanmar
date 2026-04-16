/**
 * Calculate stacked discount for a product
 * @param {Object} product - Product object with hubby_price, special_price
 * @param {Object} userDiscounts - { promoDiscount, promoType, stackWithSpecial, maxDiscountAmount }
 * @param {Object} userData - { hasActiveOrder, first_purchase_discount_used }
 * @returns {Object} - { originalPrice, finalPrice, discountAmount, appliedDiscounts, hasDiscount, isFirstPurchaseEligible }
 */
export function calculateStackedDiscount(product, userDiscounts, userData) {
  // Start with hubby price as base
  let finalPrice = product.hubby_price;
  let appliedDiscounts = [];
  let discountAmount = 0;
  let basePrice = product.hubby_price;
  
  // 1. Check for Admin Special Price
  const hasSpecialPrice = product.special_price && product.special_price > 0;
  let specialDiscountAmount = 0;
  
  if (hasSpecialPrice) {
    specialDiscountAmount = product.hubby_price - product.special_price;
    if (specialDiscountAmount > 0) {
      discountAmount += specialDiscountAmount;
      appliedDiscounts.push({ 
        type: 'special', 
        amount: specialDiscountAmount, 
        label: '✨ Admin Special Price' 
      });
      basePrice = product.special_price;
      finalPrice = product.special_price;
    }
  }

  // 2. Check if user is eligible for first purchase discount
  const hasFirstPurchaseDiscount = userDiscounts.promoDiscount && userDiscounts.promoDiscount > 0;
  const isFirstPurchase = !userData?.hasActiveOrder && !userData?.first_purchase_discount_used;
  
  // 3. Apply first purchase discount (stacking if enabled)
  if (hasFirstPurchaseDiscount && isFirstPurchase) {
    let promoAmount = 0;
    let priceToApply = basePrice;
    
    if (userDiscounts.promoType === 'percent') {
      promoAmount = Math.round(priceToApply * userDiscounts.promoDiscount / 100);
    } else {
      promoAmount = userDiscounts.promoDiscount;
    }
    
    // Apply max discount cap if set
    if (userDiscounts.maxDiscountAmount > 0 && promoAmount > userDiscounts.maxDiscountAmount) {
      promoAmount = userDiscounts.maxDiscountAmount;
    }
    
    // Make sure promo amount doesn't exceed price
    if (promoAmount > priceToApply) {
      promoAmount = priceToApply;
    }
    
    if (promoAmount > 0) {
      discountAmount += promoAmount;
      appliedDiscounts.push({ 
        type: 'promo', 
        amount: promoAmount, 
        label: `🎉 First Purchase (${userDiscounts.promoDiscount}% OFF)` 
      });
      finalPrice = priceToApply - promoAmount;
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
