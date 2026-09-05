// Customer Shopping Cart Module
(function() {
  window.MJCart = {
    getItems() {
      return window.MJStorage.get('cart') || [];
    },

    addItem(product, variant = {}, quantity = 1) {
      const cart = this.getItems();
      const selectedSize = variant.size || (product.sizes && product.sizes[0]) || 'Standard';
      const selectedColor = variant.color || (product.colors && product.colors[0].name) || 'Default';
      const itemPrice = product.salePrice || product.price;

      // Check if item with same ID and options already in cart
      const existing = cart.find(item => 
        item.productId === product.id && 
        item.size === selectedSize && 
        item.color === selectedColor
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({
          id: 'cart-item-' + Date.now() + '-' + Math.floor(Math.random()*100),
          productId: product.id,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: itemPrice,
          regularPrice: product.price,
          image: (product.images && product.images[0]) || 'assets/images/fashion-dress.jpg',
          size: selectedSize,
          color: selectedColor,
          quantity: quantity
        });
      }

      window.MJStorage.set('cart', cart);
      this.updateUI();
      this.openDrawer();
      window.MJToast.success(`Added ${product.name} to cart!`);
    },

    updateQuantity(itemId, newQty) {
      let cart = this.getItems();
      if (newQty <= 0) {
        cart = cart.filter(item => item.id !== itemId);
      } else {
        const item = cart.find(item => item.id === itemId);
        if (item) item.quantity = newQty;
      }
      window.MJStorage.set('cart', cart);
      this.updateUI();
    },

    removeItem(itemId) {
      let cart = this.getItems();
      cart = cart.filter(item => item.id !== itemId);
      window.MJStorage.set('cart', cart);
      this.updateUI();
    },

    clearCart() {
      window.MJStorage.set('cart', []);
      this.updateUI();
    },

    getSummary() {
      const items = this.getItems();
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const settings = window.MJSettingsStore ? window.MJSettingsStore.getSettings() : { freeShippingThreshold: 75, standardShippingFee: 9.99 };
      
      const freeThreshold = settings.freeShippingThreshold || 75.00;
      const isFreeShipping = subtotal >= freeThreshold;
      const shipping = subtotal === 0 ? 0 : (isFreeShipping ? 0 : (settings.standardShippingFee || 9.99));
      
      // Applied coupon in session
      const appliedCouponCode = sessionStorage.getItem('mj_applied_coupon');
      let discount = 0;
      let couponInfo = null;

      if (appliedCouponCode && window.MJCouponStore) {
        const validation = window.MJCouponStore.validateCoupon(appliedCouponCode, subtotal);
        if (validation.valid) {
          discount = validation.discountAmount;
          couponInfo = validation.coupon;
        } else {
          sessionStorage.removeItem('mj_applied_coupon');
        }
      }

      const total = Math.max(0, subtotal - discount + shipping);

      return {
        itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal,
        discount: discount,
        shipping: shipping,
        freeThreshold: freeThreshold,
        isFreeShipping: isFreeShipping,
        shippingRemaining: Math.max(0, freeThreshold - subtotal),
        couponInfo: couponInfo,
        total: total
      };
    },

    applyCoupon(code) {
      const summary = this.getSummary();
      const validation = window.MJCouponStore.validateCoupon(code, summary.subtotal);
      if (validation.valid) {
        sessionStorage.setItem('mj_applied_coupon', code.toUpperCase().trim());
        this.updateUI();
        window.MJToast.success(validation.message);
        return true;
      } else {
        window.MJToast.error(validation.message);
        return false;
      }
    },

    removeCoupon() {
      sessionStorage.removeItem('mj_applied_coupon');
      this.updateUI();
      window.MJToast.info('Coupon removed.');
    },

    openDrawer() {
      const drawer = document.getElementById('cartDrawer');
      if (drawer) drawer.classList.add('active');
    },

    closeDrawer() {
      const drawer = document.getElementById('cartDrawer');
      if (drawer) drawer.classList.remove('active');
    },

    updateUI() {
      const summary = this.getSummary();
      const items = this.getItems();

      // Update badge counters
      document.querySelectorAll('.cart-count-badge').forEach(el => {
        el.textContent = summary.itemsCount;
        el.style.display = summary.itemsCount > 0 ? 'flex' : 'none';
      });

      // Update drawer body
      const drawerBody = document.getElementById('cartDrawerItems');
      const drawerEmpty = document.getElementById('cartDrawerEmpty');
      const drawerFooter = document.getElementById('cartDrawerFooter');

      if (drawerBody) {
        if (items.length === 0) {
          drawerBody.innerHTML = '';
          if (drawerEmpty) drawerEmpty.style.display = 'block';
          if (drawerFooter) drawerFooter.style.display = 'none';
        } else {
          if (drawerEmpty) drawerEmpty.style.display = 'none';
          if (drawerFooter) drawerFooter.style.display = 'block';

          drawerBody.innerHTML = items.map(item => `
            <div class="cart-item">
              <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
              <div class="cart-item-info">
                <div>
                  <h4 class="cart-item-title">${item.name}</h4>
                  <div class="cart-item-meta">${item.size ? `Size: ${item.size}` : ''} ${item.color ? `• ${item.color}` : ''}</div>
                </div>
                <div class="d-flex align-center justify-between" style="margin-top: 8px;">
                  <div class="quantity-control">
                    <button class="quantity-btn" onclick="window.MJCart.updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
                    <span class="quantity-input">${item.quantity}</span>
                    <button class="quantity-btn" onclick="window.MJCart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                  </div>
                  <div class="cart-item-price">${window.MJCurrency ? window.MJCurrency.format(item.price * item.quantity) : `$${(item.price * item.quantity).toFixed(2)}`}</div>
                </div>
              </div>
              <button class="modal-close-btn" style="align-self: flex-start;" onclick="window.MJCart.removeItem('${item.id}')" title="Remove item">
                ✕
              </button>
            </div>
          `).join('');
        }
      }

      // Update Free Shipping Progress Bar
      const freeShippingEl = document.getElementById('cartFreeShippingMeter');
      if (freeShippingEl) {
        const percent = Math.min(100, (summary.subtotal / summary.freeThreshold) * 100);
        const formattedRemaining = window.MJCurrency ? window.MJCurrency.format(summary.shippingRemaining) : `$${summary.shippingRemaining.toFixed(2)}`;
        freeShippingEl.innerHTML = `
          <div class="free-shipping-progress">
            <div class="d-flex align-center justify-between" style="font-size: 0.85rem; font-weight: 500;">
              <span>${summary.isFreeShipping ? '🎉 You unlocked FREE Shipping!' : `Add <strong>${formattedRemaining}</strong> more for <strong>FREE Shipping</strong>`}</span>
              <span>${percent.toFixed(0)}%</span>
            </div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }

      // Update Totals
      const subtotalEl = document.getElementById('cartSubtotal');
      const discountRowEl = document.getElementById('cartDiscountRow');
      const discountValEl = document.getElementById('cartDiscountVal');
      const shippingEl = document.getElementById('cartShipping');
      const totalEl = document.getElementById('cartTotal');

      if (subtotalEl) subtotalEl.textContent = window.MJCurrency ? window.MJCurrency.format(summary.subtotal) : `$${summary.subtotal.toFixed(2)}`;
      if (shippingEl) shippingEl.textContent = summary.shipping === 0 ? 'FREE' : (window.MJCurrency ? window.MJCurrency.format(summary.shipping) : `$${summary.shipping.toFixed(2)}`);
      if (totalEl) totalEl.textContent = window.MJCurrency ? window.MJCurrency.format(summary.total) : `$${summary.total.toFixed(2)}`;

      if (discountRowEl && discountValEl) {
        if (summary.discount > 0) {
          discountRowEl.style.display = 'flex';
          const formattedDiscount = window.MJCurrency ? window.MJCurrency.format(summary.discount) : `$${summary.discount.toFixed(2)}`;
          discountValEl.textContent = `-${formattedDiscount} (${summary.couponInfo ? summary.couponInfo.code : ''})`;
        } else {
          discountRowEl.style.display = 'none';
        }
      }
    }
  };

  // Listen to external changes
  window.MJStorage.on('change:cart', () => window.MJCart.updateUI());
})();
