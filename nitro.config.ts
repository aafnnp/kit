import { defineNitroConfig } from "nitropack/config"

// Get preset from environment variable, default to 'static'
const preset = process.env.NITRO_PRESET || "static"

export default defineNitroConfig({
  // Preset can be overridden via NITRO_PRESET env var
  // Use 'cloudflare-pages' for Cloudflare Pages
  // Use 'vercel' for Vercel
  // Use 'static' for general static hosting
  preset,
  
  // Compatibility date for Cloudflare Workers
  compatibilityDate: "2025-01-01",
  
  // Output directory
  output: {
    dir: ".output",
    publicDir: "dist",
  },
  
  // Static assets configuration
  publicAssets: [
    {
      baseURL: "/",
      dir: "dist",
      maxAge: 60 * 60 * 24 * 7, // 7 days cache
    },
  ],
  
  // SPA fallback - serve index.html for all routes
  routeRules: {
    "/**": { 
      prerender: false,
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    },
  },
  
  // Cloudflare Pages configuration
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
    pages: {
      // SPA fallback for Cloudflare Pages
      notFoundHandling: "single-page-application",
    },
  },
  
  // Vercel configuration
  vercel: {
    config: {
      rewrites: [
        {
          source: "/(.*)",
          destination: "/index.html",
        },
      ],
    },
  },
  
  // Build configuration
  build: {
    // Prerender is disabled for SPA
    prerender: {
      crawlLinks: false,
    },
  },
})

