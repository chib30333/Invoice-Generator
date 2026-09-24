import { Font } from '@react-pdf/renderer';

export const FONT_FAMILY = 'InvoiceSans';

/**
 * Registers the invoice font. The defaults are Selawik (Microsoft's open-source,
 * metric-compatible stand-in for Segoe UI). If you have a Segoe UI licence you can
 * pass segoeui.ttf / segoeuib.ttf here instead.
 */
export function registerFonts({ regular, bold }) {
  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: bold, fontWeight: 700 },
    ],
  });
  // Never hyphenate words inside item descriptions.
  Font.registerHyphenationCallback((word) => [word]);
}
