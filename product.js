const products = {
  'silk-scrunchie': {
    name: 'Silk Scrunchie',
    category: 'Silk',
    price: 150,
    image: 'images/1.jpeg',
    description: 'Soft mulberry silk scrunchie that protects your hair and gives a smooth, elegant look.',
    colors: ['Rose Pink', 'Cream', 'Wine'],
    colorImages: {
      'Rose Pink': 'images/1.jpeg',
      'Cream': 'images/2.jpeg',
      'Wine': 'images/3.jpeg'
    },
    reviews: [
      { name: 'Ayesha', rating: 5, text: 'Very soft and premium quality. No hair breakage at all.' },
      { name: 'Mina', rating: 4, text: 'Beautiful color and stitching. Looks exactly like pictures.' },
      { name: 'Sana', rating: 5, text: 'My everyday favorite scrunchie now.' }
    ]
  },
  'velvet-rose': {
    name: 'Velvet Rose Scrunchie',
    category: 'Velvet',
    price: 150,
    image: 'images/2.jpeg',
    description: 'Rich velvet texture with a romantic rose tone for a classy finish.',
    colors: ['Rose', 'Plum', 'Berry'],
    colorImages: {
      'Rose': 'images/2.jpeg',
      'Plum': 'images/213fde89950056c16fb4df753b42a1b1.jpg',
      'Berry': 'images/34ac80fa1a532ff3a206b53ef2ec3b42.jpg'
    },
    reviews: [
      { name: 'Hira', rating: 5, text: 'Perfect velvet texture and very comfortable all day.' },
      { name: 'Nimra', rating: 4, text: 'Color is gorgeous and holds hair nicely.' },
      { name: 'Laiba', rating: 5, text: 'Got many compliments on this one.' }
    ]
  },
  'cotton-classic': {
    name: 'Organic Cotton',
    category: 'Cotton',
    price: 150,
    image: 'images/4b09add7d9792a75988407081e156d27.jpg',
    description: 'Breathable organic cotton scrunchie for casual and daily wear comfort.',
    colors: ['White', 'Dusty Blue', 'Olive'],
    colorImages: {
      'White': 'images/4b09add7d9792a75988407081e156d27.jpg',
      'Dusty Blue': 'images/4d2a2b6ec1f9240afca646364057830f.jpg',
      'Olive': 'images/6cbd23a6e394cc1ba11fb4fd082ee8ac.jpg'
    },
    reviews: [
      { name: 'Komal', rating: 4, text: 'Simple, clean and very practical for daily use.' },
      { name: 'Maha', rating: 5, text: 'Comfortable and does not pull hair.' },
      { name: 'Iqra', rating: 4, text: 'Good value and quality is nice.' }
    ]
  },
  'satin-dream': {
    name: 'Satin Scrunchie',
    category: 'Satin',
    price: 150,
    image: 'images/bl.jpg',
    description: 'Glossy satin finish that adds shine and keeps your hairstyle polished.',
    colors: ['Champagne', 'Lilac', 'Black'],
    colorImages: {
      'Champagne': 'images/bl.jpg',
      'Lilac': 'images/bll.jpg',
      'Black': 'images/tutu.jpg'
    },
    reviews: [
      { name: 'Noor', rating: 5, text: 'Looks luxurious and feels very smooth.' },
      { name: 'Anum', rating: 4, text: 'Great quality satin and beautiful shine.' },
      { name: 'Kiran', rating: 5, text: 'Exactly what I wanted for formal looks.' }
    ]
  },
  'velvet-midnight': {
    name: 'Midnight Velvet',
    category: 'Velvet',
    price: 150,
    image: 'images/tta.jpg',
    description: 'Deep midnight velvet scrunchie for bold evening styling.',
    colors: ['Midnight Blue', 'Black', 'Maroon'],
    colorImages: {
      'Midnight Blue': 'images/tta.jpg',
      'Black': 'images/yuyu.jpg',
      'Maroon': 'images/hehe.png'
    },
    reviews: [
      { name: 'Eman', rating: 5, text: 'The dark shade is so elegant and premium.' },
      { name: 'Zara', rating: 4, text: 'Good hold and soft elastic.' },
      { name: 'Maria', rating: 5, text: 'My favorite for party outfits.' }
    ]
  },
  'silk-bundle': {
    name: 'Blush Silk Bundle',
    category: 'Silk',
    price: 150,
    image: 'images/img4.png',
    description: 'A graceful silk bundle pack with soft blush shades for versatile styling.',
    colors: ['Blush', 'Pearl', 'Mocha'],
    colorImages: {
      'Blush': 'images/img4.png',
      'Pearl': 'images/haha.png',
      'Mocha': 'images/1.jpeg'
    },
    reviews: [
      { name: 'Sidra', rating: 5, text: 'Bundle colors are beautiful and all are wearable.' },
      { name: 'Fiza', rating: 4, text: 'Nice deal and quality is consistent.' },
      { name: 'Aleena', rating: 5, text: 'Perfect gift idea for friends.' }
    ]
  },
  'spring-bloom': {
    name: 'Spring Bloom Collection',
    category: 'Seasonal',
    price: 150,
    image: 'images/2ab07db0e5888ef3704dbda21080f934.jpg',
    description: 'Limited seasonal collection with playful spring-inspired tones.',
    colors: ['Bloom Pink', 'Mint', 'Lavender'],
    colorImages: {
      'Bloom Pink': 'images/2ab07db0e5888ef3704dbda21080f934.jpg',
      'Mint': 'images/34ac80fa1a532ff3a206b53ef2ec3b42.jpg',
      'Lavender': 'images/4b09add7d9792a75988407081e156d27.jpg'
    },
    reviews: [
      { name: 'Rida', rating: 5, text: 'Fresh colors and very cute for spring outfits.' },
      { name: 'Areeba', rating: 4, text: 'Looks pretty and feels lightweight.' },
      { name: 'Momal', rating: 5, text: 'Beautiful finishing and fabric quality.' }
    ]
  }
};

let selectedColor = '';
let selectedQuantity = 1;
let selectedImage = '';

function getProductFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return products[id] || products['silk-scrunchie'];
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

function renderProduct(product) {
  const detail = document.getElementById('productDetail');
  if (!detail) return;

  selectedColor = product.colors[0];
  selectedImage = getImageByColor(product, selectedColor);
  selectedQuantity = 1;

  detail.innerHTML = `
    <div class="product-detail__media">
      <img src="${selectedImage}" alt="${product.name}" id="detailMainImage" />
      <div class="product-detail__thumbs" id="detailThumbs">
        ${product.colors
          .map(color => {
            const colorImage = getImageByColor(product, color);
            const isActive = color === selectedColor;
            return `
              <button type="button" class="product-detail__thumb ${isActive ? 'active' : ''}" data-color="${color}" aria-label="${product.name} ${color}">
                <img src="${colorImage}" alt="${product.name} ${color}" />
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
              (color, index) =>
                `<button class="color-option ${index === 0 ? 'active' : ''}" data-color="${color}">${color}</button>`
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
      item.classList.toggle('active', item.dataset.color === selectedColor);
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
      setActiveColor(button.dataset.color);
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

(function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  window.currentProductId = id && products[id] ? id : 'silk-scrunchie';
  localStorage.setItem('berrybabes_last_viewed', window.currentProductId);
  const product = products[window.currentProductId];
  updateCartBadge();
  updateWishlistBadge();
  renderProduct(product);
  renderReviews(product);
})();
