<p style="color:red;font-weight:bold;font-size:0.95rem;line-height:1.6;padding:0.75rem 1rem;border:1px solid rgba(255,0,0,0.3);border-radius:8px;background:rgba(255,0,0,0.05);">
⚠️ 免责声明：本项目代码由 AI 辅助生成，仅供学习和参考使用。使用者应自行审查代码安全性，作者不对因使用本项目造成的任何直接或间接损失承担责任。
</p>

# qsl-tracker

业余无线电 QSL 卡片双向追踪系统（发件 / 收件），部署在 Cloudflare Workers + D1。

## 功能

- 卡片管理 — 记录通联信息（呼号、日期、时间、频率、模式），追踪发件和收件状态
- 双向追踪 — 发件状态（待寄 / 已寄出）+ 发件方式（卡片局 / 直邮 / 电子）+ 收件状态（待收 / 已收到）
- 统计卡片 — 公开首页展示待寄、待收、发卡总计、收卡总计四张统计卡
- 搜索筛选 — 按呼号 / 发件状态 / 收件状态过滤，分页浏览
- 管理后台 — 添加卡片、编辑状态、批量删除，HMAC-SHA256 Session 认证
- 主题切换 — 浅色 / 深色主题，View Transition 平滑过渡动画

## 技术栈

| 层 | 技术 |
| --- | --- |
| 运行环境 | Cloudflare Workers |
| 数据库 | Cloudflare D1 (SQLite) |
| Web 框架 | Hono |
| 认证 | HMAC-SHA256 Session Cookie |
| 部署 | GitHub Actions + Wrangler |
| 语言 | TypeScript |

## 目录结构

```
src/
├── index.ts               # Hono 入口，路由注册
├── styles.ts              # 全局样式（CSS 变量 + 自定义下拉组件）
├── types.ts               # 类型定义
├── lib/
│   ├── db.ts              # D1 数据库操作（CRUD + 统计）
│   ├── auth.ts            # HMAC-SHA256 Session 认证
│   └── html.ts            # HTML 工具 + 自定义下拉组件
└── routes/
    ├── frontend.ts         # 公开页面（统计卡 + 搜索 + 表格）
    ├── admin.ts            # 管理后台（登录 + 添加 + 编辑 + 删除）
    └── api.ts              # REST API
```

## 环境变量

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加以下 9 个 Secrets：

| Secret | 说明 |
| --- | --- |
| `CF_API_TOKEN` | Cloudflare API 令牌 |
| `CF_ACCOUNT_ID` | Cloudflare 账户 ID |
| `WORKER_NAME` | Worker 名称（如 `qsl-tracker`） |
| `D1_DATABASE_ID` | D1 数据库 ID |
| `DOMAIN` | 部署域名 |
| `CALLSIGN` | 你的呼号 |
| `ADMIN_EMAIL` | 管理员登录邮箱 |
| `ADMIN_PASSWORD_HASH` | 管理员密码的 SHA-256 十六进制 |
| `SESSION_SECRET` | Session 签名密钥（`openssl rand -hex 32`） |

## 生成密码哈希

```bash
echo -n "你的密码" | sha256sum
```

## 本地开发

```bash
git clone https://github.com/BH2XOL/qsl-tracker
cd qsl-tracker
npm install
npm run dev
```

访问 `http://localhost:8787`。管理员账号 `admin@example.com`，默认密码见 `wrangler.local.toml`。

## 部署

推送 `main` 分支自动触发 GitHub Actions 部署：

```bash
git push origin main
```

或手动：

```bash
npm run deploy
```

## API

### 公开

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/` | 公开首页 |

### 管理（需 Session）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/admin/api/add` | 添加卡片 |
| POST | `/admin/api/update/:id` | 更新卡片 |
| POST | `/admin/api/delete` | 删除卡片（单条或批量） |
| GET | `/admin/api/list?page=` | 管理端列表 |

## 授权

MIT
