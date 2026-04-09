import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';

import Home from './pages/Home';
import Cart from './pages/Cart';
import TryOn from './pages/TryOn';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './index.css';

function App() {
  const { currentUser, logout, loading } = useAuth();
  const { cartTotalQty } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  if (loading) return <div>Loading Fashion Hub...</div>;

  return (
    <>
      <nav>
        <Link className="nav-logo" to="/" onClick={closeMenu}>
          <img src="/assets/logo.png" alt="Fashion Hub Logo" />
          <span className="nav-brand">Fashion<span>Hub</span></span>
        </Link>

        <ul className="nav-links">
          <li><Link to="/" onClick={closeMenu}>Home</Link></li>
          <li><Link to="/#shop" onClick={closeMenu}>Shop</Link></li>
          <li><Link to="/try-on" onClick={closeMenu}>Try-On</Link></li>
          <li><Link to="/cart" onClick={closeMenu}>Cart</Link></li>
        </ul>

        <button className="hamburger" id="hamburger-btn" onClick={toggleMenu} aria-label="Menu">☰</button>

        <div className="nav-actions">
          <button className="nav-icon-btn" onClick={() => { navigate('/cart'); closeMenu(); }} title="Cart">
            🛒
            <span className="cart-badge" id="cart-badge" style={{ display: cartTotalQty > 0 ? 'flex' : 'none' }}>
              {cartTotalQty}
            </span>
          </button>

          {!currentUser ? (
            <div id="nav-auth" style={{ display: 'flex', gap: '8px' }}>
              <Link className="btn btn-outline btn-sm" to="/login" onClick={closeMenu}>Login</Link>
              <Link className="btn btn-primary btn-sm" to="/signup" onClick={closeMenu}>Sign Up</Link>
            </div>
          ) : (
            <div id="nav-user" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Hi, <strong>{currentUser.name.split(' ')[0]}</strong></span>
              <button className="btn btn-outline btn-sm" onClick={() => { logout(); closeMenu(); }}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      {menuOpen && <div className="mobile-nav-overlay" onClick={toggleMenu}></div>}

      <div className={`mobile-nav ${menuOpen ? 'active' : ''}`} style={menuOpen ? { display: 'flex' } : { display: 'none' }}>
        <div className="mobile-nav-header">
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700 }}>
            Fashion<span style={{ color: 'var(--olive)' }}>Hub</span>
          </span>
          <button className="mobile-nav-close" onClick={closeMenu}>✕</button>
        </div>
        <ul className="mobile-nav-links">
          <li><Link to="/" onClick={closeMenu}>Home</Link></li>
          <li><Link to="/#shop" onClick={closeMenu}>Shop</Link></li>
          <li><Link to="/try-on" onClick={closeMenu}>Try-On</Link></li>
          <li><Link to="/cart" onClick={closeMenu}>Cart</Link></li>
        </ul>
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/try-on" element={<TryOn />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </>
  );
}

export default App;
