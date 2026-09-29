// Acesso ao Supabase. Converte as linhas do banco para os formatos que as telas já usam.
// Sem tipos gerados do banco (supabase gen types), as linhas chegam como any e são tipadas aqui.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase, MIDIA_BUCKET } from "@/lib/supabase";
import { formatDate, formatMinutes, formatSeconds, parseDuration, slugify } from "@/lib/format";
import type { CertificateTemplate, CertificateTemplateDraft, CertificateTraining } from "@/models/certificate";
import type { CourseDetail, CourseModule } from "@/models/course-detail";
import type { LearningPath } from "@/models/learning-path";
import type { TrainingDraft, TrainingMaterial, TrainingModule } from "@/models/training";

// Sem erro, o Supabase sempre devolve data (exceto maybeSingle, tratado com `| null` nos retornos).
function check<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  return result.data as NonNullable<T>;
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

export async function logAtividade(acao: string, entidade?: string, entidadeId?: string) {
  const userId = await currentUserId();
  await supabase.from("logs_atividade").insert({ user_id: userId, acao, entidade, entidade_id: entidadeId });
}

/* ---------------- Arquivos ---------------- */
export async function uploadArquivo(source: File | Blob | string, pasta: string, nome = "arquivo"): Promise<string> {
  const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
  const fileName = source instanceof File ? source.name : nome;
  const path = `${pasta}/${crypto.randomUUID()}-${slugify(fileName.replace(/\.[^.]+$/, "")) || "arquivo"}${fileName.match(/\.[^.]+$/)?.[0] ?? ""}`;
  check(await supabase.storage.from(MIDIA_BUCKET).upload(path, blob, { contentType: blob.type || undefined }));
  return supabase.storage.from(MIDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/* ---------------- Perfil ---------------- */
export interface Perfil {
  id: string;
  nome: string;
  email: string;
  cargo: string | null;
  avatar_url: string | null;
  perfil: "usuario" | "administrador";
  status: "ativo" | "inativo";
  ultimo_acesso: string | null;
  created_at: string;
}

export async function fetchMeuPerfil(userId: string): Promise<Perfil | null> {
  return check(await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()) as Perfil | null;
}

export async function registrarAcesso(userId: string) {
  await supabase.from("profiles").update({ ultimo_acesso: new Date().toISOString() }).eq("id", userId);
}

export async function atualizarMeuPerfil(userId: string, patch: { nome: string; cargo: string }) {
  check(await supabase.from("profiles").update({ nome: patch.nome.trim(), cargo: patch.cargo.trim() || null }).eq("id", userId));
}

/** Envia a foto para avatars/<userId>/ (pasta liberada ao próprio usuário) e grava no perfil.
 *  Com `null`, remove a foto do perfil. */
export async function atualizarMinhaFoto(userId: string, foto: File | null) {
  const avatarUrl = foto ? await uploadArquivo(foto, `avatars/${userId}`) : null;
  check(await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId));
}

export async function alterarSenha(email: string, senhaAtual: string, novaSenha: string) {
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senhaAtual });
  if (loginError) throw new Error("Senha atual incorreta.");
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) throw new Error(error.message);
}

export interface MeuResumo {
  em_andamento: number;
  concluidos: number;
  certificados: number;
  favoritos: number;
  horas_estudadas: number;
}

export async function fetchMeuResumo(userId: string): Promise<MeuResumo> {
  const row = check(await supabase.from("vw_meu_resumo").select("*").eq("user_id", userId).maybeSingle());
  return {
    em_andamento: Number(row?.em_andamento ?? 0),
    concluidos: Number(row?.concluidos ?? 0),
    certificados: Number(row?.certificados ?? 0),
    favoritos: Number(row?.favoritos ?? 0),
    horas_estudadas: Number(row?.horas_estudadas ?? 0),
  };
}

/* ---------------- Catálogo ---------------- */
export interface Categoria {
  id: string;
  nome: string;
}

export async function fetchCategorias(): Promise<Categoria[]> {
  return check(await supabase.from("categorias").select("id, nome").eq("ativo", true).order("ordem"));
}

