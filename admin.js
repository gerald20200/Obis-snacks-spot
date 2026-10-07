const adminLoginView = document.getElementById('adminLoginView');
const adminDashboardView = document.getElementById('adminDashboardView');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginError = document.getElementById('adminLoginError');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const adminPageTitle = document.getElementById('adminPageTitle');
const navItems = document.querySelectorAll('.nav-item[data-section]');
const sections = document.querySelectorAll('.admin-section');
const productForm = document.getElementById('productForm');
const productFormMessage = document.getElementById('productFormMessage');
const productImageFile = document.getElementById('productImageFile');
const productImageInput = document.getElementById('productImage');
const contentForm = document.getElementById('contentForm');
const contentFormMessage = document.getElementById('contentFormMessage');
const productsGrid = document.getElementById('productsGrid');
const ordersTableWrap = document.getElementById('ordersTableWrap');
const dashboardOrdersList = document.getElementById('dashboardOrdersList');
const dashboardSummary = document.getElementById('dashboardSummary');
const orderDetailsModal = document.getElementById('orderDetailsModal');
const orderDetailsContent = document.getElementById('orderDetailsContent');
const orderDetailsClose = document.getElementById('orderDetailsClose');

const tokenKey = 'obi_snack_admin_token';
const formatMoney = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;
const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const getToken = () => localStorage.getItem(tokenKey) || '';

const setAuthState = (token) => {
  if (token) {
    localStorage.setItem(tokenKey, token);
    adminLoginView.classList.add('hidden');
    adminDashboardView.classList.remove('hidden');
    return;
  }

  localStorage.removeItem(tokenKey);
  adminLoginView.classList.remove('hidden');
  adminDashboardView.classList.add('hidden');
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
});

const showSection = (sectionName) => {
  navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.section === sectionName);
  });

  sections.forEach((section) => {
    section.classList.toggle('active', section.id === `section-${sectionName}`);
  });

  const titles = {
    dashboard: 'Dashboard',
    orders: 'Orders',
    products: 'Products',
    content: 'Website Content',
    settings: 'Settings'
  };

  adminPageTitle.textContent = titles[sectionName] || 'Dashboard';
};

const openOrderDetails = (order) => {
  const items = (order.items || []).map((item) => `
    <li>
      <span>${escapeHtml(item.name)}</span>
      <span>${item.quantity} × ${formatMoney(item.price)}</span>
    </li>
  `).join('');

  orderDetailsContent.innerHTML = `
    <div class="details-grid">
      <div><span>Order ID</span><strong>${escapeHtml(order.orderId || order._id)}</strong></div>
      <div><span>Status</span><strong class="badge">${escapeHtml(order.status || 'pending')}</strong></div>
      <div><span>Customer</span><strong>${escapeHtml(order.customerName || 'Walk-in customer')}</strong></div>
      <div><span>Phone</span><strong>${escapeHtml(order.phone || 'Not provided')}</strong></div>
      <div><span>Email</span><strong>${escapeHtml(order.email || 'Not provided')}</strong></div>
      <div><span>Order date</span><strong>${new Date(order.createdAt).toLocaleString()}</strong></div>
      <div class="details-full"><span>Delivery address</span><strong>${escapeHtml(order.address || 'Not applicable')}</strong></div>
      <div class="details-full"><span>Items</span><ul>${items}</ul></div>
      ${order.notes ? `<div class="details-full"><span>Customer notes</span><strong>${escapeHtml(order.notes)}</strong></div>` : ''}
      <div class="details-full details-total"><span>Total</span><strong>${formatMoney(order.total || 0)}</strong></div>
    </div>
  `;

  orderDetailsModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  orderDetailsClose.focus();
};

const closeOrderDetails = () => {
  orderDetailsModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
};

