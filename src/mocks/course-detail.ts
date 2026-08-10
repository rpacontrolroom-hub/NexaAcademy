import type { CourseDetail, CourseLesson, CourseModuleStatus } from "@/models/course-detail";

const lesson = (
  id: string,
  title: string,
  duration: string,
  type: CourseLesson["type"],
  completed: boolean,
): CourseLesson => ({ id, title, duration, type, completed });

const moduleData = (
  order: number,
  title: string,
  status: CourseModuleStatus,
  lessons: CourseLesson[] = [],
) => ({
  id: `module-${order}`,
  order,
  title,
  status,
  description:
    order === 1
      ? "Conheça o time de RPA, papéis, responsabilidades e como trabalhamos."
      : `Conteúdo e atividades do módulo ${title}.`,
  lessons,
});

export const onboardingCourse: CourseDetail = {
  title: "Onboarding RPA",
  description:
    "Trilha de integração para novos colaboradores do time de RPA, dos fundamentos ao projeto final.",
  level: "Iniciante",
  totalDuration: "3h 20m de conteúdo",
  progress: 43,
  modules: [
    moduleData(1, "Introdução ao Time", "completed", [
      lesson("1.1", "Boas-vindas e visão geral", "05:15", "document", true),
      lesson("1.2", "Estrutura do time de RPA", "07:30", "document", true),
      lesson("1.3", "Papéis e responsabilidades", "08:45", "video", true),
      lesson("1.4", "Ferramentas e ambiente", "12:20", "video", true),
      lesson("1.5", "Nossos valores e cultura", "04:10", "document", true),
    ]),
    moduleData(2, "Blue Prism Básico", "completed", [
      lesson("2.1", "Fundamentos do Blue Prism", "09:30", "video", true),
      lesson("2.2", "Primeiro processo automatizado", "14:20", "video", true),
    ]),
    moduleData(3, "Blue Prism Avançado", "current", [
      lesson("3.1", "Introdução ao módulo avançado", "05:15", "document", true),
      lesson("3.2", "Dynamic System Settings", "07:30", "document", true),
      lesson("3.3", "Collections e Data Items Complexos", "08:45", "document", true),
      lesson("3.4", "Blue Prism Avançado", "36:45", "video", false),
      lesson("3.5", "Padrões de Design", "12:20", "video", false),
      lesson("3.6", "Tratamento Avançado de Exceções", "10:40", "document", false),
      lesson("3.7", "Otimização de Performance", "09:15", "video", false),
      lesson("3.8", "Boas Práticas e Recomendações", "06:30", "document", false),
    ]),
    moduleData(4, "Control Room", "locked"),
    moduleData(5, "Work Queues", "locked"),
    moduleData(6, "Exceptions", "locked"),
    moduleData(7, "Power Automate", "locked"),
    moduleData(8, "Python", "locked"),
    moduleData(9, "Integrações", "locked"),
    moduleData(10, "Projeto Final", "locked"),
  ],
};
