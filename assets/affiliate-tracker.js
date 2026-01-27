/**
 * Affiliate Tracker for Shopify Theme
 *
 * Captures affiliate referrals via URL parameters, persists attribution using
 * cookies (first-click wins), and injects affiliate data into cart attributes
 * for order attribution.
 *
 * @example
 * const tracker = new AffiliateTracker({ paramName: 'ref', ttlDays: 7 });
 * tracker.init();
 */
class AffiliateTracker {
  constructor(config = {}) {
    this.paramName = config.paramName || 'ref';
    this.ttlDays = config.ttlDays || 7;
    this.decorateLinks = config.decorateLinks !== false;
    this.injectFormInputs = config.injectFormInputs === true;
    this.dealerRefCode = config.dealerRefCode || null; // Dealer's own ref_code (takes priority for sharing)
    this.cookieName = 'rt_aff';
    this.storageKey = 'rt_aff';
    // Unified key names with underscore prefix (hidden from customer in cart UI)
    this.attrRefKey = '_rt_aff_ref';
    this.attrTsKey = '_rt_aff_ts';

    // Cache for cart check
    this._cartAttributesCache = null;
  }

  /**
   * Initialize the tracker on page load
   */
  init() {
    const urlRef = this.getUrlParam(this.paramName);
    const stored = this.getStoredAttribution();
    let needsCartSync = false;

    // First-click wins: only set if no valid attribution exists
    if (urlRef && !this.isValidAttribution(stored)) {
      this.setAttribution(urlRef);
      needsCartSync = true;
    }

    // Sync to cart only if: (1) new attribution set, or (2) cart missing attribute
    if (needsCartSync) {
      this.syncToCart();
    } else if (this.isValidAttribution(stored)) {
      // Check cart asynchronously
      this.checkAndSyncCart(stored);
    }

    // Decorate share links
    if (this.decorateLinks) {
      this.decorateShareLinks();
    }

    // Inject hidden inputs into product forms for Buy Now / dynamic checkout support
    if (this.injectFormInputs) {
      this.injectAffiliateInputsToForms();
    }
  }

  /**
   * Get URL parameter value
   */
  getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /**
   * Get stored attribution from cookie or localStorage
   * @returns {Object|null} Attribution object { ref, ts, expTs }
   */
  getStoredAttribution() {
    // Try cookie first
    const cookieValue = this.getCookie(this.cookieName);
    if (cookieValue) {
      try {
        return JSON.parse(atob(cookieValue));
      } catch (e) {
        // Invalid cookie, try localStorage
      }
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // localStorage not available or invalid
    }

    return null;
  }

  /**
   * Check if attribution is valid (exists and not expired)
   */
  isValidAttribution(attr) {
    if (!attr || !attr.ref || !attr.expTs) {
      return false;
    }
    return Date.now() < attr.expTs;
  }

