import type { NextConfig } from "next";

// Two deploy modes:
// - Static (Cloudflare Pages): `output: "export"`, skip API routes. Run `npm run build && wrangler pages deploy out`
// - Full (Cloudflare Pages w/ Functions): `output: undefined`, use `npx @cloudflare/next-on-pages && wrangler pages deploy .vercel/output/static`

const nextConfig: NextConfig = {
  // Switch to "export" for static deploy, comment out for full deploy
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
