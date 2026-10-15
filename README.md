# 竞赛信息门户

大学生竞赛一站式平台：竞赛资讯、智能组队匹配和个人竞赛画像。

## 功能

- 竞赛资讯：首页筛选、竞赛日历与详情卡片，静态运行。
- 寻找队友：保留 50 位虚构候选人供演示；竞赛站账号可发布真实招募、筛选其他队伍并进行私聊。
- 个人中心：技能使用统一标签，也可添加自定义标签；登录后资料保存到账号。
- 资料分享：暂时下线；访问旧地址会返回竞赛资讯，现有资料数据保留。
- GitHub Pages 保留匿名演示；账号、招募和私聊由独立 Node 服务提供。

## 本地运行后端

需要 Node.js 22 或更新版本。在仓库根目录执行：

```powershell
cd server
npm install
npm run build
npm start
```

服务默认监听 `127.0.0.1:3002`，同时提供静态页面和 `/api/`。本地 SQLite 文件默认位于 `server/data.sqlite`；部署时通过 `COMPETITION_DB_PATH` 将数据库放在网站目录之外。

## 生产部署

竞赛站由独立 `competition.service`、独立 `/var/lib/competition` 数据目录和独立 Nginx 虚拟主机运行。Third Player 使用自己的服务、数据库与站点配置。部署模板位于 `deploy/`。

当前账号采用用户名和密码，不依赖邮箱服务；密码用 Node.js scrypt 哈希，登录会话使用 HttpOnly Cookie。招募信息由用户主动发布后公开；私聊消息只允许会话参与者读取。

## 目录

```
competition/
├── index.html, team.html, profile.html, resources.html  # resources.html redirects to index.html
├── api-client.js, auth-nav.js, team-live.js
├── assets/images/
├── server/                 # Node API 与 better-sqlite3 依赖
└── deploy/                 # systemd / Nginx 配置模板
```
