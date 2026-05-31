const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const regex = /function getOfflineSimulation\(filename: string\) \{[\s\S]*?\} else \{[\s\S]*?\}\s*\}/;

const newImplementation = `function getOfflineSimulation(filename: string) {
    const defaultParams = {
      exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, temp: 0, tint: 0, vibrance: 0, saturation: 0, clarity: 0, dehaze: 0,
      hueRed: 0, hueOrange: 0, hueYellow: 0, hueGreen: 0, hueAqua: 0, hueBlue: 0, huePurple: 0, hueMagenta: 0,
      satRed: 0, satOrange: 0, satYellow: 0, satGreen: 0, satAqua: 0, satBlue: 0, satPurple: 0, satMagenta: 0,
      lumRed: 0, lumOrange: 0, lumYellow: 0, lumGreen: 0, lumAqua: 0, lumBlue: 0, lumPurple: 0, lumMagenta: 0,
      parametricShadows: 0, parametricDarks: 0, parametricLights: 0, parametricHighlights: 0
    };

    const fn = filename.toLowerCase();
    
    let recs = [];
    if (fn.includes("portrait") || fn.includes("face") || fn.includes("human")) {
      recs = [
        {
          styleName: "Vogue Portra Warmth",
          reasoning: "A clean portrait grade that emphasizes flattering skin tones, softens harsh highlights by -25, boosts shadows by +30 for facial detail, and uses +15 warming temperature to enhance melanin glow.",
          parameters: { ...defaultParams, exposure: 5, contrast: -8, highlights: -25, shadows: 30, whites: -5, blacks: 12, temp: 18, tint: 6, vibrance: 12, saturation: -8, clarity: -10, dehaze: 2, parametricDarks: 10, parametricLights: -5 }
        },
        {
          styleName: "Cinematic Cold Editorial",
          reasoning: "A cool, high-fashion editorial look with teal shadows and strong contrast, crushing the blacks while lifting the highlights.",
          parameters: { ...defaultParams, exposure: 0, contrast: 20, highlights: 15, shadows: -15, whites: 10, blacks: -20, temp: -15, tint: 10, vibrance: -5, saturation: -15, clarity: 15, dehaze: 5, hueBlue: -10, satBlue: 20, parametricShadows: -15 }
        }
      ];
    } else if (fn.includes("nature") || fn.includes("landscape") || fn.includes("forest") || fn.includes("outdoor")) {
      recs = [
        {
          styleName: "Pacific Pine Mist",
          reasoning: "Boosted greens and shadows to draw out structural needles. Low contrast and increased clarity enhance physical fog detail, while a cool template tints highlights into desaturated teal tones.",
          parameters: { ...defaultParams, exposure: -5, contrast: 15, highlights: -35, shadows: 20, whites: -15, blacks: -10, temp: -12, tint: -8, vibrance: 25, saturation: -5, clarity: 18, dehaze: 10, hueGreen: 10, satGreen: 15, parametricHighlights: -20 }
        },
        {
          styleName: "Autumn Golden Hour",
          reasoning: "Enhances autumnal tones by pushing warmth, lifting shadows natively, and increasing luminance of yellows and oranges.",
          parameters: { ...defaultParams, exposure: 10, contrast: 5, highlights: -20, shadows: 35, whites: -10, blacks: 5, temp: 25, tint: 5, vibrance: 20, saturation: 10, clarity: 5, dehaze: -5, hueYellow: -15, satOrange: 15, lumOrange: 15, parametricLights: 10 }
        }
      ];
    } else {
      recs = [
        {
          styleName: "Nordic Minimalist Slate",
          reasoning: "A high-end minimalist grade featuring a cool color temperature bias, soft ambient contrast (+10), pulled-back high highlights to prevent blowouts, and a slightly muted desaturation (-12) for an elegant editorial look.",
          parameters: { ...defaultParams, exposure: 4, contrast: 10, highlights: -20, shadows: 15, whites: -8, blacks: 5, temp: -10, tint: 2, vibrance: 10, saturation: -12, clarity: 5, dehaze: 3, parametricDarks: 5, parametricShadows: 10 }
        },
        {
          styleName: "Classic Fuji Superia",
          reasoning: "Replicates Fuji color science with a hint of green tint, bright airy exposure, and deep rich colors without being overwhelming.",
          parameters: { ...defaultParams, exposure: 15, contrast: -10, highlights: -15, shadows: 25, whites: -15, blacks: 10, temp: -5, tint: 15, vibrance: 15, saturation: 5, clarity: -10, dehaze: 0, hueGreen: 10, satGreen: -10, parametricHighlights: -10 }
        }
      ];
    }
    
    return { recommendations: recs };
  }`;

code = code.replace(regex, newImplementation);
fs.writeFileSync('server.ts', code);
console.log('patched getOfflineSimulation');
