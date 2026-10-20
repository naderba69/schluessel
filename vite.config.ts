import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // المعاينة الحية عبر نطاق الوكيل (e2b.app) — بدون allowedHosts يرفضها Vite بـ403
  server: { host: "0.0.0.0", port: 5173, allowedHosts: true },
  preview: { host: "0.0.0.0", port: 4173, allowedHosts: true },
  build: {
    outDir: "dist",
    // D104: المقاطع الصوتية ملفات مستقلة دائماً — لا base64 داخل الحزمة (كانت 233 مقطعاً <4KB تُدمج
    // في JS فتضخّمها ~1MB وتُحرم من التخزين المستقل في عامل الخدمة)
    assetsInlineLimit: (file) => (file.endsWith(".opus") ? false : undefined),
  },
});
