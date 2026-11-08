import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";

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

/** Erro de carregar um pedaço do app que não existe mais (nova versão publicada com a aba aberta). */
function ehVersaoAntiga(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed|module script|Failed to fetch dynamically|Loading chunk/i.test(msg);
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  const router = useRouter();
  const mensagem = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  useEffect(() => {
    console.error("Root route error", error);
    // Nova versão publicada: recarrega uma vez para buscar os arquivos novos.
    if (ehVersaoAntiga(error)) {
      try {
        // No máximo uma vez a cada 30 s, para não entrar em laço se o erro for outro.
        const ultima = Number(sessionStorage.getItem("nexa-recarregou") ?? 0);
        if (Date.now() - ultima > 30_000) {
          sessionStorage.setItem("nexa-recarregou", String(Date.now()));
          window.location.reload();
        }
      } catch {
        // sem armazenamento: segue mostrando a tela de erro
      }
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo deu errado nesta tela
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente de novo ou volte para o início. Se continuar, envie a mensagem abaixo para o suporte.
        </p>
        <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md border border-input bg-muted px-3 py-2 text-left text-xs text-muted-foreground">
          {mensagem}
        </pre>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
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
      { title: "Nexa Academy" },
      {
        name: "description",
        content:
          "Plataforma de treinamento Nexa Academy da Hering com trilhas, certificados e Nexa IA.",
      },
      { name: "author", content: "Hering" },
      { property: "og:title", content: "Nexa Academy" },
      {
        property: "og:description",
        content:
          "Trilhas, cursos e certificações com o assistente Nexa IA integrado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Nexa Academy" },
      { property: "og:image", content: "/favicon-512.png" },
      { name: "twitter:image", content: "/favicon-512.png" },
    ],
    // Aplica o tema salvo antes da primeira pintura (evita piscar o tema claro).
    scripts: [
      { children: 'try{if(localStorage.getItem("nexa-tema")==="oceano")document.documentElement.dataset.tema="oceano"}catch(e){}' },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap" },
      { rel: "icon", href: "/favicon.ico?v=2", sizes: "any" },
      { rel: "icon", href: "/favicon-32.png?v=2", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=2" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
