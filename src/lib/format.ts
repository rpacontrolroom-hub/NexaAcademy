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
