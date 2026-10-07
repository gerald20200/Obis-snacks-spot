require('dotenv').config();

const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const crypto = require('node:crypto');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET;
const AUTH_PIN = process.env.AUTH_PIN;
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@obisnackspot.com';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const COOKIE_NAME = 'obi_snack_session';
const PENDING_COOKIE_NAME = 'obi_snack_pending';
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const PENDING_TTL_SECONDS = 15 * 60;
const COOKIE_PROPERTIES = {
  httpOnly: true,
  sameSite: 'lax',
  secure: COOKIE_SECURE,
  path: '/',
  maxAge: SESSION_TTL_SECONDS * 1000
};

if (!JWT_SECRET || !AUTH_PIN) {
  if (NODE_ENV === 'production') {
    throw new Error('JWT_SECRET and AUTH_PIN must be configured in production.');
  }

  console.warn('JWT_SECRET and AUTH_PIN are not configured. A temporary development session will be used, but production startup requires both values.');
}

if (NODE_ENV === 'production' && !MONGODB_URI) {
  throw new Error('MONGODB_URI must be configured in production.');
}

const effectiveJwtSecret = JWT_SECRET || crypto.randomBytes(48).toString('hex');
const effectiveAuthPin = AUTH_PIN || 'development-only-pin-change-before-production';
const googleClient = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CALLBACK_URL)
  : null;
const STORE_PATH = path.join(__dirname, 'data', 'store.json');
const databaseConnection = MONGODB_URI
  ? mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  : null;

app.disable('x-powered-by');

const defaultProducts = [
  { id: 1, name: 'Chicken Burger', price: 2500, category: 'meal', description: 'Delicious chicken burger with fresh vegetables.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80', featured: false, available: true },
  { id: 2, name: 'Shawarma', price: 2000, category: 'meal', description: 'Fresh shawarma filled with chicken and vegetables.', image: 'https://www.afropots.com/wp-content/uploads/2025/04/item-ae2fb3eb-8442-49ed-b5cb-cb7908f823fd-1.jpg', featured: false, available: true },
  { id: 3, name: 'Meat Pie', price: 1000, category: 'snack', description: 'Freshly baked meat pie with a tasty filling.', image: 'https://simshomekitchen.com/wp-content/uploads/2020/06/meat-pie-and-dough-recipe.png', featured: false, available: true },
  { id: 4, name: 'Jollof Rice & Chicken', price: 3000, category: 'meal', description: 'Special Nigerian jollof rice served with chicken.', image: 'https://dodptt9f4zk9h.cloudfront.net/stores/139851/products/5190c507d7660dcc6a6db675eade7063e257f946.jpeg', featured: true, available: true },
  { id: 5, name: 'French Fries', price: 1500, category: 'snack', description: 'Crispy golden fries served hot and fresh.', image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=900&q=80', featured: false, available: true },
  { id: 6, name: 'Cold Drink', price: 800, category: 'drink', description: 'Choose from a variety of refreshing soft drinks.', image: 'https://images.unsplash.com/photo-1622483767028-3f66f2b7420a?auto=format&fit=crop&w=900&q=80', featured: false, available: true },
  { id: 7, name: 'Fresh Fruit Juice', price: 1200, category: 'drink', description: 'Sweet and chilled fruit juice served fresh.', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80', featured: true, available: true },
  { id: 8, name: 'Coca-Cola', price: 700, category: 'drink', description: 'Classic chilled cola served ice-cold and fizzy.', image: 'https://www.supermart.ng/cdn/shop/files/ALTCITD827.jpg?v=1689111605', featured: false, available: true },
  { id: 9, name: 'Lemonade', price: 900, category: 'drink', description: 'Freshly squeezed lemon drink with a sweet citrus kick.', image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=900&q=80', featured: false, available: true },
  { id: 10, name: 'Red Wine', price: 4500, category: 'drink', description: 'Rich and smooth red wine for a relaxing evening.', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80', featured: false, available: true }
];

const defaultSite = {
  businessName: "Obi's Snack Spot",
  heroTitle: "Welcome to Obi's Snack Spot",
  heroSubtitle: 'Fresh snacks, tasty meals and cool drinks for everyone.',
  phone: '07077266794',
  email: 'hello@obisnackspot.com',
  location: '12 Lekki-Epe Expressway, Lagos, Nigeria',
  hours: 'Monday - Saturday: 8:00 AM - 9:00 PM | Sunday: 10:00 AM - 6:00 PM',
  whatsapp: "https://wa.me/2347077266794?text=Hello%20Obi's%20Snack%20Spot%2C%20I%20want%20to%20place%20an%20order.",
  aboutText: "Obi's Snack Spot is a friendly neighborhood food joint serving tasty and affordable meals, snacks and drinks. We are committed to giving our customers great food and excellent service."
};

const readStore = () => {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      site: { ...defaultSite, ...(parsed.site || {}) },
      products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products.map((product) => ({
        id: Number(product.id) || Date.now(),
        name: product.name || 'Unnamed item',
        description: product.description || '',
        price: Number(product.price) || 0,
        category: product.category || 'meal',
        image: product.image || '',
        featured: Boolean(product.featured),
        available: product.available !== false
      })) : [...defaultProducts],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      customers: Array.isArray(parsed.customers) ? parsed.customers : []
    };
  } catch (error) {
    return {
      site: { ...defaultSite },
      products: [...defaultProducts],
      orders: [],
      customers: []
    };
  }
};

const persistStore = (data) => {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to persist store:', error);
    return false;
  }
};

const initialStore = readStore();
let menu = [...initialStore.products];
let customers = Array.isArray(initialStore.customers) ? initialStore.customers.map((customer) => ({
  ...customer,
  role: customer.role || 'customer'
})) : [];
let siteSettings = { ...initialStore.site };
const orderStatuses = ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'];

const adminUsers = [
  {
    id: 1,
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10),
    role: 'admin',
    createdAt: new Date().toISOString()
  }
];

