// Fixed invoice details. Everything here stays the same on every invoice;
// the editable placeholders (invoice number, dates, items, payment link) live in the app form.

export const invoiceConfig = {
  invoiceNumber: 'INV-00017', // starting value for the form
  currency: 'USD',
  paymentTerms: 'Net 7 days',
  dueInDays: 7, // default gap between "Date issued" and "Due date" in the form
  taxRate: 0, // percent

  client: {
    name: 'RADIIA',
    lines: ['New York NY', 'jennifer@raiida.co', 'United States of America', 'New York, 10036'],
  },

  seller: {
    lines: ['Serhii Chornyi', 'Haharina str. 36 fl. 1', '70433, Novoolexandrivka, Ukraine', 'chernysergiy@gmail.com'],
  },

  bank: {
    title: 'Account details',
    lines: [
      'Account holder: Serhii Chornyi',
      'Account number: 70587950001841509',
      'Routing number: 031100209',
      'Bank: Citibank',
    ],
  },
};

// Starting values for the form.
export const defaultItems = [
  {
    description: 'Implement reports, dashboard panels\n+ inventory filter/export features',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-07',
    quantity: 60,
    price: 20,
  },
  {
    description: 'Implement document editing, PDF\ntemplate + SKU lookup features',
    periodStart: '2026-09-08',
    periodEnd: '2026-09-14',
    quantity: 60,
    price: 20,
  },
  {
    description: 'Implement Brand Out document, memo\nline marks + diamond list column features',
    periodStart: '2026-09-15',
    periodEnd: '2026-09-21',
    quantity: 60,
    price: 20,
  },
];
