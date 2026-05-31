/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LightroomParams } from "../types";
import { RefreshCw, Sliders, Sunset, Sun, Droplets, Palette } from "lucide-react";
import { DEFAULT_PARAMS } from "../utils/filter";

interface GradingSlidersProps {
  params: LightroomParams;
  onChange: (newParams: LightroomParams) => void;
}

export default function GradingSliders({ params, onChange }: GradingSlidersProps) {
  const [hslTab, setHslTab] = React.useState<"hue" | "sat" | "lum">("hue");

  const HSL_CHANNELS = [
    { label: "红色 (Red)", keyPart: "Red", color: "#ef4444", hueGradient: "linear-gradient(to right, #ec4899 0%, #ef4444 50%, #f97316 100%)" },
    { label: "橙色 (Orange)", keyPart: "Orange", color: "#f97316", hueGradient: "linear-gradient(to right, #ef4444 0%, #f97316 50%, #eab308 100%)" },
    { label: "黄色 (Yellow)", keyPart: "Yellow", color: "#eab308", hueGradient: "linear-gradient(to right, #f97316 0%, #eab308 50%, #22c55e 100%)" },
    { label: "绿色 (Green)", keyPart: "Green", color: "#22c55e", hueGradient: "linear-gradient(to right, #eab308 0%, #22c55e 50%, #06b6d4 100%)" },
    { label: "浅绿 (Aqua)", keyPart: "Aqua", color: "#06b6d4", hueGradient: "linear-gradient(to right, #22c55e 0%, #06b6d4 50%, #3b82f6 100%)" },
    { label: "蓝色 (Blue)", keyPart: "Blue", color: "#3b82f6", hueGradient: "linear-gradient(to right, #06b6d4 0%, #3b82f6 50%, #a855f7 100%)" },
    { label: "紫色 (Purple)", keyPart: "Purple", color: "#a855f7", hueGradient: "linear-gradient(to right, #3b82f6 0%, #a855f7 50%, #ec4899 100%)" },
    { label: "洋红 (Magenta)", keyPart: "Magenta", color: "#ec4899", hueGradient: "linear-gradient(to right, #a855f7 0%, #ec4899 50%, #ef4444 100%)" },
  ] as const;
  
  const updateParam = (key: keyof LightroomParams, val: number) => {
    onChange({
      ...params,
      [key]: val,
    });
  };

  const handleResetParam = (key: keyof LightroomParams) => {
    updateParam(key, 0);
  };

  const handleResetAll = () => {
    onChange({ ...DEFAULT_PARAMS });
  };

  // Helper render for sliders
  const renderSlider = (
    label: string,
    key: keyof LightroomParams,
    min: number,
    max: number,
    valueFormatter: (v: number) => string,
    trackClass?: string
  ) => {
    const val = params[key] ?? 0;
    const isModified = val !== 0;

    return (
      <div key={key} className="group/slider relative py-2.5">
        <div className="flex justify-between items-center text-xs font-mono mb-1.5">
          <button
            onClick={() => handleResetParam(key)}
            className="text-zinc-400 hover:text-white transition-colors duration-100 flex items-center gap-1 hover:underline cursor-pointer"
            title="双击标签重置此参数"
          >
            <span>{label}</span>
            {isModified && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            )}
          </button>
          <span className={`font-medium ${isModified ? "text-emerald-400" : "text-zinc-500"}`}>
            {valueFormatter(val)}
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            value={val}
            onChange={(e) => updateParam(key, parseInt(e.target.value, 10))}
            className={`w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0 ${trackClass || "accent-emerald-500"}`}
            style={{
              background: trackClass ? undefined : `linear-gradient(to right, #27272a 0%, #10b981 50%, #27272a 100%)`
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div id="lightroom-sliders-card" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
      
      {/* Slider Header card */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-mono tracking-wider font-semibold text-zinc-100 uppercase">Lightroom 偏好调色参数</h3>
        </div>
        <button
          onClick={handleResetAll}
          className="text-[10px] font-mono uppercase bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1 px-2.5 rounded border border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          重置参数
        </button>
      </div>

      {/* Group 1: Temperature & White Balance */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-3 text-[10px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
          <Sunset className="w-3.5 h-3.5 text-amber-500" />
          <span>白平衡 (White Balance)</span>
        </div>
        <div className="space-y-1 bg-zinc-950/40 p-3 rounded-lg border border-zinc-900/50">
          {renderSlider(
            "色温 (Temperature)",
            "temp",
            -100,
            100,
            (v) => (v > 0 ? `+${v} 暖色` : v < 0 ? `${v} 冷色` : "中性色温 (5600K)"),
            "slider-track-temp" // Custom Temp CSS
          )}
          {renderSlider(
            "色调 (Tint)",
            "tint",
            -100,
            100,
            (v) => (v > 0 ? `+${v} 洋红` : v < 0 ? `${v} 绿色` : "中性偏置 (0)"),
            "slider-track-tint" // Custom Tint CSS
          )}
        </div>
      </div>

      {/* Group 2: Basic Tone */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-3 text-[10px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
          <Sun className="w-3.5 h-3.5 text-yellow-500" />
          <span>常用色调属性 (Basic Tone)</span>
        </div>
        <div className="space-y-1 bg-zinc-950/40 p-3 rounded-lg border border-zinc-900/50">
          {renderSlider("曝光度 (Exposure)", "exposure", -100, 100, (v) => {
            const ev = (v / 100) * 3;
            return ev > 0 ? `+${ev.toFixed(2)} EV` : `${ev.toFixed(2)} EV`;
          })}
          {renderSlider("对比度 (Contrast)", "contrast", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
          {renderSlider("高光 (Highlights)", "highlights", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
          {renderSlider("阴影 (Shadows)", "shadows", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
          {renderSlider("白色值 (Whites)", "whites", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
          {renderSlider("黑色值 (Blacks)", "blacks", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
        </div>
      </div>

      {/* Group 3: Presence & Saturation */}
      <div>
        <div className="flex items-center gap-1.5 mb-3 text-[10px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
          <Droplets className="w-3.5 h-3.5 text-emerald-400" />
          <span>质感与色彩鲜艳度 (Presence & Saturation)</span>
        </div>
        <div className="space-y-1 bg-zinc-950/40 p-3 rounded-lg border border-zinc-900/50">
          {renderSlider("清晰度 (Clarity)", "clarity", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
          {renderSlider("去薄雾 (Dehaze)", "dehaze", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
          {renderSlider("鲜艳度 (Vibrance)", "vibrance", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
          {renderSlider("饱和度 (Saturation)", "saturation", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
        </div>
      </div>

      {/* Group 4: HSL Color Adjustments */}
      <div className="mt-6 pt-6 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold tracking-wider text-[#00FF5F] uppercase">
            <Palette className="w-3.5 h-3.5 text-[#00FF5F]" />
            <span>HSL色彩混色器 (HSL Color Mixer)</span>
          </div>
          {/* Miniature Reset Button for HSL only */}
          <button
            onClick={() => {
              const resetHsl = { ...params };
              HSL_CHANNELS.forEach(ch => {
                resetHsl[`hue${ch.keyPart}` as keyof LightroomParams] = 0;
                resetHsl[`sat${ch.keyPart}` as keyof LightroomParams] = 0;
                resetHsl[`lum${ch.keyPart}` as keyof LightroomParams] = 0;
              });
              onChange(resetHsl);
            }}
            className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer hover:underline"
          >
            重置HSL
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 mb-4 bg-zinc-950/60 p-1 rounded-lg border border-zinc-900/50">
          {(["hue", "sat", "lum"] as const).map((tab) => {
            const isActive = hslTab === tab;
            const label = tab === "hue" ? "色相 (Hue)" : tab === "sat" ? "饱和度 (Sat)" : "明度 (Lum)";
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setHslTab(tab)}
                className={`py-1.5 rounded text-[10.5px] font-medium font-mono transition-all text-center cursor-pointer ${
                  isActive 
                    ? "bg-[#00FF5F]/10 text-[#00FF5F] border border-[#00FF5F]/20" 
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* HSL sliders list */}
        <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900/50 space-y-1">
          {HSL_CHANNELS.map((ch) => {
            const key = `${hslTab}${ch.keyPart}` as keyof LightroomParams;
            const val = params[key] ?? 0;
            const isModified = val !== 0;

            // Generate specific background for slider track
            let trackBg = "";
            if (hslTab === "hue") {
              trackBg = ch.hueGradient;
            } else if (hslTab === "sat") {
              trackBg = `linear-gradient(to right, #1f1f23 0%, ${ch.color} 100%)`;
            } else {
              trackBg = `linear-gradient(to right, #000000 0%, ${ch.color} 50%, #ffffff 100%)`;
            }

            return (
              <div key={ch.keyPart} className="group/hsl-slider relative py-2">
                <div className="flex justify-between items-center text-[11px] font-mono mb-1">
                  <button
                    type="button"
                    onClick={() => updateParam(key, 0)}
                    className="text-zinc-400 hover:text-white transition-colors duration-100 flex items-center gap-1.5 hover:underline cursor-pointer"
                    title="点击重置此色彩"
                  >
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: ch.color }} />
                    <span>{ch.label}</span>
                    {isModified && (
                      <span className="w-1 h-1 rounded-full bg-[#00FF5F]" />
                    )}
                  </button>
                  <span className={`font-medium ${isModified ? "text-[#00FF5F]" : "text-zinc-500"}`}>
                    {val > 0 ? `+${val}` : val}
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={val}
                    onChange={(e) => updateParam(key, parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer focus:outline-none focus:ring-0 accent-zinc-200"
                    style={{
                      background: trackBg
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Group 5: Parametric Tone Curve */}
      <div className="mt-6 pt-6 border-t border-zinc-800">
        <div className="flex items-center gap-1.5 mb-3 text-[10px] font-mono font-semibold tracking-wider text-purple-400 uppercase">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M3 21c3-6 5-8 9-8s6 2 9 8"/></svg>
          <span>参数化色调曲线 (Tone Curve parametric)</span>
        </div>
        <div className="space-y-1 bg-zinc-950/40 p-3 rounded-lg border border-zinc-900/50">
          {renderSlider("高光区域 (Highlights)", "parametricHighlights", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
          {renderSlider("亮部区域 (Lights)", "parametricLights", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
          {renderSlider("暗部区域 (Darks)", "parametricDarks", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
          {renderSlider("阴影区域 (Shadows)", "parametricShadows", -100, 100, (v) => `${v > 0 ? "+" : ""}${v}`)}
        </div>
      </div>

    </div>
  );
}
