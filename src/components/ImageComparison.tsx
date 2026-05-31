/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { getCssFilter } from "../utils/filter";
import { LightroomParams } from "../types";
import { Eye, Sliders } from "lucide-react";

interface ImageComparisonProps {
  imageUrl: string;
  params: LightroomParams;
  alt: string;
}

export default function ImageComparison({ imageUrl, params, alt }: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
    updateSlider(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  // Double click resets to exactly 50%
  const handleDoubleClick = () => {
    setSliderPosition(50);
  };

  return (
    <div className="relative w-full h-[60vh] min-h-[400px] max-h-[800px] bg-zinc-950 rounded-xl overflow-hidden shadow-2xl select-none group border border-zinc-800">
      {/* Before / After labels */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none px-3 py-1 bg-black/60 rounded-full border border-white/10 flex items-center gap-1.5 backdrop-blur-md">
        <Eye className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-[10px] font-mono tracking-wider font-semibold text-zinc-300 uppercase">原图 (Before)</span>
      </div>
      <div className="absolute top-4 right-4 z-20 pointer-events-none px-3 py-1 bg-zinc-900/80 rounded-full border border-emerald-500/20 flex items-center gap-1.5 backdrop-blur-md">
        <Sliders className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-mono tracking-wider font-semibold text-emerald-400 uppercase">调色后 (After)</span>
      </div>

      <div
        id="comparison-container"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full h-full cursor-ew-resize overflow-hidden"
      >
        {/* Base Image (ORIGINAL - Left) */}
        <img
          id="before-photo"
          src={imageUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
        />

        {/* Overlay Image (GRADED - Right) */}
        <div
          id="after-photo-overlay"
          className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-75"
          style={{
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          }}
        >
          <img
            src={imageUrl}
            alt={`${alt} graded`}
            referrerPolicy="no-referrer"
            style={{ filter: getCssFilter(params) }}
            className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          />
        </div>

        {/* Drag Separator Bar */}
        <div
          id="draggable-slider-handle"
          className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Thumb icon handle */}
          <div 
            onDoubleClick={handleDoubleClick}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-zinc-900 border border-zinc-300 shadow-xl flex items-center justify-center transition-transform group-hover:scale-110 active:scale-95"
            title="双击滑块重置居中"
          >
            <div className="flex gap-0.5 items-center justify-center">
              <span className="block w-1 h-3 rounded-full bg-zinc-400"></span>
              <span className="block w-1 h-3 rounded-full bg-zinc-600"></span>
              <span className="block w-1 h-3 rounded-full bg-zinc-400"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Info Corner */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between text-[11px] font-mono text-zinc-400 bg-black/40 backdrop-blur-md py-2 px-3 rounded-lg border border-white/5 pointer-events-none">
        <span>点击并左右拖动中间的分栏线进行对比</span>
        <span className="text-zinc-500">当前风格: {params.temp > 0 ? "暖色调" : params.temp < 0 ? "冷色调" : "默认中性"} 模式</span>
      </div>
    </div>
  );
}
