import { state, API_URL } from '../state.js';
import { Toast } from '../utils/toast.js';
import { Auth } from './auth.js';
import { navigate } from '../main.js';

const API = API_URL;

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('fh_token')}`
  };
}

export const TryOn = {

  async fetchTryon() {
    if (!state.currentUser) {
      state.tryonItems = [];
      this.renderTryon();
      return;
    }
    try {
      const res = await fetch(`${API}/api/tryon`, { headers: getHeaders() });
      if (res.ok) {
        state.tryonItems = await res.json();
        this.renderTryon();
      }
    } catch (err) {
      console.error('Error loading try-on list:', err);
    }
  },

  async addToTryon(id) {
    if (!Auth.requireAuth('use Sample Try-On')) return;
    try {
      const res = await fetch(`${API}/api/tryon/add`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId: id })
      });
      const data = await res.json();
      if (!res.ok) return Toast.show(data.message, 'info');
      Toast.show('Added to Sample Try-On! 👗✨', 'tryon');
      await this.fetchTryon();
    } catch (err) {
      Toast.show('Failed to add to try-on list', 'info');
    }
  },

  async placeTryonOrder(tryonId) {
    const chest   = document.getElementById('chest-' + tryonId)?.value;
    const waist   = document.getElementById('waist-' + tryonId)?.value;
    const hip     = document.getElementById('hip-' + tryonId)?.value;
    const color   = document.getElementById('color-' + tryonId)?.value;
    const address = document.getElementById('address-' + tryonId)?.value;
    const phone   = document.getElementById('phone-' + tryonId)?.value;

    if (!chest || !waist || !address || !phone) {
      return Toast.show('Please fill in all required details', 'info');
    }

    try {
      const res = await fetch(`${API}/api/tryon/order/${tryonId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ chest, waist, hip, color, address, phone })
      });
      const data = await res.json();
      if (!res.ok) return Toast.show(data.message, 'info');

      const est = new Date(data.estimatedDelivery);
      const estStr = est.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      Toast.show('🚀 Try-On order placed! Expected delivery by ' + estStr, 'tryon');
      await this.fetchTryon();

      // Demo: simulate delivery after 8 seconds
      setTimeout(async () => {
        await fetch(`${API}/api/tryon/feedback/${tryonId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ feedback: null, status: 'delivered' })
        });
        // Force status to delivered in local state for immediate UI update
        const item = state.tryonItems.find(i => i.tryonId === tryonId);
        if (item) item.status = 'delivered';
        await this.fetchTryon();
        Toast.show('📦 Your sample has been delivered!', 'success');
      }, 8000);

    } catch (err) {
      Toast.show('Failed to place order. Try again.', 'info');
    }
  },

  async tryonFeedback(tryonId, type) {
    try {
      const res = await fetch(`${API}/api/tryon/feedback/${tryonId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ feedback: type })
      });
      if (!res.ok) return Toast.show('Failed to submit feedback', 'info');
      const msgs = {
        perfect: '🎉 Great! Adding to cart for purchase.',
        alterations: '✂️ Noted! We will contact you for alterations.',
        return: '↩ Return initiated. Thank you!'
      };
      Toast.show(msgs[type], 'success');
      await this.fetchTryon();
    } catch (err) {
      Toast.show('Failed to submit feedback', 'info');
    }
  },

  async removeTryon(tryonId) {
    try {
      await fetch(`${API}/api/tryon/remove/${tryonId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      await this.fetchTryon();
    } catch (err) {
      console.error('Error removing try-on item:', err);
    }
  },

  // ---- Render ----
  renderTryon() {
    const container = document.getElementById('tryon-items');
    if (!container) return;

    if (state.tryonItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👗</div>
          <h3>No try-on items yet</h3>
          <p>Hit the "Try" button on any product to add it here</p>
          <button class="btn btn-tryon" style="margin-top:1.5rem" onclick="App.navigate('shop')">Browse Products</button>
        </div>`;
      return;
    }

    container.innerHTML = state.tryonItems.map(item => `
      <div class="tryon-order-card" id="tryon-${item.tryonId}">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;flex-wrap:wrap">
          <div style="font-size:2.5rem;width:80px;height:80px;display:flex;justify-content:center;align-items:center;background:#f3f3f3;border-radius:12px;overflow:hidden;">
            ${item.image_url ? `<img src="${item.image_url.startsWith('http') ? item.image_url : API_URL + item.image_url}" style="width:100%;height:100%;object-fit:cover;">` : item.emoji}
          </div>
          <div style="flex:1">
            <div style="font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:600">${item.name}</div>
            <div style="font-size:0.85rem;color:var(--text-muted)">${item.color}</div>
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
                <input class="form-control" type="text" id="color-${item.tryonId}" value="${item.color}">
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

        ${item.status === 'ordered' ? `
          <div style="background:var(--cream);border-radius:10px;padding:1rem;text-align:center">
            <div style="font-size:1.5rem;margin-bottom:8px">🚚</div>
            <div style="font-weight:600">Your sample is on the way!</div>
            <div style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">Estimated delivery: ${item.estimatedDelivery ? new Date(item.estimatedDelivery).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'soon'}</div>
          </div>
          <div style="margin-top:1rem;text-align:right">
            <button class="btn btn-outline btn-sm" onclick="App.removeTryon('${item.tryonId}')">Cancel</button>
          </div>
        ` : ''}

        ${item.status === 'delivered' && !item.feedback ? `
          <div style="background:var(--cream);border-radius:10px;padding:1.25rem">
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
            ${item.feedback === 'perfect' ? `<button class="btn btn-primary btn-sm" style="margin-left:1rem" onclick="App.addToCart('${item.id}');App.navigate('cart')">🛒 Add to Cart</button>` : ''}
          </div>
        ` : ''}
      </div>
    `).join('');
  },

  getTryonStatusBadge(status) {
    const map = {
      pending:   ['badge-orange', '⏳ Pending'],
      ordered:   ['badge-orange', '🚚 On the Way'],
      delivered: ['badge-green',  '✅ Delivered']
    };
    const [cls, label] = map[status] || ['badge-orange', 'Unknown'];
    return `<span class="badge ${cls}">${label}</span>`;
  }
};