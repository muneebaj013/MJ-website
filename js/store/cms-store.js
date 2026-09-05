// Visual CMS & Content Management Store Module
(function() {
  window.MJCmsStore = {
    getContent() {
      return window.MJStorage.get('cms') || (window.MJ_INITIAL_DATA ? window.MJ_INITIAL_DATA.cms : {});
    },

    updateAnnouncement(announcementData) {
      const cms = this.getContent();
      cms.announcement = { ...cms.announcement, ...announcementData };
      window.MJStorage.set('cms', cms);
      return cms.announcement;
    },

    updateHero(heroData) {
      const cms = this.getContent();
      cms.hero = { ...cms.hero, ...heroData };
      window.MJStorage.set('cms', cms);
      return cms.hero;
    },

    updatePromoBanners(promoData) {
      const cms = this.getContent();
      cms.promoBanners = { ...cms.promoBanners, ...promoData };
      window.MJStorage.set('cms', cms);
      return cms.promoBanners;
    },

    updateSectionVisibility(sectionsData) {
      const cms = this.getContent();
      cms.sections = { ...cms.sections, ...sectionsData };
      window.MJStorage.set('cms', cms);
      return cms.sections;
    }
  };
})();
