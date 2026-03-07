
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = window.CartStore ? window.CartStore.getCartCount() : 0;
  badge.textContent = count;
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlistBadge');
  if (!badge) return;
  const count = WishlistStore.getAll().length;
  badge.textContent = count;
}

const WishlistStore = (() => {
  const STORAGE_KEY = 'berrybabes_wishlist';

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function getAll() {
    return read();
  }

  function isSaved(productId) {
    return read().some(item => item.id === productId);
  }

  function save(item) {
    const items = read();
    if (items.some(entry => entry.id === item.id)) {
      return false;
    }
    items.unshift(item);
    write(items);
    return true;
  }

  function remove(productId) {
    const items = read();
    const nextItems = items.filter(item => item.id !== productId);
    write(nextItems);
  }

  return {
    getAll,
    isSaved,
    save,
    remove
  };
})();

function updateWishButtonState(button, isSaved) {
  const icon = button.querySelector('i');
  if (!icon) return;

  icon.classList.toggle('far', !isSaved);
  icon.classList.toggle('fas', isSaved);
  icon.style.color = isSaved ? '#C4727F' : '';
}

function getProductFromCard(card) {
  const id = card.dataset.productId;
  const nameEl = card.querySelector('.product-card__name a, .product-card__name');
  const priceEl = card.querySelector('.product-card__price');
  const imgEl = card.querySelector('.product-card__img-wrap img');

  const priceMatch = (priceEl ? priceEl.textContent : '').match(/(\d+(?:\.\d+)?)/);

  return {
    id,
    name: nameEl ? nameEl.textContent.trim() : 'Product',
    price: priceMatch ? Number(priceMatch[1]) : 0,
    image: imgEl ? imgEl.getAttribute('src') || '' : ''
  };
}

function renderWishlist() {
  const wishlistGrid = document.getElementById('wishlistGrid');
  if (!wishlistGrid) return;

  const items = WishlistStore.getAll();

  if (!items.length) {
    wishlistGrid.innerHTML = `
      <div class="wishlist-empty">
        <h3>No wishlist items yet</h3>
        <p>Tap the heart icon on any product to save it here.</p>
      </div>
    `;
    return;
  }

  wishlistGrid.innerHTML = items
    .map(
      item => `
        <article class="product-card" data-product-id="${item.id}">
          <div class="product-card__img-wrap">
            <a href="product.html?id=${encodeURIComponent(item.id)}" class="product-link">
              <img src="${item.image || 'images/1.jpeg'}" alt="${item.name}" />
            </a>
            <div class="product-card__actions">
              <button class="add-cart-btn" onclick="addToCart('${item.name.replaceAll("'", "\\'")}', ${Number(item.price) || 149}, '${item.id}', 'Default', '${item.image || ''}')">
                <i class="fas fa-shopping-bag"></i> Add to Cart
              </button>
              <button class="wish-btn wish-remove-btn" data-wishlist-remove="${item.id}"><i class="fas fa-heart"></i></button>
            </div>
          </div>
          <div class="product-card__info">
            <span class="product-card__cat">Wishlist</span>
            <h3 class="product-card__name"><a href="product.html?id=${encodeURIComponent(item.id)}" class="product-link">${item.name}</a></h3>
            <p class="product-card__price">Pkr ${Number(item.price).toFixed(0)}</p>
          </div>
        </article>
      `
    )
    .join('');
}

function addToCart(name, price, productId, color = 'Default', image = '') {
  if (window.CartStore) {
    window.CartStore.addItem({
      id: productId || name.toLowerCase().replace(/\s+/g, '-'),
      name,
      price,
      color,
      image,
      quantity: 1
    });
  }
  updateCartBadge();
  showToast(`🛍️ ${name} (${color}) added to cart — Pkr ${price.toFixed(2)}`);
  
}

updateCartBadge();

// ─── Toast ────────────────────────────────────────────────────
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── Newsletter ───────────────────────────────────────────────
function handleNewsletter(e) {
  e.preventDefault();
  const form = e.target;
  const input = form.querySelector('input[type="email"]');
  const email = input ? input.value.trim() : '';

  if (!email) {
    showToast('Please enter a valid email address');
    return;
  }

  fetch('/api/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
    .then(async response => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Subscription failed');
      }

      if (payload.alreadySubscribed) {
        showToast('✅ You are already subscribed.');
      } else if (payload.emailSent) {
        showToast('🎉 Subscribed successfully! Welcome email sent.');
      } else {
        showToast('🎉 Subscribed successfully! Email service is currently unavailable.');
      }
      form.reset();
    })
    .catch(error => {
      showToast(`⚠️ ${error.message}`);
    });
}

// ─── Contact Form ─────────────────────────────────────────────
function handleContact(e) {
  e.preventDefault();
  showToast('✉️ Message sent! We\'ll get back to you soon.');
  e.target.reset();
}

