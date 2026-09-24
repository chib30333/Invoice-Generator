# Invoice Generator

A small React app that generates the INV-00017-style invoice as a PDF.
It has a form on the left and a live PDF preview on the right, plus a **Download PDF** button.

## Run it

```bash
npm install
npm run dev        # opens http://localhost:5173
```

`npm run build` creates a static build in `dist/` that you can host anywhere.
`npm run sample` writes `sample-invoice.pdf` from the default data without opening the browser.

## What you fill in (the placeholders)

| Field | Notes |
|---|---|
| Date issued | Defaults to today. |
| Due date | Follows *date issued + 7 days* until you change it by hand. |
| Items | Description, quantity, price. Press **Enter** in the description to start the second line. Long lines also wrap on their own. Amount, subtotal and totals are calculated for you. |
| Payment link | Shown as "Pay {total} USD via link: …". Leave it empty to hide that line. |

The form is saved in the browser (localStorage), so a reload keeps your work. **New** clears it.

## What stays fixed

Everything else lives in **`src/config.js`**: invoice number, currency, payment terms, tax rate,
the "To" client block, your address block and the bank "Account details".
Edit that file to change them. Don't forget to bump `invoiceNumber` for each new invoice.

## Files

```
src/
  config.js            fixed details + default items
  InvoiceDocument.jsx  the PDF layout (@react-pdf/renderer), measured from the original invoice
  App.jsx              form, live preview, download
  format.js            date / money formatting and totals (in cents, no float drift)
  fonts.js             font registration
  fonts/               Selawik Regular + Bold (SIL OFL, see Selawik-OFL.txt)
scripts/render-sample.jsx
```

## Font

The original invoice uses Segoe UI, which can't be redistributed. The app ships with
**Selawik**, Microsoft's open-source stand-in for Segoe UI. It has the same character widths, so
line breaks and alignment match the original. If you have a Segoe UI licence, drop `segoeui.ttf` and
`segoeuib.ttf` into `src/fonts/`, then point the two imports in `src/main.jsx` (and `scripts/render-sample.jsx`) at them.
