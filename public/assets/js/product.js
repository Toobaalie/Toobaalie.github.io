const products = window.BerryBabesProducts || {};

let selectedColor = '';
let selectedQuantity = 1;
let selectedImage = '';
const MAX_ITEM_QUANTITY = 10;
const reviewImageBuckets = new Map();

let reviewLightboxImages = [];
let reviewLightboxIndex = 0;

function getProductFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return products[id] || products['silk-scrunchie'];
}

function getSelectedColorFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get('color') || '').trim();
}

function stars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = window.CartStore ? window.CartStore.getCartCount() : 0;
  badge.textContent = count;
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

function getImageByColor(product, color) {
  if (product.colorImages && product.colorImages[color]) {
    return product.colorImages[color];
  }
  return product.image;
}

function setMetaContent(selector, content) {
  const element = document.querySelector(selector);
  if (!element || !content) return;
  element.setAttribute('content', content);
}

function setProductSeoMeta(product, productId) {
  const pageTitle = `${product.name} Scrunchie in Pakistan | BerryBabes.me`;
  const pageDescription = `${product.description} Shop ${product.name} scrunchie online in Pakistan at BerryBabes.me.`;
  const canonicalUrl = `https://berrybabes.me/product.html?id=${encodeURIComponent(productId)}`;
  const imageUrl = `https://berrybabes.me/${String(product.image || '').replace(/^\//, '')}`;

  document.title = pageTitle;
  setMetaContent('meta[name="description"]', pageDescription);
  setMetaContent('meta[property="og:title"]', pageTitle);
  setMetaContent('meta[property="og:description"]', pageDescription);
  setMetaContent('meta[property="og:url"]', canonicalUrl);
  setMetaContent('meta[property="og:image"]', imageUrl);
  setMetaContent('meta[name="twitter:title"]', pageTitle);
  setMetaContent('meta[name="twitter:description"]', pageDescription);
  setMetaContent('meta[name="twitter:image"]', imageUrl);

  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) {
    canonicalLink.setAttribute('href', canonicalUrl);
  }

  const aggregateRating = Array.isArray(product.reviews) && product.reviews.length
    ? (product.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / product.reviews.length).toFixed(1)
    : null;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: [imageUrl],
    sku: productId,
    brand: {
      '@type': 'Brand',
      name: 'BerryBabes.me'
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'PKR',
      price: String(product.price),
      availability: 'https://schema.org/InStock'
    }
  };

  if (aggregateRating) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating,
      reviewCount: String(product.reviews.length)
    };
  }

  let schemaScript = document.getElementById('productJsonLd');
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.id = 'productJsonLd';
    document.head.appendChild(schemaScript);
  }

  schemaScript.textContent = JSON.stringify(productSchema);
}

