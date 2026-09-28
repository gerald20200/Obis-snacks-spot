const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'obi-snack-spot-secret-key';
const STORE_PATH = path.join(__dirname, 'data', 'store.json');

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
      orders: Array.isArray(parsed.orders) ? parsed.orders : []
    };
  } catch (error) {
    return {
      site: { ...defaultSite },
      products: [...defaultProducts],
      orders: []
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
let orders = [...initialStore.orders];
let siteSettings = { ...initialStore.site };
const orderStatuses = ['pending', 'processing', 'completed', 'cancelled'];

const adminUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@obisnackspot.com',
    passwordHash: bcrypt.hashSync('obis snacks', 10),
    role: 'admin',
    createdAt: new Date().toISOString()
  }
];

const menuById = new Map(menu.map((item) => [item.id, item]));
const adminUserByUsername = new Map(adminUsers.map((user) => [user.username.toLowerCase(), user]));
const adminUserByEmail = new Map(adminUsers.map((user) => [user.email.toLowerCase(), user]));

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
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  next();
};

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname, { index: false }));

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

app.get('/script.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'script.js'));
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'redirect.html'));
});

app.get('/thankyou.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'thankyou.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: "Obi's Snack Spot Backend" });
});

app.post('/api/auth/login', (req, res) => {
  const { username, email, password } = req.body || {};

  if (!password || (!username && !email)) {
    return res.status(400).json({ message: 'Username or email and password are required.' });
  }

  const user = username
    ? adminUserByUsername.get(String(username).toLowerCase())
    : adminUserByEmail.get(String(email).toLowerCase());

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
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

app.post('/api/auth/register', authenticate, adminOnly, (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  const exists = adminUserByUsername.has(String(username).toLowerCase()) || adminUserByEmail.has(String(email).toLowerCase());

  if (exists) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const newUser = {
    id: Date.now(),
    username,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'admin',
    createdAt: new Date().toISOString()
  };

  adminUsers.push(newUser);
  adminUserByUsername.set(newUser.username.toLowerCase(), newUser);
  adminUserByEmail.set(newUser.email.toLowerCase(), newUser);

  res.status(201).json({
    message: 'Admin user created successfully.',
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    }
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
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

  persistStore({ site: siteSettings, products: menu, orders });

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

app.get('/api/orders', (req, res) => {
  const { status } = req.query;

  if (status) {
    const filtered = orders.filter((order) => order.status === status);
    return res.json({ orders: filtered, count: filtered.length });
  }

  res.json({ orders, count: orders.length });
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find((entry) => entry.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  res.json({ order });
});

app.get('/api/dashboard', authenticate, adminOnly, (req, res) => {
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const statuses = orderStatuses.reduce((acc, status) => {
    acc[status] = orders.filter((order) => order.status === status).length;
    return acc;
  }, {});

  res.json({
    totalOrders: orders.length,
    totalRevenue,
    menuItems: menu.length,
    statuses,
    recentOrders: orders.slice(-5).reverse()
  });
});

app.post('/api/orders', (req, res) => {
  try {
    const { itemName, items, customerName, phone, notes, address } = req.body || {};
    const rawItems = Array.isArray(items)
      ? items
      : Array.isArray(itemName)
        ? itemName
        : itemName
          ? [itemName]
          : [];

    const normalizedItems = normalizeOrderItems(rawItems);

    if (!normalizedItems.length) {
      return res.status(400).json({ message: 'At least one item is required.' });
    }

    const order = {
      id: Date.now(),
      items: normalizedItems,
      total: getOrderTotal(normalizedItems),
      customerName: customerName || 'Walk-in customer',
      phone: phone || 'Not provided',
      address: address || 'Not provided',
      notes: notes || 'No extra notes',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    orders.push(order);
    persistStore({ site: siteSettings, products: menu, orders });

    return res.status(201).json({
      message: 'Order received successfully.',
      order
    });
  } catch (error) {
    console.error('Order creation failed:', error);
    return res.status(500).json({ message: 'Unable to place your order right now.' });
  }
});

app.patch('/api/orders/:id/status', authenticate, adminOnly, (req, res) => {
  const { status } = req.body || {};
  const order = orders.find((entry) => entry.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  const normalizedStatus = String(status || '').toLowerCase();
  const validStatus = orderStatuses.includes(normalizedStatus)
    ? normalizedStatus
    : normalizedStatus === 'preparing' || normalizedStatus === 'ready'
      ? 'processing'
      : null;

  if (!validStatus) {
    return res.status(400).json({ message: 'Invalid order status.' });
  }

  order.status = validStatus;
  persistStore({ site: siteSettings, products: menu, orders });

  res.json({
    message: 'Order status updated successfully.',
    order
  });
});

app.delete('/api/orders/:id', authenticate, adminOnly, (req, res) => {
  const index = orders.findIndex((entry) => entry.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  const [deletedOrder] = orders.splice(index, 1);
  persistStore({ site: siteSettings, products: menu, orders });

  res.json({
    message: 'Order deleted successfully.',
    order: deletedOrder
  });
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
  persistStore({ site: siteSettings, products: menu, orders });

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
  persistStore({ site: siteSettings, products: menu, orders });

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
  persistStore({ site: siteSettings, products: menu, orders });

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
  persistStore({ site: siteSettings, products: menu, orders });

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
  persistStore({ site: siteSettings, products: menu, orders });

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
    }))
  });
});

app.get('*', (req, res) => {
  if (req.path === '/admin' || req.path === '/admin/' || req.path === '/admin.html') {
    return res.sendFile(path.join(__dirname, 'admin.html'));
  }

  const resolvedPath = req.path === '/' ? 'redirect.html' : 'index.html';
  res.sendFile(path.join(__dirname, resolvedPath));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Default admin login: username = admin, password = admin123');
  });
}

module.exports = app;