const customerUserByEmail = new Map();
const menuById = new Map(menu.map((item) => [item.id, item]));
const adminUserByUsername = new Map(adminUsers.map((user) => [user.username.toLowerCase(), user]));
const adminUserByEmail = new Map(adminUsers.map((user) => [user.email.toLowerCase(), user]));

const refreshCustomerMap = () => {
  customerUserByEmail.clear();
  customers.forEach((customer) => {
    customerUserByEmail.set(String(customer.email).toLowerCase(), customer);
  });
};

refreshCustomerMap();

const sanitizeCustomer = (customer) => ({
  id: customer.id,
  fullName: customer.fullName,
  email: customer.email,
  phone: customer.phone,
  role: customer.role || 'customer',
  createdAt: customer.createdAt
});

const sanitizeOrder = (order) => ({
  ...order,
  customerName: order.customerName || 'Walk-in customer',
  phone: order.phone || 'Not provided',
  address: order.address || 'Not provided',
  status: order.status || 'pending'
});

const normalizeOrderItems = (rawItems) => {
  const items = Array.isArray(rawItems) ? rawItems : [];

  return items
    .map((entry) => {
      if (typeof entry === 'string') {
        return { name: entry, quantity: 1, price: 0 };
      }

      if (entry && typeof entry === 'object') {
        const name = entry.name || entry.itemName || 'Unknown item';
        const quantity = Number(entry.quantity) || 1;
        const price = Number(entry.price) || 0;
        return {
          name,
          quantity: Math.max(quantity, 1),
          price: Math.max(price, 0)
        };
      }

      return null;
    })
    .filter(Boolean);
};

const getOrderTotal = (items) => {
  return items.reduce((total, item) => {
    const menuItem = menu.find((food) => food.name.toLowerCase() === item.name.toLowerCase());
    const price = item.price > 0 ? item.price : menuItem ? menuItem.price : 0;
    return total + price * item.quantity;
  }, 0);
};

const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  if (user.role === 'admin') {
    payload.username = user.username;
  }

  if (user.role === 'customer') {
    payload.fullName = user.fullName;
    payload.phone = user.phone;
  }

  return jwt.sign(payload, effectiveJwtSecret, { expiresIn: '8h' });
};

