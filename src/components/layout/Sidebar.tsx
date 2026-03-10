"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Image as ImageIcon, 
  MessageSquare, 
  Library,
  Settings as SettingsIcon,
  Zap,
  Database,
  Calendar
} from "lucide-react";
import "./Sidebar.css";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Generar Artículo", href: "/article", icon: FileText },
  { name: "Generar Imagen", href: "/image", icon: ImageIcon },
  { name: "Generar Post", href: "/social", icon: MessageSquare },
  { name: "Plan de Marketing", href: "/marketing", icon: Zap },
  { name: "Base de Conocimiento", href: "/knowledge", icon: Database },
  { name: "Biblioteca", href: "/library", icon: Library },
  { name: "Configuración", href: "/settings", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <Zap className="logo-icon" />
          <span className="logo-text">NeuralMarketing<span className="logo-highlight">OS</span></span>
        </div>
      </div>
      
      <nav className="sidebar-nav pb-6">
        <div className="nav-group">
          <span className="nav-group-title">Core</span>
          <ul>
            <li>
              <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><LayoutDashboard className="nav-icon" size={20} /></div>
                <span>Dashboard</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="nav-group">
          <span className="nav-group-title">Estrategia</span>
          <ul>
            <li>
              <Link href="/knowledge" className={`nav-link ${pathname === "/knowledge" ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><Database className="nav-icon" size={20} /></div>
                <span>Cerebro Corporativo</span>
              </Link>
            </li>
            <li>
              <Link href="/campaigns" className={`nav-link ${pathname === "/campaigns" ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><Zap className="nav-icon" size={20} /></div>
                <span>Campañas</span>
              </Link>
            </li>
            <li>
             <Link href="/calendar" className={`nav-item ${pathname === '/calendar' ? 'active shadow-lg' : ''}`}>
             <Calendar size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Calendario Editorial</span>
          </Link>
            </li>
          </ul>
        </div>

        <div className="nav-group">
          <span className="nav-group-title">Herramientas</span>
          <ul>
            <li>
              <Link href="/article" className={`nav-link ${pathname === "/article" ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><FileText className="nav-icon" size={20} /></div>
                <span>Redactor de Artículos</span>
              </Link>
            </li>
            <li>
              <Link href="/social" className={`nav-link ${pathname === "/social" ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><MessageSquare className="nav-icon" size={20} /></div>
                <span>Creador de Posts</span>
              </Link>
            </li>
            <li>
              <Link href="/image" className={`nav-link ${pathname === "/image" ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><ImageIcon className="nav-icon" size={20} /></div>
                <span>Estudio Visual</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="nav-group">
          <span className="nav-group-title">Inventario</span>
          <ul>
            <li>
              <Link href="/library" className={`nav-link ${pathname === "/library" ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><Library className="nav-icon" size={20} /></div>
                <span>Biblioteca</span>
              </Link>
            </li>
            <li>
              <Link href="/settings" className={`nav-link ${pathname === "/settings" ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><SettingsIcon className="nav-icon" size={20} /></div>
                <span>Configuración</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile glass-panel">
          <div className="avatar">N</div>
          <div className="user-info">
            <span className="user-name">Neuromarketing</span>
            <span className="user-role">OS Workspace</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
