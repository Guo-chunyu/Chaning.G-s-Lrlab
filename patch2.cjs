const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove API input from Expert Mode
const expertApiInputRegex = /\s*\{\/\* API Key configuration input \*\/\}\s*<div className="bg-zinc-900\/40 p-3 rounded-lg border border-zinc-900">[\s\S]*?<\/div>/;
code = code.replace(expertApiInputRegex, "");

// 2. Add API input to Header
const headerInsertPoint = /<div className="flex flex-wrap gap-2\.5">/;
const newApiInput = `          <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80 mb-6 w-full max-w-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-mono text-[#00FF5F] uppercase tracking-widest font-bold">Gemini 神经网络大模型接入指令 (可选)</span>
              <span className="text-[9px] font-mono text-zinc-400 uppercase px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800/50">支持离线自动降级模拟</span>
            </div>
            <input 
              type="password"
              value={apiConfig.apiKey}
              onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
              placeholder="输入 Gemini API Key 以启用深度语义推演引擎 (留空则演示本地色彩运算) ..."
              className="w-full bg-black border border-zinc-700 hover:border-zinc-500 rounded-lg px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-[#00FF5F] focus:shadow-[0_0_15px_rgba(0,255,95,0.15)] tracking-wider transition-all placeholder:text-zinc-600"
            />
          </div>
          <div className="flex flex-wrap gap-2.5">`;

code = code.replace(headerInsertPoint, newApiInput);

// 3. Add aiRecommendations state
const stateInsertPoint = /const \[apiConfig, setApiConfig\] = useState<LocalApiConfig>\(\{[\s\S]*?\}\);/;
const stateAddition = `
  const [quickRecommendations, setQuickRecommendations] = useState<any[]>([]);`;
code = code.replace(stateInsertPoint, match => `${match}${stateAddition}`);

