function money(value) {
  return `Pkr ${Number(value).toFixed(0)}`;
}

const MAX_ITEM_QUANTITY = 10;

const recommendationCatalog = {
  'silk-scrunchie': { id: 'silk-scrunchie', name: 'Golden Pearl Silk', image: 'images/golden pearl diff.jpeg', category: 'silk' },
  'pearl-collection': { id: 'pearl-collection', name: 'Pearl Collection', image: 'images/pearl black.jpeg', category: 'silk' },
  'cotton-classic': { id: 'cotton-classic', name: 'Printed Fabric Set', image: 'images/printed fabric.jpeg', category: 'printed' },
  'satin-dream': { id: 'satin-dream', name: 'Skin Satin Set', image: 'images/silk 4.jpeg', category: 'silk' },
  'silk-bundle': { id: 'silk-bundle', name: 'Black Silk Scrunchie', image: 'images/black plain silk.jpeg', category: 'silk' },
  'spring-bloom': { id: 'spring-bloom', name: 'Silk Navy Blue', image: 'images/1.jpeg', category: 'silk' },
  'pearl-trio-set': { id: 'pearl-trio-set', name: 'The Pearl Trio Set', image: 'images/trio.png', category: 'bundles' }
};

function getRecommendedProducts(items) {
  const cartIds = new Set(items.map(item => item.id));
  const allProducts = Object.values(recommendationCatalog);
  const lastViewedId = localStorage.getItem('berrybabes_last_viewed');
  const lastViewed = recommendationCatalog[lastViewedId];

  let ordered = allProducts;

  if (lastViewed) {
    const sameCategory = allProducts.filter(product => product.category === lastViewed.category && product.id !== lastViewed.id);
    const otherCategory = allProducts.filter(product => product.category !== lastViewed.category && product.id !== lastViewed.id);
    ordered = [lastViewed, ...sameCategory, ...otherCategory];
  }

  return ordered.filter(product => !cartIds.has(product.id)).slice(0, 3);
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

function getWishlistItems() {
  try {
    const raw = localStorage.getItem('berrybabes_wishlist');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWishlistItems(items) {
  localStorage.setItem('berrybabes_wishlist', JSON.stringify(items));
}

function renderWishlist() {
  const container = document.getElementById('cartWishlist');
  if (!container) return;

  const items = getWishlistItems();

  if (!items.length) {
    container.innerHTML = `
      <div class="cart-wishlist-empty">
        <p>No wishlist items yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items
    .map(
      item => `
      <article class="cart-wishlist-card" data-wishlist-id="${item.id}">
        <a href="product.html?id=${encodeURIComponent(item.id)}" class="cart-wishlist-card__media">
          <img src="${item.image || 'images/1.jpeg'}" alt="${item.name}" />
        </a>
        <div class="cart-wishlist-card__info">
          <h3><a href="product.html?id=${encodeURIComponent(item.id)}">${item.name}</a></h3>
          <p>${money(item.price || 0)}</p>
        </div>
        <div class="cart-wishlist-card__actions">
          <button class="btn btn--primary" data-wishlist-action="add">Add to Cart</button>
          <button class="cart-remove" data-wishlist-action="remove">Remove</button>
        </div>
      </article>
    `
    )
    .join('');
}

function renderCart() {
  const cartContent = document.getElementById('cartContent');
  if (!cartContent || !window.CartStore) return;

  const items = window.CartStore.getCart();

  if (!items.length) {
    const recommendations = getRecommendedProducts(items);
    const recommendationCards = recommendations
      .map(
        product => `
            <a class="cart-reco-card" href="product.html?id=${product.id}">
              <img src="${product.image}" alt="${product.name}" />
              <span>${product.name}</span>
            </a>
          `
      )
      .join('');

    cartContent.classList.add('cart-content--empty');
    cartContent.innerHTML = `
      <div class="cart-empty-wrap">
        <div class="cart-empty">
          <div class="cart-empty__icon"><i class="fas fa-shopping-bag"></i></div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven’t added any scrunchies yet. Explore our latest collection and find your perfect match.</p>
          <div class="cart-empty__actions">
            <a href="index.html#products" class="btn btn--primary">Shop Products</a>
            <a href="index.html" class="btn cart-empty__secondary">Back to Home</a>
          </div>
        </div>

        <section class="cart-recommended" aria-label="Recommended products">
          <h3>You may also like</h3>
          <div class="cart-recommended__grid">
            ${recommendationCards}
          </div>
        </section>
      </div>
    `;
    updateCartBadge();
    return;
  }

  cartContent.classList.remove('cart-content--empty');

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartContent.innerHTML = `
    <div class="cart-list">
      ${items
        .map(
          (item, index) => `
          <article class="cart-item" data-index="${index}">
            <div class="cart-item__img-wrap">
              <img src="${item.image || 'images/1.jpeg'}" alt="${item.name}" />
            </div>
            <div class="cart-item__info">
              <h3>${item.name}</h3>
              <p>Color: ${item.color}</p>
              <p>${money(item.price)}</p>
            </div>
            <div class="cart-item__actions">
              <div class="qty-control">
                <button class="qty-btn" data-action="minus">-</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn" data-action="plus">+</button>
              </div>
              <button class="cart-remove" data-action="remove">Remove</button>
            </div>
          </article>
        `
        )
        .join('')}
    </div>

    <aside class="cart-summary">
      <h3>Order Summary</h3>
      <p>Total: <strong>${money(total)}</strong></p>
      <a class="btn btn--primary" href="checkout.html">Checkout</a>
    </aside>
  `;

  updateCartBadge();
  updateWishlistBadge();
}

function updateItem(index, action) {
  const cart = window.CartStore.getCart();
  const item = cart[index];
  if (!item) return;

  if (action === 'plus') {
    if (item.quantity >= MAX_ITEM_QUANTITY) {
      showToast('Maximum quantity is 10');
    } else {
      item.quantity += 1;
    }
  }

  if (action === 'minus') {
    item.quantity = Math.max(1, item.quantity - 1);
  }

  if (action === 'remove') {
    cart.splice(index, 1);
    showToast('Item removed from cart');
  }

  window.CartStore.saveCart(cart);
  renderCart();
}

function handleWishlistAction(itemId, action) {
  const wishlist = getWishlistItems();
  const item = wishlist.find(entry => entry.id === itemId);
  if (!item) return;

  if (action === 'add') {
    if (window.CartStore) {
      window.CartStore.addItem({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        color: 'Default',
        image: item.image || '',
        quantity: 1
      });
    }
    showToast('Item added to cart');
    renderCart();
    return;
  }

  if (action === 'remove') {
    const nextWishlist = wishlist.filter(entry => entry.id !== itemId);
    saveWishlistItems(nextWishlist);
    showToast('Item removed from wishlist');
    renderWishlist();
    updateWishlistBadge();
  }
}

(function initCartPage() {
  renderCart();
  renderWishlist();
  updateWishlistBadge();

  const cartContent = document.getElementById('cartContent');
  if (!cartContent) return;

  cartContent.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const item = button.closest('.cart-item');
    if (!item) return;

    const index = Number(item.dataset.index);
    const action = button.dataset.action;
    updateItem(index, action);
  });

  const wishlistContent = document.getElementById('cartWishlist');
  if (!wishlistContent) return;

  wishlistContent.addEventListener('click', event => {
    const button = event.target.closest('[data-wishlist-action]');
    if (!button) return;

    const card = button.closest('[data-wishlist-id]');
    if (!card) return;

    const action = button.dataset.wishlistAction;
    const itemId = card.dataset.wishlistId;
    handleWishlistAction(itemId, action);
  });
})();
