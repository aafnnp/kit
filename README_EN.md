# Kit — a local-first, cross-platform toolbox

<p align="center">
  <img src="./icon.png" width="120" alt="Kit Logo" />
</p>

> 🧰 A native toolbox built with [Native Shell (NSH)](https://nsh.dev) for **macOS, Windows, Linux and the web**. Everything runs on your device.

[中文](./README.md) | [English](./README_EN.md)

---

## Highlights

- **One codebase, four platforms**: macOS (AppKit), Windows (Win32 / Direct2D), Linux (GTK 4) and the web (HTML + WebAssembly).
- **Native UI**: NSH renders with each platform's own views and text input — no WebView, no React and no virtual DOM.
- **Local-first**: no accounts, no uploads, no telemetry. Hashing, compression and file work use NSH's Rust standard modules.
- **DevToys-style workspace**: a searchable, collapsible sidebar with a welcome page and tool pages, plus favorites, recent tools, light/dark mode and English/Chinese UI.
- **Testable by design**: every tool keeps its logic in `logic.ts`, separate from the UI, covered by `nsh test`.

> Kit supports **macOS, Windows, Linux and the web only**. iOS and Android are intentionally out of scope.

## Tools (71 visible entries; 8 old entries kept as hidden aliases)

| Category | Tools |
| --- | --- |
| Data | JSON formatter, JSON to TypeScript, CSV/Excel/TSV to JSON, YAML to JSON, JSON plot, table sorter, JWT decoder, JSON diff, prime checker, quadratic solver, Roman numerals, MIME lookup, HTTP status, fake user, random picker, matrix calculator |
| Encoders / Decoders | Base64, image Base64 inspector, URL, URL inspector |
| Text | Word & character count, case converter, text diff, regex tester, regex cheat sheet, Lorem Ipsum, Markdown TOC/outline, Mermaid inspector |
| Color & Design | HEX/RGB/HSL/HSV/CMYK, random color, CSS clamp, border radius, gradient, shadow, SVG minifier/sprite, favicon, Code 39, QR Code, SVG placeholder |
| Crypto & Generators | Unified hash (MD5/SHA-1/SHA-256/384/512), MD5, SHA-256, bcrypt format inspector, JWT HS256 signer, UUID/batch, password generator/strength, content checksum |
| Date & Time | Unix timestamp, time difference, time-zone conversion, cron parser, sample offline currency conversion |
| Developer Tools | Git command helper, code formatter, safe HTML inspector, API request inspector, local benchmarks, source complexity |
| Network Tools | DNS query builder, IPv4/CIDR inspector, User-Agent parser |
| Images & Media | Image compress/compatible convert/resize, crop validation, JPEG EXIF, JPEG to PDF, PDF inspection, text to PDF, FFmpeg command templates for GIF/audio/video |

## 🎨 Palette

The interface takes its colours from the app icon, [icon.png](./icon.png): a slate canvas `#0d1117` with an inset `#161b22` plate, and three rounded bars in cyan `#00a6d0`, violet `#6b2dd1` and orange `#f16511`.

| Role | Dark | Light | Where |
| --- | --- | --- | --- |
| Canvas / card | `#0d1117` / `#161b22` | `#f5f7fa` / `#ffffff` | Page and cards; dark reuses the icon canvas |
| Sidebar | `#080b10` | `#e9eef5` | Layers away from the canvas: darker in dark, deeper in light |
| Primary (violet) | `#7c3aed` | `#6b2dd1` | Primary buttons, selection, focus rings |
| Accent (cyan) | `#2cc4e6` | `#0091b5` | Input focus, hovers, icon tiles |
| Warning (orange) | `#ff8a3d` | `#d9560b` | Favorite stars, warning badges |

Tokens live in [theme.json](./theme.json). Beyond the semantic colours it adds `brand-cyan` / `brand-violet` / `brand-orange` (readable variants per appearance), `ink-*` (fixed tints for ink surfaces) and `ink-surface` (the welcome banner). Category rails map through `accentBar` in [lib/types.ts](./lib/types.ts), and the sidebar mark and banner reuse the three-bar icon from [components/brand.tsx](./components/brand.tsx).

## Platform requirements

| Platform | Build on | Runs on |
| --- | --- | --- |
| macOS | macOS + Xcode command line tools | macOS 14+ |
| Windows | Windows | Windows 10 1809+ |
| Linux | Linux | GTK 4.14+ |
| Web | Any platform | Modern browsers with WebAssembly |

## Development

The project pins **NSH 0.3.0**. `scripts/nsh.sh` (or `scripts/nsh.ps1` on Windows) downloads the matching CLI into `.tools/` on first use, so a stale system-wide `nsh` is never picked up.

```bash
./scripts/check-version.sh
./scripts/nsh.sh check .
./scripts/nsh.sh test .
./scripts/nsh.sh run . --target macos     # or linux / windows / web
./scripts/nsh.sh package . --target macos # or web / linux / windows
```

Windows PowerShell:

```powershell
.\scripts\nsh.ps1 check .
.\scripts\nsh.ps1 test .
.\scripts\nsh.ps1 run . --target windows
.\scripts\nsh.ps1 package . --target windows
```

Outputs land in `.nsh/out/`.
Web and macOS packaging were verified locally; this machine lacks the NSH runners needed to package Windows and Linux.

## Architecture

```
App.tsx                  entry: sidebar + workspace + status bar
components/              shell, DevToys-style navigation, shared UI
lib/                     state, i18n, platform helpers, styles, version and validation
tools/registry.ts        single source of tool metadata and search
tools/<slug>/logic.ts    core pure, testable logic
tools/legacy-migration/  legacy tool specs, shared offline logic and the generic NSH screen
tests/                   logic tests
App.test.tsx             app-level interaction tests
theme.json               shadcn-style design tokens (light / dark)
nsh.json                 app metadata, icon and capabilities
AGENTS.md                NSH contribution and AI-collaboration notes
```

All 78 legacy tools are registered and routed in NSH; navigation and search show 71 visible entries, while 8 duplicate old entries remain as hidden aliases so old favorites and recent entries still open. Some former tools have explicitly labeled offline alternatives because NSH 0.3.0 does not grant network, process or general file access: API/DNS do not send requests, exchange rates are illustrative, audio/video/GIF tools only build FFmpeg commands, PDF merge only inspects input, image crop validates coordinates, and bcrypt checks hash format only. Image compression, compatible conversion and resizing use the system image picker. Locally, `nsh build .` emits about 375 KB of JavaScript.

## Security and privacy

- The only declared capabilities are `clipboard`, the system image picker (`picker`) and `openUrl`; there is no arbitrary file-system, network or process capability, and images are read only when the user picks them in the system picker.
- All text processing is local; hashing uses NSH's Rust `crypto` module.
- Favorites, recent tools, language and appearance persist through NSH `Storage`.

## Migration from React + Tauri

v0.6.0 replaces the React 19 + Vite + Tauri 2 app with NSH 0.3.0. All 78 legacy tools now have NSH screens; the unified hash tool is retained as an additional consolidated tool.

- The previous implementation remains in Git history at commit `26d2146`.
- Cross-platform limits: the app does not declare network, process or general file access. Tools that would change device state or contact third parties therefore provide offline inspection/command templates; image picking is the only file flow.
- Migration rule: keep core calculations pure and testable, and use NSH UI primitives. Do not reintroduce DOM or React dependencies.

## License

[MIT](./LICENSE)
