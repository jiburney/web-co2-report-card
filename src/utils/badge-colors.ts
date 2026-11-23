// Intensity levels based on cumulative CO2 (grams)

export interface IntensityLevel {
  threshold: number;   // grams at which this level starts
  color: string;       // toolbar badge color
  pillBg: string;      // popup pill background
  pillText: string;    // popup pill text color
  label: string;
}

export const INTENSITY_LEVELS: IntensityLevel[] = [
  { threshold: 0,    color: '#10b981', pillBg: '#d1fae5', pillText: '#065f46', label: 'Light' },
  { threshold: 100,  color: '#ca8a04', pillBg: '#fef3c7', pillText: '#78350f', label: 'Moderate' },
  { threshold: 300,  color: '#ea580c', pillBg: '#fed7aa', pillText: '#7c2d12', label: 'Heavy' },
  { threshold: 1000, color: '#dc2626', pillBg: '#fecaca', pillText: '#7f1d1d', label: 'Very Heavy' },
  { threshold: 5000, color: '#9333ea', pillBg: '#e9d5ff', pillText: '#581c87', label: 'Extreme' }
];

export function getIntensityLevel(grams: number): IntensityLevel {
  for (let i = INTENSITY_LEVELS.length - 1; i >= 0; i--) {
    if (grams >= INTENSITY_LEVELS[i].threshold) return INTENSITY_LEVELS[i];
  }
  return INTENSITY_LEVELS[0];
}

export function getBadgeColor(grams: number): string {
  return getIntensityLevel(grams).color;
}

export function getBadgeLabel(grams: number): string {
  return getIntensityLevel(grams).label;
}

/**
 * Short text for the toolbar badge (max ~4 characters fit).
 * Chrome hides the badge entirely when the text is empty, so we always show something.
 */
export function formatBadgeText(grams: number): string {
  if (grams < 1) return '0g';
  if (grams < 1000) return `${Math.round(grams)}g`;
  const kg = grams / 1000;
  return kg < 10 ? `${kg.toFixed(1)}kg` : `${Math.round(kg)}kg`;
}
