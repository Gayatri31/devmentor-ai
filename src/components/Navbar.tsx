"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/resume", label: "Resume Analyzer", icon: "📄" },
  { href: "/interview", label: "Mock Interview", icon: "🎯" },
  { href: "/offer", label: "Offer Evaluator", icon: "💼" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">

        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-white hover:opacity-80 transition"
        >
          <span className="text-lg">✨</span>
          <span className="text-sm font-bold tracking-tight">
            DevMentor AI
          </span>
        </Link>

        {/* Links + UserButton */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}

          {/* Clerk user avatar + sign out */}
          <div className="ml-3">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

      </div>
    </nav>
  );
}