# Kit contributor notes

Kit is a Native Shell (NSH) app. There is no React, DOM, Next.js, Tailwind runtime or Tauri.

## Rules

- Write `.tsx` only for NSH views. Use `View`, `Text`, `Scroll`, `Input` and the primitives in `components/ui.tsx`.
- Use `signal`, `computed`, `effect`, `If` and `Each` from `nsh` for state and control flow. Do not introduce hooks or a virtual DOM.
- Keep tool computation in `tools/<slug>/logic.ts` and UI in `tools/<slug>/index.tsx`; logic must be testable without a renderer.
- Register tool metadata in `tools/registry.ts`. Legacy tools live in `tools/legacy-migration/` and are driven by its spec table.
- Capabilities are explicit in `nsh.json`. Do not add network, process or file-system capabilities without a product decision.
- Run `./scripts/nsh.sh check .` and `./scripts/nsh.sh test .` before committing.
- Keep versions in `lib/version.ts`; `nsh.json` is the release source of truth and CI checks both.
