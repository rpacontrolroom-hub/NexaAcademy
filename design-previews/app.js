// Mockup estático: mesmo conteúdo, quatro direções visuais (CSS diferente em cada versao).
const A = "assets/";
const ico = {
  home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  grad: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  doc: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/>',
};
const I = (n) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ico[n]}</svg>`;

const cursos = [
  { t: "Automação com Power Automate", c: "Automação", n: "Básico", d: "02:30", img: "cardume.jpg", p: 60 },
  { t: "Boas práticas de processos", c: "Processos", n: "Intermediário", d: "01:45", img: "equipe.jpg", p: 0 },
  { t: "Agentic AI na prática", c: "Inteligência Artificial", n: "Avançado", d: "03:10", img: "peixes.jpg", p: 25 },
  { t: "Cultura e valores Hering", c: "Cultura", n: "Básico", d: "00:50", img: "mulheres.jpg", p: 100 },
  { t: "Fundamentos de RPA", c: "Automação", n: "Básico", d: "04:00", img: "linhas.jpg", p: 0 },
  { t: "Atendimento que encanta", c: "Cultura", n: "Intermediário", d: "01:20", img: "sorriso.jpg", p: 0 },
];

const card = (c) => `
  <article class="curso">
    <div class="capa" style="background-image:url(${A}${c.img})"><span class="nivel">${c.n}</span>${c.p === 100 ? `<span class="ok">${I("check")}</span>` : ""}</div>
    <div class="corpo">
      <small class="cat">${c.c}</small>
      <h3>${c.t}</h3>
      <div class="meta">${I("clock")} ${c.d}h</div>
      ${c.p ? `<div class="barra"><i style="width:${c.p}%"></i></div><small class="pct">${c.p}% concluído</small>` : `<div class="barra vazia"></div><small class="pct">Não iniciado</small>`}
    </div>
  </article>`;

const telas = {
  login: () => `
  <div class="login">
    <section class="login-arte">
      <img class="marca-branca" src="${A}hering-branco.png" alt="Hering">
      <div class="login-frase">
        <small>Nexa cardume</small>
        <h1>Juntos, somos <em>um cardume.</em></h1>
        <p>Aprenda no seu ritmo, avance com o time e conquiste seus certificados.</p>
      </div>
      <img class="peixinhos" src="${A}cardume-linhas.png" alt="">
    </section>
    <section class="login-form">
      <form onsubmit="return false">
        <img class="x" src="${A}x-azul.png" alt="">
        <h2>Entrar no Nexa <em>cardume</em></h2>
        <p>Acesse sua conta e continue aprendendo.</p>
        <label>E-mail<input placeholder="nome@ciahering.com.br"></label>
        <label>Senha<input type="password" placeholder="••••••••"></label>
        <button class="btn">Entrar</button>
        <a href="#">Esqueci minha senha</a>
      </form>
    </section>
  </div>`,

  inicio: () => `
  <div class="pagina">
    <header class="saudacao"><small>Quarta-feira, 29 de outubro</small><h1>Olá, <em>Lucas</em>.<br>Que bom ter você no cardume.</h1></header>
    <section class="hero">
      <div class="hero-img" style="background-image:url(${A}cardume.jpg)"></div>
      <div class="hero-txt">
        <small>Continue de onde parou</small>
        <h2>Automação com Power Automate</h2>
        <p>Módulo 3 · Fluxos condicionais</p>
        <div class="barra"><i style="width:60%"></i></div>
        <button class="btn">${I("play")} Continuar aula</button>
      </div>
    </section>
    <section class="stats">
      <div><b>12</b><span>treinamentos</span></div><div><b>38h</b><span>de estudo</span></div><div><b>5</b><span>certificados</span></div><div><b>82%</b><span>aproveitamento</span></div>
    </section>
    <section>
      <div class="sec-tit"><h2>Treinamentos em <em>destaque</em></h2><a href="#treinamentos">Ver todos</a></div>
      <div class="grade">${cursos.slice(0, 3).map(card).join("")}</div>
    </section>
    <section class="trilha">
      <div class="sec-tit"><h2>Sua <em>trilha</em></h2></div>
      <ol>${["Cultura Hering", "Fundamentos de RPA", "Power Automate", "Agentic AI"].map((s, i) => `<li class="${i < 2 ? "feito" : i === 2 ? "atual" : ""}"><span>${i < 2 ? I("check") : i + 1}</span>${s}</li>`).join("")}</ol>
    </section>
  </div>`,

  treinamentos: () => `
  <div class="pagina">
    <header class="saudacao"><small>Catálogo</small><h1>Todos os <em>treinamentos</em></h1></header>
    <div class="filtros">${["Todos", "Automação", "Processos", "Inteligência Artificial", "Cultura", "Favoritos"].map((f, i) => `<button class="${i ? "" : "on"}">${f}</button>`).join("")}</div>
    <div class="grade">${cursos.map(card).join("")}</div>
  </div>`,

  aula: () => `
  <div class="pagina aula">
    <header class="saudacao"><small>Automação com Power Automate · Módulo 3</small><h1>Fluxos <em>condicionais</em></h1></header>
    <div class="aula-grid">
      <div>
        <div class="player" style="background-image:url(${A}peixes.jpg)"><button class="play">${I("play")}</button></div>
        <div class="aula-acoes"><button class="btn">Concluir aula</button><button class="btn sec">Próxima aula</button></div>
        <h3>Sobre esta aula</h3>
        <p>Aprenda a criar fluxos que tomam decisões, usando condições e ramificações para automatizar processos do dia a dia.</p>
      </div>
      <aside class="lateral">
        <h3>Conteúdo</h3>
        <ul class="mods">
          <li class="feito">${I("check")} 1. Introdução</li><li class="feito">${I("check")} 2. Primeiro fluxo</li>
          <li class="atual">${I("play")} 3. Fluxos condicionais</li><li>4. Tratamento de erros</li><li>5. Avaliação final</li>
        </ul>
        <h3>Materiais</h3>
        <ul class="mats"><li>${I("doc")} Slides do módulo</li><li>${I("doc")} Planilha de exercícios</li></ul>
      </aside>
    </div>
  </div>`,
};

const nav = [["inicio", "Início", "home"], ["treinamentos", "Treinamentos", "grad"], ["trilhas", "Trilhas", "map"], ["certificados", "Certificados", "award"]];
const nomes = { login: "Login", inicio: "Início", treinamentos: "Treinamentos", aula: "Aula" };

function render() {
  const tela = (location.hash.slice(1) || "inicio");
  const t = telas[tela] ? tela : "inicio";
  const root = document.getElementById("root");
  const impressao = location.search.includes("print");
  const alternador = impressao ? "" : `<nav class="alternador">${Object.keys(nomes).map((k) => `<a href="#${k}" class="${k === t ? "on" : ""}">${nomes[k]}</a>`).join("")}<a href="index.html">← versões</a></nav>`;
  if (t === "login") { root.innerHTML = telas.login() + alternador; return; }
  root.innerHTML = `
  <div class="app">
    <aside class="lado">
      <a class="logo" href="#inicio"><img class="x-logo" src="${A}x-branco.png" alt=""><span>Nexa <em>cardume</em></span></a>
      <nav>${nav.map(([k, l, i]) => `<a href="#${k === "inicio" ? "inicio" : k === "treinamentos" ? "treinamentos" : "inicio"}" class="${(t === "aula" ? "treinamentos" : t) === k ? "on" : ""}">${I(i)}<span>${l}</span></a>`).join("")}</nav>
      <img class="lado-peixes" src="${A}cardume-linhas.png" alt="">
      <div class="by"><small>uma iniciativa</small><span class="hering-logo" role="img" aria-label="Hering"></span></div>
    </aside>
    <main>
      <header class="topo"><div class="busca">${I("search")}<span>Pesquisar treinamentos...</span></div><div class="usuario"><span>Lucas Passos</span><i>LP</i></div></header>
      ${telas[t]()}
    </main>
  </div>${alternador}`;
  window.scrollTo(0, 0);
  if (impressao) {
    const p = document.querySelector(".pagina");
    document.body.dataset.h = Math.ceil(p ? p.getBoundingClientRect().bottom + scrollY : 900);
  }
}
addEventListener("hashchange", render);
render();
