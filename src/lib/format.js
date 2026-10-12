export const eur = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v < 0 ? '−' : ''}€${Math.abs(v).toLocaleString('en-GB')}`;
};

export const pct = (x, digits = 1) => `${(Number(x) * 100).toFixed(digits).replace(/\.0+$/, '')}%`;

export const intensity = (x) => `${Number(x).toFixed(2)} tCO₂e/t`;

export const tonnes = (n) => `${Number(n).toLocaleString('en-GB')} t`;

export const pricePerTonne = (p) => `€${Number(p).toFixed(2)}/tCO₂`;