// ─── Scrunchie Quiz ────────────────────────────────────────────
function handleQuiz(e) {
  e.preventDefault();

  const vibe = document.getElementById('quizVibe')?.value;
  const style = document.getElementById('quizStyle')?.value;
  const color = document.getElementById('quizColor')?.value;
  const result = document.getElementById('quizResult');

  if (!vibe || !style || !color || !result) {
    showToast('Please answer all quiz questions.');
    return;
  }

  const score = {
    'silk-scrunchie': 0,
    'pearl-collection': 0,
    'cotton-classic': 0,
    'satin-dream': 0,
    'silk-bundle': 0
  };

  if (vibe === 'soft') {
    score['silk-scrunchie'] += 3;
    score['satin-dream'] += 2;
  } else if (vibe === 'bold') {
    score['silk-bundle'] += 3;
    score['pearl-collection'] += 2;
  } else {
    score['cotton-classic'] += 3;
    score['silk-scrunchie'] += 1;
  }

  if (style === 'casual') {
    score['cotton-classic'] += 2;
    score['silk-scrunchie'] += 1;
  } else if (style === 'chic') {
    score['satin-dream'] += 2;
    score['pearl-collection'] += 1;
  } else {
    score['silk-bundle'] += 2;
    score['pearl-collection'] += 2;
  }

  if (color === 'rose') {
    score['pearl-collection'] += 3;
    score['silk-scrunchie'] += 1;
  } else if (color === 'neutral') {
    score['cotton-classic'] += 2;
    score['satin-dream'] += 1;
  } else {
    score['silk-bundle'] += 3;
    score['satin-dream'] += 1;
  }

  const topProductId = Object.keys(score).sort((a, b) => score[b] - score[a])[0];

  const productMeta = {
    'silk-scrunchie': { name: 'Golden Pearl Silk', note: 'Elegant silk tones grouped in one product set.' },
    'pearl-collection': { name: 'Pearl Collection', note: 'Multiple pearl shades grouped in one card.' },
    'cotton-classic': { name: 'Printed Fabric Set', note: 'All printed variants are available in one product.' },
    'satin-dream': { name: 'Skin Satin Set', note: 'Soft satin texture with a clean, classic finish.' },
    'silk-bundle': { name: 'Black Silk Scrunchie', note: 'Sleek black silk style that pairs with every look.' }
  };

  const match = productMeta[topProductId] || productMeta['silk-scrunchie'];

  result.style.display = 'block';
  result.innerHTML = `
    <h3>Your perfect match: ${match.name}</h3>
    <p>${match.note}</p>
    <div class="quiz-result__actions">
      <a class="btn btn--primary" href="product.html?id=${encodeURIComponent(topProductId)}">View Product</a>
      <button type="button" class="btn quiz-retake-btn" id="quizRetakeBtn">Retake Quiz</button>
    </div>
  `;

  result.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const retakeButton = document.getElementById('quizRetakeBtn');
  if (retakeButton) {
    retakeButton.addEventListener('click', () => {
      const form = document.getElementById('quizForm');
      if (form) form.reset();
      result.style.display = 'none';
      result.innerHTML = '';
      const quizSection = document.getElementById('quiz');
      if (quizSection) {
        quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

// ─── Hero Slider ──────────────────────────────────────────────
(function initSlider() {
  const slides = document.querySelectorAll('.slide');
  const dotsContainer = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const swipeHint = document.getElementById('sliderSwipeHint');
  if (!slides.length) return;

  let current = 0;
  let autoPlay;

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider__dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function getDots() {
    return document.querySelectorAll('.slider__dot');
  }

  function goTo(index) {
    slides[current].classList.remove('active');
    getDots()[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    getDots()[current].classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() {
    clearInterval(autoPlay);
    autoPlay = setInterval(next, 6000);
  }

  function hideSwipeHint() {
    if (swipeHint) swipeHint.classList.remove('visible');
  }

  prevBtn.addEventListener('click', () => { prev(); startAuto(); });
  nextBtn.addEventListener('click', () => { next(); startAuto(); });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prev(); startAuto(); }
    if (e.key === 'ArrowRight') { next(); startAuto(); }
  });

  // Touch / swipe support
  let touchStartX = 0;
  let touchStartY = 0;
  const slider = document.getElementById('slider');
  if (swipeHint && window.matchMedia('(max-width: 768px)').matches) {
    swipeHint.classList.add('visible');
  }

  prevBtn.addEventListener('click', hideSwipeHint);
  nextBtn.addEventListener('click', hideSwipeHint);

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Trigger swipe only when horizontal gesture is dominant.
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      diffX > 0 ? next() : prev();
      startAuto();
      hideSwipeHint();
    }
  }, { passive: true });

  dotsContainer.addEventListener('click', hideSwipeHint);

  startAuto();
})();

// ─── Home Products From Shared Data ───────────────────────────
(function renderHomeProductsFromData() {
  const productsGrid = document.getElementById('productsGrid');
  const allProducts = window.BerryBabesProducts;
  if (!productsGrid || !allProducts) return;

  const badgeById = {
    'silk-scrunchie': 'Featured',
    'pearl-collection': 'Pearl',
    'cotton-classic': 'Printed',
    'satin-dream': 'Plain',
    'silk-bundle': 'Plain',
    'spring-bloom': 'Plain'
  };

  function homeCategory(product) {
    const normalized = (product.category || '').toLowerCase();
    if (normalized === 'printed') {
      return 'printed';
    }
    return 'silk';
  }

  function renderCard({ id, category, title, displayCategory, price, image, badge, defaultColor }) {
    const safeName = title.replaceAll("'", "\\'");
    const safeColor = (defaultColor || 'Default').replaceAll("'", "\\'");
    const url = defaultColor
      ? `product.html?id=${encodeURIComponent(id)}&color=${encodeURIComponent(defaultColor)}`
      : `product.html?id=${encodeURIComponent(id)}`;
    const badgeHtml = badge ? `<span class="product-card__badge">${badge}</span>` : '';

    return `
      <div class="product-card" data-category="${category}" data-product-id="${id}" data-product-url="${url}">
        <div class="product-card__img-wrap">
          <a href="${url}" class="product-link">
            <img src="${image}" alt="${title}" />
          </a>
          ${badgeHtml}
          <div class="product-card__actions">
            <button class="add-cart-btn" onclick="addToCart('${safeName}', ${Number(price) || 149}, '${id}', '${safeColor}', '${image}')">
              <i class="fas fa-shopping-bag"></i> Add to Cart
            </button>
            <button class="wish-btn"><i class="far fa-heart"></i></button>
          </div>
        </div>
        <div class="product-card__info">
          <span class="product-card__cat">${displayCategory}</span>
          <h3 class="product-card__name"><a href="${url}" class="product-link">${title}</a></h3>
          <p class="product-card__price">Pkr ${Number(price) || 149}</p>
        </div>
      </div>
    `;
  }

  const cards = [];

  Object.entries(allProducts).forEach(([id, product]) => {
    const category = homeCategory(product);
    const badge = badgeById[id] || '';

    // Expand printed product into separate variant cards to show more options.
    if (id === 'cotton-classic' && Array.isArray(product.colors) && product.colors.length) {
      product.colors.forEach(color => {
        cards.push(
          renderCard({
            id,
            category,
            title: color,
            displayCategory: 'Printed',
            price: product.price,
            image: (product.colorImages && product.colorImages[color]) || product.image,
            badge: 'Printed',
            defaultColor: color
          })
        );
      });
      return;
    }

    cards.push(
      renderCard({
        id,
        category,
        title: product.name,
        displayCategory: product.category,
        price: product.price,
        image: product.image,
        badge,
        defaultColor: ''
      })
    );
  });

  const html = cards.join('');

  productsGrid.innerHTML = html;
})();

// ─── Filter Buttons ───────────────────────────────────────────
(function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.product-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
})();

