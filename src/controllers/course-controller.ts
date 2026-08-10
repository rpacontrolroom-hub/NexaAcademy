import type { CourseDetail, CourseModule } from "@/models/course-detail";
import type { LessonDetail } from "@/models/lesson-detail";
import {
  canOpenModule,
  getCompletedModuleCount,
  getLessonContext,
} from "@/services/course-service";

export const courseController = {
  canSelectModule(module: CourseModule) {
    return canOpenModule(module);
  },
  getCompletedModuleCount(course: CourseDetail) {
    return getCompletedModuleCount(course);
  },
  getLessonContext(
    course: CourseDetail,
    lessonId: string,
    details: Record<string, LessonDetail>,
  ) {
    return getLessonContext(course, lessonId, details);
  },
};
