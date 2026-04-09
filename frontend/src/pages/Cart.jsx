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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal > 2000 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <div id="page-cart" className="page active">
      <div className="cart-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>🛒 Shopping Cart</div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/#shop')}>← Continue Shopping</button>
        </div>

        {cart.length === 0 ? (
          <div id="cart-items">
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add some beautiful items to get started!</p>
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/#shop')}>Browse Products</button>
            </div>
          </div>
        ) : (
          <>
            <div id="cart-items">
              {cart.map(item => (
                <div key={item.cartItemId} className="cart-item">
                  <div className="cart-item-img">{item.emoji || '👗'}</div>
                  <div className="cart-item-details">
                    <div className="cart-item-name">{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.color}</div>
                    <div className="cart-item-price">₹{item.price.toLocaleString()}</div>
                  </div>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQuantity(item.cartItemId, -1)}>−</button>
                    <span style={{ fontWeight: 600, width: '24px', textAlign: 'center' }}>{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.cartItemId, 1)}>+</button>
                  </div>
                  <div style={{ fontWeight: 700, minWidth: '80px', textAlign: 'right', color: 'var(--olive)' }}>
                    ₹{(item.price * item.qty).toLocaleString()}
                  </div>
                  <button onClick={() => removeFromCart(item.cartItemId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--terracotta)', fontSize: '1.1rem', padding: '4px' }}>✕</button>
                </div>
              ))}
            </div>

            <div id="cart-summary">
              <h3 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '1rem' }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Shipping</span><span>{shipping === 0 ? <span style={{ color: 'var(--olive)' }}>FREE</span> : `₹${shipping}`}</span>
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                <span>Total</span><span style={{ color: 'var(--olive)' }}>₹{total.toLocaleString()}</span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <textarea 
                  className="form-control" 
                  style={{ width: '100%', minHeight: '60px' }} 
                  placeholder="Enter Shipping Address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                ></textarea>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCheckout}>Proceed to Checkout →</button>
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} onClick={() => navigate('/#shop')}>Continue Shopping</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
