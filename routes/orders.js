const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');

const router = express.Router();
const orderStatuses = ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'];

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  return next();
};

const requireCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Customer access required.' });
  }
  return next();
};

const requireOrderAccess = (req, res, next) => {
  if (!req.user || !['admin', 'customer'].includes(req.user.role)) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  return next();
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('At least one order item is required.');
  }

  return items.map((item) => {
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const quantity = Number(item.quantity);
    const price = Number(item.price);

    if (!name || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new Error('Each order item must have a valid name and quantity.');
    }

    if (!Number.isFinite(price) || price < 0) {
      throw new Error('Each order item must have a valid price.');
    }

    return { name, quantity, price };
  });
};

const calculateTotal = (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const createOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = cryptoRandomBytes(5).toString('hex').toUpperCase();
  return `OBI-${timestamp}-${random}`;
};

const cryptoRandomBytes = require('node:crypto').randomBytes;

const validateOrderPayload = (body) => {
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

  if (customerName.length < 2 || customerName.length > 120) {
    throw new Error('Enter a valid customer name.');
  }

  if (phone.length < 7 || phone.length > 30) {
    throw new Error('Enter a valid phone number.');
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  if (address.length > 300 || notes.length > 1000) {
    throw new Error('Order details are too long.');
  }

  return {
    customerName,
    phone,
    email,
    address,
    notes,
    items: normalizeItems(body.items)
  };
};

const getAuthenticatedCustomer = (req) => {
  if (!req.user || req.user.role !== 'customer') return null;
  return req.user;
};

router.get('/orders', requireAdmin, async (req, res, next) => {
  try {
    const query = { status: req.query.status };
    if (req.query.status) {
      const normalizedStatus = String(req.query.status).toLowerCase();
      if (!orderStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ message: 'Invalid order status.' });
      }
      query.status = normalizedStatus;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ orders, count: orders.length });
  } catch (error) {
    return next(error);
  }
});

router.get('/orders/my-orders', requireCustomer, async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json({ orders, count: orders.length });
  } catch (error) {
    return next(error);
  }
});

router.get('/orders/:id', requireOrderAccess, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) && !/^OBI-[A-Z0-9-]+$/.test(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID.' });
    }

    const order = await Order.findOne({ $or: [{ _id: req.params.id }, { orderId: req.params.id }] }).lean();
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (req.user.role === 'customer' && Number(order.customerId) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'You can only view your own orders.' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    return res.json({ order });
  } catch (error) {
    return next(error);
  }
});

router.post('/orders', async (req, res, next) => {
  try {
    const customer = getAuthenticatedCustomer(req);
    const payload = validateOrderPayload(req.body || {});
    const idempotencyKey = typeof req.body.idempotencyKey === 'string' ? req.body.idempotencyKey.trim() : '';
    const total = calculateTotal(payload.items);

    if (idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey }).lean();
      if (existing) {
        return res.status(200).json({ message: 'Order already saved.', order: existing });
      }
    }

    const order = await Order.create({
      orderId: createOrderNumber(),
      idempotencyKey: idempotencyKey || null,
      customerId: customer ? customer.id : null,
      customerName: payload.customerName,
      phone: payload.phone,
      email: payload.email || (customer ? customer.email : ''),
      address: payload.address,
      items: payload.items,
      total,
      notes: payload.notes,
      status: 'pending'
    });

    return res.status(201).json({
      message: 'Order saved successfully.',
      order
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

router.patch('/orders/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.body.status || '').toLowerCase();
    if (!orderStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }

    const order = await Order.findOneAndUpdate(
      { $or: [{ _id: req.params.id }, { orderId: req.params.id }] },
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.json({ message: 'Order status updated successfully.', order });
  } catch (error) {
    return next(error);
  }
});

router.delete('/orders/:id', requireAdmin, async (req, res, next) => {
  try {
    const order = await Order.findOneAndDelete({ $or: [{ _id: req.params.id }, { orderId: req.params.id }] }).lean();
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.json({ message: 'Order deleted successfully.', order });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
