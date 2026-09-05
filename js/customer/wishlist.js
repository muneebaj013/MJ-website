// Customer Wishlist Module
(function() {
  window.MJWishlist = {
    getItems() {
      return window.MJStorage.get('wishlist') || [];
    },

    isInWishlist(productId) {
      return this.getItems().some(id => id === productId);
    },

    toggle(productId) {
      let wishlist = this.getItems();
      const exists = wishlist.includes(productId);
      const product = window.MJProductStore.getById(productId);

      if (exists) {
        wishlist = wishlist.filter(id => id !== productId);
        window.MJToast.info(`Removed ${product ? product.name : 'item'} from wishlist.`);
      } else {
        wishlist.push(productId);
        window.MJToast.success(`Added ${product ? product.name : 'item'} to your wishlist! ❤️`);
      }

      window.MJStorage.set('wishlist', wishlist);
      this.updateUI();
      return !exists;
    },

    moveToCart(productId) {
      const product = window.MJProductStore.getById(productId);
      if (product) {
        window.MJCart.addItem(product, {}, 1);
        this.toggle(productId); // remove from wishlist
      }
    },

    updateUI() {
      const items = this.getItems();

      // Update badge counts
      document.querySelectorAll('.wishlist-count-badge').forEach(el => {
        el.textContent = items.length;
        el.style.display = items.length > 0 ? 'flex' : 'none';
      });

      // Update heart button states
      document.querySelectorAll('.btn-wishlist-toggle').forEach(btn => {
        const prodId = btn.getAttribute('data-product-id');
        if (prodId) {
          if (this.isInWishlist(prodId)) {
            btn.classList.add('active');
            btn.style.color = '#D99AA8';
            btn.innerHTML = '♥';
          } else {
            btn.classList.remove('active');
            btn.style.color = '';
            btn.innerHTML = '♡';
          }
        }
      });
    }
  };

  window.MJStorage.on('change:wishlist', () => window.MJWishlist.updateUI());
})();
