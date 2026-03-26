import { state } from '../state.js';
import { Toast } from '../utils/toast.js';

export const Products = {
  async fetchProducts() {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      state.products = data.map(p => ({ ...p, id: p._id }));
    } catch (error) {
      console.error("Error loading products:", error);
      Toast.show("Failed to load products.", "info");
    }
  },

  _buildCards(list) {
    return list.map(p => `
      <div class="product-card" data-id="${p.id}">
        <div class="product-img">
          ${p.image_url ? `<img src="${p.image_url.startsWith('http') ? p.image_url : 'http://localhost:5000' + p.image_url}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius) var(--radius) 0 0;" alt="${p.name}">` : p.emoji}
        </div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px;">${p.category} · ${p.color}</div>
          <div class="product-price">₹${p.price.toLocaleString()}</div>
          <div class="product-actions">
            <button class="btn btn-primary btn-sm" onclick="App.addToCart('${p.id}')">🛒 Add</button>
            <button class="btn btn-olive btn-sm" onclick="App.buyNow('${p.id}')">Buy Now</button>
            <button class="btn btn-tryon btn-sm" onclick="App.addToTryon('${p.id}')">👗 Try</button>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderProducts(filter = 'All') {
    const list = filter === 'All' ? state.products : state.products.filter(p => p.category === filter);
    const html = this._buildCards(list);
    const homeGrid = document.getElementById('products-grid');
    const shopGrid = document.getElementById('products-grid-shop');
    if (homeGrid) homeGrid.innerHTML = html;
    if (shopGrid) shopGrid.innerHTML = html;
  },

  filterProducts(event, cat) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    this.renderProducts(cat);
  }
};