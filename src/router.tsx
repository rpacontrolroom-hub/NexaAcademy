import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Dado buscado vale por 1 minuto: trocar de tela ou voltar para a aba não refaz
  // todas as consultas. As mutações continuam invalidando o que muda (invalidateQueries
  // ignora o staleTime), então o que o usuário altera aparece na hora.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, refetchOnWindowFocus: false },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
