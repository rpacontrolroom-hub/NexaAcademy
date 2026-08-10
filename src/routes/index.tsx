import { createFileRoute } from "@tanstack/react-router";
import Login from "@/components/Login";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexa Academy" },
      {
        name: "description",
        content: "Acesse a Nexa Academy da Hering com seu e-mail corporativo.",
      },
      { property: "og:title", content: "Nexa Academy" },
      {
        property: "og:description",
        content: "Faça login na plataforma de treinamento Nexa Academy da Hering.",
      },
    ],
  }),
  component: Login,
});