const renderDashboardCards = (data) => {
  document.getElementById('statTotalOrders').textContent = String(data.totalOrders || 0);
  document.getElementById('statRevenue').textContent = formatMoney(data.totalRevenue || 0);
  document.getElementById('statProducts').textContent = String(data.menuItems || 0);
  document.getElementById('statPending').textContent = String(data.statuses?.pending || 0);

  const recentOrders = data.recentOrders || [];
  dashboardOrdersList.innerHTML = recentOrders.length
    ? recentOrders.map((order) => `
        <div class="order-row">
          <div class="order-main">
            <strong>${escapeHtml(order.orderId || 'Unknown order')}</strong>
            <span class="badge">${escapeHtml(order.status || 'pending')}</span>
          </div>
          <small>${escapeHtml((order.items || []).map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`).join(', ') || 'No items')}</small>
          <div>${formatMoney(order.total || 0)}</div>
        </div>
      `).join('')
    : '<p>No recent orders yet.</p>';

  dashboardSummary.innerHTML = `
    <div class="summary-item"><span>Confirmed</span><strong>${data.statuses?.confirmed || 0}</strong></div>
    <div class="summary-item"><span>Preparing</span><strong>${data.statuses?.preparing || 0}</strong></div>
    <div class="summary-item"><span>Completed</span><strong>${data.statuses?.completed || 0}</strong></div>
    <div class="summary-item"><span>Cancelled</span><strong>${data.statuses?.cancelled || 0}</strong></div>
  `;
};

const renderOrders = (orders) => {
  if (!orders.length) {
    ordersTableWrap.innerHTML = '<p>No orders yet.</p>';
    return;
  }

  ordersTableWrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Phone / Email</th>
          <th>Delivery address</th>
          <th>Products / Quantity</th>
          <th>Total</th>
          <th>Date / Time</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map((order) => `
          <tr>
            <td><code>${escapeHtml(order.orderId || order._id)}</code></td>
            <td><strong>${escapeHtml(order.customerName || 'Walk-in customer')}</strong></td>
            <td>${escapeHtml(order.phone || 'Not provided')}<br><small>${escapeHtml(order.email || 'No email')}</small></td>
            <td>${escapeHtml(order.address || 'Not applicable')}</td>
            <td>${(order.items || []).map((item) => `${escapeHtml(item.name)} × ${item.quantity}`).join('<br>')}</td>
            <td>${formatMoney(order.total || 0)}</td>
            <td>${new Date(order.createdAt).toLocaleString()}</td>
            <td>
              <select class="status-select" data-order-id="${escapeHtml(order.orderId || order._id)}">
                ${['pending', 'confirmed', 'preparing', 'completed', 'cancelled'].map((status) => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>`).join('')}
              </select>
            </td>
            <td>
              <button type="button" class="action-btn view" data-action="view-details" data-order-id="${escapeHtml(order.orderId || order._id)}">View details</button>
              <button type="button" class="action-btn update" data-action="update-status" data-order-id="${escapeHtml(order.orderId || order._id)}">Save</button>
              <button type="button" class="action-btn delete" data-action="delete-order" data-order-id="${escapeHtml(order.orderId || order._id)}">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

const renderProducts = (products) => {
  if (!products.length) {
    productsGrid.innerHTML = '<p>No products yet.</p>';
    return;
  }

  productsGrid.innerHTML = products.map((product) => `
    <article class="product-card">
      <img src="${product.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80'}" alt="${product.name}" />
      <div class="product-card-body">
        <div class="product-meta">
          <h4>${product.name}</h4>
          <span class="stock-pill ${product.available === false ? 'out-of-stock' : 'in-stock'}">${product.available === false ? 'Out of Stock' : 'Available'}</span>
        </div>
        <div class="product-meta">
          <strong>${formatMoney(product.price || 0)}</strong>
          ${product.featured ? '<span class="feature-pill featured">Featured</span>' : ''}
        </div>
        <p>${product.description || 'No description provided.'}</p>
        <div class="product-actions">
          <button type="button" class="action-btn update" data-action="toggle-stock" data-product-id="${product.id}">${product.available === false ? 'Mark Available' : 'Mark Out of Stock'}</button>
          <button type="button" class="action-btn update" data-action="toggle-featured" data-product-id="${product.id}">${product.featured ? 'Remove Featured' : 'Feature'}</button>
          <button type="button" class="action-btn delete" data-action="delete-product" data-product-id="${product.id}">Delete</button>
        </div>
      </div>
    </article>
  `).join('');
};

const loadDashboard = async () => {
  try {
    const dashboardRes = await fetch('/api/dashboard', { headers: getHeaders() });
    const dashboardData = await dashboardRes.json();

    if (!dashboardRes.ok) {
      throw new Error(dashboardData.message || 'Unable to load admin dashboard.');
    }

    renderDashboardCards(dashboardData);

    const ordersRes = await fetch('/api/orders', { headers: getHeaders() });
    const ordersData = await ordersRes.json();
    renderOrders(ordersData.orders || []);

    const productsRes = await fetch('/api/admin/menu', { headers: getHeaders() });
    const productsData = await productsRes.json();
    renderProducts(productsData.menu || []);

    const siteRes = await fetch('/api/site', { headers: getHeaders() });
    const siteData = await siteRes.json();
    if (siteRes.ok && siteData.site) {
      const site = siteData.site;
      document.getElementById('siteBusinessName').value = site.businessName || '';
      document.getElementById('siteHeroTitle').value = site.heroTitle || '';
      document.getElementById('siteHeroSubtitle').value = site.heroSubtitle || '';
      document.getElementById('sitePhone').value = site.phone || '';
      document.getElementById('siteEmail').value = site.email || '';
      document.getElementById('siteLocation').value = site.location || '';
      document.getElementById('siteHours').value = site.hours || '';
      document.getElementById('siteWhatsapp').value = site.whatsapp || '';
    }
  } catch (error) {
    adminLoginError.textContent = error.message;
    setAuthState(null);
  }
};

adminLoginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  adminLoginError.textContent = '';

  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Login failed.');
    }

    setAuthState(result.token);
    showSection('dashboard');
    await loadDashboard();
  } catch (error) {
    adminLoginError.textContent = error.message;
  }
});

adminLogoutBtn.addEventListener('click', () => {
  setAuthState(null);
});

navItems.forEach((item) => {
  item.addEventListener('click', () => showSection(item.dataset.section));
});

document.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  const orderId = target.dataset.orderId;
  const productId = target.dataset.productId;

  if (action === 'view-details' && orderId) {
    try {
      const response = await fetch(`/api/orders/${orderId}`, { headers: getHeaders() });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to load order details.');
      openOrderDetails(result.order);
    } catch (error) {
      alert(error.message);
    }
  }

  if (action === 'update-status' && orderId) {
    const select = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
    const nextStatus = select ? select.value : 'pending';

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Status update failed.');
      await loadDashboard();
    } catch (error) {
      alert(error.message);
    }
  }

  if (action === 'delete-order' && orderId) {
    if (!window.confirm('Delete this order?')) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Delete failed.');
      await loadDashboard();
    } catch (error) {
      alert(error.message);
    }
  }

  if (action === 'toggle-stock' && productId) {
    try {
      const response = await fetch(`/api/admin/menu/${productId}/stock`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Stock update failed.');
      await loadDashboard();
    } catch (error) {
      alert(error.message);
    }
  }

  if (action === 'toggle-featured' && productId) {
    try {
      const response = await fetch(`/api/admin/menu/${productId}/featured`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Featured update failed.');
      await loadDashboard();
    } catch (error) {
      alert(error.message);
    }
  }

  if (action === 'delete-product' && productId) {
    if (!window.confirm('Delete this product?')) return;

    try {
      const response = await fetch(`/api/admin/menu/${productId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Delete failed.');
      await loadDashboard();
    } catch (error) {
      alert(error.message);
    }
  }
});

