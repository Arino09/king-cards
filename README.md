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

## 部署到 Gitee Pages

本项目在 Gitee 上的仓库名为 `king-cards` 时，站点地址为 `https://<你的用户名>.gitee.io/king-cards/`，静态资源需带仓库路径前缀，请使用专用构建命令（勿用普通 `npm run build` 部署到 Gitee 项目页）。

### 1. 构建

```bash
npm run build:gitee
```

产物仍在 `dist/` 目录。本地按 Gitee 同款路径预览：

```bash
npm run preview:gitee
```

浏览器访问 <http://localhost:4173/king-cards/>（端口以终端输出为准）。

### 2. 在 Gitee 上开启 Pages

1. 登录 [Gitee](https://gitee.com)，进入本仓库（例如 `arino/king-cards`）。
2. 将包含本次改动的代码推送到远程（若尚未推送）：`git push origin main`。
3. 打开 **服务 → Gitee Pages**（部分界面在 **管理** 或 **设置** 中的「Gitee Pages」入口）。
4. 按页面说明完成 **实名认证**（若提示必须认证才能使用 Pages）。
5. 部署方式任选其一：
   - **推荐**：部署分支选 **`main`**（或你的默认分支），**部署目录**填 **`dist`**（即使用仓库里的 `dist/` 作为网站根目录）。本地执行 `npm run build:gitee` 后，由于本仓库默认 **忽略 `dist/`**，需用 **`git add -f dist/`** 再提交并推送，Gitee 才能拿到构建产物。
   - **备选**：新建分支（如 `gitee-pages`），仅将 `dist/` **根目录内文件**（含 `index.html`、`assets/`）推到该分支根目录，Pages 选择该分支、部署目录为 **`/`**（该分支可不跟踪源码，仅跟踪静态文件）。

6. 在 Pages 页面点击 **启动** 或 **更新**。Gitee 可能要求每次推送后 **手动点一次「更新」** 才会重新部署。

### 3. 访问

部署成功后，使用页面给出的地址访问，一般为：

`https://<你的用户名>.gitee.io/king-cards/`

### 4. 若仓库改名

若 Gitee 仓库名不是 `king-cards`，需把 `package.json` 里 `build:gitee`、`preview:gitee` 中的路径 `/king-cards/` 改成 `/你的仓库名/`（保持首尾斜杠），再重新构建与部署。

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
| `npm run build:gitee` | 供 Gitee Pages 使用的构建（`base=/仓库名/`） |
| `npm run preview` | 预览构建结果 |
| `npm run preview:gitee` | 预览 Gitee 同款子路径（需先 `build:gitee`） |
| `npm test` | 运行单元测试（Vitest） |
| `npm run test:watch` | 测试监听模式 |

## 文档

- 规则说明：`doc/卡牌游戏规则.md`
- 工程约定：`doc/工程规则.md`
- 进度记录：`doc/进度文档.md`
