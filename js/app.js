// Customer Storefront Bootstrap & Master Coordinator
(function() {
  // Global Toast Notification Helper
  window.MJToast = {
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

  // Main Application Coordinator
  window.MJApp = {
    init() {
      this.initCMS();
      this.initHeader();
      this.initSearch();
      this.initNewsletter();
      this.initModalTriggers();

      if (window.MJCatalog) window.MJCatalog.init();
      if (window.MJCart) window.MJCart.updateUI();
      if (window.MJWishlist) window.MJWishlist.updateUI();

      // Reactive listener to CMS updates
      window.MJStorage.on('change:cms', () => this.initCMS());
      window.MJStorage.on('change:settings', () => this.initCMS());
    },

    initCMS() {
      const cms = window.MJCmsStore ? window.MJCmsStore.getContent() : {};
      const settings = window.MJSettingsStore ? window.MJSettingsStore.getSettings() : {};

      // 1. Announcement Bar
      const annBar = document.getElementById('announcementBar');
      const annText = document.getElementById('announcementText');
      if (annBar && cms.announcement) {
        if (cms.announcement.enabled !== false) {
          annBar.style.display = 'block';
          if (annText) {
            annText.innerHTML = `${cms.announcement.text} ${cms.announcement.link ? `<a href="${cms.announcement.link}">${cms.announcement.linkText || 'Shop Now'} →</a>` : ''}`;
          }
        } else {
          annBar.style.display = 'none';
        }
      }

      // 2. Hero Section
      const heroHeadline = document.getElementById('heroHeadline');
      const heroSubtitle = document.getElementById('heroSubtitle');
      const heroCta1 = document.getElementById('heroCtaPrimary');
      const heroCta2 = document.getElementById('heroCtaSecondary');
      const heroBg = document.getElementById('heroBgImage');

      if (cms.hero) {
        if (heroHeadline && cms.hero.headline) heroHeadline.innerHTML = cms.hero.headline;
        if (heroSubtitle && cms.hero.subtitle) heroSubtitle.textContent = cms.hero.subtitle;
        if (heroCta1 && cms.hero.ctaPrimaryText) heroCta1.textContent = cms.hero.ctaPrimaryText;
        if (heroCta2 && cms.hero.ctaSecondaryText) heroCta2.textContent = cms.hero.ctaSecondaryText;
        if (heroBg && cms.hero.backgroundImage) heroBg.src = cms.hero.backgroundImage;
      }

      // 3. Section Toggles
      if (cms.sections) {
        const setVis = (id, visible) => {
          const el = document.getElementById(id);
          if (el) el.style.display = visible !== false ? 'block' : 'none';
        };

        setVis('heroSectionWrap', cms.sections.showHero);
        setVis('categoriesSectionWrap', cms.sections.showCategories);
        setVis('newArrivalsSectionWrap', cms.sections.showNewArrivals);
        setVis('featuredSectionWrap', cms.sections.showFeatured);
        setVis('bestSellersSectionWrap', cms.sections.showBestSellers);
        setVis('promoSplitSectionWrap', cms.sections.showPromoSplit);
        setVis('whyChooseUsSectionWrap', cms.sections.showWhyChooseUs);
        setVis('customerReviewsSectionWrap', cms.sections.showReviews);
        setVis('instagramSectionWrap', cms.sections.showInstagram);
        setVis('newsletterSectionWrap', cms.sections.showNewsletter);
      }

      // 4. Store Branding Info
      if (settings.storeName) {
        document.querySelectorAll('.store-brand-name').forEach(el => el.textContent = settings.storeName);
      }
      if (settings.contactEmail) {
        document.querySelectorAll('.store-contact-email').forEach(el => el.textContent = settings.contactEmail);
      }
      if (settings.contactPhone) {
        document.querySelectorAll('.store-contact-phone').forEach(el => el.textContent = settings.contactPhone);
      }
      if (settings.address) {
        document.querySelectorAll('.store-address').forEach(el => el.textContent = settings.address);
      }
    },

    initHeader() {
      // Sticky header scroll detection
      const header = document.getElementById('siteHeader');
      window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });

      // Mobile Menu Drawer
      const mobileToggle = document.getElementById('mobileMenuToggle');
      const mobileDrawer = document.getElementById('mobileMenuDrawer');
      const mobileClose = document.getElementById('mobileMenuClose');

      if (mobileToggle && mobileDrawer) {
        mobileToggle.addEventListener('click', () => mobileDrawer.classList.add('active'));
      }
      if (mobileClose && mobileDrawer) {
        mobileClose.addEventListener('click', () => mobileDrawer.classList.remove('active'));
      }
    },

    initSearch() {
      const searchTrigger = document.getElementById('searchBtnToggle');
      const searchOverlay = document.getElementById('searchDrawerOverlay');
      const searchInput = document.getElementById('headerSearchInput');
      const searchSuggestions = document.getElementById('headerSearchSuggestions');

      if (searchTrigger && searchOverlay) {
        searchTrigger.addEventListener('click', (e) => {
          e.stopPropagation();
          searchOverlay.classList.toggle('active');
          if (searchOverlay.classList.contains('active') && searchInput) {
            searchInput.focus();
          }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
          if (!searchOverlay.contains(e.target) && e.target !== searchTrigger) {
            searchOverlay.classList.remove('active');
          }
        });
      }

      if (searchInput && searchSuggestions) {
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.trim().toLowerCase();
          if (query.length === 0) {
            searchSuggestions.innerHTML = '';
            return;
          }

          const results = window.MJProductStore.getAll().filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            (p.subcategory && p.subcategory.toLowerCase().includes(query))
          ).slice(0, 4);

          if (results.length === 0) {
            searchSuggestions.innerHTML = `<div style="padding:0.8rem; font-size:0.85rem; color:var(--color-text-muted);">No products found for "${query}".</div>`;
          } else {
            searchSuggestions.innerHTML = results.map(p => `
              <div class="search-suggestion-item" onclick="window.MJProductModal.open('${p.id}'); document.getElementById('searchDrawerOverlay').classList.remove('active');">
                <img src="${p.images[0]}" alt="${p.name}" class="search-suggestion-thumb">
                <div>
                  <div style="font-size:0.88rem; font-weight:600; font-family:var(--font-heading);">${p.name}</div>
                  <div style="font-size:0.8rem; color:var(--color-primary-dark); font-weight:700;">${window.MJCurrency ? window.MJCurrency.format(p.salePrice || p.price) : `$${(p.salePrice || p.price).toFixed(2)}`}</div>
                </div>
              </div>
            `).join('') + `
              <div style="text-align:center; padding-top:0.8rem;">
                <button class="btn btn-primary btn-sm w-100" onclick="window.MJCatalog.setSearch('${query}'); document.getElementById('searchDrawerOverlay').classList.remove('active'); document.getElementById('shopSection').scrollIntoView({behavior:'smooth'});">
                  View All Search Results →
                </button>
              </div>
            `;
          }
        });
      }
    },

    initNewsletter() {
      const form = document.getElementById('newsletterForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const emailInput = form.querySelector('input[type="email"]');
          const email = emailInput ? emailInput.value : '';
          window.MJToast.success(`Welcome to the MJ Circle, ${email}! Use coupon code WELCOME10 for 10% off.`);
          form.reset();
        });
      }
    },

    initModalTriggers() {
      // Backdrop click to close modals
      document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) {
            backdrop.classList.remove('active');
          }
        });
      });

      // Escape key to close all modals and drawers
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.querySelectorAll('.modal-backdrop.active, .drawer-backdrop.active').forEach(el => {
            el.classList.remove('active');
          });
        }

        // Quick Admin Shortcut: Ctrl+Shift+A or Alt+A
        if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || (e.altKey && (e.key === 'A' || e.key === 'a'))) {
          e.preventDefault();
          window.location.href = 'admin.html';
        }
      });

      // Quick Hash routing for #admin
      if (window.location.hash === '#admin') {
        window.location.href = 'admin.html';
      }
      window.addEventListener('hashchange', () => {
        if (window.location.hash === '#admin') {
          window.location.href = 'admin.html';
        }
      });
    }
  };

  // Bootstrap when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.MJApp.init();
    });
  } else {
    window.MJApp.init();
  }
})();
