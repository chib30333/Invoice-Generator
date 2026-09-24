// Renders a sample invoice to ./sample-invoice.pdf without starting the app.
// Usage: npm run sample
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToFile } from '@react-pdf/renderer';
import InvoiceDocument from '../src/InvoiceDocument.jsx';
import { registerFonts } from '../src/fonts.js';
import { invoiceConfig, defaultItems } from '../src/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerFonts({
  regular: path.join(root, 'src/fonts/Selawik-Regular.ttf'),
  bold: path.join(root, 'src/fonts/Selawik-Bold.ttf'),
});

const data = {
  invoiceNumber: invoiceConfig.invoiceNumber,
  dateIssued: '2026-09-23',
  dueDate: '2026-09-26',
  items: defaultItems,
  paymentLink: 'https://link.payoneer.com/Token?t=6219CC4C2C1B4E3F8CCA1257F3474F83',
};

const out = path.join(root, process.argv[2] || 'sample-invoice.pdf');
await renderToFile(<InvoiceDocument config={invoiceConfig} data={data} />, out);
console.log('Wrote', out);
