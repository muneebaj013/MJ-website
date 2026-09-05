// MJ Admin Panel Master Coordinator & Management Modules
(function() {
  // Global Admin Toast Notification Helper
  window.MJToast = window.MJToast || {
    show(message, type = 'info') {
      let container = document.getElementById('toastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;

      const icon = type === 'success' ? '✨' : (type === 'error' ? '⚠️' : '🌸');
      toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
      `;

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    info(msg) { this.show(msg, 'info'); }
  };

  window.MJAdmin = {
    currentTab: 'dashboard',
    chartPeriod: 'monthly',

    init() {
      // Ensure seed data is populated in storage
      if (window.MJStorage && typeof window.MJStorage.init === 'function') {
        window.MJStorage.init();
      }

      this.checkAuth();
      this.bindEvents();
      this.renderCurrentTab();
      this.updateNotifications();

      // Listen for reactive store changes
      if (window.MJStorage && typeof window.MJStorage.on === 'function') {
        window.MJStorage.on('change:orders', () => this.refreshData());
        window.MJStorage.on('change:products', () => this.refreshData());
        window.MJStorage.on('change:reviews', () => this.refreshData());
        window.MJStorage.on('admin:notification', (notif) => this.handleNewNotification(notif));
      }
    },

    checkAuth() {
      const loginOverlay = document.getElementById('adminLoginOverlay');
      const adminApp = document.getElementById('adminAppLayout');
      
      if (window.MJAuth && window.MJAuth.isAdminLoggedIn()) {
        if (loginOverlay) loginOverlay.style.setProperty('display', 'none', 'important');
        if (adminApp) {
          adminApp.style.setProperty('display', 'flex', 'important');
          adminApp.style.setProperty('visibility', 'visible', 'important');
          adminApp.style.setProperty('opacity', '1', 'important');
        }
      } else {
        if (loginOverlay) {
          loginOverlay.style.setProperty('display', 'flex', 'important');
          loginOverlay.style.setProperty('visibility', 'visible', 'important');
          loginOverlay.style.setProperty('opacity', '1', 'important');
        }
        if (adminApp) adminApp.style.setProperty('display', 'none', 'important');
      }
    },

    handleLogin(e) {
      if (e && e.preventDefault) e.preventDefault();
      
      const emailInput = document.getElementById('adminLoginEmail');
      const passInput = document.getElementById('adminLoginPassword');
      
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const passVal = passInput ? passInput.value.trim() : '';

      if (!emailVal || !passVal) {
        window.MJToast.error('Please enter username/email and password.');
        return false;
      }

      const res = window.MJAuth.loginAdmin(emailVal, passVal);
      if (res && res.success) {
        this.checkAuth();
        this.renderCurrentTab();
        window.MJToast.success('Admin login successful. Welcome to MJ Control Center!');
      } else {
        window.MJToast.error(res && res.message ? res.message : 'Invalid credentials.');
      }
      return false;
    },

    handleLogout() {
      if (window.MJAuth && typeof window.MJAuth.logoutAdmin === 'function') {
        window.MJAuth.logoutAdmin();
      }
      sessionStorage.removeItem('mj_admin_session');
      localStorage.removeItem('mj_admin_session');
      window.MJToast.info('Admin signed out.');
      this.checkAuth();
      const emailInput = document.getElementById('adminLoginEmail');
      const passInput = document.getElementById('adminLoginPassword');
      if (emailInput) emailInput.value = '';
      if (passInput) passInput.value = '';
    },

    bindEvents() {
      // Enter key support on login inputs
      const emailInput = document.getElementById('adminLoginEmail');
      const passInput = document.getElementById('adminLoginPassword');
      const loginForm = document.getElementById('adminLoginForm');

      if (emailInput) {
        emailInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (passInput) passInput.focus();
          }
        });
      }

      if (passInput) {
        passInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.handleLogin(e);
          }
        });
      }

      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleLogin(e);
        });
      }
    },

    switchTab(tabName) {
      this.currentTab = tabName;

      // Close mobile sidebar if open
      const sidebar = document.querySelector('.admin-sidebar');
      if (sidebar) sidebar.classList.remove('open');

      // Update sidebar active class
      document.querySelectorAll('.admin-nav-item').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Update tab views
      document.querySelectorAll('.admin-tab-content').forEach(view => {
        if (view.id === `tab-${tabName}`) {
          view.classList.add('active');
          view.style.display = 'block';
        } else {
          view.classList.remove('active');
          view.style.display = 'none';
        }
      });

      this.renderCurrentTab();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderCurrentTab() {
      switch (this.currentTab) {
        case 'dashboard':
          this.renderDashboard();
          break;
        case 'products':
          this.renderProducts();
          break;
        case 'inventory':
          this.renderInventory();
          break;
        case 'categories':
          this.renderCategories();
          break;
        case 'orders':
          this.renderOrders();
          break;
        case 'customers':
          this.renderCustomers();
          break;
        case 'coupons':
          this.renderCoupons();
          break;
        case 'cms':
          this.renderCMS();
          break;
        case 'reviews':
          this.renderReviews();
          break;
        case 'shipping':
          this.renderShipping();
          break;
        case 'settings':
          this.renderSettings();
          break;
      }
    },

    refreshData() {
      this.renderCurrentTab();
      this.updateKPIs();
      this.updateNotifications();
    },

    // ================= 1. DASHBOARD ANALYTICS =================
    renderDashboard() {
      this.updateKPIs();
      this.renderRevenueChart();
      this.renderRecentOrdersTable();
    },

    updateKPIs() {
      const orders = window.MJOrderStore ? window.MJOrderStore.getAll() : [];
      const products = window.MJProductStore ? window.MJProductStore.getAll() : [];
      const customers = window.MJStorage.get('customers') || [];

      const totalRevenue = orders.reduce((sum, o) => sum + (o.orderStatus !== 'Cancelled' ? o.total : 0), 0);
      const pendingOrders = orders.filter(o => o.orderStatus === 'Pending').length;
      const lowStockProducts = products.filter(p => p.stock <= 5);

      const kpiRev = document.getElementById('kpiTotalRevenue');
      const kpiOrd = document.getElementById('kpiTotalOrders');
      const kpiProd = document.getElementById('kpiTotalProducts');
      const kpiCust = document.getElementById('kpiTotalCustomers');
      const kpiPend = document.getElementById('kpiPendingOrders');

      if (kpiRev) kpiRev.textContent = window.MJCurrency ? window.MJCurrency.format(totalRevenue) : `$${totalRevenue.toFixed(2)}`;
      if (kpiOrd) kpiOrd.textContent = orders.length;
      if (kpiProd) kpiProd.textContent = products.length;
      if (kpiCust) kpiCust.textContent = customers.length;
      if (kpiPend) kpiPend.textContent = pendingOrders;

      // Low stock alert banner
      const lowStockBanner = document.getElementById('dashboardLowStockBanner');
      if (lowStockBanner) {
        if (lowStockProducts.length > 0) {
          lowStockBanner.style.display = 'block';
          lowStockBanner.innerHTML = `
            <div style="background:var(--color-warning-bg); border-left:4px solid var(--color-warning); padding:1rem 1.4rem; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem;">
              <div class="d-flex align-center gap-2">
                <span style="font-size:1.4rem;">⚠️</span>
                <div>
                  <strong>Low Stock Alert:</strong> ${lowStockProducts.length} product(s) have 5 or fewer units remaining.
                </div>
              </div>
              <button class="btn btn-outline btn-sm" onclick="window.MJAdmin.switchTab('inventory')">Manage Stock →</button>
            </div>
          `;
        } else {
          lowStockBanner.style.display = 'none';
        }
      }
    },

    renderRevenueChart() {
      const container = document.getElementById('adminRevenueChart');
      if (!container) return;

      const monthlyData = [
        { label: 'Jan', val: 3200, pct: 40 },
        { label: 'Feb', val: 4100, pct: 52 },
        { label: 'Mar', val: 5600, pct: 68 },
        { label: 'Apr', val: 4900, pct: 60 },
        { label: 'May', val: 6800, pct: 82 },
        { label: 'Jun', val: 7400, pct: 90 },
        { label: 'Jul', val: 6900, pct: 85 },
        { label: 'Aug', val: 8650, pct: 100 }
      ];

      container.innerHTML = `
        <div style="display:flex; align-items:flex-end; gap:1.2rem; height:100%; width:100%;">
          ${monthlyData.map(d => `
            <div class="chart-bar-group">
              <div style="font-size:0.75rem; font-weight:700; color:var(--color-primary-dark); margin-bottom:6px;">$${d.val}</div>
              <div class="chart-bar" style="height: ${d.pct}%;" title="${d.label}: $${d.val}"></div>
              <span class="chart-bar-label">${d.label}</span>
            </div>
          `).join('')}
        </div>
      `;

      // Category breakdown
      const catBreakdown = document.getElementById('adminCategorySalesBreakdown');
      if (catBreakdown) {
        catBreakdown.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:1rem;">
            <div>
              <div class="d-flex justify-between" style="font-size:0.85rem; margin-bottom:0.3rem;">
                <span>👗 Clothing Collection</span>
                <strong>42% ($3,633)</strong>
              </div>
              <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:42%; background:var(--color-primary);"></div></div>
            </div>

            <div>
              <div class="d-flex justify-between" style="font-size:0.85rem; margin-bottom:0.3rem;">
                <span>🛏 Luxury Bedsheets</span>
                <strong>36% ($3,114)</strong>
              </div>
              <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:36%; background:var(--color-accent);"></div></div>
            </div>

            <div>
              <div class="d-flex justify-between" style="font-size:0.85rem; margin-bottom:0.3rem;">
                <span>🕯 Home & Decor</span>
                <strong>14% ($1,211)</strong>
              </div>
              <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:14%; background:var(--color-neutral-dark);"></div></div>
            </div>

            <div>
              <div class="d-flex justify-between" style="font-size:0.85rem; margin-bottom:0.3rem;">
                <span>🌸 Seasonal Capsules</span>
                <strong>8% ($692)</strong>
              </div>
              <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:8%; background:var(--color-success);"></div></div>
            </div>
          </div>
        `;
      }
    },

    renderRecentOrdersTable() {
      const container = document.getElementById('adminRecentOrdersTable');
      if (!container) return;

      const orders = window.MJOrderStore ? window.MJOrderStore.getAll().slice(0, 5) : [];
      const prods = window.MJProductStore ? window.MJProductStore.getAll() : [];
      const allOrders = window.MJOrderStore ? window.MJOrderStore.getAll() : [];

      container.innerHTML = `
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${orders.length > 0 ? orders.map(o => `
                <tr>
                  <td><strong>#${o.id}</strong></td>
                  <td>
                    <div>${o.customer.name}</div>
                    <small style="color:var(--color-text-muted);">${o.customer.city || ''}</small>
                  </td>
                  <td>${o.items.length} item(s)</td>
                  <td><strong>$${o.total.toFixed(2)}</strong></td>
                  <td><span class="table-status status-${(o.orderStatus || 'pending').toLowerCase()}">● ${o.orderStatus}</span></td>
                  <td>${o.paymentStatus || 'Paid'} (${(o.paymentMethod || '').includes('Cash') ? 'COD' : 'Card'})</td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="window.MJAdmin.viewOrderDetails('${o.id}')">View</button>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" style="text-align:center; padding:2rem; color:var(--color-text-muted);">No orders found yet.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- Product Demand & Orders Breakdown -->
        <div class="data-card" style="margin-top: 1.8rem;">
          <div class="data-card-header">
            <div>
              <h4 style="font-family:var(--font-heading); font-size:1.4rem;">Product Demand & Order Analytics</h4>
              <p style="font-size:0.85rem; color:var(--color-text-muted);">See exactly how many orders, units, and revenue each product has generated.</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="window.MJAdmin.switchTab('products')">Manage Products →</button>
          </div>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Total Orders Placed</th>
                  <th>Units Sold</th>
                  <th>Revenue Generated</th>
                  <th>Stock Available</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${prods.map(p => {
                  let ordersCount = 0;
                  let unitsSold = 0;
                  let revenue = 0;

                  allOrders.forEach(o => {
                    if (o.orderStatus !== 'Cancelled') {
                      (o.items || []).forEach(it => {
                        if (it.productId === p.id || it.name === p.name) {
                          ordersCount++;
                          unitsSold += (it.quantity || 1);
                          revenue += (it.price * (it.quantity || 1));
                        }
                      });
                    }
                  });

                  return `
                    <tr>
                      <td>
                        <div class="d-flex align-center gap-2">
                          <img src="${p.images[0]}" alt="${p.name}" class="table-thumb">
                          <strong>${p.name}</strong>
                        </div>
                      </td>
                      <td>${p.category}</td>
                      <td>$${(p.salePrice || p.price).toFixed(2)}</td>
                      <td><span class="badge badge-new" style="font-size:0.8rem;">${ordersCount} orders</span></td>
                      <td><strong>${unitsSold} units</strong></td>
                      <td><strong style="color:var(--color-primary-dark); font-size:1rem;">$${revenue.toFixed(2)}</strong></td>
                      <td>
                        <span class="badge ${p.stock <= 0 ? 'badge-stock-out' : (p.stock <= 5 ? 'badge-stock-low' : 'badge-success')}">
                          ${p.stock} left
                        </span>
                      </td>
                      <td>
                        ${p.stock > 0 ? '<span style="color:var(--color-success); font-weight:600;">Available</span>' : '<span style="color:var(--color-danger); font-weight:600;">Out of Stock</span>'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // ================= 2. PRODUCT MANAGEMENT =================
    renderProducts() {
      const container = document.getElementById('tab-products');
      if (!container) return;

      const products = window.MJProductStore ? window.MJProductStore.getAll() : [];

      container.innerHTML = `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3 style="font-family:var(--font-heading); font-size:1.6rem;">Product Catalog Management</h3>
              <p style="color:var(--color-text-muted); font-size:0.9rem;">Add, edit, or remove products and adjust prices without code.</p>
            </div>
            <button class="btn btn-primary" onclick="window.MJAdmin.openProductModal()">
              + Add New Product
            </button>
          </div>

          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Sale Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(p => `
                  <tr>
                    <td>
                      <div class="d-flex align-center gap-2">
                        <img src="${p.images[0]}" alt="${p.name}" class="table-thumb">
                        <div>
                          <strong>${p.name}</strong>
                          <div style="font-size:0.75rem; color:var(--color-text-muted);">
                            ${p.isFeatured ? '<span class="badge badge-best" style="font-size:0.65rem; padding:0.1rem 0.4rem;">Featured</span>' : ''}
                            ${p.isBestSeller ? '<span class="badge badge-new" style="font-size:0.65rem; padding:0.1rem 0.4rem;">Best Seller</span>' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>${p.category}</td>
                    <td><code>${p.sku}</code></td>
                    <td>${window.MJCurrency ? window.MJCurrency.format(p.price) : `$${p.price.toFixed(2)}`}</td>
                    <td>${p.salePrice ? `<strong style="color:var(--color-primary-dark);">${window.MJCurrency ? window.MJCurrency.format(p.salePrice) : `$${p.salePrice.toFixed(2)}`}</strong>` : '—'}</td>
                    <td>
                      <span class="badge ${p.stock <= 0 ? 'badge-stock-out' : (p.stock <= 5 ? 'badge-stock-low' : 'badge-success')}">
                        ${p.stock} in stock
                      </span>
                    </td>
                    <td>
                      ${p.stock > 0 ? '<span style="color:var(--color-success); font-size:0.85rem;">Active</span>' : '<span style="color:var(--color-danger); font-size:0.85rem;">Sold Out</span>'}
                    </td>
                    <td>
                      <div class="table-actions">
                        <button class="btn-table" onclick="window.MJAdmin.openProductModal('${p.id}')" title="Edit Product">✏️</button>
                        <button class="btn-table btn-table-danger" onclick="window.MJAdmin.deleteProduct('${p.id}')" title="Delete Product">🗑</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    currentModalImages: [],

    openProductModal(productId = null) {
      const p = productId ? window.MJProductStore.getById(productId) : null;
      const categories = window.MJProductStore.getCategories();
      
      // Initialize modal images
      this.currentModalImages = (p && Array.isArray(p.images) && p.images.length) 
        ? [...p.images] 
        : ['assets/images/fashion-dress.jpg'];

      const modalHtml = `
        <div id="adminProductEditModal" class="modal-backdrop active">
          <div class="modal-container" style="max-width: 860px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">${p ? 'Edit Product' : 'Add New Product'}</h3>
                <p style="font-size:0.85rem; color:var(--color-text-muted); margin-top:0.2rem;">Upload photos from your computer or provide web links.</p>
              </div>
              <button class="modal-close-btn" onclick="document.getElementById('adminProductEditModal').remove()">✕</button>
            </div>
            <div class="modal-body">
              <form onsubmit="window.MJAdmin.saveProduct(event, '${productId || ''}')">
                
                <!-- Product Basic Info -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Product Name *</label>
                    <input type="text" name="name" class="form-control" required value="${p ? p.name : ''}" placeholder="e.g. Aura Embroidered Linen Dress">
                  </div>
                  <div class="form-group">
                    <label class="form-label">SKU (Stock Keeping Unit)</label>
                    <input type="text" name="sku" class="form-control" value="${p ? p.sku : 'MJ-SKU-' + Math.floor(1000 + Math.random()*9000)}">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Category *</label>
                    <select name="category" class="form-control form-select" required>
                      ${categories.map(c => `
                        <option value="${c.name}" ${p && p.category === c.name ? 'selected' : ''}>${c.name}</option>
                      `).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Subcategory</label>
                    <input type="text" name="subcategory" class="form-control" value="${p ? (p.subcategory || '') : ''}" placeholder="e.g. Women's Clothing">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Regular Price ($) *</label>
                    <input type="number" step="0.01" name="price" class="form-control" required value="${p ? p.price : ''}" placeholder="89.00">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Sale Price ($) (Optional)</label>
                    <input type="number" step="0.01" name="salePrice" class="form-control" value="${p && p.salePrice ? p.salePrice : ''}" placeholder="75.00">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Initial Stock Units *</label>
                    <input type="number" name="stock" class="form-control" required value="${p ? p.stock : 20}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Fabric / Material</label>
                    <input type="text" name="material" class="form-control" value="${p ? p.material : '100% Organic Linen'}" placeholder="100% Organic Cotton">
                  </div>
                </div>

                <!-- 📸 Advanced Image Upload & URL Manager -->
                <div class="form-group" style="background:var(--bg-subtle); padding:1.4rem; border-radius:var(--radius-sm); border:1px dashed var(--color-primary); margin: 1.2rem 0;">
                  <label class="form-label" style="font-weight:600; color:var(--color-heading); display:flex; justify-content:space-between; align-items:center;">
                    <span>📸 Product Images (Upload from Laptop/PC or Enter URL) *</span>
                    <span style="font-size:0.78rem; font-weight:normal; color:var(--color-text-muted);">Supports JPG, PNG, WEBP, GIF</span>
                  </label>

                  <!-- Dual Mode Upload Controls -->
                  <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:1rem; margin-top:0.8rem;">
                    
                    <!-- 1. Device File Upload Box -->
                    <div style="background:#ffffff; border:1px solid var(--border-color-light); border-radius:var(--radius-xs); padding:1rem; text-align:center;">
                      <label for="productImageFileInput" class="btn btn-outline btn-sm w-100" style="cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:0.4rem;">
                        <span>📁 Upload from Device</span>
                      </label>
                      <input type="file" id="productImageFileInput" accept="image/*" multiple style="display:none;" onchange="window.MJAdmin.handleProductFileUpload(event)">
                      <div style="font-size:0.75rem; color:var(--color-text-muted); margin-top:0.4rem;">Click to browse files from your computer</div>
                    </div>

                    <!-- 2. Image URL / Web Link Input Box -->
                    <div style="background:#ffffff; border:1px solid var(--border-color-light); border-radius:var(--radius-xs); padding:1rem;">
                      <div style="display:flex; gap:0.4rem;">
                        <input type="text" id="productImageUrlInput" class="form-control" placeholder="Paste image link or asset path..." style="font-size:0.85rem;">
                        <button type="button" class="btn btn-primary btn-sm" onclick="window.MJAdmin.addImageFromUrl()" style="white-space:nowrap;">+ Add Link</button>
                      </div>
                      <div style="font-size:0.75rem; color:var(--color-text-muted); margin-top:0.4rem;">Or enter a web URL / path</div>
                    </div>

                  </div>

                  <!-- Quick Brand Image Presets -->
                  <div style="margin-top:1rem; display:flex; align-items:center; flex-wrap:wrap; gap:0.4rem;">
                    <span style="font-size:0.78rem; font-weight:600; color:var(--color-text-muted); margin-right:0.3rem;">Quick Presets:</span>
                    <button type="button" class="badge" style="cursor:pointer; border:1px solid var(--border-color); background:#fff;" onclick="window.MJAdmin.addPresetImage('assets/images/fashion-dress.jpg')">+ 👗 Linen Dress</button>
                    <button type="button" class="badge" style="cursor:pointer; border:1px solid var(--border-color); background:#fff;" onclick="window.MJAdmin.addPresetImage('assets/images/bedsheets-luxury.jpg')">+ 🛏 Luxury Bedsheet</button>
                    <button type="button" class="badge" style="cursor:pointer; border:1px solid var(--border-color); background:#fff;" onclick="window.MJAdmin.addPresetImage('assets/images/duvet-sage.jpg')">+ 🌿 Sage Duvet</button>
                    <button type="button" class="badge" style="cursor:pointer; border:1px solid var(--border-color); background:#fff;" onclick="window.MJAdmin.addPresetImage('assets/images/home-decor.jpg')">+ 🕯 Decor Candle</button>
                    <button type="button" class="badge" style="cursor:pointer; border:1px solid var(--border-color); background:#fff;" onclick="window.MJAdmin.addPresetImage('assets/images/linen-menswear.jpg')">+ 👔 Linen Shirt</button>
                    <button type="button" class="badge" style="cursor:pointer; border:1px solid var(--border-color); background:#fff;" onclick="window.MJAdmin.addPresetImage('assets/images/promo-seasonal.jpg')">+ 🌸 Seasonal Promo</button>
                  </div>

                  <!-- Active Image Preview Cards Grid -->
                  <div style="margin-top:1.2rem;">
                    <div style="font-size:0.8rem; font-weight:600; color:var(--color-heading); margin-bottom:0.4rem;">Selected Photos (${p ? 'Live' : 'Active'}):</div>
                    <div id="productImagePreviewContainer" style="display:flex; flex-wrap:wrap; gap:0.8rem; min-height:85px; align-items:center; background:#ffffff; padding:0.8rem; border-radius:var(--radius-xs); border:1px solid var(--border-color-light);">
                      <!-- Live rendered by renderModalImagePreviews() -->
                    </div>
                  </div>

                  <input type="hidden" name="images" id="productImagesHiddenInput" value="${JSON.stringify(this.currentModalImages)}">
                </div>

                <div class="form-group">
                  <label class="form-label">Product Description</label>
                  <textarea name="description" class="form-control" rows="3" placeholder="Describe the soft aesthetic, fit, and elegance...">${p ? p.description : ''}</textarea>
                </div>

                <div class="form-row" style="margin-top:1rem;">
                  <label class="filter-checkbox-label">
                    <input type="checkbox" name="isFeatured" ${p && p.isFeatured ? 'checked' : ''}>
                    <span>⭐ Mark as Featured on Homepage</span>
                  </label>
                  <label class="filter-checkbox-label">
                    <input type="checkbox" name="isBestSeller" ${p && p.isBestSeller ? 'checked' : ''}>
                    <span>🔥 Mark as Best Seller</span>
                  </label>
                </div>

                <div class="d-flex justify-between" style="margin-top:1.8rem; border-top:1px solid var(--border-color-light); padding-top:1.2rem;">
                  <button type="button" class="btn btn-outline" onclick="document.getElementById('adminProductEditModal').remove()">Cancel</button>
                  <button type="submit" class="btn btn-primary">${p ? 'Update Product' : 'Create Product'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      this.renderModalImagePreviews();
    },

    renderModalImagePreviews() {
      const container = document.getElementById('productImagePreviewContainer');
      const hiddenInput = document.getElementById('productImagesHiddenInput');
      if (!container) return;

      if (!this.currentModalImages || this.currentModalImages.length === 0) {
        container.innerHTML = `
          <div style="color:var(--color-text-muted); font-size:0.85rem; padding:1rem; text-align:center; width:100%;">
            No images selected yet. Click "Upload from Device" or enter a URL above.
          </div>
        `;
        if (hiddenInput) hiddenInput.value = '[]';
        return;
      }

      container.innerHTML = this.currentModalImages.map((imgSrc, idx) => `
        <div style="position:relative; width:90px; height:105px; border-radius:6px; overflow:hidden; border:2px solid ${idx === 0 ? 'var(--color-primary)' : 'var(--border-color-light)'}; box-shadow:var(--shadow-sm); background:#fdfdfd;">
          <img src="${imgSrc}" alt="Preview ${idx + 1}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='assets/images/fashion-dress.jpg'">
          
          <!-- Cover Badge -->
          ${idx === 0 ? '<span style="position:absolute; bottom:0; left:0; right:0; background:rgba(217,154,168,0.92); color:#fff; font-size:0.65rem; text-align:center; padding:2px 0; font-weight:600;">Main Cover</span>' : ''}
          
          <!-- Delete button -->
          <button type="button" onclick="window.MJAdmin.removeModalImage(${idx})" style="position:absolute; top:3px; right:3px; background:rgba(0,0,0,0.65); color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center;" title="Remove image">
            ✕
          </button>
        </div>
      `).join('');

      if (hiddenInput) {
        hiddenInput.value = JSON.stringify(this.currentModalImages);
      }
    },

    handleProductFileUpload(e) {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      let loadedCount = 0;
      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          this.currentModalImages.push(event.target.result);
          loadedCount++;
          this.renderModalImagePreviews();
          if (loadedCount === files.length) {
            window.MJToast.success(`Added ${loadedCount} photo(s) from device!`);
          }
        };
        reader.readAsDataURL(file);
      });

      // Clear input so user can select same file again if desired
      e.target.value = '';
    },

    addImageFromUrl() {
      const urlInput = document.getElementById('productImageUrlInput');
      if (!urlInput) return;
      const url = urlInput.value.trim();
      if (!url) {
        window.MJToast.error('Please enter an image URL or path.');
        return;
      }
      this.currentModalImages.push(url);
      urlInput.value = '';
      this.renderModalImagePreviews();
      window.MJToast.success('Image link added!');
    },

    addPresetImage(path) {
      if (!this.currentModalImages.includes(path)) {
        this.currentModalImages.push(path);
        this.renderModalImagePreviews();
        window.MJToast.success('Preset image added!');
      } else {
        window.MJToast.info('Image already in list.');
      }
    },

    removeModalImage(index) {
      if (this.currentModalImages.length <= 1) {
        window.MJToast.info('Product should have at least 1 image.');
      }
      this.currentModalImages.splice(index, 1);
      this.renderModalImagePreviews();
    },

    saveProduct(e, existingId) {
      e.preventDefault();
      const form = e.target;
      
      const imagesArr = (this.currentModalImages && this.currentModalImages.length > 0)
        ? this.currentModalImages
        : ['assets/images/fashion-dress.jpg'];

      const payload = {
        name: form.name.value.trim(),
        sku: form.sku.value.trim(),
        category: form.category.value,
        subcategory: form.subcategory.value.trim(),
        price: parseFloat(form.price.value),
        salePrice: form.salePrice.value ? parseFloat(form.salePrice.value) : null,
        stock: parseInt(form.stock.value),
        material: form.material.value.trim(),
        images: imagesArr,
        description: form.description.value.trim(),
        isFeatured: form.isFeatured.checked,
        isBestSeller: form.isBestSeller.checked,
        isNew: true
      };

      if (existingId) {
        window.MJProductStore.updateProduct(existingId, payload);
        window.MJToast.success(`Product "${payload.name}" updated successfully.`);
      } else {
        window.MJProductStore.addProduct(payload);
        window.MJToast.success(`Product "${payload.name}" created successfully!`);
      }

      document.getElementById('adminProductEditModal').remove();
      this.renderProducts();
    },

    deleteProduct(id) {
      const p = window.MJProductStore.getById(id);
      if (confirm(`Are you sure you want to delete "${p ? p.name : 'this product'}"?`)) {
        window.MJProductStore.deleteProduct(id);
        window.MJToast.info('Product deleted.');
        this.renderProducts();
      }
    },

    // ================= 3. INVENTORY MANAGEMENT =================
    renderInventory() {
      const container = document.getElementById('tab-inventory');
      if (!container) return;

      const products = window.MJProductStore ? window.MJProductStore.getAll() : [];

      container.innerHTML = `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3 style="font-family:var(--font-heading); font-size:1.6rem;">Real-Time Inventory & Stock Manager</h3>
              <p style="color:var(--color-text-muted); font-size:0.9rem;">Quickly adjust inventory levels, restock items, or mark products out of stock.</p>
            </div>
          </div>

          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                  <th>Quick Adjustment (+ / -)</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(p => `
                  <tr>
                    <td>
                      <div class="d-flex align-center gap-2">
                        <img src="${p.images[0]}" alt="${p.name}" class="table-thumb">
                        <strong>${p.name}</strong>
                      </div>
                    </td>
                    <td><code>${p.sku}</code></td>
                    <td>
                      <strong style="font-size:1.1rem; font-family:var(--font-accent);">${p.stock}</strong> units
                    </td>
                    <td>
                      <span class="badge ${p.stock <= 0 ? 'badge-stock-out' : (p.stock <= 5 ? 'badge-stock-low' : 'badge-success')}">
                        ${p.stock <= 0 ? 'Out of Stock' : (p.stock <= 5 ? 'Low Stock' : 'Optimal')}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                        <div class="stock-adjust-group">
                          <button class="btn-stock-adj" onclick="window.MJAdmin.adjustProductStock('${p.id}', -10)">-10</button>
                          <button class="btn-stock-adj" onclick="window.MJAdmin.adjustProductStock('${p.id}', -1)">-1</button>
                          <button class="btn-stock-adj" onclick="window.MJAdmin.adjustProductStock('${p.id}', 1)">+1</button>
                          <button class="btn-stock-adj" onclick="window.MJAdmin.adjustProductStock('${p.id}', 10)">+10</button>
                          <button class="btn-stock-adj" onclick="window.MJAdmin.adjustProductStock('${p.id}', 50)">+50</button>
                        </div>
                        <div style="display:inline-flex; align-items:center; gap:0.3rem;">
                          <input type="number" min="0" id="exactStock_${p.id}" value="${p.stock}" style="width:58px; padding:0.25rem 0.4rem; border:1px solid var(--border-color); border-radius:4px; font-size:0.85rem; text-align:center;">
                          <button class="btn btn-outline btn-sm" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="const v = parseInt(document.getElementById('exactStock_${p.id}').value); window.MJAdmin.setExactProductStock('${p.id}', v);">Set</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    adjustProductStock(productId, delta) {
      const updated = window.MJProductStore.adjustStock(productId, delta);
      if (updated) {
        window.MJToast.info(`Updated stock for ${updated.name} (Now ${updated.stock} units).`);
        this.renderInventory();
      }
    },

    setExactProductStock(productId, exactQuantity) {
      if (isNaN(exactQuantity) || exactQuantity < 0) {
        window.MJToast.error('Please enter a valid stock quantity (0 or greater).');
        return;
      }
      const p = window.MJProductStore.getById(productId);
      if (p) {
        const delta = exactQuantity - (p.stock || 0);
        const updated = window.MJProductStore.adjustStock(productId, delta);
        window.MJToast.success(`Stock for ${updated.name} set to ${updated.stock} units.`);
        this.renderInventory();
      }
    },

    // ================= 4. ORDER MANAGEMENT =================
    renderOrders() {
      const container = document.getElementById('tab-orders');
      if (!container) return;

      const orders = window.MJOrderStore ? window.MJOrderStore.getAll() : [];

      container.innerHTML = `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3 style="font-family:var(--font-heading); font-size:1.6rem;">Customer Orders Management</h3>
              <p style="color:var(--color-text-muted); font-size:0.9rem;">View orders, update delivery lifecycle status, and print invoices.</p>
            </div>
          </div>

          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer Info</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Delivery Status</th>
                  <th>Update Status</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => `
                  <tr>
                    <td>
                      <strong>#${o.id}</strong><br>
                      <small style="color:var(--color-text-muted);">${new Date(o.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <strong>${o.customer.name}</strong><br>
                      <small>${o.customer.email}</small><br>
                      <small style="color:var(--color-text-muted);">${o.customer.city || ''}, ${o.customer.country || ''}</small>
                    </td>
                    <td>${o.items.length} item(s)</td>
                    <td><strong style="color:var(--color-heading); font-size:1.05rem;">${window.MJCurrency ? window.MJCurrency.format(o.total) : `$${o.total.toFixed(2)}`}</strong></td>
                    <td>
                      <span class="table-status ${o.paymentStatus === 'Paid' ? 'status-delivered' : 'status-pending'}">
                        ${o.paymentStatus} (${o.paymentMethod.includes('Cash') ? 'COD' : 'Card'})
                      </span>
                    </td>
                    <td>
                      <span class="table-status status-${o.orderStatus.toLowerCase()}">
                        ● ${o.orderStatus}
                      </span>
                    </td>
                    <td>
                      <select class="form-control form-select" style="font-size:0.8rem; padding:0.3rem 1.6rem 0.3rem 0.5rem;" onchange="window.MJAdmin.changeOrderStatus('${o.id}', this.value)">
                        <option value="Pending" ${o.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Confirmed" ${o.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Processing" ${o.orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Shipped" ${o.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${o.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${o.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="window.MJAdmin.viewOrderDetails('${o.id}')">View Details</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    changeOrderStatus(orderId, newStatus) {
      window.MJOrderStore.updateOrderStatus(orderId, newStatus);
      window.MJToast.success(`Order #${orderId} status changed to "${newStatus}".`);
      this.renderOrders();
    },

    viewOrderDetails(orderId) {
      const o = window.MJOrderStore.getById(orderId);
      if (!o) return;

      const modalHtml = `
        <div id="adminInvoiceModal" class="modal-backdrop active">
          <div class="modal-container" style="max-width:760px;">
            <div class="modal-header">
              <h3 class="modal-title">Order Invoice #${o.id}</h3>
              <button class="modal-close-btn" onclick="document.getElementById('adminInvoiceModal').remove()">✕</button>
            </div>
            <div class="modal-body invoice-box">
              <div class="invoice-header">
                <div>
                  <h2 style="font-family:var(--font-heading); font-size:2rem; color:var(--color-heading);">MJ Lifestyle</h2>
                  <p style="font-size:0.85rem; color:var(--color-text-muted);">Invoice / Packing Slip</p>
                </div>
                <div style="text-align:right;">
                  <strong>Order ID: #${o.id}</strong><br>
                  <span style="font-size:0.85rem; color:var(--color-text-muted);">Tracking: ${o.trackingNumber}</span><br>
                  <span style="font-size:0.85rem; color:var(--color-text-muted);">Date: ${new Date(o.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div class="form-row" style="margin-bottom:1.5rem;">
                <div>
                  <h5 style="font-family:var(--font-heading); margin-bottom:0.4rem;">Customer & Shipping Address:</h5>
                  <p style="font-size:0.9rem; line-height:1.5;">
                    <strong>${o.customer.name}</strong><br>
                    ${o.customer.address}<br>
                    ${o.customer.city}, ${o.customer.country || ''} ${o.customer.postalCode || ''}<br>
                    Email: ${o.customer.email}<br>
                    Phone: ${o.customer.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <h5 style="font-family:var(--font-heading); margin-bottom:0.4rem;">Payment Details:</h5>
                  <p style="font-size:0.9rem; line-height:1.5;">
                    Method: <strong>${o.paymentMethod}</strong><br>
                    Payment Status: <strong>${o.paymentStatus}</strong><br>
                    Carrier: ${o.carrier || 'Standard Courier'}
                  </p>
                </div>
              </div>

              <table class="data-table" style="margin-bottom:1.5rem;">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Options</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${o.items.map(it => `
                    <tr>
                      <td>${it.name}</td>
                      <td>${it.size || ''} ${it.color ? `• ${it.color}` : ''}</td>
                      <td>${window.MJCurrency ? window.MJCurrency.format(it.price) : `$${it.price.toFixed(2)}`}</td>
                      <td>${it.quantity}</td>
                      <td><strong>${window.MJCurrency ? window.MJCurrency.format(it.price * it.quantity) : `$${(it.price * it.quantity).toFixed(2)}`}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.92rem; border-top:1px solid var(--border-color); padding-top:1rem; max-width:300px; margin-left:auto;">
                <div class="d-flex justify-between">
                  <span>Subtotal:</span>
                  <span>${window.MJCurrency ? window.MJCurrency.format(o.subtotal) : `$${o.subtotal.toFixed(2)}`}</span>
                </div>
                ${o.discount > 0 ? `
                  <div class="d-flex justify-between" style="color:var(--color-primary-dark);">
                    <span>Discount (${o.couponCode || 'Promo'}):</span>
                    <span>-${window.MJCurrency ? window.MJCurrency.format(o.discount) : `$${o.discount.toFixed(2)}`}</span>
                  </div>
                ` : ''}
                <div class="d-flex justify-between">
                  <span>Shipping:</span>
                  <span>${o.shipping === 0 ? 'FREE' : (window.MJCurrency ? window.MJCurrency.format(o.shipping) : `$${o.shipping.toFixed(2)}`)}</span>
                </div>
                <div class="d-flex justify-between" style="font-size:1.2rem; font-weight:700; border-top:2px solid var(--border-color); padding-top:0.5rem;">
                  <span>Grand Total:</span>
                  <span style="color:var(--color-primary-dark);">${window.MJCurrency ? window.MJCurrency.format(o.total) : `$${o.total.toFixed(2)}`}</span>
                </div>
              </div>

              <div class="d-flex justify-between align-center" style="margin-top:2rem; border-top:1px solid var(--border-color-light); padding-top:1.2rem;">
                <button class="btn btn-outline btn-sm" onclick="window.print()">🖨 Print Invoice</button>
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('adminInvoiceModal').remove()">Close</button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // ================= 5. CATEGORY MANAGEMENT =================
    renderCategories() {
      const container = document.getElementById('tab-categories');
      if (!container) return;

      const categories = window.MJProductStore.getCategories();

      container.innerHTML = `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3 style="font-family:var(--font-heading); font-size:1.6rem;">Categories & Subcategories</h3>
              <p style="color:var(--color-text-muted); font-size:0.9rem;">Organize your multi-category online store structure.</p>
            </div>
            <button class="btn btn-primary" onclick="window.MJAdmin.openCategoryModal()">
              + Add Category
            </button>
          </div>

          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Subcategories</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${categories.map(c => `
                  <tr>
                    <td>
                      <div class="d-flex align-center gap-2">
                        <img src="${c.image}" alt="${c.name}" class="table-thumb" style="width:48px; height:48px; border-radius:var(--radius-sm);">
                        <strong>${c.name}</strong>
                      </div>
                    </td>
                    <td style="max-width:300px; font-size:0.85rem; color:var(--color-text-muted);">${c.description}</td>
                    <td>
                      <div class="d-flex gap-1 flex-wrap">
                        ${c.subcategories ? c.subcategories.map(s => `<span class="badge badge-new" style="font-size:0.75rem;">${s}</span>`).join('') : ''}
                      </div>
                    </td>
                    <td>
                      <div class="table-actions">
                        <button class="btn-table" onclick="window.MJAdmin.openCategoryModal('${c.id}')">✏️</button>
                        <button class="btn-table btn-table-danger" onclick="window.MJAdmin.deleteCategory('${c.id}')">🗑</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    openCategoryModal(catId = null) {
      const c = catId ? window.MJProductStore.getCategoryById(catId) : null;

      const modalHtml = `
        <div id="adminCategoryModal" class="modal-backdrop active">
          <div class="modal-container" style="max-width:600px;">
            <div class="modal-header">
              <h3 class="modal-title">${c ? 'Edit Category' : 'Add Category'}</h3>
              <button class="modal-close-btn" onclick="document.getElementById('adminCategoryModal').remove()">✕</button>
            </div>
            <div class="modal-body">
              <form onsubmit="window.MJAdmin.saveCategory(event, '${catId || ''}')">
                <div class="form-group">
                  <label class="form-label">Category Name *</label>
                  <input type="text" name="name" class="form-control" required value="${c ? c.name : ''}" placeholder="e.g. Luxury Loungewear">
                </div>
                <div class="form-group">
                  <label class="form-label">Cover Image Asset URL *</label>
                  <input type="text" name="image" class="form-control" required value="${c ? c.image : 'assets/images/fashion-dress.jpg'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Subcategories (comma separated)</label>
                  <input type="text" name="subcategories" class="form-control" value="${c && c.subcategories ? c.subcategories.join(', ') : ''}" placeholder="Silk Pajamas, Linen Robes, Nightgowns">
                </div>
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea name="description" class="form-control" rows="2">${c ? c.description : ''}</textarea>
                </div>
                <div class="d-flex justify-between" style="margin-top:1.5rem;">
                  <button type="button" class="btn btn-outline" onclick="document.getElementById('adminCategoryModal').remove()">Cancel</button>
                  <button type="submit" class="btn btn-primary">${c ? 'Update Category' : 'Create Category'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    saveCategory(e, existingId) {
      e.preventDefault();
      const form = e.target;
      const subcats = form.subcategories.value.split(',').map(s => s.trim()).filter(Boolean);

      const data = {
        name: form.name.value.trim(),
        image: form.image.value.trim(),
        subcategories: subcats,
        description: form.description.value.trim()
      };

      if (existingId) {
        window.MJProductStore.updateCategory(existingId, data);
        window.MJToast.success(`Category "${data.name}" updated.`);
      } else {
        window.MJProductStore.addCategory(data);
        window.MJToast.success(`Category "${data.name}" created.`);
      }

      document.getElementById('adminCategoryModal').remove();
      this.renderCategories();
    },

    deleteCategory(id) {
      if (confirm('Are you sure you want to delete this category?')) {
        window.MJProductStore.deleteCategory(id);
        window.MJToast.info('Category deleted.');
        this.renderCategories();
      }
    },

    // ================= 6. CUSTOMER DIRECTORY =================
    renderCustomers() {
      const container = document.getElementById('tab-customers');
      if (!container) return;

      const customers = window.MJStorage.get('customers') || [];

      container.innerHTML = `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3 style="font-family:var(--font-heading); font-size:1.6rem;">Registered Customer Directory</h3>
              <p style="color:var(--color-text-muted); font-size:0.9rem;">View customer lifetime orders and purchase value.</p>
            </div>
          </div>

          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact Details</th>
                  <th>Joined Date</th>
                  <th>Orders Count</th>
                  <th>Total Spent</th>
                  <th>Shipping Address</th>
                </tr>
              </thead>
              <tbody>
                ${customers.map(c => `
                  <tr>
                    <td>
                      <strong>${c.name}</strong>
                    </td>
                    <td>
                      <div>${c.email}</div>
                      <small style="color:var(--color-text-muted);">${c.phone || 'No phone'}</small>
                    </td>
                    <td>${c.joinedDate || '2026-08-01'}</td>
                    <td><span class="badge badge-new">${c.totalOrders || 0} orders</span></td>
                    <td><strong style="color:var(--color-primary-dark);">$${(c.totalSpent || 0).toFixed(2)}</strong></td>
                    <td style="font-size:0.85rem; color:var(--color-text-muted); max-width:250px;">${c.address || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // ================= 7. COUPONS & DISCOUNTS =================
    renderCoupons() {
      const container = document.getElementById('tab-coupons');
      if (!container) return;

      const coupons = window.MJCouponStore ? window.MJCouponStore.getAll() : [];

      container.innerHTML = `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3 style="font-family:var(--font-heading); font-size:1.6rem;">Coupons & Promotional Rules</h3>
              <p style="color:var(--color-text-muted); font-size:0.9rem;">Create percentage or fixed discounts and manage promo codes.</p>
            </div>
            <button class="btn btn-primary" onclick="window.MJAdmin.openCouponModal()">
              + Create New Coupon
            </button>
          </div>

          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Spend</th>
                  <th>Usage Limit / Count</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${coupons.map(cp => `
                  <tr>
                    <td><strong style="font-family:var(--font-accent); color:var(--color-primary-dark); font-size:1.1rem;">${cp.code}</strong></td>
                    <td><strong>${cp.type === 'percentage' ? `${cp.value}% OFF` : `$${cp.value.toFixed(2)} OFF`}</strong></td>
                    <td>${cp.minSpend ? `$${cp.minSpend.toFixed(2)}` : 'No minimum'}</td>
                    <td>${cp.usageCount || 0} times used</td>
                    <td>${cp.expiry || '2027-12-31'}</td>
                    <td>
                      <span class="badge ${cp.isActive ? 'badge-success' : 'badge-stock-out'}">
                        ${cp.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div class="table-actions">
                        <button class="btn-table" onclick="window.MJAdmin.toggleCouponActive('${cp.id}')" title="Toggle Active">⚡</button>
                        <button class="btn-table btn-table-danger" onclick="window.MJAdmin.deleteCoupon('${cp.id}')" title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    openCouponModal() {
      const modalHtml = `
        <div id="adminCouponModal" class="modal-backdrop active">
          <div class="modal-container" style="max-width:540px;">
            <div class="modal-header">
              <h3 class="modal-title">Create New Promo Code</h3>
              <button class="modal-close-btn" onclick="document.getElementById('adminCouponModal').remove()">✕</button>
            </div>
            <div class="modal-body">
              <form onsubmit="window.MJAdmin.saveCoupon(event)">
                <div class="form-group">
                  <label class="form-label">Coupon Code *</label>
                  <input type="text" name="code" class="form-control" required placeholder="e.g. SUMMER25" style="text-transform:uppercase;">
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Discount Type *</label>
                    <select name="type" class="form-control form-select">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Discount Value *</label>
                    <input type="number" step="0.1" name="value" class="form-control" required placeholder="15">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Minimum Spend ($)</label>
                    <input type="number" step="1" name="minSpend" class="form-control" value="0" placeholder="50">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Expiry Date</label>
                    <input type="date" name="expiry" class="form-control" value="2027-12-31">
                  </div>
                </div>
                <div class="d-flex justify-between" style="margin-top:1.5rem;">
                  <button type="button" class="btn btn-outline" onclick="document.getElementById('adminCouponModal').remove()">Cancel</button>
                  <button type="submit" class="btn btn-primary">Publish Coupon</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    saveCoupon(e) {
      e.preventDefault();
      const form = e.target;
      window.MJCouponStore.addCoupon({
        code: form.code.value,
        type: form.type.value,
        value: form.value.value,
        minSpend: form.minSpend.value,
        expiry: form.expiry.value
      });
      window.MJToast.success(`Coupon "${form.code.value.toUpperCase()}" created.`);
      document.getElementById('adminCouponModal').remove();
      this.renderCoupons();
    },

    toggleCouponActive(id) {
      const coupons = window.MJCouponStore.getAll();
      const cp = coupons.find(c => c.id === id);
      if (cp) {
        window.MJCouponStore.updateCoupon(id, { isActive: !cp.isActive });
        window.MJToast.info(`Coupon ${cp.code} is now ${!cp.isActive ? 'Active' : 'Disabled'}.`);
        this.renderCoupons();
      }
    },

    deleteCoupon(id) {
      if (confirm('Delete this coupon?')) {
        window.MJCouponStore.deleteCoupon(id);
        window.MJToast.info('Coupon deleted.');
        this.renderCoupons();
      }
    },

    // ================= 8. CMS & HOMEPAGE EDITOR =================
    renderCMS() {
      const container = document.getElementById('tab-cms');
      if (!container) return;

      const cms = window.MJCmsStore.getContent();

      container.innerHTML = `
        <div class="data-card" style="margin-bottom:2rem;">
          <div class="data-card-header">
            <h3 style="font-family:var(--font-heading); font-size:1.6rem;">Homepage Visual Content Editor</h3>
            <button class="btn btn-primary btn-sm" onclick="window.MJAdmin.saveCMSForm()">Save All Changes</button>
          </div>

          <div style="padding:1.8rem;">
            <form id="adminCMSForm">
              
              <!-- Announcement Bar -->
              <h4 style="font-family:var(--font-heading); margin-bottom:0.8rem; font-size:1.3rem;">1. Announcement Top Bar</h4>
              <div class="form-row">
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label">Announcement Text</label>
                  <input type="text" id="cmsAnnText" class="form-control" value="${cms.announcement.text}">
                </div>
              </div>
              <label class="filter-checkbox-label" style="margin-bottom:1.5rem;">
                <input type="checkbox" id="cmsAnnEnabled" ${cms.announcement.enabled !== false ? 'checked' : ''}>
                <span>Enable Announcement Bar</span>
              </label>

              <hr style="border:0; border-top:1px solid var(--border-color-light); margin:1.5rem 0;">

              <!-- Hero Section -->
              <h4 style="font-family:var(--font-heading); margin-bottom:0.8rem; font-size:1.3rem;">2. Hero Main Banner</h4>
              <div class="form-group">
                <label class="form-label">Hero Headline</label>
                <input type="text" id="cmsHeroHeadline" class="form-control" value="${cms.hero.headline}">
              </div>
              <div class="form-group">
                <label class="form-label">Hero Subtitle</label>
                <textarea id="cmsHeroSubtitle" class="form-control" rows="2">${cms.hero.subtitle}</textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Primary CTA Button</label>
                  <input type="text" id="cmsHeroCtaPrimary" class="form-control" value="${cms.hero.ctaPrimaryText}">
                </div>
                <div class="form-group">
                  <label class="form-label">Secondary CTA Button</label>
                  <input type="text" id="cmsHeroCtaSecondary" class="form-control" value="${cms.hero.ctaSecondaryText}">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Hero Background Image (Upload from Laptop or Enter URL)</label>
                <div style="display:flex; gap:0.6rem; align-items:center;">
                  <input type="text" id="cmsHeroBg" class="form-control" value="${cms.hero.backgroundImage}">
                  <label class="btn btn-outline btn-sm" style="cursor:pointer; white-space:nowrap; display:inline-flex; align-items:center; gap:0.4rem;">
                    <span>📁 Upload Banner</span>
                    <input type="file" accept="image/*" style="display:none;" onchange="window.MJAdmin.handleHeroBannerUpload(event)">
                  </label>
                </div>
                <div id="cmsHeroPreview" style="margin-top:0.6rem;">
                  <img src="${cms.hero.backgroundImage}" style="width:100%; max-height:140px; object-fit:cover; border-radius:6px; border:1px solid var(--border-color-light);" onerror="this.style.display='none'">
                </div>
              </div>

              <hr style="border:0; border-top:1px solid var(--border-color-light); margin:1.5rem 0;">

              <!-- Section Toggles -->
              <h4 style="font-family:var(--font-heading); margin-bottom:0.8rem; font-size:1.3rem;">3. Homepage Section Visibility</h4>
              <div class="form-row">
                <label class="filter-checkbox-label">
                  <input type="checkbox" id="secCategories" ${cms.sections.showCategories !== false ? 'checked' : ''}>
                  <span>Show Categories Grid</span>
                </label>
                <label class="filter-checkbox-label">
                  <input type="checkbox" id="secNewArrivals" ${cms.sections.showNewArrivals !== false ? 'checked' : ''}>
                  <span>Show New Arrivals</span>
                </label>
                <label class="filter-checkbox-label">
                  <input type="checkbox" id="secPromo" ${cms.sections.showPromoSplit !== false ? 'checked' : ''}>
                  <span>Show Promotional Split Banners</span>
                </label>
                <label class="filter-checkbox-label">
                  <input type="checkbox" id="secFeatured" ${cms.sections.showFeatured !== false ? 'checked' : ''}>
                  <span>Show Featured Products</span>
                </label>
                <label class="filter-checkbox-label">
                  <input type="checkbox" id="secReviews" ${cms.sections.showReviews !== false ? 'checked' : ''}>
                  <span>Show Customer Reviews</span>
                </label>
                <label class="filter-checkbox-label">
                  <input type="checkbox" id="secInstagram" ${cms.sections.showInstagram !== false ? 'checked' : ''}>
                  <span>Show Instagram Lookbook</span>
                </label>
              </div>

              <div class="d-flex justify-between" style="margin-top:2rem; border-top:1px solid var(--border-color-light); padding-top:1.4rem;">
                <button type="button" class="btn btn-outline" onclick="window.MJCmsStore.resetToDefault(); window.MJToast.info('CMS restored to default.'); window.MJAdmin.renderCMS();">Reset CMS to Default</button>
                <button type="button" class="btn btn-primary" onclick="window.MJAdmin.saveCMSForm()">Save & Publish Homepage</button>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    saveCMSForm() {
      const annText = document.getElementById('cmsAnnText').value;
      const annEnabled = document.getElementById('cmsAnnEnabled').checked;

      const heroHead = document.getElementById('cmsHeroHeadline').value;
      const heroSub = document.getElementById('cmsHeroSubtitle').value;
      const heroCta1 = document.getElementById('cmsHeroCtaPrimary').value;
      const heroCta2 = document.getElementById('cmsHeroCtaSecondary').value;
      const heroBg = document.getElementById('cmsHeroBg').value;

      window.MJCmsStore.updateAnnouncement({ text: annText, enabled: annEnabled });
      window.MJCmsStore.updateHero({
        headline: heroHead,
        subtitle: heroSub,
        ctaPrimaryText: heroCta1,
        ctaSecondaryText: heroCta2,
        backgroundImage: heroBg
      });

      window.MJCmsStore.updateSectionVisibility({
        showCategories: document.getElementById('secCategories').checked,
        showNewArrivals: document.getElementById('secNewArrivals').checked,
        showPromoSplit: document.getElementById('secPromo').checked,
        showFeatured: document.getElementById('secFeatured').checked,
        showReviews: document.getElementById('secReviews').checked,
        showInstagram: document.getElementById('secInstagram').checked
      });

      window.MJToast.success('Homepage content and layout updated successfully!');
    },

    // ================= 9. REVIEW MODERATION =================
    renderReviews() {
      const container = document.getElementById('tab-reviews');
      if (!container) return;

      const reviews = window.MJReviewStore ? window.MJReviewStore.getAll() : [];

      container.innerHTML = `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <h3 style="font-family:var(--font-heading); font-size:1.6rem;">Customer Reviews & Ratings Moderation</h3>
              <p style="color:var(--color-text-muted); font-size:0.9rem;">Approve, moderate, or remove product reviews.</p>
            </div>
          </div>

          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${reviews.map(r => `
                  <tr>
                    <td><strong>${r.productName}</strong></td>
                    <td>${r.customerName}</td>
                    <td><span style="color:#F5A623;">${'★'.repeat(r.rating)}</span> (${r.rating}/5)</td>
                    <td style="max-width:300px; font-size:0.85rem;">"${r.comment}"</td>
                    <td>${r.date}</td>
                    <td><span class="badge ${r.status === 'approved' ? 'badge-success' : 'badge-stock-low'}">${r.status}</span></td>
                    <td>
                      <div class="table-actions">
                        ${r.status !== 'approved' ? `<button class="btn-table" onclick="window.MJReviewStore.updateReviewStatus('${r.id}', 'approved'); window.MJAdmin.renderReviews();" title="Approve">✓</button>` : ''}
                        <button class="btn-table btn-table-danger" onclick="window.MJReviewStore.deleteReview('${r.id}'); window.MJAdmin.renderReviews();" title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // ================= 10. SHIPPING SETTINGS =================
    renderShipping() {
      const container = document.getElementById('tab-shipping');
      if (!container) return;

      const settings = window.MJSettingsStore.getSettings();

      container.innerHTML = `
        <div class="data-card" style="max-width:680px;">
          <div class="data-card-header">
            <h3 style="font-family:var(--font-heading); font-size:1.6rem;">Shipping & Delivery Configuration</h3>
          </div>
          <div style="padding:1.8rem;">
            <form onsubmit="window.MJAdmin.saveShippingSettings(event)">
              <div class="form-group">
                <label class="form-label">Free Shipping Spend Threshold ($)</label>
                <input type="number" step="1" name="freeShippingThreshold" class="form-control" value="${settings.freeShippingThreshold || 75}">
                <small style="color:var(--color-text-muted);">Orders above this amount automatically receive complimentary shipping.</small>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Standard Shipping Fee ($)</label>
                  <input type="number" step="0.01" name="standardShippingFee" class="form-control" value="${settings.standardShippingFee || 9.99}">
                </div>
                <div class="form-group">
                  <label class="form-label">Express Priority Shipping Fee ($)</label>
                  <input type="number" step="0.01" name="expressShippingFee" class="form-control" value="${settings.expressShippingFee || 18.00}">
                </div>
              </div>
              <button type="submit" class="btn btn-primary" style="margin-top:1rem;">Save Shipping Rates</button>
            </form>
          </div>
        </div>
      `;
    },

    saveShippingSettings(e) {
      e.preventDefault();
      const form = e.target;
      window.MJSettingsStore.updateShipping({
        freeShippingThreshold: form.freeShippingThreshold.value,
        standardShippingFee: form.standardShippingFee.value,
        expressShippingFee: form.expressShippingFee.value
      });
      window.MJToast.success('Shipping settings saved.');
    },

    // ================= 11. GENERAL STORE & SEO SETTINGS =================
    renderSettings() {
      const container = document.getElementById('tab-settings');
      if (!container) return;

      const settings = window.MJSettingsStore.getSettings();
      const adminCreds = window.MJAuth.getAdminCredentials();

      container.innerHTML = `
        <!-- Admin Security & Password Change Card -->
        <div class="data-card" style="max-width:760px; margin-bottom:2rem;">
          <div class="data-card-header">
            <div>
              <h3 style="font-family:var(--font-heading); font-size:1.6rem;">🔐 Administrator Security & Password</h3>
              <p style="color:var(--color-text-muted); font-size:0.88rem;">Update the Admin login email and password for your client or team.</p>
            </div>
          </div>
          <div style="padding:1.8rem;">
            <form onsubmit="window.MJAdmin.saveAdminSecuritySettings(event)">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Administrator Login Email *</label>
                  <input type="email" id="settingAdminEmail" name="adminEmail" class="form-control" required value="${adminCreds.email}">
                </div>
                <div class="form-group">
                  <label class="form-label">New Password *</label>
                  <input type="text" id="settingAdminPassword" name="adminPassword" class="form-control" required value="${adminCreds.password}" placeholder="Enter new password">
                </div>
              </div>
              <button type="submit" class="btn btn-primary btn-sm" style="margin-top:0.5rem;">
                💾 Update Admin Credentials
              </button>
            </form>
          </div>
        </div>

        <!-- 💱 Multi-Currency & Store Pricing Management Card -->
        <div class="data-card" style="max-width:760px; margin-bottom:2rem;">
          <div class="data-card-header">
            <div>
              <h3 style="font-family:var(--font-heading); font-size:1.6rem;">💱 Store Default Currency & Multi-Currency System</h3>
              <p style="color:var(--color-text-muted); font-size:0.88rem;">Choose your store's default pricing currency (PKR Rupees, USD, EUR, etc.) and customize live exchange conversion rates.</p>
            </div>
          </div>
          <div style="padding:1.8rem;">
            <form onsubmit="window.MJAdmin.saveCurrencySettings(event)">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Store Default Currency *</label>
                  <select id="settingDefaultCurrency" class="form-control form-select" required>
                    <option value="PKR" ${(settings.defaultCurrency || 'PKR') === 'PKR' ? 'selected' : ''}>🇵🇰 Pakistani Rupee (PKR - Rs.)</option>
                    <option value="USD" ${settings.defaultCurrency === 'USD' ? 'selected' : ''}>🇺🇸 US Dollar (USD - $)</option>
                    <option value="EUR" ${settings.defaultCurrency === 'EUR' ? 'selected' : ''}>🇪🇺 Euro (EUR - €)</option>
                    <option value="GBP" ${settings.defaultCurrency === 'GBP' ? 'selected' : ''}>🇬🇧 British Pound (GBP - £)</option>
                    <option value="AED" ${settings.defaultCurrency === 'AED' ? 'selected' : ''}>🇦🇪 UAE Dirham (AED - د.إ)</option>
                    <option value="SAR" ${settings.defaultCurrency === 'SAR' ? 'selected' : ''}>🇸🇦 Saudi Riyal (SAR - ﷼)</option>
                  </select>
                  <small style="color:var(--color-text-muted);">This currency will be selected automatically for all new visitors.</small>
                </div>
                <div class="form-group">
                  <label class="form-label">Currency Symbol Display</label>
                  <input type="text" id="settingCurrencySymbol" class="form-control" value="${settings.currencySymbol || 'Rs. '}" placeholder="Rs. or $">
                </div>
              </div>

              <hr style="border:0; border-top:1px solid var(--border-color-light); margin:1.2rem 0;">
              <h4 style="font-family:var(--font-heading); margin-bottom:0.8rem;">Exchange Rates (Relative to Base USD)</h4>

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:1rem; margin-bottom:1.2rem;">
                <div class="form-group">
                  <label class="form-label" style="font-size:0.8rem;">1 USD = PKR (Rs.)</label>
                  <input type="number" step="0.5" id="ratePKR" class="form-control" value="${(settings.exchangeRates && settings.exchangeRates.PKR) || 280}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.8rem;">1 USD = EUR (€)</label>
                  <input type="number" step="0.01" id="rateEUR" class="form-control" value="${(settings.exchangeRates && settings.exchangeRates.EUR) || 0.92}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.8rem;">1 USD = GBP (£)</label>
                  <input type="number" step="0.01" id="rateGBP" class="form-control" value="${(settings.exchangeRates && settings.exchangeRates.GBP) || 0.79}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.8rem;">1 USD = AED</label>
                  <input type="number" step="0.01" id="rateAED" class="form-control" value="${(settings.exchangeRates && settings.exchangeRates.AED) || 3.67}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.8rem;">1 USD = SAR</label>
                  <input type="number" step="0.01" id="rateSAR" class="form-control" value="${(settings.exchangeRates && settings.exchangeRates.SAR) || 3.75}">
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-sm">
                💱 Save Currency & Exchange Rates
              </button>
            </form>
          </div>
        </div>

        <!-- General Store Settings Card -->
        <div class="data-card" style="max-width:760px;">
          <div class="data-card-header">
            <h3 style="font-family:var(--font-heading); font-size:1.6rem;">General Store Details & SEO Settings</h3>
          </div>
          <div style="padding:1.8rem;">
            <form onsubmit="window.MJAdmin.saveGeneralSettings(event)">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Store Brand Name</label>
                  <input type="text" name="storeName" class="form-control" value="${settings.storeName || 'MJ'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Store Tagline</label>
                  <input type="text" name="storeTagline" class="form-control" value="${settings.storeTagline || 'Multi-Category Luxury Living & Fashion'}">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Support Email</label>
                  <input type="email" name="contactEmail" class="form-control" value="${settings.contactEmail || 'support@mjstore.com'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Support Phone</label>
                  <input type="text" name="contactPhone" class="form-control" value="${settings.contactPhone || '+92 (300) 456-6587'}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Flagship Store Physical Address</label>
                <input type="text" name="address" class="form-control" value="${settings.address || '742 Blossom Avenue, Suite 100, Karachi / Lahore'}">
              </div>

              <hr style="border:0; border-top:1px solid var(--border-color-light); margin:1.5rem 0;">
              <h4 style="font-family:var(--font-heading); margin-bottom:0.8rem;">SEO Meta Information</h4>

              <div class="form-group">
                <label class="form-label">Meta Page Title</label>
                <input type="text" name="metaTitle" class="form-control" value="${settings.seo ? settings.seo.metaTitle : ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Meta Description</label>
                <textarea name="metaDescription" class="form-control" rows="2">${settings.seo ? settings.seo.metaDescription : ''}</textarea>
              </div>

              <div class="d-flex justify-between align-center" style="margin-top:1.5rem;">
                <button type="submit" class="btn btn-primary">Save Store Settings</button>
                <button type="button" class="btn btn-outline btn-sm" onclick="window.MJStorage.resetToDefault(); window.MJToast.info('Store reset to luxury seed catalog.'); location.reload();">
                  ↺ Reset Store Data to Default Seed
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    saveAdminSecuritySettings(e) {
      e.preventDefault();
      const email = document.getElementById('settingAdminEmail').value.trim();
      const pass = document.getElementById('settingAdminPassword').value.trim();

      if (!email || !pass) {
        window.MJToast.error('Email and password cannot be empty.');
        return;
      }

      window.MJAuth.updateAdminCredentials(email, pass);
      window.MJToast.success(`Admin credentials updated successfully! New Email: ${email}`);
    },

    saveCurrencySettings(e) {
      e.preventDefault();
      const defaultCurr = document.getElementById('settingDefaultCurrency').value;
      const currSymbol = document.getElementById('settingCurrencySymbol').value.trim();
      const pkrRate = parseFloat(document.getElementById('ratePKR').value) || 280;
      const eurRate = parseFloat(document.getElementById('rateEUR').value) || 0.92;
      const gbpRate = parseFloat(document.getElementById('rateGBP').value) || 0.79;
      const aedRate = parseFloat(document.getElementById('rateAED').value) || 3.67;
      const sarRate = parseFloat(document.getElementById('rateSAR').value) || 3.75;

      window.MJSettingsStore.updateCurrency({
        defaultCurrency: defaultCurr,
        currencySymbol: currSymbol,
        exchangeRates: {
          PKR: pkrRate,
          USD: 1,
          EUR: eurRate,
          GBP: gbpRate,
          AED: aedRate,
          SAR: sarRate
        }
      });

      if (window.MJCurrency) {
        window.MJCurrency.setActiveCurrency(defaultCurr);
      }

      window.MJToast.success(`Store currency settings saved! Default currency: ${defaultCurr}`);
    },

    saveGeneralSettings(e) {
      e.preventDefault();
      const form = e.target;
      window.MJSettingsStore.updateGeneral({
        storeName: form.storeName.value,
        storeTagline: form.storeTagline.value,
        contactEmail: form.contactEmail.value,
        contactPhone: form.contactPhone.value,
        address: form.address.value
      });
      window.MJSettingsStore.updateSEO({
        metaTitle: form.metaTitle.value,
        metaDescription: form.metaDescription.value
      });
      window.MJToast.success('Store & SEO settings updated.');
    },

    // ================= NOTIFICATIONS CENTER =================
    updateNotifications() {
      const notifs = window.MJStorage.get('notifications') || [];
      const unread = notifs.filter(n => !n.isRead).length;

      const badge = document.getElementById('adminNotifBadge');
      if (badge) {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'inline-block' : 'none';
      }
    },

    handleNewNotification(notif) {
      const notifs = window.MJStorage.get('notifications') || [];
      notifs.unshift({
        id: 'notif-' + Date.now(),
        type: notif.type || 'info',
        title: notif.title || 'Store Notification',
        message: notif.message || '',
        timestamp: 'Just now',
        isRead: false
      });
      window.MJStorage.set('notifications', notifs);
      this.updateNotifications();
      window.MJToast.info(`🔔 Admin Alert: ${notif.title}`);
    },

    openNotificationsModal() {
      const notifs = window.MJStorage.get('notifications') || [];

      const modalHtml = `
        <div id="adminNotifsModal" class="modal-backdrop active">
          <div class="modal-container" style="max-width:540px;">
            <div class="modal-header">
              <h3 class="modal-title">Admin Notifications Center</h3>
              <button class="modal-close-btn" onclick="document.getElementById('adminNotifsModal').remove()">✕</button>
            </div>
            <div class="modal-body">
              <div style="display:flex; flex-direction:column; gap:0.8rem; max-height:380px; overflow-y:auto;">
                ${notifs.map(n => `
                  <div style="background:${n.isRead ? 'var(--bg-surface)' : 'var(--bg-accent-light)'}; border:1px solid var(--border-color-light); border-radius:var(--radius-sm); padding:1rem;">
                    <div class="d-flex align-center justify-between" style="margin-bottom:0.3rem;">
                      <strong>${n.title}</strong>
                      <span style="font-size:0.75rem; color:var(--color-text-muted);">${n.timestamp}</span>
                    </div>
                    <p style="font-size:0.88rem; color:var(--color-text); margin:0;">${n.message}</p>
                  </div>
                `).join('')}
              </div>
              <div style="margin-top:1.2rem; text-align:right;">
                <button class="btn btn-outline btn-sm" onclick="window.MJAdmin.markAllNotifsRead()">Mark All Read</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    markAllNotifsRead() {
      const notifs = window.MJStorage.get('notifications') || [];
      notifs.forEach(n => n.isRead = true);
      window.MJStorage.set('notifications', notifs);
      this.updateNotifications();
      document.getElementById('adminNotifsModal').remove();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.MJAdmin.init();
    });
  } else {
    window.MJAdmin.init();
  }
})();
