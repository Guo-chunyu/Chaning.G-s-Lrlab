import * as fs from "fs";

let code = fs.readFileSync("server.ts", "utf8");

const paramsObjStr = `{
                  exposure: { type: Type.INTEGER, description: "Exposure offset from -100 to 100 where 0 is neutral. Map -100 to -3EV, and +100 to +3EV." },
                  contrast: { type: Type.INTEGER, description: "Lightroom contrast slider from -100 to 100." },
                  highlights: { type: Type.INTEGER, description: "Highlights slider from -100 to 100." },
                  shadows: { type: Type.INTEGER, description: "Shadows slider from -100 to 100." },
                  whites: { type: Type.INTEGER, description: "Whites slider from -100 to 100." },
                  blacks: { type: Type.INTEGER, description: "Blacks slider from -100 to 100." },
                  temp: { type: Type.INTEGER, description: "Temperature slider from -100 (Extremely Cool - Blue) to 100 (Extremely Warm - Amber)." },
                  tint: { type: Type.INTEGER, description: "Tint slider from -100 (Green) to 100 (Magenta)." },
                  vibrance: { type: Type.INTEGER, description: "Vibrance slider from -100 to 100." },
                  saturation: { type: Type.INTEGER, description: "Saturation slider from -100 to 100." },
                  clarity: { type: Type.INTEGER, description: "Clarity slider from -100 to 100." },
                  dehaze: { type: Type.INTEGER, description: "Dehaze slider from -100 to 100." },
                  hueRed: { type: Type.INTEGER, description: "Hue Red -100 to 100." },
                  hueOrange: { type: Type.INTEGER, description: "Hue Orange -100 to 100." },
                  hueYellow: { type: Type.INTEGER, description: "Hue Yellow -100 to 100." },
                  hueGreen: { type: Type.INTEGER, description: "Hue Green -100 to 100." },
                  hueAqua: { type: Type.INTEGER, description: "Hue Aqua -100 to 100." },
                  hueBlue: { type: Type.INTEGER, description: "Hue Blue -100 to 100." },
                  huePurple: { type: Type.INTEGER, description: "Hue Purple -100 to 100." },
                  hueMagenta: { type: Type.INTEGER, description: "Hue Magenta -100 to 100." },
                  satRed: { type: Type.INTEGER, description: "Sat Red -100 to 100." },
                  satOrange: { type: Type.INTEGER, description: "Sat Orange -100 to 100." },
                  satYellow: { type: Type.INTEGER, description: "Sat Yellow -100 to 100." },
                  satGreen: { type: Type.INTEGER, description: "Sat Green -100 to 100." },
                  satAqua: { type: Type.INTEGER, description: "Sat Aqua -100 to 100." },
                  satBlue: { type: Type.INTEGER, description: "Sat Blue -100 to 100." },
                  satPurple: { type: Type.INTEGER, description: "Sat Purple -100 to 100." },
                  satMagenta: { type: Type.INTEGER, description: "Sat Magenta -100 to 100." },
                  lumRed: { type: Type.INTEGER, description: "Lum Red -100 to 100." },
                  lumOrange: { type: Type.INTEGER, description: "Lum Orange -100 to 100." },
                  lumYellow: { type: Type.INTEGER, description: "Lum Yellow -100 to 100." },
                  lumGreen: { type: Type.INTEGER, description: "Lum Green -100 to 100." },
                  lumAqua: { type: Type.INTEGER, description: "Lum Aqua -100 to 100." },
                  lumBlue: { type: Type.INTEGER, description: "Lum Blue -100 to 100." },
                  lumPurple: { type: Type.INTEGER, description: "Lum Purple -100 to 100." },
                  lumMagenta: { type: Type.INTEGER, description: "Lum Magenta -100 to 100." },
                  parametricShadows: { type: Type.INTEGER, description: "Parametric Shadows -100 to 100." },
                  parametricDarks: { type: Type.INTEGER, description: "Parametric Darks -100 to 100." },
                  parametricLights: { type: Type.INTEGER, description: "Parametric Lights -100 to 100." },
                  parametricHighlights: { type: Type.INTEGER, description: "Parametric Highlights -100 to 100." },
                }`;
const requiredArrStr = `["exposure", "contrast", "highlights", "shadows", "whites", "blacks", "temp", "tint", "vibrance", "saturation", "clarity", "dehaze", "hueRed", "hueOrange", "hueYellow", "hueGreen", "hueAqua", "hueBlue", "huePurple", "hueMagenta", "satRed", "satOrange", "satYellow", "satGreen", "satAqua", "satBlue", "satPurple", "satMagenta", "lumRed", "lumOrange", "lumYellow", "lumGreen", "lumAqua", "lumBlue", "lumPurple", "lumMagenta", "parametricShadows", "parametricDarks", "parametricLights", "parametricHighlights"]`;

// Replace in Analyze endpoint
// Find responseSchema: { ... required: ["styleName", "reasoning", "parameters"] }
code = code.replace(/responseSchema:\s*\{\s*type: Type\.OBJECT,\s*properties: \{\s*styleName:[\s\S]*?required: \["styleName", "reasoning", "parameters"\]\s*\}/, \`responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                description: "Provide exactly 3 distinct color grading recommendations for this image, ranked by suitability.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    styleName: { type: Type.STRING, description: "Modern, young-aesthetic name of the color style matching the picture." },
                    reasoning: { type: Type.STRING, description: "A highly concise, professional analysis describing why this specific grading recommendation works well." },
                    parameters: {
                      type: Type.OBJECT,
                      properties: \${paramsObjStr},
                      required: \${requiredArrStr}
                    }
                  },
                  required: ["styleName", "reasoning", "parameters"]
                }
              }
            },
            required: ["recommendations"]
          }\`);

// Replace in Prompt endpoint
code = code.replace(/responseSchema:\s*\{\s*type: Type\.OBJECT,\s*properties: \{\s*styleName: \{ type: Type\.STRING, description: "Artistic style theme name derived[\s\S]*?required: \["styleName", "reasoning", "parameters"\]\s*\}/, \`responseSchema: {
            type: Type.OBJECT,
            properties: {
              styleName: { type: Type.STRING, description: "Artistic style theme name derived from user's custom prompt, e.g. 'Rainy Seattle Coffee'." },
              reasoning: { type: Type.STRING, description: "A tailored user-facing explanation detailing how the requested sliders were mapped logically from the user's creative prompt." },
              parameters: {
                type: Type.OBJECT,
                properties: \${paramsObjStr},
                required: \${requiredArrStr}
              }
            },
            required: ["styleName", "reasoning", "parameters"]
          }\`);

fs.writeFileSync("server.ts", code);
console.log("Patched server schemas");
