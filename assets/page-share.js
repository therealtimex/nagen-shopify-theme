(function() {
  'use strict';

  if (window.__nagenPageShareInitialized) {
    return;
  }
  window.__nagenPageShareInitialized = true;

  function getDecoratedShareUrl(rawUrl) {
    try {
      if (
        window.affiliateTracker &&
        typeof window.affiliateTracker.decorateUrl === 'function'
      ) {
        return window.affiliateTracker.decorateUrl(rawUrl);
      }
    } catch (error) {
      console.warn('Affiliate decoration failed:', error);
    }

    return rawUrl;
  }

  function buildShareHref(platform, url, title) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    if (platform === 'facebook') {
      return 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl;
    }

    if (platform === 'x') {
      return 'https://twitter.com/intent/tweet?text=' + encodedTitle + '&url=' + encodedUrl;
    }

    if (platform === 'email') {
      return 'mailto:?subject=' + encodedTitle + '&body=' + encodedUrl;
    }

    return '#';
  }

  function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function(resolve, reject) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (success) {
          resolve();
        } else {
          reject(new Error('Copy command failed'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  function setupShareWidget(widget) {
    if (widget.dataset.initialized === 'true') {
      return;
    }
    widget.dataset.initialized = 'true';

    const baseUrl = widget.dataset.shareUrl || window.location.href;
    const title = widget.dataset.shareTitle || document.title || '';
    const decoratedUrl = getDecoratedShareUrl(baseUrl);

    widget.querySelectorAll('.page-share__item[data-platform]').forEach(function(link) {
      const platform = link.dataset.platform;
      const href = buildShareHref(platform, decoratedUrl, title);
      link.setAttribute('href', href);
    });

    const copyButton = widget.querySelector('[data-share-copy]');
    if (copyButton) {
      copyButton.addEventListener('click', function() {
        copyText(decoratedUrl)
          .then(function() {
            copyButton.classList.add('copied');
            window.setTimeout(function() {
              copyButton.classList.remove('copied');
            }, 2000);
          })
          .catch(function(error) {
            console.error('Failed to copy share URL:', error);
          });
      });
    }
  }

  function init() {
    document.querySelectorAll('.page-share').forEach(setupShareWidget);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
