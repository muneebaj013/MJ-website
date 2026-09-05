// Shop Catalog & Product Grid Renderer
(function() {
  window.MJCatalog = {
    currentFilters: {
      search: '',
      category: 'all',
      subcategory: 'all',
      minPrice: 0,
      maxPrice: 200,
      inStockOnly: false,
      sortBy: 'bestselling'
    },

    init() {
      this.bindFilterEvents();
      this.renderCatalog();
      this.renderHomeSections();
    },

    bindFilterEvents() {
      // Category filter clicks
      document.addEventListener('click', (e) => {
        const catBtn = e.target.closest('[data-filter-category]');
        if (catBtn) {
          e.preventDefault();
          const cat = catBtn.getAttribute('data-filter-category');
          this.setCategory(cat);
          const shopSection = document.getElementById('shopSection');
          if (shopSection) {
            shopSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });

      // Price slider
      const priceSlider = document.getElementById('priceRangeSlider');
      const maxPriceDisplay = document.getElementById('maxPriceVal');
      if (priceSlider) {
        priceSlider.addEventListener('input', (e) => {
          this.currentFilters.maxPrice = parseFloat(e.target.value);
          if (maxPriceDisplay) maxPriceDisplay.textContent = `$${this.currentFilters.maxPrice}`;
          this.renderCatalog();
        });
      }

      // In stock checkbox
      const stockCheckbox = document.getElementById('inStockFilter');
      if (stockCheckbox) {
        stockCheckbox.addEventListener('change', (e) => {
          this.currentFilters.inStockOnly = e.target.checked;
          this.renderCatalog();
        });
      }

      // Sort by select
      const sortSelect = document.getElementById('catalogSortSelect');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          this.currentFilters.sortBy = e.target.value;
          this.renderCatalog();
        });
      }
    },

    setCategory(categoryName) {
      this.currentFilters.category = categoryName;
      this.currentFilters.subcategory = 'all';
      this.updateActiveFilterPills();
      this.renderCatalog();
    },

    setSubcategory(subcatName) {
      this.currentFilters.subcategory = subcatName;
      this.updateActiveFilterPills();
      this.renderCatalog();
    },

    setSearch(query) {
      this.currentFilters.search = query;
      this.renderCatalog();
    },

    resetFilters() {
      this.currentFilters = {
        search: '',
        category: 'all',
        subcategory: 'all',
        minPrice: 0,
        maxPrice: 200,
        inStockOnly: false,
        sortBy: 'bestselling'
      };
      this.updateActiveFilterPills();
      this.renderCatalog();
    },

    updateActiveFilterPills() {
      const pillsContainer = document.getElementById('activeFilterPills');
      if (!pillsContainer) return;

      let pillsHtml = '';
      if (this.currentFilters.category !== 'all') {
        pillsHtml += `<span class="filter-chip">Category: ${this.currentFilters.category} <button onclick="window.MJCatalog.setCategory('all')">✕</button></span>`;
      }
      if (this.currentFilters.subcategory !== 'all') {
        pillsHtml += `<span class="filter-chip">Subcategory: ${this.currentFilters.subcategory} <button onclick="window.MJCatalog.setSubcategory('all')">✕</button></span>`;
      }
      if (this.currentFilters.search) {
        pillsHtml += `<span class="filter-chip">Search: "${this.currentFilters.search}" <button onclick="window.MJCatalog.setSearch('')">✕</button></span>`;
      }
      if (this.currentFilters.inStockOnly) {
        pillsHtml += `<span class="filter-chip">In Stock Only <button onclick="document.getElementById('inStockFilter').checked=false; window.MJCatalog.currentFilters.inStockOnly=false; window.MJCatalog.renderCatalog();">✕</button></span>`;
      }

      if (pillsHtml) {
        pillsHtml += `<button class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:0.25rem 0.6rem;" onclick="window.MJCatalog.resetFilters()">Clear All</button>`;
      }

      pillsContainer.innerHTML = pillsHtml;
    },

    renderProductCard(product) {
      const isWishlisted = window.MJWishlist ? window.MJWishlist.isInWishlist(product.id) : false;
      const discountPercent = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
      const isOutOfStock = product.stock <= 0;
      const primaryImage = (product.images && product.images[0]) || 'assets/images/fashion-dress.jpg';
      const secondaryImage = (product.images && product.images[1]) || primaryImage;

      return `
        <div class="product-card" data-product-id="${product.id}">
          <div class="product-card-media">
            <img src="${primaryImage}" alt="${product.name}" loading="lazy" class="product-img-main">
            
            <div class="product-card-badges">
              ${discountPercent > 0 ? `<span class="badge badge-sale">-${discountPercent}%</span>` : ''}
              ${product.isNew ? `<span class="badge badge-new">New</span>` : ''}
              ${product.isBestSeller ? `<span class="badge badge-best">Best Seller</span>` : ''}
              ${isOutOfStock ? `<span class="badge badge-stock-out">Out of Stock</span>` : ''}
            </div>

            <div class="product-card-actions">
              <button class="product-card-action-btn btn-wishlist-toggle ${isWishlisted ? 'active' : ''}" 
                      data-product-id="${product.id}" 
                      onclick="window.MJWishlist.toggle('${product.id}')"
                      title="Add to Wishlist">
                ${isWishlisted ? '♥' : '♡'}
              </button>
              <button class="product-card-action-btn" 
                      onclick="window.MJProductModal.open('${product.id}')" 
                      title="Quick View">
                👁
              </button>
            </div>

            <div class="product-card-quick-add">
              <button class="btn btn-primary w-100 btn-sm" 
                      ${isOutOfStock ? 'disabled style="opacity:0.6;"' : ''}
                      onclick="window.MJCatalog.quickAdd('${product.id}')">
                ${isOutOfStock ? 'Out of Stock' : 'Quick Add +'}
              </button>
            </div>
          </div>

          <div class="product-card-body">
            <span class="product-card-category">${product.category} ${product.subcategory ? `• ${product.subcategory}` : ''}</span>
            <h3 class="product-card-title" onclick="window.MJProductModal.open('${product.id}')" style="cursor:pointer;">
              ${product.name}
            </h3>

            <div class="product-card-rating">
              <span>★</span> ${product.rating.toFixed(1)} <span>(${product.reviewCount || 0})</span>
            </div>

            <div class="product-card-price-row">
              <div class="product-card-price">
                <span class="price-current">${window.MJCurrency ? window.MJCurrency.format(product.salePrice || product.price) : `$${(product.salePrice || product.price).toFixed(2)}`}</span>
                ${product.salePrice ? `<span class="price-old">${window.MJCurrency ? window.MJCurrency.format(product.price) : `$${product.price.toFixed(2)}`}</span>` : ''}
              </div>
              <button class="btn btn-outline btn-sm" onclick="window.MJProductModal.open('${product.id}')">
                Details
              </button>
            </div>
          </div>
        </div>
      `;
    },

    quickAdd(productId) {
      const product = window.MJProductStore.getById(productId);
      if (product) {
        if (product.stock <= 0) {
          window.MJToast.error('Sorry, this item is currently out of stock.');
          return;
        }
        window.MJCart.addItem(product, {}, 1);
      }
    },

    renderCatalog() {
      const grid = document.getElementById('catalogGrid');
      const countEl = document.getElementById('catalogCount');
      if (!grid) return;

      const filtered = window.MJProductStore.filterProducts(this.currentFilters);

      if (countEl) {
        countEl.textContent = `Showing ${filtered.length} products`;
      }

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align:center; padding: 4rem 2rem; background: var(--bg-surface); border-radius: var(--radius-md);">
            <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--color-primary);">🌸</div>
            <h3 style="font-family: var(--font-heading); margin-bottom: 0.5rem;">No products match your criteria</h3>
            <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Try adjusting your search terms or filters.</p>
            <button class="btn btn-primary" onclick="window.MJCatalog.resetFilters()">Reset All Filters</button>
          </div>
        `;
      } else {
        grid.innerHTML = filtered.map(p => this.renderProductCard(p)).join('');
      }

      this.updateActiveFilterPills();
    },

    renderHomeSections() {
      // New Arrivals Grid
      const newArrivalsGrid = document.getElementById('newArrivalsGrid');
      if (newArrivalsGrid) {
        const newArrivals = window.MJProductStore.getNewArrivals().slice(0, 4);
        newArrivalsGrid.innerHTML = newArrivals.map(p => this.renderProductCard(p)).join('');
      }

      // Featured Products Grid
      const featuredGrid = document.getElementById('featuredProductsGrid');
      if (featuredGrid) {
        const featured = window.MJProductStore.getFeatured().slice(0, 4);
        featuredGrid.innerHTML = featured.map(p => this.renderProductCard(p)).join('');
      }

      // Best Sellers Grid
      const bestSellersGrid = document.getElementById('bestSellersGrid');
      if (bestSellersGrid) {
        const bestSellers = window.MJProductStore.getBestSellers().slice(0, 4);
        bestSellersGrid.innerHTML = bestSellers.map(p => this.renderProductCard(p)).join('');
      }

      // Categories Grid
      const catGrid = document.getElementById('categoriesGrid');
      if (catGrid) {
        const categories = window.MJProductStore.getCategories();
        catGrid.innerHTML = categories.map(cat => `
          <div class="category-card" data-filter-category="${cat.name}">
            <img src="${cat.image}" alt="${cat.name}" class="category-card-img" loading="lazy">
            <div class="category-card-overlay">
              <h3 class="category-card-name">${cat.name}</h3>
              <p class="category-card-count">${cat.subcategories ? cat.subcategories.join(' • ') : ''}</p>
              <span class="category-card-link">Explore Collection →</span>
            </div>
          </div>
        `).join('');
      }

      // Customer Reviews Slider / Grid
      const reviewsGrid = document.getElementById('customerReviewsGrid');
      if (reviewsGrid && window.MJReviewStore) {
        const reviews = window.MJReviewStore.getApproved().slice(0, 3);
        reviewsGrid.innerHTML = reviews.map(r => `
          <div class="review-card">
            <div class="review-stars">${'★'.repeat(r.rating)}</div>
            <p class="review-text">"${r.comment}"</p>
            <div class="review-author">
              <div class="author-avatar">${r.customerName.charAt(0)}</div>
              <div class="author-info">
                <h5>${r.customerName}</h5>
                <span>✓ Verified Customer • ${r.productName}</span>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  };

  // Re-render catalog whenever storage updates
  window.MJStorage.on('change:products', () => {
    window.MJCatalog.renderCatalog();
    window.MJCatalog.renderHomeSections();
  });
})();
