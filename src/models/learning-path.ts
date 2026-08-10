export type PathStepStatus = "done" | "current" | "locked";

export interface PathStep {
  label: string;
  status: PathStepStatus;
}

export interface LearningPath {
  title: string;
  desc: string;
  color: string;
  modulos: number;
  progress: number;
  steps: PathStep[];
}