/** Cria a categoria (ou reaproveita uma com o mesmo nome) e devolve o id. */
export async function obterOuCriarCategoria(nome: string): Promise<string> {
  const limpo = nome.trim();
  const existente = check(await supabase.from("categorias").select("id, ativo").ilike("nome", limpo.replace(/[%_\\]/g, "\\$&")).maybeSingle()) as { id: string; ativo: boolean } | null;
  if (existente) {
    if (!existente.ativo) check(await supabase.from("categorias").update({ ativo: true }).eq("id", existente.id));
    return existente.id;
  }
  const ultima = check(await supabase.from("categorias").select("ordem").order("ordem", { ascending: false }).limit(1)) as { ordem: number }[];
  const row = check(await supabase.from("categorias").insert({ nome: limpo, ordem: (ultima[0]?.ordem ?? 0) + 1 }).select("id").single());
  return row.id as string;
}

export interface Treinamento {
  id: string;
  slug: string;
  title: string;
  cat: string;
  categoriaId: string | null;
  level: string;
  dur: string;
  minutos: number;
  cover: string | null;
  icone: string | null;
  grad: [string, string];
  desc: string;
  status: "ativo" | "inativo";
  alunos: number;
}

export async function fetchTreinamentos(): Promise<Treinamento[]> {
  const rows = check(
    await supabase
      .from("treinamentos")
      .select("id, slug, titulo, descricao, nivel, duracao_minutos, capa_url, icone, gradiente_inicio, gradiente_fim, status, categoria_id, categorias(nome), matriculas(count)")
      .order("created_at", { ascending: false }),
  );
  return rows.map((t: any) => ({
    id: t.id,
    slug: t.slug,
    title: t.titulo,
    cat: t.categorias?.nome ?? "Sem categoria",
    categoriaId: t.categoria_id,
    level: t.nivel,
    dur: formatMinutes(t.duracao_minutos),
    minutos: t.duracao_minutos,
    cover: t.capa_url,
    icone: t.icone,
    grad: [t.gradiente_inicio ?? "#3D6BFF", t.gradiente_fim ?? "#2DD4E8"],
    desc: t.descricao ?? "",
    status: t.status,
    alunos: t.matriculas?.[0]?.count ?? 0,
  }));
}

export interface Matricula {
  treinamento_id: string;
  progresso: number;
  aproveitamento: number | null;
  ultima_aula_id: string | null;
  concluido_em: string | null;
  updated_at: string;
}

