// ============================================================
//  Fashion Hub — Main App Logic
// ============================================================

const App = {
  currentUser: null,
  cart: [],
  tryonItems: [],
  users: [],

  // ---- Init ----
  init() {
    // Load from localStorage
    this.users     = JSON.parse(localStorage.getItem('fh_users') || '[]');
    this.cart      = JSON.parse(localStorage.getItem('fh_cart')  || '[]');
    this.tryonItems= JSON.parse(localStorage.getItem('fh_tryon') || '[]');
    const saved    = localStorage.getItem('fh_user');
    if (saved) this.currentUser = JSON.parse(saved);

    this.updateCartBadge();
    this.renderProducts();
    this.renderCart();
    this.renderTryon();
    this.updateNavUser();

    // Route based on hash
    const hash = location.hash.replace('#','') || 'home';
    this.navigate(hash);
  },

  // ---- Navigation ----
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    location.hash = page;
    window.scrollTo(0,0);
  },

  // ---- Auth ----
  signup(e) {
    e.preventDefault();
    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm  = document.getElementById('signup-confirm').value;

    if (!name || !email || !password) return Toast.show('Please fill all fields', 'info');
    if (password !== confirm) return Toast.show('Passwords do not match', 'info');
    if (this.users.find(u => u.email === email)) return Toast.show('Email already registered', 'info');

    const user = { id: Date.now(), name, email, password };
    this.users.push(user);
    localStorage.setItem('fh_users', JSON.stringify(this.users));

    this.currentUser = user;
    localStorage.setItem('fh_user', JSON.stringify(user));
    this.updateNavUser();
    Toast.show('Welcome to Fashion Hub, ' + name + '! 🎉', 'success');
    this.navigate('home');
  },

  login(e) {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const user = this.users.find(u => u.email === email && u.password === password);
    if (!user) return Toast.show('Invalid email or password', 'info');

    this.currentUser = user;
    localStorage.setItem('fh_user', JSON.stringify(user));
    this.updateNavUser();
    Toast.show('Welcome back, ' + user.name + '! 👗', 'success');
    this.navigate('home');
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('fh_user');
    this.updateNavUser();
    Toast.show('Logged out successfully', 'info');
    this.navigate('home');
  },

  updateNavUser() {
    const authBtns = document.getElementById('nav-auth');
    const userMenu = document.getElementById('nav-user');
    if (this.currentUser) {
      authBtns.style.display = 'none';
      userMenu.style.display = 'flex';
      document.getElementById('nav-username').textContent = this.currentUser.name.split(' ')[0];
    } else {
      authBtns.style.display = 'flex';
      userMenu.style.display = 'none';
    }
  },

  requireAuth(action) {
    if (!this.currentUser) {
      Toast.show('Please login to ' + action, 'info');
      setTimeout(() => this.navigate('login'), 800);
      return false;
    }
    return true;
  },

  // ---- Products ----
  products: [],
  
  async fetchProducts() {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      
      // Because MongoDB uses _id instead of id, we map it to match your frontend logic
      this.products = data.map(p => ({
        ...p,
        id: p._id // Map MongoDB's unique _id to your frontend's expected 'id'
      }));
    } catch (error) {
      console.error("Error loading products from database:", error);
      Toast.show("Failed to load products. Check your connection.", "info");
    }
  },

  renderProducts(filter = 'All') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    const list = filter === 'All' ? this.products : this.products.filter(p => p.category === filter);
    grid.innerHTML = list.map(p => `
      <div class="product-card" data-id="${p.id}">
        <div class="product-img">${p.emoji}</div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px;">${p.category} · ${p.color}</div>
          <div class="product-price">₹${p.price.toLocaleString()}</div>
          <div class="product-actions">
            <button class="btn btn-primary btn-sm" onclick="App.addToCart(${p.id})">🛒 Add</button>
            <button class="btn btn-olive btn-sm" onclick="App.buyNow(${p.id})">Buy Now</button>
            <button class="btn btn-tryon btn-sm" onclick="App.addToTryon(${p.id})">👗 Try</button>
          </div>
        </div>
      </div>
    `).join('');
  },

  filterProducts(cat) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    this.renderProducts(cat);
  },

  // ---- Cart ----
  addToCart(id) {
    if (!this.requireAuth('add items to cart')) return;
    const product = this.products.find(p => p.id === id);
    const existing = this.cart.find(i => i.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cart.push({ ...product, qty: 1 });
    }
    this.saveCart();
    Toast.show(product.name + ' added to cart! 🛒', 'success');
  },

  buyNow(id) {
    if (!this.requireAuth('purchase items')) return;
    this.addToCart(id);
    this.renderCart();
    this.navigate('cart');
  },

  removeFromCart(id) {
    this.cart = this.cart.filter(i => i.id !== id);
    this.saveCart();
    this.renderCart();
  },

  updateQty(id, delta) {
    const item = this.cart.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    this.saveCart();
    this.renderCart();
  },

  saveCart() {
    localStorage.setItem('fh_cart', JSON.stringify(this.cart));
    this.updateCartBadge();
    this.renderCart();
  },

  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const total = this.cart.reduce((s,i) => s + i.qty, 0);
    if (badge) { badge.textContent = total; badge.style.display = total ? 'flex' : 'none'; }
  },

  renderCart() {
    const container = document.getElementById('cart-items');
    const summary   = document.getElementById('cart-summary');
    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some beautiful items to get started!</p>
          <button class="btn btn-primary" style="margin-top:1.5rem" onclick="App.navigate('shop')">Browse Products</button>
        </div>`;
      if (summary) summary.innerHTML = '';
      return;
    }

    container.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">${item.emoji}</div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${item.color}</div>
          <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
        </div>
        <div class="qty-control">
          <button class="qty-btn" onclick="App.updateQty(${item.id},-1)">−</button>
          <span style="font-weight:600;width:24px;text-align:center">${item.qty}</span>
          <button class="qty-btn" onclick="App.updateQty(${item.id},1)">+</button>
        </div>
        <div style="font-weight:700;min-width:80px;text-align:right;color:var(--olive)">
          ₹${(item.price * item.qty).toLocaleString()}
        </div>
        <button onclick="App.removeFromCart(${item.id})" style="background:none;border:none;cursor:pointer;color:var(--terracotta);font-size:1.1rem;padding:4px;">✕</button>
      </div>
    `).join('');

    const subtotal = this.cart.reduce((s,i) => s + i.price * i.qty, 0);
    const shipping = subtotal > 2000 ? 0 : 99;
    const total    = subtotal + shipping;

    if (summary) summary.innerHTML = `
      <h3 style="font-family:'Playfair Display',serif;margin-bottom:1rem;">Order Summary</h3>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Subtotal</span><span>₹${subtotal.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:var(--olive)">FREE</span>' : '₹' + shipping}</span></div>
      <hr class="divider">
      <div style="display:flex;justify-content:space-between;font-size:1.2rem;font-weight:700;margin-bottom:1.5rem"><span>Total</span><span style="color:var(--olive)">₹${total.toLocaleString()}</span></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="App.checkout()">Proceed to Checkout →</button>
      <button class="btn btn-outline" style="width:100%;justify-content:center;margin-top:8px" onclick="App.navigate('shop')">Continue Shopping</button>
    `;
  },

  checkout() {
    if (this.cart.length === 0) return;
    Toast.show('Order placed successfully! 🎉 Thank you for shopping with Fashion Hub!', 'success');
    this.cart = [];
    this.saveCart();
    this.renderCart();
    setTimeout(() => this.navigate('home'), 1500);
  },

  // ---- Sample Try-On ----
  addToTryon(id) {
    if (!this.requireAuth('use Sample Try-On')) return;
    const product = this.products.find(p => p.id === id);
    const existing = this.tryonItems.find(i => i.id === id);
    if (existing) return Toast.show(product.name + ' is already in your Try-On list', 'info');

    this.tryonItems.push({
      ...product,
      tryonId: 'TRY' + Date.now(),
      status: 'pending',
      measurements: null,
      orderedAt: null,
      estimatedDelivery: null,
      feedback: null,
    });
    localStorage.setItem('fh_tryon', JSON.stringify(this.tryonItems));
    this.renderTryon();
    Toast.show(product.name + ' added to Sample Try-On! 👗✨', 'tryon');
  },

  renderTryon() {
    const container = document.getElementById('tryon-items');
    if (!container) return;

    if (this.tryonItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👗</div>
          <h3>No try-on items yet</h3>
          <p>Hit the "Try" button on any product to add it here</p>
          <button class="btn btn-tryon" style="margin-top:1.5rem" onclick="App.navigate('shop')">Browse Products</button>
        </div>`;
      return;
    }

    container.innerHTML = this.tryonItems.map(item => `
      <div class="tryon-order-card" id="tryon-${item.tryonId}">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;flex-wrap:wrap">
          <div style="font-size:2.5rem">${item.emoji}</div>
          <div style="flex:1">
            <div style="font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:600">${item.name}</div>
            <div style="font-size:0.85rem;color:var(--text-muted)">${item.color} · ID: ${item.tryonId}</div>
          </div>
          <div>${this.getTryonStatusBadge(item.status)}</div>
        </div>

        ${item.status === 'pending' ? `
          <div style="background:var(--cream);border-radius:10px;padding:1.25rem">
            <div style="font-weight:600;margin-bottom:1rem;font-size:0.95rem">📏 Enter Measurements & Delivery Details</div>
            <div class="form-row">
              <div class="form-group">
                <label>Chest (inches)</label>
                <input class="form-control" type="number" id="chest-${item.tryonId}" placeholder="e.g. 36">
              </div>
              <div class="form-group">
                <label>Waist (inches)</label>
                <input class="form-control" type="number" id="waist-${item.tryonId}" placeholder="e.g. 30">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Hip (inches)</label>
                <input class="form-control" type="number" id="hip-${item.tryonId}" placeholder="e.g. 38">
              </div>
              <div class="form-group">
                <label>Preferred Color</label>
                <input class="form-control" type="text" id="color-${item.tryonId}" placeholder="${item.color}" value="${item.color}">
              </div>
            </div>
            <div class="form-group">
              <label>Delivery Address</label>
              <textarea class="form-control" id="address-${item.tryonId}" placeholder="Enter your full address..."></textarea>
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input class="form-control" type="tel" id="phone-${item.tryonId}" placeholder="+91 9876543210">
            </div>
            <div style="display:flex;gap:8px;margin-top:0.5rem;flex-wrap:wrap">
              <button class="btn btn-tryon" onclick="App.placeTryonOrder('${item.tryonId}')">🚀 Place Try-On Order (1-4 hrs delivery)</button>
              <button class="btn btn-outline btn-sm" onclick="App.removeTryon('${item.tryonId}')">Remove</button>
            </div>
          </div>
        ` : ''}

        ${item.status === 'ordered' || item.status === 'delivered' ? `
          <div style="margin-bottom:1rem">
            <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.75rem">
              📦 Ordered: ${item.orderedAt} &nbsp;|&nbsp; ⏱ Est. Delivery: ${item.estimatedDelivery}
            </div>
            <div class="tracking-timeline">
              ${this.getTrackingEvents(item).map(ev => `
                <div class="tracking-event ${ev.status}">
                  <div class="tracking-dot"></div>
                  <div class="tracking-time">${ev.time}</div>
                  <div class="tracking-label">${ev.label}</div>
                  <div class="tracking-desc">${ev.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ${item.status === 'delivered' && !item.feedback ? `
            <div style="background:var(--cream);border-radius:10px;padding:1.25rem;margin-top:1rem">
              <div style="font-weight:600;margin-bottom:1rem">👗 How does it fit? Give your feedback</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn-olive btn-sm" onclick="App.tryonFeedback('${item.tryonId}','perfect')">✅ Perfect Fit — Buy Now!</button>
                <button class="btn btn-mustard btn-sm" onclick="App.tryonFeedback('${item.tryonId}','alterations')">✂️ Needs Alterations</button>
                <button class="btn btn-outline btn-sm" onclick="App.tryonFeedback('${item.tryonId}','return')">↩ Return Sample</button>
              </div>
            </div>
          ` : ''}
          ${item.feedback ? `
            <div style="margin-top:1rem;padding:1rem;background:var(--cream);border-radius:10px">
              <strong>Your feedback:</strong> ${item.feedback === 'perfect' ? '✅ Loved it! Proceeding to buy.' : item.feedback === 'alterations' ? '✂️ Requested alterations.' : '↩ Sample returned.'}
              ${item.feedback === 'perfect' ? `<button class="btn btn-primary btn-sm" style="margin-left:1rem" onclick="App.addToCart(${item.id});App.navigate('cart')">🛒 Add to Cart</button>` : ''}
            </div>
          ` : ''}
        ` : ''}
      </div>
    `).join('');
  },

  getTryonStatusBadge(status) {
    const map = { pending: ['badge-orange','⏳ Pending'], ordered: ['badge-orange','🚚 On the Way'], delivered: ['badge-green','✅ Delivered'], };
    const [cls, label] = map[status] || ['badge-orange','Unknown'];
    return `<span class="badge ${cls}">${label}</span>`;
  },

  getTrackingEvents(item) {
    const base = [
      { status:'done', time: item.orderedAt, label:'Order Placed', desc:'Your sample try-on order has been confirmed.' },
      { status:'done', time: this.addMins(item.orderedAt, 15), label:'Preparation Started', desc:'Our team is preparing your sample garment.' },
      { status: item.status === 'delivered' ? 'done' : 'active', time: this.addMins(item.orderedAt, 45), label:'Out for Delivery', desc:'Delivery partner is on the way to your address.' },
    ];
    if (item.status === 'delivered') {
      base.push({ status:'done', time: item.estimatedDelivery, label:'Delivered', desc:'Sample delivered! Please try it on and share feedback.' });
    }
    return base;
  },

  addMins(timeStr, mins) {
    if (!timeStr) return '';
    const [time, period] = timeStr.split(' ');
    const [h, m] = time.split(':').map(Number);
    const date = new Date(); date.setHours(period==='PM' ? h+12 : h, m + mins);
    return date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  },

  placeTryonOrder(tryonId) {
    const item = this.tryonItems.find(i => i.tryonId === tryonId);
    if (!item) return;

    const chest   = document.getElementById('chest-'+tryonId)?.value;
    const waist   = document.getElementById('waist-'+tryonId)?.value;
    const hip     = document.getElementById('hip-'+tryonId)?.value;
    const color   = document.getElementById('color-'+tryonId)?.value;
    const address = document.getElementById('address-'+tryonId)?.value;
    const phone   = document.getElementById('phone-'+tryonId)?.value;

    if (!chest || !waist || !address || !phone) return Toast.show('Please fill in all required details', 'info');

    const now = new Date();
    const est = new Date(now.getTime() + (1 + Math.random() * 3) * 60 * 60 * 1000);

    item.measurements = { chest, waist, hip, color };
    item.address = address; item.phone = phone;
    item.status = 'ordered';
    item.orderedAt = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    item.estimatedDelivery = est.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

    localStorage.setItem('fh_tryon', JSON.stringify(this.tryonItems));
    this.renderTryon();
    Toast.show('🚀 Try-On order placed! Expected delivery by ' + item.estimatedDelivery, 'tryon');

    // Simulate delivery after 8 seconds (demo)
    setTimeout(() => {
      item.status = 'delivered';
      localStorage.setItem('fh_tryon', JSON.stringify(this.tryonItems));
      this.renderTryon();
      Toast.show('📦 Your sample for "' + item.name + '" has been delivered!', 'success');
    }, 8000);
  },

  tryonFeedback(tryonId, type) {
    const item = this.tryonItems.find(i => i.tryonId === tryonId);
    if (!item) return;
    item.feedback = type;
    localStorage.setItem('fh_tryon', JSON.stringify(this.tryonItems));
    this.renderTryon();
    const msgs = { perfect: '🎉 Great! Adding to cart for purchase.', alterations: '✂️ Noted! We will contact you for alterations.', return: '↩ Return initiated. Thank you!' };
    Toast.show(msgs[type], 'success');
  },

  removeTryon(tryonId) {
    this.tryonItems = this.tryonItems.filter(i => i.tryonId !== tryonId);
    localStorage.setItem('fh_tryon', JSON.stringify(this.tryonItems));
    this.renderTryon();
  },
};

// ---- Toast ----
const Toast = {
  show(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) { container = document.createElement('div'); container.id = 'toast-container'; container.className = 'toast-container'; document.body.appendChild(container); }
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icons = { success:'✅', tryon:'👗', info:'ℹ️' };
    toast.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }
};

// ---- Event Bindings ----
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  document.getElementById('signup-form')?.addEventListener('submit', e => App.signup(e));
  document.getElementById('login-form')?.addEventListener('submit',  e => App.login(e));
});

window.App   = App;
window.Toast = Toast;
