// Store Settings and Shipping Store Module
(function() {
  window.MJSettingsStore = {
    getSettings() {
      return window.MJStorage.get('settings') || (window.MJ_INITIAL_DATA ? window.MJ_INITIAL_DATA.settings : {});
    },

    updateGeneral(generalData) {
      const settings = this.getSettings();
      Object.assign(settings, generalData);
      window.MJStorage.set('settings', settings);
      return settings;
    },

    updateShipping(shippingData) {
      const settings = this.getSettings();
      settings.freeShippingThreshold = parseFloat(shippingData.freeShippingThreshold) || 75.00;
      settings.standardShippingFee = parseFloat(shippingData.standardShippingFee) || 9.99;
      settings.expressShippingFee = parseFloat(shippingData.expressShippingFee) || 18.00;
      window.MJStorage.set('settings', settings);
      return settings;
    },

    updateSocial(socialData) {
      const settings = this.getSettings();
      settings.social = { ...settings.social, ...socialData };
      window.MJStorage.set('settings', settings);
      return settings.social;
    },

    updateSEO(seoData) {
      const settings = this.getSettings();
      settings.seo = { ...settings.seo, ...seoData };
      window.MJStorage.set('settings', settings);
      return settings.seo;
    },

    updateCurrency(currencyData) {
      const settings = this.getSettings();
      if (currencyData.defaultCurrency) settings.defaultCurrency = currencyData.defaultCurrency;
      if (currencyData.currencySymbol) settings.currencySymbol = currencyData.currencySymbol;
      if (currencyData.exchangeRates) settings.exchangeRates = { ...settings.exchangeRates, ...currencyData.exchangeRates };
      if (currencyData.allowedCurrencies) settings.allowedCurrencies = currencyData.allowedCurrencies;
      window.MJStorage.set('settings', settings);
      if (window.MJCurrency) {
        window.MJCurrency.setActiveCurrency(settings.defaultCurrency);
      }
      return settings;
    }
  };
})();
