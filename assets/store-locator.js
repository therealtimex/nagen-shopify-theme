/**
 * Store Locator Section JavaScript
 * Handles Leaflet map integration, geolocation, and store interactions
 */

class StoreLocator {
  constructor(container) {
    this.container = container;
    this.sectionId = container.dataset.sectionId;
    this.stores = [];
    this.map = null;
    this.markers = {};
    this.userMarker = null;
    this.userLocation = null;
    this.selectedStoreId = null;
    this.isPanelCollapsed = false;

    // Settings from data attributes
    this.settings = {
      defaultLat: parseFloat(container.dataset.defaultLat) || 21.0338373,
      defaultLng: parseFloat(container.dataset.defaultLng) || 105.7701789,
      defaultZoom: parseInt(container.dataset.defaultZoom) || 12,
      enableGeolocation: container.dataset.enableGeolocation === 'true',
      showPopupImage: container.dataset.showPopupImage === 'true',
      directionsText: container.dataset.directionsText || 'Chỉ đường',
      bookingText: container.dataset.bookingText || 'Đặt lịch',
      bookingUrl: container.dataset.bookingUrl || '#'
    };

    this.init();
  }

  init() {
    this.parseStoreData();
    this.initMap();
    this.bindEvents();
    this.renderStoreCards();
  }

  parseStoreData() {
    const dataScript = this.container.querySelector('#store-locator-data-' + this.sectionId);
    if (dataScript) {
      try {
        this.stores = JSON.parse(dataScript.textContent);
      } catch (e) {
        console.error('Failed to parse store data:', e);
        this.stores = [];
      }
    }
  }

