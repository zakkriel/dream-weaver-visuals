/// <reference types="vitest/config" />
// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Extra vite config, passed through the way the wrapper documents above — no plugins added.
  //
  // Dev-only proxy for the projection API. Every request the app makes is a same-origin relative
  // path (`/worlds/...`), so in dev it lands here and is forwarded to the backend. That means the app
  // needs no CORS grant and no configured origin, and — the reason it matters here — in the Lovable
  // preview, where there is no proxy and no backend, the fetch simply fails and the app falls back to
  // its bundled fixtures. A failed fetch is debuggable from inside the editor; a failed CORS
  // preflight is not. Override the target with BACKEND_URL.
  //
  // `/worlds` is BOTH the directory endpoint and the picker's route, so the proxy has to tell a
  // navigation from a fetch. It does that the way the web already distinguishes them: a browser
  // navigating sends `Accept: text/html`; a `fetch` for JSON does not. Without this the proxy
  // shadows the page and the picker serves raw JSON in dev — which it did.
  vite: {
    server: {
      proxy: {
        "/worlds": {
          target: process.env["BACKEND_URL"] ?? "http://localhost:8080",
          // Required once the target is spelled out: a hosted backend routes on the Host header.
          changeOrigin: true,
          bypass: (req: { headers: NodeJS.Dict<string | string[]> }) =>
            String(req.headers["accept"] ?? "").includes("text/html") ? "/index.html" : undefined,
        },
      },
    },
    // The test graph is `src/`, and nothing else — the same scope tsconfig.json already declares
    // with `include: ["src/**"]`. Vitest's default glob is repo-wide, so without this it collects
    // `docs/90_archive/design-system/**/*.test.tsx`: 20 test files from the archived predecessor,
    // which import `@testing-library/react` (not a dependency here) and assume a DOM. That took CI
    // from 5 files / 140 tests green to 20 files failing the moment those docs landed. The archive
    // is provenance, not a test suite, and `docs/90_archive/README.md` says so — this is what makes
    // that sentence true rather than aspirational. Set here rather than in the `test` script so
    // `bunx vitest run` behaves the same as `bun run test`.
    test: { dir: "src" },
  },
});