orderDetailsClose.addEventListener('click', closeOrderDetails);
orderDetailsModal.addEventListener('click', (event) => {
  if (event.target.matches('[data-close-modal]')) closeOrderDetails();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !orderDetailsModal.classList.contains('hidden')) {
    closeOrderDetails();
  }
});

productImageFile.addEventListener('change', (event) => {
  const [file] = event.target.files || [];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    productImageInput.value = String(reader.result || '');
  };

  reader.onerror = () => {
    productFormMessage.textContent = 'Could not read the selected image file.';
  };

  reader.readAsDataURL(file);
});

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  productFormMessage.textContent = '';

  try {
    const response = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: document.getElementById('productName').value.trim(),
        price: Number(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        description: document.getElementById('productDescription').value.trim(),
        image: productImageInput.value.trim(),
        available: true,
        featured: false
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Product add failed.');

    productForm.reset();
    productImageFile.value = '';
    productFormMessage.textContent = 'Product added successfully.';
    await loadDashboard();
  } catch (error) {
    productFormMessage.textContent = error.message;
  }
});

contentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  contentFormMessage.textContent = '';

  try {
    const payload = {
      businessName: document.getElementById('siteBusinessName').value.trim(),
      heroTitle: document.getElementById('siteHeroTitle').value.trim(),
      heroSubtitle: document.getElementById('siteHeroSubtitle').value.trim(),
      phone: document.getElementById('sitePhone').value.trim(),
      email: document.getElementById('siteEmail').value.trim(),
      location: document.getElementById('siteLocation').value.trim(),
      hours: document.getElementById('siteHours').value.trim(),
      whatsapp: document.getElementById('siteWhatsapp').value.trim()
    };

    const response = await fetch('/api/site', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Website update failed.');

    contentFormMessage.textContent = 'Website content saved successfully.';
    await loadDashboard();
  } catch (error) {
    contentFormMessage.textContent = error.message;
  }
});

const token = getToken();
if (token) {
  setAuthState(token);
  loadDashboard();
} else {
  setAuthState(null);
}

showSection('dashboard');
