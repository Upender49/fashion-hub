import { state } from '../state.js';
import { Toast } from '../utils/toast.js';
import { Auth } from './auth.js';
import { navigate } from '../main.js';

export const Cart = {
  // Helper to attach the JWT token to our requests
  getHeaders() {
    const token = localStorage.getItem('fh_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Show our security badge!
    };
  },

  // Fetch the cart from the database
  async fetchCart() {
    if (!state.currentUser) {
      state.cart = [];
      this.updateCartBadge();
      this.renderCart();
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: this.getHeaders()
      });
      if (response.ok) {
        state.cart = await response.json();
        this.updateCartBadge();
        this.renderCart();
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  },

  async addToCart(id) {
    if (!Auth.requireAuth('add items to cart')) return;
    try {
      const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ productId: id })
      });

      const data = await response.json();

      if (response.ok) {
        await this.fetchCart(); // Refresh the cart to get the latest data
        Toast.show('Item added to cart! 🛒', 'success');
      } else {
        Toast.show(data.message || 'Failed to add item', 'info');
      }
    } catch (error) {
      Toast.show('Network error while adding item', 'info');
    }
  },

  async buyNow(id) {
    if (!Auth.requireAuth('purchase items')) return;
    await this.addToCart(id);
    navigate('cart');
  },

  async removeFromCart(cartItemId) {
    try {
      const response = await fetch(`http://localhost:5000/api/cart/remove/${cartItemId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      if (response.ok) {
        await this.fetchCart(); // Refresh the cart
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  },

  async updateQty(cartItemId, delta) {
    try {
      const response = await fetch(`http://localhost:5000/api/cart/update/${cartItemId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ delta })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await this.fetchCart(); // Refresh the cart
      } else {
        Toast.show(data.message || 'Failed to update quantity', 'info');
      }
    } catch (error) {
      Toast.show('Network error updating quantity', 'info');
      console.error("Error updating quantity:", error);
    }
  },

  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const total = state.cart.reduce((s, i) => s + i.qty, 0);
    if (badge) { badge.textContent = total; badge.style.display = total ? 'flex' : 'none'; }
  },

  renderCart() {
    const container = document.getElementById('cart-items');
    const summary   = document.getElementById('cart-summary');
    if (!container) return;

    if (state.cart.length === 0) {
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

    container.innerHTML = state.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          ${item.image_url ? `<img src="${item.image_url.startsWith('http') ? item.image_url : 'http://localhost:5000' + item.image_url}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" alt="${item.name}">` : item.emoji}
        </div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
        </div>
        <div class="qty-control">
          <!-- Note: We now pass cartItemId instead of the product id -->
          <button class="qty-btn" onclick="App.updateQty('${item.cartItemId}', -1)">−</button>
          <span style="font-weight:600;width:24px;text-align:center">${item.qty}</span>
          <button class="qty-btn" onclick="App.updateQty('${item.cartItemId}', 1)">+</button>
        </div>
        <div style="font-weight:700;min-width:80px;text-align:right;color:var(--olive)">
          ₹${(item.price * item.qty).toLocaleString()}
        </div>
        <button onclick="App.removeFromCart('${item.cartItemId}')" style="background:none;border:none;cursor:pointer;color:var(--terracotta);font-size:1.1rem;padding:4px;">✕</button>
      </div>
    `).join('');

    const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = subtotal > 2000 ? 0 : 99;
    const total    = subtotal + shipping;

    if (summary) summary.innerHTML = `
      <h3 style="margin-bottom:1rem;">Order Summary</h3>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Subtotal</span><span>₹${subtotal.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : '₹' + shipping}</span></div>
      <hr class="divider">
      <div style="display:flex;justify-content:space-between;font-size:1.2rem;font-weight:700;margin-bottom:1.5rem"><span>Total</span><span style="color:var(--olive)">₹${total.toLocaleString()}</span></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="App.checkout()">Proceed to Checkout →</button>
    `;
  },

  checkout() {
    if (state.cart.length === 0) return;

    // Show a simple address prompt
    const address = prompt('📦 Enter your shipping address to complete the order:');
    if (!address || !address.trim()) return Toast.show('Shipping address is required', 'info');

    fetch('http://localhost:5000/api/orders/checkout', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ shippingAddress: address.trim() })
    })
    .then(res => res.json())
    .then(async data => {
      if (data.orderId) {
        Toast.show('Order placed successfully! 🎉 Thank you for shopping!', 'success');
        state.cart = [];
        this.updateCartBadge();
        this.renderCart();
        setTimeout(() => navigate('home'), 1500);
      } else {
        Toast.show(data.message || 'Checkout failed', 'info');
      }
    })
    .catch(() => Toast.show('Checkout failed. Please try again.', 'info'));
  }
};