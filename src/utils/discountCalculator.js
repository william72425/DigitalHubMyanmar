export function calculateStackedDiscount(product, userDiscounts) {
  let finalPrice = product.hubby_price;
  let appliedDiscounts = [];
  let discountAmount = 0;
  let stackWithSpecial = userDiscounts.stackWithSpecial || false;

  // 1. Special Price (if exists) - ALWAYS APPLY FIRST
  if (product.special_price && product.special_price > 0) {
    const specialDiscountAmount = product.hubby_price - product.special_price;
    discountAmount += specialDiscountAmount;
    appliedDiscounts.push({ type: 'special', amount: specialDiscountAmount, label: '✨ Special Discount' });
    finalPrice = product.special_price;
  }

  // 2. Promo Code Discount (first purchase or general)
  if (userDiscounts.promoDiscount && userDiscounts.promoDiscount > 0) {
    let promoAmount = 0;
    let priceToApply = finalPrice;
    
    if (stackWithSpecial) {
      // Stack with special price - apply on top of special price
      if (userDiscounts.promoType === 'percent') {
        promoAmount = Math.round(priceToApply * userDiscounts.promoDiscount / 100);
      } else {
        promoAmount = userDiscounts.promoDiscount;
      }
      discountAmount += promoAmount;
      appliedDiscounts.push({ type: 'promo', amount: promoAmount, label: `🎉 Promo Code (${userDiscounts.promoDiscount}% OFF)` });
      finalPrice = priceToApply - promoAmount;
    } else {
      // Don't stack - promo replaces special
      if (userDiscounts.promoType === 'percent') {
        promoAmount = Math.round(product.hubby_price * userDiscounts.promoDiscount / 100);
      } else {
        promoAmount = userDiscounts.promoDiscount;
      }
      // Remove previous special discount if any
      if (product.special_price && product.special_price > 0) {
        discountAmount = promoAmount;
        appliedDiscounts = [{ type: 'promo', amount: promoAmount, label: `🎉 Promo Code (${userDiscounts.promoDiscount}% OFF)` }];
      } else {
        discountAmount += promoAmount;
        appliedDiscounts.push({ type: 'promo', amount: promoAmount, label: `🎉 Promo Code (${userDiscounts.promoDiscount}% OFF)` });
      }
      finalPrice = product.hubby_price - promoAmount;
    }
  }

  // 3. Referral Discount (if applicable)
  if (userDiscounts.referralDiscount && userDiscounts.referralDiscount > 0) {
    let referralAmount = 0;
    if (userDiscounts.referralType === 'percent') {
      referralAmount = Math.round(finalPrice * userDiscounts.referralDiscount / 100);
    } else {
      referralAmount = userDiscounts.referralDiscount;
    }
    discountAmount += referralAmount;
    appliedDiscounts.push({ type: 'referral', amount: referralAmount, label: '👥 Referral Discount' });
    finalPrice = finalPrice - referralAmount;
  }

  // Ensure final price is not negative
  finalPrice = Math.max(finalPrice, 0);

  return {
    originalPrice: product.hubby_price,
    finalPrice,
    discountAmount,
    appliedDiscounts,
    hasDiscount: discountAmount > 0
  };
}
