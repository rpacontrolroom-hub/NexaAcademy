import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { CORPORATE_EMAIL_DOMAIN, isValidCorporateEmail } from "@/services/user-service";

const css = `
  html, body { min-height: 100%; margin: 0; background: #f5f5f4; }
  .login-root, .login-root * { box-sizing: border-box; }
  .login-root {
    min-height: 100vh; min-height: 100dvh; padding: 12px; color: #101010;
    font-family: Inter, Arial, sans-serif; background: #f5f5f4;
  }
  .login-shell {
    width: 100%; min-height: calc(100vh - 24px); min-height: calc(100dvh - 24px); display: grid;
    grid-template-columns: 48% 52%; overflow: hidden; background: #fff;
    border: 1px solid #dedede; border-radius: 14px;
    box-shadow: 0 2px 12px rgba(0,0,0,.04);
  }
  .login-left {
    padding: 62px 66px 54px; border-right: 1px solid #e4e4e4;
    display: flex; flex-direction: column; justify-content: flex-start;
  }
  .login-brand { display:flex; align-items:center; gap:15px; margin-bottom:58px; }
  .login-brand img { width:62px; height:62px; display:block; object-fit:cover; border-radius:12px; }
  .login-brand-name { font-size:25px; font-weight:800; letter-spacing:.28em; line-height:1; }
  .login-brand-academy { margin-top:10px; font-size:14px; font-weight:700; letter-spacing:.34em; }
  .login-brand-by { margin-top:9px; font-size:13px; color:#333; }
  .login-intro { max-width: 540px; }
  .login-intro h1 { margin: 0 0 16px; font-size: clamp(30px, 2.6vw, 42px); line-height: 1.15; letter-spacing: -.035em; }
  .login-intro > p { margin: 0; color: #555; font-size: 18px; line-height: 1.55; max-width: 455px; }
  .login-right { min-width: 0; padding: 40px 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .login-card {
    width: min(100%, 680px); padding: 76px 52px; border: 1px solid #dedede;
    border-radius: 14px; background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,.035);
  }
  .login-card h2 { margin: 0 0 12px; font-size: clamp(28px, 3vw, 34px); line-height: 1.15; letter-spacing: -.025em; }
  .login-sub { margin: 0 0 58px; color: #555; font-size: 16px; }
  .login-field { margin-bottom: 40px; }
  .login-label { display: block; margin-bottom: 10px; font-size: 16px; }
  .login-input-wrap { height: 62px; display: flex; align-items: center; border: 1px solid #d5d5d5; border-radius: 9px; transition: .15s; }
  .login-input-wrap:focus-within { border-color: #777; box-shadow: 0 0 0 3px rgba(0,0,0,.06); }
  .login-input-wrap svg.leading { flex: 0 0 auto; margin-left: 19px; color: #555; }
  .login-input { min-width: 0; width: 100%; height: 100%; padding: 0 18px; border: 0; outline: 0; background: transparent; color: #111; font: inherit; font-size: 17px; }
  .login-eye { flex: 0 0 auto; min-width: 54px; height: 100%; padding: 12px 16px; border: 0; background: transparent; color: #555; cursor: pointer; display: grid; place-items: center; }
  .login-submit { width: 100%; height: 62px; border: 0; border-radius: 8px; background: #111; color: #fff; font-size: 17px; font-weight: 650; cursor: pointer; }
  .login-submit:hover { background: #282828; }
  .login-support { margin: 58px 0 0; color: #666; font-size: 14px; text-align: center; }

  @media (max-width: 1000px) {
    .login-shell { grid-template-columns: 1fr; }
    .login-left { padding: 40px; border-right: 0; border-bottom: 1px solid #e4e4e4; }
    .login-brand { margin-bottom: 34px; }
    .login-right { padding: 40px 24px; }
    .login-card { padding: 48px 38px; }
  }
  @media (max-width: 620px) {
    .login-root { padding: 0; }
    .login-shell { min-height: 100vh; min-height: 100dvh; border: 0; border-radius: 0; }
    .login-left { padding: 26px 22px 22px; }
    .login-intro h1 { font-size: 29px; }
    .login-intro > p { font-size: 15px; }
    .login-brand { gap: 12px; margin-bottom: 24px; }
    .login-brand img { width:50px; height:50px; }
    .login-brand-name { font-size:21px; }
    .login-brand-academy { margin-top: 8px; font-size: 12px; }
    .login-brand-by { margin-top: 7px; font-size: 12px; }
    .login-right { padding: 24px 16px 34px; justify-content: flex-start; }
    .login-card { width: 100%; padding: 30px 20px; border-radius: 12px; }
    .login-card h2 { font-size: 26px; }
    .login-sub { margin-bottom: 30px; font-size: 15px; line-height: 1.45; }
    .login-field { margin-bottom: 24px; }
    .login-label { font-size: 15px; }
    .login-input-wrap { height: 56px; }
    .login-input-wrap svg.leading { margin-left: 15px; }
    .login-input { padding: 0 14px; font-size: 16px; }
    .login-submit { height: 56px; font-size: 16px; }
    .login-support { margin-top: 28px; padding: 0 8px; line-height: 1.45; }
  }
  @media (max-width: 380px) {
    .login-left { padding: 22px 18px 18px; }
    .login-intro h1 { font-size: 25px; margin-bottom: 10px; }
    .login-intro > p { font-size: 14px; }
    .login-brand { margin-bottom: 18px; }
    .login-brand img { width:44px; height:44px; border-radius: 10px; }
    .login-brand-name { font-size:18px; letter-spacing:.24em; }
    .login-brand-academy { font-size: 11px; letter-spacing:.28em; }
    .login-right { padding: 18px 12px 26px; }
    .login-card { padding: 24px 16px; }
    .login-card h2 { font-size: 23px; }
    .login-sub { margin-bottom: 24px; }
    .login-field { margin-bottom: 20px; }
    .login-eye { min-width: 48px; padding-inline: 12px; }
  }
  @media (max-height: 720px) and (min-width: 621px) {
    .login-left { padding-top: 38px; padding-bottom: 38px; }
    .login-brand { margin-bottom: 34px; }
    .login-card { padding-top: 48px; padding-bottom: 48px; }
    .login-sub { margin-bottom: 34px; }
    .login-field { margin-bottom: 26px; }
    .login-support { margin-top: 34px; }
  }
`;


