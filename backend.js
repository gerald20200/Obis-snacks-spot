const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const ordersList = document.getElementById('ordersList');
const menuList = document.getElementById('menuList');
const menuForm = document.getElementById('menuForm');
const menuMessage = document.getElementById('menuMessage');

const tokenKey = 'obi_snack_admin_token';

const formatMoney = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;

const setAuthState = (token) => {
  if (token) {
    localStorage.setItem(tokenKey, token);
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
  } else {
    localStorage.removeItem(tokenKey);
    loginView.style.display = 'block';
    dashboardView.style.display = 'none';
  }
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem(tokenKey) || ''}`
});

const renderDashboard = async () => {
  try {
    const dashboardRes = await fetch('/api/dashboard', { headers: getHeaders() });
    const dashboardData = await dashboardRes.json();

    if (!dashboardRes.ok) {
      throw new Error(dashboardData.message || 'Unable to load dashboard.');
    }

    document.getElementById('totalOrders').textContent = dashboardData.totalOrders || 0;
    document.getElementById('totalRevenue').textContent = formatMoney(dashboardData.totalRevenue || 0);
    document.getElementById('menuCount').textContent = dashboardData.menuItems || 0;
    document.getElementById('pendingCount').textContent = dashboardData.statuses?.pending || 0;

    const ordersRes = await fetch('/api/orders', { headers: getHeaders() });
    const ordersData = await ordersRes.json();
    const orders = ordersData.orders || [];

    ordersList.innerHTML = orders.length
      ? `<table><thead><tr><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>${orders.slice().reverse().map((order) => `
          <tr>
            <td>${order.customerName}<br><small>${order.phone}</small></td>
            <td>${(order.items || []).map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`).join('<br>')}</td>
            <td>${formatMoney(order.total || 0)}</td>
            <td>
              <span class="status-pill">${order.status || 'pending'}</span><br>
              ${['pending', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => `
                <button type="button" class="status-btn" data-status="${status}" data-id="${order.id}">${status}</button>
              `).join('')}
            </td>
          </tr>
        `).join('')}</tbody></table>`
      : '<p>No orders yet.</p>';

    const menuRes = await fetch('/api/admin/menu', { headers: getHeaders() });
    const menuData = await menuRes.json();
    const menu = menuData.menu || [];

    menuList.innerHTML = menu.length
      ? menu.map((item) => `<div style="padding:8px 0; border-bottom:1px solid #f4e1cf; display:flex; justify-content:space-between; gap:12px;"> <span>${item.name}</span> <span>${formatMoney(item.price)}</span> </div>`).join('')
      : '<p>No menu items yet.</p>';
  } catch (error) {
    loginError.textContent = error.message;
    setAuthState(null);
  }
};

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

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
    await renderDashboard();
  } catch (error) {
    loginError.textContent = error.message;
  }
});

logoutBtn.addEventListener('click', () => setAuthState(null));

document.addEventListener('click', async (event) => {
  const target = event.target.closest('.status-btn');
  if (!target) return;

  const orderId = target.dataset.id;
  const status = target.dataset.status;

  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Status update failed.');
    }

    await renderDashboard();
  } catch (error) {
    alert(error.message);
  }
});

menuForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  menuMessage.textContent = '';

  try {
    const response = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: document.getElementById('menuName').value.trim(),
        price: Number(document.getElementById('menuPrice').value),
        category: document.getElementById('menuCategory').value
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Menu item failed to add.');
    }

    menuForm.reset();
    await renderDashboard();
  } catch (error) {
    menuMessage.textContent = error.message;
  }
});

const token = localStorage.getItem(tokenKey);
if (token) {
  setAuthState(token);
  renderDashboard();
}
