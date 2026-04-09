import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Cart from './pages/Cart';
import TryOn from './pages/TryOn';
import Admin from './pages/Admin';
import { useCart } from './context/CartContext';
import './index.css';

function App() {
  const { currentUser, logout, loading } = useAuth();
  const { cartTotalQty, cart } = useCart();
  const navigate = useNavigate();

  if (loading) return <div>Loading Fashion Hub...</div>;

  return (
    <>
      <nav className="navbar">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="logo">Fashion<span>Hub</span></div>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Shop Collection</Link>
          <Link to="/try-on" className="nav-link special">👗 Sample Try-On</Link>
          <Link to="/cart" className="nav-link" style={{ position: 'relative' }}>
            🛒 Cart 
            {cartTotalQty > 0 && <span id="cart-badge" className="badge badge-orange" style={{ display: 'inline-flex' }}>{cartTotalQty}</span>}
          </Link>
        </div>
        
        {!currentUser ? (
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-outline" style={{ textDecoration: 'none' }}>Login</Link>
            <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none' }}>Join</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontWeight: 600 }}>Hi, {currentUser.name.split(' ')[0]}</span>
            {currentUser.isAdmin && (
              <span className="badge badge-olive">Admin</span>
            )}
            <button onClick={() => { logout(); navigate('/'); }} className="btn btn-outline btn-sm">Logout</button>
          </div>
        )}
      </nav>

      <main className="container" style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/try-on" element={<TryOn />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
