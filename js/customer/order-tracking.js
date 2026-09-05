// Order Tracking Module
(function() {
  window.MJOrderTracking = {
    open() {
      const modal = document.getElementById('orderTrackingModal');
      if (modal) {
        modal.classList.add('active');
        this.renderForm();
      }
    },

    close() {
      const modal = document.getElementById('orderTrackingModal');
      if (modal) modal.classList.remove('active');
    },

    track(orderId) {
      this.open();
      if (orderId) {
        this.lookupOrder(orderId);
      }
    },

    renderForm() {
      const container = document.getElementById('orderTrackingContent');
      if (!container) return;

      container.innerHTML = `
        <div style="text-align:center; max-width:540px; margin: 0 auto 2rem;">
          <h3 style="font-family:var(--font-heading); font-size:1.8rem; margin-bottom:0.6rem;">Track Your Order</h3>
          <p style="color:var(--color-text-muted); font-size:0.95rem;">Enter your Order ID (e.g. <strong>MJ-1082</strong>) or Tracking Number to see real-time updates.</p>

          <form onsubmit="window.MJOrderTracking.handleSubmit(event)" style="display:flex; gap:0.6rem; margin-top:1.4rem;">
            <input type="text" id="orderTrackInput" class="form-control" placeholder="Order ID or Tracking #" required style="text-transform:uppercase;">
            <button type="submit" class="btn btn-primary">Track</button>
          </form>
        </div>

        <div id="trackingResultArea"></div>
      `;
    },

    handleSubmit(e) {
      e.preventDefault();
      const input = document.getElementById('orderTrackInput');
      if (input && input.value) {
        this.lookupOrder(input.value.trim());
      }
    },

    lookupOrder(query) {
      const resultArea = document.getElementById('trackingResultArea');
      if (!resultArea) return;

      const order = window.MJOrderStore.getById(query);

      if (!order) {
        resultArea.innerHTML = `
          <div style="background:var(--color-danger-bg); color:var(--color-danger); padding:1.2rem; border-radius:var(--radius-sm); text-align:center;">
            ❌ Order "<strong>${query}</strong>" not found. Please double-check your order number.
          </div>
        `;
        return;
      }

      const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
      const currentIndex = statuses.indexOf(order.orderStatus);
      const isCancelled = order.orderStatus === 'Cancelled';

      resultArea.innerHTML = `
        <div style="background:var(--bg-surface); border:1px solid var(--border-color-light); border-radius:var(--radius-md); padding:2rem; box-shadow:var(--shadow-sm);">
          
          <div class="d-flex align-center justify-between flex-wrap gap-2" style="border-bottom:1px solid var(--border-color-light); padding-bottom:1.2rem; margin-bottom:1.5rem;">
            <div>
              <span style="font-size:0.82rem; text-transform:uppercase; color:var(--color-text-muted);">Order Number</span>
              <h3 style="font-family:var(--font-heading); color:var(--color-heading); font-size:1.6rem;">#${order.id}</h3>
            </div>
            <div>
              <span class="table-status status-${order.orderStatus.toLowerCase()}" style="font-size:0.88rem; padding:0.4rem 1rem;">
                ● Status: ${order.orderStatus}
              </span>
            </div>
          </div>

          ${isCancelled ? `
            <div style="background:var(--color-danger-bg); color:var(--color-danger); padding:1rem; border-radius:var(--radius-sm); margin-bottom:1.5rem; text-align:center; font-weight:600;">
              This order was cancelled. Please contact support for any questions.
            </div>
          ` : `
            <!-- Visual Timeline -->
            <div class="tracking-timeline">
              ${statuses.map((st, idx) => {
                const isCompleted = idx < currentIndex;
                const isActive = idx === currentIndex;
                return `
                  <div class="tracking-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                    <div class="step-circle">${isCompleted ? '✓' : idx + 1}</div>
                    <span class="step-label">${st}</span>
                  </div>
                `;
              }).join('')}
            </div>
          `}

          <!-- Courier & Info Grid -->
          <div class="form-row" style="background:var(--bg-subtle); padding:1.2rem; border-radius:var(--radius-sm); margin:1.5rem 0; font-size:0.9rem;">
            <div>
              <p><strong>Carrier:</strong> ${order.carrier || 'MJ Luxury Express'}</p>
              <p><strong>Tracking Number:</strong> <code>${order.trackingNumber}</code></p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}</p>
            </div>
            <div>
              <p><strong>Recipient:</strong> ${order.customer.name}</p>
              <p><strong>Delivery Address:</strong> ${order.customer.address}, ${order.customer.city}</p>
              <p><strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
            </div>
          </div>

          <!-- Items Breakdown -->
          <h4 style="font-family:var(--font-heading); margin-bottom:0.8rem;">Ordered Items</h4>
          <div style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.5rem;">
            ${order.items.map(item => `
              <div class="d-flex align-center justify-between" style="font-size:0.9rem; padding:0.5rem 0; border-bottom:1px solid var(--border-color-light);">
                <div class="d-flex align-center gap-2">
                  <img src="${item.image}" alt="${item.name}" style="width:40px; height:48px; border-radius:4px; object-fit:cover;">
                  <div>
                    <div style="font-weight:600;">${item.name}</div>
                    <div style="font-size:0.78rem; color:var(--color-text-muted);">${item.size ? `Size: ${item.size}` : ''} ${item.color ? `• ${item.color}` : ''} (Qty: ${item.quantity})</div>
                  </div>
                </div>
                <strong>${window.MJCurrency ? window.MJCurrency.format(item.price * item.quantity) : `$${(item.price * item.quantity).toFixed(2)}`}</strong>
              </div>
            `).join('')}
          </div>

          <div class="d-flex justify-between align-center" style="font-size:1.1rem; font-weight:700; border-top:2px solid var(--border-color); padding-top:0.8rem;">
            <span>Grand Total</span>
            <span style="color:var(--color-primary-dark);">${window.MJCurrency ? window.MJCurrency.format(order.total) : `$${order.total.toFixed(2)}`}</span>
          </div>

        </div>
      `;
    }
  };
})();
