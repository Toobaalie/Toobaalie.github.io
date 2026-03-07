const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const CANONICAL_HOST = process.env.CANONICAL_HOST || 'berrybabes.me';
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const ORDERS_PATH = path.join(ROOT_DIR, 'data', 'orders.json');
const SUBSCRIBERS_PATH = path.join(ROOT_DIR, 'data', 'subscribers.json');
const CUSTOMER_REVIEWS_PATH = path.join(ROOT_DIR, 'data', 'customer-reviews.json');
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'berrybabes';
const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER || '';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'BerryBabes Orders';

let mongoClient = null;
let mongoDb = null;

async function ensureMongoConnection() {
  if (!MONGODB_URI) return false;
  if (mongoDb) return true;

  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
    }

    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGODB_DB);
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message || error);
    mongoDb = null;
    return false;
  }
}

function getOrdersCollection() {
  return mongoDb ? mongoDb.collection('orders') : null;
}

function inferSmtpDefaults(emailAddress) {
  const domain = String(emailAddress || '').split('@')[1]?.toLowerCase() || '';
  if (!domain) return null;

  const gmailDomains = new Set(['gmail.com', 'googlemail.com']);
  const outlookDomains = new Set(['outlook.com', 'hotmail.com', 'live.com', 'msn.com']);
  const yahooDomains = new Set(['yahoo.com', 'yahoo.co.uk', 'yahoo.in']);

  if (gmailDomains.has(domain)) {
    return { host: 'smtp.gmail.com', port: 465, secure: true };
  }

  if (outlookDomains.has(domain)) {
    return { host: 'smtp.office365.com', port: 587, secure: false };
  }

  if (yahooDomains.has(domain)) {
    return { host: 'smtp.mail.yahoo.com', port: 465, secure: true };
  }

  if (domain.endsWith('zoho.com') || domain.endsWith('zohomail.com')) {
    return { host: 'smtp.zoho.com', port: 465, secure: true };
  }

  // Namecheap Private Email commonly uses this SMTP endpoint.
  if (domain.includes('berrybabes.me') || domain.includes('privateemail')) {
    return { host: 'mail.privateemail.com', port: 587, secure: false };
  }

  return null;
}

const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const explicitSmtpHost = process.env.SMTP_HOST || '';
const explicitSmtpPort = Number(process.env.SMTP_PORT || 0);
const inferredSmtp = inferSmtpDefaults(smtpUser);
const smtpHost = explicitSmtpHost || inferredSmtp?.host || '';
const smtpPort = explicitSmtpPort || inferredSmtp?.port || 0;
const smtpSecure = process.env.SMTP_SECURE
  ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
  : (inferredSmtp?.secure ?? smtpPort === 465);

const smtpConfigured =
  Boolean(smtpHost) &&
  Boolean(smtpPort) &&
  Boolean(smtpUser) &&
  Boolean(smtpPass);

const mailTransporter = smtpConfigured
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })
  : null;

app.set('trust proxy', true);

// Allow API access from custom domain, Railway domain, and temporary preview origins.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

// Keep one public domain for SEO, SSL consistency, and brand trust.
app.use((req, res, next) => {
  if (!CANONICAL_HOST) {
    return next();
  }

  if (req.path.startsWith('/api/')) {
    return next();
  }

  const requestHost = (req.headers.host || '').split(':')[0].toLowerCase();
  const canonical = CANONICAL_HOST.toLowerCase();

  if (!requestHost || requestHost === canonical) {
    return next();
  }

  if (requestHost === `www.${canonical}`) {
    return res.redirect(308, `https://${canonical}${req.originalUrl}`);
  }

  if (requestHost.endsWith('.railway.app')) {
    return res.redirect(308, `https://${canonical}${req.originalUrl}`);
  }

  return next();
});

function ensureOrdersFile() {
  const dir = path.dirname(ORDERS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_PATH)) {
    fs.writeFileSync(ORDERS_PATH, '[]', 'utf8');
  }
}

function ensureSubscribersFile() {
  const dir = path.dirname(SUBSCRIBERS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(SUBSCRIBERS_PATH)) {
    fs.writeFileSync(SUBSCRIBERS_PATH, '[]', 'utf8');
  }
}

function ensureCustomerReviewsFile() {
  const dir = path.dirname(CUSTOMER_REVIEWS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(CUSTOMER_REVIEWS_PATH)) {
    fs.writeFileSync(CUSTOMER_REVIEWS_PATH, '[]', 'utf8');
  }
}

function readOrders() {
  ensureOrdersFile();
  const raw = fs.readFileSync(ORDERS_PATH, 'utf8');
  const parsed = JSON.parse(raw || '[]');
  return Array.isArray(parsed) ? parsed : [];
}

