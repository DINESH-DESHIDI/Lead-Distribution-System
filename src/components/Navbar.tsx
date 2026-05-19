"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Overview" },
    { href: "/request-service", label: "Request Service (Public)" },
    { href: "/dashboard", label: "Provider Dashboard (Real-Time)" },
    { href: "/test-tools", label: "Simulation Console (QA)" },
  ];

  return (
    <nav className="border-b border-border/80 bg-neutral-950/70 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white text-black font-bold flex items-center justify-center transition-all duration-300 group-hover:bg-neutral-200">
            P
          </div>
          <span className="font-bold text-white tracking-wide group-hover:text-neutral-200 transition-colors">
            Prowider Mini
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "text-white scale-105"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        {/* Mobile Indicator */}
        <div className="md:hidden flex items-center">
          <span className="text-xs px-2.5 py-1 bg-border text-white/70 font-semibold rounded-full uppercase tracking-wider">
            System Live
          </span>
        </div>
      </div>
    </nav>
  );
}
