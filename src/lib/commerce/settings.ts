/**
 * Store commerce settings. In a full build these would live in the DB and be
 * editable from the admin Settings page; here we centralise the defaults.
 */
export const storeSettings = {
  currency: "CAD",
  // Flat shipping fee applied below the free-shipping threshold.
  shippingFee: 15,
  freeShippingThreshold: 150,
  // Quebec combined sales tax (GST 5% + QST 9.975%).
  taxRate: 0.14975,
};

export function computeShipping(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= storeSettings.freeShippingThreshold
    ? 0
    : storeSettings.shippingFee;
}

export function computeTax(taxableAmount: number): number {
  return Math.round(taxableAmount * storeSettings.taxRate * 100) / 100;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export function computeTotals(
  subtotal: number,
  discount = 0
): CartTotals {
  const discounted = Math.max(0, subtotal - discount);
  const shipping = computeShipping(discounted);
  const tax = computeTax(discounted + shipping);
  const total = Math.round((discounted + shipping + tax) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    shipping,
    tax,
    total,
  };
}
