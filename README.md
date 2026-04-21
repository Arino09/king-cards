# 卡牌对弈（单机 Web）

基于《卡牌游戏规则》的纯前端单机应用：爬塔肉鸽（七层塔、天气、每日行动、商店、Boss / NPC 战）与回合制卡牌对弈，使用 Vite、React、TypeScript 构建。

## 游戏模块

### 玩法概览

开局依次经过**开始菜单 → 角色选择 → 肉鸽 Buff 选择 → 组牌**（十张，须含国王与平民），进入**塔内**后按天行动：打工、访问 NPC、挑战 Boss、商店购物等；战斗为与规则一致的**双方选牌、统一结算**，可查看弃牌堆与对方可见 / 不可见牌组数量；通关或失败后进入**游戏结束**。

### 界面（`src/ui/`）

| 模块 | 文件 | 说明 |
|------|------|------|
| 应用壳 | `GameApp.tsx` | 按当前 `screen` 切换各屏 |
| 开始与开局 | `StartScreen.tsx`、`CharacterSelectScreen.tsx`、`BuffSelectScreen.tsx`、`DeckSetupScreen.tsx` | 菜单、四名角色与被动、`DeckSetupScreen` 组牌 |
| 塔与战斗 | `TowerScreen.tsx`、`BattleScreen.tsx` | 塔内 HUD、每日行动、事件日志；对弈主界面与回合流程 |
| 商店与终局 | `ShopScreen.tsx`、`GameOverScreen.tsx` | 日替商店购物；通关 / 失败结算 |

仓库中另有 `PlayScreen.tsx`、`SetupScreen.tsx` 等，对应早期单局流程，主入口已切至上述爬塔流程。

### 规则与状态机（`src/game/`）

| 模块 | 说明 |
|------|------|
| `manager.ts` | **游戏总管**：`createNewGame`、塔内行动（打工 / NPC / Boss / 商店 / 下一日）、`startBattle`、出牌确认、战斗结束与选卡奖励、回溯等，串联塔与战斗 |
| `battleEngine.ts` | **战斗引擎**：合法着法、`compareCards`、回合结算文案、功能牌与天气相关效果、四象胜利、终局判定 |
| `tower.ts` | **塔与 Meta**：随机天气、日替商店生成、楼层难度与 AI 检索深度映射、奖励卡牌、Buff 效果等 |
| `types.ts` | **类型与数据**：`GameState` / `BattleState`、七层楼层配置、角色、肉鸽 Buff、商店条目等 |
| `cardDefs.ts` | 全牌定义与可玩牌池 |
| `compare.ts`、`rank.ts` | 基础牌比较链、等级与牌面展示文案 |
| `deck.ts`、`validation.ts` | 组牌与出牌合法性（`validation` 亦服务于旧版单局状态机） |
| `engine.ts` | 早期**单局对弈**状态机（`resolvePlay`、终局）；部分单元测试与 `minimax` 仍基于该模型 |
| `ids.ts` | 卡牌实例 ID 生成 |
| `special.ts` | 功能牌扩展相关占位 |

### 机器人 AI（`src/ai/`）

| 模块 | 说明 |
|------|------|
| `battleAi.ts` | 当前战斗使用的 AI：按难度在**本回合贪心**与**极小极大 + Alpha-Beta**（深度由 `tower.difficultyToDepth` 映射）之间切换 |
| `evaluate.ts` | 战斗局面启发式估值（供 `battleAi` 等使用） |
| `minimax.ts` | 面向旧版 `engine` 博弈树的搜索，与主流程中的 `battleEngine` 并行存在，便于规则回归 |

### 全局状态（`src/store/`）

| 模块 | 说明 |
|------|------|
| `useGameStore.ts` | Zustand：当前界面、角色 / Buff / 组牌临时状态、整局 `GameState`，以及出牌、塔内操作、回溯等 action |

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
| `npm run build:pages` | 供 GitHub Pages 等项目站使用的构建（`base=/仓库名/`） |
| `npm run preview` | 预览构建结果 |
| `npm run preview:pages` | 按线上子路径预览（需先 `build:pages`） |
| `npm test` | 运行单元测试（Vitest） |
| `npm run test:watch` | 测试监听模式 |

## 文档

- 规则说明：`doc/卡牌游戏规则.md`
- 工程约定：`doc/工程规则.md`
- 进度记录：`doc/进度文档.md`
