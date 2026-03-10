# Serverless Icon & Image Hub
基于 Cloudflare 生态（Workers + R2 + KV）构建的零成本、高颜值、双端双角色云端图标库/图床系统，完美适配 Emby、Quantumult X、Surge 等软件的远程图标订阅规范。

![License MIT](https://img.shields.io/badge/License-MIT-blue)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)
![Telegram Bot API](https://img.shields.io/badge/Telegram-Bot%20API-blue)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-blueviolet)
![Cloudflare KV](https://img.shields.io/badge/Cloudflare-KV-9cf)

## ✨ 核心特性
### 🆓 零成本部署
依托 Cloudflare 免费额度（Workers/KV/R2），无需服务器、无需额外付费，开箱即用。

### 👥 双角色权限隔离
- **游客端**：密码验证、单图上传、专属图库、游客JSON订阅，支持自主撤回
- **管理员端**：批量上传、分类管理、批量删除、分类JSON订阅，超级管理权限

### 🤖 双TG机器人联动
- 管理员机器人：全库统计、分类管理、图标一键删除、多合集切换上传
- 游客机器人：轻量化上传、结果反馈、自主删图，上传行为同步推送给管理员
- Webhook 一键激活，无需手动拼接回调地址

### 🎨 高颜值自适应前端
- 暗黑/亮色双主题无缝切换，自动记忆用户偏好
- 毛玻璃Glassmorphism设计，适配Emby视觉风格
- 全页面移动端自适应，手机/电脑操作体验一致
- 图片预览、大图查看、一键复制直链/订阅链接

### 🔗 多工具适配+自动化
- 生成标准JSON订阅链接，兼容Emby/Quantumult X/Surge等
- 上传图片自动推送到指定TG群，群内可一键删除云端图片
- R2图片静态回源代理，自带缓存策略，访问速度更快
- 文件名自动规范化，图片大小实时计算展示

## 🚀 快速部署
### 1. 前置准备
- Cloudflare账号，已开通**Workers、R2对象存储、KV命名空间**
- （可选）2个Telegram机器人Token（管理员/游客）
- （可选）TG群/个人Chat ID（接收上传通知，多个用英文逗号分隔）

### 2. 配置步骤
1. 新建Cloudflare Workers服务，复制`worker.js`代码到编辑器
2. 绑定KV命名空间：变量名`ICON_KV`
3. 绑定R2存储桶：变量名`ICON_R2`
4. 配置Workers**环境变量**（均为字符串类型）：

| 变量名 | 必选 | 说明 |
|--------|------|------|
| `ADMIN_PASSWORD` | ✅ | 管理员登录密码 |
| `GUEST_PASSWORD` | ✅ | 游客上传/登录密码 |
| `TG_BOT_TOKEN` | ❌ | 管理员TG机器人Token |
| `GUEST_TG_BOT_TOKEN` | ❌ | 游客TG机器人Token |
| `ADMIN_CHAT_ID` | ❌ | TG通知接收ID（群/个人） |
| `CUSTOM_DOMAIN` | ❌ | 自定义域名（如icon.xxx.com，无需http/https） |
5. 部署Workers，访问服务域名即可使用

### 3. 激活TG机器人Webhook
部署后访问以下地址，一键激活无需手动配置：
