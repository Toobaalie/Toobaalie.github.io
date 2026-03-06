(function initCartStore() {
  const STORAGE_KEY = 'berrybabes_cart';

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
      color: item.color || 'Default',
      image: item.image || '',
      quantity: Math.max(1, Number(item.quantity) || 1)
    };

    const existing = cart.find(
      product => product.id === normalized.id && product.color === normalized.color
    );

    if (existing) {
      existing.quantity += normalized.quantity;
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
