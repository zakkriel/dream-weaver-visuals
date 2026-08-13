import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Atmosphere } from "@/components/dc/Atmosphere";
import { InvalidCredentialsError, isAuthRequired, login, subscribeAuthRequired } from "@/api/auth";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DreamChat" },
      {
        name: "description",
        content:
          "DreamChat — a persistent AI world. Every screen is one character's perception of it.",
      },
      { property: "og:title", content: "DreamChat" },
      {
        property: "og:description",
        content:
          "DreamChat — a persistent AI world. Every screen is one character's perception of it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function LoginGate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      window.location.reload();
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        setError("invalid credentials");
      } else {
        setError("Could not sign in right now. Try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <Atmosphere>
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6 py-12">
        <section className="dc-glass w-full rounded-dc-lg border border-dc-border p-6 sm:p-8">
          <p className="dc-label text-dc-text-muted">DreamChat</p>
          <h1 className="mt-3 font-display text-3xl text-dc-text">Sign in</h1>
          <p className="mt-2 font-body text-dc-text-muted">Enter your account to continue this world.</p>
          <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
            <label className="flex flex-col gap-2">
              <span className="dc-label text-dc-text-muted">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="dc-focus rounded-dc-sm border border-dc-border bg-black/20 px-3 py-2 font-ui text-sm text-dc-text outline-none placeholder:text-dc-text-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="dc-label text-dc-text-muted">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="dc-focus rounded-dc-sm border border-dc-border bg-black/20 px-3 py-2 font-ui text-sm text-dc-text outline-none placeholder:text-dc-text-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            {error && <p className="font-ui text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="dc-focus mt-1 inline-flex items-center justify-center rounded-dc-sm bg-dc-world px-4 py-2.5 font-ui text-sm font-medium text-dc-on-accent transition hover:bg-dc-world-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    </Atmosphere>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [authRequired, setAuthRequired] = useState(() => isAuthRequired());

  useEffect(() => subscribeAuthRequired(setAuthRequired), []);

  return (
    <QueryClientProvider client={queryClient}>
      {authRequired ? <LoginGate /> : <Outlet />}
    </QueryClientProvider>
  );
}
