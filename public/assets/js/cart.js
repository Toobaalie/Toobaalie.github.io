(function initCartStore() {
  const STORAGE_KEY = 'berrybabes_cart';
  const MAX_ITEM_QUANTITY = 10;

  function getCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function getCartCount() {
    return getCart().reduce((total, item) => total + (item.quantity || 0), 0);
  }

  function addItem(item) {
    const cart = getCart();
    const normalized = {
      id: item.id || item.name.toLowerCase().replace(/\s+/g, '-'),
      name: item.name,
      price: Number(item.price) || 0,
      originalPrice: Number(item.originalPrice) || Number(item.price) || 0,
      color: item.color || 'Default',
      image: item.image || '',
      quantity: Math.min(MAX_ITEM_QUANTITY, Math.max(1, Number(item.quantity) || 1))
    };

    const existing = cart.find(
      product => product.id === normalized.id && product.color === normalized.color
    );

    if (existing) {
      existing.quantity = Math.min(MAX_ITEM_QUANTITY, existing.quantity + normalized.quantity);
      existing.originalPrice = Number(existing.originalPrice) || normalized.originalPrice;
    } else {
      cart.push(normalized);
    }

    saveCart(cart);
    return getCartCount();
  }

  window.CartStore = {
    getCart,
    saveCart,
    getCartCount,
    addItem
  };
})();
