import { state } from '../state.js';
import { Toast } from '../utils/toast.js';
import { API_URL } from '../state.js';
import { navigate } from '../main.js';

const API = API_URL;

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('fh_token')}`
  };
}

// Show message inside forgot/reset forms
function showFormMsg(elId, msg, isError = false) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.style.display = 'block';
  el.style.background = isError ? '#fde8e0' : '#e8f5e0';
  el.style.color = isError ? '#8c4a2f' : '#4a5a32';
  el.textContent = msg;
}

export const AuthReset = {

  async forgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email')?.value.trim();
    if (!email) return;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      showFormMsg('forgot-msg', data.message || 'Reset link sent! Check your inbox.', false);
      e.target.reset();
    } catch {
      showFormMsg('forgot-msg', 'Something went wrong. Please try again.', true);
    } finally {
      btn.textContent = 'Send Reset Link →';
      btn.disabled = false;
    }
  },

  async resetPassword(e) {
    e.preventDefault();
    const password = document.getElementById('reset-password')?.value;
    const confirm  = document.getElementById('reset-confirm')?.value;

    if (password !== confirm) return showFormMsg('reset-msg', 'Passwords do not match', true);
    if (password.length < 6)  return showFormMsg('reset-msg', 'Password must be at least 6 characters', true);

    // Extract token from URL hash: #reset-password?token=xxxx
    const hash = window.location.hash;
    const tokenMatch = hash.match(/[?&]token=([^&]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) return showFormMsg('reset-msg', 'Invalid reset link — please request a new one.', true);

    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Resetting...';
    btn.disabled = true;

    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();

      if (res.ok) {
        showFormMsg('reset-msg', data.message, false);
        e.target.reset();
        setTimeout(() => navigate('login'), 2000);
      } else {
        showFormMsg('reset-msg', data.message, true);
      }
    } catch {
      showFormMsg('reset-msg', 'Something went wrong. Please try again.', true);
    } finally {
      btn.textContent = 'Reset Password →';
      btn.disabled = false;
    }
  }
};
