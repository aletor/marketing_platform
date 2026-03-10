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
            <div className="w-14 h-14 bg-[#1A1B1E] rounded-2xl flex items-center justify-center text-[#FFBD1B] shadow-xl border border-[#333] mb-2 transform hover:rotate-12 transition-transform">
              <Zap size={32} fill="currentColor" />
            </div>
            <span className="logo-text">NeuralMarketing<span className="logo-highlight font-black">OS</span></span>
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
