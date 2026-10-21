const express = require('express');

const orderStatuses = ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createOrdersRouter = (supabaseOrders) => {
  const router = express.Router();

  router.use((req, res, next) => {
    if (!supabaseOrders) {
      return res.status(503).json({ message: 'Supabase order storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY.' });
    }
    return next();
  });

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

const toApiOrder = (order) => ({
  id: order.id,
  _id: order.id,
  orderId: order.order_number || order.id,
  idempotencyKey: order.idempotency_key,
  customerId: order.user_id,
  customerName: order.customer_name,
  phone: order.phone,
  email: order.email || '',
  address: order.address,
  items: order.items || [],
  total: Number(order.total_price || 0),
  notes: order.notes || '',
  status: order.status,
  createdAt: order.created_at,
  updatedAt: order.updated_at
});

const getOrderFilter = (id) => {
  if (uuidPattern.test(id)) return ['id', id];
  if (/^OBI-[A-Z0-9-]+$/i.test(id)) return ['order_number', id];
  return null;
};

const handleStorageError = (res, error) => {
  console.error('Supabase order storage request failed:', error.message);
  return res.status(500).json({ message: 'Unable to access order storage.' });
};

router.get('/', requireAdmin, async (req, res) => {
  try {
    let query = supabaseOrders.from('orders').select('*').order('created_at', { ascending: false });
    if (req.query.status) {
      const normalizedStatus = String(req.query.status).toLowerCase();
      if (!orderStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ message: 'Invalid order status.' });
      }
      query = query.eq('status', normalizedStatus);
    }

    const { data, error } = await query;
    if (error) return handleStorageError(res, error);
    const orders = (data || []).map(toApiOrder);
    return res.json({ orders, count: orders.length });
  } catch (error) {
    return handleStorageError(res, error);
  }
});

router.get('/my-orders', requireCustomer, async (req, res) => {
  try {
    const { data, error } = await supabaseOrders
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) return handleStorageError(res, error);
    const orders = (data || []).map(toApiOrder);
    return res.json({ orders, count: orders.length });
  } catch (error) {
    return handleStorageError(res, error);
  }
});

router.get('/:id', requireOrderAccess, async (req, res) => {
  try {
    const filter = getOrderFilter(req.params.id);
    if (!filter) return res.status(400).json({ message: 'Invalid order ID.' });

    const { data: order, error } = await supabaseOrders
      .from('orders')
      .select('*')
      .eq(filter[0], req.params.id)
      .maybeSingle();
    if (error) return handleStorageError(res, error);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (req.user.role === 'customer' && String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only view your own orders.' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    return res.json({ order: toApiOrder(order) });
  } catch (error) {
    return handleStorageError(res, error);
  }
});

router.post('/', async (req, res) => {
  try {
    const customer = getAuthenticatedCustomer(req);
    const body = req.body || {};
    const payload = validateOrderPayload(body);
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';
    if (idempotencyKey.length > 128) {
      return res.status(400).json({ message: 'Idempotency key is too long.' });
    }
    const total = calculateTotal(payload.items);

    if (idempotencyKey) {
      const { data: existing, error } = await supabaseOrders
        .from('orders')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      if (error) return handleStorageError(res, error);
      if (existing) return res.status(200).json({ message: 'Order already saved.', order: toApiOrder(existing) });
    }

    const userId = customer && uuidPattern.test(String(customer.id)) ? customer.id : null;
    const { data: order, error } = await supabaseOrders
      .from('orders')
      .insert({
      user_id: userId,
      customer_name: payload.customerName,
      phone: payload.phone,
      email: payload.email || (customer ? customer.email : ''),
      address: payload.address,
      items: payload.items,
      total_price: total,
      notes: payload.notes,
      status: 'pending',
      idempotency_key: idempotencyKey || null
      })
      .select('*')
      .single();
    if (error) return handleStorageError(res, error);

    return res.status(201).json({
      message: 'Order saved successfully.',
      order: toApiOrder(order)
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Invalid order details.' });
  }
});

router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const status = String(req.body.status || '').toLowerCase();
    if (!orderStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }

    const filter = getOrderFilter(req.params.id);
    if (!filter) return res.status(400).json({ message: 'Invalid order ID.' });
    const { data: order, error } = await supabaseOrders
      .from('orders')
      .update({ status })
      .eq(filter[0], req.params.id)
      .select('*')
      .maybeSingle();
    if (error) return handleStorageError(res, error);

    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.json({ message: 'Order status updated successfully.', order: toApiOrder(order) });
  } catch (error) {
    return handleStorageError(res, error);
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const filter = getOrderFilter(req.params.id);
    if (!filter) return res.status(400).json({ message: 'Invalid order ID.' });
    const { data: order, error } = await supabaseOrders
      .from('orders')
      .delete()
      .eq(filter[0], req.params.id)
      .select('*')
      .maybeSingle();
    if (error) return handleStorageError(res, error);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.json({ message: 'Order deleted successfully.', order: toApiOrder(order) });
  } catch (error) {
    return handleStorageError(res, error);
  }
});

  return router;
};

module.exports = createOrdersRouter;

