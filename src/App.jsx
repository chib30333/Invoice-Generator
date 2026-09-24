import { useEffect, useMemo, useState } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import InvoiceDocument from './InvoiceDocument.jsx';
import { invoiceConfig, defaultItems } from './config.js';
import { addDays, computeTotals, formatMoney, nextInvoiceNumber, todayIso } from './format.js';

const STORAGE_KEY = 'invoice-generator-draft-v1';
const EMPTY_ITEM = { description: '', periodStart: '', periodEnd: '', quantity: 1, price: 0 };

function initialState() {
  const issued = todayIso();
  const fresh = {
    invoiceNumber: invoiceConfig.invoiceNumber,
    dateIssued: issued,
    dueDate: addDays(issued, invoiceConfig.dueInDays),
    dueDateTouched: false,
    items: defaultItems,
    paymentLink: '',
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.items)) return { ...fresh, ...saved };
  } catch {
    /* no saved draft */
  }
  return fresh;
}

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const isValidUrl = (v) => {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

export default function App() {
  const [form, setForm] = useState(initialState);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* storage unavailable */
    }
  }, [form]);

  const data = useMemo(
    () => ({
      invoiceNumber: form.invoiceNumber.trim(),
      dateIssued: form.dateIssued,
      dueDate: form.dueDate,
      items: form.items,
      paymentLink: form.paymentLink.trim(),
    }),
    [form],
  );
  const previewData = useDebounced(data, 400);
  const { rows, total } = computeTotals(form.items, invoiceConfig.taxRate);
  const money = (v) => formatMoney(v, invoiceConfig.currency);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const setDateIssued = (value) =>
    setForm((f) => ({
      ...f,
      dateIssued: value,
      // keep due date = issued + N days until the user edits it by hand
      dueDate: !f.dueDateTouched && value ? addDays(value, invoiceConfig.dueInDays) : f.dueDate,
    }));

  const updateItem = (index, patch) =>
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) }));

  const removeItem = (index) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const moveItem = (index, dir) =>
    setForm((f) => {
      const items = [...f.items];
      const j = index + dir;
      if (j < 0 || j >= items.length) return f;
      [items[index], items[j]] = [items[j], items[index]];
      return { ...f, items };
    });

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));

  const resetForm = () => {
    if (!window.confirm('Clear the form and start a new invoice?')) return;
    const issued = todayIso();
    setForm((f) => ({
      invoiceNumber: nextInvoiceNumber(f.invoiceNumber.trim()),
      dateIssued: issued,
      dueDate: addDays(issued, invoiceConfig.dueInDays),
      dueDateTouched: false,
      items: [{ ...EMPTY_ITEM }],
      paymentLink: '',
    }));
  };

  const download = async () => {
    setDownloading(true);
    try {
      const blob = await pdf(<InvoiceDocument config={invoiceConfig} data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${(data.invoiceNumber || 'draft').replace(/[\\/:*?"<>|]/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setDownloading(false);
    }
  };

  const linkInvalid = form.paymentLink.trim() !== '' && !isValidUrl(form.paymentLink.trim());
  const datesInvalid = form.dateIssued && form.dueDate && form.dueDate < form.dateIssued;

  return (
    <div className="app">
      <aside className="panel">
        <header className="panel-head">
          <div>
            <h1>Invoice #{form.invoiceNumber.trim() || '—'}</h1>
            <p className="muted">To {invoiceConfig.client.name} · {invoiceConfig.paymentTerms}</p>
          </div>
          <button type="button" className="btn ghost" onClick={resetForm}>
            New
          </button>
        </header>

        <section className="section">
          <h2>Invoice</h2>
          <label className="field">
            <span>Invoice number</span>
            <input
              type="text"
              value={form.invoiceNumber}
              placeholder="INV-00001"
              onChange={(e) => set({ invoiceNumber: e.target.value })}
            />
          </label>
          {!form.invoiceNumber.trim() && <p className="warn">Invoice number is empty.</p>}
          <div className="grid2 gap-top">
            <label className="field">
              <span>Date issued</span>
              <input type="date" value={form.dateIssued} onChange={(e) => setDateIssued(e.target.value)} />
            </label>
            <label className="field">
              <span>Due date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set({ dueDate: e.target.value, dueDateTouched: true })}
              />
            </label>
          </div>
          {datesInvalid && <p className="warn">Due date is before the issue date.</p>}
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Items</h2>
            <span className="muted">{form.items.length} {form.items.length === 1 ? 'item' : 'items'}</span>
          </div>

          <ol className="items">
            {form.items.map((item, i) => (
              <li key={i} className="item">
                <div className="item-head">
                  <span className="item-num">{i + 1}</span>
                  <div className="item-actions">
                    <button type="button" className="icon" onClick={() => moveItem(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                    <button type="button" className="icon" onClick={() => moveItem(i, 1)} disabled={i === form.items.length - 1} aria-label="Move down">↓</button>
                    <button type="button" className="icon danger" onClick={() => removeItem(i)} aria-label="Remove item">✕</button>
                  </div>
                </div>
                <label className="field">
                  <span>Description <em>(press Enter for a new line)</em></span>
                  <textarea
                    rows={2}
                    value={item.description}
                    placeholder={'First line of the description\nSecond line'}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                  />
                </label>
                <div className="grid2 gap-top">
                  <label className="field">
                    <span>Work from</span>
                    <input
                      type="date"
                      value={item.periodStart ?? ''}
                      onChange={(e) => updateItem(i, { periodStart: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Work to</span>
                    <input
                      type="date"
                      value={item.periodEnd ?? ''}
                      onChange={(e) => updateItem(i, { periodEnd: e.target.value })}
                    />
                  </label>
                </div>
                {item.periodStart && item.periodEnd && item.periodEnd < item.periodStart && (
                  <p className="warn">Work period ends before it starts.</p>
                )}
                <div className="grid3">
                  <label className="field">
                    <span>Quantity</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, { quantity: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Price ({invoiceConfig.currency})</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(i, { price: e.target.value })}
                    />
                  </label>
                  <div className="field">
                    <span>Amount</span>
                    <output>{money(rows[i].amount)}</output>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <button type="button" className="btn secondary full" onClick={addItem}>
            + Add item
          </button>
        </section>

        <section className="section">
          <h2>Payment link</h2>
          <label className="field">
            <span>URL shown after “Pay … via link:”</span>
            <input
              type="url"
              value={form.paymentLink}
              placeholder="https://link.payoneer.com/Token?t=…"
              onChange={(e) => set({ paymentLink: e.target.value })}
            />
          </label>
          {linkInvalid && <p className="warn">This doesn’t look like a valid link.</p>}
          {!form.paymentLink.trim() && <p className="muted small">Leave empty to hide the payment line.</p>}
        </section>

        <footer className="panel-foot">
          <div className="total">
            <span>Total payment</span>
            <strong>{money(total)}</strong>
          </div>
          <button type="button" className="btn primary" onClick={download} disabled={downloading || form.items.length === 0}>
            {downloading ? 'Preparing…' : 'Download PDF'}
          </button>
        </footer>
      </aside>

      <main className="preview">
        <PDFViewer className="viewer" showToolbar>
          <InvoiceDocument config={invoiceConfig} data={previewData} />
        </PDFViewer>
      </main>
    </div>
  );
}
