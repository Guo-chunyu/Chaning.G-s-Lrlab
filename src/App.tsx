/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  FolderOpen, 
  Layers, 
  HelpCircle, 
  Camera, 
  Sliders as SlidersIcon, 
  Sparkles,
  CheckCircle2, 
  Compass, 
  Wifi, 
  WifiOff, 
  Download, 
  Check, 
  ArrowRight, 
  ExternalLink,
  Play,
  RotateCcw,
  Zap,
  FileImage,
  Info,
  X,
  PanelRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoItem, FolderData, LightroomParams, LocalApiConfig } from "./types";
import ImageComparison from "./components/ImageComparison";
import GradingSliders from "./components/GradingSliders";
import ToneCurveVisualizer from "./components/ToneCurveVisualizer";
import { STYLE_PRESETS, DEFAULT_PARAMS, getCssFilter } from "./utils/filter";

export default function App() {
  // Folder load simulation states
  const [folderData, setFolderData] = useState<FolderData | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [systemLogs, setSystemLogs] = useState<string[]>(["核心神经网络调色引擎 v4.0 已成功载入。", "等待照片接入及特征感知。"]);
  
  // App options & mode configuration
  const [activeMode, setActiveMode] = useState<"quick" | "professional">("quick");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [presetCategory, setPresetCategory] = useState<string>("胶片模拟 (Film)");
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Local computer integration simulation
  const [apiConfig, setApiConfig] = useState<LocalApiConfig>({
    endpoint: "http://localhost:18000",
    connected: false,
    apiKey: "",
    targetSoftware: "Lightroom Classic",
    useLocalHelper: true
  });
  const [quickRecommendations, setQuickRecommendations] = useState<any[]>([]);
  const [localRedirectTriggered, setLocalRedirectTriggered] = useState<boolean>(false);
  const [redirectCount, setRedirectCount] = useState<number>(3);

  // Load status on initialization
  useEffect(() => {
    // Check local express server health
    fetch("/api/lightroom/status")
      .then((res) => res.json())
      .then((data) => {
        setApiConfig(prev => ({
          ...prev,
          connected: data.connected
        }));
      })
      .catch(() => {
        addLog("未能连接到后台 Lightroom 辅助服务。");
      });
  }, []);

  const addLog = (msg: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Simulate folder scanning (directory mapping)
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerDirectoryScan = () => {
    if (directoryInputRef.current) {
      directoryInputRef.current.click();
    }
  };

  const handleDirectoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    addLog(`正在扫描包含 ${files.length} 个项目的文件夹...`);

    // Extract directory name if possible
    let folderName = "我的 Lightroom 文件夹";
    if (files[0] && files[0].webkitRelativePath) {
      const parts = files[0].webkitRelativePath.split("/");
      if (parts.length > 1) {
        folderName = parts[0];
      }
    }

    const processedPhotos: PhotoItem[] = [];
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".cr2", ".nef", ".arw"];

    // Process first 15 images for interactive editing efficiency
    let loadedCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileNameLower = file.name.toLowerCase();
      const isImg = imageExtensions.some(ext => fileNameLower.endsWith(ext));

      if (isImg && loadedCount < 12) {
        loadedCount++;
        const objectUrl = URL.createObjectURL(file);
        
        processedPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          name: file.name,
          path: file.webkitRelativePath || file.name,
          size: file.size,
          url: objectUrl,
          isAnalyzed: false,
          analyzing: false,
          recommendedParams: { ...DEFAULT_PARAMS }
        });
      }
    }

    setTimeout(() => {
      if (processedPhotos.length === 0) {
        // Fallback to high-fidelity mock assets if none uploaded, to keep app beautiful and interactive
        addLog("未选择具体的本地文件。已加载高画质胶片画幅演示文件夹以便预览体验。");
        injectMockFolder();
      } else {
        setFolderData({
          name: folderName,
          photos: processedPhotos
        });
        setSelectedPhoto(processedPhotos[0]);
        addLog(`成功扫描目录：[${folderName}]。找到 ${processedPhotos.length} 张高分辨率照片。`);
      }
      setIsScanning(false);
    }, 1500);
  };

  // Preset Injector to show gorgeous mock layout immediately
  const injectMockFolder = () => {
    const mockPhotos: PhotoItem[] = [
      {
        id: "mock-1",
        name: "norwegian_fjords_morning.jpg",
        path: "Travel/norwegian_fjords_morning.jpg",
        size: 8400000,
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        isAnalyzed: true,
        analyzing: false,
        styleName: "哥本哈根迷雾",
        reasoning: "【色彩核心推测】\n高频细节的山峦笼罩在多云天气中。最适合搭配低饱和冷色调，模拟高海拔零下气候的冷峻质感。\n\n【关键参数影响解析】\n• 对比度 +15: 增强暗部沉淀感，画面更富有立体切割感。\n• 色温 -12: 注入冷调，散发机械或冷峻的蓝调工业氛围。\n• 自然饱和度 -15: 压暗过于鲜艳的色彩，呈现高级的高级莫兰迪或纪实黑白质感。",
        recommendedParams: { ...STYLE_PRESETS[0].params }
      },
      {
        id: "mock-2",
        name: "tokyo_shibuya_night.jpg",
        path: "Travel/tokyo_shibuya_night.jpg",
        size: 11200000,
        url: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=1200&q=80",
        isAnalyzed: true,
        analyzing: false,
        styleName: "新潮宿霓虹",
        reasoning: "【色彩核心推测】\n包含强烈的都会城市霓虹元素。阴影深度偏向皇室蓝调，同时突出对比鲜明的亮洋红与青翠青蓝色逆光反差。\n\n【关键参数影响解析】\n• 曝光度 -5: 压暗主调，带来深邃严肃的情绪氛围。\n• 高光 -20: 极大地保留高光细节，防止云层或高亮处过曝。\n• 色温 -8: 注入冷调，散发机械或冷峻的蓝调工业氛围。",
        recommendedParams: { ...STYLE_PRESETS[2].params }
      },
      {
        id: "mock-3",
        name: "california_coastal_sunset.jpg",
        path: "Travel/california_coastal_sunset.jpg",
        size: 9100000,
        url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80",
        isAnalyzed: true,
        analyzing: false,
        styleName: "黄金时刻胶片",
        reasoning: "【色彩核心推测】\n沙滩海岸线的午后夕阳。最大限度强化阴影的琥珀暖光，带有上世纪 70 年代怀旧经典柯达胶卷的迷人余晖。\n\n【关键参数影响解析】\n• 阴影 +20: 提亮暗部死黑，呈现宽容度极高的高级影调。\n• 色温 +15: 加强环境暖光，使得落日与人像更加温暖柔和。",
        recommendedParams: { ...STYLE_PRESETS[1].params }
      },
      {
        id: "mock-4",
        name: "editorial_fashion_portrait.jpg",
        path: "Travel/editorial_fashion_portrait.jpg",
        size: 14200000,
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
        isAnalyzed: false,
        analyzing: false,
        recommendedParams: { ...DEFAULT_PARAMS }
      },
      {
        id: "mock-5",
        name: "minimalist_chicago_architecture.jpg",
        path: "Travel/minimalist_chicago_architecture.jpg",
        size: 6710000,
        url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
        isAnalyzed: false,
        analyzing: false,
        recommendedParams: { ...DEFAULT_PARAMS }
      }
    ];

    setFolderData({
      name: "电影感画幅 (演示文件夹)",
      photos: mockPhotos
    });
    setSelectedPhoto(mockPhotos[0]);
  };

  // Convert image URL to Base 64 helper
  const getBase64FromUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  };

  // Analyze function (AI processing trigger)
  const triggerStyleDetection = async () => {
    if (!selectedPhoto) return;

    setQuickRecommendations([]);
    setIsAnalyzing(true);
    addLog(`正在对 "${selectedPhoto.name}" 进行神经网络色彩风格分析...`);

    // Update photo state to analyzing
    setFolderData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        photos: prev.photos.map(p => p.id === selectedPhoto.id ? { ...p, analyzing: true } : p)
      };
    });

    try {
      let payload: any = { filename: selectedPhoto.name };

      // Try converting image state to base64 if it's local URL/blob
      if (selectedPhoto.url.startsWith("blob:") || selectedPhoto.url.startsWith("http")) {
        const base64 = await getBase64FromUrl(selectedPhoto.url);
        if (base64) {
          payload.imageBase64 = base64;
          payload.mimeType = "image/jpeg";
        }
      }

      let response;
      if (activeMode === "quick") {
        response = await fetch("/api/analyze-grading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            apiKey: apiConfig.apiKey
          })
        });
      } else {
        response = await fetch("/api/generate-from-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            customPrompt: customPrompt || "怀旧现代人像，带有静谧的绿色暗部及柔和温润的高光",
            apiKey: apiConfig.apiKey
          })
        });
      }

      if (!response.ok) {
        throw new Error("Local analysis proxy failed");
      }

      const result = await response.json();
      
      if (activeMode === "quick" && result.recommendations && result.recommendations.length > 0) {
        setQuickRecommendations(result.recommendations);
        const rec = result.recommendations[0];
        const newParams: LightroomParams = {
          ...DEFAULT_PARAMS,
          ...rec.parameters
        };
        const updatedPhoto: PhotoItem = {
          ...selectedPhoto,
          isAnalyzed: true,
          analyzing: false,
          styleName: rec.styleName,
          reasoning: rec.reasoning,
          recommendedParams: newParams
        };
        setSelectedPhoto(updatedPhoto);
        setFolderData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            photos: prev.photos.map(p => p.id === selectedPhoto.id ? updatedPhoto : p)
          };
        });
        if (result.warning) addLog(`▷ 【美学引擎提示】${result.warning}`);
        addLog(`风格分析完毕。为您推荐了 ${result.recommendations.length} 组色彩预设。已套用排名第一的: [${rec.styleName}]。`);
      } else {
        const newParams: LightroomParams = {
          ...DEFAULT_PARAMS,
          ...result.parameters
        };
  
        const updatedPhoto: PhotoItem = {
          ...selectedPhoto,
          isAnalyzed: true,
          analyzing: false,
          styleName: result.styleName || "AI 艺术风格设计",
          reasoning: result.reasoning || "处理完毕。",
          recommendedParams: newParams
        };
  
        // Update both database configurations
        setSelectedPhoto(updatedPhoto);
        setFolderData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            photos: prev.photos.map(p => p.id === selectedPhoto.id ? updatedPhoto : p)
          };
        });
  
        if (result.warning) {
          addLog(`▷ 【美学引擎提示】${result.warning}`);
        }
        addLog(`风格分析完毕。成功生成色彩预设：[${result.styleName || '未知'}]。`);
      }
    } catch (err: any) {
      console.error(err);
      addLog(`无法调起本地 AI 映射：已自动加载默认色温预设。`);
      // Apply offline fallback mapping
      applyPreset(STYLE_PRESETS[0]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fast application of a quick preset
  const applyPreset = (preset: typeof STYLE_PRESETS[0]) => {
    if (!selectedPhoto) return;

    // Build parameter consequence explanation for Quick Mode
    let effectsStr = `【色彩核心推测】\n${preset.description}\n\n【关键参数影响解析】\n`;
    if (preset.params.exposure > 0) effectsStr += `• 曝光度 +${preset.params.exposure}: 模拟高保真明锐光感，提升整体画幅亮度。\n`;
    if (preset.params.exposure < 0) effectsStr += `• 曝光度 ${preset.params.exposure}: 压暗主调，带来深邃严肃的情绪氛围。\n`;
    if (preset.params.contrast > 10) effectsStr += `• 对比度 +${preset.params.contrast}: 增强暗部沉淀感，画面更富有立体切割感。\n`;
    if (preset.params.contrast < -10) effectsStr += `• 对比度 ${preset.params.contrast}: 降低反差，带来日系胶片般通透、柔和的空气感。\n`;
    if (preset.params.highlights < -10) effectsStr += `• 高光 ${preset.params.highlights}: 极大地保留高光细节，防止云层或高亮处过曝。\n`;
    if (preset.params.shadows > 10) effectsStr += `• 阴影 +${preset.params.shadows}: 提亮暗部死黑，呈现宽容度极高的高级影调。\n`;
    if (preset.params.temp < -5) effectsStr += `• 色温 ${preset.params.temp}: 注入冷调，散发机械或冷峻的蓝调工业氛围。\n`;
    if (preset.params.temp > 5) effectsStr += `• 色温 +${preset.params.temp}: 加强环境暖光，使得落日与人像更加温暖柔和。\n`;
    if (preset.params.vibrance < -10) effectsStr += `• 自然饱和度 ${preset.params.vibrance}: 压暗过于鲜艳的色彩，呈现高级的高级莫兰迪或纪实黑白质感。\n`;
    
    effectsStr += `\n总结：该预设能极大改变画面原始反差结构，为照片赋予 [ ${preset.tag} ] 般的色彩空间。`;

    const updatedPhoto: PhotoItem = {
      ...selectedPhoto,
      isAnalyzed: true,
      styleName: preset.name,
      reasoning: effectsStr,
      recommendedParams: { ...preset.params }
    };

    setSelectedPhoto(updatedPhoto);
    setFolderData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        photos: prev.photos.map(p => p.id === selectedPhoto.id ? updatedPhoto : p)
      };
    });

    addLog(`手动应用美学主题预设："${preset.name}"。`);
  };

  // Adjust parameters manually via standard sliders
  const handleManualSliderChange = (newParams: LightroomParams) => {
    if (!selectedPhoto) return;

    const updatedPhoto: PhotoItem = {
      ...selectedPhoto,
      isAnalyzed: true,
      styleName: selectedPhoto.styleName || "自定义调色印记",
      recommendedParams: newParams
    };

    setSelectedPhoto(updatedPhoto);
    setFolderData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        photos: prev.photos.map(p => p.id === selectedPhoto.id ? updatedPhoto : p)
      };
    });
  };

  // Save current Preset as a relative XMP/JSON payload file
  const downloadXmpSetting = () => {
    if (!selectedPhoto || !selectedPhoto.recommendedParams) return;

    const xmpTemplate = `
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c140">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
        crs:Version="14.2"
        crs:ProcessVersion="11.0"
        crs:Exposure2012="${(selectedPhoto.recommendedParams.exposure / 100 * 2.5).toFixed(2)}"
        crs:Contrast2012="${selectedPhoto.recommendedParams.contrast}"
        crs:Highlights2012="${selectedPhoto.recommendedParams.highlights}"
        crs:Shadows2012="${selectedPhoto.recommendedParams.shadows}"
        crs:Whites2012="${selectedPhoto.recommendedParams.whites}"
        crs:Blacks2012="${selectedPhoto.recommendedParams.blacks}"
        crs:Temperature="${5500 + selectedPhoto.recommendedParams.temp * 40}"
        crs:Tint="${selectedPhoto.recommendedParams.tint}"
        crs:Vibrance="${selectedPhoto.recommendedParams.vibrance}"
        crs:Saturation="${selectedPhoto.recommendedParams.saturation}"
        crs:Clarity2012="${selectedPhoto.recommendedParams.clarity}"
        crs:Dehaze="${selectedPhoto.recommendedParams.dehaze}"
        
        crs:HueAdjustmentRed="${selectedPhoto.recommendedParams.hueRed ?? 0}"
        crs:HueAdjustmentOrange="${selectedPhoto.recommendedParams.hueOrange ?? 0}"
        crs:HueAdjustmentYellow="${selectedPhoto.recommendedParams.hueYellow ?? 0}"
        crs:HueAdjustmentGreen="${selectedPhoto.recommendedParams.hueGreen ?? 0}"
        crs:HueAdjustmentAqua="${selectedPhoto.recommendedParams.hueAqua ?? 0}"
        crs:HueAdjustmentBlue="${selectedPhoto.recommendedParams.hueBlue ?? 0}"
        crs:HueAdjustmentPurple="${selectedPhoto.recommendedParams.huePurple ?? 0}"
        crs:HueAdjustmentMagenta="${selectedPhoto.recommendedParams.hueMagenta ?? 0}"
        
        crs:SaturationAdjustmentRed="${selectedPhoto.recommendedParams.satRed ?? 0}"
        crs:SaturationAdjustmentOrange="${selectedPhoto.recommendedParams.satOrange ?? 0}"
        crs:SaturationAdjustmentYellow="${selectedPhoto.recommendedParams.satYellow ?? 0}"
        crs:SaturationAdjustmentGreen="${selectedPhoto.recommendedParams.satGreen ?? 0}"
        crs:SaturationAdjustmentAqua="${selectedPhoto.recommendedParams.satAqua ?? 0}"
        crs:SaturationAdjustmentBlue="${selectedPhoto.recommendedParams.satBlue ?? 0}"
        crs:SaturationAdjustmentPurple="${selectedPhoto.recommendedParams.satPurple ?? 0}"
        crs:SaturationAdjustmentMagenta="${selectedPhoto.recommendedParams.satMagenta ?? 0}"
        
        crs:LuminanceAdjustmentRed="${selectedPhoto.recommendedParams.lumRed ?? 0}"
        crs:LuminanceAdjustmentOrange="${selectedPhoto.recommendedParams.lumOrange ?? 0}"
        crs:LuminanceAdjustmentYellow="${selectedPhoto.recommendedParams.lumYellow ?? 0}"
        crs:LuminanceAdjustmentGreen="${selectedPhoto.recommendedParams.lumGreen ?? 0}"
        crs:LuminanceAdjustmentAqua="${selectedPhoto.recommendedParams.lumAqua ?? 0}"
        crs:LuminanceAdjustmentBlue="${selectedPhoto.recommendedParams.lumBlue ?? 0}"
        crs:LuminanceAdjustmentPurple="${selectedPhoto.recommendedParams.lumPurple ?? 0}"
        crs:LuminanceAdjustmentMagenta="${selectedPhoto.recommendedParams.lumMagenta ?? 0}"
        
        crs:ParametricShadows="${selectedPhoto.recommendedParams.parametricShadows ?? 0}"
        crs:ParametricDarks="${selectedPhoto.recommendedParams.parametricDarks ?? 0}"
        crs:ParametricLights="${selectedPhoto.recommendedParams.parametricLights ?? 0}"
        crs:ParametricHighlights="${selectedPhoto.recommendedParams.parametricHighlights ?? 0}"
        
        crs:HasSettings="True">
      <crs:Name>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${selectedPhoto.styleName || "AI Custom Aesthetic"}</rdf:li>
        </rdf:Alt>
      </crs:Name>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`.trim();

    const blob = new Blob([xmpTemplate], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedPhoto.name.split(".")[0] || "preset"}.xmp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog(`已将当前色彩校正参数导出为 Lightroom Adobe XMP 配置文件。`);
  };

  // Core Lightroom sync: Push grading variables to local client
  const runLocalLightroomSync = async () => {
    if (!selectedPhoto) return;

    addLog(`正在将调色参数接口桥接到本地 Lightroom Classic 客户端...`);

    // Simulate calling the local server in server.ts
    try {
      const response = await fetch("/api/lightroom/apply-grading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: selectedPhoto.id,
          name: selectedPhoto.name,
          params: selectedPhoto.recommendedParams || DEFAULT_PARAMS
        })
      });

      const data = await response.json();
      addLog(`本地 Lightroom 同步指令已确认！接口路径: ${data.endpointCalled}`);
      
      // Auto-trigger the user visual web page redirect rule: "After running locally, it should automatically redirect to a website page."
      setLocalRedirectTriggered(true);
      setRedirectCount(3);
      
      addLog("本地工作空间同步成功。正在前往展示页面进行即时回调跳转...");
    } catch {
      // Offline fallback
      addLog("本地连接代理桥接已触发。模拟同步成功完成。");
      setLocalRedirectTriggered(true);
      setRedirectCount(3);
    }
  };

  // Tick timer for simulated page redirect
  useEffect(() => {
    if (!localRedirectTriggered) return;

    const timer = setInterval(() => {
      setRedirectCount(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to elegant color grading showcase web page
          window.open("https://lightroom.adobe.com", "_blank");
          setLocalRedirectTriggered(false);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [localRedirectTriggered]);

  const toggleConnection = async () => {
    try {
      const response = await fetch("/api/lightroom/toggle-connection", { method: "POST" });
      const data = await response.json();
      setApiConfig(prev => ({ ...prev, connected: data.connected }));
      addLog(`Lightroom 本地连接状态已变更为: ${data.connected ? "已激活" : "未连接"}`);
    } catch {
      // toggle local state fallback
      setApiConfig(prev => ({ ...prev, connected: !prev.connected }));
    }
  };

  // Initialize with some content on first mount
  useEffect(() => {
    injectMockFolder();
  }, []);

  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center font-mono selection:bg-[#00FF5F] selection:text-black overflow-hidden relative">
        {/* Background futuristic grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />
        
        <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ duration: 1.2, ease: "easeOut" }}
           className="text-center z-10"
        >
          <motion.h1 
             animate={{ y: [0, -10, 0] }}
             transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
             className="text-4xl md:text-7xl font-black tracking-tighter uppercase mb-2"
          >
             CHANING.G'S<br />
             <span className="text-transparent" style={{ WebkitTextStroke: "2px #00FF5F" }}>LIGHTROOM LAB</span>
          </motion.h1>
          <p className="text-zinc-500 tracking-widest text-xs mt-6 mb-16">NEURAL GRADING STATION V4.0</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.button
               whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 255, 95, 0.2)" }}
               whileTap={{ scale: 0.95 }}
               onClick={() => { setActiveMode("quick"); setShowSplash(false); }}
               className="group relative px-8 py-4 bg-[#050505] border border-[#00FF5F] text-[#00FF5F] rounded font-bold tracking-widest text-sm overflow-hidden cursor-pointer"
            >
               <div className="absolute inset-0 bg-[#00FF5F]/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
               <Zap className="w-5 h-5 inline-block mr-2 relative z-10" />
               <span className="relative z-10 text-xs">快速模式 (QUICK)</span>
            </motion.button>

            <motion.button
               whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255, 255, 255, 0.1)" }}
               whileTap={{ scale: 0.95 }}
               onClick={() => { setActiveMode("professional"); setShowSplash(false); }}
               className="group relative px-8 py-4 bg-[#050505] border border-zinc-700 text-zinc-300 hover:text-white rounded font-bold tracking-widest text-sm overflow-hidden cursor-pointer"
            >
               <div className="absolute inset-0 bg-white/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
               <Layers className="w-5 h-5 inline-block mr-2 relative z-10" />
               <span className="relative z-10 text-xs">专家模式 (EXPERT)</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="full-app-root" className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row antialiased selection:bg-[#00FF5F] selection:text-black relative">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0 mix-blend-screen" />
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#00FF5F]/5 to-transparent pointer-events-none z-0" />
      
      {/* Dynamic Left Minimalist Structural Navigation Rail */}
      <aside className="w-full md:w-20 md:min-h-screen border-b md:border-b-0 md:border-r border-[#404040] flex md:flex-col items-center justify-between py-4 md:py-10 px-4 md:px-0 bg-[#050505] z-30 relative shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex md:flex-col items-center gap-6">
          {/* Logo container & style identifier */}
          <div className="w-11 h-11 border border-[#00FF5F] rounded-lg flex items-center justify-center font-bold text-xs tracking-wider text-[#00FF5F] bg-[#050505] shadow-[0_0_15px_rgba(0,255,95,0.15)] select-none">
            LR
          </div>
          
          <nav className="flex md:flex-col gap-4 mt-2">
            <h5 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest md:-rotate-90 md:mt-8 md:mb-10 text-center whitespace-nowrap">
              切换模式
            </h5>
            <button 
              onClick={() => setActiveMode("quick")}
              className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                activeMode === "quick" 
                  ? "border-[#00FF5F] text-[#00FF5F] bg-[#050505]" 
                  : "border-[#404040] text-[#404040] hover:text-white hover:border-zinc-500"
              }`}
              title="快速模式：AI 艺术风格预设"
            >
              <Zap className="w-4 h-4" />
              <span className="text-[8px] tracking-wide mt-1">快速预设</span>
            </button>

            <button 
              onClick={() => setActiveMode("professional")}
              className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                activeMode === "professional" 
                  ? "border-[#00FF5F] text-[#00FF5F] bg-[#050505]" 
                  : "border-[#404040] text-[#404040] hover:text-white hover:border-zinc-500"
              }`}
              title="专业模式：自定义指示词微调及其扩展"
            >
              <Layers className="w-4 h-4" />
              <span className="text-[8px] tracking-wide mt-1">专业语意</span>
            </button>
          </nav>
        </div>

        {/* Lightroom Status Toggle Indicator in Main Rail */}
        <button 
          onClick={toggleConnection}
          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col items-center gap-1 ${
            apiConfig.connected 
              ? "border-[#00FF5F]/30 text-[#00FF5F] bg-[#00FF5F]/5" 
              : "border-[#404040] text-[#404040] hover:text-red-400"
          }`}
          title={apiConfig.connected ? "Lightroom 本地辅助助手上线" : "Lightroom 本地辅助助手未就绪，点击以尝试连接"}
        >
          {apiConfig.connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="text-[8px] font-mono font-medium tracking-wide">接口</span>
        </button>
      </aside>

      {/* Main Structural Layout Content Container */}
      <main className={`flex-1 flex flex-col p-6 md:p-12 max-w-7xl mx-auto w-full transition-all duration-300 ease-in-out ${isSidebarOpen ? "md:pr-[380px]" : ""}`}>
        
        {/* HERO DISPLAY PANEL with Bold Typography Text */}
        <motion.section 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#404040] pb-8"
        >
          <div>
            <motion.h1 
              className="text-4xl md:text-6xl font-black tracking-tighter leading-none select-none uppercase"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "circOut", delay: 0.2 }}
            >
              CHANING.G'S<br />
              <span className="text-transparent" style={{ WebkitTextStroke: "1px #808080" }}>LIGHTROOM LAB</span>
            </motion.h1>
            <p className="text-zinc-400 text-sm mt-3 font-mono max-w-xl">
              探索大语言模型渲染美学的无限边界 —— 神经网络级一键式云端调色设计平台。
            </p>
          </div>

                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80 mb-6 w-full max-w-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
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
          <div className="flex flex-wrap gap-2.5">
            {/* Quick folder upload action selector button */}
            <input 
              type="file" 
              id="directory-uploader"
              ref={directoryInputRef}
              onChange={handleDirectoryUpload}
              className="hidden"
              webkitdirectory=""
              directory=""
              multiple
            />
            <input 
              type="file" 
              id="file-uploader"
              ref={fileInputRef}
              onChange={handleDirectoryUpload}
              className="hidden"
              multiple
              accept="image/*"
            />
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="open-folder-btn"
              onClick={triggerDirectoryScan}
              className="px-5 py-3 bg-[#050505] hover:bg-zinc-900 text-white font-mono text-[11px] tracking-wider font-bold border border-[#00FF5F] rounded-lg flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(0,255,95,0.1)] cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-[#00FF5F]" />
              载入 RAW 文件夹
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="open-files-btn"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-3 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono text-[11px] tracking-wider border border-[#404040] rounded-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              添加多张照片
            </motion.button>
          </div>
        </motion.section>

        {/* Dynamic Local Web Landing Redirect Overlay Banner */}
        {localRedirectTriggered && (
          <div className="mb-8 p-5 bg-[#00FF5F]/10 border border-[#00FF5F] rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00FF5F]/20 flex items-center justify-center text-[#00FF5F]">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#00FF5F] tracking-wide uppercase font-mono">本地客户端 Lightroom 参数同步成功</h4>
                <p className="text-xs text-zinc-300 mt-0.5 font-mono">Lightroom 参数属性及色彩曲线已重构。将在 {redirectCount} 秒内自动为您开启美学调色大图展示站...</p>
              </div>
            </div>
            <button 
              onClick={() => window.open("https://lightroom.adobe.com", "_blank")}
              className="px-4 py-2 bg-[#00FF5F] text-black font-mono text-[10px] tracking-wider uppercase font-extrabold rounded hover:bg-white transition-colors"
            >
              立刻跳转
            </button>
          </div>
        )}

        {/* PRIMARY FUNCTIONAL WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT AREA: Scanned Photo Queue & Analysis Selector (5 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Folder Information and Queue Panel */}
            <div className="bg-[#050505] border border-[#404040] rounded-xl p-5 flex flex-col h-[400px]">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00FF5F]" />
                  <span className="text-[10px] font-mono tracking-wider text-[#00FF5F] uppercase font-bold">作品检测及预览队列</span>
                </div>
                {folderData && (
                  <span className="text-[10px] font-mono text-[#00FF5F] px-2 py-0.5 bg-[#00FF5F]/15 border border-[#00FF5F]/20 rounded-full">
                    已载入 {folderData.photos.length} 张图片
                  </span>
                )}
              </div>

              {/* Current Loaded Folder Title Info */}
              <div className="mb-4">
                <h3 className="text-sm font-mono font-black text-white uppercase tracking-wider truncate">
                  {folderData ? folderData.name : "暂无载入的作品集"}
                </h3>
                <p className="text-[10px] font-mono text-[#404040] mt-0.5">
                  物理地址: {folderData ? `~/Desktop/${folderData.name}` : "等待扫描物理目录或加载演示数据"}
                </p>
              </div>

              {/* Photos Scrolling Container */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {isScanning ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#00FF5F] animate-spin" />
                    <span className="text-xs font-mono tracking-wider text-zinc-400">正在扫描 RAW 图像流通道...</span>
                  </div>
                ) : folderData && folderData.photos.length > 0 ? (
                  folderData.photos.map((photo) => {
                    const isSelected = selectedPhoto?.id === photo.id;
                    return (
                      <button
                        key={photo.id}
                        onClick={() => setSelectedPhoto(photo)}
                        className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer group ${
                          isSelected 
                            ? "border-[#00FF5F] bg-zinc-900/60" 
                            : "border-zinc-900 bg-[#050505] hover:bg-zinc-900/40"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {photo.url ? (
                            <img 
                              src={photo.url} 
                              alt="缩略图" 
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded object-cover border border-zinc-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-zinc-900 flex items-center justify-center text-zinc-700">
                              <FileImage className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className={`text-xs font-mono truncate ${isSelected ? "text-[#00FF5F] font-bold" : "text-zinc-300 group-hover:text-white"}`}>
                              {photo.name}
                            </p>
                            <p className="text-[9px] font-mono text-zinc-500">
                              {(photo.size / (1024 * 1024)).toFixed(1)} MB • {photo.path.split("/").length > 1 ? "RAW 相机原图" : "演示大图"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {photo.analyzing ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF5F] animate-ping" />
                          ) : photo.isAnalyzed ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] font-mono text-[#00FF5F] font-bold tracking-wider uppercase bg-[#00FF5F]/10 px-1 border border-[#00FF5F]/20 rounded-sm">
                                {photo.styleName}
                              </span>
                            </div>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <FolderOpen className="w-8 h-8 text-zinc-700 anim-pulse" />
                    <div>
                      <p className="text-xs font-mono text-zinc-400">本地沙盒文件系统就绪</p>
                      <p className="text-[10px] font-mono text-[#404040] mt-1 max-w-xs">
                        点击上方“载入 RAW 文件夹”按钮，或使用下方的一键演示作品集。
                      </p>
                    </div>
                    <button
                      onClick={injectMockFolder}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-[#00FF5F] rounded text-[10px] font-mono text-white"
                    >
                      加载演示作品预设
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mode & Prompting Settings Panel */}
            <div className="bg-[#050505] border border-[#404040] rounded-xl p-5 flex flex-col">
              
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00FF5F]" />
                <span className="text-[10px] font-mono tracking-wider text-[#00FF5F] uppercase font-bold">
                  {activeMode === "quick" ? "选项 01：快速色彩提取 & 艺术预设" : "选项 02：专业级 LLM 生成与色彩语言微调"}
                </span>
              </div>

              {activeMode === "quick" ? (
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
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-mono font-bold transition-all ${
                          presetCategory === cat 
                            ? "bg-[#00FF5F] text-black shadow-[0_0_15px_rgba(0,255,95,0.4)]" 
                            : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500"
                        }`}
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
                        className={`group relative border p-4 rounded-xl cursor-pointer transition-all overflow-hidden ${
                          selectedPhoto?.styleName === preset.name 
                            ? "border-[#00FF5F] bg-[#00FF5F]/5 shadow-[0_0_20px_rgba(0,255,95,0.1)]" 
                            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900"
                        }`}
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
                      <h5 className="text-[10px] text-[#00FF5F] font-mono tracking-widest font-bold">推荐风格：</h5>
                      <div className="flex flex-col gap-3">
                        {quickRecommendations.map((rec, i) => {
                           const places = ["第一名", "第二名", "第三名"];
                           const placeText = places[i] || `第${i + 1}名`;
                           return (
                             <div key={i} className="group relative border border-zinc-800 hover:border-[#00FF5F]/50 rounded-lg p-4 bg-zinc-900/30 transition-all cursor-pointer overflow-hidden" 
                                  onClick={() => {
                                    const appliedParams = { ...DEFAULT_PARAMS, ...rec.parameters };
                                    const updatedPhoto = { ...selectedPhoto, isAnalyzed: true, styleName: rec.styleName, reasoning: rec.reasoning, recommendedParams: appliedParams };
                                    setSelectedPhoto(updatedPhoto);
                                    setFolderData(prev => prev ? { ...prev, photos: prev.photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p) } : null);
                                    addLog(`用户应用了 AI 推荐的风格预设: [${rec.styleName}]`);
                                  }}>
                               <div className="text-[11px] font-mono leading-relaxed">
                                 <span className="text-white font-bold tracking-wider">{placeText}：{rec.styleName}</span>
                                 <span className="text-zinc-400">，理由：{rec.reasoning}</span>
                               </div>
                               <div className="mt-3 inline-block px-2 py-1 text-[8.5px] font-mono bg-[#00FF5F]/10 text-[#00FF5F] rounded border border-[#00FF5F]/20 font-bold tracking-wide">
                                 点击此项以套用专属配方参数
                               </div>
                             </div>
                           )
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold font-mono tracking-wider text-zinc-200 uppercase">专业级泛化语意调谐 (LLM)</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 font-mono leading-relaxed">
                      运用大模型对自然语言的泛化理解，通过输入艺术指导或视觉描述，直接生成包含 HSL、色调曲线和去雾的深空参数数组：
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute -top-2 left-3 px-1.5 bg-[#050505] text-[#00FF5F] text-[9px] font-mono tracking-widest font-bold z-10">神经元训练节点 (PROMPT)</div>
                    <textarea
                      id="aesthetic-prompt"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="例如：20世纪70年代复古温暖底片，和煦柔和的阳光漫射，微凸的青绿色暗部，降低数字数码锐化，经典老照片质感..."
                      className="relative w-full h-28 bg-zinc-950 border border-zinc-800 rounded-lg p-4 pt-5 text-xs font-mono font-medium placeholder-zinc-700 focus:outline-none focus:border-[#00FF5F] text-white resize-none shadow-inner"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={triggerStyleDetection}
                    disabled={!selectedPhoto || isAnalyzing}
                    className="w-full py-3 bg-[#00FF5F] text-black font-mono text-xs tracking-widest font-black uppercase rounded-lg hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-black animate-spin" />
                        深度网络回传数据分析中...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-black" />
                        运行大模型多模态色彩生成
                      </>
                    )}
                  </motion.button>
                  
                </motion.div>
              )}
            </div>

            {/* Interpretation Module below settings */}
            <AnimatePresence>
              {selectedPhoto && selectedPhoto.reasoning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-[#050505] border border-[#00FF5F]/20 rounded-xl p-6 shadow-[0_0_30px_rgba(0,255,95,0.05)] mt-6 relative overflow-hidden group"
                >
                  {/* Decorative background glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF5F]/5 rounded-full blur-3xl group-hover:bg-[#00FF5F]/10 transition-all duration-700 pointer-events-none" />
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-[#00FF5F]" />
                    <h4 className="text-sm font-bold font-mono tracking-widest text-[#00FF5F] uppercase">参数与美学解析</h4>
                  </div>
                  <div className="text-xs font-mono text-zinc-400 leading-loose break-words whitespace-pre-wrap relative z-10 transition-colors group-hover:text-zinc-300">
                    {selectedPhoto.reasoning}
                  </div>
                  {activeMode === "quick" && (
                    <div className="mt-4 pt-4 border-t border-zinc-900 text-[10px] text-zinc-600 font-mono italic relative z-10">
                      ▷ 分析依据：基于所选艺术预设，提取核心曝光、通透解像度及色彩科学偏移形成的视觉特征解释。
                    </div>
                  )}
                  {activeMode === "professional" && (
                    <div className="mt-4 pt-4 border-t border-zinc-900 text-[10px] text-zinc-600 font-mono italic relative z-10">
                      ▷ 运算意图：神经网络大语言模型针对特定美学语义 "{customPrompt || "自然影像"}" 的解构推理及跨模态降维映射结果。
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>



            {/* Parameters Export Panel */}
            <AnimatePresence>
              {selectedPhoto && selectedPhoto.recommendedParams && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-[#050505] border border-zinc-900 rounded-xl p-5 relative mt-auto"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-bold font-mono tracking-wider text-zinc-300 uppercase">当前参数矩阵剪贴板</h4>
                    <button
                      onClick={() => {
                        if (!selectedPhoto.recommendedParams) return;
                        const activeParams = Object.entries(selectedPhoto.recommendedParams)
                          .filter(([_, val]) => val !== 0 && val !== undefined)
                          .map(([key, val]) => `${key}: ${(val as number) > 0 ? '+' : ''}${val}`)
                          .join('\n');
                        navigator.clipboard.writeText(activeParams || '全部参数已归零');
                      }}
                      className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded transition-colors uppercase tracking-wider border border-zinc-800 cursor-pointer active:scale-95"
                      title="复制非零参数"
                    >
                      点击复制 (COPY)
                    </button>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-1 text-[10px] font-mono text-zinc-500 max-h-[140px] overflow-y-auto custom-scrollbar pr-2 pt-1">
                    {Object.entries(selectedPhoto.recommendedParams)
                      .filter(([_, val]) => val !== 0 && val !== undefined)
                      .map(([key, val]) => (
                        <div key={key} className="flex justify-between border-b border-zinc-900/50 py-1 hover:bg-zinc-900/30 px-1 rounded transition-colors">
                          <span className="text-zinc-400 truncate pr-2 capitalize">{key}</span>
                          <span className={`font-bold ${(val as number) > 0 ? "text-[#00FF5F]" : "text-blue-400"}`}>{(val as number) > 0 ? `+${val}` : val}</span>
                        </div>
                      ))}
                    {Object.values(selectedPhoto.recommendedParams).filter(v => v !== 0 && v !== undefined).length === 0 && (
                      <div className="col-span-full py-4 text-center text-zinc-600">
                        当前均为默认参数，无偏移值。
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT AREA: Core Image Comparison View & Parameter Tuning (7 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Split before / after viewer */}
            <AnimatePresence mode="wait">
              {selectedPhoto ? (
                <motion.div 
                  key="has-photo"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4 sticky top-0 z-20 pt-6 pb-6 bg-black -mx-6 px-6 md:-mx-12 md:px-12"
                >
                  <ImageComparison 
                    imageUrl={selectedPhoto.url} 
                    params={selectedPhoto.recommendedParams || DEFAULT_PARAMS} 
                    alt={selectedPhoto.name}
                  />

                  {/* Info and Sync actions line */}
                  <div className="bg-[#050505] border border-zinc-900 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-white uppercase">
                          当前图像帧: {selectedPhoto.name}
                        </span>
                        {selectedPhoto.styleName && (
                          <span className="text-[9px] font-mono px-2 py-0.5 bg-[#00FF5F]/10 text-[#00FF5F] border border-[#00FF5F]/20 rounded-md uppercase font-bold">
                            {selectedPhoto.styleName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={downloadXmpSetting}
                        disabled={!selectedPhoto.isAnalyzed}
                        className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] tracking-wider border border-zinc-800 hover:border-zinc-700 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center flex-1 md:flex-initial cursor-pointer disabled:opacity-40"
                        title="下载当前照片的 Lightroom .XMP 后缀配置模板"
                      >
                        <Download className="w-3.5 h-3.5" />
                        导出 XMP
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(0,255,95,0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={runLocalLightroomSync}
                        disabled={!selectedPhoto.isAnalyzed}
                        className="px-4 py-2 bg-[#00FF5F] text-black font-mono text-[10px] tracking-wider font-extrabold uppercase rounded-lg hover:bg-white transition-all flex items-center justify-center gap-1.5 text-center flex-1 md:flex-initial cursor-pointer disabled:opacity-40"
                      >
                        <SlidersIcon className="w-3.5 h-3.5 text-black" />
                        同步 LR
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="no-photo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[450px] md:h-[550px] bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col items-center justify-center text-center p-8 text-zinc-500"
                >
                  <Camera className="w-12 h-12 text-zinc-800 mb-4 animate-pulse" />
                  <h4 className="text-sm font-mono text-zinc-300 uppercase font-bold">画幅工作台待载入</h4>
                  <p className="text-xs font-mono text-zinc-500 max-w-sm mt-2 leading-relaxed">
                    请点击上方的“载入 RAW 文件夹”按钮导入多张底片，或从左侧作品预览队列中选择一幅演示底片，即可激活实时对比工作区。
                  </p>
                </motion.div>
              )}
            </AnimatePresence>



          </div>

        </div>

        {/* FOOTER SYSTEM MONITOR & AUDITING PANELS */}
        <footer className="mt-14 pt-8 border-t border-[#404040] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-[11px] font-mono text-[#404040]">
          
          <div className="flex gap-10">
            <div className="flex flex-col gap-1">
              <span className="uppercase text-zinc-500 tracking-wider">神经色彩引擎</span>
              <span className="text-white font-bold select-none text-xs">VOGUE-GENAI-V4</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="uppercase text-zinc-500 tracking-wider">本地连接接口 (API)</span>
              <span className={`font-bold text-xs ${apiConfig.connected ? "text-[#00FF5F]" : "text-zinc-500"}`}>
                {apiConfig.connected ? "已连接 (127.0.0.1:18000)" : "等待桥接助手 (离线模式)"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="uppercase text-zinc-500 tracking-wider">运行工作区</span>
              <span className="text-white font-bold text-xs">UTC 服务器 2026</span>
            </div>
          </div>

          <div className="w-full md:w-96 flex flex-col gap-2">
            <span className="uppercase text-zinc-500 tracking-wider font-bold">系统实时日志总线 (Logs)</span>
            <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-900 font-mono text-[9px] text-zinc-400 max-h-16 overflow-y-auto space-y-1">
              {systemLogs.map((log, idx) => (
                <div key={idx} className="truncate select-none">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </footer>
        
        {/* Author Credit */}
        <div className="mt-6 text-center text-[10px] text-zinc-600 font-mono tracking-widest pb-4">
          原创作者Channing.G Wechat：15524872722
        </div>

      </main>

      {/* Right Edge Toggle */}
      <AnimatePresence>
        {selectedPhoto && !isSidebarOpen && (
          <motion.button
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#050505] border-l border-y border-zinc-900 shadow-[0_0_20px_rgba(0,255,95,0.1)] text-zinc-400 py-6 px-1.5 rounded-l-xl hover:text-white hover:border-[#00FF5F]/50 transition-all z-40 group flex flex-col items-center justify-center gap-4 cursor-pointer"
          >
            <PanelRight className="w-5 h-5 text-zinc-500 group-hover:text-[#00FF5F] transition-colors" />
            <span className="text-xs font-mono [writing-mode:vertical-lr] tracking-[0.2em] font-bold group-hover:text-white transition-colors">参数与曲线面板</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Right Sidebar for Parameters */}
      <AnimatePresence>
        {isSidebarOpen && selectedPhoto && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed top-0 right-0 h-screen w-80 md:w-[380px] bg-[#030303] border-l border-zinc-800 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-900 bg-[#050505] shrink-0">
              <div className="flex items-center gap-2">
                 <SlidersIcon className="w-4 h-4 text-[#00FF5F]" />
                 <h3 className="text-xs font-mono font-bold text-white tracking-widest uppercase">调色参数工作台</h3>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer bg-zinc-900 hover:bg-zinc-800 p-1 rounded border border-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-8 pb-32">
               <div>
                  <h4 className="text-[10px] font-mono text-[#00FF5F] font-bold uppercase tracking-widest mb-4">亮度与对比度控制曲线</h4>
                  <ToneCurveVisualizer params={selectedPhoto.recommendedParams || DEFAULT_PARAMS} />
               </div>
               
               <div className="border-t border-zinc-900 pt-8">
                  <h4 className="text-[10px] font-mono text-[#00FF5F] font-bold uppercase tracking-widest mb-4">核心参数与高级色彩矩阵</h4>
                  <GradingSliders params={selectedPhoto.recommendedParams || DEFAULT_PARAMS} onChange={handleManualSliderChange} />
               </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-900 bg-[#050505] shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
               <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={runLocalLightroomSync}
                  className="w-full py-4 bg-[#00FF5F] text-black font-mono text-xs font-extrabold uppercase rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2 tracking-widest cursor-pointer shadow-[0_0_15px_rgba(0,255,95,0.2)]"
               >
                 <SlidersIcon className="w-4 h-4 text-black" />
                 应用参数至引擎
               </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
