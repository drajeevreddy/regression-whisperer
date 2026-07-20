# Regression Whisperer — Frontend Build Summary

## Design System

### Typography
- **Geist** (sans, 400–700) for all UI text, headers, labels
- **Geist Mono** (mono, 400–600) for code snippets, flame graph labels, agent names, metrics, diff output, timestamps
- Loaded via `next/font/google`, variable weight. No custom font files.

### Color Palette
- Background: `#0A0A0C`
- Surfaces: `#141418` (cards), `#1C1C22` (borders/hover), `#22222A` (elevated)
- Text: `#F4F4F5` (primary), `#A1A1AA` (secondary), `#52525B` (muted)
- Single accent: amber `#F59E0B` — reserved exclusively for regression severity indicators and live agent processing pulse
- Red: `#DC2626` — severe regression overlays on flame graph bars, error states
- Green: `#22C55E` — connected status, no-regression badge
- Used only as defined. No amber on links, hover states, or decoration.

### Shape & Spacing
- Border radius: `0` default, `2px` small, `4px` cards
- Cards are bordered (`1px solid #1C1C22`), no box shadows
- No rounded buttons, no gradients, no glassmorphism, no emoji-as-icons
- Spacing scale: tight 8/12/16/24/32px

### Tokens (globals.css)
- CSS custom properties mapped to Tailwind v4 `@theme`
- Custom animations: `breathe` (amber pulse, 1.5s), `slide-up` (output cards, 0.3s), `pulse-dim` (skeleton loading, 2s)
- Custom styled scrollbar (6px, transparent track, elevated thumb)

## Routes

| Route | Type | Description |
|---|---|---|
| `/` | Static | Landing page |
| `/pipeline` | Static | Live Pipeline View (hero interaction) |
| `/prs` | Static | PR Feed with filter |
| `/prs/[id]` | Dynamic | PR Detail |
| `/setup` | Static | BYOK Provider Config |

## Pages

### `/` — Landing Page
- Tagline: "detect regressions before they ship"
- Hero heading: "Every PR gets a **performance autopsy** before it lands."
- Subtitle explaining the five-agent pipeline
- Static five-agent pipeline visual centerpiece
- Two CTAs: "Watch it run" (amber filled, → `/pipeline`), "Browse PRs" (zinc outlined, → `/prs`)
- Footer with live provider status dots and PR analysis stats

### `/pipeline` — Live Pipeline View
- Five agent nodes (Profiler → Router → Diff Reasoning → Historian → Explainer) in horizontal row
- Three states per node: idle (muted zinc-700), processing (amber outline with 1.5s breathing pulse), complete (checkmark, amber border)
- Directional SVG arrows between nodes
- Auto-starts pipeline on mount, agents process sequentially with mock durations (1.5–2s each)
- Output cards animate in below completed agents with monospace pre-formatted text
- "Replay Pipeline" button appears after completion

### `/prs` — PR Feed
- Dense table with columns: PR #, Title, Repo, Branch, Regression severity, Analyzed time
- Filter tabs: All / Regressions / Clean
- Severity badges: HIGH (red), MED (amber), LOW (muted), — (none)
- Rows link to `/prs/[id]`
- Hover row highlight
- Empty state for filtered views

### `/prs/[id]` — PR Detail
- **Header**: PR #, title, repo/branch chips, severity badge, author, timestamp
- **Flame Graph**: Before/after side-by-side horizontal bars. SVG bars scaled to max function %. Bars turn red for delta >5%, amber for >2%. Delta percentages shown inline.
- **Diff Snippet**: Monospace code diff with add/remove indicators. Green dim bg for additions, red dim bg for removals. Inline annotations for regression-causing lines.
- **Explainer Card**: Explainer agent output rendered as monospace prose
- **Historical Match**: Historian output showing similar past regression with match % score
- Pre-rendered content via `prDetails.find()`

### `/setup` — BYOK Provider Config
- Four provider cards (Gemini, Groq, NVIDIA, Cerebras) in vertical stack
- Each card: provider name, colored status dot, status label, masked API key display, edit/configure button
- Edit mode: password input + Save/Cancel buttons
- Left border color: green for connected, red for failed
- Error message shown below failed providers
- Failover banner at top: "Active: Groq (green dot) → Standby: Gemini (red dot — UNAVAILABLE)"

## Components (15 total)

### Pipeline (`components/pipeline/`)
- `pipeline-view.tsx` — Client component, state machine, `useEffect` timer chain
- `agent-node.tsx` — Three-state agent node (idle/processing/complete)
- `agent-output.tsx` — Monospace output card with agent label and pre content
- `pipeline-connector.tsx` — SVG arrow connector between nodes

### PR Feed (`components/pr-feed/`)
- `pr-table.tsx` — Client component with filter state, renders PR rows

### PR Detail (`components/pr-detail/`)
- `pr-header.tsx` — Severity badge, repo/branch chips, metadata line
- `flame-graph.tsx` — Before/after SVG bar chart, severity-colored
- `diff-snippet.tsx` — Annotated code diff with green/red line highlighting
- `explanation-card.tsx` — Agent output prose card
- `historical-match.tsx` — Historian match with similarity score

### Setup (`components/setup/`)
- `provider-card.tsx` — Client component with edit state, password input, save/cancel
- `failover-banner.tsx` — Active/standby provider display with status dots

### Shared (`components/shared/`)
- `empty-state.tsx` — Centered message with optional CTA button
- `skeleton.tsx` — `Skeleton` (single/multi-line), `CardSkeleton`, `FlameGraphSkeleton`, `PipelineSkeleton`
- `badge.tsx` — `Badge` (severity pills), `StatusDot` (colored circles)

## Mock Data (`lib/mock/`)

- **`pipeline.ts`**: `createPipelineRun()`, `getAgentOutput()`, `AGENT_DURATIONS` — simulates a full pipeline run with realistic agent outputs (CPU profiles, N+1 query detection, diff analysis, historical matches)
- **`prs.ts`**: 4 PRs with full detail — flame graph function traces, diff lines with annotations, explainer prose, historical matches. Exports `prFeed: PRSummary[]` and `prDetails: PRDetail[]`.
- **`providers.ts`**: 4 provider configs — Groq (connected), Gemini (failed), Cerebras (connected), NVIDIA (unconfigured). Exports `providers`, `activeProvider`, `fallbackProvider`.

### Constants (`lib/constants.ts`)
- `AGENTS`, `PROVIDERS`, `SEVERITY`, `PIPELINE_PHASES` as const arrays with derived types

## Tech Stack
- Next.js 16 (Turbopack)
- React 19
- Tailwind CSS v4 (CSS-based config, `@theme` directive)
- TypeScript 5.9
- `clsx` for class merging
- No shadcn/ui — custom components built from scratch with no default shadcn styling
- No chart libraries, no icon libraries, no animation libraries

## File Count
- 6 pages (app routes)
- 15 components
- 5 lib/module files
- 4 config files (next.config.ts, tsconfig.json, postcss.config.mjs, globals.css)
- Total: 30 source files

## Verification
- `tsc --noEmit`: clean
- `next build`: succeeds
- All 5 routes return 200
- No glassmorphism, no gradients, no emoji, no default shadcn styling
- Dark mode only, amber reserved for signal
