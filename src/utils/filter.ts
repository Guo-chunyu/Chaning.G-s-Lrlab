/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LightroomParams } from "../types";

export function getCssFilter(params: LightroomParams): string {
  // Translate standard Lightroom ranges (-100 to 100) to web CSS filter properties
  
  // Fake highlights/shadows/whites/blacks using exposure/contrast combinations
  // Since CSS filters are limited, we map these to brightness and contrast offsets
  const shadowBoost = (params.shadows || 0) * 0.002 + (params.parametricShadows || 0) * 0.002;
  const highlightBoost = (params.highlights || 0) * 0.002 + (params.parametricHighlights || 0) * 0.002;
  const whiteBoost = (params.whites || 0) * 0.0025;
  const blackBoost = (params.blacks || 0) * 0.0025;
  const midBoost = (params.parametricDarks || 0) * 0.001 + (params.parametricLights || 0) * 0.001;

  // Exposure: -100 to 100 -> brightness multiplier (0.4 to 1.8)
  const exposureMultiplier = 1 + (params.exposure / 100) * 0.45 + shadowBoost + highlightBoost + whiteBoost + blackBoost + midBoost;
  
  // Contrast: -100 to 100 -> contrast multiplier (0.5 to 1.8)
  const contrastBoost = ((params.whites || 0) - (params.blacks || 0) + (params.highlights || 0) - (params.shadows || 0)) * 0.001;
  const contrastMultiplier = 1 + (params.contrast / 100) * 0.6 + contrastBoost;
  
  // Saturation: -100 to 100 -> saturate multiplier (0 to 2)
  const saturationMultiplier = Math.max(0, 1 + (params.saturation / 100));
  
  // Vibrance: -100 to 100 -> softer saturate effect (0.4 to 1.5)
  const vibranceMultiplier = 1 + (params.vibrance / 100) * 0.5;
  const combinedSaturate = saturationMultiplier * (1 + (vibranceMultiplier - 1) * 0.3);

  // Clarity / Dehaze: Adds a sharpness/depth boost
  const clarityBonus = params.clarity > 0 ? (params.clarity / 100) * 0.15 : (params.clarity / 100) * 0.1;
  const dehazeHazeModifier = params.dehaze > 0 ? -(params.dehaze / 100) * 0.1 : -(params.dehaze / 100) * 0.1;

  // Additional saturation logic based on HSL (simplified to general CSS filter mapping for web preview)
  let generalHslSaturateBoost = 0;
  let generalHslLightnessBoost = 0;
  const hslColors = ['Red', 'Orange', 'Yellow', 'Green', 'Aqua', 'Blue', 'Purple', 'Magenta'] as const;
  for (const color of hslColors) {
    const s = params[`sat${color}` as keyof LightroomParams] as number || 0;
    const l = params[`lum${color}` as keyof LightroomParams] as number || 0;
    generalHslSaturateBoost += s / 1500;
    generalHslLightnessBoost += l / 1500;
  }

  // Construct filters
  let filterStr = "";
  filterStr += `brightness(${Math.max(0.05, exposureMultiplier + dehazeHazeModifier + generalHslLightnessBoost)}) `;
  filterStr += `contrast(${Math.max(0.1, contrastMultiplier + clarityBonus)}) `;
  filterStr += `saturate(${Math.max(0, combinedSaturate + generalHslSaturateBoost)}) `;

  // Temperature
  if (params.temp > 0) {
    const sepiaStrength = (params.temp / 100) * 0.45;
    filterStr += `sepia(${sepiaStrength}) saturate(1.1) `;
  } else if (params.temp < 0) {
    const coolStrength = Math.abs(params.temp) / 100;
    // adding blue/cool feel
    filterStr += `hue-rotate(${-coolStrength * 12}deg) saturate(${1 - coolStrength * 0.12}) `;
  }

  // Tint
  if (params.tint !== 0) {
    const tintAngle = (params.tint / 100) * 18;
    filterStr += `hue-rotate(${tintAngle}deg) `;
  }
  
  // Basic HSL Color mapping effect simulation (via hue rotate & sepia tricks)
  if (params.hueBlue && params.hueBlue < -20) {
    // Teal oranges!
    filterStr += `hue-rotate(-10deg) saturate(1.1) `;
  } else if (params.hueBlue && params.hueBlue > 20) {
    filterStr += `hue-rotate(5deg) `;
  }

  if (params.hueGreen && params.hueGreen < -20) {
    filterStr += `hue-rotate(-5deg) saturate(0.95) `;
  }

  return filterStr.trim();
}

