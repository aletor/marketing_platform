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
            {/* FOLDDER Logo — purple square with beveled corner + white F icon + wordmark */}
            <div className="flex flex-col items-center gap-0">
              {/* Icon mark */}
              <div className="w-12 h-12 flex items-center justify-center" style={{ marginBottom: '4px' }}>
                <svg width="44" height="44" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Purple square with beveled top-right corner (like page fold) */}
                  <path d="M4 6 Q4 2 8 2 L36 2 L50 16 L50 46 Q50 50 46 50 L8 50 Q4 50 4 46 Z" fill="#6C5CE7"/>
                  {/* Bevel shadow triangle */}
                  <path d="M36 2 L50 16 L36 16 Z" fill="rgba(0,0,0,0.22)"/>
                  {/* White F symbol */}
                  <rect x="14" y="15" width="5" height="22" rx="2.5" fill="white"/>
                  <rect x="14" y="15" width="19" height="5" rx="2.5" fill="white"/>
                  <rect x="14" y="25.5" width="14" height="5" rx="2.5" fill="white"/>
                </svg>
              </div>
              {/* Wordmark */}
              <span className="logo-text" style={{ letterSpacing: '0.08em', fontSize: '11px', fontWeight: 900 }}>FOLD<span className="logo-highlight font-black">DER</span></span>
            </div>
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
