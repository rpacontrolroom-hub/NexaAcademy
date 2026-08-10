import type { CourseDetail, CourseLesson, CourseModule } from "@/models/course-detail";
import type { LessonDetail } from "@/models/lesson-detail";

export interface LessonContext {
  lesson: CourseLesson;
  module: CourseModule;
  previousLesson: CourseLesson | null;
  nextLesson: CourseLesson | null;
  detail: LessonDetail;
}

export function canOpenModule(module: CourseModule): boolean {
  return module.status !== "locked";
}

export function getCompletedModuleCount(course: CourseDetail): number {
  return course.modules.filter((module) => module.status === "completed").length;
}

export function getAccessibleLessons(course: CourseDetail): CourseLesson[] {
  return course.modules.filter(canOpenModule).flatMap((module) => module.lessons);
}

export function getLessonContext(
  course: CourseDetail,
  lessonId: string,
  details: Record<string, LessonDetail>,
): LessonContext | null {
  const module = course.modules.find((item) => item.lessons.some((lesson) => lesson.id === lessonId));
  const lesson = module?.lessons.find((item) => item.id === lessonId);
  if (!module || !lesson || !canOpenModule(module)) return null;

  const accessibleLessons = getAccessibleLessons(course);
  const lessonIndex = accessibleLessons.findIndex((item) => item.id === lessonId);
  const detail = details[lessonId] ?? {
    lessonId,
    title: lesson.title,
    description: `Aula do módulo ${module.title}.`,
    summary: `Nesta aula você estudará ${lesson.title.toLowerCase()} e seus principais conceitos práticos.`,
    objectives: ["Compreender os conceitos da aula", "Aplicar o conteúdo em um cenário prático"],
    learnings: ["Reconhecer os fundamentos apresentados", "Utilizar o conteúdo nas atividades do curso"],
    materials: [],
  };

  return {
    lesson,
    module,
    previousLesson: accessibleLessons[lessonIndex - 1] ?? null,
    nextLesson: accessibleLessons[lessonIndex + 1] ?? null,
    detail,
  };
}