const extraCss = `
  .login-links { display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-top:18px; font-size:14px; }
  .login-link { padding:0; border:0; background:none; color:#333; text-decoration:underline; cursor:pointer; font:inherit; }
  .login-link:hover { color:#000; }
  .login-msg { margin:-18px 0 24px; padding:12px 14px; border-radius:8px; font-size:14px; line-height:1.45; }
  .login-msg.error { color:#9b1c2c; background:#fdecee; border:1px solid #f5c2c9; }
  .login-msg.ok { color:#1f5b35; background:#e9f6ee; border:1px solid #bfe3cc; }
  .login-submit:disabled { opacity:.6; cursor:wait; }
`;

type Modo = "login" | "cadastro" | "esqueci" | "definir-senha";

const TITULOS: Record<Modo, [string, string]> = {
  login: ["Entrar na sua conta", "Use suas credenciais para acessar a plataforma"],
  cadastro: ["Criar conta", `Primeiro acesso? Cadastre-se com seu e-mail ${CORPORATE_EMAIL_DOMAIN}`],
  esqueci: ["Recuperar senha", "Enviaremos um link para você definir uma nova senha"],
  "definir-senha": ["Definir senha", "Escolha a senha que você vai usar para entrar na plataforma"],
};

const TEXTO_BOTAO: Record<Modo, string> = {
  login: "Entrar",
  cadastro: "Criar conta",
  esqueci: "Enviar link",
  "definir-senha": "Salvar senha",
};

function traduzirErro(message: string): string {
  if (/invalid login credentials/i.test(message)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(message)) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (/already registered|already been registered/i.test(message)) return "Este e-mail já está cadastrado. Use \"Esqueci minha senha\" se não lembrar a senha.";
  if (/database error saving new user|somente e-mails/i.test(message)) return `Somente e-mails ${CORPORATE_EMAIL_DOMAIN} podem ser cadastrados.`;
  if (/rate limit|too many/i.test(message)) return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  if (/password should be at least/i.test(message)) return "A senha precisa ter no mínimo 8 caracteres.";
  return message;
}