// ─── Sticky Header Shadow ─────────────────────────────────────
(function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
})();

// ─── Mobile Menu ──────────────────────────────────────────────
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    nav.classList.toggle('open');
  });

  // Close menu when a link is clicked
  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      nav.classList.remove('open');
    });
  });
})();

// ─── Active Nav Link on Scroll ────────────────────────────────
(function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav__link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) {
        current = section.id;
      }
    });
    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
})();

// ─── Scroll to Top ────────────────────────────────────────────
(function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ─── Wishlist heart toggle ─────────────────────────────────────
document.querySelectorAll('.wish-btn').forEach(btn => {
  const card = btn.closest('.product-card');
  const product = card ? getProductFromCard(card) : null;

  if (product && product.id) {
    updateWishButtonState(btn, WishlistStore.isSaved(product.id));
  }

  btn.addEventListener('click', () => {
    if (!product || !product.id) return;

    const saved = WishlistStore.isSaved(product.id);
    if (saved) {
      WishlistStore.remove(product.id);
      updateWishButtonState(btn, false);
      showToast(`💔 ${product.name} removed from wishlist`);
    } else {
      WishlistStore.save(product);
      updateWishButtonState(btn, true);
      showToast(`❤️ ${product.name} saved to wishlist`);
    }

    renderWishlist();
    updateWishlistBadge();
  });
});

document.addEventListener('click', event => {
  const removeButton = event.target.closest('[data-wishlist-remove]');
  if (!removeButton) return;

  const id = removeButton.dataset.wishlistRemove;
  if (!id) return;

  WishlistStore.remove(id);
  renderWishlist();
  updateWishlistBadge();

  document.querySelectorAll(`.product-card[data-product-id="${id}"] .wish-btn`).forEach(button => {
    updateWishButtonState(button, false);
  });

  showToast('💔 Removed from wishlist');
});

renderWishlist();
updateWishlistBadge();

// ─── Product Card Navigation ───────────────────────────────────
(function initProductCardNavigation() {
  const cards = document.querySelectorAll('.product-card[data-product-id]');

  cards.forEach(card => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('.add-cart-btn, .wish-btn, .product-card__actions, a')) {
        return;
      }

      const productUrl = card.dataset.productUrl;
      if (productUrl) {
        window.location.href = productUrl;
        return;
      }

      const productId = card.dataset.productId;
      if (!productId) return;
      window.location.href = `product.html?id=${encodeURIComponent(productId)}`;
    });
  });
})();
