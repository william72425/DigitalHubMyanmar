export function calculateStackedDiscount(product, userDiscounts) {
  let finalPrice = product.hubby_price;
  let appliedDiscounts = [];
  let discountAmount = 0;

  // 1. Special Price (if exists)
  if (product.special_price && product.special_price > 0) {
    discountAmount = product.hubby_price - product.special_price;
    appliedDiscounts.push({ type: 'special', amount: discountAmount, label: 'Special Price' });
    finalPrice = product.special_price;
  }

  // 2. Promo Code Discount (first purchase or general)
  if (userDiscounts.promoDiscount && userDiscounts.promoDiscount > 0) {
    let promoAmount = 0;
    if (userDiscounts.promoType === 'percent') {
      promoAmount = Math.round(finalPrice * userDiscounts.promoDiscount / 100);
    } else {
      promoAmount = userDiscounts.promoDiscount;
    }
    discountAmount += promoAmount;
    appliedDiscounts.push({ type: 'promo', amount: promoAmount, label: `Promo Code (${userDiscounts.promoDiscount}%)` });
    finalPrice = finalPrice - promoAmount;
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
    appliedDiscounts.push({ type: 'referral', amount: referralAmount, label: 'Referral Discount' });
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
