export const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Replace 'https://fashion-hub-api.onrender.com' with your actual deployed backend URL
export const API_URL = isLocal ? 'http://localhost:5000' : 'https://fashion-hub-api.onrender.com';

export const state = {
  currentUser: null,
  cart: [],
  tryonItems: [],
  products: []
};