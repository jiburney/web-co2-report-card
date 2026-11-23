// Raw inputs gathered when the user opens a report

export interface PerfResource {
  name: string;            // URL
  initiatorType: string;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}

export interface ImageOnPage {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;    // CSS px × devicePixelRatio
  displayHeight: number;
}

export interface PageDetails {
  pageUrl: string;
  resources: PerfResource[];
  images: ImageOnPage[];
}

export interface RequestRecord {
  url: string;
  type: string;            // webRequest resource type
  bytes: number;           // Content-Length, 0 if missing
  contentType?: string;
  encoding: string | null; // Content-Encoding, null if the header was absent
}

// Analysis output

export type Category = 'Images' | 'Scripts' | 'Styles' | 'Fonts' | 'Video & audio' | 'Documents' | 'Data' | 'Other';

export interface FileRow {
  url: string;
  name: string;            // short display name
  host: string;
  category: Category;
  bytes: number;
  thirdParty: boolean;
  note?: string;
  savings?: number;
}

export interface Check {
  id: 'image-format' | 'oversized-images' | 'compression' | 'third-party';
  title: string;
  passed: boolean;
  summary: string;
  advice: string;
  savings: number;         // bytes; 0 when not counted toward the projection
  files: FileRow[];
}

export interface Report {
  host: string;
  path: string;
  totalBytes: number;
  totalGrams: number;
  grade: string;
  gradeColor: string;
  gradeBlurb: string;
  projectedBytes: number;
  projectedGrade: string;
  projectedGradeColor: string;
  breakdown: { category: Category; bytes: number; files: number }[];
  firstPartyBytes: number;
  thirdPartyBytes: number;
  thirdPartyDomains: { domain: string; bytes: number; files: number }[];
  heaviest: FileRow[];
  checks: Check[];
  unmeasured: number;      // third-party files the browser reported as 0 bytes
  fileCount: number;
}
