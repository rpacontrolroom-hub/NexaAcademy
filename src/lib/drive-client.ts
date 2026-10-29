import { supabase } from "@/lib/supabase";

/** Busca o arquivo no servidor (que usa a conta de serviço do Google) com o login do aluno.
 *  Devolve um blob; lança erro se o servidor não conseguir (aí o chamador usa o link do Drive). */
export async function buscarArquivoDrive(id: string, modo: "ver" | "baixar"): Promise<{ blob: Blob; nome: string }> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`/api/drive/${id}?modo=${modo}`, { headers: { authorization: `Bearer ${data.session?.access_token ?? ""}` } });
  if (!res.ok) throw new Error(await res.text());
  const nome = decodeURIComponent(res.headers.get("content-disposition")?.match(/filename\*=UTF-8''(.+)$/)?.[1] ?? "arquivo");
  return { blob: await res.blob(), nome };
}

export async function baixarArquivoDrive(id: string) {
  const { blob, nome } = await buscarArquivoDrive(id, "baixar");
  const href = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href, download: nome });
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}
