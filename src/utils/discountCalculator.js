export function calculateStackedDiscount(product, userDiscounts, userData) {
  // Start with hubby price
  let finalPrice = product.hubby_price;
  let appliedDiscounts = [];
  let discountAmount = 0;
  
  // Check if user has completed order (should NOT get first purchase discount)
  const hasCompletedOrder = userData?.hasCompletedOrder || false;
  
  // 1. Check for Admin Special Price
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

  // 2. First Purchase Discount - ONLY if user has NO completed orders
  const hasFirstPurchaseDiscount = userDiscounts.promoDiscount && userDiscounts.promoDiscount > 0;
  const isFirstPurchase = !hasCompletedOrder && !userData?.first_purchase_discount_used;
  
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
