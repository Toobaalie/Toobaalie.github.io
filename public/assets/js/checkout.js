function money(value) {
  return `Pkr ${Number(value).toFixed(0)}`;
}

const STATE_CITY_MAP = {
  Punjab: [
    'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Sargodha',
    'Bahawalpur', 'Sheikhupura', 'Rahim Yar Khan', 'Jhang', 'Dera Ghazi Khan', 'Gujrat',
    'Sahiwal', 'Kasur', 'Okara', 'Wah Cantonment', 'Mandi Bahauddin', 'Chiniot', 'Toba Tek Singh',
    'Hafizabad', 'Vehari', 'Khanewal', 'Bhakkar', 'Layyah', 'Muzaffargarh', 'Pakpattan',
    'Attock', 'Jhelum', 'Narowal', 'Nankana Sahib', 'Mianwali', 'Lodhran'
  ],
  Sindh: [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Jacobabad',
    'Shikarpur', 'Khairpur', 'Dadu', 'Thatta', 'Badin', 'Tando Adam', 'Tando Allahyar',
    'Tando Muhammad Khan', 'Kotri', 'Jamshoro', 'Umerkot', 'Matiari', 'Ghotki', 'Kashmore',
    'Sanghar', 'Naushahro Feroze', 'Sehwan', 'Kandhkot'
  ],
  'Khyber Pakhtunkhwa': [
    'Peshawar', 'Mardan', 'Mingora', 'Nowshera', 'Abbottabad', 'Kohat', 'Dera Ismail Khan',
    'Bannu', 'Swabi', 'Charsadda', 'Haripur', 'Mansehra', 'Batkhela', 'Timergara', 'Lakki Marwat',
    'Tank', 'Hangu', 'Karak', 'Shangla', 'Dir', 'Chitral', 'Buner', 'Kabal', 'Matta'
  ],
  Balochistan: [
    'Quetta', 'Turbat', 'Khuzdar', 'Chaman', 'Gwadar', 'Sibi', 'Zhob', 'Hub', 'Loralai',
    'Kalat', 'Dera Murad Jamali', 'Kharan', 'Pishin', 'Mastung', 'Nushki', 'Usta Muhammad',
    'Panjgur', 'Jiwani', 'Dalbandin'
  ],
  'Islamabad Capital Territory': [
    'Islamabad'
  ]
};

