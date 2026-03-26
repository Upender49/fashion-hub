export const Toast = {
  show(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) { 
      container = document.createElement('div'); 
      container.id = 'toast-container'; 
      container.className = 'toast-container'; 
      document.body.appendChild(container); 
    }
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icons = { success:'✅', tryon:'👗', info:'ℹ️' };
    toast.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }
};