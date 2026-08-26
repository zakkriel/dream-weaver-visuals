import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev-only API proxy: forwards the projection API path (/worlds) to the backend.
// Defaults to the backend's local dev port; override with BACKEND_URL.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/worlds": BACKEND_URL } },
});
