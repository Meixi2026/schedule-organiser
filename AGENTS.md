# Agent 交接文档

> 本文档供后续 Cursor Agent 接手优化时使用。阅读本文 + `README.md` 即可上手。

## 项目状态（v1.0.0 MVP）

**可自用，已打包为 macOS App。** 用户日常双击 `日程.app` 使用，不需要 `npm run dev`。

### 已实现

| 功能 | 位置 |
|------|------|
| 自然语言 / 语音添加日程 | `src/components/ScheduleInput.tsx` |
| DeepSeek AI 解析、DDL 规划、陪伴话语 | `main/aiService.ts` |
| 无 API Key 时的本地规则兜底 | `main/aiService.ts` → `localParse()` |
| 日程列表、筛选、完成、提醒切换 | `src/App.tsx`, `ScheduleList.tsx` |
| DDL 子任务展示与勾选 | `ScheduleList.tsx`, `App.tsx` |
| 重要事项样式 + 定时提醒 | `main/reminderService.ts`, `styles/index.css` |
| 隐藏模式（仅弹窗提醒重要事项） | `main/main.ts` → `hideWindow()` |
| 系统托盘 | `main/main.ts` → `createTray()` |
| 本地持久化（日程、Key、陪伴话） | `electron-store` in `main/main.ts` |
| Apple 风 UI（毛玻璃、无边框） | `src/styles/index.css` |
| macOS 打包 | `npm run pack` → `release/` |

### 已知限制 / 待优化（按优先级）

1. **应用图标**：打包时用默认 Electron 图标；`assets/tray-icon.png` 为程序生成，格式有问题，不宜直接用于 electron-builder
2. **代码签名**：未签名，他人安装需右键打开；多人分发需 Apple Developer 签名 + 公证
3. **陪伴话语**：App 打开时 + 每 30 分钟检查刷新；非严格「到点必换」
4. **DDL 子任务**：仅展示/勾选，非独立日程项，无单独提醒
5. **编辑已添加日程**：无编辑 UI，只能删了重加
6. **提醒逻辑**：仅隐藏模式下弹系统窗；窗口可见时不弹（符合原需求，但无 in-app 通知）
7. **Windows / Linux**：未测试，托盘与窗口逻辑偏 macOS

## 目录结构

```
schedule- organiser/
├── main/                   # Electron 主进程（勿命名为 electron/，会与 npm 包冲突）
│   ├── main.ts             # 窗口、托盘、IPC、单实例、关闭逻辑
│   ├── preload.ts          # contextBridge → window.electronAPI
│   ├── aiService.ts        # DeepSeek API + 本地解析兜底
│   └── reminderService.ts  # 60s 轮询提醒
├── src/                    # React 前端
│   ├── App.tsx             # 主状态、IPC 调用、陪伴话定时器
│   ├── components/         # TitleBar, ScheduleInput, ScheduleList, SettingsPanel, CompanionCard
│   ├── styles/index.css
│   └── types/index.ts      # 共享类型（主进程通过 ../src/types 引用）
├── scripts/
│   └── install-electron.sh # macOS 专用：ditto 解压，修复 install.js 符号链接问题
├── assets/                 # 托盘图标等资源
├── dist/                   # Vite 前端构建产物（gitignore）
├── dist-electron/          # 主进程 TS 编译产物（gitignore）
├── release/                # electron-builder 输出（gitignore）
├── package.json
├── tsconfig.electron.json  # 仅编译 main/
└── vite.config.ts
```

## 关键设计决策

### 窗口控制（TitleBar）

- `frame: false` + 自定义交通灯（`TitleBar.tsx`）
- **不要** 同时使用 `titleBarStyle: 'hidden'`，否则 macOS 会出现两排按钮
- macOS 调用 `setWindowButtonVisibility(false)` 隐藏系统按钮
- 仅保留：🔴 关闭、🟢 隐藏/显示（已移除黄色最小化）

### 关闭行为

- **开发模式**（`npm run dev`）：红色按钮 → `app.quit()`
- **打包版**：红色按钮 → 隐藏到托盘；托盘菜单「退出」→ 真正退出

### Electron 安装（macOS 必读）

`node_modules/electron/install.js` 使用 `extract-zip`，**不保留 macOS 符号链接**，会导致 Framework 损坏。

**正确安装方式：**

```bash
bash scripts/install-electron.sh
```

`postinstall` 会优先尝试此脚本。若用户报告 Electron 启动失败（`dyld` / `Library not loaded`），先跑此脚本。

### 环境变量陷阱

Cursor 内置终端可能设置 `ELECTRON_RUN_AS_NODE=1`，导致 `require('electron').app` 为 undefined。

`package.json` 的 dev/start 脚本已用 `env -u ELECTRON_RUN_AS_NODE` 规避。

### 单实例

`app.requestSingleInstanceLock()` 防止多次 `npm run dev` 开多个窗口。

## 常用命令

```bash
npm run dev          # 开发（Vite :5173 + Electron）
npm run build        # 仅构建，不打包
npm run pack         # 构建 + electron-builder → release/
npm run stop         # 杀 dev 相关进程
bash scripts/install-electron.sh   # 修复 Electron 二进制
```

## 数据存储

`electron-store` 默认路径（macOS）：

`~/Library/Application Support/schedule-organiser/config.json`

含：`schedules`, `apiKey`, `companionMessage`, `isHidden`

## 修改指南

| 需求 | 改哪里 |
|------|--------|
| UI / 样式 | `src/components/`, `src/styles/index.css` |
| 添加/筛选逻辑 | `src/App.tsx` |
| AI 提示词 / 解析 | `main/aiService.ts` |
| 提醒规则 | `main/reminderService.ts` |
| 窗口/托盘/IPC | `main/main.ts`, `main/preload.ts`, `src/types/index.ts` |
| 打包配置 | `package.json` → `build` 字段 |

改完主进程后需 `npm run build:electron`（`dev` 会自动跑）。

## 打包与分发

```bash
npm run pack
# → release/mac-arm64/日程.app
# → release/日程-1.0.0-arm64.dmg
```

替换用户桌面上的 `日程.app` 即可更新。未签名，首次需右键打开。

多人分发需：Apple Developer 签名、公证、考虑 API Key 策略（见用户讨论记录）。

## 依赖与镜像

`.npmrc` 含 `electron_mirror=https://npmmirror.com/mirrors/electron/`（国内加速）。

## 不要做的事

- 不要把主进程文件夹改回 `electron/`（与 npm 包名冲突）
- 不要在 macOS 上仅依赖 `node node_modules/electron/install.js` 而不验证 Framework 符号链接
- 不要提交 `node_modules/`、`dist/`、`release/`、`.env`
- 不要在没有用户要求时创建 git commit

## 版本基线

Git 初始提交标记 **v1.0.0 MVP**。后续优化请基于 `main` 分支（或当前唯一分支）继续。
