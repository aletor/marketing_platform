"use client";
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import "./AppLayout.css";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
