export type CourseModuleStatus = "completed" | "current" | "locked";
export type CourseLessonType = "video" | "document";

export interface CourseLesson {
  id: string;
  code?: string;
  title: string;
  duration: string;
  type: CourseLessonType;
  completed: boolean;
}

export interface CourseModule {
  id: string;
  order: number;
  title: string;
  description: string;
  status: CourseModuleStatus;
  lessons: CourseLesson[];
}

export interface CourseDetail {
  title: string;
  description: string;
  level: string;
  totalDuration: string;
  progress: number;
  modules: CourseModule[];
}
