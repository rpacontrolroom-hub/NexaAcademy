// Legacy JSX markup is intentionally retained verbatim while domain rules are typed in MVC services.
// @ts-nocheck
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { timeAgo, initials } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import {
  keys, usePerfil, useCategorias, useTreinamentos, useMatriculas, useFavoritos, useTrilhas,
  useMeuResumo, useMeusCertificados, useModelosCertificado, useUsuarios, useAdminResumo,
  useHorasMensais, useTopTreinamentos,
} from "@/hooks/use-academy";
import * as repo from "@/data/academy-repository";
import { academyController } from "@/controllers/academy-controller";
import { CORPORATE_EMAIL_DOMAIN } from "@/services/user-service";
import { MINIMUM_CERTIFICATE_SCORE } from "@/services/certificate-service";
import { theme as palette } from "@/styles/theme";
import CourseDetailView from "@/views/academy/components/CourseDetailView";
import LessonDetailView from "@/views/academy/components/LessonDetailView";
import LessonMaterialsEditor from "@/views/academy/components/LessonMaterialsEditor";
import NotificationBell from "@/views/academy/components/NotificationBell";
import AdminCertificatesView from "@/views/academy/components/AdminCertificatesView";
import AdminTrilhasView from "@/views/academy/components/AdminTrilhasView";
import CertificatePreviewModal from "@/views/academy/components/CertificatePreviewModal";
import {
  LayoutDashboard, GraduationCap, Map, FileText, Award, Sparkles,
  User, Settings, Search, ChevronDown, ChevronRight, Play, Clock, Flame, Camera, Trash2,
  CheckCircle2, Lock, Star, X, Send, BookOpen, Code2, Workflow,
  Database, Network, Cpu, ShieldCheck, Users, Layers, Video,
  HelpCircle, ScrollText, Shield, ArrowLeft, TrendingUp,
  PlusCircle, Folder, LogOut, MoreHorizontal
} from "lucide-react";

const css = `

  html, body { background: ${palette.bgBase}; min-height: 100%; }

  .nexa-root {
    font-family: 'Inter', sans-serif;
    background: radial-gradient(circle at 15% 0%, rgba(110,63,217,0.10), transparent 40%),
                radial-gradient(circle at 85% 100%, rgba(45,212,232,0.07), transparent 45%),
                ${palette.bgBase};
    color: ${palette.textPrimary};
    min-height: 100vh;
    height: 100vh;
    display: flex;
    width: 100%;
    overflow: hidden;
    position: relative;
  }
  .nexa-root * { box-sizing: border-box; }
  .nexa-heading { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.01em; }
  .nexa-scroll::-webkit-scrollbar { width: 6px; height:6px; }
  .nexa-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,205,0.2); border-radius: 4px; }

  /* Sidebar */
  .nexa-sidebar {
    width: 232px;
    flex-shrink: 0;
    background: ${palette.bgPanel};
    border-right: 1px solid ${palette.border};
    display: flex;
    flex-direction: column;
    padding: 22px 14px;
  }
  .nexa-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 8px 18px 8px;
  }
  .nexa-logo-mark {
    width: 30px; height: 30px;
    border-radius: 8px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
    overflow:hidden;
  }
  .nexa-sidebar .nexa-logo-mark {
    width:36px; height:36px; background:#2f2f2f;
  }
  .nexa-sidebar .nexa-logo-mark img {
    width:100%; height:100%; object-fit:cover; display:block;
  }
  .nexa-logo-text { font-size: 15px; font-weight: 700; line-height:1.1; }
  .nexa-logo-sub { font-size: 10px; color: ${palette.textFaint}; letter-spacing: 0.12em; }

  .nexa-navgroup { display:flex; flex-direction:column; gap:2px; margin-bottom: 14px; }
  .nexa-navscroll { flex:1; overflow-y:auto; padding-right:2px; }
  .nexa-navlabel { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: ${palette.textFaint}; padding: 10px 12px 6px; }
  .nexa-navitem {
    display:flex; align-items:center; gap:10px;
    padding: 9px 12px; border-radius: 9px;
    font-size: 13.5px; font-weight: 500; color: ${palette.textMuted};
    cursor:pointer; border: 1px solid transparent;
    transition: all .15s ease;
  }
  .nexa-navitem:hover { background: rgba(148,163,205,0.06); color: ${palette.textPrimary}; }
  .nexa-navitem.active {
    background: linear-gradient(90deg, rgba(45,212,232,0.12), rgba(110,63,217,0.10));
    color: #fff; border-color: rgba(45,212,232,0.25);
  }
  .nexa-navitem.active svg { color: ${palette.cyan}; }
  .nexa-navitem.adminactive {
    background: linear-gradient(90deg, rgba(242,199,68,0.14), rgba(155,107,255,0.10));
    color: #fff; border-color: rgba(242,199,68,0.3);
  }
  .nexa-navitem.adminactive svg { color: ${palette.amber}; }

  .nexa-sidebar-footer {
    border-top: 1px solid ${palette.border};
    padding-top: 12px;
    display:flex; flex-direction:column; gap:10px;
  }
  .nexa-avatar {
    width: 32px; height:32px; border-radius:50%;
    background: linear-gradient(135deg, ${palette.purple}, ${palette.blue});
    display:flex; align-items:center; justify-content:center;
    font-size: 12px; font-weight:700; flex-shrink:0; overflow:hidden;
  }
  .nexa-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
  .nexa-mode-switch {
    display:flex; align-items:center; justify-content:center; gap:7px;
    font-size: 12px; font-weight:600; padding: 8px 10px; border-radius:9px;
    cursor:pointer; border: 1px solid;
  }

  /* Main */
  .nexa-main { flex:1; display:flex; flex-direction:column; min-width:0; }
  .nexa-topbar {
    display:flex; align-items:center; justify-content:space-between;
    padding: 18px 28px; border-bottom: 1px solid ${palette.border};
    flex-shrink:0;
  }
  .nexa-search {
    display:flex; align-items:center; gap:5px;
    background: ${palette.bgCard}; border:1px solid ${palette.border};
    border-radius: 8px; padding: 5px 10px; width: 260px;
    color: ${palette.textFaint}; font-size: 12px;
  }
  .nexa-topbar-icons { display:flex; align-items:center; gap:14px; }
  .nexa-profile-menu-wrap { position:relative; }
  .nexa-avatar-button { cursor:pointer; padding:0; font-family:inherit; transition:background .15s ease, border-color .15s ease; }
  .nexa-avatar-button:hover, .nexa-avatar-button[aria-expanded="true"] { background:#eee; border-color:#bdbdbd; }
  .nexa-profile-menu-backdrop { position:fixed; inset:0; z-index:58; background:transparent; }
  .nexa-profile-menu {
    position:absolute; top:calc(100% + 10px); right:0; z-index:59; width:190px; padding:6px;
    background:#fff; border:1px solid #dedede; border-radius:10px; box-shadow:0 16px 38px rgba(0,0,0,.14);
  }
  .nexa-profile-menu button {
    width:100%; min-height:39px; display:flex; align-items:center; gap:10px; padding:0 11px;
    border:0; border-radius:7px; background:transparent; color:#222; font:500 12.5px Inter,sans-serif;
    text-align:left; cursor:pointer;
  }
  .nexa-profile-menu button:hover { background:#f3f3f3; }
  .nexa-profile-menu button:last-child { color:#a52f3b; }
  .nexa-favorite-cover {
    width:54px; height:36px; flex-shrink:0; overflow:hidden; border:1px solid #e2e2e2; border-radius:7px;
    display:flex; align-items:center; justify-content:center;
  }
  .nexa-favorite-cover img { width:100%; height:100%; display:block; object-fit:cover; }
  .nexa-iconbtn {
    width:34px; height:34px; border-radius:9px;
    display:flex; align-items:center; justify-content:center;
    background: ${palette.bgCard}; border:1px solid ${palette.border};
    color: ${palette.textMuted}; cursor:pointer; position:relative;
  }
  .nexa-dot { position:absolute; top:6px; right:6px; width:6px; height:6px; border-radius:50%; background:${palette.cyan}; box-shadow:0 0 6px ${palette.cyan}; }

  .nexa-content { flex:1; overflow-y:auto; padding: 28px 28px 60px; }

  /* Cards generic */
  .nexa-card {
    background: ${palette.bgCard};
    border: 1px solid ${palette.border};
    border-radius: 14px;
    transition: all .2s ease;
  }
  .nexa-card.hoverable:hover {
    background: ${palette.bgCardHover};
    border-color: ${palette.borderStrong};
    transform: translateY(-2px);
  }

  /* Hero continue card */
  .nexa-hero {
    position:relative; overflow:hidden;
    border-radius: 18px;
    padding: 26px 28px;
    background: linear-gradient(120deg, #0D1640 0%, #131A3A 45%, #1B1240 100%);
    border: 1px solid rgba(155,107,255,0.18);
  }
  .nexa-hero::before {
    content:""; position:absolute; top:-60px; right:-60px;
    width:220px; height:220px; border-radius:50%;
    background: radial-gradient(circle, rgba(45,212,232,0.25), transparent 70%);
  }
  .nexa-progress-track { background: rgba(148,163,205,0.15); border-radius: 999px; height:6px; overflow:hidden; }
  .nexa-progress-fill { height:100%; border-radius:999px; background: linear-gradient(90deg, ${palette.cyan}, ${palette.purple}); }

  .nexa-btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    background: linear-gradient(120deg, ${palette.cyan}, ${palette.blue});
    color: #051026; font-weight:700; font-size:13px;
    padding: 10px 18px; border-radius: 10px; border:none; cursor:pointer;
    box-shadow: 0 4px 18px rgba(45,212,232,0.25);
  }
  .nexa-btn-ghost {
    display:inline-flex; align-items:center; gap:7px;
    background: transparent; color:${palette.textPrimary}; font-weight:600; font-size:12.5px;
    padding: 9px 14px; border-radius: 10px; border:1px solid ${palette.border}; cursor:pointer;
  }

  .nexa-stat { padding: 16px 18px; display:flex; flex-direction:column; gap:8px; }
  .nexa-stat-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; }

  .nexa-grid-4 { display:grid; grid-template-columns: repeat(4, 1fr); gap:14px; }
  .nexa-grid-3 { display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; }
  .nexa-grid-2col { display:grid; grid-template-columns: 2fr 1fr; gap:20px; }

  .nexa-section-title { font-size:15px; font-weight:600; font-family:'Space Grotesk',sans-serif; }
  .nexa-see-all { font-size:12px; color:${palette.cyan}; display:flex; align-items:center; gap:3px; cursor:pointer; }

  /* Course card */
  .nexa-course-cover {
    height: auto; aspect-ratio: 16 / 9; border-radius: 12px 12px 0 0;
    display:flex; align-items:center; justify-content:center;
    position:relative; overflow:hidden;
  }
  .nexa-course-cover-image { width:100%; height:100%; object-fit:cover; object-position:center; display:block; }
  .nexa-badge {
    font-size:10px; font-weight:600; padding: 3px 8px; border-radius:6px;
    background: rgba(255,255,255,0.08); color:${palette.textPrimary};
    backdrop-filter: blur(4px);
  }
  .nexa-course-body { padding: 13px 14px 14px; }

  /* Trilha timeline */
  .nexa-trilha-track { display:flex; align-items:flex-start; padding: 8px 4px 4px; overflow-x:auto; }
  .nexa-trilha-node { display:flex; flex-direction:column; align-items:center; gap:8px; min-width: 96px; position:relative; }
  .nexa-trilha-circle {
    width: 32px; height:32px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; border:1.5px solid;
    position:relative; z-index:2; flex:0 0 32px;
    box-shadow:none;
  }
  .nexa-trilha-line { position:absolute; top:15px; left:50%; height:2px; width:100%; z-index:1; }
  .nexa-trilha-label { font-size: 11px; text-align:center; color:${palette.textMuted}; max-width:90px; line-height:1.3; }

  .nexa-trilha-overview-card {
    padding: 18px; cursor:pointer; position:relative; overflow:hidden;
  }
  .nexa-trilha-cover { display:block; width:calc(100% + 36px); aspect-ratio:16/9; margin:-18px -18px 14px; object-fit:cover; background:#f1f1f1; }

  /* Right column items */
  .nexa-side-item { display:flex; gap:10px; padding: 10px; border-radius:10px; align-items:flex-start; }
  .nexa-side-item:hover { background: rgba(148,163,205,0.06); }



  .nexa-pill {
    font-size:12px; padding: 6px 13px; border-radius:999px; cursor:pointer;
    border:1px solid #dcdcdc; color:#444; background:#fff; white-space:nowrap;
    transition:background .15s ease,border-color .15s ease,color .15s ease;
  }
  .nexa-pill:hover { background:#f3f3f3; border-color:#c9c9c9; color:#111; }
  .nexa-pill.active {
    background:#111; border-color:#111; color:#fff;
  }
  .nexa-pill-fav { display:inline-flex; align-items:center; gap:5px; }
  .nexa-fav-button {
    position:absolute; top:8px; right:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center;
    padding:0; border:1px solid rgba(0,0,0,.08); border-radius:50%; background:rgba(255,255,255,.92); color:#555; cursor:pointer;
    transition:transform .15s ease, color .15s ease;
  }
  .nexa-fav-button:hover { transform:scale(1.08); color:#111; }
  .nexa-fav-button.active { color:#111; }

  /* Admin table */
  .nexa-table { width:100%; border-collapse: collapse; font-size: 12.5px; }
  .nexa-table th {
    text-align:left; color:${palette.textFaint}; font-weight:600; font-size:11px;
    text-transform:uppercase; letter-spacing:0.05em; padding: 0 12px 10px; border-bottom:1px solid ${palette.border};
  }
  .nexa-table td { padding: 11px 12px; border-bottom: 1px solid rgba(148,163,205,0.07); color:${palette.textPrimary}; }
  .nexa-table tr:last-child td { border-bottom:none; }
  .nexa-status-dot { width:7px; height:7px; border-radius:50%; display:inline-block; margin-right:6px; }
  .nexa-label { display:block; margin-bottom:6px; color:#3f3f3f; font-size:11.5px; font-weight:600; }
  .nexa-input {
    width:100%; min-height:38px; padding:8px 10px; border:1px solid #d8d8d8; border-radius:7px;
    outline:none; background:#fff; color:#111; font:400 12.5px Inter,sans-serif;
  }
  .nexa-input:focus { border-color:#111; box-shadow:0 0 0 2px rgba(17,17,17,.08); }
  .admin-certificate-form { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

  .nexa-bar-wrap { display:flex; align-items:flex-end; gap:10px; height:120px; padding: 0 4px; }
  .nexa-bar { flex:1; border-radius: 6px 6px 0 0; background: linear-gradient(180deg, ${palette.cyan}, ${palette.purpleDeep}); position:relative; }
  .nexa-bar-label { text-align:center; font-size:10.5px; color:${palette.textFaint}; margin-top:8px; }

  /* Dashboard claro — referência visual Nexa Academy */
  .nexa-root {
    background: #f8f8f8;
  }
  .nexa-sidebar {
    width: 254px;
    padding: 26px 16px 20px;
    background: #fff;
    border-right-color: #e5e5e5;
  }
  .nexa-logo { padding: 0 14px 24px; gap: 14px; }
  .nexa-sidebar .nexa-logo-mark { width: 48px; height: 48px; background: transparent; border-radius: 0; }
  .nexa-sidebar .nexa-logo-mark img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transform: scale(1.18);
  }
  .nexa-logo-wordmark { display:flex; flex-direction:column; min-width:0; }
  .nexa-logo-text { font-size: 18px; letter-spacing: .22em; text-transform: uppercase; line-height:1; }
  .nexa-logo-academy { margin-top:5px; font-size:10px; font-weight:700; letter-spacing:.28em; text-transform:uppercase; line-height:1; }
  .nexa-logo-sub { margin-top: 6px; color: #555; font-size: 9px; letter-spacing: .08em; }
  .nexa-navlabel { padding: 18px 14px 8px; font-size: 11px; color: #777; }
  .nexa-navitem { min-height: 46px; padding: 12px 16px; border-radius: 9px; color: #4d4d4d; font-size: 14px; gap: 14px; }
  .nexa-navitem:hover { background: #f4f4f4; color: #111; }
  .nexa-navitem.active, .nexa-navitem.adminactive {
    color: #111; background: #f1f1f1; border-color: transparent; font-weight: 600;
  }
  .nexa-navitem.active svg, .nexa-navitem.adminactive svg { color: #111; }
  .nexa-navchevron { margin-left: auto; transition: transform .15s ease; }
  .nexa-navsubitem { min-height: 38px; padding: 8px 16px 8px 44px; font-size: 13px; }
  .nexa-sidebar-footer { border: 0; gap: 18px; }
  .nexa-mode-switch { color: #111 !important; background: #fff !important; border-color: #ddd !important; min-height: 48px; }
  .nexa-avatar { color: #111; background: #f7f7f7; border: 1px solid #d7d7d7; }
  .nexa-topbar { min-height: 94px; padding: 18px 32px 16px 40px; border-bottom-color: #e9e9e9; background: rgba(248,248,248,.92); }
  .nexa-search { width: min(526px, 52vw); height: 58px; padding: 0 22px; gap: 16px; border-radius: 12px; background: #fff; border-color: #e1e1e1; color: #666; font-size: 14px; }
  .nexa-topbar-icons { gap: 22px; }
  .nexa-content { padding: 28px 32px 48px 40px; }
  .nexa-card { background: #fff; border-color: #e3e3e3; border-radius: 12px; box-shadow: 0 5px 18px rgba(0,0,0,.025); }
  .nexa-hero {
    min-height: 264px; padding: 28px 34px; border-radius: 13px; color: #111;
    background: #fff; background-image:none;
    border-color: #e2e2e2; box-shadow: 0 5px 18px rgba(0,0,0,.025);
  }
  .nexa-hero::before { display: none; }
  .nexa-badge { border: 1px solid #dadada; color: #111 !important; background: #fff !important; }
  .nexa-progress-track { background: #dedede; height: 4px; }
  .nexa-progress-fill { background: #111; }
  .nexa-btn-primary { background: #111; color: #fff; border-radius: 6px; box-shadow: none; padding: 11px 20px; }
  .nexa-dashboard-side { display: grid; grid-template-rows: 94px 1fr; gap: 14px; }
  .nexa-dashboard-stats .nexa-stat { flex-direction: row; align-items: center; gap: 18px; padding: 20px; }
  .nexa-dashboard-stats .nexa-stat-icon { background: #f5f5f5 !important; color: #111 !important; border: 1px solid #ededed; }
  .nexa-dashboard-course-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .nexa-dashboard-course { min-height: 136px; padding: 16px 18px; display: flex; flex-direction: column; justify-content: space-between; }
  .nexa-dashboard-course-top { display: flex; justify-content: space-between; align-items: center; }
  .nexa-dashboard-course-link { width: 30px; height: 30px; border: 1px solid #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .nexa-notification-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; }
  .nexa-notification-icon { width: 34px; height: 34px; border-radius: 7px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
  .nexa-see-all { color: #111; }

  /* Overlay dos formulários administrativos */
  .nexa-certificate-overlay {
    position:fixed !important; inset:0 !important; z-index:60;
    padding:24px; background:rgba(17,17,17,.38) !important;
    backdrop-filter:blur(3px);
  }
  @media (max-width:560px) {
    .nexa-certificate-overlay { padding:12px; }
    .admin-certificate-form { grid-template-columns:1fr; }
  }
  @media (max-width: 1050px) {
    .nexa-sidebar { width: 210px; }
    .nexa-grid-2col { grid-template-columns: 1fr; }
    .nexa-dashboard-side { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
    .nexa-dashboard-course-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 760px) {
    .nexa-root { height: auto; min-height: 100vh; overflow: visible; }
    .nexa-sidebar { width: 76px; padding: 20px 10px; }
    .nexa-logo { padding: 0 4px 20px; }
    .nexa-logo > div:last-child, .nexa-navlabel, .nexa-navitem:not(.active) span { display: none; }
    .nexa-navitem { justify-content: center; padding: 12px; gap: 0; }
    .nexa-navchevron { display: none; }
    .nexa-mode-switch { font-size: 0; }
    .nexa-main { min-width: 0; }
    .nexa-topbar { padding: 14px 18px; min-height: 76px; }
    .nexa-search { width: calc(100% - 76px); height: 48px; }
    .nexa-content { padding: 24px 18px 40px; }
    .nexa-grid-4, .nexa-dashboard-course-grid, .nexa-dashboard-side { grid-template-columns: 1fr; }
  }

  /* Impressão do certificado em PDF (via "Salvar como PDF" do navegador) */
  @media print {
    body * { visibility: hidden !important; }
    .certificate-overlay, .certificate-dialog, .certificate-pages,
    .certificate-sheet, .certificate-sheet * { visibility: visible !important; }
    .certificate-overlay { position:absolute !important; inset:0 !important; padding:0 !important; background:none !important; }
    .certificate-dialog { width:100% !important; max-height:none !important; overflow:visible !important; }
    .certificate-pages { gap:0 !important; }
    .certificate-sheet {
      position:relative !important; width:100vw !important; height:100vh !important; margin:0 !important;
      max-width: none !important; aspect-ratio: auto !important;
      border-radius: 0 !important; box-shadow: none !important; border: none !important;
      break-after:page; page-break-after:always;
    }
    .certificate-sheet:last-child { break-after:auto; page-break-after:auto; }
    .nexa-no-print, .certificate-actions { display: none !important; }
    @page { size: landscape; margin: 0; }
  }
`;

