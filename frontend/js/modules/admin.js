import { Toast } from '../utils/toast.js';

const API = 'http://localhost:5000';

function authHeaders() {
  return { 'Authorization': `Bearer ${localStorage.getItem('fh_token')}` };
}
function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...authHeaders() };
}

export const Admin = {
  currentSection: 'overview',

  // Navigate to admin dashboard and load data
  async init() {
    await this.loadStats();
    this.showSection(this.currentSection);
  },

  showSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));

    const el = document.getElementById(`admin-section-${section}`);
    if (el) el.style.display = 'block';
    const link = document.querySelector(`[data-section="${section}"]`);
    if (link) link.classList.add('active');

    this.currentSection = section;

    if (section === 'overview') this.loadStats();
    if (section === 'products') this.loadProducts();
    if (section === 'orders')   this.loadOrders();
    if (section === 'tryons')   this.loadTryons();
  },

  // ---- STATS ----
  async loadStats() {
    try {
      const res = await fetch(`${API}/api/admin/stats`, { headers: authHeaders() });
      if (!res.ok) return;
      const d = await res.json();
      const statsEl = document.getElementById('admin-stats');
      if (!statsEl) return;
      statsEl.innerHTML = `
        <div class="admin-stat-card">
          <div class="admin-stat-icon">💰</div>
          <div class="admin-stat-value">₹${(d.totalRevenue || 0).toLocaleString()}</div>
          <div class="admin-stat-label">Total Revenue</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon">📦</div>
          <div class="admin-stat-value">${d.totalOrders || 0}</div>
          <div class="admin-stat-label">Total Orders</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon">👤</div>
          <div class="admin-stat-value">${d.totalUsers || 0}</div>
          <div class="admin-stat-label">Registered Users</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon">👗</div>
          <div class="admin-stat-value">${d.activeTryons || 0}</div>
          <div class="admin-stat-label">Active Try-Ons</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon">🛍</div>
          <div class="admin-stat-value">${d.totalProducts || 0}</div>
          <div class="admin-stat-label">Products</div>
        </div>
      `;
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  },

  // ---- PRODUCTS ----
  async loadProducts() {
    try {
      const res = await fetch(`${API}/api/products`);
      const products = await res.json();
      const tbody = document.querySelector('#admin-products-table tbody');
      if (!tbody) return;
      tbody.innerHTML = products.map(p => `
        <tr>
          <td>
            ${p.image_url
              ? `<img src="${API}${p.image_url}" style="width:50px;height:50px;object-fit:cover;border-radius:8px">`
              : `<span style="font-size:2rem">${p.emoji || '👗'}</span>`}
          </td>
          <td><strong>${p.name}</strong></td>
          <td><span class="badge badge-orange">${p.category}</span></td>
          <td>₹${p.price.toLocaleString()}</td>
          <td>${p.stock_quantity || '—'}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="Admin.openProductModal('${p._id}')">✏ Edit</button>
            <button class="btn btn-sm" style="background:#fde8e0;color:var(--terracotta);border:none;cursor:pointer;margin-left:4px" onclick="Admin.deleteProduct('${p._id}')">✕ Delete</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">No products yet</td></tr>';
    } catch (err) {
      console.error('Error loading products:', err);
    }
  },

  openProductModal(id = null) {
    const form = document.getElementById('product-form');
    if (!form) return;
    form.reset();
    document.getElementById('product-edit-id').value = id || '';
    document.getElementById('product-modal-title').textContent = id ? 'Edit Product' : 'Add Product';
    document.getElementById('product-submit-btn').textContent = id ? 'Update Product' : 'Save Product';
    document.getElementById('prod-img-preview').innerHTML = '';

    if (id) {
      // Pre-fill form by fetching the product
      fetch(`${API}/api/products`).then(r => r.json()).then(products => {
        const p = products.find(x => x._id === id);
        if (!p) return;
        document.getElementById('prod-name').value        = p.name;
        document.getElementById('prod-category').value   = p.category;
        document.getElementById('prod-price').value      = p.price;
        document.getElementById('prod-color').value      = p.color;
        document.getElementById('prod-emoji').value      = p.emoji || '';
        document.getElementById('prod-stock').value      = p.stock_quantity || '';
        document.getElementById('prod-description').value= p.description || '';
        if (p.image_url) {
          document.getElementById('prod-img-preview').innerHTML =
            `<img src="${API}${p.image_url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px"> <span style="font-size:0.8rem;color:var(--text-muted)">Current image</span>`;
        }
      });
    }

    document.getElementById('product-modal-overlay').style.display = 'block';
    document.getElementById('product-modal').style.display = 'block';
  },

  closeProductModal() {
    document.getElementById('product-modal-overlay').style.display = 'none';
    document.getElementById('product-modal').style.display = 'none';
  },

  async submitProduct(e) {
    e.preventDefault();
    const id = document.getElementById('product-edit-id').value;
    const formData = new FormData();
    formData.append('name',          document.getElementById('prod-name').value);
    formData.append('category',      document.getElementById('prod-category').value);
    formData.append('price',         document.getElementById('prod-price').value);
    formData.append('color',         document.getElementById('prod-color').value);
    formData.append('emoji',         document.getElementById('prod-emoji').value);
    formData.append('stock_quantity',document.getElementById('prod-stock').value || 10);
    formData.append('description',   document.getElementById('prod-description').value);
    const imageFile = document.getElementById('prod-image').files[0];
    if (imageFile) formData.append('image', imageFile);

    const url    = id ? `${API}/api/products/${id}` : `${API}/api/products`;
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: authHeaders(), body: formData });
      const data = await res.json();
      if (res.ok) {
        Toast.show(id ? 'Product updated! ✅' : 'Product added! ✅', 'success');
        this.closeProductModal();
        this.loadProducts();
      } else {
        Toast.show(data.message || 'Error saving product', 'info');
      }
    } catch {
      Toast.show('Failed to save product', 'info');
    }
  },

  async deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${API}/api/products/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) { Toast.show('Product deleted', 'success'); this.loadProducts(); }
      else Toast.show('Error deleting product', 'info');
    } catch {
      Toast.show('Failed to delete product', 'info');
    }
  },

  // ---- ORDERS ----
  async loadOrders() {
    try {
      const res = await fetch(`${API}/api/admin/orders`, { headers: authHeaders() });
      const orders = await res.json();
      const tbody = document.querySelector('#admin-orders-table tbody');
      if (!tbody) return;
      tbody.innerHTML = orders.map(o => `
        <tr>
          <td><code style="font-size:0.75rem">${o._id.slice(-8)}...</code></td>
          <td>${o.user_id?.name || 'Unknown'}<br><span style="font-size:0.8rem;color:var(--text-muted)">${o.user_id?.email || ''}</span></td>
          <td>₹${o.total_amount?.toLocaleString()}</td>
          <td><span class="badge ${o.status === 'delivered' ? 'badge-green' : 'badge-orange'}">${o.status}</span></td>
          <td style="font-size:0.8rem">${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
          <td>
            <select class="form-control" style="padding:4px 8px;font-size:0.8rem" onchange="Admin.updateOrderStatus('${o._id}', this.value)">
              <option ${o.status==='pending'?'selected':''}>pending</option>
              <option ${o.status==='shipped'?'selected':''}>shipped</option>
              <option ${o.status==='delivered'?'selected':''}>delivered</option>
            </select>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">No orders yet</td></tr>';
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  },

  async updateOrderStatus(id, status) {
    try {
      const res = await fetch(`${API}/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: jsonHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) Toast.show('Order status updated ✅', 'success');
    } catch { Toast.show('Failed to update order', 'info'); }
  },

  async loadTryons() {
    try {
      const res = await fetch(`${API}/api/admin/tryon`, { headers: authHeaders() });
      const items = await res.json();
      const tbody = document.querySelector('#admin-tryon-table tbody');
      if (!tbody) return;
      tbody.innerHTML = items.map(i => `
        <tr>
          <td>${i.user_id?.name || 'Unknown'}<br><span style="font-size:0.8rem;color:var(--text-muted)">${i.user_id?.email || ''}</span></td>
          <td>${i.product_id?.name || 'N/A'}</td>
          <td><span class="badge ${i.status==='delivered'?'badge-green':'badge-orange'}">${i.status}</span></td>
          <td>${i.feedback ? `<span class="badge badge-green">${i.feedback}</span>` : '—'}</td>
          <td style="font-size:0.8rem">${new Date(i.createdAt).toLocaleDateString('en-IN')}</td>
        </tr>
      `).join('') || '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted)">No try-on requests</td></tr>';
    } catch (err) {
      console.error('Error loading try-ons:', err);
    }
  },

  previewImage(input) {
    const preview = document.getElementById('prod-img-preview');
    if (!preview) return;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        preview.innerHTML = `<img src="${e.target.result}" style="width:80px;height:80px;object-fit:cover;border-radius:8px">`;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }
};
