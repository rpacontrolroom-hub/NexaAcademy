/** 200 -> "3h20", 45 -> "45min", 120 -> "2h" */
export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(total || 0));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** "3h20" | "3h" | "45min" | "45" | "1:30" -> minutos. null se inválido. */
export function parseDuration(value: string): number | null {
  const text = value.trim().toLowerCase().replace(/\s+/g, "");
  if (!text) return null;
  let match = text.match(/^(\d+)h(?:(\d{1,2})(?:min|m)?)?$/);
  if (match) return Number(match[1]) * 60 + Number(match[2] ?? 0);
  match = text.match(/^(\d+)(?:min|m)?$/);
  if (match) return Number(match[1]);
  match = text.match(/^(\d+):(\d{2})$/);
  if (match) return Number(match[1]) * 60 + Number(match[2]);
  return null;
}

/** Máscara do campo de carga horária: só dígitos, no formato HH:MM (ex.: 02:30).
 *  `anterior` permite apagar os dois pontos com Backspace. */
export function mascaraHoras(valor: string, anterior = ""): string {
  const d = valor.replace(/\D/g, "").slice(0, 4);
  if (d.length < 2) return d;
  if (d.length === 2) return valor.length < anterior.length ? d : `${d}:`;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** HH:MM completo, com minutos de 00 a 59 e pelo menos 1 minuto no total. */
export function horasValidas(valor: string): boolean {
  return /^\d{2,3}:[0-5]\d$/.test(valor.trim()) && !/^0+:00$/.test(valor.trim());
}

/** 150 -> "02:30" */
export function minutosParaHoras(total: number): string {
  const minutos = Math.max(0, Math.round(total || 0));
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

/** 2205 -> "36:45", 3900 -> "1:05:00" */
export function formatSeconds(total: number): string {
  const seconds = Math.max(0, Math.round(total || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "36:45" | "1:05:00" -> segundos. null se inválido. */
export function parseClock(value: string): number | null {
  const parts = value.trim().split(":");
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  return parts.reduce((acc, part) => acc * 60 + Number(part), 0);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Link que baixa direto: arquivo do Drive, ou Slides/Docs/Planilhas exportados (pptx/docx/xlsx).
 *  `null` quando não há download direto (pasta, site comum...). */
export function downloadDireto(url: string | null | undefined): string | null {
  if (!url || !linkValido(url)) return null;
  const u = new URL(url.trim());
  const host = u.hostname.replace(/^www\./, "");
  if (host === "drive.google.com") {
    const id = u.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] ?? ((u.pathname === "/open" || u.pathname === "/uc") ? u.searchParams.get("id") : null);
    return id ? `https://drive.google.com/uc?export=download&id=${id}` : null;
  }
  if (host === "docs.google.com") {
    const m = u.pathname.match(/^\/(presentation|document|spreadsheets)\/d\/([\w-]+)/);
    if (m) return `https://docs.google.com/${m[1]}/d/${m[2]}/export/${{ presentation: "pptx", document: "docx", spreadsheets: "xlsx" }[m[1]]}`;
  }
  return null;
}

/** Só aceita links http(s) completos (evita javascript: e texto solto). */
export function linkValido(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Link de visualização embutida para PDF, Google Drive, Slides, Docs e Planilhas.
 *  `null` quando o link não tem como ser exibido dentro da página. */
export function embedDocumento(url: string | null | undefined): { src: string; tipo: "slides" | "pagina" } | null {
  if (!url || !linkValido(url)) return null;
  const u = new URL(url.trim());
  const host = u.hostname.replace(/^www\./, "");
  const id = (re: RegExp) => u.pathname.match(re)?.[1];

  if (host === "docs.google.com") {
    const slides = id(/^\/presentation\/d\/([\w-]+)/);
    if (slides) return { src: `https://docs.google.com/presentation/d/${slides}/embed?start=false&loop=false`, tipo: "slides" };
    const doc = u.pathname.match(/^\/(document|spreadsheets)\/d\/([\w-]+)/);
    if (doc) return { src: `https://docs.google.com/${doc[1]}/d/${doc[2]}/preview`, tipo: "pagina" };
  }
  if (host === "drive.google.com") {
    const pasta = id(/^\/drive\/(?:u\/\d+\/)?folders\/([\w-]+)/);
    if (pasta) return { src: `https://drive.google.com/embeddedfolderview?id=${pasta}#list`, tipo: "pagina" };
    const arquivo = id(/^\/file\/d\/([\w-]+)/) ?? ((u.pathname === "/open" || u.pathname === "/uc") ? u.searchParams.get("id") : null);
    if (arquivo) return { src: `https://drive.google.com/file/d/${arquivo}/preview`, tipo: "pagina" };
  }
  // PDF em qualquer endereço: o navegador mostra no próprio iframe (se o site permitir).
  if (u.pathname.toLowerCase().endsWith(".pdf")) return { src: u.toString(), tipo: "pagina" };
  return null;
}

export function formatDate(iso: string | null | undefined): string | null {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : null;
}

/** ISO -> "há 12 min", "há 3 dias" */
export function timeAgo(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "nunca";
  const diff = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Extrai o ID de um link do YouTube (watch, youtu.be, embed, shorts). */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}
