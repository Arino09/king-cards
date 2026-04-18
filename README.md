# 卡牌对弈（单机 Web）

基于《卡牌游戏规则》的纯前端单机对弈应用，使用 Vite、React、TypeScript 构建。

## 环境要求

- [Node.js](https://nodejs.org/) 18+（建议 LTS）
- 包管理器：npm（随 Node 安装）

## 安装依赖

在项目根目录执行：

```bash
npm install
```

## 本地开发

启动开发服务器（默认 <http://localhost:5173>）：

```bash
npm run dev
```

## 生产构建与预览

```bash
npm run build
```

构建产物输出到 `dist/`。本地预览生产构建：

```bash
npm run preview
```

将 `dist/` 部署到任意静态站点托管（如 Nginx、GitHub Pages、对象存储静态网站等）即可。

## 测试

```bash
npm test
```

监听模式：

```bash
npm run test:watch
```

## 脚本一览

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建结果 |
| `npm test` | 运行单元测试（Vitest） |
| `npm run test:watch` | 测试监听模式 |

## 文档

- 规则说明：`doc/卡牌游戏规则.md`
- 工程约定：`doc/工程规则.md`
- 进度记录：`doc/进度文档.md`
