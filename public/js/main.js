// Global Helper & UI Interactivity Script
document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();
  // Auto-close mobile nav menu when a link/button inside it is clicked
  document.querySelectorAll('#navMenuPanel a, #navMenuPanel button').forEach((el) => {
    el.addEventListener('click', () => closeNavMenu());
  });
});

function toggleNavMenu() {
  const panel = document.getElementById('navMenuPanel');
  const btn = document.getElementById('navToggle');
  if (!panel) return;
  const open = panel.classList.toggle('open');
  if (btn) btn.classList.toggle('open', open);
  if (btn) btn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
}

function closeNavMenu() {
  const panel = document.getElementById('navMenuPanel');
  const btn = document.getElementById('navToggle');
  if (panel) panel.classList.remove('open');
  if (btn) {
    btn.classList.remove('open');
    btn.setAttribute('aria-label', 'Buka menu');
  }
}

function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('lp3_theme', next); } catch (e) { /* private mode */ }
  updateThemeIcon();
}

function updateThemeIcon() {
  const iconEl = document.getElementById('themeIcon');
  if (!iconEl) return;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  iconEl.innerHTML = isLight ? SUN_SVG : MOON_SVG;
}

const MOON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const SUN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

function showNotification(title, message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-item toast-' + type;
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-message">${message}</div>
  `;

  document.getElementById('toastContainer').appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal helper functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Quick action: Set activity active from table
async function setActivityActive(activityId) {
  try {
    const res = await fetch(`/api/activities/${activityId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showNotification('Berhasil', data.message, 'success');
      setTimeout(() => location.reload(), 600);
    } else {
      showNotification('Gagal', data.message, 'danger');
    }
  } catch (err) {
    showNotification('Error', 'Gagal memperbarui activity', 'danger');
  }
}

// Delete helper
async function deleteResource(endpoint, resourceName) {
  if (!confirm(`Apakah Anda yakin ingin menghapus ${resourceName} ini?`)) return;

  try {
    const res = await fetch(endpoint, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showNotification('Dihapus', data.message, 'success');
      setTimeout(() => location.reload(), 600);
    } else {
      showNotification('Gagal', data.message, 'danger');
    }
  } catch (err) {
    showNotification('Error', 'Gagal menghapus data', 'danger');
  }
}
