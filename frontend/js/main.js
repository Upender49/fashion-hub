import { state } from './state.js';
import { Toast } from './utils/toast.js';
import { Auth } from './modules/auth.js';
import { Products } from './modules/products.js';
import { Cart } from './modules/cart.js';
import { TryOn } from './modules/tryon.js';
import { AuthReset } from './modules/auth-reset.js';

export function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  location.hash = page;
  window.scrollTo(0, 0);
  closeMenu();
}

function toggleMenu() {
  const nav = document.getElementById('mobile-nav');
  const overlay = document.getElementById('mobile-nav-overlay');
  const open = nav.classList.toggle('open');
  overlay.classList.toggle('open', open);
}

function closeMenu() {
  document.getElementById('mobile-nav')?.classList.remove('open');
  document.getElementById('mobile-nav-overlay')?.classList.remove('open');
}

const AppInit = {
  async init() {
    // 1. Load user from localStorage
    const saved = localStorage.getItem('fh_user');
    if (saved) state.currentUser = JSON.parse(saved);

    // 2. Fetch data from backend
    await Products.fetchProducts();
    await Cart.fetchCart();
    await TryOn.fetchTryon();

    // 3. Render
    Products.renderProducts();
    Auth.updateNavUser();

    // 4. Route — handle reset-password page from email link
    const hash = location.hash.replace('#', '') || 'home';
    const page = hash.split('?')[0]; // strip query params
    navigate(page);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AppInit.init();
  document.getElementById('signup-form')?.addEventListener('submit', e => Auth.signup(e));
  document.getElementById('login-form')?.addEventListener('submit', e => Auth.login(e));
  document.getElementById('otp-form')?.addEventListener('submit', e => Auth.verifyOtp(e));
  document.getElementById('forgot-form')?.addEventListener('submit', e => AuthReset.forgotPassword(e));
  document.getElementById('reset-form')?.addEventListener('submit', e => AuthReset.resetPassword(e));
});

// Expose to HTML onclick attributes
window.App = {
  navigate,
  toggleMenu,
  closeMenu,
  ...Auth,
  ...Products,
  ...Cart,
  ...TryOn
};
window.Toast = Toast;