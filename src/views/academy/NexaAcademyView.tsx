// Legacy JSX markup is intentionally retained verbatim while domain rules are typed in MVC services.
// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { academyController } from "@/controllers/academy-controller";
import { CORPORATE_EMAIL_DOMAIN } from "@/services/user-service";
import { MINIMUM_CERTIFICATE_SCORE } from "@/services/certificate-service";
import { theme as palette } from "@/styles/theme";
import CourseDetailView from "@/views/academy/components/CourseDetailView";
import LessonDetailView from "@/views/academy/components/LessonDetailView";
import AdminCertificatesView from "@/views/academy/components/AdminCertificatesView";
import AdminVideosView from "@/views/academy/components/AdminVideosView";
import CertificatePreviewModal from "@/views/academy/components/CertificatePreviewModal";
import { defaultCertificateTemplates } from "@/mocks/certificate-templates";
import {
  LayoutDashboard, GraduationCap, Map, FileText, Award, Sparkles,
  User, Settings, Search, Bell, ChevronRight, Play, Clock, Flame,
  CheckCircle2, Lock, Star, X, Send, BookOpen, Code2, Workflow,
  Database, Network, Cpu, ShieldCheck, Users, Layers, Video,
  HelpCircle, ScrollText, Shield, ArrowLeft, TrendingUp, Minus,
  PlusCircle, Folder, ListChecks, MessageCircle, LogOut, ArrowUp
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
    font-size: 12px; font-weight:700; flex-shrink:0;
  }
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

  /* Right column items */
  .nexa-side-item { display:flex; gap:10px; padding: 10px; border-radius:10px; align-items:flex-start; }
  .nexa-side-item:hover { background: rgba(148,163,205,0.06); }

  /* Nexa AI floating */
  .nexa-fab {
    position:absolute; bottom: 26px; right: 30px;
    width: 56px; height:56px; border-radius:50%;
    background: linear-gradient(135deg, ${palette.purple}, ${palette.cyan});
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; box-shadow: 0 0 0 0 rgba(155,107,255,0.5), 0 6px 24px rgba(110,63,217,0.45);
    animation: nexaPulse 2.6s infinite;
    z-index: 50;
    border: none;
  }
  @keyframes nexaPulse {
    0% { box-shadow: 0 0 0 0 rgba(155,107,255,0.45), 0 6px 24px rgba(110,63,217,0.4); }
    70% { box-shadow: 0 0 0 14px rgba(155,107,255,0), 0 6px 24px rgba(110,63,217,0.4); }
    100% { box-shadow: 0 0 0 0 rgba(155,107,255,0), 0 6px 24px rgba(110,63,217,0.4); }
  }

  .nexa-chat-panel {
    position:absolute; bottom: 22px; right: 24px;
    width: min(520px, calc(100% - 48px)); height: min(460px, calc(100% - 44px));
    background: #fff; border: 1px solid #e5e5e5; border-radius: 0;
    box-shadow: 0 18px 55px rgba(0,0,0,.18);
    z-index: 51;
    display:flex; flex-direction:column;
    overflow:hidden;
  }
  .nexa-chat-header {
    display:flex; align-items:center; justify-content:space-between;
    height: 62px; flex: 0 0 62px; padding: 0 18px 0 14px;
    background: #050505; color: #fff;
  }
  .nexa-chat-brand { display:flex; align-items:center; gap:10px; }
  .nexa-chat-avatar { width:34px; height:34px; border-radius:50%; background:#fff; overflow:hidden; display:grid; place-items:center; }
  .nexa-chat-avatar img { width:100%; height:100%; object-fit:cover; }
  .nexa-chat-title { font-size:17px; font-weight:700; letter-spacing:-.02em; }
  .nexa-chat-menu { width:34px; height:34px; padding:0; border:0; border-radius:50%; background:transparent; color:#fff; cursor:pointer; display:grid; place-items:center; }
  .nexa-chat-menu:hover { background: rgba(255,255,255,.12); }
  .nexa-chat-body { padding: 14px 18px; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; color:#111; }
  .nexa-chat-message { display:flex; align-items:flex-start; gap:10px; }
  .nexa-chat-message-avatar { width:22px; height:22px; flex:0 0 22px; border-radius:50%; overflow:hidden; margin-top:16px; }
  .nexa-chat-message-avatar img { width:100%; height:100%; object-fit:cover; }
  .nexa-bubble-ai {
    background: #f1f4f8; border:0; border-radius: 14px 14px 14px 0;
    padding: 12px 15px; font-size:15px; color:#0d0d0d; max-width:100%; line-height:1.3;
  }
  .nexa-bubble-user {
    background:#111; border-radius:14px 14px 0 14px; padding:10px 14px;
    font-size:14px; align-self:flex-end; max-width:80%; color:#fff;
  }
  .nexa-chat-meta { margin:6px 0 0 2px; color:#667085; font-size:12px; }
  .nexa-chat-input { margin: 0 12px 12px; min-height:68px; display:flex; align-items:flex-end; gap:6px; padding: 11px 8px 10px 14px; border:2px solid #111; border-radius:22px; }
  .nexa-chat-input input {
    flex:1; align-self:flex-start; background:transparent; border:0; padding:0; color:#111; font-size:15px; outline:none;
  }
  .nexa-chat-input input::placeholder { color:#98a2b3; }
  .nexa-chat-send { width:32px; height:32px; flex:0 0 32px; border:0; border-radius:50%; background:#e8edf3; color:#a4adba; display:grid; place-items:center; cursor:pointer; }
  @media (max-width: 760px) {
    .nexa-chat-panel { inset:auto 12px 12px 12px; width:auto; height:min(420px, calc(100% - 24px)); border:1px solid #e5e5e5; }
    .nexa-chat-header { height:58px; flex-basis:58px; }
    .nexa-chat-title { font-size:16px; }
    .nexa-chat-input { min-height:64px; }
  }

  .nexa-pill {
    font-size:12px; padding: 6px 13px; border-radius:999px; cursor:pointer;
    border:1px solid #dcdcdc; color:#444; background:#fff; white-space:nowrap;
    transition:background .15s ease,border-color .15s ease,color .15s ease;
  }
  .nexa-pill:hover { background:#f3f3f3; border-color:#c9c9c9; color:#111; }
  .nexa-pill.active {
    background:#111; border-color:#111; color:#fff;
  }

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
  .nexa-sidebar-footer { border: 0; gap: 18px; }
  .nexa-mode-switch { color: #111 !important; background: #fff !important; border-color: #ddd !important; min-height: 48px; }
  .nexa-avatar { color: #111; background: #f7f7f7; border: 1px solid #d7d7d7; }
  .nexa-topbar { min-height: 94px; padding: 18px 32px 16px 40px; border-bottom-color: #e9e9e9; background: rgba(248,248,248,.92); }
  .nexa-search { width: min(526px, 52vw); height: 58px; padding: 0 22px; gap: 16px; border-radius: 12px; background: #fff; border-color: #e1e1e1; color: #666; font-size: 14px; }
  .nexa-topbar-icons { gap: 22px; }
  .nexa-topbar-bell { display: flex; align-items: center; justify-content: center; color: #111; }
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
  .nexa-fab { background: #111; box-shadow: 0 6px 24px rgba(0,0,0,.2); animation: none; }

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
  { key: "docs", label: "Documentações", icon: FileText },
  { key: "certificados", label: "Certificados", icon: Award },
  { key: "nexa", label: "Nexa IA", icon: Sparkles },
];

const adminNavItems = [
  { key: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "admin-usuarios", label: "Usuários", icon: Users },
  { key: "admin-treinamentos", label: "Treinamentos", icon: GraduationCap },
  { key: "admin-categorias", label: "Categorias", icon: Folder },
  { key: "admin-trilhas", label: "Trilhas", icon: Map },
  { key: "admin-aulas", label: "Aulas", icon: BookOpen },
  { key: "admin-docs", label: "Documentações", icon: FileText },
  { key: "admin-videos", label: "Vídeos", icon: Video },
  { key: "admin-quizzes", label: "Quizzes", icon: HelpCircle },
  { key: "admin-certificados", label: "Certificados", icon: Award },
  { key: "admin-notificacoes", label: "Notificações", icon: Bell },
  { key: "admin-config", label: "Configurações", icon: Settings },
];

/* ---------------- Mock data ---------------- */
const courses = [
  { title: "Blue Prism Avançado", cat: "Blue Prism", level: "Avançado", dur: "3h20", progress: 64, icon: Workflow, grad: ["#3D6BFF", "#2DD4E8"], cover: "/course-blue-prism-advanced.png" },
  { title: "Work Queues na prática", cat: "Blue Prism", level: "Intermediário", dur: "1h45", progress: 20, icon: Database, grad: ["#9B6BFF", "#3D6BFF"], cover: "/course-work-queues.png" },
  { title: "Python para Automação", cat: "Python", level: "Intermediário", dur: "4h10", progress: 0, icon: Code2, grad: ["#2DD4E8", "#6E3FD9"], cover: "/course-python-automation.png" },
  { title: "APIs REST com FastAPI", cat: "APIs", level: "Avançado", dur: "2h50", progress: 0, icon: Network, grad: ["#3D6BFF", "#9B6BFF"], cover: "/course-api-cover.png" },
  { title: "Fundamentos de Power Automate", cat: "Power Automate", level: "Básico", dur: "2h05", progress: 100, icon: Cpu, grad: ["#2DD4E8", "#3D6BFF"], cover: "/course-power-automate.png" },
  { title: "Boas Práticas de Governança", cat: "Boas Práticas", level: "Básico", dur: "1h10", progress: 0, icon: ShieldCheck, grad: ["#9B6BFF", "#2DD4E8"], cover: "/course-governance.png" },
];

const categories = ["Todos", "Blue Prism", "Power Automate", "Python", "Integrações", "SQL", "APIs", "SAP", "IA"];

const trilhas = [
  {
    title: "Onboarding RPA",
    desc: "Trilha de integração para novos colaboradores do time de RPA, dos fundamentos ao projeto final.",
    color: palette.cyan,
    modulos: 7,
    progress: 43,
    steps: [
      { label: "Introdução ao Time", status: "done" },
      { label: "Blue Prism Básico", status: "done" },
      { label: "Blue Prism Avançado", status: "current" },
      { label: "Control Room", status: "locked" },
      { label: "Work Queues", status: "locked" },
      { label: "Exceptions", status: "locked" },
      { label: "Power Automate", status: "locked" },
      { label: "Python", status: "locked" },
      { label: "Integrações", status: "locked" },
      { label: "Projeto Final", status: "locked" },
    ],
  },
  {
    title: "Especialista Power Automate",
    desc: "Do básico à automação avançada de processos com Power Automate e conectores corporativos.",
    color: palette.purple,
    modulos: 5,
    progress: 100,
    steps: [
      { label: "Fundamentos", status: "done" },
      { label: "Flows na prática", status: "done" },
      { label: "Conectores", status: "done" },
      { label: "Aprovações", status: "done" },
      { label: "Projeto Final", status: "done" },
    ],
  },
  {
    title: "Python para RPA",
    desc: "Scripts, automações, APIs e integrações usando Python aplicadas ao dia a dia do time.",
    color: palette.blue,
    modulos: 6,
    progress: 0,
    steps: [
      { label: "Sintaxe e Lógica", status: "current" },
      { label: "Bibliotecas RPA", status: "locked" },
      { label: "Manipulação de Dados", status: "locked" },
      { label: "APIs com FastAPI", status: "locked" },
      { label: "Integrações", status: "locked" },
      { label: "Projeto Final", status: "locked" },
    ],
  },
];

const adminUsers = [
  { name: "Alani Rigotti de Oliveira", email: "alani.rigotti@gmail.com", perfil: "Administrador", status: "ativo", acesso: "há 12 min" },
  { name: "Carlos Andrade", email: "carlos.andrade@hering.com.br", perfil: "Administrador", status: "ativo", acesso: "há 40 min" },
  { name: "Júlia Pires", email: "julia.pires@hering.com.br", perfil: "Usuário", status: "ativo", acesso: "há 1h" },
  { name: "Rafael Lima", email: "rafael.lima@hering.com.br", perfil: "Usuário", status: "inativo", acesso: "há 3 dias" },
  { name: "Bianca Costa", email: "bianca.costa@hering.com.br", perfil: "Usuário", status: "ativo", acesso: "há 2h" },
];

const adminLogs = [
  { acao: "Certificado emitido", usuario: "Alani Rigotti de Oliveira", quando: "há 12 min" },
  { acao: "Novo treinamento criado", usuario: "Carlos Andrade", quando: "há 35 min" },
  { acao: "Usuário cadastrado", usuario: "Carlos Andrade", quando: "há 1h" },
  { acao: "Quiz reprovado — 2ª tentativa", usuario: "Rafael Lima", quando: "há 2h" },
  { acao: "Vídeo enviado: Control Room Avançado", usuario: "Carlos Andrade", quando: "há 4h" },
];

const topCourses = [
  { name: "Blue Prism Avançado", acessos: 312 },
  { name: "Power Automate Básico", acessos: 268 },
  { name: "Python para Automação", acessos: 201 },
  { name: "Work Queues na prática", acessos: 175 },
];

const monthlyHours = [
  { mes: "Jan", v: 40 }, { mes: "Fev", v: 55 }, { mes: "Mar", v: 48 },
  { mes: "Abr", v: 70 }, { mes: "Mai", v: 62 }, { mes: "Jun", v: 85 },
];

/* ---------------- Reusable components ---------------- */
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

function CourseCard({ c, onOpen }) {
  const Icon = c.icon;
  return (
    <div className="nexa-card hoverable" style={{ overflow: "hidden", cursor: "pointer" }} onClick={onOpen}>
      <div className="nexa-course-cover" style={{ background: c.cover ? "#e5e5e5" : `linear-gradient(135deg, ${c.grad[0]}, ${c.grad[1]})` }}>
        {c.cover ? <img className="nexa-course-cover-image" src={c.cover} alt={`Capa do curso ${c.title}`} /> : <Icon size={30} color="rgba(255,255,255,0.9)" />}
        {!c.cover && <div style={{ position: "absolute", top: 8, left: 8 }}><span className="nexa-badge">{c.level}</span></div>}
        {c.progress === 100 && <div style={{ position: "absolute", top: 8, right: 8 }}><CheckCircle2 size={18} color="#fff" /></div>}
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
              <div className="nexa-trilha-line" style={{ background: isDone ? "#111" : "#dedede" }} />
            )}
            <div
              className="nexa-trilha-circle"
              style={{
                borderColor: isDone || isCurrent ? "#111" : "#999",
                color: isDone ? "#fff" : isCurrent ? "#fff" : "#777",
                background: isDone || isCurrent ? "#111" : "#fff",
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
  const [mode, setMode] = useState("app"); // 'app' | 'admin'
  const [active, setActive] = useState("dashboard");
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [adminActive, setAdminActive] = useState("admin-dashboard");
  const [chatOpen, setChatOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [catFilter, setCatFilter] = useState("Todos");
  const [selectedTrilha, setSelectedTrilha] = useState(0);
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [tentouEnviar, setTentouEnviar] = useState(false);

  const DOMINIO_PERMITIDO = CORPORATE_EMAIL_DOMAIN;
  const { validEmail: emailValido, canSubmit: podeEnviar } = academyController.validateUserRegistration(novoNome, novoEmail);

  function resetCadastro() {
    setNovoNome("");
    setNovoEmail("");
    setTentouEnviar(false);
    setShowCadastroModal(false);
  }

  // --- Admin: Treinamentos ---
  const gradPresets = [
    ["#3D6BFF", "#2DD4E8"], ["#9B6BFF", "#3D6BFF"], ["#2DD4E8", "#6E3FD9"],
    ["#3D6BFF", "#9B6BFF"], ["#2DD4E8", "#3D6BFF"], ["#9B6BFF", "#2DD4E8"],
  ];
  const [adminTrainings, setAdminTrainings] = useState(
    courses.map((c, i) => ({ ...c, status: "ativo", alunos: [42, 28, 15, 9, 61, 12][i] ?? 0 }))
  );
  const [showTreinamentoModal, setShowTreinamentoModal] = useState(false);
  const [editandoTreinoIdx, setEditandoTreinoIdx] = useState(null);
  const [menuTreinoIdx, setMenuTreinoIdx] = useState(null);
  const novoItem = () => ({ tipo: "video", titulo: "", url: "", texto: "" });
  const treinoInicial = {
    title: "", cat: "Blue Prism", level: "Básico", dur: "", desc: "",
    modulos: [{ titulo: "Módulo 1", imagem: "", itens: [novoItem()] }],
  };
  const [novoTreino, setNovoTreino] = useState(treinoInicial);
  const [tentouSalvarTreino, setTentouSalvarTreino] = useState(false);
  const { validTitle: tituloTreinoValido, validDuration: duracaoTreinoValida, validModules: modulosValidos, canSave: podeSalvarTreino } = academyController.validateTrainingDraft(novoTreino);

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
      modulos: [...prev.modulos, { titulo: `Módulo ${prev.modulos.length + 1}`, imagem: "", itens: [novoItem()] }],
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
    setTentouSalvarTreino(false);
    setShowTreinamentoModal(false);
    setEditandoTreinoIdx(null);
  }

  function abrirNovoTreino() {
    setNovoTreino(treinoInicial);
    setEditandoTreinoIdx(null);
    setTentouSalvarTreino(false);
    setShowTreinamentoModal(true);
  }

  function editarTreinamento(idx) {
    const t = adminTrainings[idx];
    setNovoTreino({
      title: t.title || "",
      cat: t.cat || "Blue Prism",
      level: t.level || "Básico",
      dur: t.dur || "",
      desc: t.desc || "",
      modulos: (t.modulos && t.modulos.length)
        ? t.modulos.map((m) => ({
            titulo: m.titulo || "",
            imagem: m.imagem || "",
            itens: (m.itens && m.itens.length) ? m.itens.map((it) => ({
              tipo: it.tipo || "video",
              titulo: it.titulo || "",
              url: it.url || "",
              texto: it.texto || "",
            })) : [novoItem()],
          }))
        : [{ titulo: "Módulo 1", imagem: "", itens: [novoItem()] }],
    });
    setEditandoTreinoIdx(idx);
    setTentouSalvarTreino(false);
    setMenuTreinoIdx(null);
    setShowTreinamentoModal(true);
  }

  function excluirTreinamento(idx) {
    setAdminTrainings((prev) => prev.filter((_, i) => i !== idx));
    setMenuTreinoIdx(null);
  }

  function salvarTreinamento() {
    setTentouSalvarTreino(true);
    if (!podeSalvarTreino) return;
    const modulosSanitizados = academyController.sanitizeModules(novoTreino.modulos);
    if (editandoTreinoIdx !== null) {
      setAdminTrainings((prev) => prev.map((t, i) => i === editandoTreinoIdx ? {
        ...t,
        title: novoTreino.title.trim(),
        cat: novoTreino.cat,
        level: novoTreino.level,
        dur: novoTreino.dur.trim(),
        desc: novoTreino.desc.trim(),
        modulos: modulosSanitizados,
      } : t));
    } else {
      setAdminTrainings((prev) => [
        {
          title: novoTreino.title.trim(),
          cat: novoTreino.cat,
          level: novoTreino.level,
          dur: novoTreino.dur.trim(),
          desc: novoTreino.desc.trim(),
          modulos: modulosSanitizados,
          progress: 0,
          icon: BookOpen,
          grad: gradPresets[prev.length % gradPresets.length],
          status: "ativo",
          alunos: 0,
        },
        ...prev,
      ]);
    }
    resetTreinoModal();
  }

  // --- Perfil do usuário ---
  const [perfilNome, setPerfilNome] = useState("Key user");
  const perfilEmail = "key.user@gmail.com";
  const primeiroNome = perfilNome;
  const [perfilCargo, setPerfilCargo] = useState("Analista RPA");
  const [perfilSalvo, setPerfilSalvo] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [tentouSalvarSenha, setTentouSalvarSenha] = useState(false);
  const [senhaSalva, setSenhaSalva] = useState(false);

  const { isStrongEnough: novaSenhaValida, passwordsMatch: senhasConferem, canSave: podeSalvarSenha } = academyController.validatePasswordChange(senhaAtual, novaSenha, confirmarSenha);

  function salvarSenha() {
    setTentouSalvarSenha(true);
    if (podeSalvarSenha) {
      setSenhaSalva(true);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setTentouSalvarSenha(false);
      setTimeout(() => setSenhaSalva(false), 2500);
    }
  }

  const favoritos = [courses[0], courses[1], courses[4]];

  // --- Certificados: regra de emissão (treinamento concluído + aproveitamento >= 90%) ---
  const APROVEITAMENTO_MINIMO = MINIMUM_CERTIFICATE_SCORE;
  const [meusTreinamentos, setMeusTreinamentos] = useState([
    { titulo: "Power Automate Básico", categoria: "Power Automate", cargaHoraria: "2h05", progresso: 100, aproveitamento: 96, emitido: true, codigo: "NXA-2026-04821", dataEmissao: "18/06/2026", templateId: "cert-power-automate-basico" },
    { titulo: "Introdução ao Time RPA", categoria: "Onboarding RPA", cargaHoraria: "1h00", progresso: 100, aproveitamento: 100, emitido: false, codigo: null, dataEmissao: null },
    { titulo: "Blue Prism Básico", categoria: "Blue Prism", cargaHoraria: "2h40", progresso: 100, aproveitamento: 88, emitido: false, codigo: null, dataEmissao: null },
    { titulo: "Control Room", categoria: "Blue Prism", cargaHoraria: "1h30", progresso: 55, aproveitamento: null, emitido: false, codigo: null, dataEmissao: null },
  ]);
  const [certificateTemplates, setCertificateTemplates] = useState(defaultCertificateTemplates);
  const [certificadoPreview, setCertificadoPreview] = useState(null);
  const certificadoTemplatePreview = certificadoPreview
    ? academyController.resolveCertificateTemplate(certificadoPreview, certificateTemplates)
    : null;

  function emitirCertificado(idx) {
    setMeusTreinamentos((prev) => {
      const copia = [...prev];
      const item = copia[idx];
      const template = academyController.resolveCertificateTemplate(item, certificateTemplates);
      if (!template) return prev;
      const atualizado = academyController.issueCertificate(item, template);
      if (atualizado === item) return prev;
      copia[idx] = atualizado;
      setCertificadoPreview(atualizado);
      return copia;
    });
  }

  function adicionarModeloCertificado(draft) {
    const template = academyController.createCertificateTemplate(draft);
    if (!template) return false;
    setCertificateTemplates((prev) => academyController.registerCertificateTemplate(prev, template));
    return true;
  }

  function alternarStatusModeloCertificado(templateId) {
    setCertificateTemplates((prev) => academyController.toggleCertificateTemplateStatus(prev, templateId));
  }

  function removerModeloCertificado(templateId) {
    setCertificateTemplates((prev) => prev.filter((item) => item.id !== templateId));
    if (certificadoPreview?.templateId === templateId) setCertificadoPreview(null);
  }

  function visualizarModeloCertificado(template) {
    setCertificadoPreview(academyController.createCertificatePreviewTraining(template));
  }

  const filtered = catFilter === "Todos" ? courses : courses.filter((c) => c.cat === catFilter);
  const navItems = mode === "admin" ? adminNavItems : userNavItems;
  const certificateCourseTitles = Array.from(new Set([
    ...adminTrainings.map((training) => training.title),
    ...certificateTemplates.map((template) => template.courseTitle),
  ])).sort((a, b) => a.localeCompare(b, "pt-BR"));

  function abrirCurso() {
    setSelectedLessonId(null);
    setActive("curso");
  }

  function abrirPerfil() {
    setProfileMenuOpen(false);
    setSelectedLessonId(null);
    setMode("app");
    setActive("perfil");
  }

  function sair() {
    setProfileMenuOpen(false);
    navigate({ to: "/" });
  }

  return (
    <div className="nexa-root">
      <style>{css}</style>

      {/* Sidebar */}
      <aside className="nexa-sidebar">
        <div className="nexa-logo">
          <div className="nexa-logo-mark">
            <img src="/nexa-ai-logo.png?v=20260716" alt="Logo Nexa Academy" />
          </div>
          <div className="nexa-logo-wordmark">
            <div className="nexa-logo-text">Nexa</div>
            <div className="nexa-logo-academy">Academy</div>
            <div className="nexa-logo-sub">{mode === "admin" ? "Painel administrativo" : "by Hering"}</div>
          </div>
        </div>

        <div className="nexa-navscroll nexa-scroll">
          <div className="nexa-navgroup">
            <div className="nexa-navlabel">{mode === "admin" ? "Administração" : "Menu"}</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = mode === "admin" ? adminActive === item.key : active === item.key || (active === "curso" && item.key === "treinamentos");
              return (
                <div
                  key={item.key}
                  className={`nexa-navitem ${isActive ? (mode === "admin" ? "adminactive" : "active") : ""}`}
                  onClick={() => {
                    if (item.key === "nexa") setChatOpen(true);
                    else if (mode === "admin") setAdminActive(item.key);
                    else {
                      setSelectedLessonId(null);
                      setActive(item.key);
                    }
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </div>
              );
            })}
          </div>

        </div>

        <div className="nexa-sidebar-footer">
          <div
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
          </div>
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
            <div className="nexa-topbar-bell"><Bell size={22} /></div>
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
                {perfilNome.split(" ").map((name) => name[0]).slice(0, 2).join("")}
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
              onBack={() => setActive("treinamentos")}
              onOpenLesson={(lessonId) => setSelectedLessonId(lessonId)}
            />
          )}
          {mode === "app" && active === "curso" && selectedLessonId && (
            <LessonDetailView
              lessonId={selectedLessonId}
              onBack={() => setSelectedLessonId(null)}
              onNavigate={(lessonId) => setSelectedLessonId(lessonId)}
            />
          )}

          {/* ---------- USER: DASHBOARD ---------- */}
          {mode === "app" && active === "dashboard" && (
            <>
              <div style={{ marginBottom: 22 }}>
                <h1 className="nexa-heading" style={{ fontSize: 30, fontWeight: 700, margin: 0 }}>Olá, {primeiroNome} 👋</h1>
                <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>
                  Você está a 3 aulas de concluir <strong style={{ color: "#111" }}>Blue Prism Avançado</strong>. Continue de onde parou.
                </p>
              </div>

              <div className="nexa-grid-2col" style={{ marginBottom: 22 }}>
                <div className="nexa-hero">
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <span className="nexa-badge" style={{ background: "rgba(45,212,232,0.15)", color: palette.cyan }}>Continuar estudando</span>
                    <h2 className="nexa-heading" style={{ fontSize: 24, margin: "24px 0 8px" }}>Work Queues — Tratamento de Exceções</h2>
                    <p style={{ fontSize: 12.5, color: palette.textMuted, marginBottom: 16, maxWidth: 420 }}>
                      Módulo 4 de 6 · Blue Prism Avançado · Trilha Onboarding RPA
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <div className="nexa-progress-track" style={{ flex: 1 }}><div className="nexa-progress-fill" style={{ width: "64%" }} /></div>
                      <span style={{ fontSize: 12, color: palette.textMuted, flexShrink: 0 }}>64%</span>
                    </div>
                    <button className="nexa-btn-primary" onClick={() => { abrirCurso(); setSelectedLessonId("3.4"); }}><Play size={14} fill="#fff" /> Continuar aula</button>
                  </div>
                </div>

                <div className="nexa-dashboard-side">
                  <div className="nexa-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="nexa-stat-icon" style={{ background: "#f5f5f5", color: "#111" }}><Clock size={20} /></div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>47h estudadas</div>
                      <div style={{ fontSize: 11.5, color: palette.textMuted }}>+12h essa semana</div>
                    </div>
                  </div>
                  <div className="nexa-card" style={{ padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Sparkles size={16} color="#111" />
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>Sugestão da Nexa</span>
                    </div>
                    <p style={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.5, marginBottom: 10 }}>
                      Você concluiu Power Automate Básico — que tal seguir para “Integrações com Blue Prism”?
                    </p>
                    <span style={{ fontSize: 12, color: palette.cyan, display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>Ver treinamento <ChevronRight size={13} /></span>
                  </div>
                </div>
              </div>

              <div className="nexa-grid-4 nexa-dashboard-stats" style={{ marginBottom: 22 }}>
                <StatCard icon={GraduationCap} label="Em andamento" value="3" color={palette.cyan} />
                <StatCard icon={CheckCircle2} label="Concluídos" value="12" color={palette.blue} />
                <StatCard icon={Award} label="Certificados" value="8" color={palette.purple} />
                <StatCard icon={Star} label="Favoritos" value="6" color={palette.amber} />
              </div>

              <div style={{ marginBottom: 26 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span className="nexa-section-title">Sua trilha — Onboarding RPA</span>
                  <span className="nexa-see-all" onClick={() => setActive("trilhas")}>Ver trilha completa <ChevronRight size={13} /></span>
                </div>
                <div className="nexa-card" style={{ padding: "18px 20px" }}>
                  <TrilhaTimeline steps={trilhas[0].steps} />
                </div>
              </div>

              <div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span className="nexa-section-title">Últimos treinamentos</span>
                    <span className="nexa-see-all" onClick={() => setActive("treinamentos")}>Ver todos <ChevronRight size={13} /></span>
                  </div>
                  <div className="nexa-dashboard-course-grid">
                    {courses.slice(0, 3).map((c, i) => (
                      <div className="nexa-card nexa-dashboard-course" key={i} onClick={abrirCurso} style={{ cursor: "pointer" }}>
                        <div className="nexa-dashboard-course-top">
                          <span className="nexa-badge">{c.level}</span>
                          <c.icon size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 650, marginBottom: 4 }}>{c.title.replace(" na prática", "")}</div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: palette.textMuted, fontSize: 12 }}>
                            <span>Módulo {i === 0 ? "4" : i === 1 ? "3" : "1"} de 6</span>
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
                  <span key={cat} className={`nexa-pill ${catFilter === cat ? "active" : ""}`} onClick={() => setCatFilter(cat)}>{cat}</span>
                ))}
              </div>
              {filtered.length > 0
                ? <div className="nexa-grid-3">{filtered.map((c, i) => <CourseCard key={i} c={c} onOpen={abrirCurso} />)}</div>
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

              <div className="nexa-card" style={{ padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div className="nexa-section-title">{trilhas[selectedTrilha].title}</div>
                    <p style={{ fontSize: 12, color: palette.textMuted, marginTop: 4, maxWidth: 520 }}>{trilhas[selectedTrilha].desc}</p>
                  </div>
                  <button className="nexa-btn-primary" onClick={abrirCurso}><Play size={14} fill="#fff" /> Continuar trilha</button>
                </div>
                <div style={{ marginTop: 14 }}>
                  <TrilhaTimeline steps={trilhas[selectedTrilha].steps} />
                </div>
              </div>
            </>
          )}

          {/* ---------- USER: simple placeholders ---------- */}
          {mode === "app" && active === "docs" && (
            <AdminPlaceholder title="Documentações" icon={FileText} />
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
                {meusTreinamentos.map((t, i) => {
                  const concluido = t.progresso === 100;
                  const template = academyController.resolveCertificateTemplate(t, certificateTemplates);
                  const elegivel = concluido && t.aproveitamento >= APROVEITAMENTO_MINIMO && Boolean(template);

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
                            {template ? "Aproveitamento insuficiente" : "Modelo não configurado"}
                          </span>
                        )}
                        {!concluido && (
                          <span style={{ fontSize: 11.5, color: palette.textFaint }}>{t.progresso}% concluído</span>
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
                      <div className="nexa-avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
                        {perfilNome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif" }}>{perfilNome}</div>
                        <div style={{ fontSize: 12, color: palette.textFaint }}>{perfilEmail}</div>
                      </div>
                      <button className="nexa-btn-ghost" style={{ marginLeft: "auto", fontSize: 11.5, padding: "7px 12px" }}>Alterar foto</button>
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
                      <button className="nexa-btn-primary" onClick={() => setPerfilSalvo(true)}>Salvar alterações</button>
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
                    <StatCard icon={GraduationCap} label="Em andamento" value="3" color={palette.cyan} />
                    <StatCard icon={Award} label="Certificados" value="8" color={palette.purple} />
                  </div>

                  <div className="nexa-card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Star size={15} color={palette.amber} />
                      <span className="nexa-section-title">Treinamentos favoritos</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {favoritos.map((c, i) => {
                        const Icon = c.icon;
                        return (
                          <div key={i} className="nexa-side-item">
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
              <div style={{ marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h1 className="nexa-heading" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Painel Administrativo</h1>
                  <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>Visão geral da plataforma Nexa Academy</p>
                </div>
                <button className="nexa-btn-ghost" onClick={() => { setAdminActive("admin-treinamentos"); abrirNovoTreino(); }}><PlusCircle size={15} /> Novo treinamento</button>
              </div>

              <div className="nexa-grid-4" style={{ marginBottom: 18 }}>
                <StatCard icon={Users} label="Usuários" value="84" color={palette.cyan} />
                <StatCard icon={GraduationCap} label="Treinamentos ativos" value="32" color={palette.blue} />
                <StatCard icon={CheckCircle2} label="Concluídos" value="248" color={palette.green} />
                <StatCard icon={Award} label="Certificados emitidos" value="156" color={palette.purple} />
              </div>

              <div className="nexa-grid-2col" style={{ marginBottom: 22 }}>
                <div className="nexa-card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span className="nexa-section-title">Horas de treinamento por mês</span>
                    <span style={{ fontSize: 11.5, color: palette.green, display: "flex", alignItems: "center", gap: 4 }}><TrendingUp size={13} /> +21% vs. mês anterior</span>
                  </div>
                  <div className="nexa-bar-wrap">
                    {monthlyHours.map((m, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                    {topCourses.map((c, i) => (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                          <span>{c.name}</span>
                          <span style={{ color: palette.textFaint }}>{c.acessos}</span>
                        </div>
                        <div className="nexa-progress-track"><div className="nexa-progress-fill" style={{ width: `${(c.acessos / 312) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="nexa-grid-2col">
                <div className="nexa-card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span className="nexa-section-title">Últimos usuários</span>
                    <span className="nexa-see-all" onClick={() => setAdminActive("admin-usuarios")}>Ver todos <ChevronRight size={13} /></span>
                  </div>
                  <table className="nexa-table">
                    <thead><tr><th>Nome</th><th>Perfil</th><th>Status</th></tr></thead>
                    <tbody>
                      {adminUsers.slice(0, 4).map((u, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div className="nexa-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</div>
                              <div>
                                <div style={{ fontWeight: 500 }}>{u.name}</div>
                                <div style={{ fontSize: 10.5, color: palette.textFaint }}>{u.acesso}</div>
                              </div>
                            </div>
                          </td>
                          <td>{u.perfil}</td>
                          <td>
                            <span className="nexa-status-dot" style={{ background: u.status === "ativo" ? palette.green : palette.textFaint }} />
                            {u.status === "ativo" ? "Ativo" : "Inativo"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="nexa-card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span className="nexa-section-title">Logs recentes</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {adminLogs.map((l, i) => (
                      <div key={i} className="nexa-side-item">
                        <ListChecks size={14} color={palette.cyan} style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12.5 }}>{l.acao}</div>
                          <div style={{ fontSize: 11, color: palette.textFaint }}>{l.usuario} · {l.quando}</div>
                        </div>
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
                  <p style={{ color: palette.textMuted, fontSize: 13, marginTop: 4 }}>84 colaboradores cadastrados na plataforma</p>
                </div>
                <button className="nexa-btn-primary" onClick={() => setShowCadastroModal(true)}><PlusCircle size={15} /> Cadastrar usuário</button>
              </div>
              <div className="nexa-card" style={{ padding: 18 }}>
                <table className="nexa-table">
                  <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Último acesso</th><th></th></tr></thead>
                  <tbody>
                    {adminUsers.map((u, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="nexa-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</div>
                            {u.name}
                          </div>
                        </td>
                        <td style={{ color: palette.textMuted }}>{u.email}</td>
                        <td>{u.perfil}</td>
                        <td><span className="nexa-status-dot" style={{ background: u.status === "ativo" ? palette.green : palette.textFaint }} />{u.status === "ativo" ? "Ativo" : "Inativo"}</td>
                        <td style={{ color: palette.textFaint }}>{u.acesso}</td>
                        <td><MoreHorizontal size={15} color={palette.textFaint} style={{ cursor: "pointer" }} /></td>
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

          {/* ---------- ADMIN: VÍDEOS ---------- */}
          {mode === "admin" && adminActive === "admin-videos" && <AdminVideosView />}

          {/* ---------- ADMIN: outras seções (placeholder) ---------- */}
          {mode === "admin" && !["admin-dashboard", "admin-usuarios", "admin-treinamentos", "admin-certificados", "admin-videos"].includes(adminActive) && (
            <AdminPlaceholder
              title={adminNavItems.find((n) => n.key === adminActive)?.label || ""}
              icon={adminNavItems.find((n) => n.key === adminActive)?.icon || Folder}
            />
          )}
        </div>
      </main>

      {/* Modal: Certificado emitido */}
      {certificadoPreview && certificadoTemplatePreview && (
        <CertificatePreviewModal
          recipientName={perfilNome}
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
              Apenas e-mails corporativos <strong style={{ color: palette.textPrimary }}>@ciahering.com.br</strong> podem ser cadastrados na plataforma.
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
                onClick={() => {
                  setTentouEnviar(true);
                  if (podeEnviar) resetCadastro();
                }}
              >
                Cadastrar
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
                  {categories.filter((c) => c !== "Todos").map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
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
              >
                {editandoTreinoIdx !== null ? "Salvar alterações" : "Cadastrar treinamento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nexa AI floating */}
      {!chatOpen && (
        <button
          className="nexa-fab"
          onClick={() => setChatOpen(true)}
          aria-label="Abrir chat da Nexa"
          title="Conversar com a Nexa"
        >
          <MessageCircle size={24} color="#fff" strokeWidth={1.9} />
        </button>
      )}

      {chatOpen && (
        <div className="nexa-chat-panel">
          <div className="nexa-chat-header">
            <div className="nexa-chat-brand">
              <span className="nexa-chat-avatar"><img src="/favicon.ico" alt="" /></span>
              <span className="nexa-chat-title">Nexa Feedbacks</span>
            </div>
            <button className="nexa-chat-menu" type="button" onClick={() => setChatOpen(false)} aria-label="Minimizar chat" title="Minimizar chat">
              <Minus size={20} />
            </button>
          </div>
          <div className="nexa-chat-body nexa-scroll">
            <div className="nexa-chat-message">
              <span className="nexa-chat-message-avatar"><img src="/favicon.ico" alt="Nexa" /></span>
              <div>
                <div className="nexa-bubble-ai">Digite aqui seu FeedBack</div>
                <div className="nexa-chat-meta">Assistente de IA · agora mesmo</div>
              </div>
            </div>
          </div>
          <div className="nexa-chat-input">
            <input placeholder="Digite aqui..." aria-label="Digite seu feedback" />
            <button className="nexa-chat-send" type="button" aria-label="Enviar feedback"><ArrowUp size={22} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
