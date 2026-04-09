import React, { useState, useEffect } from 'react';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleBuyNow = async (id) => {
    await addToCart(id);
    navigate('/cart');
  };

  const handleTryOn = async (productId) => {
    try {
      await api.post('/tryon/add', { productId });
      alert('Added to Sample Try-On! 👗✨');
      navigate('/try-on');
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding to Try-On');
    }
  };

  const categories = ['All', 'Dresses', 'Ethnic', 'Sets', 'Tops'];
  const displayedProducts = filter === 'All' ? products : products.filter(p => p.category === filter);

  return (
    <div id="page-home" className="page active">
      {/* Hero */}
      <div className="hero">
        <h1>Welcome to Fashion Hub</h1>
        <p>Curated fashion for every occasion — now with <strong>Sample Try-On</strong> delivered to your door in 1–4 hours</p>
        <div className="hero-actions">
          <button className="btn btn-mustard" onClick={() => window.scrollTo({ top: document.getElementById('shop-section').offsetTop, behavior: 'smooth' })}>🛍 Shop Now</button>
          <button className="btn btn-tryon" onClick={() => navigate('/try-on')}>👗 Try Before You Buy</button>
        </div>
      </div>

      {/* Sample Try-On Banner */}
      <div className="tryon-banner">
        <h2>✨ Introducing Sample Try-On</h2>
        <p style={{ opacity: 0.9, marginBottom: 0 }}>Order a sample garment, try it on at home, then decide to buy!</p>
        <div className="tryon-features">
          <div className="tryon-feature"><span>⚡</span><span>1–4 Hour Delivery</span></div>
          <div className="tryon-feature"><span>📏</span><span>Custom Measurements</span></div>
          <div className="tryon-feature"><span>📍</span><span>Live Order Tracking</span></div>
          <div className="tryon-feature"><span>✅</span><span>Buy Only If It Fits</span></div>
        </div>
        <button className="btn btn-olive" onClick={() => navigate('/try-on')}>Browse & Try Now →</button>
      </div>

      {/* Featured Products */}
      <div className="section" id="shop-section">
        <div className="section-title">Featured Collection</div>
        <div className="section-sub">Handpicked styles just for you</div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`btn btn-outline btn-sm filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>Loading products...</div>
        ) : (
          <div className="products-grid" id="products-grid">
            {displayedProducts.map(p => (
              <div key={p._id} className="product-card" data-id={p._id}>
                <div className="product-img">{p.emoji || '👗'}</div>
                <div className="product-info">
                  <div className="product-name">{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {p.category} · {p.color}
                  </div>
                  <div className="product-price">₹{p.price.toLocaleString()}</div>
                  <div className="product-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => addToCart(p._id)}>🛒 Add</button>
                    <button className="btn btn-olive btn-sm" onClick={() => handleBuyNow(p._id)}>Buy Now</button>
                    <button className="btn btn-tryon btn-sm" onClick={() => handleTryOn(p._id)}>👗 Try</button>
                  </div>
                </div>
              </div>
            ))}
            {displayedProducts.length === 0 && <div style={{width: '100%'}}>No products found for this category.</div>}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: 'var(--charcoal)', color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: 'white', marginBottom: '8px' }}>Fashion Hub · by Isabel Mercado</div>
        <div>© 2026 Fashion Hub. All rights reserved.</div>
      </footer>
    </div>
  );
}
