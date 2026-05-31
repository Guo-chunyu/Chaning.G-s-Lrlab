/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LightroomParams {
  exposure: number;     // -100 to 100 (standard Lightroom slider range mapped to CSS)
  contrast: number;     // -100 to 100
  highlights: number;   // -100 to 100
  shadows: number;      // -100 to 100
  whites: number;       // -100 to 100
  blacks: number;       // -100 to 100
  temp: number;         // -100 to 100 (Cool - Blue to Warm - Yellow)
  tint: number;         // -100 to 100 (Green to Magenta)
  vibrance: number;     // -100 to 100
  saturation: number;   // -100 to 100
  clarity: number;      // -100 to 100
  dehaze: number;       // -100 to 100

  // HSL Color Parameters
  hueRed: number;
  hueOrange: number;
  hueYellow: number;
  hueGreen: number;
  hueAqua: number;
  hueBlue: number;
  huePurple: number;
  hueMagenta: number;

  satRed: number;
  satOrange: number;
  satYellow: number;
  satGreen: number;
  satAqua: number;
  satBlue: number;
  satPurple: number;
  satMagenta: number;

  lumRed: number;
  lumOrange: number;
  lumYellow: number;
  lumGreen: number;
  lumAqua: number;
  lumBlue: number;
  lumPurple: number;
  lumMagenta: number;

  // Tone Curve (Parametric)
  parametricShadows: number;
  parametricDarks: number;
  parametricLights: number;
  parametricHighlights: number;
}

export interface PhotoItem {
  id: string;
  name: string;
  path: string;          // File relative path inside folder
  size: number;
  url: string;           // Local Object URL for previewing
  base64Data?: string;   // Prepared base64 string for Gemini API
  isAnalyzed: boolean;
  analyzing: boolean;
  styleName?: string;    // Detected style, e.g. "Warm Cinematic Cinematic Film"
  reasoning?: string;    // AI explanation of recommended grading
  recommendedParams?: LightroomParams;
  error?: string;
}

export interface FolderData {
  name: string;
  photos: PhotoItem[];
}

export interface LocalApiConfig {
  endpoint: string;      // Lightroom local server endpoint, e.g., "http://localhost:4848"
  connected: boolean;
  apiKey: string;        // Gemini API configuration
  targetSoftware: "Lightroom Classic" | "Lightroom CC";
  useLocalHelper: boolean;
}

// Preset themes suitable for quick grading
export interface StylePreset {
  id: string;
  name: string;
  description: string;
  params: LightroomParams;
  tag: string;
  color: string; // Tailwinds accent colors
}
