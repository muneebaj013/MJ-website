// MJ Storefront - Contact & WhatsApp Concierge Module
(function() {
  window.MJContact = {
    init() {
      this.bindFooterForm();
      this.renderFloatingWhatsApp();
    },

    bindFooterForm() {
      const form = document.getElementById('footerContactForm');
      if (form) {
        form.addEventListener('submit', (e) => this.submitFooterForm(e));
      }
    },

    submitFooterForm(e) {
      if (e && e.preventDefault) e.preventDefault();

      const emailEl = document.getElementById('footerContactEmail');
      const subjEl = document.getElementById('footerContactSubject');
      const msgEl = document.getElementById('footerContactMessage');

      const email = emailEl ? emailEl.value.trim() : '';
      const subject = subjEl ? subjEl.value : 'General Inquiry';
      const message = msgEl ? msgEl.value.trim() : '';

      if (!email || !message) {
        if (window.MJToast) window.MJToast.error('Please enter your email and message.');
        return;
      }

      // 1. Save message into Store Local Inquiries DB
      const inquiries = window.MJStorage.get('contactMessages') || [];
      const newInquiry = {
        id: 'inq-' + Date.now(),
        name: email.split('@')[0],
        email: email,
        subject: subject,
        message: message,
        date: new Date().toISOString(),
        status: 'unread'
      };
      inquiries.unshift(newInquiry);
      window.MJStorage.set('contactMessages', inquiries);

      // 2. Add admin notification
      const notifs = window.MJStorage.get('notifications') || [];
      notifs.unshift({
        id: 'notif-' + Date.now(),
        type: 'inquiry',
        title: `New Inquiry: ${subject}`,
        message: `${email}: "${message.substring(0, 55)}..."`,
        timestamp: 'Just now',
        isRead: false
      });
      window.MJStorage.set('notifications', notifs);

      // 3. Prepare direct mailto URL
      const settings = (window.MJSettingsStore && window.MJSettingsStore.getSettings()) || {};
      const supportEmail = settings.contactEmail || 'support@mjstore.com';
      const mailtoSubject = encodeURIComponent(`[MJ Inquiry - ${subject}] from ${email}`);
      const mailtoBody = encodeURIComponent(`Customer Email: ${email}\nSubject: ${subject}\n\nMessage / Report:\n${message}\n\n---\nSent via MJ Lifestyle Website`);
      const mailtoUrl = `mailto:${supportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

      // 4. Feedback to customer
      if (window.MJToast) {
        window.MJToast.success(`Message recorded! Opening your email app to send directly to ${supportEmail}.`);
      }

      // Trigger mail client
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = mailtoUrl;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 400);

      // Clear form
      if (emailEl) emailEl.value = '';
      if (msgEl) msgEl.value = '';
    },

    openWhatsApp(customText) {
      const settings = (window.MJSettingsStore && window.MJSettingsStore.getSettings()) || {};
      const rawNumber = settings.whatsappNumber || '+923004566587';
      const cleanPhone = rawNumber.replace(/[^0-9]/g, '');
      const defaultText = settings.whatsappMessage || 'Hello MJ Concierge, I would like to inquire about your collections.';
      const text = customText || defaultText;

      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

      if (window.MJToast) {
        window.MJToast.info('Connecting you to MJ Concierge on WhatsApp...');
      }

      window.open(url, '_blank');
    },

    renderFloatingWhatsApp() {
      const existing = document.getElementById('floatingWhatsAppWidget');
      if (existing) existing.remove();

      const settings = (window.MJSettingsStore && window.MJSettingsStore.getSettings()) || {};
      if (settings.enableWhatsAppFloating === false) return;

      const widget = document.createElement('div');
      widget.id = 'floatingWhatsAppWidget';
      widget.className = 'floating-whatsapp-widget';
      widget.setAttribute('role', 'button');
      widget.setAttribute('aria-label', 'Chat on WhatsApp with MJ Concierge');
      widget.onclick = () => this.openWhatsApp();

      widget.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.981.536 1.771.82 2.796.821 3.183 0 5.77-2.586 5.77-5.767 0-3.182-2.587-5.806-5.77-5.806zm0 10.455c-.93 0-1.84-.249-2.637-.723l-.189-.112-1.956.513.522-1.908-.124-.197c-.522-.83-.798-1.791-.797-2.78 0-2.678 2.18-4.858 4.86-4.858 2.679 0 4.86 2.18 4.86 4.858 0 2.679-2.18 4.859-4.86 4.859zm3.013-3.666c-.165-.083-.979-.483-1.131-.538-.152-.055-.262-.083-.373.083-.11.165-.429.538-.526.649-.097.11-.193.125-.358.042-.165-.083-.699-.258-1.332-.822-.493-.439-.826-.982-.923-1.147-.097-.165-.01-.254.072-.336.074-.074.165-.193.248-.29.083-.097.11-.165.165-.276.055-.11.028-.207-.014-.29-.041-.083-.373-.898-.511-1.23-.135-.323-.272-.279-.373-.284l-.318-.004c-.11 0-.29.041-.442.207-.152.165-.58.566-.58 1.38 0 .814.593 1.601.676 1.712.083.11 1.166 1.781 2.825 2.497.395.171.703.273.943.35.397.126.758.108 1.044.066.319-.047.979-.4 1.118-.787.138-.386.138-.717.097-.787-.042-.07-.152-.111-.318-.194z"/>
        </svg>
        <span class="floating-whatsapp-text">Chat on WhatsApp</span>
      `;

      document.body.appendChild(widget);
    }
  };

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.MJContact.init());
  } else {
    window.MJContact.init();
  }
})();
