import type { LessonDetail } from "@/models/lesson-detail";

export const lessonDetails: Record<string, LessonDetail> = {
  "3.4": {
    lessonId: "3.4",
    title: "Blue Prism Avançado",
    description:
      "Aprofunde seus conhecimentos em recursos avançados da plataforma Blue Prism para automações robustas e escaláveis.",
    summary:
      "Nesta aula, você irá explorar recursos avançados do Blue Prism para criar automações mais inteligentes, reutilizáveis e fáceis de manter. Abordaremos padrões de design, tratamento avançado de exceções e otimização de desempenho.",
    objectives: [
      "Explorar recursos avançados do Blue Prism",
      "Aplicar padrões de design reutilizáveis",
      "Implementar tratamento avançado de exceções",
      "Otimizar performance e manutenção de processos",
    ],
    learnings: [
      "Utilizar Dynamic System Settings de forma avançada",
      "Trabalhar com collections e data items complexos",
      "Implementar Business Objects reutilizáveis",
      "Aplicar padrões de design em automações",
      "Tratar exceções com granularidade",
      "Monitorar e otimizar performance de processos",
    ],
    materials: [
      { id: "material-1", title: "Slides da aula (PDF)", size: "1.2 MB" },
      { id: "material-2", title: "Exercício prático", size: "248 KB" },
      { id: "material-3", title: "Checklist de boas práticas", size: "320 KB" },
      { id: "material-4", title: "Template - Business Object", size: "78 KB" },
    ],
  },
};
