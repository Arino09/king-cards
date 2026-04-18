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

## 添加 GitHub 远程并推送

在 [GitHub](https://github.com) 新建一个空仓库（建议仓库名与下方 `base` 一致，例如 **`king-cards`**，且不要勾选「用 README 初始化」，避免首次推送冲突）。

在项目根目录执行（将 `你的用户名`、仓库地址换成你的实际值）：

```bash
git remote add github https://github.com/你的用户名/king-cards.git
git push -u github main
```

若本地默认分支不是 `main`，把上面命令里的 `main` 改成你的分支名。

之后可同时保留 Gitee 与 GitHub：

```bash
git push origin main    # Gitee
git push github main    # GitHub
```

仅需 GitHub 时，可把 `origin` 改成指向 GitHub，或删除原 `origin` 再添加（谨慎操作）。

---

## 部署到 GitHub Pages

项目型 Pages 的地址为 `https://<你的用户名>.github.io/<仓库名>/`，静态资源必须带仓库路径前缀。请使用 **`npm run build:pages`**（勿用普通 `npm run build` 部署到该地址）。

### 方式一：GitHub Actions（推荐）

仓库已包含工作流 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)：向 **`main`** 或 **`master`** 推送时会自动执行 `npm ci` 与 `npm run build:pages`，并将 `dist/` 发布到 Pages（无需把 `dist/` 提交进 Git）。也可在 **Actions** 里手动运行「部署 GitHub Pages」工作流（**workflow_dispatch**）。

1. 将包含工作流与脚本的提交推送到 GitHub：`git push github main`（或你的默认分支名）。
2. 在 GitHub 打开该仓库 → **Settings → Pages**。
3. **Build and deployment** 中，**Source** 选 **GitHub Actions**（不要选 Deploy from a branch，除非你改用分支部署）。
4. 回到 **Actions** 页签，等待「部署 GitHub Pages」工作流跑完；若失败，点开日志查看报错。
5. 部署成功后访问：`https://<你的用户名>.github.io/king-cards/`

首次使用 Pages 时，若仓库为 **私有**，需在 Settings → Pages 中确认当前账号/组织允许对私有仓库使用 Pages（视 GitHub 套餐而定）。

#### Actions 失败常见原因

| 现象 | 处理 |
|------|------|
| **`npm ci` 报错** | 确保 **`package-lock.json`** 已提交并与 `package.json` 一致；本地执行 `npm install` 后重新提交 lock 文件。 |
| **`deploy` 报 artifact / 403** | 将工作流更新为使用 **`actions/deploy-pages@v5`**（本仓库已对齐官方模板）；确认 **Settings → Pages → Source** 为 **GitHub Actions**。 |
| **工作流未触发** | 默认分支若是 **`master`**，需推送 `master`（工作流已监听 `main` 与 `master`）；或到 Actions 里手动运行。 |
| **`github-pages` 环境等待审批** | 若组织策略要求 **Environment** 审批，到 Actions 运行页或仓库 **Settings → Environments** 里批准部署。 |

### 方式二：手动发布到 `gh-pages` 分支（无 Actions 时）

```bash
npm run build:pages
npx --yes gh-pages -d dist
```

然后在 **Settings → Pages** 里将 **Source** 设为分支 **`gh-pages`**、目录 **`/(root)`**。若未安装 `gh-pages`，可先 `npm install -D gh-pages` 再执行，或使用其他方式把 `dist/` 内容推到 `gh-pages` 分支根目录。

### 本地按线上路径预览

```bash
npm run build:pages
npm run preview:pages
```

浏览器打开终端提示的地址下的 **`/king-cards/`** 路径（例如 <http://localhost:4173/king-cards/>）。

### 若 GitHub 仓库名不是 `king-cards`

把 [`package.json`](package.json) 中 `build:pages`、`preview:pages` 里的 `/king-cards/` 改成 `/你的仓库名/`（保持首尾斜杠），提交后再推送并重新部署。

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
| `npm run build:pages` | 供 GitHub Pages 等项目站使用的构建（`base=/仓库名/`） |
| `npm run preview` | 预览构建结果 |
| `npm run preview:pages` | 按线上子路径预览（需先 `build:pages`） |
| `npm test` | 运行单元测试（Vitest） |
| `npm run test:watch` | 测试监听模式 |

## 文档

- 规则说明：`doc/卡牌游戏规则.md`
- 工程约定：`doc/工程规则.md`
- 进度记录：`doc/进度文档.md`
