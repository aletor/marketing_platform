"use client";

import React from 'react';
import Link from 'next/link';
import { 
  FlaskConical, 
  Workflow, 
  Video, 
  Zap, 
  FileText, 
  Image as ImageIcon, 
  Users, 
  Terminal,
  ArrowUpRight,
  Sparkles,
  Command
} from 'lucide-react';

const LabCard = ({
  title,
  description,
  href,
  icon: Icon,
  color,
  external,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  external?: boolean;
}) => {
  const inner = (
    <>
    {/* Border Glow */}
    <div className={`absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500`} style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
    
    <div className="relative bg-[#0a0a0a]/90 backdrop-blur-xl p-6 h-full rounded-2xl border border-white/5 flex flex-col justify-between">
      <div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:rotate-12`} style={{ background: `${color}15` }}>
          <Icon size={24} style={{ color }} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          {title}
          <ArrowUpRight size={16} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>
      
      <div className="mt-6 flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        {external ? "External app" : "Experimental Module"}
      </div>
    </div>
    </>
  );

  const className =
    "group relative block p-px rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-xl";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }

  return <Link href={href} className={className}>{inner}</Link>;
};

export default function LabsPage() {
  const composerExternal =
    typeof process.env.NEXT_PUBLIC_MEDIA_COMPOSER_URL === "string" &&
    process.env.NEXT_PUBLIC_MEDIA_COMPOSER_URL.length > 0
      ? process.env.NEXT_PUBLIC_MEDIA_COMPOSER_URL.replace(/\/$/, "")
      : "";

  const labs = [
    ...(composerExternal
      ? [
          {
            title: "Media Composer",
            description:
              "Node-based media workflow (app separada). Abre en una pestaña nueva.",
            href: composerExternal,
            icon: Workflow,
            color: "#f43f5e",
            external: true,
          },
        ]
      : []),
    {
      title: "Node Studio",
      description: "Original visual node-based video editor with Grok & Runway integration.",
      href: "/demo_runway",
      icon: FlaskConical,
      color: "#ec4899"
    },
    {
      title: "HeyGen Lab",
      description: "Experimental avatar generation and voice cloning workbench.",
      href: "/heygen_tutorial",
      icon: Users,
      color: "#a855f7"
    },
    {
      title: "Video Engine",
      description: "Automated video sequence generation and tutorial logic testing.",
      href: "/video_tutorial_test",
      icon: Video,
      color: "#3b82f6"
    },
    {
      title: "FFmpeg Terminal",
      description: "Browser-side video manipulation engine using WebAssembly.",
      href: "/test_ffmpg",
      icon: Terminal,
      color: "#22c55e"
    },
    {
      title: "AI Author",
      description: "Content generation engine for high-fidelity articles.",
      href: "/article",
      icon: FileText,
      color: "#eab308"
    },
    {
      title: "Visual Forge",
      description: "Image generation testing ground with advanced model parameters.",
      href: "/image",
      icon: ImageIcon,
      color: "#ec4899"
    },
    {
      title: "Social HQ",
      description: "Multi-platform social content scheduler and generator.",
      href: "/social",
      icon: Command,
      color: "#06b6d4"
    },
    {
      title: "Agent Matrix",
      description: "Marketing workforce simulation and autonomous agent tests.",
      href: "/marketing",
      icon: Sparkles,
      color: "#f97316"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 selection:bg-rose-500/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center border border-rose-500/30">
                <FlaskConical className="text-rose-500" size={20} />
              </div>
              <span className="text-rose-500 font-mono text-sm tracking-[0.3em] font-bold">EXPERIMENTAL LABS</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
              Innovation <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500">Hub</span>
            </h1>
            <p className="text-gray-400 max-w-2xl text-lg leading-relaxed">
              Access the bleeding edge of the Content Engine AI. These experimental tools are the building blocks of our next-generation creative suite.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono text-gray-500 border border-white/5 py-2 px-4 rounded-full bg-white/5 backdrop-blur-sm">
            <span className="flex w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            LIVE SYSTEM v1.2.4
          </div>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {labs.map((lab, i) => (
            <LabCard key={i} {...lab} />
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-gray-600 font-mono text-[10px] tracking-widest uppercase">
          <div>© 2026 Content Engine AI Labs</div>
          <div className="flex gap-8">
            <span className="hover:text-white transition-colors cursor-pointer">Protocol Alpha</span>
            <span className="hover:text-white transition-colors cursor-pointer">Security Sandbox</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
