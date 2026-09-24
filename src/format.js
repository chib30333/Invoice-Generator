const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-23" -> "23 Sep 2026" (no timezone shifting). */
export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "2026-09-01" -> "09/01" (US MM/DD, no year). */
export function formatMonthDay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${m}/${d}`;
}

/** Work period: "09/01 – 09/15" (or a single date if only one is set). */
export function formatPeriod(start, end) {
  if (start && end) return `${formatMonthDay(start)} – ${formatMonthDay(end)}`;
  return formatMonthDay(start || end);
}

/** "INV-00017" -> "INV-00018" (keeps zero padding); unchanged if it has no trailing number. */
export function nextInvoiceNumber(current) {
  const m = /^(.*?)(\d+)$/.exec(current || '');
  if (!m) return current || '';
  return m[1] + String(Number(m[2]) + 1).padStart(m[2].length, '0');
}

/** Add days to a "YYYY-MM-DD" string, returning the same format. */
export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Today in the user's local timezone as "YYYY-MM-DD". */
export function todayIso() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 1200 -> "1,200.00" */
export function formatNumber(value) {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatMoney(value, currency) {
  return `${formatNumber(value)} ${currency}`;
}

/** Keep money math in cents to avoid float drift. */
export function computeTotals(items, taxRate) {
  const rows = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.price) || 0;
    const amountCents = Math.round(qty * price * 100);
    const taxCents = Math.round((amountCents * taxRate) / 100);
    return { ...it, qty, price, amount: amountCents / 100, tax: taxCents / 100 };
  });
  const subtotal = rows.reduce((s, r) => s + Math.round(r.amount * 100), 0) / 100;
  const tax = rows.reduce((s, r) => s + Math.round(r.tax * 100), 0) / 100;
  return { rows, subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
}