const getCookie = (req, name) => {
  const header = req.headers.cookie || '';
  const match = header.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

const setCookie = (res, name, value, options = {}) => {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path || '/'}`,
    `Max-Age=${options.maxAge || SESSION_TTL_SECONDS}`,
    'HttpOnly',
    'SameSite=Lax'
  ];

  if (COOKIE_SECURE || options.secure) attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
};

const clearCookie = (res, name) => setCookie(res, name, '', { maxAge: 0 });

const createSessionToken = (user) => jwt.sign({
  id: user.id,
  email: user.email,
  role: user.role,
  fullName: user.fullName,
  phone: user.phone,
  type: 'session',
  issuedAt: Math.floor(Date.now() / 1000)
}, effectiveJwtSecret, { expiresIn: SESSION_TTL_SECONDS });

const createPendingToken = (identity) => jwt.sign({
  ...identity,
  type: 'pending-google',
  issuedAt: Math.floor(Date.now() / 1000)
}, effectiveJwtSecret, { expiresIn: PENDING_TTL_SECONDS });

const validReturnTo = (value) => typeof value === 'string' && ['/index.html', '/thankyou.html'].includes(value)
  ? value
  : '/index.html';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, effectiveJwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  try {
    req.user = jwt.verify(authHeader.split(' ')[1], effectiveJwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const requireDatabase = async (req, res, next) => {
  if (!databaseConnection) {
    return res.status(503).json({ message: 'Order storage is not configured. Add MONGODB_URI.' });
  }

  try {
    await databaseConnection;
    return next();
  } catch (error) {
    return res.status(503).json({ message: 'Order storage is temporarily unavailable. Please try again.' });
  }
};

const requirePageAuthentication = (req, res, next) => {
  const token = getCookie(req, COOKIE_NAME);
  if (!token) {
    const returnTo = encodeURIComponent(req.originalUrl.split('?')[0]);
    return res.redirect(`/login.html?returnTo=${returnTo}`);
  }

  try {
    const decoded = jwt.verify(token, effectiveJwtSecret);
    if (decoded.type !== 'session') throw new Error('Invalid session type.');
    req.user = decoded;
    next();
  } catch (error) {
    clearCookie(res, COOKIE_NAME);
    const returnTo = encodeURIComponent(req.originalUrl.split('?')[0]);
    return res.redirect(`/login.html?returnTo=${returnTo}`);
  }
};

const requirePin = (req, res, next) => {
  const pendingToken = getCookie(req, PENDING_COOKIE_NAME);
  try {
    const decoded = jwt.verify(pendingToken, effectiveJwtSecret);
    if (decoded.type !== 'pending-google') throw new Error('Invalid pending identity.');
    req.pendingGoogleIdentity = decoded;
    next();
  } catch (error) {
    clearCookie(res, PENDING_COOKIE_NAME);
    return res.status(401).json({ message: 'Google sign-in could not be completed. Please try again.' });
  }
};

const pinMatches = (pin) => crypto.timingSafeEqual(
  crypto.scryptSync(String(pin), 'obi-snack-pin-salt', 64),
  crypto.scryptSync(effectiveAuthPin, 'obi-snack-pin-salt', 64)
);

const customerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Customer access required.' });
  }

  next();
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  next();
};

const getCustomerById = (id) => customers.find((customer) => customer.id === Number(id));

const getStatusName = (status) => {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'processing') return 'preparing';
  if (normalized === 'ready') return 'ready';
  if (normalized === 'confirmed') return 'confirmed';
  if (normalized === 'pending') return 'pending';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'cancelled') return 'cancelled';
  if (normalized === 'preparing') return 'preparing';

  return 'pending';
};

app.use(express.json({ limit: '1mb' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload.' });
  }

  console.error('Server error:', err);
  return res.status(500).json({ message: 'Server error. Please try again.' });
});

app.get('/style.css', (req, res) => {
  res.type('text/css');
  res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/login.css', (req, res) => {
  res.type('text/css');
  res.sendFile(path.join(__dirname, 'login.css'));
});

app.get('/auth.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'auth.js'));
});

app.get('/script.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'script.js'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/index.html', requirePageAuthentication, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin.css', (req, res) => {
  res.type('text/css');
  res.sendFile(path.join(__dirname, 'admin.css'));
});

app.get('/admin.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'admin.js'));
});

app.get('/', requirePageAuthentication, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: "Obi's Snack Spot Backend" });
});

app.get('/api/auth/status', (req, res) => {
  const token = getCookie(req, COOKIE_NAME);
  if (!token) return res.json({ authenticated: false });

  try {
    const decoded = jwt.verify(token, effectiveJwtSecret);
    if (decoded.type !== 'session') throw new Error('Invalid session type.');
    return res.json({ authenticated: true, user: { email: decoded.email, fullName: decoded.fullName, role: decoded.role }, returnTo: '/index.html' });
  } catch (error) {
    clearCookie(res, COOKIE_NAME);
    return res.json({ authenticated: false });
  }
});

app.use('/api', requireDatabase, optionalAuthenticate, ordersRouter);

app.post('/api/auth/pin', (req, res) => {
  const { pin } = req.body || {};
  if (typeof pin !== 'string' || !pin.trim()) {
    return res.status(400).json({ message: 'Enter your access PIN.' });
  }

  if (pin.length > 20 || !pinMatches(pin)) {
    return res.status(401).json({ message: 'The access PIN is incorrect.' });
  }

  const pendingToken = getCookie(req, PENDING_COOKIE_NAME);
  let identity = null;
  if (pendingToken) {
    try {
      identity = jwt.verify(pendingToken, effectiveJwtSecret);
      if (identity.type !== 'pending-google') throw new Error('Invalid pending identity.');
    } catch (error) {
      clearCookie(res, PENDING_COOKIE_NAME);
      return res.status(401).json({ message: 'The authentication request has expired.' });
    }
  }

  const sessionUser = {
    id: identity?.googleId || Date.now(),
    email: identity?.email || 'pin-user@example.com',
    fullName: identity?.fullName || 'Verified customer',
    phone: identity?.phone || '',
    role: 'customer',
    source: identity?.source || 'pin'
  };
  const returnTo = identity ? validReturnTo(identity.returnTo) : validReturnTo(req.body.returnTo);

  clearCookie(res, PENDING_COOKIE_NAME);
  setCookie(res, COOKIE_NAME, createSessionToken(sessionUser));
  return res.json({ message: 'Authentication complete.', returnTo });
});

app.post('/api/auth/google/start', (req, res) => {
  if (!googleClient) {
    return res.status(503).json({ message: 'Google sign-in is not configured.' });
  }

  const returnTo = typeof req.body?.returnTo === 'string' && ['/index.html', '/thankyou.html'].includes(req.body.returnTo)
    ? req.body.returnTo
    : '/index.html';
  const state = crypto.randomBytes(24).toString('base64url');
  const authorizationUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account',
    state,
    scope: ['openid', 'email', 'profile']
  });

  setCookie(res, 'obi_snack_oauth_state', JSON.stringify({ state, returnTo }), { maxAge: 10 * 60, secure: COOKIE_SECURE });
  return res.json({ authorizationUrl, returnTo });
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code || !state) {
    return res.redirect('/login.html?error=Google%20authentication%20was%20not%20completed.%20Please%20try%20again.');
  }

  if (!googleClient) {
    return res.redirect('/login.html?error=Google%20authentication%20is%20not%20configured.');
  }

  const expectedStateCookie = getCookie(req, 'obi_snack_oauth_state');
  clearCookie(res, 'obi_snack_oauth_state');
  let expectedState = null;
  let returnTo = '/index.html';

  try {
    const parsedCookie = JSON.parse(expectedStateCookie || '{}');
    expectedState = parsedCookie.state;
    returnTo = ['/index.html', '/thankyou.html'].includes(parsedCookie.returnTo) ? parsedCookie.returnTo : '/index.html';
  } catch (error) {
    // Invalid cookie data is rejected below.
  }

  const expectedStateBuffer = expectedState ? Buffer.from(expectedState) : Buffer.alloc(0);
  const receivedStateBuffer = Buffer.from(state);
  if (!expectedState || expectedStateBuffer.length !== receivedStateBuffer.length
    || !crypto.timingSafeEqual(expectedStateBuffer, receivedStateBuffer)) {
    return res.redirect('/login.html?error=Google%20authentication%20state%20is%20invalid.%20Please%20try%20again.');
  }

  try {
    const token = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: token.tokens.id_token,
      audience: googleClient.clientId
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return res.redirect('/login.html?error=Google%20authentication%20did%20not%20return%20a%20valid%20account.');
    }

    const pending = createPendingToken({
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      fullName: payload.name || payload.email,
      phone: '',
      source: 'google',
      returnTo
    });
    setCookie(res, PENDING_COOKIE_NAME, pending, { maxAge: PENDING_TTL_SECONDS, secure: COOKIE_SECURE });
    return res.redirect('/login.html?google=ready');
  } catch (error) {
    console.error('Google OAuth verification failed:', error.message);
    return res.redirect('/login.html?error=Google%20authentication%20could%20not%20be%20verified.%20Please%20try%20again.');
  }
});

app.post('/api/auth/logout', (req, res) => {
  clearCookie(res, COOKIE_NAME);
  clearCookie(res, PENDING_COOKIE_NAME);
  clearCookie(res, 'obi_snack_oauth_state');
  res.json({ message: 'Logged out successfully.' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, email, password } = req.body || {};

  if (!password || (!username && !email)) {
    return res.status(400).json({ message: 'Email or username and password are required.' });
  }

  const customer = email
    ? customerUserByEmail.get(String(email).toLowerCase())
    : null;

  if (customer && bcrypt.compareSync(password, customer.passwordHash)) {
    const token = generateToken(customer);
    return res.json({
      message: 'Login successful.',
      token,
      user: sanitizeCustomer(customer)
    });
  }

  const user = username
    ? adminUserByUsername.get(String(username).toLowerCase())
    : adminUserByEmail.get(String(email || '').toLowerCase());

  if (!user) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }

  const token = generateToken(user);

  res.json({
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { fullName, email, phone, password, confirmPassword } = req.body || {};

  if (!fullName || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(String(email).trim())) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  if (String(password) !== String(confirmPassword)) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingCustomer = customerUserByEmail.get(normalizedEmail);

  if (existingCustomer) {
    return res.status(409).json({ message: 'This email is already registered.' });
  }

  const newCustomer = {
    id: Date.now(),
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    phone: String(phone).trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'customer',
    createdAt: new Date().toISOString()
  };

  customers.push(newCustomer);
  refreshCustomerMap();
  persistStore({ site: siteSettings, products: menu, customers });

  const token = generateToken(newCustomer);

  return res.status(201).json({
    message: 'Account created successfully.',
    token,
    user: sanitizeCustomer(newCustomer)
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  if (req.user.role === 'customer') {
    const customer = getCustomerById(req.user.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    return res.json({ user: sanitizeCustomer(customer) });
  }

  const user = adminUsers.find((entry) => entry.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

app.get('/customer-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer-login.html'));
});

app.get('/customer-signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer-signup.html'));
});

app.get('/customer-account.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'customer-account.html'));
});

app.get('/customer-login', (req, res) => {
  res.redirect('/customer-login.html');
});

app.get('/customer-signup', (req, res) => {
  res.redirect('/customer-signup.html');
});

app.get('/customer-account', (req, res) => {
  res.redirect('/customer-account.html');
});

app.get('/index.html', requirePageAuthentication, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/thankyou.html', requirePageAuthentication, (req, res) => {
  res.sendFile(path.join(__dirname, 'thankyou.html'));
});

app.get('/customer-account.html', requirePageAuthentication, (req, res) => {
  res.sendFile(path.join(__dirname, 'customer-account.html'));
});

app.get('/api/site', (req, res) => {
  res.json({ site: siteSettings });
});

app.put('/api/site', authenticate, adminOnly, (req, res) => {
  const payload = req.body || {};
  siteSettings = {
    ...siteSettings,
    businessName: payload.businessName || siteSettings.businessName,
    heroTitle: payload.heroTitle || siteSettings.heroTitle,
    heroSubtitle: payload.heroSubtitle || siteSettings.heroSubtitle,
    phone: payload.phone || siteSettings.phone,
    email: payload.email || siteSettings.email,
    location: payload.location || siteSettings.location,
    hours: payload.hours || siteSettings.hours,
    whatsapp: payload.whatsapp || siteSettings.whatsapp,
    aboutText: payload.aboutText || siteSettings.aboutText
  };

  persistStore({ site: siteSettings, products: menu, customers });

  return res.json({ message: 'Website content updated successfully.', site: siteSettings });
});

app.get('/api/menu', (req, res) => {
  const { category } = req.query;
  const safeMenu = menu.filter((item) => item.available !== false);

  if (category) {
    const filtered = safeMenu.filter((item) => item.category.toLowerCase() === String(category).toLowerCase());
    return res.json({ menu: filtered, category });
  }

  res.json({ menu: safeMenu });
});

app.get('/api/menu/:id', (req, res) => {
  const item = menuById.get(Number(req.params.id));

  if (!item) {
    return res.status(404).json({ message: 'Menu item not found.' });
  }

  res.json({ item });
});

app.get('/api/dashboard', authenticate, adminOnly, async (req, res, next) => {
  try {
    const [orders, totalRevenue] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).lean(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }])
    ]);
    const statuses = orderStatuses.reduce((acc, status) => {
      acc[status] = orders.filter((order) => order.status === status).length;
      return acc;
    }, {});

    return res.json({
      totalOrders: orders.length,
      totalRevenue: totalRevenue[0]?.total || 0,
      menuItems: menu.length,
      statuses,
      recentOrders: orders.slice(0, 5)
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/menu', authenticate, adminOnly, (req, res) => {
  res.json({ menu });
});

app.post('/api/admin/menu', authenticate, adminOnly, (req, res) => {
  const { name, price, category, description, image, available, featured } = req.body || {};

  if (!name || !price || !category) {
    return res.status(400).json({ message: 'Name, price, and category are required.' });
  }

  const newItem = {
    id: Date.now(),
    name,
    price: Number(price),
    category: String(category).toLowerCase(),
    description: description || '',
    image: image || '',
    available: available !== false,
    featured: Boolean(featured)
  };

  menu.push(newItem);
  menuById.set(newItem.id, newItem);
  persistStore({ site: siteSettings, products: menu, customers });

  res.status(201).json({
    message: 'Menu item added successfully.',
    item: newItem
  });
});

app.put('/api/admin/menu/:id', authenticate, adminOnly, (req, res) => {
  const item = menuById.get(Number(req.params.id));

  if (!item) {
    return res.status(404).json({ message: 'Menu item not found.' });
  }

  const { name, price, category, description, image } = req.body || {};

  item.name = name || item.name;
  item.price = Number(price) || item.price;
  item.category = category ? String(category).toLowerCase() : item.category;
  item.description = description || item.description || '';
  item.image = image || item.image || '';
  persistStore({ site: siteSettings, products: menu, customers });

  res.json({
    message: 'Menu item updated successfully.',
    item
  });
});

app.patch('/api/admin/menu/:id/stock', authenticate, adminOnly, (req, res) => {
  const item = menuById.get(Number(req.params.id));

  if (!item) {
    return res.status(404).json({ message: 'Menu item not found.' });
  }

  item.available = item.available === false;
  persistStore({ site: siteSettings, products: menu, customers });

  res.json({
    message: item.available ? 'Product marked available.' : 'Product marked out of stock.',
    item
  });
});

app.patch('/api/admin/menu/:id/featured', authenticate, adminOnly, (req, res) => {
  const item = menuById.get(Number(req.params.id));

  if (!item) {
    return res.status(404).json({ message: 'Menu item not found.' });
  }

  item.featured = !item.featured;
  persistStore({ site: siteSettings, products: menu, customers });

  res.json({
    message: item.featured ? 'Product featured successfully.' : 'Product removed from featured list.',
    item
  });
});

app.delete('/api/admin/menu/:id', authenticate, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const index = menu.findIndex((entry) => entry.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Menu item not found.' });
  }

  const [deletedItem] = menu.splice(index, 1);
  menuById.delete(id);
  persistStore({ site: siteSettings, products: menu, customers });

  res.json({
    message: 'Menu item deleted successfully.',
    item: deletedItem
  });
});

app.get('/api/admin/users', authenticate, adminOnly, (req, res) => {
  res.json({
    users: adminUsers.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    })),
    customers: customers.map((customer) => sanitizeCustomer(customer))
  });
});

app.get('*', (req, res) => {
  if (req.path === '/admin' || req.path === '/admin/' || req.path === '/admin.html') {
    return res.sendFile(path.join(__dirname, 'admin.html'));
  }

  if (req.path === '/' || req.path === '/index.html' || req.path === '/thankyou.html' || req.path === '/customer-account.html') {
    return res.redirect(`/login.html?returnTo=${encodeURIComponent(req.path)}`);
  }

  return res.status(404).send('Page not found.');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Default admin login: username = admin, password = admin123');
  });
}

module.exports = app;
