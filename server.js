const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'obi-snack-spot-secret-key';

app.disable('x-powered-by');

const menu = [
  { id: 1, name: 'Chicken Burger', price: 2500, category: 'meal' },
  { id: 2, name: 'Shawarma', price: 2000, category: 'meal' },
  { id: 3, name: 'Meat Pie', price: 1000, category: 'snack' },
  { id: 4, name: 'Jollof Rice & Chicken', price: 3000, category: 'meal' },
  { id: 5, name: 'French Fries', price: 1500, category: 'snack' },
  { id: 6, name: 'Cold Drink', price: 800, category: 'drink' },
  { id: 7, name: 'Fresh Fruit Juice', price: 1200, category: 'drink' },
  { id: 8, name: 'Coca-Cola', price: 700, category: 'drink' },
  { id: 9, name: 'Lemonade', price: 900, category: 'drink' },
  { id: 10, name: 'Red Wine', price: 4500, category: 'drink' }
];

const orders = [];
const orderStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

const adminUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@obisnackspot.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
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
app.use(express.static(__dirname));

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

app.get('/api/menu', (req, res) => {
  const { category } = req.query;

  if (category) {
    const filtered = menu.filter((item) => item.category.toLowerCase() === String(category).toLowerCase());
    return res.json({ menu: filtered, category });
  }

  res.json({ menu });
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

  res.status(201).json({
    message: 'Order received successfully.',
    order
  });
});

app.patch('/api/orders/:id/status', authenticate, adminOnly, (req, res) => {
  const { status } = req.body || {};
  const order = orders.find((entry) => entry.id === Number(req.params.id));

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  if (!orderStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status.' });
  }

  order.status = status;
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
  res.json({
    message: 'Order deleted successfully.',
    order: deletedOrder
  });
});

app.get('/api/admin/menu', authenticate, adminOnly, (req, res) => {
  res.json({ menu });
});

app.post('/api/admin/menu', authenticate, adminOnly, (req, res) => {
  const { name, price, category } = req.body || {};

  if (!name || !price || !category) {
    return res.status(400).json({ message: 'Name, price, and category are required.' });
  }

  const newItem = {
    id: Date.now(),
    name,
    price: Number(price),
    category: String(category).toLowerCase()
  };

  menu.push(newItem);
  menuById.set(newItem.id, newItem);

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

  const { name, price, category } = req.body || {};

  item.name = name || item.name;
  item.price = Number(price) || item.price;
  item.category = category ? String(category).toLowerCase() : item.category;

  res.json({
    message: 'Menu item updated successfully.',
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
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Default admin login: username = admin, password = admin123');
});
