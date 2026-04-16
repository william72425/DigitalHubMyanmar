/**
 * Calculate stacked discount for a product
 * @param {Object} product - { hubby_price, special_price }
 * @param {Object} userDiscounts - { promoDiscount, promoType, maxDiscountAmount }
 * @param {Object} userData - { hasActiveOrder, first_purchase_discount_used }
 */
export function calculateStackedDiscount(product, userDiscounts, userData) {
  // Start with hubby price
  let currentPrice = product.hubby_price;
  let appliedDiscounts = [];
  
  // 1. Admin Special Price (if exists)
  const hasSpecialPrice = product.special_price && product.special_price > 0;
  if (hasSpecialPrice) {
    const specialAmount = product.hubby_price - product.special_price;
    appliedDiscounts.push({
      type: 'special',
      label: '✨ Admin Special Discount',
      amount: specialAmount,
      value: product.special_price
    });
    currentPrice = product.special_price;
  }

  // 2. First Purchase Discount (if eligible)
  const isEligible = !userData?.hasActiveOrder && !userData?.first_purchase_discount_used;
  const hasPromo = userDiscounts?.promoDiscount && userDiscounts.promoDiscount > 0;
  
  let promoAmount = 0;
  if (hasPromo && isEligible) {
    if (userDiscounts.promoType === 'percent') {
      promoAmount = Math.round(currentPrice * userDiscounts.promoDiscount / 100);
    } else {
      promoAmount = userDiscounts.promoDiscount;
    }
    // Apply max cap
    if (userDiscounts.maxDiscountAmount > 0 && promoAmount > userDiscounts.maxDiscountAmount) {
      promoAmount = userDiscounts.maxDiscountAmount;
    }
    if (promoAmount > currentPrice) promoAmount = currentPrice;
    
    appliedDiscounts.push({
      type: 'promo',
      label: `🎉 First Purchase (${userDiscounts.promoDiscount}% OFF)`,
      amount: promoAmount
    });
    currentPrice = currentPrice - promoAmount;
  }

  // Calculate total discount
  const totalDiscount = product.hubby_price - Math.max(currentPrice, 0);
  const finalPrice = Math.max(currentPrice, 0);

  return {
    originalPrice: product.hubby_price,
    finalPrice,
    totalDiscount,
    appliedDiscounts,
    hasDiscount: totalDiscount > 0,
    isFirstPurchaseEligible: isEligible && hasPromo,
    promoDiscountPercent: userDiscounts?.promoDiscount || 0
  };
}
