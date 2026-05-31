const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const paramsObjStr = `{
                  exposure: { type: Type.INTEGER, description: "Exposure from -100 to 100" },
                  contrast: { type: Type.INTEGER, description: "Contrast from 0 to 100" },
                  highlights: { type: Type.INTEGER, description: "Highlights from -100 to 100" },
                  shadows: { type: Type.INTEGER, description: "Shadows from -100 to 100" },
                  whites: { type: Type.INTEGER, description: "Whites from -100 to 100" },
                  blacks: { type: Type.INTEGER, description: "Blacks from -100 to 100" },
                  temp: { type: Type.INTEGER, description: "Temperature from -100 to 100" },
                  tint: { type: Type.INTEGER, description: "Tint from -100 to 100" },
                  vibrance: { type: Type.INTEGER, description: "Vibrance from -100 to 100" },
                  saturation: { type: Type.INTEGER, description: "Saturation from -100 to 100" },
                  clarity: { type: Type.INTEGER, description: "Clarity from -100 to 100" },
                  dehaze: { type: Type.INTEGER, description: "Dehaze from -100 to 100" },
                  hueRed: { type: Type.INTEGER, description: "Hue Red -100 to 100" },
                  hueOrange: { type: Type.INTEGER, description: "Hue Orange -100 to 100" },
                  hueYellow: { type: Type.INTEGER, description: "Hue Yellow -100 to 100" },
                  hueGreen: { type: Type.INTEGER, description: "Hue Green -100 to 100" },
                  hueAqua: { type: Type.INTEGER, description: "Hue Aqua -100 to 100" },
                  hueBlue: { type: Type.INTEGER, description: "Hue Blue -100 to 100" },
                  huePurple: { type: Type.INTEGER, description: "Hue Purple -100 to 100" },
                  hueMagenta: { type: Type.INTEGER, description: "Hue Magenta -100 to 100" },
                  satRed: { type: Type.INTEGER, description: "Sat Red -100 to 100" },
                  satOrange: { type: Type.INTEGER, description: "Sat Orange -100 to 100" },
                  satYellow: { type: Type.INTEGER, description: "Sat Yellow -100 to 100" },
                  satGreen: { type: Type.INTEGER, description: "Sat Green -100 to 100" },
                  satAqua: { type: Type.INTEGER, description: "Sat Aqua -100 to 100" },
                  satBlue: { type: Type.INTEGER, description: "Sat Blue -100 to 100" },
                  satPurple: { type: Type.INTEGER, description: "Sat Purple -100 to 100" },
                  satMagenta: { type: Type.INTEGER, description: "Sat Magenta -100 to 100" },
                  lumRed: { type: Type.INTEGER, description: "Lum Red -100 to 100" },
                  lumOrange: { type: Type.INTEGER, description: "Lum Orange -100 to 100" },
                  lumYellow: { type: Type.INTEGER, description: "Lum Yellow -100 to 100" },
                  lumGreen: { type: Type.INTEGER, description: "Lum Green -100 to 100" },
                  lumAqua: { type: Type.INTEGER, description: "Lum Aqua -100 to 100" },
                  lumBlue: { type: Type.INTEGER, description: "Lum Blue -100 to 100" },
                  lumPurple: { type: Type.INTEGER, description: "Lum Purple -100 to 100" },
                  lumMagenta: { type: Type.INTEGER, description: "Lum Magenta -100 to 100" },
                  parametricShadows: { type: Type.INTEGER, description: "Tone Curve Shadows -100 to 100" },
                  parametricDarks: { type: Type.INTEGER, description: "Tone Curve Darks -100 to 100" },
                  parametricLights: { type: Type.INTEGER, description: "Tone Curve Lights -100 to 100" },
                  parametricHighlights: { type: Type.INTEGER, description: "Tone Curve Highlights -100 to 100" }
                }`;

const requiredArrStr = `["exposure", "contrast", "highlights", "shadows", "whites", "blacks", "temp", "tint", "vibrance", "saturation", "clarity", "dehaze", "hueRed", "hueOrange", "hueYellow", "hueGreen", "hueAqua", "hueBlue", "huePurple", "hueMagenta", "satRed", "satOrange", "satYellow", "satGreen", "satAqua", "satBlue", "satPurple", "satMagenta", "lumRed", "lumOrange", "lumYellow", "lumGreen", "lumAqua", "lumBlue", "lumPurple", "lumMagenta", "parametricShadows", "parametricDarks", "parametricLights", "parametricHighlights"]`;

const replacement1 = `responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                description: "Provide exactly 3 distinct color grading recommendations for this image, ranked by suitability.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    styleName: { type: Type.STRING, description: "Modern name of the color style matching the picture." },
                    reasoning: { type: Type.STRING, description: "A concise professional analysis describing why this grading recommendation works well." },
                    parameters: {
                      type: Type.OBJECT,
                      properties: ` + paramsObjStr + `,
                      required: ` + requiredArrStr + `
                    }
                  },
                  required: ["styleName", "reasoning", "parameters"]
                }
              }
            },
            required: ["recommendations"]
          }`;

code = code.replace(/responseSchema:\s*\{\s*type: Type\.OBJECT,\s*properties: \{\s*styleName:[\s\S]*?required: \["styleName", "reasoning", "parameters"\]\s*\}/, replacement1);

const replacement2 = `responseSchema: {
            type: Type.OBJECT,
            properties: {
              styleName: { type: Type.STRING, description: "Artistic style theme name derived from user's custom prompt." },
              reasoning: { type: Type.STRING, description: "A tailored reasoning for why the sliders map to the prompt." },
              parameters: {
                type: Type.OBJECT,
                properties: ` + paramsObjStr + `,
                required: ` + requiredArrStr + `
              }
            },
            required: ["styleName", "reasoning", "parameters"]
          }`;

code = code.replace(/responseSchema:\s*\{\s*type: Type\.OBJECT,\s*properties: \{\s*styleName: \{ type: Type\.STRING, description: "Artistic style theme name derived[\s\S]*?required: \["styleName", "reasoning", "parameters"\]\s*\}/, replacement2);

fs.writeFileSync('server.ts', code);
console.log('Done!');
