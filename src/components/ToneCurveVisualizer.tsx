import React from 'react';

export default function ToneCurveVisualizer({ params, className = "" }: { params: any, className?: string }) {
  const shadows = params.parametricShadows || 0;
  const darks = params.parametricDarks || 0;
  const lights = params.parametricLights || 0;
  const highlights = params.parametricHighlights || 0;

  // The curve maps 0..100 to 0..100.
  // Parametric sliders pull the respective segments. Let's map slider -100..100 to a vertical pull of -25..25.
  const pt0 = { x: 0, y: 0 };
  const pt1 = { x: 25, y: Math.max(0, Math.min(100, 25 + shadows * 0.25)) };
  const pt2 = { x: 50, y: Math.max(0, Math.min(100, 50 + darks * 0.25)) };
  const pt3 = { x: 75, y: Math.max(0, Math.min(100, 75 + lights * 0.25)) };
  const pt4 = { x: 100, y: Math.max(0, Math.min(100, 100 + highlights * 0.25)) };

  // Convert to SVG space (0..100, y is inverted)
  const s0 = { x: pt0.x, y: 100 - pt0.y };
  const s1 = { x: pt1.x, y: 100 - pt1.y };
  const s2 = { x: pt2.x, y: 100 - pt2.y };
  const s3 = { x: pt3.x, y: 100 - pt3.y };
  const s4 = { x: pt4.x, y: 100 - pt4.y };

  // To draw a smooth curve that passes exactly through these points:
  // Catmull-Rom to Cubic Bezier conversion
  const tension = 0.2;
  const pts = [s0, s1, s2, s3, s4];
  let pathString = `M ${pts[0].x},${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
     const p0 = i > 0 ? pts[i - 1] : pts[0];
     const p1 = pts[i];
     const p2 = pts[i + 1];
     const p3 = i !== pts.length - 2 ? pts[i + 2] : p2;

     const dx1 = (p2.x - p0.x) * tension;
     const dy1 = (p2.y - p0.y) * tension;
     const cp1x = p1.x + dx1;
     const cp1y = p1.y + dy1;

     const dx2 = (p3.x - p1.x) * tension;
     const dy2 = (p3.y - p1.y) * tension;
     const cp2x = p2.x - dx2;
     const cp2y = p2.y - dy2;

     pathString += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return (
    <div className={`bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 flex flex-col ${className}`}>
       <h6 className="text-[10px] text-zinc-400 font-mono mb-4 uppercase tracking-widest flex items-center justify-between">
         <span>色调曲线可视化 (Tone Curve)</span>
         <span className="w-1.5 h-1.5 rounded-full bg-[#00FF5F] shadow-[0_0_5px_#00FF5F]"></span>
       </h6>
       <div className="relative w-full aspect-square border-b border-l border-zinc-700/50 pb-1 pl-1 bg-black/20 rounded-bl-sm flex-1">
          {/* Grid */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-20">
             {[...Array(16)].map((_, i) => <div key={i} className="border-r border-t border-zinc-600"></div>)}
          </div>
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible font-mono">
            {/* Linear Reference */}
            <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3" />
            
            {/* The Curve Stroke */}
            <path d={pathString} fill="none" className="stroke-[#00FF5F]" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Points */}
            <circle cx={s1.x} cy={s1.y} r="2" fill="#050505" className="stroke-[#00FF5F]" strokeWidth="1" />
            <text x={s1.x + 3} y={s1.y - 3} fill="rgba(255,255,255,0.7)" fontSize="3.5">阴影</text>

            <circle cx={s2.x} cy={s2.y} r="2" fill="#050505" className="stroke-[#00FF5F]" strokeWidth="1" />
            <text x={s2.x + 3} y={s2.y - 3} fill="rgba(255,255,255,0.7)" fontSize="3.5">中间调</text>

            <circle cx={s3.x} cy={s3.y} r="2" fill="#050505" className="stroke-[#00FF5F]" strokeWidth="1" />
            <text x={s3.x - 3} y={s3.y - 3} textAnchor="end" fill="rgba(255,255,255,0.7)" fontSize="3.5">高光</text>
          </svg>
       </div>
       <div className="mt-4 text-[9.5px] text-zinc-500 font-mono leading-relaxed space-y-1.5 border-t border-zinc-800/50 pt-3">
         <p>• <span className="text-white">平滑曲线</span> 连接了基于亮度分布的映射关系，直线表示不经过色调调整的原始亮度。</p>
         <p>• 三个 <span className="text-[#00FF5F]">绿色控制点</span> 分别影响画面的暗部（阴影）、中调与亮部（高光）像素。</p>
       </div>
    </div>
  )
}