/* ---------------- Nav configs ---------------- */
const userNavItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "treinamentos", label: "Treinamentos", icon: GraduationCap },
  { key: "trilhas", label: "Trilhas", icon: Map },
  { key: "certificados", label: "Certificados", icon: Award },
];

const adminNavItems = [
  { key: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "admin-usuarios", label: "Usuários", icon: Users },
  {
    key: "admin-treinamentos", label: "Treinamentos", icon: GraduationCap,
    children: [
      { key: "admin-trilhas", label: "Trilhas", icon: Map },
      { key: "admin-quizzes", label: "Quizzes", icon: HelpCircle },
    ],
  },
  { key: "admin-certificados", label: "Certificados", icon: Award },
];
const adminNavFlat = adminNavItems.flatMap((item) => [item, ...(item.children ?? [])]);

/* ---------------- Ícones dos treinamentos (coluna treinamentos.icone) ---------------- */
const iconMap = { Workflow, Database, Code2, Network, Cpu, ShieldCheck, BookOpen };

/* ---------------- Reusable components ---------------- */
function AvatarConteudo({ nome, foto }) {
  return foto ? <img src={foto} alt="" /> : initials(nome);
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="nexa-card nexa-stat">
      <div className="nexa-stat-icon" style={{ background: `${color}1A`, color }}>
        <Icon size={17} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{value}</div>
        <div style={{ fontSize: 12, color: palette.textMuted }}>{label}</div>
      </div>
    </div>
  );
}

