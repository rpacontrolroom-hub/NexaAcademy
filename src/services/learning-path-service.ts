import type { LearningPath } from "@/models/learning-path";

export function getCurrentStep(path: LearningPath) {
  return path.steps.find((step) => step.status === "current") ?? null;
}
