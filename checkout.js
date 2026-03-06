function money(value) {
  return `Pkr ${Number(value).toFixed(0)}`;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
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
  if (!summary || !window.CartStore) return;

  const items = window.CartStore.getCart();

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

function placeOrder(event) {
  event.preventDefault();
  if (!window.CartStore) return;

  const form = event.target;
  const cartItems = window.CartStore.getCart();

  if (!cartItems.length) {
    showToast('Your cart is empty');
    return;
  }

  const order = {
    fullName: document.getElementById('fullName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: document.getElementById('address').value.trim(),
    city: document.getElementById('city').value.trim(),
    postalCode: document.getElementById('postalCode').value.trim(),
    notes: document.getElementById('notes').value.trim(),
    items: cartItems,
    total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    createdAt: new Date().toISOString()
  };

  fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(order)
  })
    .then(async response => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to place order');
      }

      localStorage.setItem('berrybabes_last_order', JSON.stringify({ ...order, orderId: payload.orderId }));
      window.CartStore.saveCart([]);
      updateCartBadge();
      const emailStatus = payload.emailSent
        ? 'Confirmation email sent.'
        : 'Order saved, but confirmation email was not sent.';
      showToast(`✅ Order placed! ID: ${payload.orderId}. ${emailStatus}`);
      form.reset();

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1300);
    })
    .catch(error => {
      showToast(`⚠️ ${error.message}. Start site with server.`);
    });
}

(function initCheckoutPage() {
  updateCartBadge();
  updateWishlistBadge();
  renderSummary();

  const form = document.getElementById('checkoutForm');
  if (form) {
    form.addEventListener('submit', placeOrder);
  }
})();