function writeOrders(orders) {
  ensureOrdersFile();
  fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf8');
}

async function readOrdersStorage() {
  if (await ensureMongoConnection()) {
    const collection = getOrdersCollection();
    if (collection) {
      const rows = await collection
        .find({}, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .limit(1000)
        .toArray();
      return Array.isArray(rows) ? rows : [];
    }
  }

  return readOrders();
}

async function saveOrderStorage(order) {
  if (await ensureMongoConnection()) {
    const collection = getOrdersCollection();
    if (collection) {
      await collection.insertOne(order);
      return;
    }
  }

  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);
}

async function clearOrdersStorage() {
  if (await ensureMongoConnection()) {
    const collection = getOrdersCollection();
    if (collection) {
      await collection.deleteMany({});
      return;
    }
  }

  writeOrders([]);
}

function readSubscribers() {
  ensureSubscribersFile();
  const raw = fs.readFileSync(SUBSCRIBERS_PATH, 'utf8');
  const parsed = JSON.parse(raw || '[]');
  return Array.isArray(parsed) ? parsed : [];
}

function writeSubscribers(subscribers) {
  ensureSubscribersFile();
  fs.writeFileSync(SUBSCRIBERS_PATH, JSON.stringify(subscribers, null, 2), 'utf8');
}

async function sendEmail({ to, subject, html }) {
  if (!mailTransporter) {
    return { sent: false, reason: 'SMTP not configured' };
  }

  await mailTransporter.sendMail({
    from: `${SMTP_FROM_NAME} <${SMTP_FROM}>`,
    to,
    subject,
    html
  });

  return { sent: true };
}

function readCustomerReviews() {
  ensureCustomerReviewsFile();
  const raw = fs.readFileSync(CUSTOMER_REVIEWS_PATH, 'utf8');
  const parsed = JSON.parse(raw || '[]');
  return Array.isArray(parsed) ? parsed : [];
}

function writeCustomerReviews(reviews) {
  ensureCustomerReviewsFile();
  fs.writeFileSync(CUSTOMER_REVIEWS_PATH, JSON.stringify(reviews, null, 2), 'utf8');
}

function isValidImageDataUrl(value) {
  if (!value) return true;
  if (typeof value !== 'string') return false;
  const hasPrefix = /^data:image\/(png|jpe?g|webp);base64,/i.test(value);
  if (!hasPrefix) return false;
  return value.length <= 950000;
}

app.use(express.json({ limit: '5mb' }));
app.use('/images', express.static(IMAGES_DIR));
app.use(express.static(PUBLIC_DIR));