function renderProduct(product) {
  const detail = document.getElementById('productDetail');
  if (!detail) return;

  const preferredColor = getSelectedColorFromUrl();
  selectedColor = product.colors.includes(preferredColor) ? preferredColor : product.colors[0];
  selectedImage = getImageByColor(product, selectedColor);
  selectedQuantity = 1;
  const thumbImages = Array.isArray(product.galleryImages) && product.galleryImages.length
    ? product.galleryImages
    : product.colors.map(color => getImageByColor(product, color));

  detail.innerHTML = `
    <div class="product-detail__media">
      <img src="${selectedImage}" alt="${product.name}" id="detailMainImage" />
      <div class="product-detail__thumbs" id="detailThumbs">
        ${thumbImages
          .map((image, index) => {
            const isActive = image === selectedImage || (index === 0 && !thumbImages.includes(selectedImage));
            return `
              <button type="button" class="product-detail__thumb ${isActive ? 'active' : ''}" data-image="${image}" aria-label="${product.name} view ${index + 1}">
                <img src="${image}" alt="${product.name} view ${index + 1}" />
              </button>
            `;
          })
          .join('')}
      </div>
    </div>
    <div class="product-detail__content">
      <span class="product-card__cat">${product.category}</span>
      <h1 class="product-detail__title">${product.name}</h1>
      <p class="product-detail__price">Pkr ${product.price}</p>
      <p class="product-detail__desc">${product.description}</p>

      <div class="product-detail__colors">
        <h3>Choose Color</h3>
        <div class="color-options" id="colorOptions">
          ${product.colors
            .map(
              (color, index) => {
                const colorImage = getImageByColor(product, color);
                return `<button class="color-option ${color === selectedColor ? 'active' : ''}" data-color="${color}" aria-label="${color}">
                  <img class="color-option__img" src="${colorImage}" alt="${color}" />
                  <span class="color-option__label">${color}</span>
                </button>`;
              }
            )
            .join('')}
        </div>
      </div>

      <div class="product-detail__qty">
        <h3>Quantity</h3>
        <div class="qty-control">
          <button class="qty-btn" id="qtyMinus" aria-label="Decrease quantity">-</button>
          <span class="qty-value" id="qtyValue">1</span>
          <button class="qty-btn" id="qtyPlus" aria-label="Increase quantity">+</button>
        </div>
      </div>

      <button class="btn btn--primary product-detail__add" id="detailAddToCart">
        <i class="fas fa-shopping-bag"></i> Add to Cart
      </button>
    </div>
  `;

  const colorButtons = detail.querySelectorAll('.color-option');
  const thumbButtons = detail.querySelectorAll('.product-detail__thumb');
  const mainImage = document.getElementById('detailMainImage');

  function setActiveColor(color) {
    selectedColor = color;
    selectedImage = getImageByColor(product, selectedColor);

    colorButtons.forEach(item => {
      item.classList.toggle('active', item.dataset.color === selectedColor);
    });

    thumbButtons.forEach(item => {
      item.classList.toggle('active', item.dataset.image === selectedImage);
    });

    if (mainImage) {
      mainImage.src = selectedImage;
      mainImage.alt = `${product.name} - ${selectedColor}`;
    }
  }

  colorButtons.forEach(button => {
    button.addEventListener('click', () => {
      setActiveColor(button.dataset.color);
    });
  });

  thumbButtons.forEach(button => {
    button.addEventListener('click', () => {
      selectedImage = button.dataset.image;
      thumbButtons.forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      if (mainImage) {
        mainImage.src = selectedImage;
        mainImage.alt = `${product.name} - ${selectedColor}`;
      }
    });
  });

  const addButton = document.getElementById('detailAddToCart');
  const qtyValue = document.getElementById('qtyValue');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');

  qtyMinus.addEventListener('click', () => {
    selectedQuantity = Math.max(1, selectedQuantity - 1);
    qtyValue.textContent = selectedQuantity;
  });

  qtyPlus.addEventListener('click', () => {
    if (selectedQuantity >= MAX_ITEM_QUANTITY) {
      showToast('Maximum quantity is 10');
      return;
    }
    selectedQuantity += 1;
    qtyValue.textContent = selectedQuantity;
  });

  addButton.addEventListener('click', () => {
    if (window.CartStore) {
      window.CartStore.addItem({
        id: window.currentProductId,
        name: product.name,
        price: product.price,
        color: selectedColor,
        image: selectedImage,
        quantity: selectedQuantity
      });
    }
    updateCartBadge();
    showToast(`🛍️ ${product.name} (${selectedColor}) x${selectedQuantity} added to cart`);
  });
}

function renderReviews(product) {
  const reviewsGrid = document.getElementById('reviewsGrid');
  if (!reviewsGrid) return;

  reviewsGrid.innerHTML = product.reviews
    .map(
      review => `
      <article class="review-card">
        <div class="review-card__top">
          <h3>${review.name}</h3>
          <span>${stars(review.rating)}</span>
        </div>
        <p>${review.text}</p>
      </article>
    `
    )
    .join('');
}

function renderMoreProducts(currentProductId) {
  const grid = document.getElementById('moreProductsGrid');
  if (!grid) return;

  const cardsHtml = Object.entries(products)
    .map(([id, product]) => {
      const badge = id === currentProductId
        ? '<span class="product-card__badge">Current</span>'
        : '';

      return `
        <article class="product-card" data-product-id="${id}">
          <div class="product-card__img-wrap">
            <a href="product.html?id=${encodeURIComponent(id)}" class="product-link">
              <img src="${product.image}" alt="${product.name}" />
            </a>
            ${badge}
          </div>
          <div class="product-card__info">
            <span class="product-card__cat">${product.category}</span>
            <h3 class="product-card__name">
              <a href="product.html?id=${encodeURIComponent(id)}" class="product-link">${product.name}</a>
            </h3>
            <p class="product-card__price">Pkr ${product.price}</p>
          </div>
        </article>
      `;
    })
    .join('');

  grid.innerHTML = cardsHtml;
}

function formatReviewDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read image file'));
    reader.readAsDataURL(file);
  });
}

function getReviewLightboxElements() {
  return {
    modal: document.getElementById('reviewLightbox'),
    image: document.getElementById('reviewLightboxImage'),
    caption: document.getElementById('reviewLightboxCaption'),
    counter: document.getElementById('reviewLightboxCounter'),
    close: document.getElementById('reviewLightboxClose'),
    prev: document.getElementById('reviewLightboxPrev'),
    next: document.getElementById('reviewLightboxNext')
  };
}

function updateReviewLightboxView() {
  const { modal, image, caption, counter, prev, next } = getReviewLightboxElements();
  if (!modal || !image || !caption || !counter || !reviewLightboxImages.length) return;

  const safeIndex = Math.max(0, Math.min(reviewLightboxIndex, reviewLightboxImages.length - 1));
  reviewLightboxIndex = safeIndex;
  const active = reviewLightboxImages[safeIndex];

  image.src = active.src;
  image.alt = active.alt;
  caption.textContent = active.caption;
  counter.textContent = `${safeIndex + 1} / ${reviewLightboxImages.length}`;

  const canNavigate = reviewLightboxImages.length > 1;
  if (prev) prev.style.display = canNavigate ? 'inline-flex' : 'none';
  if (next) next.style.display = canNavigate ? 'inline-flex' : 'none';
}

function closeReviewLightbox() {
  const { modal } = getReviewLightboxElements();
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
}

function openReviewLightbox(images, startIndex) {
  const { modal } = getReviewLightboxElements();
  if (!modal || !Array.isArray(images) || !images.length) return;

  reviewLightboxImages = images;
  reviewLightboxIndex = startIndex;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  updateReviewLightboxView();
}

function moveReviewLightbox(step) {
  if (!reviewLightboxImages.length) return;
  const total = reviewLightboxImages.length;
  reviewLightboxIndex = (reviewLightboxIndex + step + total) % total;
  updateReviewLightboxView();
}

function bindReviewLightboxEvents() {
  const { modal, close, prev, next } = getReviewLightboxElements();
  if (!modal || modal.dataset.bound === '1') return;

  close?.addEventListener('click', closeReviewLightbox);
  prev?.addEventListener('click', () => moveReviewLightbox(-1));
  next?.addEventListener('click', () => moveReviewLightbox(1));

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      closeReviewLightbox();
    }
  });

  document.addEventListener('keydown', event => {
    if (modal.hidden) return;
    if (event.key === 'Escape') {
      closeReviewLightbox();
    } else if (event.key === 'ArrowLeft') {
      moveReviewLightbox(-1);
    } else if (event.key === 'ArrowRight') {
      moveReviewLightbox(1);
    }
  });

  modal.dataset.bound = '1';
}

