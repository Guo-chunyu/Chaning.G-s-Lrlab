const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("ToneCurveVisualizer")) {
  code = code.replace(
    'import GradingSliders from "./components/GradingSliders";',
    'import GradingSliders from "./components/GradingSliders";\\nimport ToneCurveVisualizer from "./components/ToneCurveVisualizer";'
  );
}

// target professional mode block:
// 1012:                   </motion.button>
// 1013:                 </motion.div>
// 1014:               )}

const professionalModeBlockEnd = /运行大模型多模态色彩生成[\s\S]*?<\/motion\.button>/;

code = code.replace(professionalModeBlockEnd, match => \`\${match}
                  
                  {selectedPhoto && (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="mt-6">
                      <ToneCurveVisualizer params={selectedPhoto.recommendedParams || DEFAULT_PARAMS} />
                    </motion.div>
                  )}\`);

fs.writeFileSync('src/App.tsx', code);
console.log('App patched with tone curve');
