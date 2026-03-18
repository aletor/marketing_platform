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
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 bg-[#1A1B1E] rounded-2xl flex items-center justify-center shadow-xl border border-[#333] mb-2">
              {/* Media Node icon — three circles connected in a triangle (node graph) */}
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="7" r="4" stroke="#FFBD1B" strokeWidth="2.2"/>
                <circle cx="7" cy="27" r="4" stroke="#FFBD1B" strokeWidth="2.2"/>
                <circle cx="29" cy="27" r="4" stroke="#FFBD1B" strokeWidth="2.2"/>
                <line x1="14.3" y1="10.1" x2="9.2" y2="23.4" stroke="#FFBD1B" strokeWidth="2" strokeLinecap="round"/>
                <line x1="21.7" y1="10.1" x2="26.8" y2="23.4" stroke="#FFBD1B" strokeWidth="2" strokeLinecap="round"/>
                <line x1="11" y1="27" x2="25" y2="27" stroke="#FFBD1B" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="logo-text">MEDIA<span className="logo-highlight font-black">NODE</span></span>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav pb-6">
        <div className="nav-group">
          <ul>
            <li>
              <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><LayoutDashboard className="nav-icon" size={20} /></div>
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/campaigns" className={`nav-link ${pathname.startsWith("/campaigns") ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><Zap className="nav-icon" size={20} /></div>
                <span>Campañas</span>
              </Link>
            </li>
            <li>
              <Link href="/library" className={`nav-link ${pathname.startsWith("/library") ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><Library className="nav-icon" size={20} /></div>
                <span>Contenido</span>
              </Link>
            </li>
            <li>
              <Link href="/knowledge" className={`nav-link ${pathname.startsWith("/knowledge") ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><Database className="nav-icon" size={20} /></div>
                <span>Conocimiento</span>
              </Link>
            </li>
            <li>
              <Link href="/settings" className={`nav-link ${pathname.startsWith("/settings") ? "active" : ""}`}>
                <div className="nav-icon-wrapper"><SettingsIcon className="nav-icon" size={20} /></div>
                <span>Configuración</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

    </aside>
  );
}
