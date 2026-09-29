export type PathStepStatus = "done" | "current" | "locked";

export interface PathStep {
  label: string;
  status: PathStepStatus;
}

export interface LearningPath {
  title: string;
  desc: string;
  color: string;
  cover?: string | null;
  modulos: number;
  progress: number;
  steps: PathStep[];
}
