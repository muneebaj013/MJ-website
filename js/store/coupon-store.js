// Coupon & Discount Store Module
(function() {
  window.MJCouponStore = {
    getAll() {
      return window.MJStorage.get('coupons') || [];
    },

    getByCode(code) {
      if (!code) return null;
      const clean = code.trim().toUpperCase();
      return this.getAll().find(c => c.code.toUpperCase() === clean) || null;
    },

    validateCoupon(code, subtotal) {
      const coupon = this.getByCode(code);
      if (!coupon) {
        return { valid: false, message: 'Invalid coupon code.' };
      }

      if (!coupon.isActive) {
        return { valid: false, message: 'This coupon code is currently inactive.' };
      }

      if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
        return { valid: false, message: 'This coupon code has expired.' };
      }

      if (coupon.minSpend && subtotal < coupon.minSpend) {
        return { valid: false, message: `Minimum order of $${coupon.minSpend.toFixed(2)} required for this coupon.` };
      }

      let discountAmount = 0;
      if (coupon.type === 'percentage') {
        discountAmount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else if (coupon.type === 'fixed') {
        discountAmount = Math.min(coupon.value, subtotal);
      }

      return {
        valid: true,
        coupon: coupon,
        discountAmount: discountAmount,
        message: `Coupon "${coupon.code}" applied! You saved $${discountAmount.toFixed(2)}`
      };
    },

    incrementUsage(code) {
      const coupons = this.getAll();
      const cp = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
      if (cp) {
        cp.usageCount = (cp.usageCount || 0) + 1;
        window.MJStorage.set('coupons', coupons);
      }
    },

    addCoupon(data) {
      const coupons = this.getAll();
      const newCoupon = {
        id: 'cp-' + Date.now(),
        code: data.code.trim().toUpperCase(),
        type: data.type || 'percentage',
        value: parseFloat(data.value) || 0,
        minSpend: parseFloat(data.minSpend) || 0,
        maxDiscount: parseFloat(data.maxDiscount) || 999,
        expiry: data.expiry || '2027-12-31',
        usageCount: 0,
        isActive: true,
        description: data.description || 'Special discount offer'
      };
      coupons.unshift(newCoupon);
      window.MJStorage.set('coupons', coupons);
      return newCoupon;
    },

    updateCoupon(id, data) {
      const coupons = this.getAll();
      const idx = coupons.findIndex(c => c.id === id);
      if (idx === -1) return null;
      coupons[idx] = { ...coupons[idx], ...data };
      window.MJStorage.set('coupons', coupons);
      return coupons[idx];
    },

    deleteCoupon(id) {
      let coupons = this.getAll();
      coupons = coupons.filter(c => c.id !== id);
      window.MJStorage.set('coupons', coupons);
    }
  };
})();
