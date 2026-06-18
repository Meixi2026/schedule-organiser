# 日程 · Schedule Organiser

自用 macOS 桌面日程管理工具。自然语言 / 语音输入，DeepSeek 智能解析，重要事项提醒，隐藏模式弹窗，每半天 AI 陪伴话语。

**当前版本：v1.0.0（MVP，可自用）**

## 日常使用

双击桌面上的 **日程.app** 即可，无需终端。

首次打开若提示「无法验证开发者」：右键 → 打开 → 打开。

## 设置 DeepSeek API Key

1. 打开应用，点击右上角 ⚙
2. 粘贴 DeepSeek API Key（`sk-...`）
3. 点击保存

不填 Key 也能用基础规则解析。

## 开发

```bash
cd "/Users/meixibenwangdechuangyikongjian/Desktop/schedule-organiser"
npm install                  # 首次或依赖变更后
bash scripts/install-electron.sh   # macOS 若 Electron 启动失败
npm run dev                  # 开发模式（热更新）
npm run pack                 # 打包 macOS App → release/
npm run stop                 # 停止 dev 进程
```

打包产物：

- `release/mac-arm64/日程.app` — 可直接使用
- `release/日程-1.0.0-arm64.dmg` — 安装镜像

## 技术栈

Electron 31 + React 18 + TypeScript + Vite + electron-store + DeepSeek API

## 给 Agent 的交接文档

后续优化请阅读 **[AGENTS.md](./AGENTS.md)**。
