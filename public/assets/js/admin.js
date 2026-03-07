function money(value) {
  return `Pkr ${Number(value).toFixed(0)}`;
}

const ADMIN_KEY_STORAGE_KEY = 'berrybabes_admin_api_key';

function getAdminApiKey() {
  try {
    return String(sessionStorage.getItem(ADMIN_KEY_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

function saveAdminApiKey(value) {
  try {
    sessionStorage.setItem(ADMIN_KEY_STORAGE_KEY, String(value || '').trim());
  } catch {
    // Ignore session storage failures and rely on in-memory prompt flow.
  }
}

function clearAdminApiKey() {
  try {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
  } catch {
    // Ignore session storage failures.
  }
}

function promptAdminApiKey() {
  const value = window.prompt('Enter Admin API Key');
  const key = String(value || '').trim();
  if (!key) return '';
  saveAdminApiKey(key);
  return key;
}

async function adminFetch(url, options = {}) {
  let adminKey = getAdminApiKey();
  if (!adminKey) {
    adminKey = promptAdminApiKey();
  }

  if (!adminKey) {
    throw new Error('Admin key is required');
  }

  const headers = {
    ...(options.headers || {}),
    'X-Admin-Key': adminKey
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearAdminApiKey();
  }

  return response;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setStatus(message, isError = false) {
  const status = document.getElementById('adminStatus');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('admin-status--error', isError);
}

function orderCard(order) {
  const items = (order.items || [])
    .map(item => {
      const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);
      return `<li>${escapeHtml(item.name)} (${escapeHtml(item.color)}) x${Number(item.quantity || 0)} — ${money(itemTotal)}</li>`;
    })
    .join('');

  return `
    <article class="admin-order-card">
      <div class="admin-order-card__top">
        <h3>${escapeHtml(order.id || 'Order')}</h3>
        <span>${new Date(order.createdAt).toLocaleString()}</span>
      </div>
      <div class="admin-order-card__grid">
        <p><strong>Name:</strong> ${escapeHtml(order.fullName)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(order.phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(order.email || '-')}</p>
        <p><strong>State:</strong> ${escapeHtml(order.state || '-')}</p>
        <p><strong>City:</strong> ${escapeHtml(order.city)}</p>
        <p><strong>Postal Code:</strong> ${escapeHtml(order.postalCode)}</p>
      </div>
      <p><strong>Address:</strong> ${escapeHtml(order.address)}</p>
      <p><strong>Notes:</strong> ${escapeHtml(order.notes || '-')}</p>
      <ul class="admin-order-items">${items}</ul>
      <p class="admin-order-total"><strong>Total:</strong> ${money(order.total || 0)}</p>
    </article>
  `;
}

function subscriberCard(subscriber) {
  return `
    <article class="admin-order-card">
      <div class="admin-order-card__top">
        <h3>${escapeHtml(subscriber.email)}</h3>
        <span>${new Date(subscriber.createdAt).toLocaleString()}</span>
      </div>
    </article>
  `;
}

function reviewCard(review) {
  const statusClass = review.approved === false ? '' : 'admin-review-status--approved';
  const statusText = review.approved === false ? 'Pending' : 'Approved';
  const imageHtml = review.imageData
    ? `<div class="admin-review-image"><img src="${review.imageData}" alt="Review by ${escapeHtml(review.name)}" /></div>`
    : '';

  return `
    <article class="admin-order-card" data-review-id="${escapeHtml(review.id)}">
      <div class="admin-order-card__top">
        <h3>${escapeHtml(review.name)}</h3>
        <span>${new Date(review.createdAt).toLocaleString()}</span>
      </div>
      <div class="admin-review-meta">
        <span><strong>Product:</strong> ${escapeHtml(review.productId)}</span>
        <span><strong>Rating:</strong> ${'★'.repeat(Number(review.rating) || 0)}</span>
        <span class="admin-review-status ${statusClass}">${statusText}</span>
      </div>
      <p>${escapeHtml(review.review)}</p>
      ${imageHtml}
      <div class="admin-review-actions">
        <button type="button" class="admin-review-btn" data-review-action="approve">Approve</button>
        <button type="button" class="admin-review-btn" data-review-action="hide">Hide</button>
      </div>
    </article>
  `;
}

function productCard([id, product]) {
  const colors = Array.isArray(product.colors) ? product.colors.join(', ') : '-';
  return `
    <article class="admin-order-card" data-product-id="${escapeHtml(id)}">
      <div class="admin-order-card__top">
        <h3>${escapeHtml(product.name || id)}</h3>
        <span>${escapeHtml(id)}</span>
      </div>
      <div class="admin-order-card__grid">
        <p><strong>Category:</strong> ${escapeHtml(product.category || '-')}</p>
        <p><strong>Price:</strong> ${money(product.price || 0)}</p>
        <p><strong>Colors:</strong> ${escapeHtml(colors)}</p>
      </div>
      <p><strong>Image:</strong> ${escapeHtml(product.image || '-')}</p>
      <p>${escapeHtml(product.description || '')}</p>
      <div class="admin-review-actions">
        <button type="button" class="admin-review-btn" data-product-action="delete">Delete Product</button>
      </div>
    </article>
  `;
}

function renderOrders(orders) {
  const container = document.getElementById('adminOrders');
  if (!container) return;

  if (!orders.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <h2>No orders yet</h2>
        <p>Placed orders will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(orderCard).join('');
}

function renderSubscribers(subscribers) {
  const container = document.getElementById('adminSubscribers');
  if (!container) return;

  if (!subscribers.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <h2>No subscribers yet</h2>
        <p>New newsletter subscribers will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = subscribers.map(subscriberCard).join('');
}

function renderReviews(reviews) {
  const container = document.getElementById('adminReviews');
  if (!container) return;

  if (!reviews.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <h2>No customer reviews yet</h2>
        <p>Customer submitted reviews will appear here for moderation.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reviews.map(reviewCard).join('');
}

function renderProducts(products) {
  const container = document.getElementById('adminProducts');
  if (!container) return;

  const entries = Object.entries(products || {});
  if (!entries.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <h2>No products yet</h2>
        <p>Add your first product using the form above.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = entries.map(productCard).join('');
}

function toCsv(rows) {
  const escapedRows = rows.map(cells =>
    cells
      .map(cell => `"${String(cell || '').replaceAll('"', '""')}"`)
      .join(',')
  );
  return escapedRows.join('\n');
}

function downloadCsv(fileName, rows) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ordersToCsvRows(orders) {
  const header = [
    'id',
    'fullName',
    'phone',
    'email',
    'address',
    'state',
    'city',
    'postalCode',
    'notes',
    'total',
    'createdAt',
    'items'
  ];
  const body = orders.map(order => [
    order.id,
    order.fullName,
    order.phone,
    order.email,
    order.address,
    order.state,
    order.city,
    order.postalCode,
    order.notes,
    order.total,
    order.createdAt,
    (order.items || [])
      .map(item => `${item.name} (${item.color}) x${item.quantity}`)
      .join(' | ')
  ]);

  return [header, ...body];
}

function subscribersToCsvRows(subscribers) {
  const header = ['email', 'createdAt'];
  const body = subscribers.map(subscriber => [subscriber.email, subscriber.createdAt]);
  return [header, ...body];
}

async function loadAdminData() {
  const [productsResponse, ordersResponse, subscribersResponse, reviewsResponse] = await Promise.all([
    adminFetch('/api/admin/products'),
    adminFetch('/api/orders'),
    adminFetch('/api/subscribers'),
    adminFetch('/api/reviews?includeAll=1')
  ]);

  if (!productsResponse.ok || !ordersResponse.ok || !subscribersResponse.ok || !reviewsResponse.ok) {
    throw new Error('Unable to load admin data');
  }

  const productsPayload = await productsResponse.json();
  const ordersPayload = await ordersResponse.json();
  const subscribersPayload = await subscribersResponse.json();
  const reviewsPayload = await reviewsResponse.json();
  const products = productsPayload.products || {};
  const orders = ordersPayload.orders || [];
  const subscribers = subscribersPayload.subscribers || [];
  const reviews = reviewsPayload.reviews || [];

  renderProducts(products);
  renderOrders(orders);
  renderSubscribers(subscribers);
  renderReviews(reviews);
  return { products, orders, subscribers, reviews };
}

async function saveProductFromForm(form) {
  const payload = {
    name: document.getElementById('productName').value.trim(),
    category: document.getElementById('productCategory').value.trim(),
    price: Number(document.getElementById('productPrice').value || 0),
    image: document.getElementById('productImage').value.trim(),
    description: document.getElementById('productDescription').value.trim(),
    colors: document.getElementById('productColors').value,
    galleryImages: document.getElementById('productGallery').value
  };

  const response = await adminFetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Unable to save product');
  }

  form.reset();
}

async function deleteProduct(productId) {
  const confirmed = window.confirm('Delete this product? This cannot be undone.');
  if (!confirmed) return false;

  const response = await adminFetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('Unable to delete product');
  }

  return true;
}

async function moderateReview(reviewId, approved) {
  const response = await adminFetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved })
  });

  if (!response.ok) {
    throw new Error('Unable to update review status');
  }
}

async function clearCollection(endpoint, label) {
  const isConfirmed = window.confirm(`Clear all ${label}? This cannot be undone.`);
  if (!isConfirmed) {
    return false;
  }

  const response = await adminFetch(endpoint, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Unable to clear ${label}`);
  }

  return true;
}

function setupActions(getState, refreshData) {
  const productForm = document.getElementById('productForm');
  const productsContainer = document.getElementById('adminProducts');
  const refreshButton = document.getElementById('refreshAdmin');
  const exportOrdersButton = document.getElementById('exportOrders');
  const exportSubscribersButton = document.getElementById('exportSubscribers');
  const clearOrdersButton = document.getElementById('clearOrders');
  const clearSubscribersButton = document.getElementById('clearSubscribers');
  const reviewsContainer = document.getElementById('adminReviews');

  if (productForm) {
    productForm.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        await saveProductFromForm(productForm);
        await refreshData();
        setStatus('Product saved successfully.');
      } catch (error) {
        setStatus(error.message || 'Unable to save product.', true);
      }
    });
  }

  if (productsContainer) {
    productsContainer.addEventListener('click', async event => {
      const button = event.target.closest('[data-product-action="delete"]');
      if (!button) return;

      const card = button.closest('[data-product-id]');
      if (!card) return;

      try {
        const deleted = await deleteProduct(card.dataset.productId);
        if (!deleted) return;
        await refreshData();
        setStatus('Product deleted.');
      } catch (error) {
        setStatus(error.message || 'Unable to delete product.', true);
      }
    });
  }

  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      try {
        await refreshData();
        setStatus('Admin data refreshed.');
      } catch {
        setStatus('Unable to refresh admin data.', true);
      }
    });
  }

  if (exportOrdersButton) {
    exportOrdersButton.addEventListener('click', () => {
      const state = getState();
      downloadCsv('orders.csv', ordersToCsvRows(state.orders));
      setStatus('Orders CSV exported.');
    });
  }

  if (exportSubscribersButton) {
    exportSubscribersButton.addEventListener('click', () => {
      const state = getState();
      downloadCsv('subscribers.csv', subscribersToCsvRows(state.subscribers));
      setStatus('Subscribers CSV exported.');
    });
  }

  if (clearOrdersButton) {
    clearOrdersButton.addEventListener('click', async () => {
      try {
        const cleared = await clearCollection('/api/orders', 'orders');
        if (!cleared) return;
        await refreshData();
        setStatus('Orders cleared.');
      } catch {
        setStatus('Unable to clear orders.', true);
      }
    });
  }

  if (clearSubscribersButton) {
    clearSubscribersButton.addEventListener('click', async () => {
      try {
        const cleared = await clearCollection('/api/subscribers', 'subscribers');
        if (!cleared) return;
        await refreshData();
        setStatus('Subscribers cleared.');
      } catch {
        setStatus('Unable to clear subscribers.', true);
      }
    });
  }

  if (reviewsContainer) {
    reviewsContainer.addEventListener('click', async event => {
      const button = event.target.closest('[data-review-action]');
      if (!button) return;

      const card = button.closest('[data-review-id]');
      if (!card) return;

      const reviewId = card.dataset.reviewId;
      const action = button.dataset.reviewAction;
      const approved = action === 'approve';

      try {
        await moderateReview(reviewId, approved);
        await refreshData();
        setStatus(approved ? 'Review approved.' : 'Review hidden from storefront.');
      } catch {
        setStatus('Unable to update review status.', true);
      }
    });
  }
}

(function initAdminOrders() {
  const state = {
    products: {},
    orders: [],
    subscribers: [],
    reviews: []
  };

  async function refreshData() {
    const data = await loadAdminData();
    state.products = data.products;
    state.orders = data.orders;
    state.subscribers = data.subscribers;
    state.reviews = data.reviews;
  }

  setupActions(() => state, refreshData);

  refreshData().catch(error => {
    const productsContainer = document.getElementById('adminProducts');
    const ordersContainer = document.getElementById('adminOrders');
    const subscribersContainer = document.getElementById('adminSubscribers');
    const reviewsContainer = document.getElementById('adminReviews');

    if (productsContainer) {
      productsContainer.innerHTML = `
        <div class="cart-empty">
          <h2>Unable to load products</h2>
          <p>Check server status and admin key.</p>
        </div>
      `;
    }

    if (ordersContainer) {
      ordersContainer.innerHTML = `
        <div class="cart-empty">
          <h2>Unable to load orders</h2>
          <p>Make sure the backend server is running.</p>
        </div>
      `;
    }

    if (subscribersContainer) {
      subscribersContainer.innerHTML = `
        <div class="cart-empty">
          <h2>Unable to load subscribers</h2>
          <p>Make sure the backend server is running.</p>
        </div>
      `;
    }

    if (reviewsContainer) {
      reviewsContainer.innerHTML = `
        <div class="cart-empty">
          <h2>Unable to load reviews</h2>
          <p>Make sure the backend server is running.</p>
        </div>
      `;
    }

    const message = (error && error.message) ? error.message : 'Unable to load admin data.';
    setStatus(message.includes('Admin key') ? message : 'Unable to load admin data. Check admin key and server settings.', true);
  });
})();
