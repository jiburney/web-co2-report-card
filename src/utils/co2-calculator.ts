import { co2 } from '@tgwf/co2';

// Explicitly use the Sustainable Web Design Model v4.
// CO2.js 0.17 defaults to v3 unless a version is passed, and v0.18 switches the default.
// Pinning it here keeps results stable across library upgrades.
const co2Emission = new co2({ model: 'swd', version: 4 });

export function calculateEmissions(bytes: number, greenHosting = false): number {
  // Returns CO2e in grams
  const result = co2Emission.perByte(bytes, greenHosting);
  return typeof result === 'number' ? result : 0;
}