  initMap() {
    const mapContainer = this.container.querySelector('.store-locator__map');
    if (!mapContainer || typeof L === 'undefined') {
      console.error('Leaflet or map container not found');
      return;
    }

    // Initialize map with zoom control positioned top-right
    this.map = L.map(mapContainer, {
      center: [this.settings.defaultLat, this.settings.defaultLng],
      zoom: this.settings.defaultZoom,
      zoomControl: false, // We'll add it manually for positioning
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true
    });

    // Add zoom control to top-right (below header)
    L.control.zoom({
      position: 'topright'
    }).addTo(this.map);

    // Add Google Maps street tile layer
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi', {
      maxZoom: 20,
      minZoom: 3,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      tileSize: 256,
      detectRetina: true,
      attribution: '&copy; Google Maps'
    }).addTo(this.map);

    // Add store markers
    this.addStoreMarkers();

    // Do NOT call fitBoundsToStores - use configured zoom level instead

    // Fix map display issues on resize
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  addStoreMarkers() {
    // Green marker for stores (matching reference component)
    const storeIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.stores.forEach((store, index) => {
      const marker = L.marker([store.lat, store.lng], { icon: storeIcon });
      
      // Create popup content
      const popupContent = this.createPopupContent(store);
      marker.bindPopup(popupContent, {
        maxWidth: 300,
        minWidth: 260,
        closeButton: true,
        autoClose: false
      });

      marker.on('click', () => {
        this.selectStore(store.id);
      });

      marker.addTo(this.map);
      this.markers[store.id] = marker;
    });
  }

  createPopupContent(store) {
    // Only show image if setting is enabled AND image URL exists and is not empty
    const hasValidImage = this.settings.showPopupImage && store.image && store.image.trim() !== '';
    const image = hasValidImage
      ? `<img src="${store.image}" alt="${store.name}" class="store-locator__popup-image">` 
      : '';
    
    const phone = store.phone && store.phone.trim() !== ''
      ? `<div class="store-locator__popup-phone">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <a href="tel:${store.phone}">${store.phone}</a>
        </div>` 
      : '';

    const mapsUrl = `https://maps.google.com/maps?q=${store.lat},${store.lng}&hl=vi&z=15`;

    return `
      <div class="store-locator__popup">
        ${image}
        <div class="store-locator__popup-content">
          <h5 class="store-locator__popup-name">${store.name}</h5>
          <p class="store-locator__popup-address">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${store.address}
          </p>
          ${phone}
          <div class="store-locator__popup-actions">
            <a href="${mapsUrl}" target="_blank" class="store-locator__popup-btn store-locator__popup-btn--directions">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
              ${this.settings.directionsText}
            </a>
            <a href="${this.settings.bookingUrl}" class="store-locator__popup-btn store-locator__popup-btn--book">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${this.settings.bookingText}
            </a>
          </div>
        </div>
      </div>
    `;
  }

  fitBoundsToStores() {
    if (this.stores.length === 0) return;

    const bounds = L.latLngBounds([]);
    this.stores.forEach(store => {
      bounds.extend([store.lat, store.lng]);
    });

    if (this.userLocation) {
      bounds.extend([this.userLocation.lat, this.userLocation.lng]);
    }

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14
      });
    }
  }

  bindEvents() {
    // Geolocation button
    const geoBtn = this.container.querySelector('.store-locator__geo-btn');
    if (geoBtn) {
      geoBtn.addEventListener('click', () => this.getUserLocation());
    }

    // Panel toggle
    const toggleBtn = this.container.querySelector('.store-locator__toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.togglePanel());
    }

    // Expand button
    const expandBtn = this.container.querySelector('.store-locator__expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => this.togglePanel());
    }

    // Store card clicks
    this.container.addEventListener('click', (e) => {
      const card = e.target.closest('.store-locator__card');
      if (card && !e.target.closest('.store-locator__card-btn')) {
        const storeId = card.dataset.storeId;
        this.selectStore(storeId);
      }
    });

    // Window resize handler
    window.addEventListener('resize', () => {
      if (this.map) {
        setTimeout(() => this.map.invalidateSize(), 100);
      }
    });
  }

  getUserLocation() {
    const geoBtn = this.container.querySelector('.store-locator__geo-btn');
    const statusEl = this.container.querySelector('.store-locator__geo-status');
    
    if (!navigator.geolocation) {
      this.showGeoStatus('error', 'Trình duyệt không hỗ trợ định vị');
      return;
    }

    // Show loading state
    if (geoBtn) {
      geoBtn.disabled = true;
      geoBtn.innerHTML = `
        <svg class="store-locator__spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="30 70"></circle>
        </svg>
        Đang xác định...
      `;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.userLocation = { lat: latitude, lng: longitude };
        
        // Add user marker
        this.addUserMarker();
        
        // Sort stores by distance
        this.sortStoresByDistance();
        
        // Re-render cards with distances
        this.renderStoreCards();
        
        // Center map on user location at street level zoom
        this.map.setView([latitude, longitude], 14, { animate: true });
        
        // Reset button
        if (geoBtn) {
          geoBtn.disabled = false;
          geoBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Xác định vị trí của tôi
          `;
        }
        
        this.showGeoStatus('success', 'Đã xác định vị trí của bạn');
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        if (geoBtn) {
          geoBtn.disabled = false;
          geoBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Xác định vị trí của tôi
          `;
        }
        
        let errorMessage = 'Không thể xác định vị trí';
        if (error.code === 1) {
          errorMessage = 'Vui lòng cho phép truy cập vị trí';
        }
        this.showGeoStatus('error', errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  showGeoStatus(type, message) {
    const statusEl = this.container.querySelector('.store-locator__geo-status');
    if (!statusEl) return;

    statusEl.className = `store-locator__geo-status store-locator__geo-status--${type}`;
    statusEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${type === 'success' 
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
          : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
        }
      </svg>
      ${message}
    `;
    statusEl.style.display = 'flex';
  }

  addUserMarker() {
    if (!this.userLocation || !this.map) return;

    // Remove existing user marker
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }

    // Blue marker for user location (matching reference component)
    const userIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.userMarker = L.marker([this.userLocation.lat, this.userLocation.lng], { icon: userIcon });
    this.userMarker.bindPopup(`
      <div class="store-locator__popup">
        <h5 class="store-locator__popup-name">📍 Vị trí của bạn</h5>
        <p class="store-locator__popup-address">Vị trí hiện tại được xác định</p>
      </div>
    `);
    this.userMarker.addTo(this.map);
  }

  sortStoresByDistance() {
    if (!this.userLocation) return;

    this.stores = this.stores.map(store => {
      const distance = this.calculateDistance(
        this.userLocation.lat, 
        this.userLocation.lng,
        store.lat, 
        store.lng
      );
      return { ...store, distanceValue: distance, distance: this.formatDistance(distance) };
    }).sort((a, b) => a.distanceValue - b.distanceValue);
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  formatDistance(km) {
    if (km < 1) {
      return Math.round(km * 1000) + ' m';
    }
    return km.toFixed(1) + ' km';
  }

  selectStore(storeId) {
    // Update selected state
    this.selectedStoreId = storeId;
    
    // Update card styles
    const cards = this.container.querySelectorAll('.store-locator__card');
    cards.forEach(card => {
      card.classList.toggle('active', card.dataset.storeId === storeId);
    });

    // Find store and center map
    const store = this.stores.find(s => s.id === storeId);
    if (store && this.map) {
      this.map.setView([store.lat, store.lng], 15, {
        animate: true,
        duration: 0.5
      });

      // Open popup
      const marker = this.markers[storeId];
      if (marker) {
        marker.openPopup();
      }
    }

    // Scroll card into view on mobile
    const activeCard = this.container.querySelector(`.store-locator__card[data-store-id="${storeId}"]`);
    if (activeCard && window.innerWidth <= 991) {
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  togglePanel() {
    const wrapper = this.container.querySelector('.store-locator__wrapper');
    const toggleBtn = this.container.querySelector('.store-locator__toggle-btn');
    
    if (wrapper) {
      this.isPanelCollapsed = !this.isPanelCollapsed;
      wrapper.classList.toggle('panel-collapsed', this.isPanelCollapsed);
      
      // Rotate toggle button icon
      if (toggleBtn) {
        toggleBtn.setAttribute('title', this.isPanelCollapsed ? 'Hiển thị danh sách' : 'Thu gọn danh sách');
      }
      
      // Refresh map size after transition completes
      if (this.map) {
        setTimeout(() => this.map.invalidateSize(), 350);
      }
    }
  }

  renderStoreCards() {
    const listContainer = this.container.querySelector('.store-locator__list');
    const countEl = this.container.querySelector('.store-locator__list-count');
    
    if (!listContainer) return;

    // Update count
    if (countEl) {
      countEl.textContent = `${this.stores.length} cửa hàng`;
    }

    // Render cards (without distance)
    listContainer.innerHTML = this.stores.map((store, index) => {
      const label = String.fromCharCode(65 + index); // A, B, C...
      const mapsUrl = `https://maps.google.com/maps?q=${store.lat},${store.lng}&hl=vi&z=15`;
      
      return `
        <div class="store-locator__card ${store.id === this.selectedStoreId ? 'active' : ''}" data-store-id="${store.id}">
          <div class="store-locator__card-header">
            <div class="store-locator__card-marker">${label}</div>
            <h4 class="store-locator__card-name">${store.name}</h4>
          </div>
          <p class="store-locator__card-address">${store.address}</p>
          <div class="store-locator__card-actions">
            <a href="${mapsUrl}" target="_blank" class="store-locator__card-btn store-locator__card-btn--primary" onclick="event.stopPropagation()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
              ${this.settings.directionsText}
            </a>
            <a href="${this.settings.bookingUrl}" class="store-locator__card-btn store-locator__card-btn--secondary" onclick="event.stopPropagation()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${this.settings.bookingText}
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Update popup content with new distances
    this.stores.forEach(store => {
      const marker = this.markers[store.id];
      if (marker) {
        marker.setPopupContent(this.createPopupContent(store));
      }
    });
  }
}

// Initialize all store locator sections
document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('.store-locator');
  containers.forEach(container => {
    new StoreLocator(container);
  });
});

// Support Shopify Theme Editor
if (typeof Shopify !== 'undefined' && Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => {
    const container = event.target.querySelector('.store-locator');
    if (container) {
      new StoreLocator(container);
    }
  });
}
