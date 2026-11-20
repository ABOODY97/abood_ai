/**
 * Detects reading direction ('rtl' or 'ltr') based on the first strong
 * directional Unicode character in the text.
 * Defaults to 'rtl' for neutral or empty text since عبودي AI is Arabic-first.
 */
const RTL_CHAR_REGEX = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LTR_CHAR_REGEX = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u1E00-\u1EFF]/;

export function detectTextDirection(text: string): 'rtl' | 'ltr' {
  if (!text) return 'rtl';

  // Ignore leading markdown syntax, fenced code markers, URLs, digits, and punctuation
  const stripped = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ');

  for (let i = 0; i < stripped.length; i += 1) {
    const ch = stripped[i];
    if (RTL_CHAR_REGEX.test(ch)) {
      return 'rtl';
    }
    if (LTR_CHAR_REGEX.test(ch)) {
      return 'ltr';
    }
  }

  return 'rtl';
}
