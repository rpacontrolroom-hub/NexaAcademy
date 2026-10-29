import { createFileRoute } from "@tanstack/react-router";
import { DriveError, lerArquivo } from "@/lib/drive.server";

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL) as string;
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

/** Consulta ao Supabase com o token do próprio aluno: vale o RLS dele. */
const supabaseGet = (caminho: string, token: string) =>
  fetch(`${SUPABASE_URL}${caminho}`, { headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${token}` } });

/** Só entrega arquivos que estejam cadastrados numa aula ou material (senão a SA viraria
 *  um atalho para qualquer arquivo do drive). */
async function arquivoCadastrado(id: string, token: string): Promise<boolean> {
  const consultas = [
    "/rest/v1/aulas?select=id&url=like.*" + id + "*&limit=1",
    "/rest/v1/aula_materiais?select=id&arquivo_url=like.*" + id + "*&limit=1",
    "/rest/v1/modulo_materiais?select=id&arquivo_url=like.*" + id + "*&limit=1",
  ];
  for (const q of consultas) {
    const res = await supabaseGet(q, token);
    if (res.ok && ((await res.json()) as unknown[]).length > 0) return true;
  }
  return false;
}

const erro = (mensagem: string, status: number) => new Response(mensagem, { status, headers: { "content-type": "text/plain; charset=utf-8" } });

export const Route = createFileRoute("/api/drive/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return erro("Faça login para ver o arquivo.", 401);
        if (!/^[\w-]{10,}$/.test(params.id)) return erro("Arquivo inválido.", 400);

        const modo = new URL(request.url).searchParams.get("modo") === "baixar" ? "baixar" : "ver";
        try {
          const usuario = await supabaseGet("/auth/v1/user", token);
          if (!usuario.ok) return erro("Sessão inválida. Entre novamente.", 401);
          if (!(await arquivoCadastrado(params.id, token))) return erro("Arquivo não encontrado.", 404);

          const arquivo = await lerArquivo(params.id, modo);
          return new Response(arquivo.corpo, {
            headers: {
              "content-type": arquivo.tipo,
              "content-disposition": `${modo === "baixar" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(arquivo.nome)}`,
              "cache-control": "private, max-age=300",
            },
          });
        } catch (e) {
          if (e instanceof DriveError) return erro(e.message, e.status);
          console.error(e);
          return erro("Erro ao abrir o arquivo.", 500);
        }
      },
    },
  },
});
