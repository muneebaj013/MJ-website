// MJ Multi-Currency Engine & Real-Time Converter Module
(function() {
  const CURRENCIES = {
    PKR: { code: 'PKR', name: 'Pakistani Rupee (PKR)', symbol: 'Rs. ', rate: 280, decimals: 0 },
    USD: { code: 'USD', name: 'US Dollar (USD)', symbol: '$', rate: 1, decimals: 2 },
    EUR: { code: 'EUR', name: 'Euro (EUR)', symbol: '€', rate: 0.92, decimals: 2 },
    GBP: { code: 'GBP', name: 'British Pound (GBP)', symbol: '£', rate: 0.79, decimals: 2 },
    AED: { code: 'AED', name: 'UAE Dirham (AED)', symbol: 'AED ', rate: 3.67, decimals: 2 },
    SAR: { code: 'SAR', name: 'Saudi Riyal (SAR)', symbol: 'SAR ', rate: 3.75, decimals: 2 }
  };

  window.MJCurrency = {
    CURRENCIES,

    getRates() {
      const settings = window.MJSettingsStore ? window.MJSettingsStore.getSettings() : {};
      return settings.exchangeRates || {
        PKR: 280,
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        AED: 3.67,
        SAR: 3.75
      };
    },

    getActiveCurrency() {
      const stored = localStorage.getItem('mj_active_currency');
      if (stored && CURRENCIES[stored]) return stored;
      const settings = window.MJSettingsStore ? window.MJSettingsStore.getSettings() : {};
      return settings.defaultCurrency || 'PKR';
    },

    setActiveCurrency(code) {
      if (CURRENCIES[code]) {
        localStorage.setItem('mj_active_currency', code);
        if (window.MJStorage) {
          window.MJStorage.emit('currency:change', code);
        }
        
        // Re-render open views
        if (window.MJCatalog && typeof window.MJCatalog.render === 'function') {
          window.MJCatalog.render();
        }
        if (window.MJCart && typeof window.MJCart.render === 'function') {
          window.MJCart.render();
        }
        if (window.MJAdmin && typeof window.MJAdmin.renderCurrentTab === 'function') {
          window.MJAdmin.renderCurrentTab();
        }
        this.updateHeaderCurrencySelectors();
      }
    },

    format(amountInUSD, customCode = null) {
      if (amountInUSD === null || amountInUSD === undefined || isNaN(amountInUSD)) {
        const code = customCode || this.getActiveCurrency();
        const curr = CURRENCIES[code] || CURRENCIES.PKR;
        return `${curr.symbol}0`;
      }
      const code = customCode || this.getActiveCurrency();
      const curr = CURRENCIES[code] || CURRENCIES.PKR;
      const rates = this.getRates();
      const rate = rates[code] || curr.rate || 1;

      const converted = parseFloat(amountInUSD) * rate;
      if (curr.decimals === 0) {
        return `${curr.symbol}${Math.round(converted).toLocaleString()}`;
      } else {
        return `${curr.symbol}${converted.toFixed(curr.decimals)}`;
      }
    },

    convert(amountInUSD, customCode = null) {
      const code = customCode || this.getActiveCurrency();
      const curr = CURRENCIES[code] || CURRENCIES.PKR;
      const rates = this.getRates();
      const rate = rates[code] || curr.rate || 1;
      return parseFloat(amountInUSD) * rate;
    },

    updateHeaderCurrencySelectors() {
      const curr = this.getActiveCurrency();
      document.querySelectorAll('.currency-selector-select').forEach(sel => {
        sel.value = curr;
      });
    }
  };

  // Sync on startup
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => window.MJCurrency.updateHeaderCurrencySelectors());
    } else {
      window.MJCurrency.updateHeaderCurrencySelectors();
    }
  }
})();