function CourseCard({ c, onOpen, isFavorite = false, onToggleFavorite = null }) {
  const Icon = c.icon;
  return (
    <div className="nexa-card hoverable" style={{ overflow: "hidden", cursor: "pointer" }} onClick={onOpen}>
      <div className="nexa-course-cover" style={{ background: c.cover ? "#e5e5e5" : `linear-gradient(135deg, ${c.grad[0]}, ${c.grad[1]})` }}>
        {c.cover ? <img className="nexa-course-cover-image" src={c.cover} alt={`Capa do curso ${c.title}`} /> : <Icon size={30} color="rgba(255,255,255,0.9)" />}
        {!c.cover && <div style={{ position: "absolute", top: 8, left: 8 }}><span className="nexa-badge">{c.level}</span></div>}
        {c.progress === 100 && <div style={{ position: "absolute", top: 8, right: onToggleFavorite ? 46 : 8 }}><CheckCircle2 size={18} color="#fff" /></div>}
        {onToggleFavorite && (
          <button
            type="button"
            className={`nexa-fav-button ${isFavorite ? "active" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Remover "${c.title}" dos favoritos` : `Adicionar "${c.title}" aos favoritos`}
            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Star size={15} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <div className="nexa-course-body">
        <div style={{ fontSize: 11, color: palette.cyan, fontWeight: 600, marginBottom: 4 }}>{c.cat}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8, fontFamily: "'Space Grotesk',sans-serif" }}>{c.title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: c.progress > 0 ? 8 : 0 }}>
          <span style={{ fontSize: 11.5, color: palette.textFaint, display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {c.dur}</span>
          {c.progress > 0 && c.progress < 100 && <span style={{ fontSize: 11, color: palette.textMuted }}>{c.progress}%</span>}
        </div>
        {c.progress > 0 && <div className="nexa-progress-track"><div className="nexa-progress-fill" style={{ width: `${c.progress}%` }} /></div>}
      </div>
    </div>
  );
}

function TrilhaTimeline({ steps }) {
  return (
    <div className="nexa-trilha-track nexa-scroll">
      {steps.map((step, i) => {
        const isDone = step.status === "done";
        const isCurrent = step.status === "current";
        return (
          <div key={i} className="nexa-trilha-node">
            {i < steps.length - 1 && (
              <div className="nexa-trilha-line" style={{ background: isDone ? "#2d7147" : "#dedede" }} />
            )}
            <div
              className="nexa-trilha-circle"
              style={{
                borderColor: isDone ? "#2d7147" : isCurrent ? "#111" : "#999",
                color: isDone ? "#fff" : isCurrent ? "#fff" : "#777",
                background: isDone ? "#2d7147" : isCurrent ? "#111" : "#fff",
                boxShadow: "none",
              }}
            >
              {isDone ? <CheckCircle2 size={17} /> : isCurrent ? i + 1 : <Lock size={13} />}
            </div>
            <span className="nexa-trilha-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function AdminPlaceholder({ title, icon: Icon }) {
  return (
    <div className="nexa-card" style={{ padding: "60px 24px", textAlign: "center" }}>
      <Icon size={26} color={palette.textFaint} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: palette.textMuted }}>Tela administrativa de {title.toLowerCase()} — a detalhar na próxima etapa.</div>
    </div>
  );
}

function EmptyCoursesState({ onShowAll, showAllAction }) {
  return (
    <div className="nexa-card" style={{ minHeight: 340, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "42px 24px", textAlign: "center" }}>
      <svg width="132" height="112" viewBox="0 0 132 112" role="img" aria-label="Robô quebrado" style={{ marginBottom: 18 }}>
        <g transform="rotate(-5 65 54)">
          <path d="M65 15V7M65 7l9-4" fill="none" stroke="#777" strokeWidth="3" strokeLinecap="round" />
          <rect x="21" y="18" width="88" height="61" rx="17" fill="#f2f2f2" stroke="#222" strokeWidth="3" />
          <path d="M21 40h-9v19h9M109 40h8v10" fill="none" stroke="#222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="47" cy="46" r="7" fill="#222" />
          <path d="m79 39 13 13m0-13L79 52" stroke="#222" strokeWidth="4" strokeLinecap="round" />
          <path d="M47 66c8-7 27-7 35 0" fill="none" stroke="#777" strokeWidth="3" strokeLinecap="round" />
          <path d="m67 19-8 16 10 8-7 18" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M43 79v13m44-13v13M37 94h55" fill="none" stroke="#222" strokeWidth="3" strokeLinecap="round" />
        </g>
        <path d="m115 59 5 4-4 5" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" />
        <path d="m121 48 7-2m-4 10 6 3m-13-20 3-6" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h2 className="nexa-heading" style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>Ainda sem curso :(</h2>
      <p style={{ maxWidth: 420, margin: "8px 0 0", color: palette.textMuted, fontSize: 13, lineHeight: 1.6 }}>
        Não encontramos treinamentos disponíveis nesta categoria. Contate seu líder técnico para solicitar acesso ou indicar um novo curso.
      </p>
      {showAllAction && (
        <button type="button" className="nexa-btn-ghost" style={{ marginTop: 18 }} onClick={onShowAll}>Ver todos os cursos</button>
      )}
    </div>
  );
}

/* ---------------- App ---------------- */
export default function NexaAcademy() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const { data: perfil, isLoading: perfilLoading } = usePerfil(userId);
  const isAdmin = perfil?.perfil === "administrador" && perfil?.status === "ativo";

  const [mode, setMode] = useState("app"); // 'app' | 'admin'
  const [active, setActive] = useState("dashboard");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [adminActive, setAdminActive] = useState("admin-dashboard");
  const [submenuAberto, setSubmenuAberto] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [catFilter, setCatFilter] = useState("Todos");
  const [selectedTrilha, setSelectedTrilha] = useState(0);
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [enviandoCadastro, setEnviandoCadastro] = useState(false);
  const [menuUsuarioId, setMenuUsuarioId] = useState(null);

  // --- Sessão: sem login volta para a tela inicial; usuário inativo é desconectado ---
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (perfil?.status === "inativo") {
      toast.error("Seu acesso está inativo. Fale com o administrador da plataforma.");
      supabase.auth.signOut();
    }
  }, [perfil?.status]);

  useEffect(() => {
    if (userId) repo.registrarAcesso(userId);
  }, [userId]);

  useEffect(() => {
    if (!isAdmin && mode === "admin") setMode("app");
  }, [isAdmin, mode]);

  // --- Dados ---
  const inAdmin = isAdmin && mode === "admin";
  const { data: categoriasDb = [] } = useCategorias(!!userId);
  const { data: treinamentosDb = [] } = useTreinamentos(!!userId);
  const { data: matriculas = [] } = useMatriculas(userId);
  const { data: favoritosIds = [] } = useFavoritos(userId);
  const { data: trilhasDb = [] } = useTrilhas(!!userId);
  const { data: meuResumo } = useMeuResumo(userId);
  const { data: meusTreinamentos = [] } = useMeusCertificados(userId);
  const { data: certificateTemplates = [] } = useModelosCertificado(!!userId);
  const { data: usuariosDb = [] } = useUsuarios(inAdmin);
  const { data: adminResumo } = useAdminResumo(inAdmin);
  const { data: horasMensais = [] } = useHorasMensais(inAdmin);
  const { data: topCourses = [] } = useTopTreinamentos(inAdmin);

  const progressoPorTreinamento = useMemo(() => new globalThis.Map(matriculas.map((m) => [m.treinamento_id, m])), [matriculas]);
  const adminTrainings = useMemo(
    () => treinamentosDb.map((t) => ({ ...t, icon: iconMap[t.icone] ?? BookOpen, progress: Math.round(progressoPorTreinamento.get(t.id)?.progresso ?? 0) })),
    [treinamentosDb, progressoPorTreinamento],
  );
  const courses = useMemo(() => adminTrainings.filter((t) => t.status === "ativo"), [adminTrainings]);
  // Só aparecem no filtro as categorias que têm algum treinamento ativo.
  const categories = useMemo(() => ["Todos", ...categoriasDb.map((c) => c.nome).filter((nome) => courses.some((t) => t.cat === nome))], [categoriasDb, courses]);
  const trilhas = useMemo(() => repo.montarTrilhas(trilhasDb, matriculas, (cor) => palette[cor] ?? cor ?? palette.cyan), [trilhasDb, matriculas]);
  const trilhaAtual = trilhas[Math.min(selectedTrilha, trilhas.length - 1)];
  const favoritos = useMemo(() => favoritosIds.map((id) => courses.find((c) => c.id === id)).filter(Boolean), [favoritosIds, courses]);
  const adminUsers = usuariosDb.map((u) => ({
    id: u.id,
    name: u.nome,
    email: u.email,
    perfil: u.perfil === "administrador" ? "Administrador" : "Usuário",
    perfilDb: u.perfil,
    status: u.status,
    acesso: timeAgo(u.ultimo_acesso),
    foto: u.avatar_url,
  }));
  const maxHoras = Math.max(1, ...horasMensais.map((m) => m.horas));
  const monthlyHours = horasMensais.map((m) => ({ mes: m.mes, v: (m.horas / maxHoras) * 100, horas: m.horas }));
  const variacaoMensal = (() => {
    const [anterior, atual] = horasMensais.slice(-2).map((m) => m.horas);
    if (!anterior) return null;
    return Math.round(((atual - anterior) / anterior) * 100);
  })();
  const maxAcessos = Math.max(1, ...topCourses.map((c) => c.acessos));

  // Dashboard do usuário: treinamento em andamento mais recente e sugestão
  const emAndamento = matriculas
    .filter((m) => m.progresso < 100)
    .map((m) => ({ matricula: m, curso: courses.find((c) => c.id === m.treinamento_id) }))
    .filter((x) => x.curso);
  const continuar = emAndamento[0] ?? null;
  const sugestao = courses.find((c) => !progressoPorTreinamento.has(c.id)) ?? null;
  const ultimosTreinamentos = (matriculas.length
    ? matriculas.map((m) => courses.find((c) => c.id === m.treinamento_id)).filter(Boolean)
    : courses
  ).slice(0, 3);

  function invalidar(...chaves) {
    chaves.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
  }

  async function executar(acao, mensagemSucesso) {
    try {
      await acao();
      if (mensagemSucesso) toast.success(mensagemSucesso);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      return false;
    }
  }

  // --- Admin: cadastro de usuário (convite por e-mail) ---
  const DOMINIO_PERMITIDO = CORPORATE_EMAIL_DOMAIN;
  const { validEmail: emailValido, canSubmit: podeEnviar } = academyController.validateUserRegistration(novoNome, novoEmail);

  function resetCadastro() {
    setNovoNome("");
    setNovoEmail("");
    setTentouEnviar(false);
    setShowCadastroModal(false);
  }

  async function cadastrarUsuario() {
    setTentouEnviar(true);
    if (!podeEnviar || enviandoCadastro) return;
    setEnviandoCadastro(true);
    const ok = await executar(() => repo.convidarUsuario(novoNome, novoEmail), `Convite enviado para ${novoEmail.trim()}`);
    setEnviandoCadastro(false);
    if (ok) {
      resetCadastro();
      invalidar(keys.usuarios, keys.adminResumo, keys.logs);
    }
  }

  async function alterarUsuario(u, patch) {
    setMenuUsuarioId(null);
    if (u.id === userId) return toast.error("Você não pode alterar o seu próprio perfil ou status.");
    const ok = await executar(() => repo.atualizarUsuario(u.id, patch), "Usuário atualizado");
    if (ok) invalidar(keys.usuarios, keys.adminResumo);
  }

  // --- Admin: Treinamentos ---
  const gradPresets = [
    ["#3D6BFF", "#2DD4E8"], ["#9B6BFF", "#3D6BFF"], ["#2DD4E8", "#6E3FD9"],
    ["#3D6BFF", "#9B6BFF"], ["#2DD4E8", "#3D6BFF"], ["#9B6BFF", "#2DD4E8"],
  ];
  const [showTreinamentoModal, setShowTreinamentoModal] = useState(false);
  const [editandoTreinoIdx, setEditandoTreinoIdx] = useState(null);
  const [menuTreinoIdx, setMenuTreinoIdx] = useState(null);
  const [salvandoTreino, setSalvandoTreino] = useState(false);
  const novoItem = () => ({ tipo: "video", titulo: "", url: "", texto: "", materiais: [] });
  const treinoInicial = {
    title: "", cat: "", level: "Básico", dur: "", desc: "",
    modulos: [{ titulo: "Módulo 1", imagem: "", itens: [novoItem()] }],
  };
  const [novoTreino, setNovoTreino] = useState(treinoInicial);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [tentouSalvarTreino, setTentouSalvarTreino] = useState(false);
  const { validTitle: tituloTreinoValido, validDuration: duracaoTreinoValida, validModules: modulosValidos, canSave: podeSalvarTreino } = academyController.validateTrainingDraft(novoTreino);
  const NOVA_CATEGORIA = "__nova__";
  const criandoCategoria = novoTreino.cat === NOVA_CATEGORIA;
  const categoriaValida = !criandoCategoria || novaCategoria.trim().length >= 2;

  const tiposConteudo = [
    { value: "video", label: "Vídeo", icon: Video },
    { value: "texto", label: "Texto", icon: FileText },
    { value: "doc", label: "Documento", icon: FileText },
    { value: "quiz", label: "Quiz", icon: HelpCircle },
    { value: "aula", label: "Aula", icon: BookOpen },
  ];

  function updateModulo(mIdx, patch) {
    setNovoTreino((prev) => {
      const arr = [...prev.modulos];
      arr[mIdx] = { ...arr[mIdx], ...patch };
      return { ...prev, modulos: arr };
    });
  }
  function addModulo() {
    setNovoTreino((prev) => ({
      ...prev,
      modulos: [...prev.modulos, { titulo: `Módulo ${prev.modulos.length + 1}`, imagem: "", materiais: [], itens: [novoItem()] }],
    }));
  }
  function removeModulo(mIdx) {
    setNovoTreino((prev) => ({
      ...prev,
      modulos: prev.modulos.length > 1 ? prev.modulos.filter((_, i) => i !== mIdx) : prev.modulos,
    }));
  }
  function updateItem(mIdx, iIdx, patch) {
    setNovoTreino((prev) => {
      const arr = [...prev.modulos];
      const itens = [...arr[mIdx].itens];
      itens[iIdx] = { ...itens[iIdx], ...patch };
      arr[mIdx] = { ...arr[mIdx], itens };
      return { ...prev, modulos: arr };
    });
  }
  function addItem(mIdx) {
    setNovoTreino((prev) => {
      const arr = [...prev.modulos];
      arr[mIdx] = { ...arr[mIdx], itens: [...arr[mIdx].itens, novoItem()] };
      return { ...prev, modulos: arr };
    });
  }
  function removeItem(mIdx, iIdx) {
    setNovoTreino((prev) => {
      const arr = [...prev.modulos];
      const itens = arr[mIdx].itens;
      if (itens.length <= 1) return prev;
      arr[mIdx] = { ...arr[mIdx], itens: itens.filter((_, i) => i !== iIdx) };
      return { ...prev, modulos: arr };
    });
  }

  function resetTreinoModal() {
    setNovoTreino(treinoInicial);
    setNovaCategoria("");
    setTentouSalvarTreino(false);
    setShowTreinamentoModal(false);
    setEditandoTreinoIdx(null);
  }

  function abrirNovoTreino() {
    setNovoTreino(treinoInicial);
    setNovaCategoria("");
    setEditandoTreinoIdx(null);
    setTentouSalvarTreino(false);
    setShowTreinamentoModal(true);
  }

  async function editarTreinamento(idx) {
    const t = adminTrainings[idx];
    setMenuTreinoIdx(null);
    try {
      const modulos = await repo.fetchTreinamentoParaEdicao(t.id);
      setNovoTreino({
        title: t.title || "",
        cat: categoriasDb.some((c) => c.nome === t.cat) ? t.cat : "",
        level: t.level || "Básico",
        dur: t.dur || "",
        desc: t.desc || "",
        modulos: modulos.length
          ? modulos.map((m) => ({ ...m, itens: m.itens.length ? m.itens : [novoItem()] }))
          : [{ titulo: "Módulo 1", imagem: "", itens: [novoItem()] }],
      });
      setNovaCategoria("");
      setEditandoTreinoIdx(idx);
      setTentouSalvarTreino(false);
      setShowTreinamentoModal(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function excluirTreinamento(idx) {
    const t = adminTrainings[idx];
    setMenuTreinoIdx(null);
    if (!window.confirm(`Excluir o treinamento "${t.title}"? Módulos, aulas, progresso dos alunos e certificados vinculados também serão removidos.`)) return;
    const ok = await executar(() => repo.excluirTreinamento(t.id, t.title), "Treinamento excluído");
    if (ok) invalidar(keys.treinamentos, keys.modelos, keys.adminResumo, keys.logs, ["matriculas"]);
  }

  async function salvarTreinamento() {
    setTentouSalvarTreino(true);
    if (!podeSalvarTreino || !categoriaValida || salvandoTreino) return;
    const existente = editandoTreinoIdx !== null ? adminTrainings[editandoTreinoIdx] : null;
    const draft = { ...novoTreino, modulos: academyController.sanitizeModules(novoTreino.modulos) };
    setSalvandoTreino(true);
    const ok = await executar(
      async () => {
        const categoriaId = criandoCategoria
          ? await repo.obterOuCriarCategoria(novaCategoria)
          : categoriasDb.find((c) => c.nome === novoTreino.cat)?.id ?? null;
        await repo.salvarTreinamento(draft, categoriaId, existente?.id);
      },
      existente ? "Treinamento atualizado" : "Treinamento cadastrado",
    );
    setSalvandoTreino(false);
    if (ok) {
      invalidar(keys.treinamentos, keys.categorias, keys.adminResumo, keys.logs, ["conteudo"], ["aula"]);
      resetTreinoModal();
    }
  }

  // --- Perfil do usuário ---
  const [perfilNome, setPerfilNome] = useState("");
  const perfilEmail = perfil?.email ?? user?.email ?? "";
  const primeiroNome = academyController.getFirstName(perfil?.nome ?? "");
  const [perfilCargo, setPerfilCargo] = useState("");
  const [perfilSalvo, setPerfilSalvo] = useState(false);
  const fotoInputRef = useRef(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  async function trocarFoto(file) {
    if (fotoInputRef.current) fotoInputRef.current.value = "";
    if (file === undefined) return;
    if (file && !file.type.startsWith("image/")) return toast.error("A foto precisa ser uma imagem (PNG, JPG ou WEBP).");
    if (file && file.size > 5 * 1024 * 1024) return toast.error("A foto pode ter no máximo 5 MB.");
    setEnviandoFoto(true);
    const ok = await executar(() => repo.atualizarMinhaFoto(userId, file), file ? "Foto atualizada" : "Foto removida");
    setEnviandoFoto(false);
    if (ok) invalidar(keys.perfil(userId), keys.usuarios);
  }

  useEffect(() => {
    if (!perfil) return;
    setPerfilNome(perfil.nome ?? "");
    setPerfilCargo(perfil.cargo ?? "");
  }, [perfil?.id, perfil?.nome, perfil?.cargo]);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [tentouSalvarSenha, setTentouSalvarSenha] = useState(false);
  const [senhaSalva, setSenhaSalva] = useState(false);

  const { isStrongEnough: novaSenhaValida, passwordsMatch: senhasConferem, canSave: podeSalvarSenha } = academyController.validatePasswordChange(senhaAtual, novaSenha, confirmarSenha);

  async function salvarPerfil() {
    if (perfilNome.trim().length < 2) return toast.error("Informe seu nome completo.");
    const ok = await executar(() => repo.atualizarMeuPerfil(userId, { nome: perfilNome, cargo: perfilCargo }));
    if (ok) {
      setPerfilSalvo(true);
      invalidar(keys.perfil(userId), keys.usuarios);
    }
  }

  async function salvarSenha() {
    setTentouSalvarSenha(true);
    if (!podeSalvarSenha) return;
    const ok = await executar(() => repo.alterarSenha(perfilEmail, senhaAtual, novaSenha));
    if (ok) {
      setSenhaSalva(true);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setTentouSalvarSenha(false);
      setTimeout(() => setSenhaSalva(false), 2500);
    }
  }

  // --- Certificados: regra de emissão (treinamento concluído + aproveitamento >= nota mínima) ---
  const APROVEITAMENTO_MINIMO = MINIMUM_CERTIFICATE_SCORE;
  const [certificadoPreview, setCertificadoPreview] = useState(null);
  const certificadoTemplatePreview = certificadoPreview
    ? academyController.resolveCertificateTemplate(certificadoPreview, certificateTemplates)
    : null;

  async function emitirCertificado(idx) {
    const item = meusTreinamentos[idx];
    const ok = await executar(() => repo.emitirCertificado(item.treinamentoId), "Certificado emitido!");
    if (!ok) return;
    invalidar(keys.meusCertificados(userId), keys.meuResumo(userId));
    const atualizados = await queryClient.fetchQuery({ queryKey: keys.meusCertificados(userId), queryFn: () => repo.fetchMeusCertificados(userId) });
    setCertificadoPreview(atualizados.find((t) => t.treinamentoId === item.treinamentoId) ?? null);
  }

  async function adicionarModeloCertificado(draft, arquivo) {
    const treinamento = adminTrainings.find((t) => t.title === draft.courseTitle);
    if (!treinamento) {
      toast.error("Selecione um treinamento cadastrado.");
      return false;
    }
    const ok = await executar(() => repo.criarModeloCertificado(draft, treinamento.id, arquivo), "Modelo de certificado criado");
    if (ok) invalidar(keys.modelos, keys.logs);
    return ok;
  }

  async function alternarStatusModeloCertificado(templateId) {
    const template = certificateTemplates.find((t) => t.id === templateId);
    if (!template) return;
    const ok = await executar(() => repo.definirStatusModelo(templateId, template.status === "active" ? "draft" : "active"));
    if (ok) invalidar(keys.modelos);
  }

  async function removerModeloCertificado(templateId) {
    if (!window.confirm("Excluir este modelo de certificado?")) return;
    const ok = await executar(() => repo.excluirModeloCertificado(templateId), "Modelo excluído");
    if (ok) {
      invalidar(keys.modelos);
      if (certificadoPreview?.templateId === templateId) setCertificadoPreview(null);
    }
  }

  function visualizarModeloCertificado(template) {
    setCertificadoPreview(academyController.createCertificatePreviewTraining(template));
  }

  // --- Favoritos ---
  async function alternarFavorito(treinamentoId) {
    const favorito = !favoritosIds.includes(treinamentoId);
    const ok = await executar(() => repo.definirFavorito(userId, treinamentoId, favorito));
    if (ok) invalidar(keys.favoritos(userId), keys.meuResumo(userId));
  }

  const FILTRO_FAVORITOS = "__favoritos__";
  const filtered = catFilter === "Todos" ? courses
    : catFilter === FILTRO_FAVORITOS ? favoritos
    : courses.filter((c) => c.cat === catFilter);
  const navItems = mode === "admin" ? adminNavItems : userNavItems;
  const certificateCourseTitles = adminTrainings.map((training) => training.title).sort((a, b) => a.localeCompare(b, "pt-BR"));

  function abrirCurso(courseId, lessonId = null) {
    const id = courseId ?? continuar?.curso?.id ?? courses[0]?.id;
    if (!id) return;
    setSelectedCourseId(id);
    setSelectedLessonId(lessonId);
    setMode("app");
    setActive("curso");
  }

  function abrirTrilha(trilha) {
    const etapa = trilha?.etapas?.find((e, i) => trilha.steps[i]?.status === "current" && e.treinamento_id) ?? trilha?.etapas?.find((e) => e.treinamento_id);
    if (etapa) abrirCurso(etapa.treinamento_id);
    else toast.info("Esta trilha ainda não tem treinamentos vinculados.");
  }

  function abrirPerfil() {
    setProfileMenuOpen(false);
    setSelectedLessonId(null);
    setMode("app");
    setActive("perfil");
  }

  async function sair() {
    setProfileMenuOpen(false);
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (authLoading || !user || (perfilLoading && !perfil)) {
    return (
      <div className="nexa-root" style={{ alignItems: "center", justifyContent: "center" }}>
        <style>{css}</style>
        <span style={{ color: palette.textMuted, fontSize: 13 }}>Carregando...</span>
      </div>
    );
  }

  return (
    <div className="nexa-root">
      <style>{css}</style>
      <Toaster position="top-right" richColors closeButton />

      {/* Sidebar */}
      <aside className="nexa-sidebar">
        <div className="nexa-logo">
          <div className="nexa-logo-mark">
            <img src="/nexa-ai-logo.png?v=20260716" alt="Logo Nexa Academy" />
          </div>
          <div className="nexa-logo-wordmark">
            <div className="nexa-logo-text">Nexa</div>
            <div className="nexa-logo-academy">Academy</div>
            {mode === "admin" && <div className="nexa-logo-sub">Painel administrativo</div>}
          </div>
        </div>

        <div className="nexa-navscroll nexa-scroll">
          <div className="nexa-navgroup">
            {mode === "admin" && <div className="nexa-navlabel">Administração</div>}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = mode === "admin" ? adminActive === item.key : active === item.key || (active === "curso" && item.key === "treinamentos");
              const children = mode === "admin" && "children" in item ? item.children : undefined;
              const expandido = !!children && (submenuAberto || children.some((c) => c.key === adminActive));
              return (
                <Fragment key={item.key}>
                  <div
                    className={`nexa-navitem ${isActive ? (mode === "admin" ? "adminactive" : "active") : ""}`}
                    onClick={() => {
                      if (mode === "admin") {
                        setAdminActive(item.key);
                        if (children) setSubmenuAberto(!expandido || !isActive);
                      } else {
                        setSelectedLessonId(null);
                        setActive(item.key);
                      }
                    }}
                  >
                    <Icon size={16} />
                    {item.label}
                    {children && <ChevronDown size={14} className="nexa-navchevron" style={{ transform: expandido ? "rotate(180deg)" : undefined }} />}
                  </div>
                  {expandido && children.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <div
                        key={sub.key}
                        className={`nexa-navitem nexa-navsubitem ${adminActive === sub.key ? "adminactive" : ""}`}
                        onClick={() => setAdminActive(sub.key)}
                      >
                        <SubIcon size={15} />
                        {sub.label}
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>

        </div>

        <div className="nexa-sidebar-footer">
          {isAdmin && <div
            className="nexa-mode-switch"
            style={
              mode === "app"
                ? { color: palette.amber, borderColor: "rgba(242,199,68,0.3)", background: "rgba(242,199,68,0.08)" }
                : { color: palette.cyan, borderColor: "rgba(45,212,232,0.3)", background: "rgba(45,212,232,0.08)" }
            }
            onClick={() => setMode(mode === "app" ? "admin" : "app")}
          >
            {mode === "app" ? <Shield size={14} /> : <ArrowLeft size={14} />}
            {mode === "app" ? "Painel Administrativo" : "Voltar ao App"}
          </div>}
        </div>
      </aside>

      {/* Main */}
      <main className="nexa-main">
        <div className="nexa-topbar">
          <div className="nexa-search">
            <Search size={15} />
            {mode === "admin" ? "Buscar usuários, treinamentos, logs..." : "Pesquisar cursos, documentações, autores..."}
          </div>
          <div className="nexa-topbar-icons">
            <NotificationBell userId={userId} />
            <div className="nexa-profile-menu-wrap">
              <button
                type="button"
                className="nexa-avatar nexa-avatar-button"
                style={{ width: 46, height: 46 }}
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                aria-label="Abrir menu do usuário"
              >
                <AvatarConteudo nome={perfil?.nome || perfilEmail} foto={perfil?.avatar_url} />
              </button>
              {profileMenuOpen && (
                <>
                  <div className="nexa-profile-menu-backdrop" onClick={() => setProfileMenuOpen(false)} />
                  <div className="nexa-profile-menu" role="menu">
                    <button type="button" role="menuitem" onClick={abrirPerfil}><User size={16} /> Perfil</button>
                    <button type="button" role="menuitem" onClick={sair}><LogOut size={16} /> Logout</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="nexa-content nexa-scroll">
          {/* ---------- USER: DETALHE DO CURSO ---------- */}
          {mode === "app" && active === "curso" && !selectedLessonId && (
            <CourseDetailView
              userId={userId}
              course={adminTrainings.find((c) => c.id === selectedCourseId)}
              matricula={progressoPorTreinamento.get(selectedCourseId)}
              isFavorite={favoritosIds.includes(selectedCourseId)}
              onToggleFavorite={() => alternarFavorito(selectedCourseId)}
              onBack={() => setActive("treinamentos")}
              onOpenLesson={(lessonId) => setSelectedLessonId(lessonId)}
            />
          )}
          {mode === "app" && active === "curso" && selectedLessonId && (
            <LessonDetailView
              userId={userId}
              course={adminTrainings.find((c) => c.id === selectedCourseId)}
              matricula={progressoPorTreinamento.get(selectedCourseId)}
              lessonId={selectedLessonId}
              onBack={() => setSelectedLessonId(null)}
              onNavigate={(lessonId) => setSelectedLessonId(lessonId)}
            />
          )}

          {/* ---------- USER: DASHBOARD ---------- */}
          {mode === "app" && active === "dashboard" && (
            <>
              <div style={{ marginBottom: 22 }}>
                <h1 className="nexa-heading" style={{ fontSize: 30, fontWeight: 700, margin: 0 }}>Olá, {primeiroNome}</h1>
                <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>
                  {continuar
                    ? <>Você já concluiu {Math.round(continuar.matricula.progresso)}% de <strong style={{ color: "#111" }}>{continuar.curso.title}</strong>. Continue de onde parou.</>
                    : "Escolha um treinamento para começar a sua jornada."}
                </p>
              </div>

              <div className="nexa-grid-2col" style={{ marginBottom: 22 }}>
                <div className="nexa-hero">
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <span className="nexa-badge" style={{ background: "rgba(45,212,232,0.15)", color: palette.cyan }}>{continuar ? "Continuar estudando" : "Comece agora"}</span>
                    <h2 className="nexa-heading" style={{ fontSize: 24, margin: "24px 0 8px" }}>{continuar?.curso.title ?? sugestao?.title ?? "Nenhum treinamento disponível"}</h2>
                    <p style={{ fontSize: 12.5, color: palette.textMuted, marginBottom: 16, maxWidth: 420 }}>
                      {(continuar?.curso ?? sugestao) ? `${(continuar?.curso ?? sugestao).cat} · ${(continuar?.curso ?? sugestao).level} · ${(continuar?.curso ?? sugestao).dur}` : "Fale com seu líder técnico para liberar treinamentos."}
                    </p>
                    {continuar && (
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                        <div className="nexa-progress-track" style={{ flex: 1 }}><div className="nexa-progress-fill" style={{ width: `${continuar.matricula.progresso}%` }} /></div>
                        <span style={{ fontSize: 12, color: palette.textMuted, flexShrink: 0 }}>{Math.round(continuar.matricula.progresso)}%</span>
                      </div>
                    )}
                    {(continuar || sugestao) && (
                      <button className="nexa-btn-primary" onClick={() => continuar ? abrirCurso(continuar.curso.id, continuar.matricula.ultima_aula_id) : abrirCurso(sugestao.id)}>
                        <Play size={14} fill="#fff" /> {continuar ? "Continuar aula" : "Começar treinamento"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="nexa-dashboard-side">
                  <div className="nexa-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="nexa-stat-icon" style={{ background: "#f5f5f5", color: "#111" }}><Clock size={20} /></div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{String(meuResumo?.horas_estudadas ?? 0).replace(".", ",")}h estudadas</div>
                      <div style={{ fontSize: 11.5, color: palette.textMuted }}>Soma das aulas concluídas</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nexa-grid-4 nexa-dashboard-stats" style={{ marginBottom: 22 }}>
                <StatCard icon={GraduationCap} label="Em andamento" value={meuResumo?.em_andamento ?? 0} color={palette.cyan} />
                <StatCard icon={CheckCircle2} label="Concluídos" value={meuResumo?.concluidos ?? 0} color={palette.blue} />
                <StatCard icon={Award} label="Certificados" value={meuResumo?.certificados ?? 0} color={palette.purple} />
                <StatCard icon={Star} label="Favoritos" value={meuResumo?.favoritos ?? 0} color={palette.amber} />
              </div>

              {trilhas[0] && (
                <div style={{ marginBottom: 26 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span className="nexa-section-title">Sua trilha — {trilhas[0].title}</span>
                    <span className="nexa-see-all" onClick={() => setActive("trilhas")}>Ver trilha completa <ChevronRight size={13} /></span>
                  </div>
                  <div className="nexa-card" style={{ padding: "18px 20px" }}>
                    <TrilhaTimeline steps={trilhas[0].steps} />
                  </div>
                </div>
              )}

              <div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span className="nexa-section-title">{matriculas.length ? "Últimos treinamentos" : "Treinamentos disponíveis"}</span>
                    <span className="nexa-see-all" onClick={() => setActive("treinamentos")}>Ver todos <ChevronRight size={13} /></span>
                  </div>
                  <div className="nexa-dashboard-course-grid">
                    {ultimosTreinamentos.map((c) => (
                      <div className="nexa-card nexa-dashboard-course" key={c.id} onClick={() => abrirCurso(c.id)} style={{ cursor: "pointer" }}>
                        <div className="nexa-dashboard-course-top">
                          <span className="nexa-badge">{c.level}</span>
                          <c.icon size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 650, marginBottom: 4 }}>{c.title.replace(" na prática", "")}</div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: palette.textMuted, fontSize: 12 }}>
                            <span>{c.progress > 0 ? `${c.progress}% concluído` : c.dur}</span>
                            <span className="nexa-dashboard-course-link"><ChevronRight size={15} color="#111" /></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---------- USER: TREINAMENTOS ---------- */}
          {mode === "app" && active === "treinamentos" && (
            <>
              <div style={{ marginBottom: 18 }}>
                <h1 className="nexa-heading" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Treinamentos</h1>
                <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>{filtered.length} treinamentos disponíveis para o time de RPA</p>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
                {categories.map((cat) => (
                  <Fragment key={cat}>
                    <span className={`nexa-pill ${catFilter === cat ? "active" : ""}`} onClick={() => setCatFilter(cat)}>{cat}</span>
                    {cat === "Todos" && (
                      <span className={`nexa-pill nexa-pill-fav ${catFilter === FILTRO_FAVORITOS ? "active" : ""}`} onClick={() => setCatFilter(FILTRO_FAVORITOS)}>
                        <Star size={12} fill={catFilter === FILTRO_FAVORITOS ? "currentColor" : "none"} /> Favoritos{favoritos.length > 0 ? ` (${favoritos.length})` : ""}
                      </span>
                    )}
                  </Fragment>
                ))}
              </div>
              {filtered.length > 0
                ? <div className="nexa-grid-3">{filtered.map((c) => <CourseCard key={c.id} c={c} onOpen={() => abrirCurso(c.id)} isFavorite={favoritosIds.includes(c.id)} onToggleFavorite={() => alternarFavorito(c.id)} />)}</div>
                : catFilter === FILTRO_FAVORITOS
                  ? (
                    <div className="nexa-card" style={{ padding: "48px 24px", textAlign: "center" }}>
                      <Star size={26} color={palette.textFaint} style={{ marginBottom: 12 }} />
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Nenhum favorito ainda</div>
                      <div style={{ fontSize: 12.5, color: palette.textMuted, marginBottom: 16 }}>Clique na estrela de um treinamento para guardá-lo aqui.</div>
                      <button className="nexa-btn-ghost" type="button" onClick={() => setCatFilter("Todos")}>Ver todos os treinamentos</button>
                    </div>
                  )
                  : <EmptyCoursesState onShowAll={() => setCatFilter("Todos")} showAllAction={catFilter !== "Todos"} />}
            </>
          )}

          {/* ---------- USER: TRILHAS ---------- */}
          {mode === "app" && active === "trilhas" && (
            <>
              <div style={{ marginBottom: 18 }}>
                <h1 className="nexa-heading" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Trilhas de aprendizagem</h1>
                <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>Sequências completas de treinamentos organizadas por especialização</p>
              </div>

              <div className="nexa-grid-3" style={{ marginBottom: 28 }}>
                {trilhas.map((t, i) => (
                  <div
                    key={i}
                    className="nexa-card hoverable nexa-trilha-overview-card"
                    onClick={() => setSelectedTrilha(i)}
                    style={{ border: selectedTrilha === i ? `1px solid ${t.color}66` : undefined }}
                  >
                    {t.cover && <img className="nexa-trilha-cover" src={t.cover} alt="" />}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <Map size={18} color={t.color} />
                      {t.progress === 100 ? (
                        <span className="nexa-badge" style={{ background: `${palette.green}22`, color: palette.green }}>Concluída</span>
                      ) : (
                        <span className="nexa-badge" style={{ background: `${t.color}1A`, color: t.color }}>{t.modulos} módulos</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14.5, marginBottom: 6 }}>{t.title}</div>
                    <p style={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.5, marginBottom: 14, minHeight: 36 }}>{t.desc}</p>
                    <div className="nexa-progress-track"><div className="nexa-progress-fill" style={{ width: `${t.progress}%`, background: "#111" }} /></div>
                    <div style={{ fontSize: 11, color: palette.textFaint, marginTop: 6 }}>{t.progress}% concluído</div>
                  </div>
                ))}
              </div>

              {trilhaAtual ? (
                <div className="nexa-card" style={{ padding: "22px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div>
                      <div className="nexa-section-title">{trilhaAtual.title}</div>
                      <p style={{ fontSize: 12, color: palette.textMuted, marginTop: 4, maxWidth: 520 }}>{trilhaAtual.desc}</p>
                    </div>
                    <button className="nexa-btn-primary" onClick={() => abrirTrilha(trilhaAtual)}><Play size={14} fill="#fff" /> Continuar trilha</button>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <TrilhaTimeline steps={trilhaAtual.steps} />
                  </div>
                </div>
              ) : (
                <div className="nexa-card" style={{ padding: 24, color: palette.textMuted, fontSize: 13 }}>Nenhuma trilha cadastrada ainda.</div>
              )}
            </>
          )}

          {/* ---------- USER: CERTIFICADOS ---------- */}
          {mode === "app" && active === "certificados" && (
            <>
              <div style={{ marginBottom: 22 }}>
                <h1 className="nexa-heading" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Certificados</h1>
                <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>
                  Emitidos automaticamente ao concluir o treinamento com no mínimo <strong style={{ color: palette.textPrimary }}>{APROVEITAMENTO_MINIMO}% de aproveitamento</strong> nas atividades.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {meusTreinamentos.length === 0 && (
                  <div className="nexa-card" style={{ padding: 24, color: palette.textMuted, fontSize: 13 }}>
                    Você ainda não iniciou nenhum treinamento. Os certificados aparecem aqui conforme você avança.
                  </div>
                )}
                {meusTreinamentos.map((t, i) => {
                  const concluido = t.progresso >= 100;
                  const template = academyController.resolveCertificateTemplate(t, certificateTemplates);
                  const elegivel = concluido && t.aproveitamento !== null && t.aproveitamento >= (template?.minimumScore ?? APROVEITAMENTO_MINIMO) && Boolean(template);

                  return (
                    <div key={i} className="nexa-card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
                      <div
                        className="nexa-stat-icon"
                        style={{
                          width: 42, height: 42, flexShrink: 0,
                          background: t.emitido ? `${palette.purple}1A` : elegivel ? `${palette.green}1A` : concluido ? "rgba(242,199,68,0.12)" : "rgba(148,163,205,0.1)",
                          color: t.emitido ? palette.purple : elegivel ? palette.green : concluido ? palette.amber : palette.textFaint,
                        }}
                      >
                        {t.emitido ? <Award size={19} /> : concluido ? <CheckCircle2 size={19} /> : <Clock size={19} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif" }}>{t.titulo}</div>
                        <div style={{ fontSize: 11.5, color: palette.textFaint, marginTop: 2 }}>
                          {t.categoria} · {t.cargaHoraria}
                          {t.aproveitamento !== null && <> · Aproveitamento: <strong style={{ color: elegivel ? palette.green : palette.amber }}>{t.aproveitamento}%</strong></>}
                        </div>
                        {!concluido && (
                          <div style={{ marginTop: 8, maxWidth: 220 }}>
                            <div className="nexa-progress-track"><div className="nexa-progress-fill" style={{ width: `${t.progresso}%` }} /></div>
                          </div>
                        )}
                      </div>

                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        {t.emitido && (
                          <button className="nexa-btn-ghost" onClick={() => setCertificadoPreview(t)}>
                            <Award size={14} /> Ver certificado
                          </button>
                        )}
                        {!t.emitido && elegivel && (
                          <button className="nexa-btn-primary" onClick={() => emitirCertificado(i)}>
                            <Sparkles size={14} /> Emitir certificado
                          </button>
                        )}
                        {!t.emitido && concluido && !elegivel && (
                          <span style={{ fontSize: 11.5, color: palette.amber, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                            {!template ? "Modelo não configurado" : t.aproveitamento === null ? "Aguardando nota do quiz" : "Aproveitamento insuficiente"}
                          </span>
                        )}
                        {!concluido && (
                          <span style={{ fontSize: 11.5, color: palette.textFaint }}>{Math.round(t.progresso)}% concluído</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="nexa-card" style={{ padding: 16, marginTop: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Sparkles size={16} color={palette.purple} style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.6 }}>
                  A emissão é automática: assim que o treinamento atinge <strong style={{ color: palette.textPrimary }}>100% de progresso</strong> e a correção do quiz registra <strong style={{ color: palette.textPrimary }}>{APROVEITAMENTO_MINIMO}% ou mais</strong> de aproveitamento, o certificado interno da Hering fica disponível — sem necessidade de aprovação manual de um administrador.
                </p>
              </div>
            </>
          )}

          {mode === "app" && active === "configuracoes" && (
            <AdminPlaceholder title="Configurações" icon={Settings} />
          )}

          {/* ---------- USER: PERFIL ---------- */}
          {mode === "app" && active === "perfil" && (
            <>
              <div style={{ marginBottom: 22 }}>
                <h1 className="nexa-heading" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Meu perfil</h1>
                <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>Gerencie suas informações pessoais e segurança da conta</p>
              </div>

              <div className="nexa-grid-2col">
                {/* Coluna esquerda: dados + senha */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Dados pessoais */}
                  <div className="nexa-card" style={{ padding: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                      <div className="nexa-avatar" style={{ width: 72, height: 72, fontSize: 22 }}>
                        <AvatarConteudo nome={perfil?.nome || perfilEmail} foto={perfil?.avatar_url} />
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif" }}>{perfil?.nome}</div>
                        <div style={{ fontSize: 12, color: palette.textFaint }}>{perfilEmail}</div>
                        <input ref={fotoInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => trocarFoto(e.target.files?.[0])} />
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          <button className="nexa-btn-ghost" type="button" disabled={enviandoFoto} onClick={() => fotoInputRef.current?.click()}>
                            <Camera size={14} /> {enviandoFoto ? "Enviando..." : perfil?.avatar_url ? "Trocar foto" : "Enviar foto"}
                          </button>
                          {perfil?.avatar_url && <button className="nexa-btn-ghost" type="button" disabled={enviandoFoto} onClick={() => trocarFoto(null)}><Trash2 size={14} /> Remover</button>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>Nome completo</label>
                        <input
                          value={perfilNome}
                          onChange={(e) => { setPerfilNome(e.target.value); setPerfilSalvo(false); }}
                          style={{ width: "100%", background: palette.bgPanel, border: `1px solid ${palette.border}`, borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13, outline: "none" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>Cargo</label>
                        <input
                          value={perfilCargo}
                          onChange={(e) => { setPerfilCargo(e.target.value); setPerfilSalvo(false); }}
                          style={{ width: "100%", background: palette.bgPanel, border: `1px solid ${palette.border}`, borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13, outline: "none" }}
                        />
                      </div>
                    </div>

                    <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>E-mail</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: palette.bgPanel, border: `1px solid ${palette.border}`, borderRadius: 9, padding: "9px 12px", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: palette.textFaint, flex: 1 }}>{perfilEmail}</span>
                      <Lock size={13} color={palette.textFaint} />
                    </div>
                    <div style={{ fontSize: 11, color: palette.textFaint, marginBottom: 18 }}>
                      O e-mail é vinculado à sua conta e não pode ser alterado por aqui.
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                      {perfilSalvo && <span style={{ fontSize: 11.5, color: palette.green, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={13} /> Alterações salvas</span>}
                      <button className="nexa-btn-primary" onClick={salvarPerfil}>Salvar alterações</button>
                    </div>
                  </div>

                  {/* Alterar senha */}
                  <div className="nexa-card" style={{ padding: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Lock size={15} color={palette.purple} />
                      <span className="nexa-section-title">Alterar senha</span>
                    </div>
                    <p style={{ fontSize: 12, color: palette.textMuted, marginBottom: 16 }}>Use uma senha com no mínimo 8 caracteres.</p>

                    <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>Senha atual</label>
                    <input
                      type="password"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      style={{ width: "100%", background: palette.bgPanel, border: `1px solid ${palette.border}`, borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13, outline: "none", marginBottom: 14 }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 6 }}>
                      <div>
                        <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>Nova senha</label>
                        <input
                          type="password"
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                          style={{ width: "100%", background: palette.bgPanel, border: `1px solid ${tentouSalvarSenha && !novaSenhaValida ? "#F2596B" : palette.border}`, borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13, outline: "none" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>Confirmar nova senha</label>
                        <input
                          type="password"
                          value={confirmarSenha}
                          onChange={(e) => setConfirmarSenha(e.target.value)}
                          style={{ width: "100%", background: palette.bgPanel, border: `1px solid ${tentouSalvarSenha && !senhasConferem ? "#F2596B" : palette.border}`, borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13, outline: "none" }}
                        />
                      </div>
                    </div>

                    <div style={{ minHeight: 18, marginBottom: 10 }}>
                      {tentouSalvarSenha && !novaSenhaValida && <div style={{ fontSize: 11.5, color: "#F2596B" }}>A nova senha precisa ter no mínimo 8 caracteres.</div>}
                      {tentouSalvarSenha && novaSenhaValida && !senhasConferem && <div style={{ fontSize: 11.5, color: "#F2596B" }}>As senhas não coincidem.</div>}
                      {senhaSalva && <div style={{ fontSize: 11.5, color: palette.green, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={13} /> Senha atualizada com sucesso</div>}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button className="nexa-btn-primary" onClick={salvarSenha}>Atualizar senha</button>
                    </div>
                  </div>
                </div>

                {/* Coluna direita: resumo + favoritos */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="nexa-grid-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <StatCard icon={GraduationCap} label="Em andamento" value={meuResumo?.em_andamento ?? 0} color={palette.cyan} />
                    <StatCard icon={Award} label="Certificados" value={meuResumo?.certificados ?? 0} color={palette.purple} />
                  </div>

                  <div className="nexa-card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Star size={15} color={palette.amber} />
                      <span className="nexa-section-title">Treinamentos favoritos</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {favoritos.length === 0 && (
                        <div style={{ fontSize: 12, color: palette.textMuted }}>Marque treinamentos com a estrela na página do curso para vê-los aqui.</div>
                      )}
                      {favoritos.map((c) => {
                        const Icon = c.icon;
                        return (
                          <div key={c.id} className="nexa-side-item" style={{ cursor: "pointer" }} onClick={() => abrirCurso(c.id)}>
                            <div className="nexa-favorite-cover" style={{ background: `linear-gradient(135deg, ${c.grad[0]}, ${c.grad[1]})` }}>
                              {c.cover
                                ? <img src={c.cover} alt={`Capa do curso ${c.title}`} />
                                : <Icon size={15} color="#fff" />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12.5 }}>{c.title}</div>
                              <div style={{ fontSize: 11, color: palette.textFaint }}>{c.cat}</div>
                            </div>
                            <Star size={14} color={palette.amber} fill={palette.amber} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="nexa-card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <ShieldCheck size={15} color={palette.cyan} />
                      <span className="nexa-section-title">Conta da plataforma</span>
                    </div>
                    <p style={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.5 }}>
                      Seu perfil de aprendizagem e o acesso aos treinamentos são gerenciados pelo time administrativo da Nexa Academy.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---------- ADMIN: DASHBOARD ---------- */}
          {mode === "admin" && adminActive === "admin-dashboard" && (
            <>
              <div style={{ marginBottom: 22 }}>
                <h1 className="nexa-heading" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Painel Administrativo</h1>
                <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>Visão geral da plataforma Nexa Academy</p>
              </div>

              <div className="nexa-grid-4" style={{ marginBottom: 18 }}>
                <StatCard icon={Users} label="Usuários" value={adminResumo?.usuarios ?? 0} color={palette.cyan} />
                <StatCard icon={GraduationCap} label="Treinamentos ativos" value={adminResumo?.treinamentos_ativos ?? 0} color={palette.blue} />
                <StatCard icon={CheckCircle2} label="Concluídos" value={adminResumo?.concluidos ?? 0} color={palette.green} />
                <StatCard icon={Award} label="Certificados emitidos" value={adminResumo?.certificados ?? 0} color={palette.purple} />
              </div>

              <div className="nexa-grid-2col">
                <div className="nexa-card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span className="nexa-section-title">Horas de treinamento por mês</span>
                    {variacaoMensal !== null && (
                      <span style={{ fontSize: 11.5, color: variacaoMensal >= 0 ? palette.green : "#F2596B", display: "flex", alignItems: "center", gap: 4 }}>
                        <TrendingUp size={13} /> {variacaoMensal >= 0 ? "+" : ""}{variacaoMensal}% vs. mês anterior
                      </span>
                    )}
                  </div>
                  <div className="nexa-bar-wrap">
                    {monthlyHours.map((m, i) => (
                      <div key={i} title={`${m.horas}h`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: "100%", display: "flex", alignItems: "flex-end", height: 90 }}>
                          <div className="nexa-bar" style={{ height: `${m.v}%`, opacity: i === monthlyHours.length - 1 ? 1 : 0.65 }} />
                        </div>
                        <span className="nexa-bar-label">{m.mes}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="nexa-card" style={{ padding: 20 }}>
                  <div className="nexa-section-title" style={{ marginBottom: 14 }}>Cursos mais acessados</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {topCourses.length === 0 && <div style={{ fontSize: 12, color: palette.textMuted }}>Nenhum acesso registrado ainda.</div>}
                    {topCourses.map((c, i) => (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                          <span>{c.name}</span>
                          <span style={{ color: palette.textFaint }}>{c.acessos}</span>
                        </div>
                        <div className="nexa-progress-track"><div className="nexa-progress-fill" style={{ width: `${(c.acessos / maxAcessos) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </>
          )}

          {/* ---------- ADMIN: USUÁRIOS ---------- */}
          {mode === "admin" && adminActive === "admin-usuarios" && (
            <>
              <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 className="nexa-heading" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Usuários</h1>
                  <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>{adminUsers.length} colaboradores cadastrados na plataforma</p>
                </div>
                <button className="nexa-btn-primary" onClick={() => setShowCadastroModal(true)}><PlusCircle size={15} /> Cadastrar usuário</button>
              </div>
              <div className="nexa-card" style={{ padding: 18 }}>
                <table className="nexa-table">
                  <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Último acesso</th><th></th></tr></thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="nexa-avatar" style={{ width: 26, height: 26, fontSize: 10 }}><AvatarConteudo nome={u.name} foto={u.foto} /></div>
                            {u.name}
                          </div>
                        </td>
                        <td style={{ color: palette.textMuted }}>{u.email}</td>
                        <td>{u.perfil}</td>
                        <td><span className="nexa-status-dot" style={{ background: u.status === "ativo" ? palette.green : palette.textFaint }} />{u.status === "ativo" ? "Ativo" : "Inativo"}</td>
                        <td style={{ color: palette.textFaint }}>{u.acesso}</td>
                        <td style={{ position: "relative", textAlign: "right" }}>
                          {u.id !== userId && (
                            <button
                              type="button"
                              onClick={() => setMenuUsuarioId(menuUsuarioId === u.id ? null : u.id)}
                              style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", borderRadius: 6 }}
                              aria-label="Ações do usuário"
                            >
                              <MoreHorizontal size={15} color={palette.textFaint} />
                            </button>
                          )}
                          {menuUsuarioId === u.id && (
                            <>
                              <div onClick={() => setMenuUsuarioId(null)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                              <div style={{ position: "absolute", top: "100%", right: 8, marginTop: 4, background: palette.bgPanel, border: `1px solid ${palette.borderStrong}`, borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.15)", minWidth: 190, zIndex: 41, overflow: "hidden" }}>
                                <button
                                  type="button"
                                  onClick={() => alterarUsuario(u, { perfil: u.perfilDb === "administrador" ? "usuario" : "administrador" })}
                                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", color: palette.textPrimary, padding: "9px 12px", fontSize: 12.5, cursor: "pointer", textAlign: "left" }}
                                >
                                  <Shield size={13} color={palette.cyan} /> {u.perfilDb === "administrador" ? "Tornar usuário" : "Tornar administrador"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => alterarUsuario(u, { status: u.status === "ativo" ? "inativo" : "ativo" })}
                                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", color: u.status === "ativo" ? "#F2596B" : palette.textPrimary, padding: "9px 12px", fontSize: 12.5, cursor: "pointer", textAlign: "left", borderTop: `1px solid ${palette.border}` }}
                                >
                                  {u.status === "ativo" ? <><X size={13} /> Desativar acesso</> : <><CheckCircle2 size={13} /> Reativar acesso</>}
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ---------- ADMIN: TREINAMENTOS ---------- */}
          {mode === "admin" && adminActive === "admin-treinamentos" && (
            <>
              <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 className="nexa-heading" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Treinamentos</h1>
                  <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>{adminTrainings.length} treinamentos cadastrados na plataforma</p>
                </div>
                <button className="nexa-btn-primary" onClick={abrirNovoTreino}><PlusCircle size={15} /> Novo treinamento</button>
              </div>
              <div className="nexa-card" style={{ padding: 18 }}>
                <table className="nexa-table">
                  <thead><tr><th>Título</th><th>Categoria</th><th>Nível</th><th>Duração</th><th>Alunos</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {adminTrainings.map((t, i) => {
                      const Icon = t.icon;
                      return (
                        <tr key={i}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${t.grad[0]}, ${t.grad[1]})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Icon size={14} color="#fff" />
                              </div>
                              <span style={{ fontWeight: 500 }}>{t.title}</span>
                            </div>
                          </td>
                          <td style={{ color: palette.textMuted }}>{t.cat}</td>
                          <td>{t.level}</td>
                          <td style={{ color: palette.textMuted }}>{t.dur}</td>
                          <td>{t.alunos}</td>
                          <td><span className="nexa-status-dot" style={{ background: t.status === "ativo" ? palette.green : palette.textFaint }} />{t.status === "ativo" ? "Ativo" : "Inativo"}</td>
                          <td style={{ position: "relative", textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setMenuTreinoIdx(menuTreinoIdx === i ? null : i); }}
                              style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", borderRadius: 6 }}
                              aria-label="Ações"
                            >
                              <MoreHorizontal size={15} color={palette.textFaint} />
                            </button>
                            {menuTreinoIdx === i && (
                              <>
                                <div
                                  onClick={() => setMenuTreinoIdx(null)}
                                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                                />
                                <div
                                  style={{
                                    position: "absolute", top: "100%", right: 8, marginTop: 4,
                                    background: palette.bgPanel, border: `1px solid ${palette.borderStrong}`,
                                    borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                                    minWidth: 150, zIndex: 41, overflow: "hidden",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => editarTreinamento(i)}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                                      background: "transparent", border: "none", color: palette.textPrimary,
                                      padding: "9px 12px", fontSize: 12.5, cursor: "pointer", textAlign: "left",
                                    }}
                                  >
                                    <Settings size={13} color={palette.cyan} /> Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => excluirTreinamento(i)}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                                      background: "transparent", border: "none", color: "#F2596B",
                                      padding: "9px 12px", fontSize: 12.5, cursor: "pointer", textAlign: "left",
                                      borderTop: `1px solid ${palette.border}`,
                                    }}
                                  >
                                    <X size={13} /> Excluir
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ---------- ADMIN: CERTIFICADOS ---------- */}
          {mode === "admin" && adminActive === "admin-certificados" && (
            <AdminCertificatesView
              courseTitles={certificateCourseTitles}
              templates={certificateTemplates}
              onCreate={adicionarModeloCertificado}
              onPreview={visualizarModeloCertificado}
              onRemove={removerModeloCertificado}
              onToggleStatus={alternarStatusModeloCertificado}
            />
          )}

          {/* ---------- ADMIN: TRILHAS ---------- */}
          {mode === "admin" && adminActive === "admin-trilhas" && <AdminTrilhasView trainings={adminTrainings} />}

          {/* ---------- ADMIN: outras seções (placeholder) ---------- */}
          {mode === "admin" && !["admin-dashboard", "admin-usuarios", "admin-treinamentos", "admin-certificados", "admin-trilhas"].includes(adminActive) && (
            <AdminPlaceholder
              title={adminNavFlat.find((n) => n.key === adminActive)?.label || ""}
              icon={adminNavFlat.find((n) => n.key === adminActive)?.icon || Folder}
            />
          )}
        </div>
      </main>

      {/* Modal: Certificado emitido */}
      {certificadoPreview && certificadoTemplatePreview && (
        <CertificatePreviewModal
          recipientName={perfil?.nome ?? ""}
          template={certificadoTemplatePreview}
          training={certificadoPreview}
          onClose={() => setCertificadoPreview(null)}
        />
      )}

      {/* Modal: Cadastrar usuário */}
      {showCadastroModal && (
        <div
          style={{
            position: "absolute", inset: 0, background: "rgba(3,6,14,0.65)",
            backdropFilter: "blur(3px)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={resetCadastro}
        >
          <div
            className="nexa-card"
            style={{ width: 380, padding: 22, border: "1px solid rgba(155,107,255,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span className="nexa-section-title">Cadastrar usuário</span>
              <X size={16} style={{ cursor: "pointer", color: palette.textMuted }} onClick={resetCadastro} />
            </div>
            <p style={{ fontSize: 12, color: palette.textMuted, marginBottom: 18 }}>
              Apenas e-mails corporativos <strong style={{ color: palette.textPrimary }}>{DOMINIO_PERMITIDO}</strong> podem ser cadastrados. O colaborador receberá um link por e-mail para acessar e definir a senha.
            </p>

            <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>Nome completo</label>
            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Ex: Alani Rigotti de Oliveira"
              style={{
                width: "100%", background: palette.bgPanel, border: `1px solid ${palette.border}`,
                borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13,
                outline: "none", marginBottom: 14,
              }}
            />

            <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>E-mail corporativo</label>
            <input
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="nome@ciahering.com.br"
              style={{
                width: "100%", background: palette.bgPanel,
                border: `1px solid ${tentouEnviar && !emailValido ? "#F2596B" : palette.border}`,
                borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13,
                outline: "none", marginBottom: 6,
              }}
            />
            <div style={{ minHeight: 18, marginBottom: 14 }}>
              {tentouEnviar && !emailValido && (
                <span style={{ fontSize: 11.5, color: "#F2596B" }}>
                  Use um e-mail corporativo válido, terminado em {DOMINIO_PERMITIDO}
                </span>
              )}
              {!tentouEnviar && novoEmail.length > 0 && emailValido && (
                <span style={{ fontSize: 11.5, color: palette.green, display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={12} /> Domínio corporativo válido
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button className="nexa-btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={resetCadastro}>Cancelar</button>
              <button
                className="nexa-btn-primary"
                style={{ flex: 1, justifyContent: "center", opacity: podeEnviar ? 1 : 0.5, cursor: podeEnviar ? "pointer" : "not-allowed" }}
                onClick={cadastrarUsuario}
                disabled={enviandoCadastro}
              >
                {enviandoCadastro ? "Enviando..." : "Enviar convite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo treinamento */}
      {showTreinamentoModal && (
        <div
          style={{
            position: "absolute", inset: 0, background: "rgba(3,6,14,0.65)",
            backdropFilter: "blur(3px)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={resetTreinoModal}
        >
          <div
            className="nexa-card nexa-scroll"
            style={{ width: 560, maxHeight: "88vh", overflowY: "auto", padding: 22, border: "1px solid rgba(45,212,232,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span className="nexa-section-title">{editandoTreinoIdx !== null ? "Editar treinamento" : "Novo treinamento"}</span>
              <X size={16} style={{ cursor: "pointer", color: palette.textMuted }} onClick={resetTreinoModal} />
            </div>
            <p style={{ fontSize: 12, color: palette.textMuted, marginBottom: 18 }}>
              Cadastre um novo treinamento na Nexa Academy. Ele ficará imediatamente disponível para o time.
            </p>

            <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>Título</label>
            <input
              value={novoTreino.title}
              onChange={(e) => setNovoTreino({ ...novoTreino, title: e.target.value })}
              placeholder="Ex: Blue Prism Avançado"
              style={{
                width: "100%", background: palette.bgPanel,
                border: `1px solid ${tentouSalvarTreino && !tituloTreinoValido ? "#F2596B" : palette.border}`,
                borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13,
                outline: "none", marginBottom: 14,
              }}
            />

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>Categoria</label>
                <select
                  value={novoTreino.cat}
                  onChange={(e) => setNovoTreino({ ...novoTreino, cat: e.target.value })}
                  style={{
                    width: "100%", background: palette.bgPanel, border: `1px solid ${palette.border}`,
                    borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13, outline: "none",
                  }}
                >
                  <option value="">Sem categoria</option>
                  {categoriasDb.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  <option value={NOVA_CATEGORIA}>+ Criar nova categoria</option>
                </select>
                {criandoCategoria && (
                  <input
                    autoFocus
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    placeholder="Nome da nova categoria"
                    style={{
                      width: "100%", marginTop: 8, background: palette.bgPanel,
                      border: `1px solid ${tentouSalvarTreino && !categoriaValida ? "#F2596B" : palette.border}`,
                      borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13, outline: "none",
                    }}
                  />
                )}
                {criandoCategoria && tentouSalvarTreino && !categoriaValida && (
                  <div style={{ marginTop: 4, color: "#F2596B", fontSize: 11 }}>Informe o nome da categoria.</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>Nível</label>
                <select
                  value={novoTreino.level}
                  onChange={(e) => setNovoTreino({ ...novoTreino, level: e.target.value })}
                  style={{
                    width: "100%", background: palette.bgPanel, border: `1px solid ${palette.border}`,
                    borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13, outline: "none",
                  }}
                >
                  {["Básico", "Intermediário", "Avançado"].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ width: 110 }}>
                <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>Duração</label>
                <input
                  value={novoTreino.dur}
                  onChange={(e) => setNovoTreino({ ...novoTreino, dur: e.target.value })}
                  placeholder="2h30"
                  style={{
                    width: "100%", background: palette.bgPanel,
                    border: `1px solid ${tentouSalvarTreino && !duracaoTreinoValida ? "#F2596B" : palette.border}`,
                    borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13, outline: "none",
                  }}
                />
              </div>
            </div>

            <label style={{ fontSize: 11.5, color: palette.textMuted, display: "block", marginBottom: 6 }}>Descrição (opcional)</label>
            <textarea
              value={novoTreino.desc}
              onChange={(e) => setNovoTreino({ ...novoTreino, desc: e.target.value })}
              placeholder="Do que se trata este treinamento?"
              rows={3}
              style={{
                width: "100%", background: palette.bgPanel, border: `1px solid ${palette.border}`,
                borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13,
                outline: "none", marginBottom: 6, resize: "vertical", fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 0 10px" }}>
              <span className="nexa-section-title">Conteúdo do treinamento</span>
              <button
                type="button"
                onClick={addModulo}
                style={{
                  display: "flex", alignItems: "center", gap: 5, background: "transparent",
                  border: `1px solid ${palette.borderStrong}`, color: palette.cyan,
                  padding: "5px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                }}
              >
                <PlusCircle size={13} /> Adicionar módulo
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 10 }}>
              {novoTreino.modulos.map((m, mIdx) => {
                const moduloInvalido = tentouSalvarTreino && m.titulo.trim().length === 0;
                return (
                  <div
                    key={mIdx}
                    style={{
                      background: palette.bgPanel, border: `1px solid ${palette.border}`,
                      borderRadius: 12, padding: 14,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <Layers size={14} color={palette.purple} />
                      <input
                        value={m.titulo}
                        onChange={(e) => updateModulo(mIdx, { titulo: e.target.value })}
                        placeholder={`Módulo ${mIdx + 1}`}
                        style={{
                          flex: 1, background: "transparent",
                          border: "none", borderBottom: `1px solid ${moduloInvalido ? "#F2596B" : palette.border}`,
                          color: palette.textPrimary, fontSize: 13.5, fontWeight: 600,
                          padding: "4px 2px", outline: "none", fontFamily: "'Space Grotesk',sans-serif",
                        }}
                      />
                      {novoTreino.modulos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeModulo(mIdx)}
                          style={{ background: "transparent", border: "none", color: palette.textFaint, cursor: "pointer", padding: 2 }}
                          aria-label="Remover módulo"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 68, height: 44, borderRadius: 8,
                          background: m.imagem ? `url(${m.imagem}) center/cover` : "rgba(148,163,205,0.08)",
                          border: `1px dashed ${palette.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, color: palette.textFaint,
                        }}
                      >
                        {!m.imagem && <FileText size={16} />}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: palette.textMuted }}>Imagem do módulo (opcional)</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <label
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              background: "transparent", border: `1px solid ${palette.border}`,
                              color: palette.textPrimary, padding: "5px 10px", borderRadius: 7,
                              fontSize: 11.5, cursor: "pointer",
                            }}
                          >
                            <PlusCircle size={12} color={palette.cyan} />
                            {m.imagem ? "Trocar imagem" : "Enviar imagem"}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const file = e.target.files && e.target.files[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => updateModulo(mIdx, { imagem: String(reader.result || "") });
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                          {m.imagem && (
                            <button
                              type="button"
                              onClick={() => updateModulo(mIdx, { imagem: "" })}
                              style={{
                                background: "transparent", border: "none", color: palette.textFaint,
                                fontSize: 11.5, cursor: "pointer", padding: "5px 6px",
                              }}
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12, padding: "10px 12px", background: palette.bgCard, border: `1px solid ${palette.border}`, borderRadius: 9 }}>
                      <LessonMaterialsEditor
                        titulo="Materiais do módulo"
                        descricao="Aparecem em “Materiais da aula” em todas as aulas deste módulo."
                        materiais={m.materiais ?? []}
                        onChange={(materiais) => updateModulo(mIdx, { materiais })}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {m.itens.map((it, iIdx) => {
                        const tipoInvalido = tentouSalvarTreino && it.titulo.trim().length === 0;
                        const textoInvalido = tentouSalvarTreino && it.tipo === "texto" && it.texto.trim().length === 0;
                        const TipoIcon = tiposConteudo.find((t) => t.value === it.tipo)?.icon || BookOpen;
                        return (
                          <div
                            key={iIdx}
                            style={{
                              background: palette.bgCard, border: `1px solid ${palette.border}`,
                              borderRadius: 9, padding: 10,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, color: palette.textMuted, fontSize: 11 }}>
                                <TipoIcon size={12} color={palette.cyan} />
                                <span>Item {iIdx + 1}</span>
                              </div>
                              {m.itens.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(mIdx, iIdx)}
                                  style={{ background: "transparent", border: "none", color: palette.textFaint, cursor: "pointer", padding: 2 }}
                                  aria-label="Remover item"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                              <select
                                value={it.tipo}
                                onChange={(e) => updateItem(mIdx, iIdx, { tipo: e.target.value })}
                                style={{
                                  width: 120, background: palette.bgPanel, border: `1px solid ${palette.border}`,
                                  borderRadius: 7, padding: "7px 8px", color: palette.textPrimary, fontSize: 12, outline: "none",
                                }}
                              >
                                {tiposConteudo.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                              <input
                                value={it.titulo}
                                onChange={(e) => updateItem(mIdx, iIdx, { titulo: e.target.value })}
                                placeholder="Título do item"
                                style={{
                                  flex: 1, background: palette.bgPanel,
                                  border: `1px solid ${tipoInvalido ? "#F2596B" : palette.border}`,
                                  borderRadius: 7, padding: "7px 8px", color: palette.textPrimary, fontSize: 12, outline: "none",
                                }}
                              />
                            </div>
                            {it.tipo === "texto" ? (
                              <textarea
                                value={it.texto}
                                onChange={(e) => updateItem(mIdx, iIdx, { texto: e.target.value })}
                                placeholder="Escreva o conteúdo (markdown suportado)..."
                                rows={4}
                                style={{
                                  width: "100%", background: palette.bgPanel,
                                  border: `1px solid ${textoInvalido ? "#F2596B" : palette.border}`,
                                  borderRadius: 7, padding: "8px 10px", color: palette.textPrimary, fontSize: 12,
                                  outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5,
                                }}
                              />
                            ) : (
                              <input
                                value={it.url}
                                onChange={(e) => updateItem(mIdx, iIdx, { url: e.target.value })}
                                placeholder={
                                  it.tipo === "video" ? "URL do vídeo (YouTube, Vimeo...)" :
                                  it.tipo === "doc" ? "URL do documento (PDF, Drive...)" :
                                  it.tipo === "quiz" ? "Link do quiz (opcional)" :
                                  "URL da aula (opcional)"
                                }
                                style={{
                                  width: "100%", background: palette.bgPanel, border: `1px solid ${palette.border}`,
                                  borderRadius: 7, padding: "7px 8px", color: palette.textPrimary, fontSize: 12, outline: "none",
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => addItem(mIdx)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          background: "transparent", border: `1px dashed ${palette.border}`,
                          color: palette.textMuted, padding: "6px 10px", borderRadius: 8,
                          fontSize: 11.5, cursor: "pointer",
                        }}
                      >
                        <PlusCircle size={12} /> Adicionar conteúdo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ minHeight: 18, marginBottom: 10 }}>
              {tentouSalvarTreino && !podeSalvarTreino && (
                <span style={{ fontSize: 11.5, color: "#F2596B" }}>
                  Preencha o título e a duração do treinamento, o nome de cada módulo e o título/texto de cada conteúdo.
                </span>
              )}
            </div>


            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button className="nexa-btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={resetTreinoModal}>Cancelar</button>
              <button
                className="nexa-btn-primary"
                style={{ flex: 1, justifyContent: "center", opacity: podeSalvarTreino ? 1 : 0.5, cursor: podeSalvarTreino ? "pointer" : "not-allowed" }}
                onClick={salvarTreinamento}
                disabled={salvandoTreino}
              >
                {salvandoTreino ? "Salvando..." : editandoTreinoIdx !== null ? "Salvar alterações" : "Cadastrar treinamento"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
