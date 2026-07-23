# Home Terminal Typing and P1—P8 Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐 P5 首屏终端的三组循环打字动画，并用证据核对 P1—P8 是否还有真实遗漏。

**Architecture:** Astro 继续输出可读的第一组静态内容，`TerminalTyping.astro` 内的原生脚本只增强视觉文本；终端文案和时间参数全部来自 `home.ts`。阶段审计只读取计划、报告、源码和测试，产出独立审计报告，不把未来阶段功能误算为遗漏。

**Tech Stack:** Astro 7、TypeScript strict、原生浏览器脚本与 CSS、Vitest、Playwright Chromium。

## Global Constraints

- 不新增依赖，不引入框架岛或动画库。
- 不修改首页背景、三阶段状态机、主题机制、GitHub Pages 子路径或内容模型。
- 不开始 P9 Pagefind，不启用 P10 ClientRouter/音乐或 P11 右侧滚动控件。
- 无 JavaScript 与 `prefers-reduced-motion: reduce` 必须显示第一组完整终端内容。
- 动态文本不得反复向读屏器播报，终端尺寸在输入过程中保持稳定。
- 所有生产代码改动遵守 test-first RED→GREEN。

---

### Task 1: 类型化终端配置和静态回退接口

**Files:**
- Modify: `tests/unit/home.test.ts`
- Modify: `tests/unit/p5-contract.test.ts`
- Modify: `src/config/home.ts`
- Modify: `src/components/home/HeroTitle.astro`
- Modify: `src/components/home/TerminalTyping.astro`（仅 Props 与第一组静态回退）
- Modify: `src/pages/index.astro`

**Interfaces:**
- Produces: `TerminalSessionConfig { command: string; output: string }`
- Produces: `TerminalTypingConfig { sessions; characterIntervalMs; outputDelayMs; sessionHoldMs; transitionMs }`
- `HeroTitle` consumes `terminal: TerminalTypingConfig` and passes it to `TerminalTyping`.

- [ ] **Step 1: Write failing configuration and component-contract tests**

Add assertions equivalent to:

```ts
expect(homeConfig.terminal.sessions).toEqual([
  { command: 'ponylab:~$ whoami', output: 'Developer · Learner · Dreamer' },
  { command: 'ponylab:~$ cat current-focus.txt', output: 'Astro · TypeScript · Frontend' },
  { command: 'ponylab:~$ echo $STATUS', output: '记录代码，也记录生活。' },
]);
```

All four timing values must be positive. The P5 contract must require `data-terminal-typing-root`, `data-terminal-state`, `data-terminal-session-index`, a stable accessible summary, and a reduced-motion branch.

- [ ] **Step 2: Run the targeted unit tests and verify RED**

Run `npm.cmd run test:unit -- tests/unit/home.test.ts tests/unit/p5-contract.test.ts`.

Expected: FAIL because `homeConfig.terminal` and the new terminal selectors do not exist.

- [ ] **Step 3: Implement the typed configuration flow**

Replace `typingLines` with:

```ts
export interface TerminalSessionConfig {
  command: string;
  output: string;
}

export interface TerminalTypingConfig {
  sessions: readonly TerminalSessionConfig[];
  characterIntervalMs: number;
  outputDelayMs: number;
  sessionHoldMs: number;
  transitionMs: number;
}
```

Use the exact three sessions above and timing values `42`, `180`, `1800`, and `260` milliseconds. Update `HeroTitle.astro` and `index.astro` to pass the single `terminal` object without duplicating fields. Update `TerminalTyping.astro` to accept `config: TerminalTypingConfig` and render `config.sessions[0]` as its complete static fallback; Task 2 owns all runtime selectors and the client loop.

- [ ] **Step 4: Verify the typed flow**

Run the targeted unit command again and `npm.cmd run check`.

Expected: unit contract may remain RED only for Task 2 runtime selectors; Astro check reports 0 errors/warnings/hints.

---

### Task 2: 渐进增强循环打字动画

