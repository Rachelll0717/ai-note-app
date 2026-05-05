一、项目概述
项目名称：AI 笔记助手

项目描述：一个集成 AI 能力的全栈笔记应用，用户创建笔记后自动生成摘要和标签，支持笔记的增删改查和 AI 重新生成。

在线地址：

前端：https://ai-note-app-bay-xi.vercel.app（或你的 Netlify 地址）

后端 API：https://ai-note-app-production.up.railway.app

源码仓库：https://github.com/Rachelll0717/ai-note-app

二、技术栈
层级	技术	说明
前端	React 18 + TypeScript	函数组件 + Hooks
构建工具	Vite	快速开发和构建
HTTP 客户端	Axios	API 请求
UI 样式	原生 CSS	响应式设计
后端	Node.js + Express	RESTful API
数据库	Supabase (PostgreSQL)	云数据库，免费层
AI 服务	硅基流动 (SiliconFlow)	Qwen 模型，免费额度
部署	前端：Vercel/Netlify	免费托管
后端：Railway	免费容器部署	
三、核心功能
功能	实现方式	状态
用户创建笔记	表单提交 → 后端存储	✅
AI 自动生成摘要	调用硅基流动 API	✅
AI 自动生成标签	调用硅基流动 API	✅
笔记列表展示	从 Supabase 读取	✅
编辑笔记	弹窗表单 → 更新数据库	✅
删除笔记	确认弹窗 → 软删除	✅
AI 重新生成	单独按钮触发	✅
CORS 跨域配置	Express cors 中间件	✅
四、项目亮点（面试可讲）
1. 全栈能力
独立完成从数据库设计 → 后端 API 开发 → 前端界面 → 部署上线的完整流程

2. AI 集成
集成硅基流动 API，实现笔记自动摘要和标签生成

设计 prompt 工程，确保 AI 输出稳定的 JSON 格式

3. 工程化实践
前后端分离架构

TypeScript 类型安全

环境变量管理（开发/生产分离）

4. 部署运维
前端部署到 Vercel/Netlify

后端部署到 Railway

解决 CORS 跨域问题

配置 OPTIONS 预检请求

5. 用户体验
加载状态提示

确认删除弹窗

编辑弹窗模态框

响应式布局

五、数据库设计
sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
六、API 接口文档
方法	路径	功能
GET	/api/notes	获取所有笔记
POST	/api/notes	创建笔记（自动调用 AI）
GET	/api/notes/:id	获取单条笔记
PUT	/api/notes/:id	更新笔记（重新调用 AI）
DELETE	/api/notes/:id	删除笔记
POST	/api/notes/:id/regenerate	手动重新生成 AI
GET	/health	健康检查
七、遇到的问题与解决（面试重点）
问题	解决方案
Railway 构建失败，npm 找不到	添加 railway.json 配置构建命令
Node.js 版本不匹配	创建 .nvmrc 文件指定 Node 20
CORS 跨域问题	后端配置 app.use(cors()) 和 OPTIONS 处理
Vercel 无法访问	改用 Netlify 部署前端
AI 响应解析失败	添加正则 fallback 和错误处理
更新笔记时 AI 不生效	排查发现是 Railway 代码未同步，重新部署解决
八、待优化功能（可选）
添加用户登录（Supabase Auth）

添加向量检索（pgvector + embedding）

笔记搜索功能（全文检索）

Markdown 渲染支持

笔记分类/标签筛选

移动端适配优化

九、简历写法示例
项目经历
AI 笔记助手 | React + Node.js + Supabase | 2026.05

独立开发全栈 AI 应用，实现笔记的增删改查和 AI 智能摘要/标签生成

前端使用 React + TypeScript + Vite，后端使用 Express + Supabase

集成硅基流动 AI API，设计 prompt 工程，确保稳定的 JSON 输出

解决 CORS 跨域、Node 版本兼容、部署配置等实际问题

项目已部署上线：前端 Netlify，后端 Railway

十、面试可能被问到的问题
Q: 为什么用硅基流动而不是 OpenAI？

A: 硅基流动提供免费额度（2000 万 tokens），国内访问更稳定，Qwen 模型效果足够好。

Q: 如何处理 AI 调用的异步延迟？

A: 前端显示 loading 状态，后端使用 async/await，用户等待时有明确反馈。

Q: 如何保证 AI 返回的格式稳定？

A: 设计了严格的 prompt 模板，要求返回纯 JSON，并添加了正则 fallback 解析。

Q: 遇到最大的技术难点是什么？

A: Railway 部署时的环境差异问题（Node 版本、构建配置、CORS），通过配置文件和环境变量逐步解决。