// Hooks React Query sobre o repositório. As chaves ficam centralizadas em `keys`
// para que as mutações invalidem exatamente o que muda.
import { useQuery } from "@tanstack/react-query";
import * as repo from "@/data/academy-repository";

export const keys = {
  perfil: (userId?: string) => ["perfil", userId] as const,
  meuResumo: (userId?: string) => ["meu-resumo", userId] as const,
  categorias: ["categorias"] as const,
  treinamentos: ["treinamentos"] as const,
  matriculas: (userId?: string) => ["matriculas", userId] as const,
  conteudo: (treinamentoId?: string | null) => ["conteudo", treinamentoId] as const,
  concluidas: (userId?: string, treinamentoId?: string | null) => ["concluidas", userId, treinamentoId] as const,
  aula: (aulaId?: string | null) => ["aula", aulaId] as const,
  comentarios: (aulaId?: string | null) => ["comentarios", aulaId] as const,
  favoritos: (userId?: string) => ["favoritos", userId] as const,
  trilhas: ["trilhas"] as const,
  trilhasAdmin: ["trilhas", "admin"] as const,
  modelos: ["modelos-certificado"] as const,
  meusCertificados: (userId?: string) => ["meus-certificados", userId] as const,
  usuarios: ["usuarios"] as const,
  adminResumo: ["admin-resumo"] as const,
  horasMensais: ["horas-mensais"] as const,
  topTreinamentos: ["top-treinamentos"] as const,
  logs: ["logs"] as const,
  videos: ["videos"] as const,
  aulasDoTreinamento: (treinamentoId?: string | null) => ["aulas-do-treinamento", treinamentoId] as const,
};

export function usePerfil(userId?: string) {
  return useQuery({ queryKey: keys.perfil(userId), queryFn: () => repo.fetchMeuPerfil(userId!), enabled: !!userId });
}

export function useMeuResumo(userId?: string) {
  return useQuery({ queryKey: keys.meuResumo(userId), queryFn: () => repo.fetchMeuResumo(userId!), enabled: !!userId });
}

export function useCategorias(enabled = true) {
  return useQuery({ queryKey: keys.categorias, queryFn: repo.fetchCategorias, enabled });
}

export function useTreinamentos(enabled = true) {
  return useQuery({ queryKey: keys.treinamentos, queryFn: repo.fetchTreinamentos, enabled });
}

export function useMatriculas(userId?: string) {
  return useQuery({ queryKey: keys.matriculas(userId), queryFn: () => repo.fetchMinhasMatriculas(userId!), enabled: !!userId });
}

export function useConteudo(treinamentoId?: string | null) {
  return useQuery({ queryKey: keys.conteudo(treinamentoId), queryFn: () => repo.fetchConteudoTreinamento(treinamentoId!), enabled: !!treinamentoId });
}

export function useAulasConcluidas(userId: string | undefined, treinamentoId: string | null | undefined, aulaIds: string[]) {
  return useQuery({
    queryKey: [...keys.concluidas(userId, treinamentoId), aulaIds.length],
    queryFn: () => repo.fetchAulasConcluidas(userId!, aulaIds),
    enabled: !!userId && !!treinamentoId,
  });
}

/** Conteúdo do curso + progresso do usuário no formato CourseDetail. */
export function useCursoDetalhe(userId: string | undefined, treinamento: repo.Treinamento | undefined, progresso: number) {
  const conteudo = useConteudo(treinamento?.id);
  const aulaIds = (conteudo.data ?? []).flatMap((m) => m.aulas.map((a) => a.id));
  const concluidas = useAulasConcluidas(userId, treinamento?.id, aulaIds);
  const course = treinamento && conteudo.data
    ? repo.montarCursoDetalhe(treinamento, conteudo.data, concluidas.data ?? new Set(), progresso)
    : null;
  return { course, modulos: conteudo.data ?? [], isLoading: conteudo.isLoading || concluidas.isLoading };
}

export function useAula(aulaId?: string | null) {
  return useQuery({ queryKey: keys.aula(aulaId), queryFn: () => repo.fetchAulaDetalhe(aulaId!), enabled: !!aulaId });
}

export function useComentarios(aulaId?: string | null) {
  return useQuery({ queryKey: keys.comentarios(aulaId), queryFn: () => repo.fetchComentarios(aulaId!), enabled: !!aulaId });
}

export function useFavoritos(userId?: string) {
  return useQuery({ queryKey: keys.favoritos(userId), queryFn: () => repo.fetchFavoritos(userId!), enabled: !!userId });
}

export function useTrilhas(enabled = true) {
  return useQuery({ queryKey: keys.trilhas, queryFn: repo.fetchTrilhas, enabled });
}

export function useTrilhasAdmin(enabled = true) {
  return useQuery({ queryKey: keys.trilhasAdmin, queryFn: repo.fetchTrilhasAdmin, enabled });
}

export function useModelosCertificado(enabled = true) {
  return useQuery({ queryKey: keys.modelos, queryFn: repo.fetchModelosCertificado, enabled });
}

export function useMeusCertificados(userId?: string) {
  return useQuery({ queryKey: keys.meusCertificados(userId), queryFn: () => repo.fetchMeusCertificados(userId!), enabled: !!userId });
}

export function useUsuarios(enabled: boolean) {
  return useQuery({ queryKey: keys.usuarios, queryFn: repo.fetchUsuarios, enabled });
}

export function useAdminResumo(enabled: boolean) {
  return useQuery({ queryKey: keys.adminResumo, queryFn: repo.fetchAdminResumo, enabled });
}

export function useHorasMensais(enabled: boolean) {
  return useQuery({ queryKey: keys.horasMensais, queryFn: () => repo.fetchHorasMensais(), enabled });
}

export function useTopTreinamentos(enabled: boolean) {
  return useQuery({ queryKey: keys.topTreinamentos, queryFn: () => repo.fetchTopTreinamentos(), enabled });
}

export function useVideos(enabled = true) {
  return useQuery({ queryKey: keys.videos, queryFn: repo.fetchVideos, enabled });
}

export function useAulasDoTreinamento(treinamentoId?: string | null) {
  return useQuery({ queryKey: keys.aulasDoTreinamento(treinamentoId), queryFn: () => repo.fetchAulasDoTreinamento(treinamentoId!), enabled: !!treinamentoId });
}