  /**
   * Set attribution in cookie and localStorage
   */
  setAttribution(ref) {
    const now = Date.now();
    const expTs = now + this.ttlDays * 24 * 60 * 60 * 1000;
    const expDate = new Date(expTs);

    const attr = {
      ref: ref,
      ts: now,
      expTs: expTs
    };

    // Set cookie (base64 encoded JSON)
    const encoded = btoa(JSON.stringify(attr));
    document.cookie = `${this.cookieName}=${encoded}; expires=${expDate.toUTCString()}; path=/; SameSite=Lax`;

    // Set localStorage as fallback
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(attr));
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Get cookie value by name
   */
  getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  /**
   * Check if cart is missing attribution or has stale timestamp, sync if needed
   */
  async checkAndSyncCart(attr) {
    try {
      const response = await fetch('/cart.js', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const cart = await response.json();

      // Check if cart is missing attribution OR has different ref OR missing/stale timestamp
      const cartRef = cart.attributes ? cart.attributes[this.attrRefKey] : null;
      const cartTs = cart.attributes ? cart.attributes[this.attrTsKey] : null;
      
      if (!cartRef || cartRef !== attr.ref || !cartTs || cartTs !== String(attr.ts)) {
        this.syncToCart(attr);
      }
    } catch (e) {
      // Silently fail - not critical
    }
  }

  /**
   * Sync attribution to cart attributes
   */
  async syncToCart(attr) {
    const attribution = attr || this.getStoredAttribution();
    if (!attribution || !attribution.ref) {
      return;
    }

    try {
      const attributes = {};
      attributes[this.attrRefKey] = attribution.ref;
      attributes[this.attrTsKey] = String(attribution.ts);

      await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes })
      });
    } catch (e) {
      // Silently fail - order may still work without pre-sync
    }
  }

  /**
   * Decorate all share links with affiliate parameter
   * Priority: dealer's own ref_code > visitor's stored attribution
   */
  decorateShareLinks() {
    const refToUse = this.getSharingRef();
    if (!refToUse) return;

    // Find all elements with data-share-url attribute
    const shareLinks = document.querySelectorAll('[data-share-url]');
    shareLinks.forEach((link) => {
      const baseUrl = link.getAttribute('data-share-url');
      if (!baseUrl) return;

      const decoratedUrl = this.decorateUrl(baseUrl, refToUse);
      const currentHref = link.getAttribute('href');
      if (!currentHref) return;

      // Rebuild the share URL based on the platform pattern
      let newHref = currentHref;

      if (currentHref.includes('facebook.com/sharer')) {
        // Facebook: //www.facebook.com/sharer.php?u=URL
        newHref = currentHref.replace(/([?&]u=)[^&]*/, '$1' + encodeURIComponent(decoratedUrl));
      } else if (currentHref.includes('twitter.com/share') || currentHref.includes('x.com/share')) {
        // Twitter/X: //twitter.com/share?text=...&url=URL
        newHref = currentHref.replace(/([?&]url=)[^&]*/, '$1' + encodeURIComponent(decoratedUrl));
      } else if (currentHref.includes('pinterest.com/pin/create')) {
        // Pinterest: https://pinterest.com/pin/create/button/?url=URL&media=...&description=...
        newHref = currentHref.replace(/([?&]url=)[^&]*/, '$1' + encodeURIComponent(decoratedUrl));
      } else if (currentHref.includes('linkedin.com/share')) {
        // LinkedIn: //linkedin.com/share?text=...&url=URL
        newHref = currentHref.replace(/([?&]url=)[^&]*/, '$1' + encodeURIComponent(decoratedUrl));
      } else if (currentHref.startsWith('mailto:')) {
        // Email: mailto:?subject=...&body=URL
        newHref = currentHref.replace(/([?&]body=)[^&]*/, '$1' + encodeURIComponent(decoratedUrl));
      } else {
        // Generic fallback: try common patterns
        if (currentHref.includes('url=')) {
          newHref = currentHref.replace(/([?&]url=)[^&]*/, '$1' + encodeURIComponent(decoratedUrl));
        } else if (currentHref.includes('u=')) {
          newHref = currentHref.replace(/([?&]u=)[^&]*/, '$1' + encodeURIComponent(decoratedUrl));
        }
      }

      link.setAttribute('href', newHref);
    });
  }

  /**
   * Append affiliate parameter to a URL
   */
  decorateUrl(url, ref) {
    const refToUse = ref || this.getSharingRef();
    if (!refToUse) {
      return url;
    }

    try {
      const urlObj = new URL(url, window.location.origin);
      if (!urlObj.searchParams.has(this.paramName)) {
        urlObj.searchParams.set(this.paramName, refToUse);
      }
      return urlObj.toString();
    } catch (e) {
      // Fallback for invalid URLs
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${this.paramName}=${encodeURIComponent(refToUse)}`;
    }
  }

  /**
   * Get current affiliate reference for ATTRIBUTION (visitor's ref).
   * 
   * This returns the reference code of the person who REFERRED the current visitor.
   * Use this for: Form submissions, order attributes, and lead tracking.
   * 
   * @returns {string|null} The visitor's attribution reference code.
   */
  getAffiliateRef() {
    const attr = this.getStoredAttribution();
    return this.isValidAttribution(attr) ? attr.ref : null;
  }

  /**
   * Get current affiliate reference for SHARING (dealer's ref > visitor's ref).
   * 
   * This prioritizes the logged-in dealer's own code so they can spread their own referral link.
   * If not a dealer, it falls back to the visitor's attribution code (allowing them to re-share).
   * Use this for: Social share buttons, "Copy Link" features, and generating referral URLs.
   * 
   * @returns {string|null} The reference code to be used in shared links.
   */
  getSharingRef() {
    if (this.dealerRefCode) return this.dealerRefCode;
    return this.getAffiliateRef();
  }

  /**
   * Inject hidden affiliate property inputs into product forms
   * Uses LINE ITEM PROPERTIES (not cart attributes) because:
   * - Dynamic checkout/Buy Now buttons bypass cart attributes
   * - Line item properties are reliably carried through all checkout flows
   * - rtCloud can extract affiliate data from line_items[].properties
   */
  injectAffiliateInputsToForms() {
    const attr = this.getStoredAttribution();
    if (!this.isValidAttribution(attr)) {
      return;
    }

    // Find all product forms (Shopify uses various form selectors)
    const formSelectors = [
      'form[action*="/cart/add"]',
      'form[data-type="add-to-cart-form"]',
      'form.shopify-product-form',
      'form.product-form',
      '.shopify-ap-productform'
    ];
    
    const forms = document.querySelectorAll(formSelectors.join(', '));
    
    forms.forEach((form) => {
      // Check if inputs already exist (avoid duplicates)
      if (form.querySelector(`input[name="properties[${this.attrRefKey}]"]`)) {
        return;
      }

      // Create hidden inputs for affiliate line item properties
      const refInput = document.createElement('input');
      refInput.type = 'hidden';
      refInput.name = `properties[${this.attrRefKey}]`;
      refInput.value = attr.ref;
      form.appendChild(refInput);

      const tsInput = document.createElement('input');
      tsInput.type = 'hidden';
      tsInput.name = `properties[${this.attrTsKey}]`;
      tsInput.value = String(attr.ts);
      form.appendChild(tsInput);
    });
  }
}

// Export for module systems, attach to window for global access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AffiliateTracker;
}
window.AffiliateTracker = AffiliateTracker;