// Default neutral slider values
export const DEFAULT_PARAMS: LightroomParams = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temp: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  clarity: 0,
  dehaze: 0,

  // HSL defaults
  hueRed: 0, hueOrange: 0, hueYellow: 0, hueGreen: 0, hueAqua: 0, hueBlue: 0, huePurple: 0, hueMagenta: 0,
  satRed: 0, satOrange: 0, satYellow: 0, satGreen: 0, satAqua: 0, satBlue: 0, satPurple: 0, satMagenta: 0,
  lumRed: 0, lumOrange: 0, lumYellow: 0, lumGreen: 0, lumAqua: 0, lumBlue: 0, lumPurple: 0, lumMagenta: 0,

  // Tone Curve
  parametricShadows: 0, parametricDarks: 0, parametricLights: 0, parametricHighlights: 0
};

export interface Preset {
  id: string;
  name: string;
  tag: string;
  description: string;
  category: "胶片模拟 (Film)" | "电影叙事 (Cinematic)" | "风光自然 (Landscape)" | "商业人像 (Portrait)" | "黑白与光影 (Monochrome)" | "相机色彩科学 (Camera Brands)";
  color: string;
  params: LightroomParams;
}

export const STYLE_PRESETS: Preset[] = [
  // CATEGORY: 胶片模拟 (Film)
  {
    id: "film-kodak-portra-400",
    name: "Kodak Portra 400",
    tag: "柔和人像胶卷",
    description: "经典的柯达人像胶片，肤色温暖，对比度柔和，高光极具空气感。",
    category: "胶片模拟 (Film)",
    color: "amber",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 10, contrast: -15, highlights: -35, shadows: 25, whites: -10, blacks: 15,
      temp: 15, tint: 5, vibrance: 12, saturation: -5, clarity: -10,
      hueRed: 5, hueOrange: -5, hueYellow: -10,
      satRed: 5, satOrange: 10, satYellow: 15,
      lumRed: 5, lumOrange: 10, lumYellow: 5
    }
  },
  {
    id: "film-fuji-pro-400h",
    name: "Fuji Pro 400H",
    tag: "清新冷调胶卷",
    description: "富士特有的青绿阴影与柔和偏蓝的高光，日系写真的经典选择。",
    category: "胶片模拟 (Film)",
    color: "emerald",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 15, contrast: -20, highlights: -40, shadows: 35, whites: -15, blacks: 20,
      temp: -8, tint: 12, vibrance: 15, saturation: -12, clarity: -15,
      hueGreen: 15, hueBlue: -10,
      satGreen: -20, satBlue: -10,
      lumGreen: 10, lumBlue: 15
    }
  },
  {
    id: "film-kodak-gold-200",
    name: "Kodak Gold 200",
    tag: "复古暖阳",
    description: "强烈的黄色与温暖反差，浓郁的街头扫街生活感。",
    category: "胶片模拟 (Film)",
    color: "yellow",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 5, contrast: 10, highlights: -25, shadows: 15, whites: 5, blacks: -5,
      temp: 25, tint: 2, vibrance: 25, saturation: 5, clarity: -5,
      hueYellow: -15, hueOrange: -8,
      satYellow: 25, satOrange: 20,
      lumYellow: 15, lumOrange: 5
    }
  },
  {
    id: "film-cinestill-800t",
    name: "CineStill 800T",
    tag: "夜景钨丝灯",
    description: "电影灯光胶片，特有的光晕与青蓝基调，极适合红蓝霓虹夜景。",
    category: "胶片模拟 (Film)",
    color: "cyan",
    params: {
      ...DEFAULT_PARAMS,
      exposure: -5, contrast: 20, highlights: 15, shadows: 5, whites: 10, blacks: 5,
      temp: -30, tint: 10, vibrance: 20, saturation: -5, clarity: 12,
      hueRed: 20, hueBlue: -15,
      satRed: 35, satBlue: -20,
      lumRed: 15, lumBlue: 5
    }
  },
  {
    id: "film-agfa-vista",
    name: "Agfa Vista 100",
    tag: "红色偏执",
    description: "浓墨重彩，对红色极其敏感且饱和度奇高。",
    category: "胶片模拟 (Film)",
    color: "red",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 0, contrast: 15, highlights: -10, shadows: 10, whites: 0, blacks: -10,
      temp: 5, tint: 0, vibrance: 30, saturation: 10, clarity: 5,
      hueRed: -10, hueGreen: 5,
      satRed: 40, satGreen: -10,
      lumRed: -5, lumGreen: 5
    }
  },
  {
    id: "film-ilford-hp5",
    name: "Ilford HP5 Plus",
    tag: "经典纪实黑白",
    description: "极具年代感的经典新闻黑白胶卷，温和的灰阶过渡。",
    category: "胶片模拟 (Film)",
    color: "slate",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 5, contrast: 25, highlights: -20, shadows: 20, whites: 10, blacks: 15,
      temp: 0, tint: 0, vibrance: -100, saturation: -100, clarity: 8,
      lumRed: 10, lumOrange: 15, lumBlue: -10
    }
  },

  // CATEGORY: 电影叙事 (Cinematic)
  {
    id: "cine-teal-orange",
    name: "青橙好莱坞 (Teal & Orange)",
    tag: "商业大片",
    description: "最经典的好莱坞互补色：冷调的青蓝暗部与温暖的橙黄高光及肤色。",
    category: "电影叙事 (Cinematic)",
    color: "orange",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 0, contrast: 20, highlights: -25, shadows: 15, whites: -5, blacks: -15,
      temp: 8, tint: 0, vibrance: 25, saturation: -10, clarity: 15, dehaze: 5,
      hueOrange: -5, hueBlue: -25, hueAqua: 15,
      satOrange: 15, satBlue: 25, satAqua: 30,
      lumOrange: 10, lumBlue: -15
    }
  },
  {
    id: "cine-matrix-green",
    name: "赛博矩阵骇客 (Matrix Noir)",
    tag: "科幻暗绿",
    description: "令人不安的绿色偏置，压抑的高反差，展现赛博朋克与科幻感。",
    category: "电影叙事 (Cinematic)",
    color: "green",
    params: {
      ...DEFAULT_PARAMS,
      exposure: -15, contrast: 30, highlights: -15, shadows: -10, whites: 5, blacks: -25,
      temp: -5, tint: -35, vibrance: 10, saturation: -20, clarity: 25, dehaze: 15,
      hueGreen: 20, hueYellow: 15,
      satGreen: 40, satYellow: -20,
      lumGreen: -10, lumRed: -30
    }
  },
  {
    id: "cine-moody-dark",
    name: "哥谭暗黑夜 (Gotham Moody Night)",
    tag: "低光调",
    description: "极低的亮度，压印细节，强调暗部层次，适合雨夜与黑暗都市风格。",
    category: "电影叙事 (Cinematic)",
    color: "zinc",
    params: {
      ...DEFAULT_PARAMS,
      exposure: -35, contrast: 25, highlights: -40, shadows: 15, whites: -20, blacks: -10,
      temp: -10, tint: -5, vibrance: 5, saturation: -35, clarity: 20, dehaze: 10,
      satBlue: -30, satOrange: -10
    }
  },
  {
    id: "cine-wes-anderson",
    name: "布达佩斯之秋 (Wes Symmetry)",
    tag: "复古糖果色",
    description: "低对比，高光柔和，大量使用粉红、暖黄、明黄等糖果般干净的色组。",
    category: "电影叙事 (Cinematic)",
    color: "pink",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 15, contrast: -25, highlights: -40, shadows: 40, whites: 10, blacks: 25,
      temp: 15, tint: 15, vibrance: 35, saturation: -5, clarity: -15,
      hueYellow: 15, hueRed: 10, hueMagenta: 20,
      satYellow: 10, satRed: 15, satMagenta: 25,
      lumYellow: 20, lumRed: 10, lumBlue: 25
    }
  },
  {
    id: "cine-dune-sand",
    name: "香料厄拉科斯 (Dune Scifi Warm)",
    tag: "史诗废土",
    description: "几乎剥离一切蓝绿，只留漫天黄沙般的赭石、琥珀及深棕色。",
    category: "电影叙事 (Cinematic)",
    color: "yellow",
    params: {
      ...DEFAULT_PARAMS,
      exposure: -5, contrast: 15, highlights: -10, shadows: 10, whites: -5, blacks: 5,
      temp: 40, tint: 12, vibrance: -15, saturation: -25, clarity: 18, dehaze: 12,
      hueBlue: 0, hueGreen: 0,
      satBlue: -80, satGreen: -70, satAqua: -80, satOrange: 15,
      lumOrange: -5
    }
  },
  {
    id: "cine-tarantino-blood",
    name: "昆汀暴力美学 (Retro Blood)",
    tag: "浓郁高反差",
    description: "炙热艳丽的红黄色块，胶片颗粒感十足的光影暴力。",
    category: "电影叙事 (Cinematic)",
    color: "red",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 5, contrast: 35, highlights: 15, shadows: -20, whites: 10, blacks: -25,
      temp: 12, tint: -5, vibrance: 40, saturation: 15, clarity: 20,
      satRed: 30, satYellow: 20,
      lumRed: -10
    }
  },

  // CATEGORY: 风光自然 (Landscape)
  {
    id: "land-nordic-mist",
    name: "冰岛苔原冷雾 (Icelandic Moss)",
    tag: "低反差冷风光",
    description: "轻压暗部，将绿色推向冷灰调，模拟高纬度无阳光直射的冷峻壮美。",
    category: "风光自然 (Landscape)",
    color: "slate",
    params: {
      ...DEFAULT_PARAMS,
      exposure: -10, contrast: 5, highlights: -35, shadows: 25, whites: -15, blacks: 0,
      temp: -25, tint: -5, vibrance: 10, saturation: -25, clarity: 20, dehaze: 10,
      hueGreen: 25, hueYellow: 15,
      satGreen: -35, satYellow: -25, satBlue: -10,
      lumGreen: -10, lumBlue: 5
    }
  },
  {
    id: "land-autumn-rust",
    name: "优胜美地之秋 (Autumn Rust)",
    tag: "暖秋层林",
    description: "强化红橙黄色的分离，将绿叶染上金黄，凸显秋日英姿。",
    category: "风光自然 (Landscape)",
    color: "orange",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 5, contrast: 15, highlights: -25, shadows: 15, whites: 10, blacks: -10,
      temp: 18, tint: 8, vibrance: 30, saturation: -5, clarity: 15, dehaze: 5,
      hueGreen: -35, hueYellow: -15,
      satOrange: 25, satYellow: 20, satGreen: -10,
      lumOrange: 10, lumYellow: 5
    }
  },
  {
    id: "land-alpine-clear",
    name: "阿尔卑斯极清 (Alpine Clear)",
    tag: "纯净高解析",
    description: "大幅去除画面雾霾，纯化蓝天与雪山的反差，色调明快锐利。",
    category: "风光自然 (Landscape)",
    color: "blue",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 0, contrast: 25, highlights: -30, shadows: -5, whites: 20, blacks: -15,
      temp: -5, tint: 0, vibrance: 25, saturation: 5, clarity: 25, dehaze: 30,
      hueBlue: -5,
      satBlue: 35, satAqua: 20,
      lumBlue: -15
    }
  },
  {
    id: "land-golden-sunset",
    name: "加州日落公路 (California Sunset)",
    tag: "壮丽逆光",
    description: "提升暗部细节展现逆光前景，天空部分的橙黄与洋红推至极限暖光。",
    category: "风光自然 (Landscape)",
    color: "amber",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 15, contrast: 10, highlights: -50, shadows: 45, whites: -10, blacks: 15,
      temp: 35, tint: 15, vibrance: 35, saturation: 10, clarity: 10, dehaze: 15,
      hueOrange: -10, hueYellow: -15,
      satOrange: 30, satRed: 20, satYellow: 25,
      lumOrange: 15
    }
  },
  {
    id: "land-dark-forest",
    name: "霍格沃茨黑森林 (Dark Forest)",
    tag: "幽暗松林",
    description: "极致压抑的高光，深邃幽灵般的深绿色，充满神秘奇幻的自然质感。",
    category: "风光自然 (Landscape)",
    color: "emerald",
    params: {
      ...DEFAULT_PARAMS,
      exposure: -25, contrast: 20, highlights: -60, shadows: -10, whites: -30, blacks: -15,
      temp: -15, tint: -15, vibrance: 5, saturation: -30, clarity: 25, dehaze: 20,
      hueGreen: 20,
      satGreen: 10, satYellow: -50,
      lumGreen: -30
    }
  },

  // CATEGORY: 商业人像 (Portrait)
  {
    id: "port-vogue-editorial",
    name: "Vogue 杂志封面 (Editorial Clean)",
    tag: "高级灰商业",
    description: "极致干净的肤色处理，低饱和+高清晰，呈现时尚硬照的高级与通透。",
    category: "商业人像 (Portrait)",
    color: "zinc",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 8, contrast: 15, highlights: -25, shadows: 10, whites: 10, blacks: 5,
      temp: -5, tint: 2, vibrance: 10, saturation: -15, clarity: 8,
      hueOrange: 5, hueRed: 5,
      satOrange: -5, satRed: -10,
      lumOrange: 20, lumRed: 15
    }
  },
  {
    id: "port-korean-glow",
    name: "首尔水光肌 (K-Pop Glow)",
    tag: "明亮奶油肌",
    description: "大幅提亮，极弱的对比度与极柔和的清晰度，消除所有面部阴影的反差。",
    category: "商业人像 (Portrait)",
    color: "pink",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 25, contrast: -25, highlights: -50, shadows: 35, whites: -15, blacks: 30,
      temp: -2, tint: 8, vibrance: 20, saturation: -10, clarity: -25, dehaze: -5,
      satOrange: 10, satRed: 15,
      lumOrange: 30, lumRed: 20
    }
  },
  {
    id: "port-moody-brown",
    name: "法式焦糖摩卡 (Mocha Brown)",
    tag: "温暖治愈",
    description: "全局向棕色偏移，压抑蓝绿冷色，凸显秋冬慵懒、温暖与咖啡馆小资情调。",
    category: "商业人像 (Portrait)",
    color: "orange",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 5, contrast: 5, highlights: -30, shadows: 20, whites: -10, blacks: 10,
      temp: 20, tint: 5, vibrance: 15, saturation: -20, clarity: -10,
      hueGreen: -50, hueYellow: -30,
      satBlue: -60, satAqua: -50, satGreen: -40,
      lumOrange: 15, lumYellow: 10
    }
  },
  {
    id: "port-hongkong-neon",
    name: "王家卫港风 (HK Retro 90s)",
    tag: "浓郁港片",
    description: "强烈偏绿的阴影，温暖泛红的面部，高饱和加颗粒感，经典90年代港星气质。",
    category: "商业人像 (Portrait)",
    color: "red",
    params: {
      ...DEFAULT_PARAMS,
      exposure: -5, contrast: 25, highlights: -20, shadows: -10, whites: 10, blacks: -15,
      temp: 15, tint: -15, vibrance: 35, saturation: 10, clarity: 10,
      hueRed: -5, hueOrange: -10,
      satRed: 25, satOrange: 15,
      lumRed: -5, lumOrange: 5
    }
  },
  {
    id: "port-high-key",
    name: "纯白高调棚拍 (High Key Flash)",
    tag: "白皙闪光",
    description: "模拟影棚大功率闪光灯，背景几近纯白，人物肤色过度提亮。",
    category: "商业人像 (Portrait)",
    color: "white",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 35, contrast: -10, highlights: -10, shadows: 40, whites: 30, blacks: 25,
      temp: 0, tint: 0, vibrance: 15, saturation: -5, clarity: 5,
      lumOrange: 25, lumRed: 15, lumYellow: 20
    }
  },

  // CATEGORY: 黑白与光影 (Monochrome)
  {
    id: "mono-leica-m",
    name: "Leica Monochrom",
    tag: "极致德味灰阶",
    description: "模拟徕卡顶级黑白相机的极致宽容度与柔和阶调。",
    category: "黑白与光影 (Monochrome)",
    color: "slate",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 5, contrast: 10, highlights: -35, shadows: 35, whites: -15, blacks: 10,
      temp: 0, tint: 0, vibrance: -100, saturation: -100, clarity: 15,
      lumOrange: 20, lumBlue: -15, lumGreen: -5
    }
  },
  {
    id: "mono-high-contrast",
    name: "森山大道 (Contrast Noir)",
    tag: "极高反差",
    description: "废弃一切灰阶，只留极其暴力残忍的黑与白反差，压抑深邃。",
    category: "黑白与光影 (Monochrome)",
    color: "zinc",
    params: {
      ...DEFAULT_PARAMS,
      exposure: -15, contrast: 60, highlights: 15, shadows: -35, whites: 20, blacks: -50,
      temp: 0, tint: 0, vibrance: -100, saturation: -100, clarity: 40, dehaze: 20,
      lumRed: 10, lumBlue: -30
    }
  },
  {
    id: "mono-silver-gelatin",
    name: "银盐复古暗房 (Silver Gelatin)",
    tag: "柔焦老黑白",
    description: "极度柔软的焦内，模拟老式蔡司镜头与银盐反应的独特魅力。",
    category: "黑白与光影 (Monochrome)",
    color: "slate",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 15, contrast: -25, highlights: -40, shadows: 40, whites: -20, blacks: 35,
      temp: 10, tint: 0, vibrance: -100, saturation: -100, clarity: -25, dehaze: -10,
    }
  },
  {
    id: "mono-infra-red",
    name: "Aerochrome 红外线 (Infra-Red Mono)",
    tag: "超现实红外",
    description: "模拟红外摄影，使得一切绿色植物变得雪白发亮，天空一片漆黑。",
    category: "黑白与光影 (Monochrome)",
    color: "slate",
    params: {
      ...DEFAULT_PARAMS,
      exposure: -5, contrast: 35, highlights: -10, shadows: -15, whites: 15, blacks: -25,
      temp: 0, tint: 0, vibrance: -100, saturation: -100, clarity: 20,
      lumGreen: 80, lumYellow: 70, lumBlue: -80, lumAqua: -60
    }
  },

  // CATEGORY: 相机色彩科学 (Camera Brands)
  {
    id: "camera-sony-a7m4",
    name: "Sony A7M4 (Creative Look IN)",
    tag: "微反差通透",
    description: "索尼经典的 IN 创意外观，降低对比与饱和，提升暗部细节，日系空气感，对黄绿色进行特别分离处理。",
    category: "相机色彩科学 (Camera Brands)",
    color: "blue",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 15, contrast: -25, highlights: -25, shadows: 35, whites: -15, blacks: 20,
      temp: -5, tint: 5, vibrance: 15, saturation: -15, clarity: 15, dehaze: -5,
      hueYellow: 15, hueGreen: 10,
      satYellow: -20, satGreen: -15,
      lumYellow: 10, lumGreen: 15
    }
  },
  {
    id: "camera-canon-r10",
    name: "Canon R10 (Portrait)",
    tag: "佳能人像白里透红",
    description: "经典的佳能肤色科学，红色与橙色明度抬高，让亚洲肤色显得白皙且带有血气，高光柔和饱满。",
    category: "相机色彩科学 (Camera Brands)",
    color: "red",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 10, contrast: -10, highlights: -35, shadows: 20, whites: 5, blacks: 10,
      temp: 8, tint: 10, vibrance: 25, saturation: -5, clarity: -10,
      hueOrange: -5, hueRed: -5,
      satOrange: 15, satRed: 20, satYellow: -5,
      lumOrange: 25, lumRed: 20
    }
  },
  {
    id: "camera-hasselblad-x2d",
    name: "Hasselblad X2D (HNCS)",
    tag: "哈苏自然色彩",
    description: "极致平滑的影调过渡与中等偏低的饱和度，色彩极其准确真实，适合风光与高级商业人像。",
    category: "相机色彩科学 (Camera Brands)",
    color: "orange",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 0, contrast: 5, highlights: -20, shadows: 15, whites: 10, blacks: -10,
      temp: 0, tint: 2, vibrance: 10, saturation: -5, clarity: 10,
      lumOrange: 10, lumBlue: 5, lumGreen: 5
    }
  },
  {
    id: "camera-fuji-classic-chrome",
    name: "Fujifilm (Classic Chrome)",
    tag: "经典正片",
    description: "富士标志性的经典正片色彩，极低的色彩饱和度和较硬的暗部反差，呈现浓郁的纪实人文感。",
    category: "相机色彩科学 (Camera Brands)",
    color: "emerald",
    params: {
      ...DEFAULT_PARAMS,
      exposure: -5, contrast: 25, highlights: -15, shadows: -10, whites: 10, blacks: 15,
      temp: 5, tint: 5, vibrance: -5, saturation: -25, clarity: 15,
      hueRed: 10, hueGreen: 15, hueBlue: -15,
      satRed: -10, satBlue: -30, satAqua: -20,
      lumBlue: -15, lumAqua: -10
    }
  },
  {
    id: "camera-leica-m11",
    name: "Leica M11 (Standard)",
    tag: "徕卡暗角润泽",
    description: "浓郁的红色与清冷的蓝色对比，暗部下沉扎实，带来著名的“德味”立体感。",
    category: "相机色彩科学 (Camera Brands)",
    color: "red",
    params: {
      ...DEFAULT_PARAMS,
      exposure: -10, contrast: 30, highlights: -15, shadows: -20, whites: 15, blacks: -25,
      temp: -2, tint: -5, vibrance: 20, saturation: 5, clarity: 20, dehaze: 5,
      hueRed: 5, hueBlue: -5,
      satRed: 25, satBlue: 20, satGreen: -10,
      lumRed: -5, lumBlue: -10
    }
  },
  {
    id: "camera-panasonic-s5",
    name: "Panasonic S5 (V-Log Lut)",
    tag: "松下视频风",
    description: "松下视频机色彩质感，高光滚落曲线极具电影感，整体色彩偏向略带洋红调的灰度风格。",
    category: "相机色彩科学 (Camera Brands)",
    color: "pink",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 5, contrast: 15, highlights: -35, shadows: 25, whites: -20, blacks: 15,
      temp: 5, tint: 12, vibrance: -10, saturation: -20, clarity: 10,
      hueOrange: 5, hueYellow: 10,
      satOrange: -15, satYellow: -25,
      lumOrange: 15
    }
  },
  {
    id: "camera-nikon-z8",
    name: "Nikon Z8 (Landscape)",
    tag: "尼康风光锐利",
    description: "极其真实的黄绿色表现和深邃的蓝色天空，反差强烈且高解析度，被称为风光利器。",
    category: "相机色彩科学 (Camera Brands)",
    color: "yellow",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 0, contrast: 25, highlights: -25, shadows: 5, whites: 20, blacks: -15,
      temp: -5, tint: -2, vibrance: 30, saturation: 10, clarity: 25, dehaze: 10,
      hueGreen: -5, hueBlue: 5,
      satGreen: 30, satYellow: 25, satBlue: 30,
      lumGreen: 5, lumBlue: -5
    }
  },
  {
    id: "camera-olympus-pen-f",
    name: "Olympus PEN-F (Color Profile 2)",
    tag: "奥巴复古直出",
    description: "独特的机内色彩设定，高宽容度与复古蓝绿色调分离，带有精致的小资产阶级街拍风味。",
    category: "相机色彩科学 (Camera Brands)",
    color: "cyan",
    params: {
      ...DEFAULT_PARAMS,
      exposure: 5, contrast: 10, highlights: -20, shadows: 20, whites: 5, blacks: 10,
      temp: -8, tint: 5, vibrance: 25, saturation: 5, clarity: 15,
      hueBlue: -15, hueAqua: 15,
      satBlue: 25, satRed: 15,
      lumBlue: 10
    }
  }
];

