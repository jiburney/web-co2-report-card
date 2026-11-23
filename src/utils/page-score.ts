// Page grades from the Sustainable Web Design Model v4.
// Cutoffs are grams CO2e per page view at percentiles of real pages measured
// by the HTTP Archive (same values CO2.js uses in its rating scale).
import { calculateEmissions } from './co2-calculator';

export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

interface GradeBand {
  grade: Grade;
  maxGrams: number;    // inclusive upper bound
  color: string;
  blurb: string;
}

export const GRADE_BANDS: GradeBand[] = [
  { grade: 'A+', maxGrams: 0.040, color: '#059669', blurb: 'Lighter than 95% of web pages (HTTP Archive, 2023)' },
  { grade: 'A',  maxGrams: 0.079, color: '#10b981', blurb: 'Lighter than 90% of web pages (HTTP Archive, 2023)' },
  { grade: 'B',  maxGrams: 0.145, color: '#65a30d', blurb: 'Lighter than 80% of web pages (HTTP Archive, 2023)' },
  { grade: 'C',  maxGrams: 0.209, color: '#ca8a04', blurb: 'Lighter than 70% of web pages (HTTP Archive, 2023)' },
  { grade: 'D',  maxGrams: 0.278, color: '#ea580c', blurb: 'Lighter than 60% of web pages (HTTP Archive, 2023)' },
  { grade: 'E',  maxGrams: 0.359, color: '#dc2626', blurb: 'Lighter than half of web pages (HTTP Archive, 2023)' },
  { grade: 'F',  maxGrams: Infinity, color: '#9f1239', blurb: 'Heavier than the median web page (HTTP Archive, 2023)' }
];

export function gradeForGrams(grams: number): GradeBand {
  return GRADE_BANDS.find((b) => grams <= b.maxGrams) || GRADE_BANDS[GRADE_BANDS.length - 1];
}

export function gradeForBytes(bytes: number): GradeBand {
  return gradeForGrams(calculateEmissions(bytes));
}

export { formatBytes } from './format';
