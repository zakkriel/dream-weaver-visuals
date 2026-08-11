/**
 * Where a HOSTED build talks to.
 *
 * This is committed on purpose. It is a public URL, not a secret — the browser sends it in every
 * request anyway — and committing it is the only thing that works in the Lovable preview, which
 * builds this repo without injecting custom `VITE_*` variables. An env var the platform never sets is
 * an env var that does not exist, and the preview sat in fixture mode because of it.
 *
 * **To repoint the hosted preview, edit this one line.** No env plumbing, no rebuild config.
 */
export const HOSTED_API_BASE = "https://world-api-production-8fa6.up.railway.app";

/**
 * Hostnames that mean "a developer's own machine", where the vite dev proxy is the right answer and
 * a hosted default would be actively wrong.
 *
 * Everything else — a Lovable preview domain, a LAN address, a real deployment — is treated as hosted
 * and gets `HOSTED_API_BASE`. That is deliberately broad rather than an allowlist of
 * `*.lovable.app` / `*.lovableproject.com`: preview domains change, and the failure mode of a missing
 * pattern is the exact silent fixture-mode fallback this exists to end. A wrong guess here is loud —
 * the app names the base it could not reach — while a missing pattern is silent.
 */
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]", ""]);

export function isLocalHostname(hostname: string): boolean {
  return (
    LOCAL_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".localhost")
  );
}
