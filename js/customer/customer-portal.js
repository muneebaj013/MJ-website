// Customer Account & Profile Portal Module
(function() {
  window.MJPortal = {
    activeTab: 'orders', // 'orders', 'wishlist', 'profile'

    open(tab = null) {
      if (tab) this.activeTab = tab;
      const modal = document.getElementById('customerAccountModal');
      if (modal) {
        modal.classList.add('active');
        this.render();
      }
    },

    close() {
      const modal = document.getElementById('customerAccountModal');
      if (modal) modal.classList.remove('active');
    },

    setTab(tabName) {
      this.activeTab = tabName;
      this.render();
    },

    updateHeaderAccountStatus() {
      const user = window.MJAuth ? window.MJAuth.getCustomer() : null;
      const label = document.getElementById('headerAccountLabel');
      const btn = document.getElementById('headerAccountBtn');
      if (label) {
        label.textContent = user ? user.name.split(' ')[0] : 'Sign In';
      }
      if (btn) {
        btn.title = user ? `Account: ${user.name}` : 'Sign In / Register';
      }
    },

    render() {
      const container = document.getElementById('customerAccountContent');
      if (!container) return;

      const user = window.MJAuth ? window.MJAuth.getCustomer() : null;
      this.updateHeaderAccountStatus();

      if (!user) {
        // Show Clean Sign In / Register Forms
        container.innerHTML = `
          <div style="max-width:440px; margin: 0 auto; padding: 0.5rem 0;">
            <div style="text-align:center; margin-bottom:1.6rem;">
              <h3 style="font-family:var(--font-heading); font-size:2.2rem; margin-bottom:0.3rem;">Welcome to MJ</h3>
              <p style="color:var(--color-text-muted); font-size:0.92rem;">Sign in to view your order history, track deliveries, and manage your account.</p>
            </div>

            <!-- Tab Switcher -->
            <div class="d-flex gap-2" style="margin-bottom:1.5rem; background:var(--bg-subtle); padding:4px; border-radius:var(--radius-pill); border:1px solid var(--border-color-light);">
              <button type="button" class="btn btn-sm w-100" id="portalTabBtnLogin" onclick="window.MJPortal.toggleAuthView('login')" style="background:var(--color-primary); color:#fff; border-radius:var(--radius-pill); font-weight:600;">
                Sign In
              </button>
              <button type="button" class="btn btn-sm w-100" id="portalTabBtnRegister" onclick="window.MJPortal.toggleAuthView('register')" style="background:transparent; color:var(--color-heading); border-radius:var(--radius-pill); font-weight:600;">
                Create Account
              </button>
            </div>

            <!-- 1. Sign In Form -->
            <div id="portalFormLoginWrap">
              <form onsubmit="window.MJPortal.handleLogin(event)">
                <div class="form-group">
                  <label class="form-label">Email Address *</label>
                  <input type="email" name="email" id="portalLoginEmail" class="form-control" required placeholder="Enter your registered email">
                </div>
                <div class="form-group">
                  <label class="form-label">Password *</label>
                  <input type="password" name="password" id="portalLoginPassword" class="form-control" required placeholder="Enter password">
                </div>
                <button type="submit" class="btn btn-primary btn-lg w-100" style="margin-top:0.8rem;">
                  Sign In to Account →
                </button>
              </form>
              <div style="margin-top:1.2rem; text-align:center; font-size:0.85rem; color:var(--color-text-muted);">
                Don't have an account? <a href="javascript:void(0)" onclick="window.MJPortal.toggleAuthView('register')" style="color:var(--color-primary-dark); font-weight:600; text-decoration:underline;">Create one now</a>
              </div>
            </div>

            <!-- 2. Create Account Form -->
            <div id="portalFormRegisterWrap" style="display:none;">
              <form onsubmit="window.MJPortal.handleRegister(event)">
                <div class="form-group">
                  <label class="form-label">Full Name *</label>
                  <input type="text" name="name" class="form-control" required placeholder="e.g. Eleanor Vance">
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address *</label>
                  <input type="email" name="email" class="form-control" required placeholder="name@example.com">
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number (Optional)</label>
                  <input type="tel" name="phone" class="form-control" placeholder="+92 (300) 000-0000">
                </div>
                <div class="form-group">
                  <label class="form-label">Delivery Address (Optional)</label>
                  <input type="text" name="address" class="form-control" placeholder="House #, Street, City">
                </div>
                <div class="form-group">
                  <label class="form-label">Create Password *</label>
                  <input type="password" name="password" class="form-control" required placeholder="At least 6 characters">
                </div>
                <button type="submit" class="btn btn-primary btn-lg w-100" style="margin-top:0.8rem;">
                  Register & Create Account →
                </button>
              </form>
              <div style="margin-top:1.2rem; text-align:center; font-size:0.85rem; color:var(--color-text-muted);">
                Already have an account? <a href="javascript:void(0)" onclick="window.MJPortal.toggleAuthView('login')" style="color:var(--color-primary-dark); font-weight:600; text-decoration:underline;">Sign in here</a>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Logged-in Customer View
      const orders = window.MJOrderStore ? window.MJOrderStore.getByCustomerEmail(user.email) : [];
      const totalSpent = orders.reduce((sum, o) => sum + (o.orderStatus !== 'Cancelled' ? o.total : 0), 0);
      const wishlistIds = window.MJWishlist ? window.MJWishlist.getItems() : [];
      const wishlistProducts = wishlistIds.map(id => window.MJProductStore ? window.MJProductStore.getById(id) : null).filter(Boolean);

      container.innerHTML = `
        <div>
          <!-- Header Profile Summary Bar -->
          <div class="d-flex align-center justify-between flex-wrap gap-2" style="background:var(--bg-subtle); padding:1.4rem; border-radius:var(--radius-md); margin-bottom:1.8rem; border:1px solid var(--border-color-light);">
            <div class="d-flex align-center gap-2">
              <div class="author-avatar" style="width:54px; height:54px; font-size:1.4rem; background:var(--color-primary); color:#ffffff; font-weight:700;">
                ${(user.name || 'User').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style="font-family:var(--font-heading); font-size:1.6rem; margin:0; color:var(--color-heading);">${user.name}</h3>
                <div style="color:var(--color-text-muted); font-size:0.85rem;">
                  ${user.email} • <strong>${orders.length}</strong> Order(s) • Total Spent: <strong>${window.MJCurrency ? window.MJCurrency.format(totalSpent) : `$${totalSpent.toFixed(2)}`}</strong>
                </div>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="window.MJPortal.handleLogout()" style="color:var(--color-danger); border-color:var(--border-color-light);">
              🚪 Sign Out
            </button>
          </div>

          <!-- Navigation Tabs -->
          <div class="d-flex gap-2" style="border-bottom:2px solid var(--border-color-light); margin-bottom:1.6rem; overflow-x:auto;">
            <button type="button" class="nav-link ${this.activeTab === 'orders' ? 'active' : ''}" onclick="window.MJPortal.setTab('orders')" style="font-size:1rem; padding:0.6rem 0.8rem;">
              📦 Order History (${orders.length})
            </button>
            <button type="button" class="nav-link ${this.activeTab === 'wishlist' ? 'active' : ''}" onclick="window.MJPortal.setTab('wishlist')" style="font-size:1rem; padding:0.6rem 0.8rem;">
              ♥ Saved Wishlist (${wishlistProducts.length})
            </button>
            <button type="button" class="nav-link ${this.activeTab === 'profile' ? 'active' : ''}" onclick="window.MJPortal.setTab('profile')" style="font-size:1rem; padding:0.6rem 0.8rem;">
              👤 Personal Info & Address
            </button>
          </div>

          <!-- Tab Content Area -->
          <div>
            
            <!-- 1. ORDER HISTORY TAB -->
            ${this.activeTab === 'orders' ? `
              <div>
                ${orders.length === 0 ? `
                  <div style="text-align:center; padding:3rem 1rem; background:var(--bg-surface); border-radius:var(--radius-md); border:1px dashed var(--border-color);">
                    <span style="font-size:3rem; display:block; margin-bottom:0.8rem;">🛍️</span>
                    <h4 style="font-family:var(--font-heading); font-size:1.5rem; margin-bottom:0.4rem;">No Orders Placed Yet</h4>
                    <p style="color:var(--color-text-muted); font-size:0.92rem; max-width:380px; margin:0 auto 1.4rem;">You have not placed any orders yet. Explore our luxury collections and treat yourself!</p>
                    <button class="btn btn-primary" onclick="window.MJPortal.close(); document.getElementById('shopSection').scrollIntoView({behavior:'smooth'});">
                      Start Shopping Now →
                    </button>
                  </div>
                ` : `
                  <div style="display:flex; flex-direction:column; gap:1.4rem;">
                    ${orders.map(o => {
                      const orderDate = new Date(o.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      const statusClass = (o.orderStatus || 'pending').toLowerCase();
                      
                      return `
                        <div class="data-card" style="border:1px solid var(--border-color-light); border-radius:var(--radius-sm); overflow:hidden;">
                          <!-- Order Card Header -->
                          <div style="background:var(--bg-subtle); padding:1rem 1.4rem; border-bottom:1px solid var(--border-color-light); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.8rem;">
                            <div>
                              <div style="font-size:1.1rem; font-weight:700; font-family:var(--font-accent); color:var(--color-heading);">
                                Order #${o.id}
                              </div>
                              <div style="font-size:0.8rem; color:var(--color-text-muted);">
                                Placed on ${orderDate} • Tracking: <code>${o.trackingNumber || o.id}</code>
                              </div>
                            </div>
                            <div class="d-flex align-center gap-2">
                              <span class="table-status status-${statusClass}">
                                ● ${o.orderStatus || 'Pending'}
                              </span>
                              <span class="badge" style="background:#fff; border:1px solid var(--border-color); font-size:0.75rem;">
                                ${o.paymentMethod || 'Cash on Delivery'} (${o.paymentStatus || 'Pending'})
                              </span>
                            </div>
                          </div>

                          <!-- Order Items List -->
                          <div style="padding:1.4rem;">
                            <div style="display:flex; flex-direction:column; gap:0.8rem; margin-bottom:1.2rem;">
                              ${(o.items || []).map(it => `
                                <div class="d-flex align-center justify-between gap-2" style="font-size:0.92rem; border-bottom:1px dashed var(--border-color-light); padding-bottom:0.6rem;">
                                  <div class="d-flex align-center gap-2">
                                    <img src="${it.image || 'assets/images/fashion-dress.jpg'}" alt="${it.name}" style="width:48px; height:58px; object-fit:cover; border-radius:4px; border:1px solid var(--border-color-light);" onerror="this.src='assets/images/fashion-dress.jpg'">
                                    <div>
                                      <strong style="font-family:var(--font-heading); font-size:1rem;">${it.name}</strong>
                                      <div style="font-size:0.78rem; color:var(--color-text-muted);">
                                        ${it.size ? `Size: <strong>${it.size}</strong>` : ''} ${it.color ? `• Color: <strong>${it.color}</strong>` : ''} • Qty: <strong>${it.quantity}</strong>
                                      </div>
                                    </div>
                                  </div>
                                  <div style="text-align:right;">
                                    <div style="font-weight:700; color:var(--color-primary-dark);">${window.MJCurrency ? window.MJCurrency.format(it.price * it.quantity) : `$${(it.price * it.quantity).toFixed(2)}`}</div>
                                    <small style="color:var(--color-text-muted);">${window.MJCurrency ? window.MJCurrency.format(it.price) : `$${it.price.toFixed(2)}`} each</small>
                                  </div>
                                </div>
                              `).join('')}
                            </div>

                            <!-- Financial Summary & Delivery Info -->
                            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:1.2rem; background:var(--bg-subtle); padding:1rem; border-radius:var(--radius-xs); font-size:0.88rem;">
                              <div>
                                <div style="font-weight:600; color:var(--color-heading); margin-bottom:0.3rem;">📍 Delivery Address:</div>
                                <div style="color:var(--color-text-muted); line-height:1.4;">
                                  ${o.customer.name}<br>
                                  ${o.customer.address || ''}, ${o.customer.city || ''}<br>
                                  Phone: ${o.customer.phone || 'N/A'}
                                </div>
                              </div>
                              <div style="display:flex; flex-direction:column; gap:0.3rem; border-left:1px solid var(--border-color-light); padding-left:1rem;">
                                <div class="d-flex justify-between">
                                  <span>Subtotal:</span>
                                  <strong>${window.MJCurrency ? window.MJCurrency.format(o.subtotal) : `$${o.subtotal.toFixed(2)}`}</strong>
                                </div>
                                ${o.discount > 0 ? `
                                  <div class="d-flex justify-between" style="color:var(--color-primary-dark);">
                                    <span>Discount (${o.couponCode || 'Promo'}):</span>
                                    <strong>-${window.MJCurrency ? window.MJCurrency.format(o.discount) : `$${o.discount.toFixed(2)}`}</strong>
                                  </div>
                                ` : ''}
                                <div class="d-flex justify-between">
                                  <span>Shipping:</span>
                                  <span>${o.shipping === 0 ? '<strong style="color:var(--color-success);">FREE</strong>' : (window.MJCurrency ? window.MJCurrency.format(o.shipping) : `$${o.shipping.toFixed(2)}`)}</span>
                                </div>
                                <div class="d-flex justify-between" style="border-top:1px solid var(--border-color); padding-top:0.4rem; font-size:1.05rem; font-weight:700; color:var(--color-heading);">
                                  <span>Total Amount:</span>
                                  <span style="color:var(--color-primary-dark);">${window.MJCurrency ? window.MJCurrency.format(o.total) : `$${o.total.toFixed(2)}`}</span>
                                </div>
                              </div>
                            </div>

                            <!-- Actions Row -->
                            <div class="d-flex justify-between align-center flex-wrap gap-2" style="margin-top:1.2rem; padding-top:0.8rem; border-top:1px solid var(--border-color-light);">
                              <button class="btn btn-primary btn-sm" onclick="window.MJPortal.close(); window.MJOrderTracking.track('${o.id}');">
                                📍 Track Live Delivery Status
                              </button>
                              <div class="d-flex gap-1">
                                <button class="btn btn-outline btn-sm" onclick="window.MJPortal.reOrder('${o.id}')" title="Re-order all items">
                                  🔄 Buy Again
                                </button>
                                <button class="btn btn-soft btn-sm" onclick="window.print()" title="Print Receipt">
                                  🖨 Print Invoice
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `}
              </div>
            ` : ''}

            <!-- 2. SAVED WISHLIST TAB -->
            ${this.activeTab === 'wishlist' ? `
              <div>
                ${wishlistProducts.length === 0 ? `
                  <div style="text-align:center; padding:3rem 1rem; background:var(--bg-surface); border-radius:var(--radius-md); border:1px dashed var(--border-color);">
                    <span style="font-size:3rem; display:block; margin-bottom:0.8rem;">♡</span>
                    <h4 style="font-family:var(--font-heading); font-size:1.5rem; margin-bottom:0.4rem;">Your Wishlist is Empty</h4>
                    <p style="color:var(--color-text-muted); font-size:0.92rem; margin-bottom:1.4rem;">Save products you love by tapping the heart icon on any product.</p>
                    <button class="btn btn-primary" onclick="window.MJPortal.close(); document.getElementById('shopSection').scrollIntoView({behavior:'smooth'});">
                      Explore Products
                    </button>
                  </div>
                ` : `
                  <div class="product-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                    ${wishlistProducts.map(p => `
                      <div class="product-card">
                        <div class="product-card-media" style="aspect-ratio:1/1;">
                          <img src="${p.images[0]}" alt="${p.name}">
                        </div>
                        <div class="product-card-body" style="padding:1rem;">
                          <h4 class="product-card-title" style="font-size:1rem;">${p.name}</h4>
                          <div class="price-current" style="margin: 0.4rem 0;">${window.MJCurrency ? window.MJCurrency.format(p.salePrice || p.price) : `$${(p.salePrice || p.price).toFixed(2)}`}</div>
                          <button class="btn btn-primary btn-sm w-100" onclick="window.MJWishlist.moveToCart('${p.id}'); window.MJPortal.render();">
                            Move to Bag
                          </button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            ` : ''}

            <!-- 3. PERSONAL INFO & ADDRESS TAB -->
            ${this.activeTab === 'profile' ? `
              <div style="max-width:540px;">
                <form onsubmit="window.MJPortal.handleSaveProfile(event)">
                  <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" name="name" class="form-control" required value="${user.name}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email Address (Registered)</label>
                    <input type="email" name="email" class="form-control" disabled value="${user.email}" style="background:var(--bg-subtle);">
                    <small style="color:var(--color-text-muted);">Email cannot be changed as it links to your order history.</small>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Contact Phone Number</label>
                    <input type="tel" name="phone" class="form-control" value="${user.phone || ''}" placeholder="+92 (300) 000-0000">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Default Shipping Delivery Address</label>
                    <textarea name="address" class="form-control" rows="3" placeholder="Enter house / building, street name, area, city">${user.address || ''}</textarea>
                  </div>
                  <button type="submit" class="btn btn-primary">Save Profile Changes</button>
                </form>
              </div>
            ` : ''}

          </div>
        </div>
      `;
    },

    toggleAuthView(mode) {
      const loginWrap = document.getElementById('portalFormLoginWrap');
      const regWrap = document.getElementById('portalFormRegisterWrap');
      const btnLogin = document.getElementById('portalTabBtnLogin');
      const btnReg = document.getElementById('portalTabBtnRegister');

      if (mode === 'register') {
        if (loginWrap) loginWrap.style.display = 'none';
        if (regWrap) regWrap.style.display = 'block';
        if (btnLogin) { btnLogin.style.background = 'transparent'; btnLogin.style.color = 'var(--color-heading)'; }
        if (btnReg) { btnReg.style.background = 'var(--color-primary)'; btnReg.style.color = '#fff'; }
      } else {
        if (loginWrap) loginWrap.style.display = 'block';
        if (regWrap) regWrap.style.display = 'none';
        if (btnLogin) { btnLogin.style.background = 'var(--color-primary)'; btnLogin.style.color = '#fff'; }
        if (btnReg) { btnReg.style.background = 'transparent'; btnReg.style.color = 'var(--color-heading)'; }
      }
    },

    handleLogin(e) {
      e.preventDefault();
      const form = e.target;
      const email = form.email.value.trim();
      const pass = form.password.value.trim();

      if (!email || !pass) {
        window.MJToast.error('Please enter both email and password.');
        return;
      }

      const res = window.MJAuth.loginCustomer(email, pass);
      if (res.success) {
        window.MJToast.success(`Welcome back, ${res.customer.name}!`);
        this.render();
      }
    },

    handleRegister(e) {
      e.preventDefault();
      const form = e.target;
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const phone = form.phone.value.trim();
      const address = form.address.value.trim();
      const password = form.password.value.trim();

      if (!name || !email || !password) {
        window.MJToast.error('Please fill in all required fields.');
        return;
      }

      const res = window.MJAuth.registerCustomer({
        name,
        email,
        phone,
        address,
        password
      });

      if (res.success) {
        window.MJToast.success(`Welcome to MJ, ${res.customer.name}! Account created.`);
        this.render();
      } else {
        window.MJToast.error(res.message);
      }
    },

    handleLogout() {
      if (window.MJAuth && typeof window.MJAuth.logoutCustomer === 'function') {
        window.MJAuth.logoutCustomer();
      }
      window.MJToast.info('You have signed out.');
      this.render();
    },

    handleSaveProfile(e) {
      e.preventDefault();
      const form = e.target;
      window.MJAuth.updateCustomerProfile({
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        address: form.address.value.trim()
      });
      window.MJToast.success('Profile and default address saved!');
      this.render();
    },

    reOrder(orderId) {
      const order = window.MJOrderStore ? window.MJOrderStore.getById(orderId) : null;
      if (!order || !order.items || !order.items.length) return;

      order.items.forEach(it => {
        const prod = window.MJProductStore ? window.MJProductStore.getById(it.productId) : null;
        if (prod) {
          window.MJCart.addItem(prod, { size: it.size, color: it.color }, it.quantity);
        }
      });

      this.close();
      window.MJCart.openDrawer();
      window.MJToast.success(`Items from order #${orderId} added to your bag!`);
    }
  };

  // Event Listeners for real-time reactivity
  window.MJStorage.on('auth:customer_login', () => window.MJPortal.updateHeaderAccountStatus());
  window.MJStorage.on('auth:customer_updated', () => window.MJPortal.updateHeaderAccountStatus());
  window.MJStorage.on('auth:customer_logout', () => window.MJPortal.updateHeaderAccountStatus());
  window.MJStorage.on('change:orders', () => {
    if (document.getElementById('customerAccountModal') && document.getElementById('customerAccountModal').classList.contains('active')) {
      window.MJPortal.render();
    }
  });

  // Auto-sync header user status on load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => window.MJPortal.updateHeaderAccountStatus());
    } else {
      window.MJPortal.updateHeaderAccountStatus();
    }
  }
})();
