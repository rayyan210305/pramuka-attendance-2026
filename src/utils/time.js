// Utilitas waktu WIB (UTC+7) — konsisten untuk server (UTC) & semua tampilan
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function parseUtc(value) {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const s = String(value || '').trim();
  if (!s) return null;
  let iso = s;
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(iso)) {
    iso = iso.replace(' ', 'T');
    if (!/[zZ]$|[+-]\d{2}:?\d{2}$/.test(iso)) iso += 'Z';
  }
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

const pad = (n) => String(n).padStart(2, '0');

// '2026-08-06 10:30:45 WIB'
function formatWIB(value) {
  const d = parseUtc(value);
  if (!d) return '-';
  const w = new Date(d.getTime() + WIB_OFFSET_MS);
  const u = (n) => (n.getUTCFullYear() + '-' + pad(n.getUTCMonth() + 1) + '-' + pad(n.getUTCDate()));
  const t = (n) => (pad(n.getUTCHours()) + ':' + pad(n.getUTCMinutes()) + ':' + pad(n.getUTCSeconds()));
  return `${u(w)} ${t(w)} WIB`;
}

// '10:30:45 WIB'
function formatWIBClock(value) {
  const d = parseUtc(value);
  if (!d) return '-';
  const w = new Date(d.getTime() + WIB_OFFSET_MS);
  return `${pad(w.getUTCHours())}:${pad(w.getUTCMinutes())}:${pad(w.getUTCSeconds())} WIB`;
}

module.exports = { formatWIB, formatWIBClock, parseUtc };
