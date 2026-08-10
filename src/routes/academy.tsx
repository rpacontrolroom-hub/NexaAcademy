import { createFileRoute } from "@tanstack/react-router";
import NexaAcademy from "@/views/academy/NexaAcademyView";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Nexa Academy" },
      {
        name: "description",
        content:
          "Plataforma de treinamento Nexa Academy: trilhas, certificados e assistente Nexa IA para o time Hering.",
      },
      { property: "og:title", content: "Nexa Academy" },
      {
        property: "og:description",
        content:
          "Trilhas, cursos e certificações com o assistente Nexa IA integrado.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <NexaAcademy />;
}
