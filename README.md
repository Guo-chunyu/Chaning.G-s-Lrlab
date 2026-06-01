# VOGUE-GENAI-V4 AI Lightroom 调色工作台

一个面向摄影后期的 AI 调色与 Lightroom 参数生成工具。项目支持导入本地照片，在浏览器中实时预览 Before / After 调色效果，并生成可用于 Lightroom Classic 的 `.XMP` 预设参数。

作者：Chaning.G  
微信：15524872722

## 项目亮点

- **AI 智能调色建议**：根据照片内容生成 3 组适合当前画面的调色方案，包含风格名称、调色理由和 Lightroom 参数。
- **专业参数面板**：支持曝光、对比度、高光、阴影、白色色阶、黑色色阶、色温、色调、自然饱和度、饱和度、清晰度、去雾等常用调色参数。
- **HSL 八色通道控制**：支持红、橙、黄、绿、青、蓝、紫、洋红的色相、饱和度、明度调整。
- **Canvas 像素级调色预览**：不再只依赖 CSS filter，预览层会进行真实像素级处理，包括自动曝光、白平衡、曲线、肤色保护、暗角、颗粒和高光柔化。
- **Before / After 对比视图**：拖动分割线即可直观看到原图与调色后效果差异。
- **Tone Curve 可视化**：右侧工作台展示当前参数对应的曲线变化，方便理解影调结构。
- **XMP 导出**：可将当前调色参数导出为 Lightroom 可读取的 `.XMP` 文件。
- **本地 Lightroom 同步接口**：预留本地同步桥接接口，方便后续接入 Lightroom Classic 自动应用参数。

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Express
- Google Gemini API
- Canvas 2D 图像处理

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

然后在 `.env` 中填写你的 Gemini API Key：

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

如果没有配置 API Key，项目仍然可以运行，但 AI 调色会进入本地模拟模式。

### 3. 启动开发服务

```bash
npm run dev
```

启动成功后打开：

[http://localhost:3000](http://localhost:3000)

### Windows 一键启动

Windows 用户也可以直接双击项目根目录中的：

```text
双击一键本地启动.bat
```

脚本会自动安装依赖并启动本地服务。

## 常用命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动构建后的服务
npm run start

# TypeScript 检查
npm run lint
```

## 使用方式

1. 打开本地页面后，导入照片文件夹或使用内置演示照片。
2. 选择一张照片进入主预览区。
3. 点击 AI 分析，系统会生成多组调色建议。
4. 选择喜欢的调色方案，也可以打开右侧参数面板进行手动微调。
5. 使用 Before / After 分割线对比原图和调色后效果。
6. 满意后导出 `.XMP`，导入 Lightroom 使用。

## 项目结构

```text
.
├── src
│   ├── App.tsx                         # 主界面与业务流程
│   ├── main.tsx                        # React 入口
│   ├── index.css                       # 全局样式
│   ├── types.ts                        # 类型定义
│   ├── components
│   │   ├── GradingSliders.tsx          # 调色参数面板
│   │   ├── ImageComparison.tsx         # Before / After 对比预览
│   │   └── ToneCurveVisualizer.tsx     # 曲线可视化
│   └── utils
│       ├── filter.ts                   # 预设与 CSS fallback 滤镜
│       └── canvasGrading.ts            # Canvas 像素级调色引擎
├── server.ts                           # Express + Gemini API 服务
├── package.json
├── vite.config.ts
└── 双击一键本地启动.bat
```

## 调色引擎说明

项目目前包含两套预览路径：

- `canvasGrading.ts`：主调色引擎，负责真实像素级预览。
- `filter.ts`：保留为 CSS fallback，当跨域图片或浏览器限制导致 Canvas 无法读取像素时自动降级使用。

Canvas 调色引擎包含以下处理：

- 自动曝光补偿
- 灰度世界白平衡
- 高光 / 阴影 / 白色 / 黑色分区影调映射
- 参数化曲线
- HSL 色彩混合
- 肤色保护
- 自然饱和度增强
- 胶片式高光 roll-off
- 暗角与细颗粒

## API 说明

主要接口：

```text
GET  /api/health
GET  /api/lightroom/status
POST /api/analyze-grading
POST /api/generate-from-prompt
POST /api/lightroom/sync
```

其中：

- `/api/analyze-grading`：根据照片生成 3 组智能调色方案。
- `/api/generate-from-prompt`：根据用户输入的风格提示词生成调色参数。
- `/api/lightroom/sync`：模拟将当前参数同步到本地 Lightroom 辅助服务。


## License

Apache-2.0
