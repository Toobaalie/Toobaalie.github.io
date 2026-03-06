const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT_DIR = __dirname;
const IMAGES_DIR = path.join(ROOT_DIR, 'images');
const ORDERS_PATH = path.join(ROOT_DIR, 'data', 'orders.json');
const SUBSCRIBERS_PATH = path.join(ROOT_DIR, 'data', 'subscribers.json');

const smtpConfigured =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_PORT) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS) &&
  Boolean(process.env.SMTP_FROM);

const mailTransporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_PORT) === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

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
    from: process.env.SMTP_FROM,
    to,
    subject,
    html
  });

  return { sent: true };
}

app.use(express.json({ limit: '1mb' }));
app.use('/images', express.static(IMAGES_DIR));
app.use(express.static(ROOT_DIR));

app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
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
    const required = ['fullName', 'phone', 'address', 'city', 'postalCode', 'items'];
    const missing = required.filter(key => !payload[key] || (Array.isArray(payload[key]) && !payload[key].length));

    if (missing.length) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
    }

    const orders = readOrders();
    const order = {
      id: `ORD-${Date.now()}`,
      fullName: String(payload.fullName).trim(),
      phone: String(payload.phone).trim(),
      email: String(payload.email || '').trim(),
      address: String(payload.address).trim(),
      city: String(payload.city).trim(),
      postalCode: String(payload.postalCode).trim(),
      notes: String(payload.notes || '').trim(),
      items: payload.items,
      total: Number(payload.total) || 0,
      createdAt: new Date().toISOString()
    };

    orders.unshift(order);
    writeOrders(orders);

    let emailSent = false;
    if (order.email) {
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
          <p><strong>Delivery Address:</strong> ${order.address}, ${order.city}, ${order.postalCode}</p>
          <h4>Items:</h4>
          <ul>${orderItemsHtml}</ul>
        `
      }).catch(() => ({ sent: false }));

      emailSent = emailResult.sent;
    }

    return res.status(201).json({ success: true, orderId: order.id, emailSent });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to save order' });
  }
});

app.get('/api/orders', (_req, res) => {
  try {
    const orders = readOrders();
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to read orders' });
  }
});

app.delete('/api/orders', (_req, res) => {
  try {
    writeOrders([]);
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

app.listen(PORT, HOST, () => {
  ensureOrdersFile();
  ensureSubscribersFile();
  if (!smtpConfigured) {
    console.log('Email service disabled: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in .env');
  }
  console.log(`BerryBabes server running at http://localhost:${PORT}`);
  console.log(`LAN access enabled on http://${HOST}:${PORT}`);
  console.log('Use your PC IPv4 address on phone, e.g. http://192.168.1.25:3000');
});