app.get('/', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.post('/api/subscribe', async (req, res) => {
  try {
    const email = String((req.body || {}).email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const subscribers = readSubscribers();
    const alreadySubscribed = subscribers.some(item => item.email === email);

    if (!alreadySubscribed) {
      subscribers.unshift({ email, createdAt: new Date().toISOString() });
      writeSubscribers(subscribers);
    }

    const emailResult = await sendEmail({
      to: email,
      subject: 'Welcome to BerryBabes.pk ✨',
      html: `
        <h2>Thanks for subscribing!</h2>
        <p>You are now part of the BerryBabes community.</p>
        <p>We will send you new drops, offers, and styling updates.</p>
      `
    }).catch(() => ({ sent: false }));

    return res.status(201).json({
      success: true,
      alreadySubscribed,
      emailSent: emailResult.sent
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to save subscription' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const payload = req.body || {};
    const required = ['fullName', 'phone', 'address', 'items'];
    const missing = required.filter(key => !payload[key] || (Array.isArray(payload[key]) && !payload[key].length));

    if (missing.length) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
    }

    const order = {
      id: `ORD-${Date.now()}`,
      fullName: String(payload.fullName).trim(),
      phone: String(payload.phone).trim(),
      email: String(payload.email || '').trim(),
      address: String(payload.address).trim(),
      state: String(payload.state || 'Not provided').trim(),
      city: String(payload.city || 'Not provided').trim(),
      postalCode: String(payload.postalCode || 'Not provided').trim(),
      notes: String(payload.notes || '').trim(),
      items: payload.items,
      total: Number(payload.total) || 0,
      createdAt: new Date().toISOString()
    };

    await saveOrderStorage(order);

    let emailSent = false;
    let emailStatus = 'not_requested';
    if (order.email) {
      emailStatus = smtpConfigured ? 'pending' : 'not_configured';
      const orderItemsHtml = (order.items || [])
        .map(item => `<li>${item.name} (${item.color}) x${item.quantity}</li>`)
        .join('');

      const emailResult = await sendEmail({
        to: order.email,
        subject: `Order Verified - ${order.id}`,
        html: `
          <h2>Your order is verified ✅</h2>
          <p>Hi ${order.fullName}, thank you for your order.</p>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Total:</strong> Pkr ${Number(order.total).toFixed(0)}</p>
          <p><strong>Delivery Address:</strong> ${order.address}, ${order.city}, ${order.state}, ${order.postalCode}</p>
          <h4>Items:</h4>
          <ul>${orderItemsHtml}</ul>
        `
      }).catch(error => {
        console.error('Order email send failed:', error.message || error);
        return { sent: false, reason: 'send_failed' };
      });

      emailSent = emailResult.sent;
      emailStatus = emailResult.sent ? 'sent' : (emailResult.reason || 'send_failed');
    }

    return res.status(201).json({ success: true, orderId: order.id, emailSent, emailStatus });
  } catch (error) {
    console.error('Order API failed:', error.message || error);
    return res.status(500).json({ error: 'Unable to save order. Please try again in a moment.' });
  }
});

app.get('/api/orders', async (_req, res) => {
  try {
    const orders = await readOrdersStorage();
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to read orders' });
  }
});

app.delete('/api/orders', async (_req, res) => {
  try {
    await clearOrdersStorage();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to clear orders' });
  }
});

app.get('/api/subscribers', (_req, res) => {
  try {
    const subscribers = readSubscribers();
    return res.json({ subscribers });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to read subscribers' });
  }
});

app.delete('/api/subscribers', (_req, res) => {
  try {
    writeSubscribers([]);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to clear subscribers' });
  }
});

app.get('/api/reviews', (req, res) => {
  try {
    const productId = String((req.query || {}).productId || '').trim();
    const includeAll = String((req.query || {}).includeAll || '').trim() === '1';
    const reviews = readCustomerReviews();
    const visibleReviews = includeAll
      ? reviews
      : reviews.filter(item => item.approved !== false);

    const filtered = productId
      ? visibleReviews.filter(item => item.productId === productId)
      : visibleReviews;

    return res.json({ reviews: filtered.slice(0, 60) });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to read reviews' });
  }
});

app.post('/api/reviews', (req, res) => {
  try {
    const payload = req.body || {};
    const productId = String(payload.productId || '').trim();
    const name = String(payload.name || '').trim();
    const reviewText = String(payload.review || '').trim();
    const rating = Number(payload.rating);
    const imageData = payload.imageData || '';

    if (!productId || !name || !reviewText || !Number.isFinite(rating)) {
      return res.status(400).json({ error: 'productId, name, rating, and review are required' });
    }

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    }

    if (reviewText.length < 10 || reviewText.length > 500) {
      return res.status(400).json({ error: 'Review must be between 10 and 500 characters' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!isValidImageDataUrl(imageData)) {
      return res.status(400).json({ error: 'Image must be PNG, JPG, or WebP and under 700KB' });
    }

    const reviews = readCustomerReviews();
    const entry = {
      id: `REV-${Date.now()}`,
      productId,
      name,
      rating,
      review: reviewText,
      imageData: imageData || '',
      approved: false,
      createdAt: new Date().toISOString()
    };

    reviews.unshift(entry);
    writeCustomerReviews(reviews.slice(0, 300));

    return res.status(201).json({ success: true, review: entry });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to submit review' });
  }
});

app.patch('/api/reviews/:id', (req, res) => {
  try {
    const reviewId = String((req.params || {}).id || '').trim();
    const approved = (req.body || {}).approved;

    if (!reviewId) {
      return res.status(400).json({ error: 'Review id is required' });
    }

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'approved must be true or false' });
    }

    const reviews = readCustomerReviews();
    const target = reviews.find(item => item.id === reviewId);

    if (!target) {
      return res.status(404).json({ error: 'Review not found' });
    }

    target.approved = approved;
    target.moderatedAt = new Date().toISOString();
    writeCustomerReviews(reviews);

    return res.json({ success: true, review: target });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to update review status' });
  }
});

app.listen(PORT, HOST, () => {
  ensureOrdersFile();
  ensureSubscribersFile();
  ensureCustomerReviewsFile();
  if (MONGODB_URI) {
    ensureMongoConnection().then(connected => {
      if (connected) {
        console.log(`MongoDB connected (db: ${MONGODB_DB})`);
      } else {
        console.log('MongoDB unavailable; using local JSON storage for orders.');
      }
    });
  } else {
    console.log('MongoDB not configured; using local JSON storage for orders.');
  }
  if (!smtpConfigured) {
    console.log('Email service disabled: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in .env');
  }
  console.log(`BerryBabes server running at http://localhost:${PORT}`);
  console.log(`LAN access enabled on http://${HOST}:${PORT}`);
  console.log('Use your PC IPv4 address on phone, e.g. http://192.168.1.25:3000');
});
