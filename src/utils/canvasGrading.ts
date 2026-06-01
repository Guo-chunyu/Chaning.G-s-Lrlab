/**
 * Pixel-level color grading for the preview canvas.
 *
 * CSS filters are too coarse for Lightroom-like work: highlights, shadows,
 * HSL channels, tone curves, skin protection, grain and vignette all need
 * access to the actual pixels.
 */

import { LightroomParams } from "../types";

type Hsl = { h: number; s: number; l: number };

const HSL_RANGES = [
  { name: "Red", center: 0, width: 22 },
  { name: "Orange", center: 32, width: 28 },
  { name: "Yellow", center: 58, width: 24 },
  { name: "Green", center: 120, width: 46 },
  { name: "Aqua", center: 178, width: 34 },
  { name: "Blue", center: 225, width: 42 },
  { name: "Purple", center: 275, width: 34 },
  { name: "Magenta", center: 315, width: 34 },
] as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const hueDistance = (a: number, b: number) => {
  const diff = Math.abs(((a - b + 180) % 360) - 180);
  return Math.min(diff, 360 - diff);
};

const channelWeight = (hue: number, center: number, width: number) => {
  if (center === 0) {
    return clamp01(1 - Math.min(hueDistance(hue, 0), hueDistance(hue, 360)) / width);
  }
  return clamp01(1 - hueDistance(hue, center) / width);
};

const rgbToHsl = (r: number, g: number, b: number): Hsl => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  if (max === g) h = (b - r) / d + 2;
  if (max === b) h = (r - g) / d + 4;

  return { h: h * 60, s, l };
};

const hueToRgb = (p: number, q: number, t: number) => {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
};

