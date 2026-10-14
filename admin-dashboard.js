(function () {
  const ordersTable = document.getElementById('ordersTable');
  const ordersBody = document.getElementById('ordersBody');
  const statusMessage = document.getElementById('statusMessage');
  const accessDenied = document.getElementById('accessDenied');
  const logoutBtn = document.getElementById('logoutBtn');
  const supabase = window.supabaseClient;

  const formatMoney = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;

  const setMessage = (text, isError = false) => {
    statusMessage.textContent = text;
    statusMessage.style.background = isError ? '#fff0ee' : '#fff0df';
    statusMessage.style.color = isError ? '#b42318' : '#a04000';
  };

  const renderOrders = (orders) => {
    if (!orders.length) {
      ordersBody.innerHTML = '<tr><td colspan="8">No customer orders yet.</td></tr>';
      return;
    }

    ordersBody.innerHTML = orders.map((order) => {
      const itemsText = Array.isArray(order.items)
        ? order.items.map((item) => `${item.name} x${item.quantity}`).join(', ')
        : '—';

      return `
        <tr>
          <td>${order.id.slice(0, 8)}</td>
          <td>${order.customer_name || 'Customer'}</td>
          <td>${order.email || '—'}<br>${order.phone || '—'}</td>
          <td>${order.address || '—'}</td>
          <td>${itemsText}</td>
          <td>${formatMoney(order.total_price || 0)}</td>
          <td>
            <select data-order-id="${order.id}" class="status-select">
              ${['pending','confirmed','preparing','completed','cancelled'].map((state) => `
                <option value="${state}" ${state === order.status ? 'selected' : ''}>${state}</option>
              `).join('')}
            </select>
          </td>
          <td>${new Date(order.created_at).toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', async (event) => {
        const orderId = event.target.dataset.orderId;
        const status = event.target.value;
        const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
        if (error) {
          setMessage(error.message, true);
          return;
        }
        setMessage('Order status updated successfully.');
      });
    });
  };

  const loadAdminOrders = async () => {
    if (!supabase) {
      setMessage('Supabase has not been configured in the page yet.', true);
      accessDenied.classList.remove('hidden');
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setMessage('Please sign in to access the admin dashboard.', true);
      accessDenied.classList.remove('hidden');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      setMessage('This account is not authorized to view admin orders.', true);
      accessDenied.classList.remove('hidden');
      return;
    }

    setMessage('Loading customer orders…');

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message, true);
      return;
    }

    ordersTable.classList.remove('hidden');
    renderOrders(orders || []);
    setMessage('Authorized admin access granted.');
  };

  logoutBtn?.addEventListener('click', async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = './customer-login.html';
  });

  loadAdminOrders();
})();
