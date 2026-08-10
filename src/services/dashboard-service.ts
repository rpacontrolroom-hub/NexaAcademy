import type { CertificateTraining } from "@/models/certificate";
import type { User } from "@/models/user";

export function calculateDashboardMetrics(users: User[], trainings: CertificateTraining[]) {
  const completed = trainings.filter((item) => item.progresso === 100).length;
  return {
    activeUsers: users.filter((user) => user.status === "ativo").length,
    completedTrainings: completed,
    emittedCertificates: trainings.filter((item) => item.emitido).length,
    completionRate: trainings.length === 0 ? 0 : Math.round((completed / trainings.length) * 100),
  };
}
