import { state } from '../state.js';
import { Toast } from '../utils/toast.js';
import { navigate } from '../main.js';
import { Cart } from './cart.js';

export const Auth = {
  pendingEmail: null,
  
  async signup(e) {
    e.preventDefault();
    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm  = document.getElementById('signup-confirm').value;

    if (!name || !email || !password) return Toast.show('Please fill all fields', 'info');
    if (password !== confirm) return Toast.show('Passwords do not match', 'info');

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return Toast.show(data.message, 'info');
      }

      if (data.requiresOtp) {
        this.pendingEmail = data.email;
        Toast.show(data.message, 'success');
        navigate('otp');
        return;
      }

    } catch (error) {
      console.error("Signup error:", error);
      Toast.show('Something went wrong. Please try again.', 'info');
    }
  },

  async login(e) {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) return Toast.show('Please fill all fields', 'info');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return Toast.show(data.message, 'info');
      }

      if (data.requiresOtp) {
        this.pendingEmail = data.email;
        Toast.show(data.message, 'success');
        navigate('otp');
        return;
      }

    } catch (error) {
      console.error("Login error:", error);
      Toast.show('Something went wrong. Please try again.', 'info');
    }
  },

  async verifyOtp(e) {
    e.preventDefault();
    const otp = document.getElementById('otp-code').value.trim();
    if (!otp) return Toast.show('Please enter the OTP', 'info');
    if (!this.pendingEmail) return Toast.show('Session expired. Please log in again.', 'info');

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.pendingEmail, otp })
      });
      const data = await response.json();

      if (!response.ok) {
        return Toast.show(data.message, 'info');
      }

      // Save verified token & user info
      state.currentUser = data.user;
      localStorage.setItem('fh_user', JSON.stringify(data.user));
      localStorage.setItem('fh_token', data.token);

      this.updateNavUser();
      await Cart.fetchCart();
      
      Toast.show('Verified successfully! Welcome to Fashion Hub 🎉', 'success');
      navigate('home');
      
      // Clear OTP field and state
      document.getElementById('otp-code').value = '';
      this.pendingEmail = null;

    } catch (error) {
      console.error("OTP Verification error:", error);
      Toast.show('Something went wrong verifying the code.', 'info');
    }
  },

  logout() {
    state.currentUser = null;
    state.cart = [];
    localStorage.removeItem('fh_user');
    localStorage.removeItem('fh_token');
    Cart.updateCartBadge();
    Cart.renderCart();
    this.updateNavUser();
    Toast.show('Logged out successfully', 'info');
    navigate('home');
  },

  updateNavUser() {
    const authBtns = document.getElementById('nav-auth');
    const userMenu = document.getElementById('nav-user');
    const adminBtn = document.getElementById('nav-admin-btn');
    const adminNavLink = document.getElementById('nav-admin-link');
    if (state.currentUser) {
      if (authBtns) authBtns.style.display = 'none';
      if (userMenu) {
        userMenu.style.display = 'flex';
        document.getElementById('nav-username').textContent = state.currentUser.name.split(' ')[0];
      }
      // Show admin controls only for admins
      const isAdmin = state.currentUser.isAdmin === true;
      if (adminBtn) adminBtn.style.display = isAdmin ? 'inline-flex' : 'none';
      if (adminNavLink) adminNavLink.style.display = isAdmin ? 'list-item' : 'none';
    } else {
      if (authBtns) authBtns.style.display = 'flex';
      if (userMenu) userMenu.style.display = 'none';
      if (adminBtn) adminBtn.style.display = 'none';
      if (adminNavLink) adminNavLink.style.display = 'none';
    }
  },

  requireAuth(action) {
    if (!state.currentUser) {
      Toast.show('Please login to ' + action, 'info');
      setTimeout(() => navigate('login'), 800);
      return false;
    }
    return true;
  }
};