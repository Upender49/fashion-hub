import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, checkout, loading } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Cart...</div>;

  const handleCheckout = async () => {
    if (!address) return alert('Please enter a shipping address');
    try {
      await checkout(address);
      alert('Order placed successfully! 🎉 Thank you for shopping with Fashion Hub!');
      navigate('/');
    } catch (err) {
      alert('Checkout failed: ' + err.message);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="page active" style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some beautiful items to get started!</p>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/')}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal > 2000 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <div className="page active" style={{ padding: '2rem 0' }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '2rem', fontSize: '2rem' }}>Your Bag</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.map(item => (
            <div key={item.cartItemId} className="cart-item" style={{ background: '#fff', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '3rem', background: '#f5f2ed', padding: '12px', borderRadius: '10px' }}>{item.emoji || '👗'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{item.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.color}</div>
                <div style={{ fontWeight: 600, color: 'var(--olive)', marginTop: '4px' }}>₹{item.price.toLocaleString()}</div>
              </div>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => updateQuantity(item.cartItemId, -1)}>−</button>
                <span style={{ fontWeight: 600, width: '24px', textAlign: 'center' }}>{item.qty}</span>
                <button className="qty-btn" onClick={() => updateQuantity(item.cartItemId, 1)}>+</button>
              </div>
              <div style={{ fontWeight: 700, minWidth: '80px', textAlign: 'right', color: 'var(--olive)' }}>
                ₹{(item.price * item.qty).toLocaleString()}
              </div>
              <button 
                onClick={() => removeFromCart(item.cartItemId)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--terracotta)', fontSize: '1.2rem', padding: '8px' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '1.5rem', fontSize: '1.5rem' }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span>Shipping</span>
            <span>{shipping === 0 ? <span style={{ color: 'var(--olive)', fontWeight: 'bold' }}>FREE</span> : `₹${shipping}`}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '2px solid var(--cream)', margin: '1rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 700, marginBottom: '2rem' }}>
            <span>Total</span>
            <span style={{ color: 'var(--olive)' }}>₹{total.toLocaleString()}</span>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Shipping Address</label>
            <textarea 
              className="form-control" 
              style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
              placeholder="Enter your full delivery address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            ></textarea>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem' }} onClick={handleCheckout}>
            Place Order →
          </button>
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '1rem' }} onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
