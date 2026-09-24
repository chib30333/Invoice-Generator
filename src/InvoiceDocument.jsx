import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import { FONT_FAMILY } from './fonts.js';
import { computeTotals, formatDate, formatMoney, formatPeriod } from './format.js';

// All measurements are PDF points on A4 (595 x 842), taken from the original invoice.
const INK = '#252526';
const HEADER_FILL = '#F5F5F5';
const HEADER_RULE = '#DCDCDC';
const RULE = '#E6E6E6';
const LINK = '#287CCF';

// Column widths of the items table (sum = 563pt, from x=17 to x=580).
const COLS = { num: 19, desc: 179, period: 84, qty: 42, price: 66, amount: 74, taxPct: 34, taxAmt: 65 };

const s = StyleSheet.create({
  page: { fontFamily: FONT_FAMILY, color: INK, paddingTop: 27.8, paddingBottom: 54.2, fontSize: 9.75 },

  title: { marginLeft: 20, fontSize: 18.75, fontWeight: 700, lineHeight: 1.333 },

  // "To" / "Payment terms" bars
  bars: { flexDirection: 'row', marginTop: 36.2 },
  barLeft: { marginLeft: 16, width: 308.4, height: 24.2, backgroundColor: HEADER_FILL, paddingTop: 5.2, paddingLeft: 4 },
  barRight: { marginLeft: 29.6, width: 225.6, height: 24.2, backgroundColor: HEADER_FILL, paddingTop: 5.2, paddingLeft: 3.4 },
  barLabel: { fontSize: 9.75, fontWeight: 700, lineHeight: 1.333 },

  parties: { flexDirection: 'row', marginTop: 1.6 },
  partyLeft: { marginLeft: 20, width: 334 },
  partyRight: { marginLeft: 3.4, width: 222 },
  partyName: { fontSize: 12, fontWeight: 700, lineHeight: 1.333, marginBottom: -3.7 },
  partyLine: { fontSize: 12, lineHeight: 1.333 },

  // Items table
  table: { marginTop: 36, marginLeft: 17, width: 563 },
  headRow: { flexDirection: 'row', backgroundColor: HEADER_FILL, borderBottomWidth: 1, borderBottomColor: HEADER_RULE, height: 21.2 },
  headCell: { paddingTop: 4.1, fontSize: 9, fontWeight: 700, lineHeight: 1.333 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: RULE, paddingTop: 4.3, paddingBottom: 5.6 },
  cell: { fontSize: 9.75, lineHeight: 1.2308 },

  // Totals
  totals: { marginTop: 24.1, marginLeft: 397, width: 182.7 },
  totalRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: RULE, paddingTop: 6, paddingBottom: 5 },
  totalRowLast: { flexDirection: 'row', paddingTop: 6, paddingBottom: 5 },
  totalLabel: { width: 92, paddingLeft: 4, fontSize: 10.5, lineHeight: 1.333 },
  totalValue: { width: 90.7, paddingRight: 4.7, textAlign: 'right', fontSize: 10.5, lineHeight: 1.333 },
  grandRow: { flexDirection: 'row', backgroundColor: HEADER_FILL, height: 31, paddingTop: 3.4 },
  grandLabel: { width: 92, paddingLeft: 4, fontSize: 9, fontWeight: 700, lineHeight: 1.333 },
  grandValue: { width: 90.7, paddingRight: 4.7, textAlign: 'right', fontSize: 9, fontWeight: 700, lineHeight: 1.333 },

  // Seller / bank block at the bottom of the (last) page
  spacer: { flexGrow: 1 },
  bottom: { marginLeft: 18, width: 558, borderTopWidth: 1, borderTopColor: RULE, color: '#000000' },
  bottomCols: { flexDirection: 'row' },
  seller: { marginLeft: 3, width: 269, paddingTop: 13.15 },
  bank: { flexGrow: 1, paddingTop: 17 },
  bankTitle: { fontSize: 13.5, fontWeight: 700, lineHeight: 1.333, marginBottom: 1.65 },
  bottomLine: { fontSize: 11.62, lineHeight: 1.394 },
  payLine: { marginTop: 3.35, marginLeft: 4, fontSize: 10.5, lineHeight: 1.333, color: INK },
  payLink: { color: LINK, textDecoration: 'underline' },

  // Page footer
  footer: { position: 'absolute', top: 796.3, left: 17, right: 18, flexDirection: 'row', alignItems: 'flex-start' },
  footerText: { fontSize: 11.25, lineHeight: 1.333, color: '#666666' },
  footerRule: { flexGrow: 1, marginLeft: 11.5, marginTop: 9, borderTopWidth: 1, borderTopColor: RULE },
});

const cellBox = (width, align) => ({
  width,
  paddingLeft: align === 'left' ? 4 : 0,
  textAlign: align,
});

function HeadCell({ width, align = 'center', children }) {
  return (
    <View style={cellBox(width, align)}>
      <Text style={s.headCell}>{children}</Text>
    </View>
  );
}

