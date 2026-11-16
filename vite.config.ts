import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.hdslb.com https://*.bilibili.com",
  "font-src 'self'",
  "connect-src 'self' http://127.0.0.1:*",
  "media-src 'self' blob: http://127.0.0.1:*",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');
export default defineConfig({
  base: "./",
  plugins: [react(), {
    name: 'production-content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [{
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: contentSecurityPolicy },
      injectTo: 'head-prepend',
    }],
  }],
  build: { outDir: "dist", chunkSizeWarningLimit: 1200 },
});
