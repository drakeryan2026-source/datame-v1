# 🛡️ datame v1

> 你的个人数据主权工具 — 把散落在硬盘、证件、聊天记录里的个人信息，统一归档到本地加密数据库。

![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![Electron](https://img.shields.io/badge/electron-28-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ 功能特性

### 📂 智能收件箱
- 扫描本地文件夹，自动识别证件、文档、图片、聊天记录等文件
- **AI 一键分析**：调用 GPT-4o 识别文件内容，提取关键字段，给出分类建议和置信度（绿/橙/红）
- **批量归档**：一键分析并归档所有待处理文件，顶部进度条实时推进
- 支持单文件分析、手动归档、撤回归档、删除条目

### 🗂️ 12 个内置数据分类
| 分类 | 说明 |
|------|------|
| 👤 基础身份 | 姓名、证件号、护照、驾照等 |
| 📮 联系与定位 | 手机、邮箱、微信、地址等 |
| 🏥 医疗与健康 | 血型、病史、过敏史、体检报告等 |
| 🧠 心理与人格 | MBTI、价值观、决策风格等 |
| 🎓 教育与学历 | 学校、专业、技能、证书等 |
| 💼 职业与事业 | 雇主、职位、收入范围等 |
| 👨‍👩‍👧 家庭与社会关系 | 家庭成员、重要朋友等 |
| 🏠 资产与财务 | 房产、车辆、银行卡、投资等 |
| ⚖️ 法律与合规 | 合同、违章、知识产权等 |
| 🎵 兴趣与生活 | 音乐、影视、饮食、旅行偏好等 |
| 💬 AI 对话记录 | ChatGPT、Claude、DeepSeek 等 |
| 🔐 账号与密码 | 社交平台、WiFi、门锁密码等 |

支持**自定义分类**，自选图标和颜色。

### 💬 聊天记录导入
支持从以下平台导入并用 AI 提取个人信息：
- 微信 / WhatsApp / Telegram
- ChatGPT / Claude / 飞书 / 钉钉

### 📊 完整度追踪
侧边栏实时显示每个分类的填写进度，顶部进度条汇总整体数据完整度。

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- macOS（当前仅支持 Mac）

### 安装与启动

```bash
git clone https://github.com/drakeryan2026-source/datame-v1.git
cd datame-v1
npm install
npm start
```

### 配置 AI（可选）

点击右上角设置，填入 OpenAI API Key，即可使用 AI 分析、自动归档功能。

---

## 🏗️ 技术栈

- **Electron 28** — 桌面应用框架
- **原生 HTML/CSS/JS** — 无前端框架，零依赖 UI
- **OpenAI GPT-4o** — 文件内容识别与字段提取（需自备 API Key）
- **本地 JSON 存储** — 数据保存在 `~/Library/Application Support/datame/`，不上云

---

## 📦 打包构建

```bash
npm run build
```

输出 `.dmg` 安装包至 `dist/` 目录。

---

## 🔒 隐私说明

- 所有个人数据**仅存储在本地**，不经过任何服务器
- AI 分析功能会将文件内容发送至 OpenAI API，如需完全离线请跳过 AI 功能
- 数据文件路径：`~/Library/Application Support/datame/datame-v1.json`

---

## 📄 License

MIT