function Cell({ width, align = 'center', children }) {
  return (
    <View style={cellBox(width, align)}>
      <Text style={s.cell}>{children}</Text>
    </View>
  );
}

// The description may run ~8pt into the (empty) left side of the Work period column,
// exactly like the original invoice, so typical two-line descriptions don't wrap to three.
const DESC_TEXT_WIDTH = COLS.desc - 4 + 8;

function DescCell({ children }) {
  return (
    <View style={{ width: COLS.desc, paddingLeft: 4 }}>
      <Text style={{ ...s.cell, width: DESC_TEXT_WIDTH }}>{children}</Text>
    </View>
  );
}

/**
 * @param {object} props
 * @param {object} props.config   fixed details (see config.js)
 * @param {object} props.data     { invoiceNumber, dateIssued, dueDate, items: [{description, periodStart, periodEnd, quantity, price}], paymentLink }
 */
export default function InvoiceDocument({ config, data }) {
  const { currency, taxRate } = config;
  const { invoiceNumber } = data;
  const { rows, subtotal, tax, total } = computeTotals(data.items, taxRate);
  const money = (v) => formatMoney(v, currency);

  return (
    <Document title={`Invoice #${invoiceNumber}`} author={config.seller.lines[0]}>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Invoice #{invoiceNumber}</Text>

        <View style={s.bars}>
          <View style={s.barLeft}>
            <Text style={s.barLabel}>To</Text>
          </View>
          <View style={s.barRight}>
            <Text style={s.barLabel}>Payment terms</Text>
          </View>
        </View>

        <View style={s.parties}>
          <View style={s.partyLeft}>
            <Text style={s.partyName}>{config.client.name}</Text>
            {config.client.lines.map((line, i) => (
              <Text key={i} style={s.partyLine}>{line}</Text>
            ))}
          </View>
          <View style={s.partyRight}>
            <Text style={{ ...s.partyLine, marginBottom: -3.7 }}>{config.paymentTerms}</Text>
            <Text style={s.partyLine}>Date issued: {formatDate(data.dateIssued)}</Text>
            <Text style={s.partyLine}>Due date: {formatDate(data.dueDate)}</Text>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.headRow} fixed>
            <HeadCell width={COLS.num} align="left">#</HeadCell>
            <HeadCell width={COLS.desc} align="left">Item description</HeadCell>
            <HeadCell width={COLS.period}>Work period</HeadCell>
            <HeadCell width={COLS.qty}>Quantity</HeadCell>
            <HeadCell width={COLS.price}>Price</HeadCell>
            <HeadCell width={COLS.amount}>Amount</HeadCell>
            <HeadCell width={COLS.taxPct}>Tax %</HeadCell>
            <HeadCell width={COLS.taxAmt} align="left">Tax amount</HeadCell>
          </View>
          {rows.map((r, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Cell width={COLS.num} align="left">{i + 1}</Cell>
              <DescCell>{r.description}</DescCell>
              <Cell width={COLS.period}>{formatPeriod(r.periodStart, r.periodEnd)}</Cell>
              <Cell width={COLS.qty}>{String(r.qty)}</Cell>
              <Cell width={COLS.price}>{money(r.price)}</Cell>
              <Cell width={COLS.amount}>{money(r.amount)}</Cell>
              <Cell width={COLS.taxPct}>{taxRate}%</Cell>
              <Cell width={COLS.taxAmt} align="left">{money(r.tax)}</Cell>
            </View>
          ))}
        </View>

        <View style={s.totals} wrap={false}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{money(subtotal)}</Text>
          </View>
          <View style={s.totalRowLast}>
            <Text style={s.totalLabel}>Total tax ({taxRate}%)</Text>
            <Text style={s.totalValue}>{money(tax)}</Text>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: RULE }}>
            <View style={s.grandRow}>
              <Text style={s.grandLabel}>Total payment</Text>
              <Text style={s.grandValue}>{money(total)}</Text>
            </View>
          </View>
        </View>

        <View style={s.spacer} />

        <View style={s.bottom} wrap={false}>
          <View style={s.bottomCols}>
            <View style={s.seller}>
              {config.seller.lines.map((line, i) => (
                <Text key={i} style={s.bottomLine}>{line}</Text>
              ))}
            </View>
            <View style={s.bank}>
              <Text style={s.bankTitle}>{config.bank.title}</Text>
              {config.bank.lines.map((line, i) => (
                <Text key={i} style={s.bottomLine}>{line}</Text>
              ))}
            </View>
          </View>
          {data.paymentLink ? (
            <Text style={s.payLine}>
              Pay {money(total)} via link:{' '}
              <Link src={data.paymentLink} style={s.payLink}>{data.paymentLink}</Link>
            </Text>
          ) : null}
        </View>

        <View style={s.footer} fixed>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages} for invoice #${invoiceNumber}`}
          />
          <View style={s.footerRule} />
        </View>
      </Page>
    </Document>
  );
}
