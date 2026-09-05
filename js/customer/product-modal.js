// Product Detail Modal & Gallery Zoom Module
(function() {
  window.MJProductModal = {
    currentProduct: null,
    selectedSize: null,
    selectedColor: null,
    currentQuantity: 1,

    open(productId) {
      const product = window.MJProductStore.getById(productId);
      if (!product) return;

      this.currentProduct = product;
      this.selectedSize = (product.sizes && product.sizes[0]) || 'Standard';
      this.selectedColor = (product.colors && product.colors[0].name) || 'Default';
      this.currentQuantity = 1;

      this.render();

      const modal = document.getElementById('productDetailModal');
      if (modal) modal.classList.add('active');
    },

    close() {
      const modal = document.getElementById('productDetailModal');
      if (modal) modal.classList.remove('active');
    },

    render() {
      const p = this.currentProduct;
      const modalBody = document.getElementById('productModalBody');
      if (!modalBody || !p) return;

      const isWishlisted = window.MJWishlist ? window.MJWishlist.isInWishlist(p.id) : false;
      const images = p.images && p.images.length ? p.images : ['assets/images/fashion-dress.jpg'];
      const isOutOfStock = p.stock <= 0;
      const reviews = window.MJReviewStore ? window.MJReviewStore.getByProductId(p.id) : [];

      // Companion product for bundle
      const allProducts = window.MJProductStore.getAll();
      const companion = allProducts.find(item => item.id !== p.id && item.category !== p.category) || allProducts[0];

      modalBody.innerHTML = `
        <div class="product-detail-grid">
          <!-- Gallery -->
          <div class="product-gallery">
            <div class="gallery-main-image" id="zoomMainWrap" style="position:relative;">
              <img id="mainDetailImage" src="${images[0]}" alt="${p.name}" style="transition: opacity 0.25s ease;">
              
              ${images.length > 1 ? `
                <button type="button" class="gallery-nav-btn prev" onclick="window.MJProductModal.prevImage()" title="Previous Angle" aria-label="Previous image" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.85); border:1px solid rgba(0,0,0,0.1); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:18px; box-shadow:0 2px 8px rgba(0,0,0,0.15); z-index:10;">‹</button>
                <button type="button" class="gallery-nav-btn next" onclick="window.MJProductModal.nextImage()" title="Next Angle" aria-label="Next image" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.85); border:1px solid rgba(0,0,0,0.1); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:18px; box-shadow:0 2px 8px rgba(0,0,0,0.15); z-index:10;">›</button>
                <div id="galleryAngleBadge" style="position:absolute; bottom:12px; right:12px; background:rgba(0,0,0,0.6); color:#fff; font-size:0.75rem; padding:3px 8px; border-radius:12px; pointer-events:none; z-index:10;">Angle 1 of ${images.length}</div>
              ` : ''}
            </div>
            ${images.length > 1 ? `
              <div class="gallery-thumbnails">
                ${images.map((img, idx) => `
                  <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" data-index="${idx}" onclick="window.MJProductModal.switchImage('${img}', this, ${idx})">
                    <img src="${img}" alt="${p.name} angle ${idx + 1}">
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Info & Selection -->
          <div class="product-detail-info">
            <div>
              <span class="product-card-category">${p.category} ${p.subcategory ? `• ${p.subcategory}` : ''}</span>
              <h2 class="product-detail-title">${p.name}</h2>
              <div class="d-flex align-center gap-2" style="margin-top: 6px;">
                <div class="product-card-rating">
                  <span>★</span> ${p.rating.toFixed(1)} <span>(${p.reviewCount} customer reviews)</span>
                </div>
                <span style="font-size:0.85rem; color:var(--color-text-muted);">SKU: ${p.sku}</span>
              </div>
            </div>

            <div class="product-detail-price">
              <span class="price-current" style="color:var(--color-primary-dark); font-size:1.8rem;">${window.MJCurrency ? window.MJCurrency.format(p.salePrice || p.price) : `$${(p.salePrice || p.price).toFixed(2)}`}</span>
              ${p.salePrice ? `<span class="price-old" style="font-size:1.2rem;">${window.MJCurrency ? window.MJCurrency.format(p.price) : `$${p.price.toFixed(2)}`}</span>` : ''}
              ${p.salePrice ? `<span class="badge badge-sale">Save ${window.MJCurrency ? window.MJCurrency.format(p.price - p.salePrice) : `$${(p.price - p.salePrice).toFixed(2)}`}</span>` : ''}
            </div>

            <p style="color:var(--color-text-muted); font-size:0.96rem; line-height:1.6;">${p.description}</p>

            <!-- Color Swatches -->
            ${p.colors && p.colors.length ? `
              <div>
                <label class="form-label">Color: <strong id="selectedColorText">${this.selectedColor}</strong></label>
                <div class="swatch-group">
                  ${p.colors.map(c => `
                    <div class="swatch-color ${c.name === this.selectedColor ? 'active' : ''}" 
                         style="background-color: ${c.hex};" 
                         title="${c.name}"
                         onclick="window.MJProductModal.selectColor('${c.name}', this)"></div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Size Selection -->
            ${p.sizes && p.sizes.length ? `
              <div>
                <label class="form-label">Size: <strong id="selectedSizeText">${this.selectedSize}</strong></label>
                <div class="size-group">
                  ${p.sizes.map(s => `
                    <button type="button" 
                            class="size-pill ${s === this.selectedSize ? 'active' : ''}"
                            onclick="window.MJProductModal.selectSize('${s}', this)">${s}</button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Quantity & Add to Cart -->
            <div class="d-flex align-center gap-2" style="margin-top: 1.5rem;">
              <div class="quantity-control" style="height: 48px;">
                <button class="quantity-btn" onclick="window.MJProductModal.changeQty(-1)">−</button>
                <span id="modalQtyDisplay" class="quantity-input">1</span>
                <button class="quantity-btn" onclick="window.MJProductModal.changeQty(1)">+</button>
              </div>
              <button class="btn btn-primary btn-lg flex-grow" onclick="window.MJProductModal.addToCart('${p.id}')">
                Add to Shopping Bag
              </button>
            </div>

            <!-- Direct Buy Now Button -->
            <button class="btn btn-secondary btn-lg w-100" style="margin-top:0.8rem;" onclick="window.MJProductModal.buyNow('${p.id}')">
              ⚡ Instant Checkout (Buy Now)
            </button>

            <!-- Cross-Sell Companion -->
            ${companion ? `
              <div style="margin-top:1.8rem; background:var(--bg-subtle); padding:1rem 1.2rem; border-radius:var(--radius-sm); border:1px dashed var(--color-primary);">
                <div style="font-size:0.82rem; font-weight:700; text-transform:uppercase; color:var(--color-primary-dark); margin-bottom:0.4rem;">
                  ✨ Frequently Bought Together Bundle
                </div>
                <div class="d-flex align-center justify-between gap-2">
                  <div class="d-flex align-center gap-2">
                    <img src="${companion.images[0]}" alt="${companion.name}" style="width:48px; height:48px; border-radius:4px; object-fit:cover;">
                    <div>
                      <div style="font-size:0.88rem; font-weight:600; font-family:var(--font-heading);">${companion.name}</div>
                      <div style="font-size:0.82rem; color:var(--color-primary-dark); font-weight:700;">Bundle Price: ${window.MJCurrency ? window.MJCurrency.format(companion.salePrice || companion.price) : `$${(companion.salePrice || companion.price).toFixed(2)}`}</div>
                    </div>
                  </div>
                  <button class="btn btn-soft btn-sm" onclick="window.MJCart.addItem(window.MJProductStore.getById('${companion.id}'), {}, 1)">
                    + Add Bundle
                  </button>
                </div>
              </div>
            ` : ''}

            <!-- Accordion Tabs -->
            <div class="product-accordion">
              <div class="accordion-item active">
                <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                  <span>Product Specifications</span>
                  <span>▼</span>
                </div>
                <div class="accordion-content">
                  <ul style="list-style: disc; padding-left: 1.2rem; display:flex; flex-direction:column; gap:0.4rem;">
                    ${p.specs ? p.specs.map(s => `<li>${s}</li>`).join('') : `<li>Material: ${p.material}</li>`}
                  </ul>
                </div>
              </div>

              <div class="accordion-item">
                <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                  <span>Shipping & 14-Day Returns</span>
                  <span>▼</span>
                </div>
                <div class="accordion-content">
                  <p>🚚 <strong>Fast Delivery:</strong> 2-4 business days across major cities.</p>
                  <p>✨ <strong>Free Shipping:</strong> Automatically applied on orders above $75.</p>
                  <p>🔄 <strong>Hassle-Free 14-Day Returns:</strong> If you are not 100% delighted with your purchase, initiate an easy return through your customer dashboard.</p>
                </div>
              </div>

              <div class="accordion-item">
                <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                  <span>Customer Reviews (${reviews.length})</span>
                  <span>▼</span>
                </div>
                <div class="accordion-content">
                  ${reviews.length > 0 ? `
                    <div style="display:flex; flex-direction:column; gap:0.8rem; margin-bottom:1.2rem;">
                      ${reviews.map(r => `
                        <div style="background:var(--bg-surface); padding:0.8rem; border-radius:var(--radius-xs); border:1px solid var(--border-color-light);">
                          <div class="d-flex align-center justify-between">
                            <strong>${r.customerName}</strong>
                            <span style="color:#F5A623; font-size:0.85rem;">${'★'.repeat(r.rating)}</span>
                          </div>
                          <p style="font-size:0.88rem; margin-top:0.4rem; color:var(--color-text);">${r.comment}</p>
                        </div>
                      `).join('')}
                    </div>
                  ` : `<p style="font-size:0.88rem; color:var(--color-text-muted);">No reviews yet. Be the first to review this product!</p>`}

                  <!-- Write a Review Form -->
                  <form onsubmit="window.MJProductModal.submitReview(event)" style="background:var(--bg-subtle); padding:1rem; border-radius:var(--radius-sm); margin-top:1rem;">
                    <h5 style="font-family:var(--font-heading); margin-bottom:0.6rem;">Write a Verified Review</h5>
                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label" style="font-size:0.8rem;">Your Name</label>
                        <input type="text" class="form-control" name="author" required placeholder="Jane Doe">
                      </div>
                      <div class="form-group">
                        <label class="form-label" style="font-size:0.8rem;">Rating</label>
                        <select class="form-control form-select" name="rating">
                          <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                          <option value="4">⭐⭐⭐⭐ (4/5)</option>
                          <option value="3">⭐⭐⭐ (3/5)</option>
                          <option value="2">⭐⭐ (2/5)</option>
                          <option value="1">⭐ (1/5)</option>
                        </select>
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label" style="font-size:0.8rem;">Your Review</label>
                      <textarea class="form-control" name="comment" rows="2" required placeholder="What did you love about this product?"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm">Submit Review</button>
                  </form>
                </div>
              </div>
            </div>

          </div>
        </div>
      `;

      this.initZoom();
    },

    currentImageIndex: 0,

    switchImage(imgSrc, thumbEl, idx = 0) {
      this.currentImageIndex = idx;
      const mainImg = document.getElementById('mainDetailImage');
      if (mainImg) {
        mainImg.style.opacity = '0.4';
        setTimeout(() => {
          mainImg.src = imgSrc;
          mainImg.style.opacity = '1';
        }, 120);
      }
      document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      if (thumbEl) {
        thumbEl.classList.add('active');
      } else {
        const thumbs = document.querySelectorAll('.gallery-thumb');
        if (thumbs[idx]) thumbs[idx].classList.add('active');
      }
      const badge = document.getElementById('galleryAngleBadge');
      const images = (this.currentProduct && this.currentProduct.images) ? this.currentProduct.images : [];
      if (badge && images.length) {
        badge.textContent = `Angle ${idx + 1} of ${images.length}`;
      }
    },

    nextImage() {
      const images = (this.currentProduct && this.currentProduct.images) ? this.currentProduct.images : [];
      if (images.length <= 1) return;
      let nextIdx = (this.currentImageIndex + 1) % images.length;
      this.switchImage(images[nextIdx], null, nextIdx);
    },

    prevImage() {
      const images = (this.currentProduct && this.currentProduct.images) ? this.currentProduct.images : [];
      if (images.length <= 1) return;
      let prevIdx = (this.currentImageIndex - 1 + images.length) % images.length;
      this.switchImage(images[prevIdx], null, prevIdx);
    },

    selectColor(colorName, el) {
      this.selectedColor = colorName;
      const textEl = document.getElementById('selectedColorText');
      if (textEl) textEl.textContent = colorName;
      document.querySelectorAll('.swatch-color').forEach(s => s.classList.remove('active'));
      if (el) el.classList.add('active');
    },

    selectSize(sizeName, el) {
      this.selectedSize = sizeName;
      const textEl = document.getElementById('selectedSizeText');
      if (textEl) textEl.textContent = sizeName;
      document.querySelectorAll('.chip-size').forEach(s => s.classList.remove('active'));
      if (el) el.classList.add('active');
    },

    changeQty(delta) {
      this.currentQuantity = Math.max(1, this.currentQuantity + delta);
      const disp = document.getElementById('modalQtyDisplay');
      if (disp) disp.textContent = this.currentQuantity;
    },

    addToCart() {
      if (!this.currentProduct) return;
      if (this.currentProduct.stock <= 0) {
        window.MJToast.error('Sorry, this product is out of stock.');
        return;
      }
      window.MJCart.addItem(this.currentProduct, {
        size: this.selectedSize,
        color: this.selectedColor
      }, this.currentQuantity);
      this.close();
    },

    buyNow() {
      if (!this.currentProduct) return;
      this.addToCart();
      this.close();
      if (window.MJCheckout) {
        window.MJCheckout.open();
      }
    },

    submitReview(e) {
      e.preventDefault();
      const form = e.target;
      const author = form.author.value.trim();
      const rating = parseInt(form.rating.value);
      const comment = form.comment.value.trim();

      if (window.MJReviewStore && this.currentProduct) {
        window.MJReviewStore.addReview({
          productId: this.currentProduct.id,
          productName: this.currentProduct.name,
          customerName: author,
          rating: rating,
          comment: comment,
          status: 'pending' // Moderation queue
        });
        form.reset();
        window.MJToast.success('Thank you! Your review has been submitted for admin approval.');
        this.render(); // Refresh modal view
      }
    },

    initZoom() {
      const wrap = document.getElementById('zoomMainWrap');
      const img = document.getElementById('mainDetailImage');
      if (!wrap || !img) return;

      wrap.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
        img.style.transform = 'scale(1.7)';
      });

      wrap.addEventListener('mouseleave', () => {
        img.style.transformOrigin = 'center center';
        img.style.transform = 'scale(1)';
      });
    }
  };
})();
