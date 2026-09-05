// Multi-Step Checkout & Payment Module
(function() {
  window.MJCheckout = {
    selectedPaymentMethod: 'cod', // 'cod' or 'card'
    selectedShippingMethod: 'standard', // 'standard' or 'express'

    open() {
      const summary = window.MJCart.getSummary();
      if (summary.itemsCount === 0) {
        window.MJToast.info('Your shopping cart is empty. Please add items to checkout.');
        return;
      }

      window.MJCart.closeDrawer();
      this.render();

      const modal = document.getElementById('checkoutModal');
      if (modal) modal.classList.add('active');
    },

    close() {
      const modal = document.getElementById('checkoutModal');
      if (modal) modal.classList.remove('active');
    },

    render() {
      const modalBody = document.getElementById('checkoutModalBody');
      if (!modalBody) return;

      const summary = window.MJCart.getSummary();
      const items = window.MJCart.getItems();
      const user = window.MJAuth ? window.MJAuth.getCustomer() : null;

      modalBody.innerHTML = `
        <div class="checkout-grid" style="display:grid; grid-template-columns: 1.2fr 1fr; gap:2.5rem;">
          
          <!-- Checkout Form -->
          <div>
            <h3 style="font-family:var(--font-heading); margin-bottom:1.2rem;">Shipping & Delivery Details</h3>

            <form id="checkoutForm" onsubmit="window.MJCheckout.processOrder(event)">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Full Name *</label>
                  <input type="text" class="form-control" name="fullName" required value="${user ? user.name : ''}" placeholder="Eleanor Vance">
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address *</label>
                  <input type="email" class="form-control" name="email" required value="${user ? user.email : ''}" placeholder="eleanor@example.com">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Phone Number *</label>
                  <input type="tel" class="form-control" name="phone" required value="${user ? user.phone : ''}" placeholder="+1 (555) 000-0000">
                </div>
                <div class="form-group">
                  <label class="form-label">Country *</label>
                  <select class="form-control form-select" name="country">
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="UAE">United Arab Emirates</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Street Address *</label>
                <input type="text" class="form-control" name="address" required value="${user ? user.address : ''}" placeholder="Apt, Suite, Building, Street">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">City *</label>
                  <input type="text" class="form-control" name="city" required placeholder="San Francisco">
                </div>
                <div class="form-group">
                  <label class="form-label">Postal / ZIP Code *</label>
                  <input type="text" class="form-control" name="postalCode" required placeholder="94107">
                </div>
              </div>

              <hr style="border:0; border-top:1px solid var(--border-color-light); margin: 1.5rem 0;">

              <!-- Payment Method Selection -->
              <h3 style="font-family:var(--font-heading); margin-bottom:1rem;">Payment Method</h3>

              <div class="d-flex gap-2 flex-column" style="margin-bottom:1.5rem;">
                <label class="payment-method-card" style="border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:1rem; display:flex; align-items:center; gap:0.8rem; cursor:pointer; background: ${this.selectedPaymentMethod === 'cod' ? 'var(--bg-accent-light)' : 'var(--bg-surface)'}; border-color: ${this.selectedPaymentMethod === 'cod' ? 'var(--color-primary)' : 'var(--border-color)'};">
                  <input type="radio" name="paymentMethod" value="cod" ${this.selectedPaymentMethod === 'cod' ? 'checked' : ''} onchange="window.MJCheckout.setPaymentMethod('cod')">
                  <div>
                    <strong>💵 Cash on Delivery (COD)</strong>
                    <div style="font-size:0.82rem; color:var(--color-text-muted);">Pay securely in cash upon doorstep package delivery.</div>
                  </div>
                </label>

                <label class="payment-method-card" style="border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:1rem; display:flex; align-items:center; gap:0.8rem; cursor:pointer; background: ${this.selectedPaymentMethod === 'card' ? 'var(--bg-accent-light)' : 'var(--bg-surface)'}; border-color: ${this.selectedPaymentMethod === 'card' ? 'var(--color-primary)' : 'var(--border-color)'};">
                  <input type="radio" name="paymentMethod" value="card" ${this.selectedPaymentMethod === 'card' ? 'checked' : ''} onchange="window.MJCheckout.setPaymentMethod('card')">
                  <div>
                    <strong>💳 Secure Credit / Debit Card (Stripe Gateway Ready)</strong>
                    <div style="font-size:0.82rem; color:var(--color-text-muted);">Instant encrypted payment via Visa, Mastercard, AMEX.</div>
                  </div>
                </label>
              </div>

              <!-- Card Payment Fields (Shown when Card is selected) -->
              <div id="cardFieldsSection" style="display: ${this.selectedPaymentMethod === 'card' ? 'block' : 'none'}; background:var(--bg-subtle); padding:1.2rem; border-radius:var(--radius-sm); margin-bottom:1.5rem; border:1px solid var(--border-color);">
                <div class="form-group">
                  <label class="form-label" style="font-size:0.82rem;">Cardholder Name</label>
                  <input type="text" class="form-control" name="cardName" placeholder="Eleanor Vance">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.82rem;">Card Number</label>
                  <input type="text" class="form-control" name="cardNumber" maxlength="19" placeholder="4242 •••• •••• 4242" oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/(.{4})/g, '$1 ').trim();">
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" style="font-size:0.82rem;">Expiry Date (MM/YY)</label>
                    <input type="text" class="form-control" name="cardExpiry" maxlength="5" placeholder="12/28" oninput="if(this.value.length===2 && !this.value.includes('/')) this.value+='/';">
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-size:0.82rem;">CVV / CVC</label>
                    <input type="password" class="form-control" name="cardCvv" maxlength="4" placeholder="•••">
                  </div>
                </div>
                <div style="font-size:0.78rem; color:var(--color-success); display:flex; align-items:center; gap:0.4rem;">
                  🔒 256-Bit SSL End-to-End Encryption Secured
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-lg w-100" id="btnCompleteOrder">
                Place Order • ${window.MJCurrency ? window.MJCurrency.format(summary.total) : `$${summary.total.toFixed(2)}`}
              </button>
            </form>
          </div>

          <!-- Live Order Summary -->
          <div style="background:var(--bg-subtle); padding:1.8rem; border-radius:var(--radius-md); height:fit-content; border:1px solid var(--border-color-light);">
            <h4 style="font-family:var(--font-heading); margin-bottom:1rem; font-size:1.3rem;">Order Summary (${summary.itemsCount} items)</h4>

            <div style="max-height:220px; overflow-y:auto; margin-bottom:1.2rem; display:flex; flex-direction:column; gap:0.8rem;">
              ${items.map(item => `
                <div class="d-flex align-center justify-between gap-2" style="font-size:0.88rem;">
                  <div class="d-flex align-center gap-2">
                    <img src="${item.image}" alt="${item.name}" style="width:44px; height:54px; object-fit:cover; border-radius:4px;">
                    <div>
                      <div style="font-weight:600; font-family:var(--font-heading);">${item.name}</div>
                      <div style="color:var(--color-text-muted); font-size:0.78rem;">Qty: ${item.quantity} ${item.size ? `• ${item.size}` : ''}</div>
                    </div>
                  </div>
                  <strong>${window.MJCurrency ? window.MJCurrency.format(item.price * item.quantity) : `$${(item.price * item.quantity).toFixed(2)}`}</strong>
                </div>
              `).join('')}
            </div>

            <!-- Promo Code in Checkout -->
            <div class="d-flex gap-1" style="margin-bottom:1.2rem;">
              <input type="text" id="checkoutCouponInput" class="form-control" placeholder="Promo code (e.g. WELCOME10)" style="font-size:0.85rem; padding:0.5rem 0.8rem; text-transform:uppercase;">
              <button class="btn btn-secondary btn-sm" onclick="window.MJCheckout.applyCoupon()">Apply</button>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.92rem; border-top:1px solid var(--border-color-light); padding-top:1rem;">
              <div class="d-flex justify-between">
                <span style="color:var(--color-text-muted);">Subtotal</span>
                <span>${window.MJCurrency ? window.MJCurrency.format(summary.subtotal) : `$${summary.subtotal.toFixed(2)}`}</span>
              </div>

              ${summary.discount > 0 ? `
                <div class="d-flex justify-between" style="color:var(--color-primary-dark); font-weight:600;">
                  <span>Discount (${summary.couponInfo ? summary.couponInfo.code : ''})</span>
                  <span>-${window.MJCurrency ? window.MJCurrency.format(summary.discount) : `$${summary.discount.toFixed(2)}`}</span>
                </div>
              ` : ''}

              <div class="d-flex justify-between">
                <span style="color:var(--color-text-muted);">Estimated Shipping</span>
                <span>${summary.shipping === 0 ? '<strong style="color:var(--color-success);">FREE</strong>' : (window.MJCurrency ? window.MJCurrency.format(summary.shipping) : `$${summary.shipping.toFixed(2)}`)}</span>
              </div>

              <div class="d-flex justify-between" style="border-top:2px solid var(--border-color); padding-top:0.8rem; font-size:1.2rem; font-weight:700; font-family:var(--font-accent);">
                <span>Total</span>
                <span style="color:var(--color-heading);">${window.MJCurrency ? window.MJCurrency.format(summary.total) : `$${summary.total.toFixed(2)}`}</span>
              </div>
            </div>

            <div style="margin-top:1.4rem; font-size:0.8rem; color:var(--color-text-muted); text-align:center;">
              🛡 100% Satisfaction Guarantee • 14-Day Hassle Free Returns
            </div>
          </div>

        </div>
      `;
    },

    setPaymentMethod(method) {
      this.selectedPaymentMethod = method;
      const cardSection = document.getElementById('cardFieldsSection');
      if (cardSection) {
        cardSection.style.display = method === 'card' ? 'block' : 'none';
      }
      const paymentCards = document.querySelectorAll('.payment-method-card');
      paymentCards.forEach(card => {
        const input = card.querySelector('input[type="radio"]');
        if (input && input.value === method) {
          card.style.backgroundColor = 'var(--bg-accent-light)';
          card.style.borderColor = 'var(--color-primary)';
        } else {
          card.style.backgroundColor = 'var(--bg-surface)';
          card.style.borderColor = 'var(--border-color)';
        }
      });
    },

    applyCoupon() {
      const input = document.getElementById('checkoutCouponInput');
      if (input && input.value) {
        window.MJCart.applyCoupon(input.value);
        this.render();
      }
    },

    processOrder(e) {
      e.preventDefault();
      const form = e.target;
      const summary = window.MJCart.getSummary();
      const items = window.MJCart.getItems();

      if (items.length === 0) {
        window.MJToast.error('Your cart is empty.');
        return;
      }

      const orderPayload = {
        customer: {
          name: form.fullName.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone.value.trim(),
          address: form.address.value.trim(),
          city: form.city.value.trim(),
          country: form.country.value,
          postalCode: form.postalCode.value.trim()
        },
        items: items,
        subtotal: summary.subtotal,
        discount: summary.discount,
        shipping: summary.shipping,
        total: summary.total,
        couponCode: summary.couponInfo ? summary.couponInfo.code : null,
        paymentMethod: this.selectedPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card (Stripe Encrypted)'
      };

      // Create order in store
      const order = window.MJOrderStore.createOrder(orderPayload);

      // Increment coupon usage if used
      if (orderPayload.couponCode && window.MJCouponStore) {
        window.MJCouponStore.incrementUsage(orderPayload.couponCode);
      }

      // Clear cart
      window.MJCart.clearCart();
      sessionStorage.removeItem('mj_applied_coupon');

      // Trigger Confetti Celebration
      this.triggerConfetti();

      // Show Order Success Modal
      this.renderSuccess(order);
    },

    renderSuccess(order) {
      const modalBody = document.getElementById('checkoutModalBody');
      if (!modalBody) return;

      modalBody.innerHTML = `
        <div style="text-align:center; padding: 2rem 1rem;">
          <div style="width:72px; height:72px; background:var(--color-success-bg); color:var(--color-success); border-radius:var(--radius-pill); display:flex; align-items:center; justify-content:center; font-size:2.2rem; margin: 0 auto 1.2rem;">
            ✓
          </div>
          <h2 style="font-family:var(--font-heading); font-size:2.4rem; color:var(--color-heading); margin-bottom:0.5rem;">
            Thank You for Your Order!
          </h2>
          <p style="color:var(--color-text-muted); font-size:1.05rem; max-width:540px; margin: 0 auto 1.5rem;">
            Your order has been received and is being prepared with exceptional care. A confirmation email has been dispatched to <strong>${order.customer.email}</strong>.
          </p>

          <div style="background:var(--bg-subtle); border-radius:var(--radius-md); padding:1.5rem; max-width:480px; margin: 0 auto 2rem; border:1px solid var(--border-color-light); text-align:left;">
            <div class="d-flex justify-between" style="margin-bottom:0.6rem;">
              <span style="color:var(--color-text-muted);">Order Number:</span>
              <strong style="font-family:var(--font-accent); color:var(--color-primary-dark); font-size:1.1rem;">#${order.id}</strong>
            </div>
            <div class="d-flex justify-between" style="margin-bottom:0.6rem;">
              <span style="color:var(--color-text-muted);">Tracking Number:</span>
              <strong>${order.trackingNumber}</strong>
            </div>
            <div class="d-flex justify-between" style="margin-bottom:0.6rem;">
              <span style="color:var(--color-text-muted);">Payment Method:</span>
              <strong>${order.paymentMethod}</strong>
            </div>
            <div class="d-flex justify-between" style="margin-bottom:0.6rem;">
              <span style="color:var(--color-text-muted);">Total Amount:</span>
              <strong style="font-size:1.1rem; color:var(--color-heading);">${window.MJCurrency ? window.MJCurrency.format(order.total) : `$${order.total.toFixed(2)}`}</strong>
            </div>
          </div>

          <div class="d-flex justify-center gap-2 flex-wrap">
            <button class="btn btn-primary btn-lg" onclick="window.MJCheckout.close(); window.MJOrderTracking.track('${order.id}');">
              📍 Track Live Order
            </button>
            <button class="btn btn-outline btn-lg" onclick="window.print();">
              🖨 Print Invoice Receipt
            </button>
            <button class="btn btn-secondary btn-lg" onclick="window.MJCheckout.close();">
              Continue Shopping
            </button>
          </div>
        </div>
      `;
    },

    triggerConfetti() {
      // Gentle canvas confetti celebration
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '99999';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = [];
      const colors = ['#D99AA8', '#F3C6B8', '#E8D8CF', '#F8E1E7', '#5F8D76'];

      for (let i = 0; i < 75; i++) {
        particles.push({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          radius: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.7) * 14,
          gravity: 0.25,
          opacity: 1
        });
      }

      let frames = 0;
      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frames++;

        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.opacity -= 0.012;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fill();
        });

        if (frames < 90) {
          requestAnimationFrame(animate);
        } else {
          canvas.remove();
        }
      }
      animate();
    }
  };
})();
