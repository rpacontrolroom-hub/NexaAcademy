// Acesso ao Google Drive com a conta de serviço (SA). Só roda no servidor.
// Variável: GOOGLE_SERVICE_ACCOUNT_JSON = conteúdo do .json da SA (uma linha, ou em base64).

const ESCOPO = "https://www.googleapis.com/auth/drive.readonly";
const TIPO_GOOGLE = {
  "application/vnd.google-apps.presentation": { pdf: "application/pdf", baixar: "application/vnd.openxmlformats-officedocument.presentationml.presentation", ext: "pptx" },
  "application/vnd.google-apps.document": { pdf: "application/pdf", baixar: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: "docx" },
  "application/vnd.google-apps.spreadsheet": { pdf: "application/pdf", baixar: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ext: "xlsx" },
} as const;

interface ChaveSA { client_email: string; private_key: string }

export class DriveError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

function lerChave(): ChaveSA {
  const bruto = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!bruto) throw new DriveError("GOOGLE_SERVICE_ACCOUNT_JSON não configurada no servidor.", 503);
  try {
    const json = bruto.startsWith("{") ? bruto : atob(bruto);
    const chave = JSON.parse(json) as ChaveSA;
    if (!chave.client_email || !chave.private_key) throw new Error();
    return chave;
  } catch {
    throw new DriveError("GOOGLE_SERVICE_ACCOUNT_JSON inválida.", 503);
  }
}

const b64url = (dados: ArrayBuffer | string) => {
  const bytes = typeof dados === "string" ? new TextEncoder().encode(dados) : new Uint8Array(dados);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

let tokenCache: { valor: string; expira: number } | null = null;

async function tokenDeAcesso(): Promise<string> {
  if (tokenCache && tokenCache.expira > Date.now() + 60_000) return tokenCache.valor;
  const chave = lerChave();
  const agora = Math.floor(Date.now() / 1000);
  const corpo = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({
    iss: chave.client_email, scope: ESCOPO, aud: "https://oauth2.googleapis.com/token", iat: agora, exp: agora + 3600,
  }))}`;
  const pem = chave.private_key.replace(/-----[^-]+-----|\s/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const privada = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const assinatura = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privada, new TextEncoder().encode(corpo));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${corpo}.${b64url(assinatura)}` }),
  });
  if (!res.ok) throw new DriveError("A conta de serviço não conseguiu autenticar no Google.", 502);
  const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { valor: access_token, expira: Date.now() + expires_in * 1000 };
  return access_token;
}

async function drive(caminho: string, params: Record<string, string>) {
  const url = new URL(`https://www.googleapis.com/drive/v3/${caminho}`);
  for (const [k, v] of Object.entries({ supportsAllDrives: "true", ...params })) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { authorization: `Bearer ${await tokenDeAcesso()}` } });
  if (res.status === 404 || res.status === 403) throw new DriveError("Arquivo não encontrado ou sem acesso para a conta de serviço.", 404);
  if (!res.ok) throw new DriveError("Falha ao ler o arquivo no Google Drive.", 502);
  return res;
}

export interface ArquivoDrive { corpo: ReadableStream<Uint8Array> | null; tipo: string; nome: string }

/** `ver`: Slides/Docs/Planilhas viram PDF (exibível na página). `baixar`: formato Office.
 *  Arquivos enviados ao Drive (pdf, pptx...) vêm como estão; só PDF/imagem dá para exibir. */
export async function lerArquivo(id: string, modo: "ver" | "baixar"): Promise<ArquivoDrive> {
  const meta = await (await drive(`files/${id}`, { fields: "name,mimeType" })).json() as { name: string; mimeType: string };
  const google = TIPO_GOOGLE[meta.mimeType as keyof typeof TIPO_GOOGLE];

  if (google) {
    const tipo = modo === "ver" ? google.pdf : google.baixar;
    const res = await drive(`files/${id}/export`, { mimeType: tipo });
    const nome = modo === "ver" ? `${meta.name}.pdf` : `${meta.name}.${google.ext}`;
    return { corpo: res.body, tipo, nome };
  }
  if (meta.mimeType === "application/vnd.google-apps.folder") throw new DriveError("Pastas não podem ser abertas por aqui.", 415);
  if (modo === "ver" && meta.mimeType !== "application/pdf" && !meta.mimeType.startsWith("image/")) {
    throw new DriveError("Este arquivo só pode ser baixado, não exibido na página.", 415);
  }
  const res = await drive(`files/${id}`, { alt: "media" });
  return { corpo: res.body, tipo: meta.mimeType, nome: meta.name };
}
