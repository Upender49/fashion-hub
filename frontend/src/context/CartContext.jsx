import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!currentUser) {
      setCart([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [currentUser]);

  const addToCart = async (productId) => {
    if (!currentUser) return alert('Please login to add to cart');
    try {
      await api.post('/cart/add', { productId });
      await fetchCart();
      alert('Added to cart! 🛒');
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding to cart');
    }
  };

  const updateQuantity = async (cartItemId, delta) => {
    try {
      await api.put(`/cart/update/${cartItemId}`, { delta });
      await fetchCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating quantity');
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await api.delete(`/cart/remove/${cartItemId}`);
      await fetchCart();
    } catch (err) {
      alert('Error removing item');
    }
  };

  const checkout = async (shippingAddress) => {
    try {
      const res = await api.post('/orders/checkout', { shippingAddress });
      await fetchCart(); // this clears the cart since the backend deletes it
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const cartTotalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider value={{ cart, cartTotalQty, addToCart, updateQuantity, removeFromCart, checkout, loading }}>
        {children}
    </CartContext.Provider>
  );
};
