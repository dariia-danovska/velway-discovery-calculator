import { createHash } from "node:crypto";
import { defineConfig, loadEnv } from "vite";

// Only a salted SHA-256 hash of the passphrase goes into the bundle — never the plain text.
// The salt must match PASS_SALT in src/access.ts.
const hash = (p: string) => (p ? createHash("sha256").update("velway-discovery:" + p).digest("hex") : "");

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), "VITE_"), ...process.env };
  return {
    // Relative base works both on GitHub Pages (/velway-discovery-calculator/) and at a domain root (Docker / Netlify).
    base: env.VITE_BASE || "./",
    define: { __INTERNAL_PASS_HASH__: JSON.stringify(hash(env.VITE_INTERNAL_PASSPHRASE || "")) },
    build: { outDir: "dist", sourcemap: false },
  };
});
