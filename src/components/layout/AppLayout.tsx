"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import "./AppLayout.css";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSpaces = pathname === "/spaces" || pathname?.startsWith("/spaces/");

  if (isSpaces) {
    return <main className="h-screen w-screen overflow-hidden">{children}</main>;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
