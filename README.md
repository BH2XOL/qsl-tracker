<p style="color:red;font-weight:bold;font-size:0.95rem;line-height:1.6;padding:0.75rem 1rem;border:1px solid rgba(255,0,0,0.3);border-radius:8px;background:rgba(255,0,0,0.05);">
⚠️ 免责声明：本项目代码由 AI 辅助生成，仅供学习和参考使用。使用者应自行审查代码安全性，作者不对因使用本项目造成的任何直接或间接损失承担责任。
</p>

# qsl-tracker

业余无线电 QSL 卡片双向追踪系统，部署在 Cloudflare Workers + D1。管理后台由 Cloudflare Access 保护。

## 功能

- 卡片管理 — 记录通联信息（呼号、日期、时间、频率、模式），追踪发件和收件状态
- 双向追踪 — 发件（待寄 / 已寄出，卡片局 / 直邮 / 电子）+ 收件（待收 / 已收到）
- 统计卡片 — 公开首页展示待寄出、待接收、发卡总计、收卡总计
- 搜索筛选 — 按呼号 / 发件状态 / 收件状态过滤，分页浏览
- 管理后台 — 添加、编辑、批量删除、CSV 导出
- 主题切换 — 浅色 / 深色主题，View Transition 平滑过渡

## 技术栈

| 层 | 技术 |
| --- | --- |
| 运行时 | Cloudflare Workers |
| 数据库 | Cloudflare D1 (SQLite) |
| Web 框架 | Hono |
| 认证 | Cloudflare Access (Zero Trust) |
| 部署 | GitHub Actions + Wrangler |
| 语言 | TypeScript |

## 目录结构

```
src/
├── index.ts               # Hono 入口，路由注册
├── styles.ts              # 全局样式（主题变量 + 自定义下拉）
├── types.ts               # 类型定义
├── lib/
│   ├── db.ts              # D1 数据库（建表 / CRUD / 统计 / 导出）
│   └── html.ts            # HTML 工具 + 自定义下拉组件
└── routes/
    ├── frontend.ts         # 公开页面（统计卡 + 搜索 + 表格）
    ├── admin.ts            # 管理后台（添加 + 编辑 + 删除 + 导出）
    └── api.ts              # REST API
```

## 部署

### 1. 创建 D1 数据库

```bash
npx wrangler d1 create qsl-tracker-db
```

记下输出的 `database_id`。

### 2. 配置 GitHub Secrets

仓库 Settings → Secrets and variables → Actions，添加 6 个：

| Secret | 说明 |
| --- | --- |
| `CF_API_TOKEN` | Cloudflare API 令牌 |
| `CF_ACCOUNT_ID` | Cloudflare 账户 ID |
| `WORKER_NAME` | Worker 名称（如 `qsl-tracker`） |
| `D1_DATABASE_ID` | 第 1 步返回的数据库 ID |
| `DOMAIN` | 部署域名 |
| `CALLSIGN` | 呼号 |

### 3. 配置 Cloudflare Access

在 Cloudflare Zero Trust 中添加 Application，保护 `/admin` 路径，设置邮箱白名单验证。

### 4. 推送部署

```bash
git push origin main
```

## 本地开发

```bash
git clone https://github.com/BH2XOL/qsl-tracker
cd qsl-tracker
npm install
npm run dev
```

编辑 `wrangler.local.toml` 中的 `CALLSIGN`、`DOMAIN` 后访问 `http://localhost:8787`。

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/` | 公开首页 |
| GET | `/admin` | 管理后台 |
| POST | `/admin/api/add` | 添加卡片 |
| POST | `/admin/api/update/:id` | 更新卡片 |
| POST | `/admin/api/delete` | 删除卡片 |
| GET | `/admin/api/list` | 卡片列表 |
| GET | `/admin/api/export` | 导出 CSV |

所有 `/admin/*` 路由由 Cloudflare Access 保护。

## 授权

MIT
