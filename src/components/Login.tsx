import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

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

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("123");
  const [showPw, setShowPw] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/academy" });
  }

  return (
    <>
      <style>{css}</style>
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
              <h2>Entrar na sua conta</h2>
              <p className="login-sub">Use suas credenciais para acessar a plataforma</p>
              <form onSubmit={handleSubmit}>
                <div className="login-field">
                  <label className="login-label" htmlFor="email">E-mail</label>
                  <div className="login-input-wrap">
                    <Mail size={22} className="leading" />
                    <input id="email" className="login-input" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
                  </div>
                </div>
                <div className="login-field">
                  <label className="login-label" htmlFor="password">Senha</label>
                  <div className="login-input-wrap">
                    <Lock size={22} className="leading" />
                    <input id="password" className="login-input" type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                    <button type="button" className="login-eye" onClick={() => setShowPw((value) => !value)} aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}>
                      {showPw ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="login-submit">Entrar</button>
              </form>
            </div>
            <p className="login-support">Precisa de ajuda? Fale com seu líder técnico</p>
          </main>
        </div>
      </div>
    </>
  );
}
