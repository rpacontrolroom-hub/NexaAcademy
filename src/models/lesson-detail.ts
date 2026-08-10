export interface LessonMaterial {
  id: string;
  title: string;
  size: string;
}

export interface LessonDetail {
  lessonId: string;
  title: string;
  description: string;
  summary: string;
  objectives: string[];
  learnings: string[];
  materials: LessonMaterial[];
}
