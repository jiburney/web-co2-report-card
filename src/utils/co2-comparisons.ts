// Everyday equivalents for CO2 amounts.
// Factors from the U.S. EPA Greenhouse Gas Equivalencies Calculator:
//   - smartphone charged: 1.24e-5 metric tons CO2 = 12.4 g (iPhone 16 data)
//   - mile driven, average gasoline passenger vehicle: 3.93e-4 metric tons CO2e = 393 g
// https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator

export const GRAMS_PER_SMARTPHONE_CHARGE = 12.4;
export const GRAMS_PER_MILE_DRIVEN = 393;

function round(n: number): string {
  if (n >= 10) return Math.round(n).toLocaleString();
  return n.toFixed(1).replace(/\.0$/, '');
}

/**
 * Scaled comparison text, e.g. "About 4 smartphone charges".
 * Uses phone charges for small amounts and miles driven once that reads more naturally.
 */
export function formatComparison(grams: number): string {
  if (grams <= 0) return '';
  if (grams < GRAMS_PER_SMARTPHONE_CHARGE) {
    const pct = Math.max(1, Math.round((grams / GRAMS_PER_SMARTPHONE_CHARGE) * 100));
    return `📱 About ${pct}% of one smartphone charge`;
  }
  if (grams < GRAMS_PER_MILE_DRIVEN) {
    const charges = grams / GRAMS_PER_SMARTPHONE_CHARGE;
    return `📱 About ${round(charges)} smartphone charge${charges >= 1.05 ? 's' : ''}`;
  }
  const miles = grams / GRAMS_PER_MILE_DRIVEN;
  return `🚗 About ${round(miles)} mile${miles >= 1.05 ? 's' : ''} driven in an average gas car`;
}