**Files:**
- Create: `tests/e2e/home-terminal.spec.ts`
- Modify: `src/components/home/TerminalTyping.astro`
- Modify: `tests/unit/p5-contract.test.ts`

**Interfaces:**
- Consumes: `TerminalTypingConfig` from Task 1.
- Produces states: `fallback`, `typing-command`, `typing-output`, `holding`, `transitioning`, `static`.
- Produces zero-based `data-terminal-session-index` and per-instance `data-terminal-enhanced` guard.

- [ ] **Step 1: Write failing browser behavior tests**

Require the runtime state to enter typing/holding, advance to session index `1`, and show the second configured command/output. Also require theme switching not to reset the current session, JavaScript-disabled and reduced-motion contexts to keep the first complete pair, and a 320px viewport to have no horizontal overflow.

- [ ] **Step 2: Run the new E2E and verify RED**

Run `npm.cmd run build` followed by `npm.cmd run test:e2e -- tests/e2e/home-terminal.spec.ts --workers=1`.

Expected: FAIL because the current terminal has no runtime state or session loop.

- [ ] **Step 3: Implement the minimal Astro/vanilla-JS enhancement**

Render the first session in SSR HTML. Visible line spans are `aria-hidden="true"`; add one `.visually-hidden` stable summary containing all three command/output pairs. Serialize sessions and timing into data attributes. Before animation, the script must apply:

```ts
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  root.dataset.terminalState = 'static';
  return;
}
if (root.dataset.terminalEnhanced === 'true') return;
root.dataset.terminalEnhanced = 'true';
```

Type Unicode code points with `[...text]`, await configured delays, update state/index, and loop to index 0. Theme changes are not observed by this component. CSS supplies one restrained blinking cursor, stable two-line block size, short transition fade, safe wrapping, and disables cursor/transition animation under reduced motion.

- [ ] **Step 4: Verify GREEN and regress P5**

Run targeted unit tests, build, then:

`npm.cmd run test:e2e -- tests/e2e/home-terminal.spec.ts tests/e2e/home-scroll.spec.ts tests/e2e/home.spec.ts --workers=1`

Expected: all targeted tests pass and existing scene-image invariants remain green.

---

### Task 3: P1—P8 implementation audit and handoff

**Files:**
- Create: `docs/stage-reports/p1-p8-implementation-audit.md`
- Modify: `docs/stage-reports/p5-home-scroll-report.md`
- Modify: `README.md`
- Test: existing phase contract tests plus any new failing test required by a discovered code omission.

**Interfaces:**
- Consumes the frozen plan, P1—P8 reports, current Git tree, package scripts and automated tests.
- Produces a per-phase evidence table with status `完整`、`占位决策`、`后续阶段` or `遗漏已修复`.

- [ ] **Step 1: Audit every completed phase against evidence**

For P1 through P8, compare each phase's goal/files/work/validation/completion standard with actual files, `package.json`, workflows, tests, README, and stage report. Explicitly separate P9/P10/P11/P12/P13 work and user-approved placeholder content.

- [ ] **Step 2: Handle findings without scope expansion**

For a small, unambiguous omission, first add a failing focused test, observe RED, apply the minimal fix, and verify GREEN. For a finding that needs a dependency, route/model/deployment change, or architectural decision, document it without implementing.

- [ ] **Step 3: Update documentation**

The P5 report states that the first-screen terminal now cycles three configurable sessions and records its fallbacks/tests. README explains `homeConfig.terminal.sessions`. The audit report lists exact evidence and commands.

- [ ] **Step 4: Run full verification**

Run these commands separately and record exact results:

```powershell
npm.cmd run check
npm.cmd run test:unit
npm.cmd run build
npm.cmd run test:e2e
git diff --check
git status --short
```

Expected: all commands succeed; only intended source, tests, and documentation are changed.

- [ ] **Step 5: Commit the implementation and audit**

Stage only intended files and commit with message `Fix homepage terminal typing and audit completed phases`.
