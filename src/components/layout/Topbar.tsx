"use client";

import { usePathname } from "next/navigation";
import { Bell, Settings, Search, User, Rocket } from "lucide-react";
import "./Topbar.css";

const pathToTitle: Record<string, string> = {
  "/": "Dashboard Overview",
  "/article": "Generador de Artículos",
  "/image": "Generador de Imágenes",
  "/social": "Generador de Posts Sociales",
  "/library": "Biblioteca de Contenido",
};

export function Topbar() {
  const pathname = usePathname();
  const title = pathToTitle[pathname] || "Media Node";

  return (
    <header className="topbar">
      <div className="topbar-search-wrapper">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Buscar en conocimiento..." 
          className="topbar-search-input" 
        />
      </div>
      
      <div className="topbar-actions">
        <button className="upgrade-btn">
          <Rocket size={16} /> Upgrade
        </button>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>
        <button className="user-circle" aria-label="User Profile">
          <User size={20} />
        </button>
      </div>
    </header>
  );
}