// 4. Update triggerStyleDetection
const analyzeGradingResponseRegex = /response = await fetch\("\/api\/analyze-grading"[\s\S]*?if \(!response\.ok\)/;
// Wait, we need to modify how result is handled.
// The result handling starts at:
/*
      const result = await response.json();
      
      const newParams: LightroomParams = {
        ...DEFAULT_PARAMS,
        ...result.parameters
      };

      const updatedPhoto: PhotoItem = {
*/

const resultHandlingRegex = /const result = await response\.json\(\);\s*const newParams: LightroomParams = \{\s*\.\.\.DEFAULT_PARAMS,\s*\.\.\.result\.parameters\s*\};\s*const updatedPhoto: PhotoItem = \{[\s\S]*?\}\s*\} finally \{/;

const newResultHandling = `const result = await response.json();
      
      if (activeMode === "quick" && result.recommendations) {
        setQuickRecommendations(result.recommendations);
        setFolderData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            photos: prev.photos.map(p => p.id === selectedPhoto.id ? { ...p, analyzing: false } : p)
          };
        });
        addLog(\`▷ 【美学引擎提示】检测完毕，已提取 \${result.recommendations.length} 款推荐风格策略等待选取。\`);
      } else {
        // Fallback or Expert mode handling
        const newParams: LightroomParams = {
          ...DEFAULT_PARAMS,
          ...result.parameters
        };

        const updatedPhoto: PhotoItem = {
          ...selectedPhoto,
          isAnalyzed: true,
          analyzing: false,
          styleName: result.styleName || "AI 艺术风格设计",
          reasoning: result.reasoning || "自动色彩分析匹配完毕。",
          recommendedParams: newParams
        };

        setFolderData(prev => {
          if (!prev) return null;
          return { ...prev, photos: prev.photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p) };
        });
        setSelectedPhoto(updatedPhoto);

        if (result.warning) {
          addLog(\`▷ 【模型节点回传】\${result.warning}\`);
        }
        addLog(\`风格调配完毕。成功部署独立预设策略：[\${updatedPhoto.styleName}]。\`);
      }
    } catch (err: any) {
      console.error(err);
      addLog(\`无法调起云端 AI 通信链路：发生通信层解析错误。\`);
      setFolderData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          photos: prev.photos.map(p => p.id === selectedPhoto.id ? { ...p, analyzing: false } : p)
        };
      });
    } finally {`;

code = code.replace(resultHandlingRegex, newResultHandling);

// Handle when triggerStyleDetection resets recommendations
// Find setIsAnalyzing(true);
code = code.replace(/setIsAnalyzing\(true\);/, `setQuickRecommendations([]);\n    setIsAnalyzing(true);`);


// 5. Render quickRecommendations UI
// We need to render this inside the quick mode area.
// Searching for: `activeMode === "quick" ? (`
// Currently it renders just the large button:
/*                 <motion.button ...
                     AI 一键提取色彩风格
*/
const quickModeUIRegex = /activeMode === "quick" \? \([\s\S]*?<\/div>[\s\S]*?<\/motion\.div>\s*\)\s*:\s*\(/;

const newQuickModeUI = `activeMode === "quick" ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FF5F]/5 rounded-bl-full pointer-events-none group-hover:bg-[#00FF5F]/10 transition-colors" />
                    
                    <h5 className="font-mono text-white text-xs font-bold uppercase tracking-wider mb-2">快速风格引擎流 (Quick Extract)</h5>
                    <p className="text-[10px] text-zinc-400 font-mono leading-relaxed mb-6">
                      基于神经网络特征分析，模型将智能判断曝光、主体、光影调性与环境色彩，在微秒级重绘生成高保真调色策略参数，并一键推导专属色调。
                    </p>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={triggerStyleDetection}
                      disabled={!selectedPhoto || isAnalyzing}
                      className="w-full py-4 bg-[#050505] border border-[#00FF5F] text-[#00FF5F] font-mono text-[11px] tracking-widest font-black uppercase rounded-lg hover:bg-[#00FF5F] hover:text-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-[#050505]"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-current animate-spin" />
                          神经网络运算特征中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          AI 一键提取色彩风格
                        </>
                      )}
                    </motion.button>
                  </div>
                  
                  {quickRecommendations.length > 0 && (
                    <motion.div 
                       initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                       className="bg-[#050505] rounded-xl border border-zinc-800 p-4 space-y-4"
                    >
                      <h5 className="text-[10px] text-[#00FF5F] font-mono tracking-widest font-bold">智能推荐排行</h5>
                      <div className="flex flex-col gap-3">
                        {quickRecommendations.map((rec, i) => (
                           <div key={i} className="group relative border border-zinc-800 hover:border-[#00FF5F]/50 rounded-lg p-4 bg-zinc-900/30 transition-all cursor-pointer overflow-hidden" 
                                onClick={() => {
                                  const appliedParams = { ...DEFAULT_PARAMS, ...rec.parameters };
                                  const updatedPhoto = { ...selectedPhoto, isAnalyzed: true, styleName: rec.styleName, reasoning: rec.reasoning, recommendedParams: appliedParams };
                                  setSelectedPhoto(updatedPhoto);
                                  setFolderData(prev => prev ? { ...prev, photos: prev.photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p) } : null);
                                  addLog(\`用户已手动决策提取并应用第 \${i+1} 顺位推荐策略: [\${rec.styleName}]\`);
                                }}>
                             <div className="absolute top-0 right-0 pt-2 pr-3 opacity-90"><span className="text-[9px] font-mono font-bold text-zinc-500">#{i + 1}</span></div>
                             <h6 className="text-[11px] text-white font-bold tracking-wider mb-2 pr-4">{rec.styleName}</h6>
                             <p className="text-[9.5px] text-zinc-400 font-mono leading-relaxed">{rec.reasoning}</p>
                             <div className="mt-3 inline-block px-2 py-1 text-[8.5px] font-mono bg-[#00FF5F]/10 text-[#00FF5F] rounded border border-[#00FF5F]/20 font-bold tracking-wide">
                               点击套用并即刻推演此配方
                             </div>
                           </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (`;

code = code.replace(quickModeUIRegex, newQuickModeUI);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched successfully.');
