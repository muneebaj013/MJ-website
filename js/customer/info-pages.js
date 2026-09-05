// Information & Policy Pages Modal Viewer
(function() {
  const PAGES_CONTENT = {
    about: {
      title: "About MJ Lifestyle",
      subtitle: "Soft Aesthetics • Mindful Craftsmanship • Effortless Living",
      html: `
        <div style="line-height:1.8; color:var(--color-text);">
          <p>Founded on the principles of soft minimalism, warmth, and enduring beauty, <strong>MJ</strong> is a multi-category lifestyle brand curated for those who appreciate quiet luxury and comforting elegance in their everyday lives.</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin:1.8rem 0;">
            <div style="background:var(--bg-subtle); padding:1.4rem; border-radius:var(--radius-sm); border:1px solid var(--border-color-light);">
              <h4 style="font-family:var(--font-heading); color:var(--color-heading); margin-bottom:0.4rem;">Pure Natural Fabrics</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted);">From 1000 Thread Count Egyptian cotton to stonewashed French linen, we choose certified organic fibers that breathe with you.</p>
            </div>
            <div style="background:var(--bg-subtle); padding:1.4rem; border-radius:var(--radius-sm); border:1px solid var(--border-color-light);">
              <h4 style="font-family:var(--font-heading); color:var(--color-heading); margin-bottom:0.4rem;">Timeless Design</h4>
              <p style="font-size:0.9rem; color:var(--color-text-muted);">Every silhouette and home piece is crafted with subtle pastel tones and serene textures that never fade out of style.</p>
            </div>
          </div>
          <p>Whether you are unwinding in our sateen bedsheets, stepping out in a breezy linen tier dress, or illuminating your room with an artisanal soy candle, MJ brings tranquility and luxury to your home.</p>
        </div>
      `
    },
    contact: {
      title: "Contact MJ Customer Concierge",
      subtitle: "We are here to assist you with styling, orders & inquiries",
      html: `
        <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:2rem;">
          <div style="background:var(--bg-subtle); padding:1.5rem; border-radius:var(--radius-sm); font-size:0.92rem;">
            <h4 style="font-family:var(--font-heading); margin-bottom:1rem;">Direct Contact</h4>
            <p><strong>Customer Care:</strong> support@mjstore.com</p>
            <p><strong>Toll-Free Phone:</strong> +1 (800) 456-6587</p>
            <p><strong>Operating Hours:</strong> Mon – Sat: 9:00 AM – 7:00 PM EST</p>
            <p><strong>Flagship Boutique:</strong> 742 Blossom Avenue, Suite 100, New York, NY</p>
          </div>
          <form onsubmit="window.MJInfoPages.handleContactSubmit(event)">
            <div class="form-group">
              <label class="form-label">Your Name</label>
              <input type="text" name="name" class="form-control" required placeholder="Jane Doe">
            </div>
            <div class="form-group">
              <label class="form-label">Your Email</label>
              <input type="email" name="email" class="form-control" required placeholder="jane@example.com">
            </div>
            <div class="form-group">
              <label class="form-label">Message</label>
              <textarea name="message" class="form-control" rows="3" required placeholder="How may we assist you?"></textarea>
            </div>
            <button type="submit" class="btn btn-primary w-100">Send Message</button>
          </form>
        </div>
      `
    },
    faqs: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about shopping with MJ",
      html: `
        <div class="product-accordion">
          <div class="accordion-item active">
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
              <span>What materials do you use for MJ bedsheets?</span>
              <span>▼</span>
            </div>
            <div class="accordion-content">
              We exclusively use 100% Long-Staple Egyptian Cotton (up to 1000 Thread Count) and pre-washed French Flax Linen. All materials are OEKO-TEX Standard 100 certified hypoallergenic.
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
              <span>Do you offer Cash on Delivery (COD)?</span>
              <span>▼</span>
            </div>
            <div class="accordion-content">
              Yes! Cash on Delivery is available on all domestic deliveries with zero extra handling fees.
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
              <span>How do I qualify for Free Shipping?</span>
              <span>▼</span>
            </div>
            <div class="accordion-content">
              All orders exceeding $75 automatically receive complimentary express tracked shipping at checkout.
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
              <span>What is your return policy?</span>
              <span>▼</span>
            </div>
            <div class="accordion-content">
              We offer a 14-day hassle-free return and exchange policy. Items must be unwashed, unused, and in original luxury packaging.
            </div>
          </div>
        </div>
      `
    },
    shipping: {
      title: "Shipping & Delivery Policy",
      subtitle: "Fast, tracked, and insured shipping worldwide",
      html: `
        <div style="line-height:1.8; font-size:0.95rem; color:var(--color-text);">
          <p>At MJ, every parcel is inspected, gently folded, and packaged in our signature soft blush recyclable gift box.</p>
          <ul style="list-style:disc; padding-left:1.2rem; margin:1rem 0;">
            <li><strong>Standard Delivery:</strong> 2 to 4 business days ($9.99 or FREE on orders over $75).</li>
            <li><strong>Express Priority:</strong> 1 to 2 business days ($18.00).</li>
            <li><strong>Order Tracking:</strong> A real-time tracking number is provided immediately after order dispatch.</li>
          </ul>
        </div>
      `
    },
    returns: {
      title: "14-Day Return & Refund Policy",
      subtitle: "Shop with absolute peace of mind",
      html: `
        <div style="line-height:1.8; font-size:0.95rem; color:var(--color-text);">
          <p>We want you to adore everything you receive from MJ. If for any reason you are not completely enchanted with your purchase, you may initiate a return within 14 calendar days of receiving your package.</p>
          <p>Refunds are processed to your original payment method or store credit within 3-5 business days of inspection.</p>
        </div>
      `
    },
    terms: {
      title: "Terms & Conditions",
      subtitle: "Standard terms of service for MJ online store",
      html: `
        <div style="line-height:1.8; font-size:0.92rem; color:var(--color-text-muted);">
          <p>By accessing and shopping on the MJ platform, you agree to adhere to our standard terms of use, privacy practices, and fair usage guidelines. All promotional discounts, coupons, and pricing are subject to availability and terms specified at promotional launch.</p>
        </div>
      `
    },
    privacy: {
      title: "Privacy Policy",
      subtitle: "How we protect and secure your personal information",
      html: `
        <div style="line-height:1.8; font-size:0.92rem; color:var(--color-text-muted);">
          <p>Your privacy is sacred to us. MJ employs 256-bit SSL encryption across all browsing, cart, and checkout transactions. We never sell or share your personal contact information with unauthorized third parties.</p>
        </div>
      `
    }
  };

  window.MJInfoPages = {
    open(pageKey) {
      const modal = document.getElementById('infoPageModal');
      const titleEl = document.getElementById('infoPageTitle');
      const subEl = document.getElementById('infoPageSubtitle');
      const bodyEl = document.getElementById('infoPageBody');

      const data = PAGES_CONTENT[pageKey] || PAGES_CONTENT.about;

      if (titleEl) titleEl.textContent = data.title;
      if (subEl) subEl.textContent = data.subtitle;
      if (bodyEl) bodyEl.innerHTML = data.html;

      if (modal) modal.classList.add('active');
    },

    close() {
      const modal = document.getElementById('infoPageModal');
      if (modal) modal.classList.remove('active');
    },

    handleContactSubmit(e) {
      e.preventDefault();
      const form = e.target;
      window.MJToast.success(`Thank you ${form.name.value}! Your message has been sent to the MJ Concierge. We will reply within 24 hours.`);
      form.reset();
      this.close();
    }
  };
})();
