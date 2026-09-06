// Customer Account & Profile Portal Module (Supabase + Local + Forgot Password)
(function() {
  window.MJPortal = {
    activeTab: 'orders', // 'orders', 'wishlist', 'profile'
    authView: 'login',   // 'login', 'register', 'forgot', 'new_password'

    open(tab = null, view = null) {
      if (tab) this.activeTab = tab;
      if (view) this.authView = view;
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
      const isSupabaseActive = window.MJSupabase && window.MJSupabase.isConfigured();
      this.updateHeaderAccountStatus();

      if (!user) {
        // Show Clean Sign In / Register / Forgot Password Forms
        container.innerHTML = `
          <div style="max-width:440px; margin: 0 auto; padding: 0.5rem 0;">
            <div style="text-align:center; margin-bottom:1.4rem;">
              <h3 style="font-family:var(--font-heading); font-size:2.2rem; margin-bottom:0.3rem;">Welcome to MJ</h3>
              <p style="color:var(--color-text-muted); font-size:0.92rem; margin-bottom:0.6rem;">Sign in to view your order history, track deliveries, and manage your account.</p>
              
              <!-- Supabase Cloud Connection Status Badge -->
              <div style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.25rem 0.75rem; border-radius:var(--radius-pill); font-size:0.76rem; font-weight:600; background:${isSupabaseActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color:${isSupabaseActive ? '#059669' : '#D97706'}; border:1px solid ${isSupabaseActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'};">
                <span style="width:6px; height:6px; border-radius:50%; background:${isSupabaseActive ? '#10B981' : '#F59E0B'};"></span>
                <span>${isSupabaseActive ? '⚡ Supabase Cloud Database Connected' : '💾 Local Storage Mode (Supabase Setup in Admin)'}</span>
              </div>
            </div>

            <!-- Tab Switcher (Visible in login & register modes) -->
            <div id="portalAuthTabSwitcher" class="d-flex gap-2" style="margin-bottom:1.5rem; background:var(--bg-subtle); padding:4px; border-radius:var(--radius-pill); border:1px solid var(--border-color-light); ${this.authView === 'forgot' || this.authView === 'new_password' ? 'display:none !important;' : ''}">
              <button type="button" class="btn btn-sm w-100" id="portalTabBtnLogin" onclick="window.MJPortal.toggleAuthView('login')" style="background:${this.authView === 'login' ? 'var(--color-primary)' : 'transparent'}; color:${this.authView === 'login' ? '#fff' : 'var(--color-heading)'}; border-radius:var(--radius-pill); font-weight:600;">
                Sign In
              </button>
              <button type="button" class="btn btn-sm w-100" id="portalTabBtnRegister" onclick="window.MJPortal.toggleAuthView('register')" style="background:${this.authView === 'register' ? 'var(--color-primary)' : 'transparent'}; color:${this.authView === 'register' ? '#fff' : 'var(--color-heading)'}; border-radius:var(--radius-pill); font-weight:600;">
                Create Account
              </button>
            </div>

            <!-- 1. SIGN IN FORM -->
            <div id="portalFormLoginWrap" style="${this.authView === 'login' ? 'display:block;' : 'display:none;'}">
              <form onsubmit="window.MJPortal.handleLogin(event)">
                <div class="form-group">
                  <label class="form-label">Email Address *</label>
                  <input type="email" name="email" id="portalLoginEmail" class="form-control" required placeholder="Enter your registered email" autocomplete="email">
                </div>
                <div class="form-group">
                  <div class="d-flex justify-between align-center" style="margin-bottom:0.4rem;">
                    <label class="form-label" style="margin-bottom:0; font-weight:600;">Password *</label>
                    <a href="javascript:void(0)" onclick="window.MJPortal.toggleAuthView('forgot')" style="font-size:0.85rem; color:var(--color-primary-dark); font-weight:600; text-decoration:underline; cursor:pointer;">
                      Forgot Password?
                    </a>
                  </div>
                  <input type="password" name="password" id="portalLoginPassword" class="form-control" required placeholder="Enter password" autocomplete="current-password">
                  <div style="text-align:right; margin-top:0.35rem;">
                    <a href="javascript:void(0)" onclick="window.MJPortal.toggleAuthView('forgot')" style="font-size:0.82rem; color:var(--color-primary-dark); font-weight:500; text-decoration:none; cursor:pointer;">
                      🔑 Forgot your password? Click here to reset
                    </a>
                  </div>
                </div>
                <button type="submit" id="portalLoginSubmitBtn" class="btn btn-primary btn-lg w-100" style="margin-top:0.8rem;">
                  Sign In to Account →
                </button>
              </form>
              <div style="margin-top:1.2rem; text-align:center; font-size:0.85rem; color:var(--color-text-muted);">
                Don't have an account? <a href="javascript:void(0)" onclick="window.MJPortal.toggleAuthView('register')" style="color:var(--color-primary-dark); font-weight:600; text-decoration:underline;">Create one now</a>
              </div>
            </div>

            <!-- 2. CREATE ACCOUNT FORM -->
            <div id="portalFormRegisterWrap" style="${this.authView === 'register' ? 'display:block;' : 'display:none;'}">
              <form onsubmit="window.MJPortal.handleRegister(event)">
                <div class="form-group">
                  <label class="form-label">Full Name *</label>
                  <input type="text" name="name" id="portalRegisterName" class="form-control" required placeholder="e.g. Eleanor Vance" autocomplete="name">
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address *</label>
                  <input type="email" name="email" id="portalRegisterEmail" class="form-control" required placeholder="name@example.com" autocomplete="email">
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number (Optional)</label>
                  <input type="tel" name="phone" id="portalRegisterPhone" class="form-control" placeholder="+92 (300) 000-0000" autocomplete="tel">
                </div>
                <div class="form-group">
                  <label class="form-label">Delivery Address (Optional)</label>
                  <input type="text" name="address" id="portalRegisterAddress" class="form-control" placeholder="House #, Street, City" autocomplete="street-address">
                </div>
                <div class="form-group">
                  <label class="form-label">Create Password *</label>
                  <input type="password" name="password" id="portalRegisterPassword" class="form-control" required minlength="6" placeholder="At least 6 characters" autocomplete="new-password">
                  <small style="color:var(--color-text-muted); font-size:0.78rem;">Must be minimum 6 characters for cloud database security.</small>
                </div>
                <button type="submit" id="portalRegisterSubmitBtn" class="btn btn-primary btn-lg w-100" style="margin-top:0.8rem;">
                  Register & Create Account →
                </button>
              </form>
              <div style="margin-top:1.2rem; text-align:center; font-size:0.85rem; color:var(--color-text-muted);">
                Already have an account? <a href="javascript:void(0)" onclick="window.MJPortal.toggleAuthView('login')" style="color:var(--color-primary-dark); font-weight:600; text-decoration:underline;">Sign in here</a>
              </div>
            </div>

            <!-- 3. FORGOT PASSWORD FORM -->
            <div id="portalFormForgotWrap" style="${this.authView === 'forgot' ? 'display:block;' : 'display:none;'}">
              <div style="text-align:center; margin-bottom:1.4rem;">
                <div style="font-size:2.4rem; margin-bottom:0.4rem;">🔑</div>
                <h4 style="font-family:var(--font-heading); font-size:1.6rem; margin-bottom:0.3rem;">Forgot Password</h4>
                <p style="color:var(--color-text-muted); font-size:0.88rem; line-height:1.5;">
                  Enter the email address associated with your account and we'll send you instructions to reset your password.
                </p>
              </div>

              <div id="portalForgotStatusAlert" style="display:none; padding:0.9rem 1.1rem; border-radius:var(--radius-sm); font-size:0.88rem; margin-bottom:1.2rem; line-height:1.4;"></div>

              <form id="portalForgotForm" onsubmit="window.MJPortal.handleForgotPassword(event)">
                <div class="form-group">
                  <label class="form-label">Registered Email Address *</label>
                  <input type="email" name="email" id="portalForgotEmail" class="form-control" required placeholder="Enter your email (e.g. name@example.com)" autocomplete="email">
                </div>
                <button type="submit" id="portalForgotSubmitBtn" class="btn btn-primary btn-lg w-100" style="margin-top:0.8rem;">
                  Send Password Reset Link →
                </button>
              </form>

              <!-- Optional In-place Set New Password Box for Immediate Recovery -->
              <div id="portalDirectNewPasswordBox" style="display:none; margin-top:1.4rem; padding:1.2rem; background:var(--bg-subtle); border-radius:var(--radius-sm); border:1px solid var(--border-color-light);">
                <h5 style="font-family:var(--font-heading); font-size:1.2rem; margin-bottom:0.4rem;">Set New Password</h5>
                <form onsubmit="window.MJPortal.handleSetNewPassword(event)">
                  <div class="form-group">
                    <label class="form-label">New Password *</label>
                    <input type="password" id="portalDirectNewPass" class="form-control" required minlength="6" placeholder="Enter at least 6 characters" autocomplete="new-password">
                  </div>
                  <button type="submit" id="portalDirectNewPassBtn" class="btn btn-primary btn-sm w-100" style="margin-top:0.4rem;">
                    Update Password & Sign In →
                  </button>
                </form>
              </div>

              <div style="margin-top:1.4rem; text-align:center; font-size:0.88rem;">
                <a href="javascript:void(0)" onclick="window.MJPortal.toggleAuthView('login')" style="color:var(--color-primary-dark); font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:0.3rem;">
                  ← Back to Sign In
                </a>
              </div>
            </div>

            <!-- 4. SET NEW PASSWORD FORM (Triggered by Email Recovery Link) -->
            <div id="portalFormNewPasswordWrap" style="${this.authView === 'new_password' ? 'display:block;' : 'display:none;'}">
              <div style="text-align:center; margin-bottom:1.4rem;">
                <div style="font-size:2.4rem; margin-bottom:0.4rem;">🔒</div>
                <h4 style="font-family:var(--font-heading); font-size:1.6rem; margin-bottom:0.3rem;">Create New Password</h4>
                <p style="color:var(--color-text-muted); font-size:0.88rem; line-height:1.5;">
                  Please enter your new secure password below to regain access to your account.
                </p>
              </div>

              <form onsubmit="window.MJPortal.handleSetNewPassword(event)">
                <div class="form-group">
                  <label class="form-label">New Password *</label>
                  <input type="password" id="portalRecoveryNewPass" class="form-control" required minlength="6" placeholder="At least 6 characters" autocomplete="new-password">
                </div>
                <button type="submit" id="portalRecoveryPassSubmitBtn" class="btn btn-primary btn-lg w-100" style="margin-top:0.8rem;">
                  Save New Password & Sign In →
                </button>
              </form>
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
                <div class="d-flex align-center gap-1">
                  <h3 style="font-family:var(--font-heading); font-size:1.6rem; margin:0; color:var(--color-heading);">${user.name}</h3>
                  ${isSupabaseActive ? '<span class="badge" style="background:#10B981; color:#fff; font-size:0.7rem; padding:2px 6px;">Supabase Cloud</span>' : ''}
                </div>
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
                    <input type="text" name="name" id="profileEditName" class="form-control" required value="${user.name}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email Address (Registered)</label>
                    <input type="email" name="email" class="form-control" disabled value="${user.email}" style="background:var(--bg-subtle);">
                    <small style="color:var(--color-text-muted);">Email is linked to your Supabase credentials and order records.</small>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Contact Phone Number</label>
                    <input type="tel" name="phone" id="profileEditPhone" class="form-control" value="${user.phone || ''}" placeholder="+92 (300) 000-0000">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Default Shipping Delivery Address</label>
                    <textarea name="address" id="profileEditAddress" class="form-control" rows="3" placeholder="Enter house / building, street name, area, city">${user.address || ''}</textarea>
                  </div>
                  <button type="submit" id="profileEditSubmitBtn" class="btn btn-primary">Save Profile Changes</button>
                </form>
              </div>
            ` : ''}

          </div>
        </div>
      `;
    },

    toggleAuthView(mode) {
      this.authView = mode;
      const loginWrap = document.getElementById('portalFormLoginWrap');
      const regWrap = document.getElementById('portalFormRegisterWrap');
      const forgotWrap = document.getElementById('portalFormForgotWrap');
      const newPassWrap = document.getElementById('portalFormNewPasswordWrap');
      const switcher = document.getElementById('portalAuthTabSwitcher');
      const btnLogin = document.getElementById('portalTabBtnLogin');
      const btnReg = document.getElementById('portalTabBtnRegister');

      if (mode === 'forgot') {
        if (loginWrap) loginWrap.style.display = 'none';
        if (regWrap) regWrap.style.display = 'none';
        if (newPassWrap) newPassWrap.style.display = 'none';
        if (forgotWrap) forgotWrap.style.display = 'block';
        if (switcher) switcher.style.setProperty('display', 'none', 'important');
        
        // Transfer email from login if entered
        const loginEmail = document.getElementById('portalLoginEmail');
        const forgotEmail = document.getElementById('portalForgotEmail');
        if (loginEmail && forgotEmail && loginEmail.value.trim()) {
          forgotEmail.value = loginEmail.value.trim();
        }
      } else if (mode === 'register') {
        if (loginWrap) loginWrap.style.display = 'none';
        if (forgotWrap) forgotWrap.style.display = 'none';
        if (newPassWrap) newPassWrap.style.display = 'none';
        if (regWrap) regWrap.style.display = 'block';
        if (switcher) switcher.style.display = 'flex';
        if (btnLogin) { btnLogin.style.background = 'transparent'; btnLogin.style.color = 'var(--color-heading)'; }
        if (btnReg) { btnReg.style.background = 'var(--color-primary)'; btnReg.style.color = '#fff'; }
      } else if (mode === 'new_password') {
        if (loginWrap) loginWrap.style.display = 'none';
        if (regWrap) regWrap.style.display = 'none';
        if (forgotWrap) forgotWrap.style.display = 'none';
        if (newPassWrap) newPassWrap.style.display = 'block';
        if (switcher) switcher.style.setProperty('display', 'none', 'important');
      } else {
        // default: 'login'
        if (regWrap) regWrap.style.display = 'none';
        if (forgotWrap) forgotWrap.style.display = 'none';
        if (newPassWrap) newPassWrap.style.display = 'none';
        if (loginWrap) loginWrap.style.display = 'block';
        if (switcher) switcher.style.display = 'flex';
        if (btnLogin) { btnLogin.style.background = 'var(--color-primary)'; btnLogin.style.color = '#fff'; }
        if (btnReg) { btnReg.style.background = 'transparent'; btnReg.style.color = 'var(--color-heading)'; }
      }
    },

    async handleLogin(e) {
      e.preventDefault();
      const form = e.target;
      const email = form.email.value.trim();
      const pass = form.password.value.trim();
      const submitBtn = document.getElementById('portalLoginSubmitBtn');

      if (!email || !pass) {
        window.MJToast.error('Please enter both email and password.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Verifying Credentials...';
      }

      try {
        const res = await window.MJAuth.loginCustomer(email, pass);
        if (res.success) {
          const sourceMsg = res.source === 'supabase' ? ' (Supabase Cloud)' : '';
          window.MJToast.success(`Welcome back, ${res.customer.name}!${sourceMsg}`);
          this.render();
        } else {
          window.MJToast.error(res.message || 'Login failed.');
        }
      } catch (err) {
        window.MJToast.error('Error during sign in: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Sign In to Account →';
        }
      }
    },

    async handleRegister(e) {
      e.preventDefault();
      const form = e.target;
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const phone = form.phone ? form.phone.value.trim() : '';
      const address = form.address ? form.address.value.trim() : '';
      const password = form.password.value.trim();
      const submitBtn = document.getElementById('portalRegisterSubmitBtn');

      if (!name || !email || !password) {
        window.MJToast.error('Please fill in all required fields.');
        return;
      }

      if (password.length < 6) {
        window.MJToast.error('Password must be at least 6 characters long.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Creating Account in Supabase...';
      }

      try {
        const res = await window.MJAuth.registerCustomer({
          name,
          email,
          phone,
          address,
          password
        });

        if (res.success) {
          const sourceMsg = res.source === 'supabase' ? ' (Saved to Supabase Cloud)' : '';
          window.MJToast.success(`Welcome to MJ, ${res.customer.name}! Account created.${sourceMsg}`);
          this.render();
        } else {
          window.MJToast.error(res.message || 'Registration failed.');
        }
      } catch (err) {
        window.MJToast.error('Registration error: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Register & Create Account →';
        }
      }
    },

    async handleForgotPassword(e) {
      e.preventDefault();
      const form = e.target;
      const email = form.email.value.trim();
      const submitBtn = document.getElementById('portalForgotSubmitBtn');
      const alertBox = document.getElementById('portalForgotStatusAlert');
      const directBox = document.getElementById('portalDirectNewPasswordBox');

      if (!email) {
        window.MJToast.error('Please enter your email address.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Sending Reset Instructions...';
      }

      try {
        const res = await window.MJAuth.sendPasswordResetEmail(email);
        if (res.success) {
          window.MJToast.success(res.message);
          if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.style.background = 'rgba(16, 185, 129, 0.12)';
            alertBox.style.color = '#065f46';
            alertBox.style.border = '1px solid #10B981';
            alertBox.innerHTML = `<strong>✉️ Check Your Inbox!</strong><br>${res.message}`;
          }
          if (res.canResetDirectly && directBox) {
            directBox.style.display = 'block';
          }
        } else {
          window.MJToast.error(res.message || 'Could not process password reset.');
          if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
            alertBox.style.color = '#991b1b';
            alertBox.style.border = '1px solid #EF4444';
            alertBox.innerHTML = `<strong>Error:</strong> ${res.message}`;
          }
        }
      } catch (err) {
        window.MJToast.error('Error: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Send Password Reset Link →';
        }
      }
    },

    async handleSetNewPassword(e) {
      e.preventDefault();
      const passInput = document.getElementById('portalRecoveryNewPass') || document.getElementById('portalDirectNewPass');
      const newPass = passInput ? passInput.value.trim() : '';

      if (!newPass || newPass.length < 6) {
        window.MJToast.error('Password must be at least 6 characters long.');
        return;
      }

      try {
        const res = await window.MJAuth.updateCustomerPassword(newPass);
        if (res.success) {
          window.MJToast.success('Password updated successfully! You can now sign in.');
          this.toggleAuthView('login');
          const passEl = document.getElementById('portalLoginPassword');
          if (passEl) passEl.value = newPass;
        } else {
          window.MJToast.error(res.message || 'Failed to update password.');
        }
      } catch (err) {
        window.MJToast.error('Error: ' + err.message);
      }
    },

    async handleLogout() {
      if (window.MJAuth && typeof window.MJAuth.logoutCustomer === 'function') {
        await window.MJAuth.logoutCustomer();
      }
      window.MJToast.info('You have signed out.');
      this.render();
    },

    async handleSaveProfile(e) {
      e.preventDefault();
      const form = e.target;
      const submitBtn = document.getElementById('profileEditSubmitBtn');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Saving...';
      }

      try {
        await window.MJAuth.updateCustomerProfile({
          name: form.name.value.trim(),
          phone: form.phone.value.trim(),
          address: form.address.value.trim()
        });
        window.MJToast.success('Profile and default address saved!');
        this.render();
      } catch (err) {
        window.MJToast.error('Failed to update profile: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Profile Changes';
        }
      }
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

  // Listen for Supabase password recovery event from email link
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      // Check if URL contains Supabase password recovery token
      if (window.location.hash && window.location.hash.includes('type=recovery')) {
        setTimeout(() => {
          window.MJPortal.open(null, 'new_password');
          window.MJToast.info('Please enter your new password to complete recovery.');
        }, 500);
      }

      if (window.MJSupabase && window.MJSupabase.isConfigured()) {
        const client = window.MJSupabase.getClient();
        if (client && client.auth) {
          client.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
              window.MJPortal.open(null, 'new_password');
              window.MJToast.info('Please set your new password.');
            }
          });
        }
      }
    });
  }

  // Event Listeners for real-time reactivity
  window.MJStorage.on('auth:customer_login', () => window.MJPortal.updateHeaderAccountStatus());
  window.MJStorage.on('auth:customer_updated', () => window.MJPortal.updateHeaderAccountStatus());
  window.MJStorage.on('auth:customer_logout', () => window.MJPortal.updateHeaderAccountStatus());
  window.MJStorage.on('supabase:config_updated', () => {
    if (document.getElementById('customerAccountModal') && document.getElementById('customerAccountModal').classList.contains('active')) {
      window.MJPortal.render();
    }
  });
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
