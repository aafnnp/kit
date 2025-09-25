# Kit — A Privacy-First, Cross-Platform Toolbox with 70+ Utilities

Subtitle: One app for developers, designers, and knowledge workers. Runs entirely on-device. Web + Desktop (Tauri).

---

## TL;DR

- Kit bundles 70+ high-frequency tools across text, design, image/audio/video, crypto & hash, data format conversions, network, generators, and dev utilities.
- 100% local processing, no cloud upload, works offline.
- Ships for Web and Desktop (Windows/macOS/Linux via Tauri). MIT-licensed and free.
- Try it online and get the app:
  - Live demo: [kit.manon.icu](https://kit.manon.icu)
  - Custom domain: `kit.manon.icu`
  - GitHub: [aafnnp/kit](https://github.com/aafnnp/kit)

---

## Why I built Kit

We all hop between countless “small tools” daily: JSON formatter, image compressor, hash checksum, timestamp converter, JWT decoder… They’re scattered across random websites with inconsistent UX, ads, and privacy concerns. Kit consolidates these essentials into one modern, clean, offline-capable app.

---

## Core Value

- Privacy-first: 100% local processing in browser/desktop. No data leaves your device.
- Speed: modern stack, code-splitting, predictive preloading, sub-second response.
- Cross-platform: Web in one click; Tauri desktop for Windows/macOS/Linux.
- Design: minimal, responsive, dark mode, tasteful motion.
- Open source: MIT. Free to use and extend.

---

## What’s Inside (70+ tools, 8 categories)

- Text: word count, case converter, regex tester, diff (text/JSON), Markdown preview, text→PDF, table sort/filter, MD TOC
- Color/Design: color picker, HEX↔RGB, gradients, shadows, border radius, favicon maker, CSS clamp
- Image/AV: compress, resize, crop, format convert, EXIF viewer, SVG minify, GIF splitter, video trim, audio convert, image→PDF, SVG sprite
- Crypto/Hash: MD5, SHA-256, Bcrypt, file checksum, password generator
- Date/Time: timestamp↔date, cron parser, time diff, timezone convert
- Data Formats: JSON/YAML/CSV/XLSX conversions, URL/Base64 codecs, JSON→TS interface, live HTML
- Network: HTTP status lookup, UA parser, MIME search, DNS lookup, IP info, URL inspector
- Generators & Dev: UUID/QR/Barcode/fake users/lottery, JWT decode/sign, regex cheatsheet, Mermaid preview, matrix ops, Roman↔Arabic

---

## Thoughtful UX

- Global search + categories, favorites, and “recent”
- Smart preloading of frequently used tools
- Keyboard accessibility, responsive layouts from mobile to ultrawide

---

## Under the Hood

- Frontend: React 19, TypeScript 5.9, Vite 7, TailwindCSS 4, Motion
- Routing/Data: @tanstack/react-router, @tanstack/react-query
- UI/UX: Radix UI, shadcn/ui, lucide-react, @dnd-kit
- Desktop: Tauri 2 (Rust), multi-platform packaging
- Perf: code-splitting, predictive preloading, tree-shaking, asset optimization
- Deploy: Vercel (SPA), Cloudflare Assets (`kit.manon.icu`)
- Automation: changelog generator, bundle analysis, build optimization

---

## Who It’s For

- Developers: formatting, hashing, parsing, visualization, regex, JSON/CSV/XLSX
- Designers: color utilities, gradients, shadows, icons, batch image ops
- Creators & office users: text stats, PDF conversion, table/data cleanup
- Privacy-conscious users: audit the source, use fully offline

---

## 3-Minute Start

- Try online: [kit.manon.icu](https://kit.manon.icu)
- Local dev

```bash
git clone https://github.com/aafnnp/kit.git
cd kit
npm install
npm run dev
```

- Desktop (Tauri)

```bash
# Install Tauri prerequisites first (see official docs)
npm run tauri dev
npm run tauri build
```

---

## Roadmap

- Near term: more tools, mobile polish, more locales, continued perf work
- Long term: plugin system, optional cloud sync, team features, public APIs

---

## Call to Action

If you’re tired of juggling a dozen sites for “tiny tasks” or care about privacy, give Kit a spin. It’s not one tool—it’s your Swiss Army knife for everyday digital chores.

- Live: [kit.manon.icu](https://kit.manon.icu)
- GitHub: [aafnnp/kit](https://github.com/aafnnp/kit)
- Issues/Discussions: feedback and ideas welcome

If Kit helps you, please star the repo—it genuinely helps the project grow.

---

## Hacker News (Post Template)

- Title (pick one):
  - Kit — A privacy-first, cross-platform toolbox with 70+ local utilities
  - Show HN: Kit — 70+ on-device utilities (Web + Tauri desktop), MIT-licensed
- Text:

I built Kit to consolidate the small-but-essential tools we use daily (formatters, image/AV utilities, hash/checksum, timestamp/cron, JWT, etc.) into one privacy-first app. Everything runs locally in the browser/desktop, offline capable, no data uploaded.

- Live: https://kit.manon.icu
- GitHub: https://github.com/aafnnp/kit
- Desktop: Tauri 2 (Windows/macOS/Linux)
- Stack: React, TypeScript, Vite, TailwindCSS, TanStack Router/Query

Would love feedback—feature requests, UX nits, and perf notes are welcome.

---

## Product Hunt (Listing Copy)

- Name: Kit — Privacy-first toolbox with 70+ on-device utilities
- Tagline: Do everyday tasks faster, locally. Web + Desktop (Tauri).
- Description:

Kit is a modern, open-source toolbox that bundles 70+ everyday utilities—text, design, image/audio/video, crypto & hash, data conversions, network tools, and developer helpers. Everything runs on-device for privacy and speed. Works on the web and ships desktop apps for Windows/macOS/Linux.

- Key features:
  - 100% on-device processing, offline capable
  - 70+ tools across 8 categories (text, design, media, data, network…)
  - Web + Tauri desktop, consistent UX, dark mode
  - Smart preloading, code-splitting, optimized assets
  - MIT-licensed, open source

- Links:
  - Live: https://kit.manon.icu
  - GitHub: https://github.com/aafnnp/kit
  - Website: kit.manon.icu

- Media suggestions:
  - Short demo GIFs: search → open tools, image compress, JSON→TS interface
  - Screens: home grid, dark mode, a few representative tools
  - “Privacy-first” badge, “Web + Desktop” platform chips

- Founder’s note:

Thanks for checking out Kit! I built it to streamline the dozens of little tasks we all repeat daily—now done locally, privately, and fast. I’d love to hear what tool you want next or any UX tweaks you’d like to see.