function renderCustomerGallery(reviews) {
  const gallery = document.getElementById('customerGallery');
  if (!gallery) return;

  reviewImageBuckets.clear();

  if (!Array.isArray(reviews) || !reviews.length) {
    gallery.innerHTML = `
      <div class="customer-gallery__empty">
        <h3>Be the first to post</h3>
        <p>Your review and photo can help other shoppers choose their favorite style.</p>
      </div>
    `;
    return;
  }

  gallery.innerHTML = reviews
    .map((item, reviewIndex) => {
      const images = Array.isArray(item.imageDataList) && item.imageDataList.length
        ? item.imageDataList
        : (item.imageData ? [item.imageData] : []);

      const bucketId = `review-${reviewIndex}-${item.id || item.createdAt || 'x'}`;
      reviewImageBuckets.set(
        bucketId,
        images.map((src, index) => ({
          src,
          alt: `${item.name} review photo ${index + 1}`,
          caption: `${item.name} - ${formatReviewDate(item.createdAt)}`
        }))
      );

      let mediaHtml = '';
      if (images.length === 1) {
        mediaHtml = `<div class="customer-gallery-card__media"><img src="${images[0]}" data-review-bucket="${bucketId}" data-image-index="0" alt="${item.name} review photo" /></div>`;
      } else if (images.length > 1) {
        const visibleImages = images.slice(0, 4);
        const hiddenCount = images.length - visibleImages.length;
        mediaHtml = `
          <div class="customer-gallery-card__media-grid">
            ${visibleImages
              .map((src, index) => {
                const showOverlay = hiddenCount > 0 && index === visibleImages.length - 1;
                const overlay = showOverlay
                  ? `<span class="customer-gallery-card__media-more">+${hiddenCount}</span>`
                  : '';
                return `<div class="customer-gallery-card__media-item"><img src="${src}" data-review-bucket="${bucketId}" data-image-index="${index}" alt="${item.name} review photo ${index + 1}" />${overlay}</div>`;
              })
              .join('')}
          </div>
        `;
      }

      return `
        <article class="customer-gallery-card">
          ${mediaHtml}
          <div class="customer-gallery-card__body">
            <div class="customer-gallery-card__top">
              <h3>${item.name}</h3>
              <span>${stars(Number(item.rating) || 0)}</span>
            </div>
            <p>${item.review}</p>
            <time datetime="${item.createdAt}">${formatReviewDate(item.createdAt)}</time>
          </div>
        </article>
      `;
    })
    .join('');

  if (gallery.dataset.lightboxBound !== '1') {
    gallery.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;

      const bucketId = String(target.dataset.reviewBucket || '');
      if (!bucketId) return;

      const images = reviewImageBuckets.get(bucketId) || [];
      if (!images.length) return;

      const imageIndex = Number(target.dataset.imageIndex || 0);
      openReviewLightbox(images, Number.isFinite(imageIndex) ? imageIndex : 0);
    });

    gallery.dataset.lightboxBound = '1';
  }
}

async function loadCustomerReviews(productId) {
  try {
    const response = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load customer reviews');
    }
    renderCustomerGallery(payload.reviews || []);
  } catch (error) {
    const gallery = document.getElementById('customerGallery');
    if (gallery) {
      gallery.innerHTML = `
        <div class="customer-gallery__empty">
          <h3>Gallery is temporarily unavailable</h3>
          <p>Please try again in a moment.</p>
        </div>
      `;
    }
  }
}

function initCustomerReviewForm(productId) {
  const form = document.getElementById('customerReviewForm');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const name = document.getElementById('customerName')?.value.trim() || '';
    const rating = Number(document.getElementById('customerRating')?.value || 0);
    const review = document.getElementById('customerReviewText')?.value.trim() || '';
    const photoInput = document.getElementById('customerPhoto');
    const files = photoInput && photoInput.files ? Array.from(photoInput.files) : [];

    if (!name || !rating || review.length < 10) {
      showToast('Please complete name, rating, and a review of at least 10 characters');
      return;
    }

    let imageDataList = [];
    if (files.length > 12) {
      showToast('Please select up to 12 images');
      return;
    }

    if (files.length) {
      try {
        imageDataList = await Promise.all(files.map(readImageFileAsDataUrl));
      } catch {
        showToast('Could not read one or more selected images');
        return;
      }
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          name,
          rating,
          review,
          imageData: imageDataList[0] || '',
          imageDataList
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to submit your review');
      }

      showToast('Thank you. Your review is submitted and awaiting approval.');
      form.reset();
      await loadCustomerReviews(productId);
    } catch (error) {
      showToast(`⚠️ ${error.message}`);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

(function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  window.currentProductId = id && products[id] ? id : 'silk-scrunchie';
  localStorage.setItem('berrybabes_last_viewed', window.currentProductId);
  const product = products[window.currentProductId];
  setProductSeoMeta(product, window.currentProductId);
  updateCartBadge();
  updateWishlistBadge();
  renderProduct(product);
  renderReviews(product);
  bindReviewLightboxEvents();
  initCustomerReviewForm(window.currentProductId);
  loadCustomerReviews(window.currentProductId);
  renderMoreProducts(window.currentProductId);
})();
