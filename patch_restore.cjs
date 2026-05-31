const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /activeMode === "quick" \? \([\s\S]*?<\/div>[\s\S]*?<\/motion\.div>\s*\)\s*:\s*\(/;

const newUI = `activeMode === "quick" ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2">
                    {Array.from(new Set(STYLE_PRESETS.map((p) => p.category))).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPresetCategory(cat)}
                        className={\`px-4 py-2 rounded-full whitespace-nowrap text-xs font-mono font-bold transition-all \${
                          presetCategory === cat 
                            ? "bg-[#00FF5F] text-black shadow-[0_0_15px_rgba(0,255,95,0.4)]" 
                            : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500"
                        }\`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                    {STYLE_PRESETS.filter((p) => p.category === presetCategory).map((preset) => (
                      <div 
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className={\`group relative border p-4 rounded-xl cursor-pointer transition-all overflow-hidden \${
                          selectedPhoto?.styleName === preset.name 
                            ? "border-[#00FF5F] bg-[#00FF5F]/5 shadow-[0_0_20px_rgba(0,255,95,0.1)]" 
                            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900"
                        }\`}
                      >
                        <h5 className="text-white text-sm font-bold tracking-wide mb-1 group-hover:text-[#00FF5F] transition-colors">{preset.name}</h5>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {preset.tag}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">{preset.description}</p>
                        {selectedPhoto?.styleName === preset.name && (
                          <div className="absolute top-4 right-4 text-[#00FF5F]">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FF5F]/5 rounded-bl-full pointer-events-none group-hover:bg-[#00FF5F]/10 transition-colors" />
                    
                    <h5 className="font-mono text-white text-xs font-bold uppercase tracking-wider mb-2">快速风格引擎流 (Quick Extract)</h5>
                    <p className="text-[10px] text-zinc-400 font-mono leading-relaxed mb-4">
                      如果不确定选用什么风格，基于神经网络特征分析，模型将推导多组适用风格及参数。
                    </p>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={triggerStyleDetection}
                      disabled={!selectedPhoto || isAnalyzing}
                      className="w-full py-3 bg-[#050505] border border-[#00FF5F] text-[#00FF5F] font-mono text-[11px] tracking-widest font-black uppercase rounded-lg hover:bg-[#00FF5F] hover:text-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-[#050505]"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-current animate-spin" />
                          神经网络推演中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          智能获取色彩风格推荐 (AI RECS)
                        </>
                      )}
                    </motion.button>
                  </div>
                  
                  {quickRecommendations.length > 0 && (
                    <motion.div 
                       initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                       className="bg-[#050505] rounded-xl border border-zinc-800 p-4 space-y-4"
                    >
                      <h5 className="text-[10px] text-[#00FF5F] font-mono tracking-widest font-bold">由语义层提取的建议配方：</h5>
                      <div className="flex flex-col gap-3">
                        {quickRecommendations.map((rec, i) => (
                           <div key={i} className="group relative border border-zinc-800 hover:border-[#00FF5F]/50 rounded-lg p-3 bg-zinc-900/30 transition-all cursor-pointer overflow-hidden" 
                                onClick={() => {
                                  const appliedParams = { ...DEFAULT_PARAMS, ...rec.parameters };
                                  const updatedPhoto = { ...selectedPhoto, isAnalyzed: true, styleName: rec.styleName, reasoning: rec.reasoning, recommendedParams: appliedParams };
                                  setSelectedPhoto(updatedPhoto);
                                  setFolderData(prev => prev ? { ...prev, photos: prev.photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p) } : null);
                                  addLog(\`用户应用了 AI 推荐的风格预设: [\${rec.styleName}]\`);
                                }}>
                             <div className="absolute top-0 right-0 pt-2 pr-3 opacity-90"><span className="text-[9px] font-mono font-bold text-zinc-500">#{i + 1}</span></div>
                             <h6 className="text-[11px] text-white font-bold tracking-wider mb-1 pr-4">{rec.styleName}</h6>
                             <p className="text-[9.5px] text-zinc-400 font-mono leading-relaxed">{rec.reasoning}</p>
                           </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (`;

code = code.replace(regex, newUI);
// also add CheckCircle2 import
if (!code.includes("CheckCircle2")) {
  code = code.replace("Sparkles", "Sparkles, CheckCircle2");
}

fs.writeFileSync('src/App.tsx', code);
console.log('Done restoring quick mode UI');