function resolveApiBase() {
  const host = window.location.hostname;
  const canonicalApi = 'https://berrybabes.me';
  const sameOriginHosts = new Set(['berrybabes.me', 'localhost', '127.0.0.1']);

  if (sameOriginHosts.has(host) || host.endsWith('.railway.app')) {
    return '';
  }

  if (host === 'www.berrybabes.me') {
    return canonicalApi;
  }

  return canonicalApi;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function showBlockingMessage(message) {
  // Keep UI responsive: use toast-only feedback instead of blocking alerts.
  showToast(message);
}

function buildOrderEndpoints() {
  const sameOriginEndpoint = `${window.location.origin}/api/orders`;
  const canonicalEndpoint = 'https://berrybabes.me/api/orders';
  const endpoints = [sameOriginEndpoint, canonicalEndpoint];

  if (!window.location.hostname.includes('berrybabes.me')) {
    endpoints.push(canonicalEndpoint);
  }

  return Array.from(new Set(endpoints));
}

async function postOrderWithTimeout(endpoint, payload, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const body = await response.json().catch(() => ({}));
    return { response, body };
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error('Request timed out. Server may be waking up, retrying...');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function getCartItemsSafe() {
  if (window.CartStore && typeof window.CartStore.getCart === 'function') {
    return window.CartStore.getCart();
  }

  try {
    const raw = localStorage.getItem('berrybabes_cart');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge || !window.CartStore) return;
  badge.textContent = window.CartStore.getCartCount();
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlistBadge');
  if (!badge) return;

  try {
    const raw = localStorage.getItem('berrybabes_wishlist');
    const parsed = raw ? JSON.parse(raw) : [];
    badge.textContent = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    badge.textContent = 0;
  }
}

function renderSummary() {
  const summary = document.getElementById('checkoutSummary');
  if (!summary) return;

  const items = getCartItemsSafe();

  if (!items.length) {
    summary.innerHTML = `
      <div class="checkout-empty">
        <h3>No items in cart</h3>
        <p>Please add products before checkout.</p>
        <a href="index.html#products" class="btn btn--primary">Shop Products</a>
      </div>
    `;
    const form = document.getElementById('checkoutForm');
    if (form) form.style.display = 'none';
    return;
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  summary.innerHTML = `
    <h3>Order Summary</h3>
    <div class="checkout-items">
      ${items
        .map(
          item => `
          <div class="checkout-item">
            <img src="${item.image || 'images/1.jpeg'}" alt="${item.name}" />
            <div>
              <p class="checkout-item__name">${item.name}</p>
              <p class="checkout-item__meta">Color: ${item.color} • Qty: ${item.quantity}</p>
            </div>
            <strong>${money(item.price * item.quantity)}</strong>
          </div>
        `
        )
        .join('')}
    </div>
    <div class="checkout-total">
      <span>Total</span>
      <strong>${money(total)}</strong>
    </div>
  `;
}

function initCityAutocomplete() {
  const stateInput = document.getElementById('state');
  const cityInput = document.getElementById('city');
  const suggestionsEl = document.getElementById('citySuggestions');
  if (!stateInput || !cityInput || !suggestionsEl) return;

  let activeIndex = -1;

  function hideSuggestions() {
    suggestionsEl.classList.remove('open');
    suggestionsEl.innerHTML = '';
    activeIndex = -1;
  }

  function showSuggestions(matches) {
    if (!matches.length) {
      hideSuggestions();
      return;
    }

    suggestionsEl.innerHTML = matches
      .map(
        (city, index) =>
          `<button type="button" class="city-suggestion ${index === 0 ? 'active' : ''}" data-city="${city}" role="option" aria-selected="${index === 0 ? 'true' : 'false'}">${city}</button>`
      )
      .join('');

    suggestionsEl.classList.add('open');
    activeIndex = 0;
  }

  function getMatches(value) {
    const selectedState = stateInput.value;
    const cityPool = STATE_CITY_MAP[selectedState] || [];
    const query = value.trim().toLowerCase();
    if (!cityPool.length) return [];
    if (!query) return cityPool.slice(0, 10);
    return cityPool
      .filter(city => city.toLowerCase().includes(query))
      .slice(0, 10);
  }

  function refreshActiveOption() {
    const items = suggestionsEl.querySelectorAll('.city-suggestion');
    items.forEach((item, index) => {
      const active = index === activeIndex;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  cityInput.addEventListener('input', () => {
    showSuggestions(getMatches(cityInput.value));
  });

  cityInput.addEventListener('focus', () => {
    showSuggestions(getMatches(cityInput.value));
  });

  stateInput.addEventListener('change', () => {
    cityInput.value = '';
    cityInput.disabled = false;
    cityInput.placeholder = 'City';
    showSuggestions(getMatches(''));
  });

  cityInput.addEventListener('keydown', event => {
    const items = suggestionsEl.querySelectorAll('.city-suggestion');
    if (!items.length || !suggestionsEl.classList.contains('open')) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      refreshActiveOption();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      refreshActiveOption();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const active = items[activeIndex] || items[0];
      if (active) {
        cityInput.value = active.dataset.city;
        hideSuggestions();
      }
      return;
    }

    if (event.key === 'Escape') {
      hideSuggestions();
    }
  });

  suggestionsEl.addEventListener('click', event => {
    const button = event.target.closest('.city-suggestion');
    if (!button) return;
    cityInput.value = button.dataset.city;
    hideSuggestions();
    cityInput.focus();
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.checkout-city-field')) {
      hideSuggestions();
    }
  });
}

async function placeOrder(event) {
  event.preventDefault();

  const form = event.target;
  const cartItems = getCartItemsSafe();

  if (!cartItems.length) {
    showBlockingMessage('Your cart is empty. Please add at least one product.');
    return;
  }

  const order = {
    fullName: document.getElementById('fullName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: document.getElementById('address').value.trim(),
    state: document.getElementById('state').value.trim() || 'Not provided',
    city: document.getElementById('city').value.trim() || 'Not provided',
    postalCode: document.getElementById('postalCode').value.trim() || 'Not provided',
      paymentMethod: 'cod',
    notes: document.getElementById('notes').value.trim(),
    items: cartItems,
    total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    createdAt: new Date().toISOString()
  };

  if (order.fullName.length < 2) {
    showBlockingMessage('Please enter your full name.');
    return;
  }

  if (order.phone.length < 8) {
    showBlockingMessage('Please enter a valid phone number.');
    return;
  }

  if (order.address.length < 8) {
    showBlockingMessage('Please enter your complete address.');
    return;
  }

  if (order.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) {
    showBlockingMessage('Please enter a valid email address or leave it empty.');
    return;
  }

  const submitButton = document.getElementById('placeOrderBtn');
  if (submitButton) {
    if (!submitButton.dataset.originalText) {
      submitButton.dataset.originalText = submitButton.innerHTML;
    }
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing...';
  }
  showToast('Placing your order...');

  const candidateEndpoints = buildOrderEndpoints();
  let lastError = null;

  try {
    for (const endpoint of candidateEndpoints) {
      try {
        let result;
        try {
          result = await postOrderWithTimeout(endpoint, order);
        } catch (firstError) {
          // Retry once for cold starts / transient network delays.
          result = await postOrderWithTimeout(endpoint, order);
        }

        const { response, body: payload } = result;
        if (!response.ok) {
          throw new Error(payload.error || `Failed to place order (HTTP ${response.status})`);
        }

        localStorage.setItem('berrybabes_last_order', JSON.stringify({ ...order, orderId: payload.orderId }));
        if (window.CartStore && typeof window.CartStore.saveCart === 'function') {
          window.CartStore.saveCart([]);
        } else {
          localStorage.setItem('berrybabes_cart', '[]');
        }
        updateCartBadge();
        let confirmationMessage = 'Order confirmed. We will contact you shortly.';
        if (payload.emailStatus === 'sent' || payload.emailSent) {
          confirmationMessage = 'Confirmation email sent.';
        } else if (payload.emailStatus === 'not_requested') {
          confirmationMessage = 'Order confirmed. We will confirm by phone.';
        } else if (payload.emailStatus === 'not_configured') {
          confirmationMessage = 'Order confirmed. We will confirm by phone.';
        }

        showToast(`Order placed! ID: ${payload.orderId}. ${confirmationMessage}`);
        form.reset();

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1300);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Could not place order. Please try again.');
  } catch (error) {
    showBlockingMessage(`Could not place order: ${error.message || 'Network or server issue. Please try again.'}`);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = submitButton.dataset.originalText || '<i class="fas fa-check-circle"></i> Place Order';
    }
  }
}

window.placeOrder = placeOrder;

window.addEventListener('error', event => {
  console.error('Checkout script error:', event.message || event.error || event);
});

window.addEventListener('unhandledrejection', event => {
  console.error('Checkout async error:', event && event.reason ? event.reason : event);
});

(function initCheckoutPage() {
  updateCartBadge();
  updateWishlistBadge();
  renderSummary();
  initCityAutocomplete();

  const form = document.getElementById('checkoutForm');
  if (form) {
    form.noValidate = true;
    // Avoid double-submit when HTML already has inline onsubmit handler.
    if (!form.hasAttribute('onsubmit')) {
      form.addEventListener('submit', placeOrder);
    }
  }
})();