const hslToRgb = ({ h, s, l }: Hsl) => {
  const normalizedHue = ((h % 360) + 360) % 360;
  if (s === 0) {
    return { r: l, g: l, b: l };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = normalizedHue / 360;

  return {
    r: hueToRgb(p, q, hk + 1 / 3),
    g: hueToRgb(p, q, hk),
    b: hueToRgb(p, q, hk - 1 / 3),
  };
};

const seededNoise = (x: number, y: number) => {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const getContainRect = (
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const width = Math.round(imageWidth * scale);
  const height = Math.round(imageHeight * scale);
  return {
    x: Math.round((canvasWidth - width) / 2),
    y: Math.round((canvasHeight - height) / 2),
    width,
    height,
  };
};

const analyzeImage = (data: Uint8ClampedArray) => {
  let luma = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (data[i + 3] === 0) continue;
    luma += y;
    red += r;
    green += g;
    blue += b;
    count++;
  }

  if (!count) {
    return { meanLuma: 0.5, red: 0.33, green: 0.33, blue: 0.33 };
  }

  return {
    meanLuma: luma / count,
    red: red / count,
    green: green / count,
    blue: blue / count,
  };
};

const toneMap = (value: number, luma: number, params: LightroomParams, autoEv: number) => {
  let out = value * Math.pow(2, (params.exposure / 100) * 1.75 + autoEv);

  const shadowsMask = 1 - smoothstep(0.12, 0.55, luma);
  const highlightsMask = smoothstep(0.45, 0.92, luma);
  const whitesMask = smoothstep(0.72, 1, luma);
  const blacksMask = 1 - smoothstep(0.02, 0.28, luma);

  out += (params.shadows / 100) * 0.26 * shadowsMask;
  out += (params.highlights / 100) * 0.22 * highlightsMask;
  out += (params.whites / 100) * 0.18 * whitesMask;
  out += (params.blacks / 100) * 0.18 * blacksMask;

  const curveShadows = (params.parametricShadows / 100) * 0.18 * shadowsMask;
  const curveDarks = (params.parametricDarks / 100) * 0.14 * (1 - Math.abs(luma - 0.32) / 0.32);
  const curveLights = (params.parametricLights / 100) * 0.14 * (1 - Math.abs(luma - 0.68) / 0.32);
  const curveHighlights = (params.parametricHighlights / 100) * 0.18 * highlightsMask;
  out += curveShadows + curveDarks + curveLights + curveHighlights;

  const contrast = 1 + (params.contrast / 100) * 0.72 + (params.dehaze / 100) * 0.22;
  out = (out - 0.5) * contrast + 0.5;

  const filmShoulder = smoothstep(0.72, 1.15, out);
  out = lerp(out, 1 - Math.exp(-out * 1.9), filmShoulder * 0.42);

  if (params.blacks > 0 || params.contrast < 0) {
    out = Math.max(out, (params.blacks / 100) * 0.07 + Math.max(0, -params.contrast / 100) * 0.025);
  }

  return clamp01(out);
};

const applyHslMixer = (hsl: Hsl, params: LightroomParams, skinWeight: number) => {
  let hueShift = 0;
  let satShift = 0;
  let lumShift = 0;
  let totalWeight = 0;

  for (const range of HSL_RANGES) {
    const weight = channelWeight(hsl.h, range.center, range.width) * hsl.s;
    if (weight <= 0) continue;

    const hueKey = `hue${range.name}` as keyof LightroomParams;
    const satKey = `sat${range.name}` as keyof LightroomParams;
    const lumKey = `lum${range.name}` as keyof LightroomParams;

    hueShift += (params[hueKey] as number) * 0.55 * weight;
    satShift += (params[satKey] as number) * 0.006 * weight;
    lumShift += (params[lumKey] as number) * 0.0048 * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return hsl;

  const normalized = Math.min(1, totalWeight);
  const skinGuard = 1 - skinWeight * 0.72;

  return {
    h: hsl.h + hueShift * skinGuard,
    s: clamp01(hsl.s + satShift * normalized * skinGuard),
    l: clamp01(hsl.l + lumShift * normalized),
  };
};

export function renderGradedCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  params: LightroomParams
) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;

  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#09090b";
  context.fillRect(0, 0, width, height);

  const rect = getContainRect(image.naturalWidth, image.naturalHeight, width, height);
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height);

  const imageData = context.getImageData(rect.x, rect.y, rect.width, rect.height);
  const { data } = imageData;
  const analysis = analyzeImage(data);
  const autoEv = clamp((0.52 - analysis.meanLuma) * 0.9, -0.22, 0.26);
  const gray = (analysis.red + analysis.green + analysis.blue) / 3 || 1;
  const neutralStrength = 0.08;

  const temp = params.temp / 100;
  const tint = params.tint / 100;
  const vibrance = params.vibrance / 100;
  const saturation = params.saturation / 100;
  const clarity = params.clarity / 100;
  const dehaze = params.dehaze / 100;

  const redGain = lerp(1, gray / Math.max(analysis.red, 0.001), neutralStrength) * (1 + temp * 0.13 + tint * 0.035);
  const greenGain = lerp(1, gray / Math.max(analysis.green, 0.001), neutralStrength) * (1 - tint * 0.08);
  const blueGain = lerp(1, gray / Math.max(analysis.blue, 0.001), neutralStrength) * (1 - temp * 0.16 + tint * 0.035);

  for (let y = 0; y < rect.height; y++) {
    const ny = y / Math.max(1, rect.height - 1);
    for (let x = 0; x < rect.width; x++) {
      const nx = x / Math.max(1, rect.width - 1);
      const i = (y * rect.width + x) * 4;

      let r = (data[i] / 255) * redGain;
      let g = (data[i + 1] / 255) * greenGain;
      let b = (data[i + 2] / 255) * blueGain;

      const sourceLuma = clamp01(0.2126 * r + 0.7152 * g + 0.0722 * b);

      r = toneMap(r, sourceLuma, params, autoEv);
      g = toneMap(g, sourceLuma, params, autoEv);
      b = toneMap(b, sourceLuma, params, autoEv);

      let hsl = rgbToHsl(r, g, b);
      const skinWeight =
        smoothstep(8, 24, hsl.h) *
        (1 - smoothstep(58, 82, hsl.h)) *
        smoothstep(0.14, 0.36, hsl.s) *
        (1 - smoothstep(0.78, 0.98, hsl.l));

      hsl = applyHslMixer(hsl, params, skinWeight);

      const vibranceWeight = 1 - hsl.s;
      hsl.s = clamp01(hsl.s * (1 + saturation * 0.72 + vibrance * 0.72 * vibranceWeight));
      hsl.l = clamp01(hsl.l + skinWeight * 0.035 + Math.max(0, -clarity) * 0.018 * smoothstep(0.2, 0.72, hsl.l));

      const rgb = hslToRgb(hsl);
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;

      const newLuma = clamp01(0.2126 * r + 0.7152 * g + 0.0722 * b);
      const localContrast = 1 + clarity * 0.22 + dehaze * 0.16;
      r = clamp01(newLuma + (r - newLuma) * localContrast);
      g = clamp01(newLuma + (g - newLuma) * localContrast);
      b = clamp01(newLuma + (b - newLuma) * localContrast);

      const highlightGlow = smoothstep(0.72, 1, newLuma) * Math.max(0, -params.highlights / 100) * 0.055;
      r = clamp01(r + highlightGlow * (1 + Math.max(0, temp) * 0.35));
      g = clamp01(g + highlightGlow * 0.92);
      b = clamp01(b + highlightGlow * (1 + Math.max(0, -temp) * 0.35));

      const dx = nx - 0.5;
      const dy = ny - 0.5;
      const vignette = clamp01(1 - (dx * dx + dy * dy) * (0.18 + Math.max(0, params.dehaze) / 100 * 0.1));
      r *= vignette;
      g *= vignette;
      b *= vignette;

      const grainAmount = 0.006 + Math.max(0, Math.abs(params.clarity) + Math.abs(params.dehaze)) / 100 * 0.006;
      const grain = (seededNoise(x, y) - 0.5) * grainAmount * (1 - smoothstep(0.75, 1, newLuma));
      r = clamp01(r + grain);
      g = clamp01(g + grain);
      b = clamp01(b + grain);

      data[i] = Math.round(r * 255);
      data[i + 1] = Math.round(g * 255);
      data[i + 2] = Math.round(b * 255);
    }
  }

  context.putImageData(imageData, rect.x, rect.y);
}