export default function Login() {
  const navigate = useNavigate();
  const { session, event, loading } = useAuth();
  const [modo, setModo] = useState<Modo>("login");
  const [nome, setNome] = useState("");
  // Login fixo de desenvolvimento: só em `bun run dev` e só se definido no .env (fora do Git).
  const devEmail = import.meta.env.DEV ? (import.meta.env.VITE_DEV_LOGIN_EMAIL ?? "") : "";
  const devPassword = import.meta.env.DEV ? (import.meta.env.VITE_DEV_LOGIN_PASSWORD ?? "") : "";
  const [email, setEmail] = useState(devEmail);
  const [password, setPassword] = useState(devPassword);
  const [confirmacao, setConfirmacao] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Links de convite/recuperação voltam para "/?definir-senha=1" já com a sessão.
  useEffect(() => {
    if (loading) return;
    const querDefinirSenha = new URLSearchParams(window.location.search).has("definir-senha");
    if (event === "PASSWORD_RECOVERY" || (querDefinirSenha && session)) {
      setModo("definir-senha");
      return;
    }
    if (session && modo !== "definir-senha") navigate({ to: "/academy" });
  }, [loading, session, event, modo, navigate]);

  function trocarModo(novo: Modo) {
    setModo(novo);
    setErro(null);
    setAviso(null);
    setPassword(novo === "login" ? devPassword : "");
    setConfirmacao("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);

    const defineSenha = modo === "cadastro" || modo === "definir-senha";
    if (defineSenha && password.length < 8) return setErro("A senha precisa ter no mínimo 8 caracteres.");
    if (defineSenha && password !== confirmacao) return setErro("As senhas não coincidem.");
    if (modo === "cadastro" && nome.trim().length < 2) return setErro("Informe seu nome completo.");
    if (modo === "cadastro" && !isValidCorporateEmail(email)) return setErro(`Use seu e-mail corporativo ${CORPORATE_EMAIL_DOMAIN}.`);

    setEnviando(true);
    try {
      const emailNormalizado = email.trim().toLowerCase();
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: emailNormalizado, password });
        if (error) throw error;
        navigate({ to: "/academy" });
      } else if (modo === "cadastro") {
        const { data, error } = await supabase.auth.signUp({
          email: emailNormalizado,
          password,
          options: { data: { nome: nome.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/academy" });
        else {
          trocarModo("login");
          setAviso("Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre com sua senha.");
        }
      } else if (modo === "esqueci") {
        const { error } = await supabase.auth.resetPasswordForEmail(emailNormalizado, { redirectTo: `${window.location.origin}/?definir-senha=1` });
        if (error) throw error;
        setAviso("Se o e-mail estiver cadastrado, você receberá um link para definir uma nova senha.");
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        window.history.replaceState(null, "", "/");
        navigate({ to: "/academy" });
      }
    } catch (err) {
      setErro(traduzirErro(err instanceof Error ? err.message : String(err)));
    } finally {
      setEnviando(false);
    }
  }

  const [titulo, subtitulo] = TITULOS[modo];

  return (
    <>
      <style>{css}</style>
      <style>{extraCss}</style>
      <div className="login-root">
        <div className="login-shell">
          <aside className="login-left">
            <div className="login-brand" aria-label="Nexa Academy by Hering">
              <img src="/nexa-ai-logo.png?v=20260716" alt="Logo Nexa Academy" />
              <div>
                <div className="login-brand-name">NEXA</div>
                <div className="login-brand-academy">ACADEMY</div>
                <div className="login-brand-by">by Hering</div>
              </div>
            </div>
            <div className="login-intro">
              <h1>Bem-vindo</h1>
              <p>Acesse sua conta e continue aprendendo com a Nexa Academy.</p>
            </div>
          </aside>

          <main className="login-right">
            <div className="login-card">
              <h2>{titulo}</h2>
              <p className="login-sub">{subtitulo}</p>
              {erro && <div className="login-msg error" role="alert">{erro}</div>}
              {aviso && <div className="login-msg ok" role="status">{aviso}</div>}
              <form onSubmit={handleSubmit}>
                {modo === "cadastro" && (
                  <div className="login-field">
                    <label className="login-label" htmlFor="nome">Nome completo</label>
                    <div className="login-input-wrap">
                      <User size={22} className="leading" />
                      <input id="nome" className="login-input" required value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
                    </div>
                  </div>
                )}
                {modo !== "definir-senha" && (
                  <div className="login-field">
                    <label className="login-label" htmlFor="email">E-mail</label>
                    <div className="login-input-wrap">
                      <Mail size={22} className="leading" />
                      <input id="email" type="email" className="login-input" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder={`nome${CORPORATE_EMAIL_DOMAIN}`} />
                    </div>
                  </div>
                )}
                {modo !== "esqueci" && (
                  <div className="login-field">
                    <label className="login-label" htmlFor="password">{modo === "login" ? "Senha" : "Nova senha"}</label>
                    <div className="login-input-wrap">
                      <Lock size={22} className="leading" />
                      <input id="password" className="login-input" type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={modo === "login" ? "current-password" : "new-password"} />
                      <button type="button" className="login-eye" onClick={() => setShowPw((value) => !value)} aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}>
                        {showPw ? <EyeOff size={22} /> : <Eye size={22} />}
                      </button>
                    </div>
                  </div>
                )}
                {(modo === "cadastro" || modo === "definir-senha") && (
                  <div className="login-field">
                    <label className="login-label" htmlFor="confirmacao">Confirmar senha</label>
                    <div className="login-input-wrap">
                      <Lock size={22} className="leading" />
                      <input id="confirmacao" className="login-input" type={showPw ? "text" : "password"} required value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="new-password" />
                    </div>
                  </div>
                )}
                <button type="submit" className="login-submit" disabled={enviando}>{enviando ? "Aguarde..." : TEXTO_BOTAO[modo]}</button>
              </form>
              {modo !== "definir-senha" && (
                <div className="login-links">
                  {modo === "login" ? (
                    <>
                      <button type="button" className="login-link" onClick={() => trocarModo("cadastro")}>Primeiro acesso? Criar conta</button>
                      <button type="button" className="login-link" onClick={() => trocarModo("esqueci")}>Esqueci minha senha</button>
                    </>
                  ) : (
                    <button type="button" className="login-link" onClick={() => trocarModo("login")}>Voltar para o login</button>
                  )}
                </div>
              )}
            </div>
            <p className="login-support">Precisa de ajuda? Fale com seu líder técnico</p>
          </main>
        </div>
      </div>
    </>
  );
}
