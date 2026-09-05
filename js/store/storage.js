// Storage & Reactive Event Bus
(function() {
  const STORAGE_PREFIX = 'mj_store_';

  window.MJStorage = {
    init() {
      const initial = window.MJ_INITIAL_DATA || {};
      
      const prods = this.get('products');
      if (!prods || !Array.isArray(prods) || prods.length === 0) {
        this.set('products', initial.products || []);
      } else if (initial.products && Array.isArray(initial.products)) {
        const initialMap = new Map(initial.products.map(p => [p.id, p]));
        let updated = false;
        const updatedProds = prods.map(p => {
          if (initialMap.has(p.id)) {
            const seedP = initialMap.get(p.id);
            // Always sync images array to match true product angles
            if (JSON.stringify(p.images) !== JSON.stringify(seedP.images)) {
              updated = true;
              return { ...p, images: seedP.images };
            }
          }
          return p;
        });
        const existingIds = new Set(prods.map(p => p.id));
        const missing = initial.products.filter(p => !existingIds.has(p.id));
        if (missing.length > 0 || updated) {
          this.set('products', [...updatedProds, ...missing]);
        }
      }
      
      const cats = this.get('categories');
      if (!cats || !Array.isArray(cats) || cats.length === 0) this.set('categories', initial.categories || []);

      const coups = this.get('coupons');
      if (!coups || !Array.isArray(coups) || coups.length === 0) this.set('coupons', initial.coupons || []);

      const revs = this.get('reviews');
      if (!revs || !Array.isArray(revs) || revs.length === 0) this.set('reviews', initial.reviews || []);

      const ords = this.get('orders');
      if (!ords || !Array.isArray(ords) || ords.length === 0) this.set('orders', initial.orders || []);

      const custs = this.get('customers');
      if (!custs || !Array.isArray(custs) || custs.length === 0) this.set('customers', initial.customers || []);

      const cmsData = this.get('cms');
      if (!cmsData || Object.keys(cmsData).length === 0) this.set('cms', initial.cms || {});

      const setts = this.get('settings');
      if (!setts || Object.keys(setts).length === 0) this.set('settings', initial.settings || {});

      const notifs = this.get('notifications');
      if (!notifs || !Array.isArray(notifs) || notifs.length === 0) this.set('notifications', initial.notifications || []);

      if (!this.get('cart')) this.set('cart', []);
      if (!this.get('wishlist')) this.set('wishlist', []);
    },

    get(key) {
      try {
        const item = localStorage.getItem(STORAGE_PREFIX + key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error('Storage get error for key:', key, e);
        return null;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        this.emit(`change:${key}`, value);
        this.emit('change', { key, value });
      } catch (e) {
        console.error('Storage set error for key:', key, e);
      }
    },

    remove(key) {
      localStorage.removeItem(STORAGE_PREFIX + key);
      this.emit(`change:${key}`, null);
    },

    // Event bus for reactivity
    _listeners: {},

    on(event, callback) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(callback);
    },

    off(event, callback) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    },

    emit(event, data) {
      if (this._listeners[event]) {
        this._listeners[event].forEach(cb => {
          try {
            cb(data);
          } catch (err) {
            console.error('Event listener error:', event, err);
          }
        });
      }
    },

    resetToDefault() {
      const initial = window.MJ_INITIAL_DATA || {};
      this.set('products', initial.products || []);
      this.set('categories', initial.categories || []);
      this.set('coupons', initial.coupons || []);
      this.set('reviews', initial.reviews || []);
      this.set('orders', initial.orders || []);
      this.set('customers', initial.customers || []);
      this.set('cms', initial.cms || {});
      this.set('settings', initial.settings || {});
      this.set('notifications', initial.notifications || []);
      this.set('cart', []);
      this.set('wishlist', []);
      this.emit('reset', true);
    }
  };

  // Auto initialize on script load
  window.MJStorage.init();
})();
