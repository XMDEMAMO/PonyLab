# P8 项目页与个人页阶段汇报

## 阶段结论

P8 已按 `docs/development-plan.md` 建立项目与个人展示层：`/projects/` 提供四条类型化项目记录、无 JavaScript 完整列表和渐进增强筛选；`/about/` 提供作者身份卡、当前状态终端及作品/角色/游戏三组爱好展柜。首页既有 `SiteStats` 在项目数据建立后追加项目数量，没有提前复制或重写统计组件。

当前项目与爱好正式素材尚未进入仓库，因此 P8 使用最低开发占位档中的通用封面，并通过正式约定的 16:10、4:3 比例和逐项 `object-position` 验证组件接口。占位状态在数据与界面中明确标识；未来只需替换类型化数据中的图片、文本和链接，不改变网格、筛选或页面布局。

工作分支：`codex/p8-projects-about`。

## 实际文件

新增：

- `src/types/showcase.ts`
- `src/utils/projects.ts`
- `src/utils/links.ts`
- `src/data/projects.ts`
- `src/data/hobbies.ts`
- `src/config/about.ts`
- `src/components/projects/ProjectFilter.astro`
- `src/components/projects/ProjectGrid.astro`
- `src/components/projects/ProjectCard.astro`
- `src/components/about/AboutProfile.astro`
- `src/components/about/CurrentStatus.astro`
- `src/components/about/HobbyShowcase.astro`
- `src/components/about/HobbyCard.astro`
- `src/pages/projects.astro`
- `src/pages/about.astro`
- `tests/unit/projects.test.ts`
- `tests/unit/links.test.ts`
- `tests/unit/p8-contract.test.ts`
- `tests/e2e/showcase.spec.ts`
- `docs/stage-reports/p8-projects-about-report.md`

修改：

- `src/components/home/SiteStats.astro`
- `src/config/home.ts`
- `src/config/site.ts`
- `src/pages/index.astro`
- `README.md`
- `tests/unit/p7-contract.test.ts`

## 实现摘要

### 项目数据与页面

- `ProjectRecord` 固定 `name`、description、cover/alt、status、type、stack、GitHub、demo、featured、order 与可选 `objectPosition`/占位标记。
- 当前四条记录包含真实 PonyLab 项目和三条清晰占位记录；没有虚构不存在的个人项目。
- 精选项目在宽屏跨两列，其余项目按三/二/一列响应式排列；所有封面通过 `astro:assets` 输出 WebP，并用 16:10 容器裁掉通用占位图的黑边。
- 筛选控件只在脚本成功初始化后显示；关闭 JavaScript 时四个项目完整可见。启用后按显式项目类型切换 `hidden`，同步 `aria-pressed` 和 live status。
- 只有通过 HTTP(S) 协议校验的真实 URL 才渲染外链；新窗口链接统一使用 `rel="noopener noreferrer"`，并包含读屏提示。
- 项目数组为空时输出无需 JavaScript 的静态空状态，同时不显示无意义的“全部 0”筛选控件；纯函数与组件契约均覆盖空数组。

### About 与爱好展柜

- About 的文案、身份、位置与当前状态集中在 `about.ts`；作者名称、简介、头像和社交链接继续复用 `site.ts`。
- 当前状态采用静态终端记录，不引入技能百分比、时间线系统或客户端动画。
- 爱好数据固定为作品、角色、游戏三类，每类三项；卡片采用 4:3 固定容器、语义 alt 和逐项焦点。
- 正式素材缺失时明确显示“待替换”，不联网下载、不从参考仓库复制，也不扩大素材前置条件。

### 首页统计

- P8 数据层建立后，首页导入同一 `projects` 数组并把数量传给既有 `SiteStats`。
- `SiteStats` 从文章/Tag 两项扩展为文章/Tag/项目三项；没有创建平行的项目统计组件或在线计数服务。

## 依赖与阶段边界

P8 没有安装、升级或移除依赖。项目页和 About 页均使用 Astro 静态组件、普通 CSS、`astro:assets` 与少量原生脚本。

- 未加入 Pagefind，P9 尚未开始。
- 未加入 ClientRouter、音乐播放器或右侧滚动控件，P10/P11 仍是可选增强。
- 未创建项目详情路由、CMS、前端框架或全局状态库。
- 未改变 GitHub Pages 子路径、内容 slug、light/dark 或首页三阶段方案。

## 最终验证结果

- `npm run check`：通过，检查 108 个文件，0 errors、0 warnings、0 hints。
- `npm run test:unit`：通过，25 个测试文件、150 项测试全部通过。
- `npm run build`：通过；构建前内容校验检查 1 个 Markdown 文件，Astro 生成 13 个静态页面与 41 个响应式图片输出，清理 2 个未引用图片母版。
- `npm run test:e2e`：通过，Chromium 51 项生产预览 E2E 全部通过；其中 P8 覆盖真实键盘 Enter/Space 筛选、无 JavaScript 完整项目列表、About 无 JavaScript、About 结构与图片 alt、一/二/三列项目网格、两个页面的 320px 防溢出及首页项目统计。
- 视觉验收：在 1440×900 桌面端检查 `/projects/` 与 `/about/`，在 390×844 手机端检查两页完整长页面，并额外检查项目页深色主题。网格、固定图片比例、卡片层级、主题颜色和页脚均正常，未发现横向溢出；通用占位封面的黑边由容器裁切，不进入卡片可见区域。
- 无 JavaScript 降级：项目筛选隐藏且 4 张项目卡全部可见；About 的资料、状态与 9 张爱好卡无需脚本即可阅读。

全量回归首次运行时，P7 文档契约仍把 README 阶段号写死为 `P1—P7`，导致 README 正确推进到 P8 后出现 1 项失败。该断言已改为验证 P7 交接内容仍保留，P8 契约新增 `P1—P8`、项目/About 路由与 P8 报告链接检查；修正后全量单测通过。该调整只维护阶段交接测试，不改变 P7 文章功能。

提交前独立代码审查未发现 Critical，但指出空项目数组缺少静态空状态。该问题已修复，并一并补上 HTTP(S) 外链白名单、读屏新窗口提示、真实键盘筛选以及 About 无 JavaScript 和三档网格自动化覆盖；修复后重新执行完整 check、unit、build 与 E2E，结果均通过。

P8 完成标准已满足。下一核心阶段为 P9 Pagefind；P10/P11 仍为非阻塞可选增强，未在本阶段提前实施。
