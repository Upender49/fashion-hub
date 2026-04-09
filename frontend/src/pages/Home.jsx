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

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const displayedProducts = filter === 'All' ? products : products.filter(p => p.category === filter);

  return (
    <div className="page active">
      <div className="hero">
        <h1 className="hero-title">Elevate Your Style.</h1>
        <p className="hero-subtitle">Discover our exclusive new collection of premium fits designed for the modern trendsetter.</p>
        <button className="btn btn-primary" style={{ marginTop: '24px' }}>Explore Collection</button>
      </div>

      <div style={{ padding: '0 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '3rem 0 1.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem' }}>New Arrivals</h2>
          <div className="filters">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`filter-btn ${filter === cat ? 'active' : ''}`} 
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>Loading fresh styles...</div>
        ) : (
          <div className="products-grid">
            {displayedProducts.map(p => (
              <div key={p._id} className="product-card">
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
          </div>
        )}
      </div>
    </div>
  );
}