export async function fetchMinhasMatriculas(userId: string): Promise<Matricula[]> {
  const rows = check(
    await supabase
      .from("matriculas")
      .select("treinamento_id, progresso, aproveitamento, ultima_aula_id, concluido_em, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  );
  return rows.map((m: any) => ({ ...m, progresso: Number(m.progresso), aproveitamento: m.aproveitamento === null ? null : Number(m.aproveitamento) }));
}

/* ---------------- Conteúdo do curso ---------------- */
export interface AulaResumo {
  id: string;
  codigo: string | null;
  titulo: string;
  tipo: string;
  duracao_segundos: number;
  url: string | null;
  conteudo: string | null;
}

export interface ModuloConteudo {
  id: string;
  ordem: number;
  titulo: string;
  descricao: string | null;
  imagem_url: string | null;
  aulas: AulaResumo[];
}

export async function fetchConteudoTreinamento(treinamentoId: string): Promise<ModuloConteudo[]> {
  return check(
    await supabase
      .from("modulos")
      .select("id, ordem, titulo, descricao, imagem_url, aulas(id, ordem, codigo, titulo, tipo, duracao_segundos, url, conteudo, status)")
      .eq("treinamento_id", treinamentoId)
      .eq("aulas.status", "publicado")
      .order("ordem")
      .order("ordem", { referencedTable: "aulas" }),
  ) as ModuloConteudo[];
}

export async function fetchAulasConcluidas(userId: string, aulaIds: string[]): Promise<Set<string>> {
  if (aulaIds.length === 0) return new Set();
  const rows = check(
    await supabase.from("aula_progresso").select("aula_id").eq("user_id", userId).eq("concluida", true).in("aula_id", aulaIds),
  );
  return new Set(rows.map((r: any) => r.aula_id));
}

/** Monta o CourseDetail: módulo concluído quando todas as aulas estão concluídas,
 *  o primeiro não concluído é o atual e os seguintes ficam bloqueados. */
export function montarCursoDetalhe(
  treinamento: Treinamento,
  modulos: ModuloConteudo[],
  concluidas: Set<string>,
  progresso: number,
): CourseDetail {
  let atualDefinido = false;
  const modules: CourseModule[] = modulos.map((m) => {
    const lessons = m.aulas.map((a) => ({
      id: a.id,
      code: a.codigo ?? undefined,
      title: a.titulo,
      duration: formatSeconds(a.duracao_segundos),
      type: a.tipo === "video" ? ("video" as const) : ("document" as const),
      completed: concluidas.has(a.id),
    }));
    const completo = lessons.length > 0 && lessons.every((l) => l.completed);
    let status: CourseModule["status"];
    if (completo) status = "completed";
    else if (!atualDefinido) {
      status = "current";
      atualDefinido = true;
    } else status = "locked";
    return { id: m.id, order: m.ordem, title: m.titulo, description: m.descricao ?? "", status, lessons };
  });
  return {
    title: treinamento.title,
    description: treinamento.desc,
    level: treinamento.level,
    totalDuration: `${treinamento.dur} de conteúdo`,
    progress: Math.round(progresso),
    modules,
  };
}

export interface AulaDetalhe {
  id: string;
  titulo: string;
  tipo: string;
  url: string | null;
  conteudo: string | null;
  descricao: string | null;
  resumo: string | null;
  objetivos: string[];
  aprendizados: string[];
  transcricao: string | null;
  materiais: { id: string; titulo: string; arquivo_url: string | null; tamanho_bytes: number | null }[];
}

export async function fetchAulaDetalhe(aulaId: string): Promise<AulaDetalhe | null> {
  const aula = check(
    await supabase
      .from("aulas")
      .select("id, modulo_id, titulo, tipo, url, conteudo, descricao, resumo, objetivos, aprendizados, transcricao, materiais:aula_materiais(id, titulo, arquivo_url, tamanho_bytes)")
      .eq("id", aulaId)
      .order("ordem", { referencedTable: "aula_materiais" })
      .maybeSingle(),
  ) as (AulaDetalhe & { modulo_id: string }) | null;
  if (!aula) return null;
  // Os materiais do módulo aparecem em todas as aulas dele, antes dos materiais próprios da aula.
  const doModulo = (await fetchMateriaisDosModulos([aula.modulo_id]))[aula.modulo_id] ?? [];
  return { ...aula, materiais: [...doModulo, ...(aula.materiais ?? [])] };
}

type MaterialBanco = { id: string; titulo: string; arquivo_url: string | null; tamanho_bytes: number | null };

// A tabela modulo_materiais vem de uma migration posterior; sem ela, segue sem materiais de módulo.
function tabelaModuloMateriaisAusente(error: { message: string; code?: string } | null) {
  return !!error && (error.code === "42P01" || error.code === "PGRST205" || error.message.includes("modulo_materiais"));
}

/** Materiais por módulo: { [moduloId]: materiais em ordem }. */
export async function fetchMateriaisDosModulos(moduloIds: string[]): Promise<Record<string, MaterialBanco[]>> {
  if (!moduloIds.length) return {};
  const { data, error } = await supabase
    .from("modulo_materiais")
    .select("id, modulo_id, titulo, arquivo_url, tamanho_bytes")
    .in("modulo_id", moduloIds)
    .order("ordem");
  if (tabelaModuloMateriaisAusente(error)) return {};
  if (error) throw new Error(error.message);
  const porModulo: Record<string, MaterialBanco[]> = {};
  for (const m of data as (MaterialBanco & { modulo_id: string })[]) (porModulo[m.modulo_id] ??= []).push({ id: m.id, titulo: m.titulo, arquivo_url: m.arquivo_url, tamanho_bytes: m.tamanho_bytes });
  return porModulo;
}

/** Registra que o usuário abriu a aula (cria a matrícula na primeira vez). */
export async function registrarAulaAberta(userId: string, aulaId: string) {
  await supabase.from("aula_progresso").upsert({ user_id: userId, aula_id: aulaId }, { onConflict: "user_id,aula_id", ignoreDuplicates: true });
}

export async function definirAulaConcluida(userId: string, aulaId: string, concluida: boolean) {
  check(
    await supabase.from("aula_progresso").upsert(
      { user_id: userId, aula_id: aulaId, concluida, concluida_em: concluida ? new Date().toISOString() : null },
      { onConflict: "user_id,aula_id" },
    ),
  );
}

export interface Comentario {
  id: string;
  conteudo: string;
  created_at: string;
  user_id: string;
  autor: string;
  autorFoto: string | null;
}

export async function fetchComentarios(aulaId: string): Promise<Comentario[]> {
  const rows = check(
    await supabase.from("aula_comentarios").select("id, conteudo, created_at, user_id, profiles(nome, avatar_url)").eq("aula_id", aulaId).order("created_at"),
  );
  // O RLS de profiles só devolve o próprio perfil; nome e foto dos demais vêm de vw_perfis_publicos.
  const ids = [...new Set(rows.map((c: any) => c.user_id as string))];
  const autores = new Map<string, { nome: string; avatar_url: string | null }>();
  if (ids.length) {
    const { data } = await supabase.from("vw_perfis_publicos").select("id, nome, avatar_url").in("id", ids);
    for (const p of (data ?? []) as { id: string; nome: string; avatar_url: string | null }[]) autores.set(p.id, p);
  }
  return rows.map((c: any) => {
    const autor = autores.get(c.user_id) ?? c.profiles;
    return { id: c.id, conteudo: c.conteudo, created_at: c.created_at, user_id: c.user_id, autor: autor?.nome ?? "Usuário", autorFoto: autor?.avatar_url ?? null };
  });
}

export async function adicionarComentario(aulaId: string, conteudo: string) {
  const userId = await currentUserId();
  check(await supabase.from("aula_comentarios").insert({ aula_id: aulaId, user_id: userId, conteudo: conteudo.trim() }));
}

export async function excluirComentario(id: string) {
  check(await supabase.from("aula_comentarios").delete().eq("id", id));
}

/* ---------------- Favoritos ---------------- */
export async function fetchFavoritos(userId: string): Promise<string[]> {
  const rows = check(await supabase.from("favoritos").select("treinamento_id").eq("user_id", userId).order("created_at", { ascending: false }));
  return rows.map((r: any) => r.treinamento_id);
}

export async function definirFavorito(userId: string, treinamentoId: string, favorito: boolean) {
  if (favorito) check(await supabase.from("favoritos").upsert({ user_id: userId, treinamento_id: treinamentoId }, { onConflict: "user_id,treinamento_id" }));
  else check(await supabase.from("favoritos").delete().eq("user_id", userId).eq("treinamento_id", treinamentoId));
}

/* ---------------- Notificações ---------------- */
export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  created_at: string;
  lida: boolean;
}

/** Notificações para o usuário (as gerais e as dele). O RLS de notificacao_leituras
 *  só devolve as leituras do próprio usuário, então o embed indica se ele já leu. */
export async function fetchNotificacoes(userId: string): Promise<Notificacao[]> {
  const rows = check(
    await supabase
      .from("notificacoes")
      .select("id, titulo, mensagem, link, created_at, destinatario_id, leituras:notificacao_leituras(user_id)")
      .or(`destinatario_id.is.null,destinatario_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(30),
  );
  return rows.map((n: any) => ({
    id: n.id, titulo: n.titulo, mensagem: n.mensagem, link: n.link, created_at: n.created_at,
    lida: (n.leituras ?? []).some((l: any) => l.user_id === userId),
  }));
}

export async function marcarNotificacoesLidas(userId: string, ids: string[]) {
  if (!ids.length) return;
  check(await supabase.from("notificacao_leituras").upsert(ids.map((id) => ({ notificacao_id: id, user_id: userId })), { onConflict: "notificacao_id,user_id", ignoreDuplicates: true }));
}

/* ---------------- Trilhas ---------------- */
export interface TrilhaBanco {
  id: string;
  titulo: string;
  descricao: string | null;
  cor: string | null;
  capa_url?: string | null;
  etapas: { ordem: number; titulo: string; treinamento_id: string | null }[];
}

/** Busca trilhas incluindo a capa. Se a migration da capa (trilhas.capa_url)
 *  ainda não foi aplicada, repete a consulta sem a coluna para não quebrar a tela. */
async function consultarTrilhas(colunas: string, apenasAtivas: boolean) {
  const consulta = (cols: string) => {
    let q = supabase.from("trilhas").select(`${cols}, etapas:trilha_etapas(ordem, titulo, treinamento_id)`);
    if (apenasAtivas) q = q.eq("status", "ativo");
    return q.order("created_at").order("ordem", { referencedTable: "trilha_etapas" });
  };
  const comCapa = await consulta(`${colunas}, capa_url`);
  if (comCapa.error?.message.includes("capa_url")) return check(await consulta(colunas));
  return check(comCapa);
}

export async function fetchTrilhas(): Promise<TrilhaBanco[]> {
  return (await consultarTrilhas("id, titulo, descricao, cor", true)) as TrilhaBanco[];
}

/* Admin: todas as trilhas (ativas e inativas), com as etapas. */
export interface TrilhaAdmin extends TrilhaBanco {
  status: "ativo" | "inativo";
}

export async function fetchTrilhasAdmin(): Promise<TrilhaAdmin[]> {
  return (await consultarTrilhas("id, titulo, descricao, cor, status", false)) as TrilhaAdmin[];
}

export async function salvarTrilha(trilha: {
  id?: string;
  titulo: string;
  descricao: string;
  status: "ativo" | "inativo";
  /** Arquivo novo para enviar, URL atual para manter, null para remover a capa, undefined para não mexer. */
  capa?: File | string | null;
  etapas: { titulo: string; treinamento_id: string | null }[];
}) {
  const capaUrl = trilha.capa instanceof File ? await uploadArquivo(trilha.capa, "trilhas") : trilha.capa;
  const dados = {
    titulo: trilha.titulo.trim(),
    descricao: trilha.descricao.trim() || null,
    status: trilha.status,
    // Só envia a coluna quando há capa envolvida (funciona mesmo antes da migration da capa).
    ...(capaUrl !== undefined ? { capa_url: capaUrl } : {}),
  };
  let id = trilha.id;
  if (id) check(await supabase.from("trilhas").update(dados).eq("id", id));
  else id = check(await supabase.from("trilhas").insert({ ...dados, cor: "cyan" }).select("id").single()).id as string;
  // As etapas são regravadas inteiras para manter a ordem sequencial (unique trilha_id + ordem).
  check(await supabase.from("trilha_etapas").delete().eq("trilha_id", id));
  if (trilha.etapas.length) {
    check(await supabase.from("trilha_etapas").insert(trilha.etapas.map((e, i) => ({ trilha_id: id, ordem: i + 1, titulo: e.titulo.trim(), treinamento_id: e.treinamento_id }))));
  }
  await logAtividade(`${trilha.id ? "Trilha atualizada" : "Trilha criada"}: ${dados.titulo}`, "trilhas", id);
}

export async function excluirTrilha(id: string) {
  check(await supabase.from("trilhas").delete().eq("id", id));
}

/** Status de cada etapa a partir das matrículas: concluída se o treinamento está 100%. */
export function montarTrilhas(trilhas: TrilhaBanco[], matriculas: Matricula[], resolverCor: (cor: string | null) => string): (LearningPath & { id: string; etapas: TrilhaBanco["etapas"] })[] {
  const concluidos = new Set(matriculas.filter((m) => m.progresso >= 100).map((m) => m.treinamento_id));
  return trilhas.map((t) => {
    let atualDefinido = false;
    const steps = t.etapas.map((e) => {
      const done = e.treinamento_id ? concluidos.has(e.treinamento_id) : false;
      if (done) return { label: e.titulo, status: "done" as const };
      if (!atualDefinido) {
        atualDefinido = true;
        return { label: e.titulo, status: "current" as const };
      }
      return { label: e.titulo, status: "locked" as const };
    });
    const feitas = steps.filter((s) => s.status === "done").length;
    return {
      id: t.id,
      title: t.titulo,
      desc: t.descricao ?? "",
      color: resolverCor(t.cor),
      cover: t.capa_url ?? null,
      modulos: steps.length,
      progress: steps.length ? Math.round((feitas / steps.length) * 100) : 0,
      steps,
      etapas: t.etapas,
    };
  });
}

/* ---------------- Certificados ---------------- */
function mapModelo(row: any): CertificateTemplate {
  return {
    id: row.id,
    treinamentoId: row.treinamento_id,
    name: row.nome,
    courseTitle: row.treinamentos?.titulo ?? "",
    typeLabel: row.tipo_label,
    accentColor: row.cor_destaque,
    minimumScore: Number(row.nota_minima),
    signerName: row.assinante_nome,
    signerRole: row.assinante_cargo,
    programContent: row.conteudo_programatico ?? [],
    sourceFileName: row.arquivo_nome ?? "",
    sourceFileUrl: row.arquivo_url ?? undefined,
    status: row.status,
    createdAt: formatDate(row.created_at) ?? "",
  };
}

export async function fetchModelosCertificado(): Promise<CertificateTemplate[]> {
  const rows = check(await supabase.from("certificado_modelos").select("*, treinamentos(titulo)").order("created_at", { ascending: false }));
  return rows.map(mapModelo);
}

export async function criarModeloCertificado(draft: CertificateTemplateDraft, treinamentoId: string, arquivo?: File | null) {
  const arquivoUrl = arquivo ? await uploadArquivo(arquivo, "certificados") : draft.sourceFileUrl ?? null;
  const row = check(
    await supabase
      .from("certificado_modelos")
      .insert({
        treinamento_id: treinamentoId,
        nome: draft.name.trim(),
        tipo_label: draft.typeLabel.trim().toLocaleUpperCase("pt-BR"),
        cor_destaque: draft.accentColor,
        nota_minima: draft.minimumScore,
        assinante_nome: draft.signerName.trim(),
        assinante_cargo: draft.signerRole.trim(),
        conteudo_programatico: draft.programContent.map((i) => i.trim()).filter(Boolean),
        arquivo_nome: draft.sourceFileName.trim() || null,
        arquivo_url: arquivoUrl,
        status: draft.status,
      })
      .select("id")
      .single(),
  );
  await logAtividade(`Modelo de certificado criado: ${draft.name.trim()}`, "certificado_modelos", row.id);
}

export async function definirStatusModelo(id: string, status: "active" | "draft") {
  check(await supabase.from("certificado_modelos").update({ status }).eq("id", id));
}

export async function excluirModeloCertificado(id: string) {
  check(await supabase.from("certificado_modelos").delete().eq("id", id));
}

/** Treinamentos do usuário com progresso e certificado (tela Certificados). */
export async function fetchMeusCertificados(userId: string): Promise<CertificateTraining[]> {
  const [matriculas, certificados] = await Promise.all([
    supabase
      .from("matriculas")
      .select("treinamento_id, progresso, aproveitamento, treinamentos(titulo, duracao_minutos, categorias(nome))")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase.from("certificados").select("id, treinamento_id, modelo_id, codigo, aproveitamento, emitido_em").eq("user_id", userId),
  ]);
  const certs = new Map(check(certificados).map((c: any) => [c.treinamento_id, c]));
  return check(matriculas).map((m: any) => {
    const cert: any = certs.get(m.treinamento_id);
    return {
      treinamentoId: m.treinamento_id,
      titulo: m.treinamentos?.titulo ?? "",
      categoria: m.treinamentos?.categorias?.nome ?? "",
      cargaHoraria: formatMinutes(m.treinamentos?.duracao_minutos ?? 0),
      progresso: Number(m.progresso),
      aproveitamento: cert ? Number(cert.aproveitamento) : m.aproveitamento === null ? null : Number(m.aproveitamento),
      emitido: Boolean(cert),
      codigo: cert?.codigo ?? null,
      dataEmissao: formatDate(cert?.emitido_em),
      templateId: cert?.modelo_id ?? null,
    };
  });
}

export async function emitirCertificado(treinamentoId: string) {
  check(await supabase.rpc("emitir_certificado", { p_treinamento_id: treinamentoId }));
}

/* ---------------- Admin: treinamentos ---------------- */
export interface TreinamentoConteudoEdicao extends TrainingModule {
  id?: string;
}

/** Carrega módulos e itens de um treinamento no formato do modal de edição. */
export async function fetchTreinamentoParaEdicao(treinamentoId: string): Promise<TreinamentoConteudoEdicao[]> {
  const rows = check(
    await supabase
      .from("modulos")
      .select("id, ordem, titulo, imagem_url, aulas(id, ordem, titulo, tipo, url, conteudo, aula_materiais(id, titulo, arquivo_url, tamanho_bytes, ordem))")
      .eq("treinamento_id", treinamentoId)
      .order("ordem")
      .order("ordem", { referencedTable: "aulas" }),
  );
  const materiaisModulo = await fetchMateriaisDosModulos(rows.map((m: any) => m.id));
  return rows.map((m: any) => ({
    id: m.id,
    titulo: m.titulo,
    imagem: m.imagem_url ?? "",
    materiais: (materiaisModulo[m.id] ?? []).map((mt) => ({ id: mt.id, titulo: mt.titulo, arquivoUrl: mt.arquivo_url, tamanhoBytes: mt.tamanho_bytes })),
    itens: m.aulas.map((a: any) => ({
      id: a.id, tipo: a.tipo, titulo: a.titulo, url: a.url ?? "", texto: a.conteudo ?? "",
      materiais: [...(a.aula_materiais ?? [])].sort((x: any, y: any) => x.ordem - y.ordem).map((mt: any) => ({ id: mt.id, titulo: mt.titulo, arquivoUrl: mt.arquivo_url, tamanhoBytes: mt.tamanho_bytes })),
    })),
  }));
}

const GRADIENTES: [string, string][] = [
  ["#3D6BFF", "#2DD4E8"], ["#9B6BFF", "#3D6BFF"], ["#2DD4E8", "#6E3FD9"],
  ["#3D6BFF", "#9B6BFF"], ["#2DD4E8", "#3D6BFF"], ["#9B6BFF", "#2DD4E8"],
];

/** Remove os materiais retirados, envia os arquivos novos e grava nome e ordem.
 *  Serve para aula_materiais (por aula) e modulo_materiais (por módulo). */
async function sincronizarMateriais(tabela: "aula_materiais" | "modulo_materiais", coluna: "aula_id" | "modulo_id", donoId: string, materiais: TrainingMaterial[]) {
  const consulta = await supabase.from(tabela).select("id").eq(coluna, donoId);
  if (tabela === "modulo_materiais" && tabelaModuloMateriaisAusente(consulta.error)) {
    if (materiais.length) throw new Error("Para salvar materiais do módulo, rode no Supabase a migration 20260929020000_modulo_materiais.sql.");
    return;
  }
  const existentes = check(consulta).map((m: any) => m.id as string);
  const manter = new Set(materiais.map((m) => m.id).filter(Boolean) as string[]);
  const remover = existentes.filter((id) => !manter.has(id));
  if (remover.length) check(await supabase.from(tabela).delete().in("id", remover));

  for (const [ordem, material] of materiais.entries()) {
    const titulo = material.titulo.trim() || material.arquivo?.name || "Material";
    if (material.id) {
      check(await supabase.from(tabela).update({ titulo, ordem }).eq("id", material.id));
    } else if (material.arquivo) {
      const arquivoUrl = await uploadArquivo(material.arquivo, "materiais");
      check(await supabase.from(tabela).insert({ [coluna]: donoId, titulo, arquivo_url: arquivoUrl, tamanho_bytes: material.arquivo.size, ordem }));
    }
  }
}

/** Cria ou atualiza o treinamento e sincroniza módulos/aulas preservando os IDs
 *  existentes (assim o progresso dos alunos não se perde ao editar). */
export async function salvarTreinamento(draft: TrainingDraft, categoriaId: string | null, treinamentoId?: string | null) {
  const minutos = parseDuration(draft.dur);
  if (minutos === null) throw new Error('Duração inválida. Use o formato "2h30" ou "45min".');
  const base = {
    titulo: draft.title.trim(),
    descricao: draft.desc.trim() || null,
    categoria_id: categoriaId,
    nivel: draft.level,
    duracao_minutos: minutos,
  };

  let id = treinamentoId ?? null;
  if (id) {
    check(await supabase.from("treinamentos").update(base).eq("id", id));
  } else {
    const [g1, g2] = GRADIENTES[Math.floor(Math.random() * GRADIENTES.length)];
    const row = check(
      await supabase
        .from("treinamentos")
        .insert({ ...base, slug: `${slugify(draft.title)}-${crypto.randomUUID().slice(0, 6)}`, icone: "BookOpen", gradiente_inicio: g1, gradiente_fim: g2, created_by: await currentUserId() })
        .select("id")
        .single(),
    );
    id = row.id as string;
  }

  const modulos = draft.modulos as TreinamentoConteudoEdicao[];
  const existentes = check(await supabase.from("modulos").select("id").eq("treinamento_id", id)).map((m: any) => m.id);
  const manter = new Set(modulos.map((m) => m.id).filter(Boolean));
  const remover = existentes.filter((mid: string) => !manter.has(mid));
  if (remover.length) check(await supabase.from("modulos").delete().in("id", remover));

  // Move para posições temporárias negativas antes de reordenar,
  // senão o unique (treinamento_id, ordem) quebra no meio da troca.
  let tmp = -1;
  for (const mid of manter) check(await supabase.from("modulos").update({ ordem: tmp-- }).eq("id", mid));

  for (const [index, m] of modulos.entries()) {
    const imagem = m.imagem?.startsWith("data:") ? await uploadArquivo(m.imagem, "modulos", "imagem.png") : m.imagem || null;
    const dados = { treinamento_id: id, ordem: index + 1, titulo: m.titulo.trim(), imagem_url: imagem };
    let moduloId = m.id;
    if (moduloId) check(await supabase.from("modulos").update(dados).eq("id", moduloId));
    else moduloId = check(await supabase.from("modulos").insert(dados).select("id").single()).id as string;
    await sincronizarMateriais("modulo_materiais", "modulo_id", moduloId!, m.materiais ?? []);

    const itens = m.itens as (TrainingModule["itens"][number] & { id?: string })[];
    const aulasExistentes = check(await supabase.from("aulas").select("id").eq("modulo_id", moduloId)).map((a: any) => a.id);
    const manterAulas = new Set(itens.map((i) => i.id).filter(Boolean) as string[]);
    const removerAulas = aulasExistentes.filter((aid: string) => !manterAulas.has(aid));
    if (removerAulas.length) check(await supabase.from("aulas").delete().in("id", removerAulas));
    let tmpAula = -1;
    for (const aid of manterAulas) check(await supabase.from("aulas").update({ ordem: tmpAula-- }).eq("id", aid));

    for (const [i, item] of itens.entries()) {
      const aula = {
        modulo_id: moduloId,
        ordem: i + 1,
        codigo: `${index + 1}.${i + 1}`,
        titulo: item.titulo.trim(),
        tipo: item.tipo,
        url: item.tipo === "texto" ? null : item.url.trim() || null,
        conteudo: item.tipo === "texto" ? item.texto.trim() : null,
      };
      let aulaId = item.id;
      if (aulaId) check(await supabase.from("aulas").update(aula).eq("id", aulaId));
      else aulaId = check(await supabase.from("aulas").insert(aula).select("id").single()).id as string;
      await sincronizarMateriais("aula_materiais", "aula_id", aulaId!, item.materiais ?? []);
    }
  }

  await logAtividade(treinamentoId ? `Treinamento atualizado: ${base.titulo}` : `Novo treinamento criado: ${base.titulo}`, "treinamentos", id);
  return id;
}

export async function excluirTreinamento(id: string, titulo: string) {
  check(await supabase.from("treinamentos").delete().eq("id", id));
  await logAtividade(`Treinamento excluído: ${titulo}`, "treinamentos", id);
}

/* ---------------- Admin: usuários ---------------- */
export async function fetchUsuarios(): Promise<Perfil[]> {
  return check(await supabase.from("profiles").select("*").order("created_at", { ascending: false })) as Perfil[];
}

export async function atualizarUsuario(id: string, patch: Partial<Pick<Perfil, "perfil" | "status">>) {
  check(await supabase.from("profiles").update(patch).eq("id", id));
}

/** Convida o colaborador: cria o usuário no Auth e envia um link de acesso por e-mail.
 *  O profile é criado pelo trigger handle_new_user (que valida o domínio). */
export async function convidarUsuario(nome: string, email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: true,
      data: { nome: nome.trim() },
      emailRedirectTo: `${window.location.origin}/?definir-senha=1`,
    },
  });
  if (error) throw new Error(error.message);
  await logAtividade(`Usuário convidado: ${nome.trim()}`, "profiles");
}

/* ---------------- Admin: dashboard ---------------- */
export async function fetchAdminResumo() {
  const row = check(await supabase.from("vw_admin_resumo").select("*").single());
  return {
    usuarios: Number(row.usuarios),
    treinamentos_ativos: Number(row.treinamentos_ativos),
    concluidos: Number(row.concluidos),
    certificados: Number(row.certificados),
  };
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Últimos 6 meses (inclui meses sem estudo como 0). */
export async function fetchHorasMensais(now = new Date()): Promise<{ mes: string; horas: number }[]> {
  const rows = check(await supabase.from("vw_horas_mensais").select("mes, horas"));
  const porMes = new Map(rows.map((r: any) => [String(r.mes).slice(0, 7), Number(r.horas)]));
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { mes: MESES[d.getMonth()], horas: porMes.get(key) ?? 0 };
  });
}

export async function fetchTopTreinamentos(limite = 4): Promise<{ name: string; acessos: number }[]> {
  return check(await supabase.from("vw_treinamentos_mais_acessados").select("name, acessos").limit(limite));
}
