"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Settings,
  LogOut,
  Building2,
  ChevronRight,
  FolderOpen,
  CheckSquare,
  BarChart3,
  FileText,
  Wallet,
  Printer,
  Lock,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const navGroups = [
  {
    label: "ANA MENÜ",
    items: [
      { label: "Projeler", href: "/projeler", icon: FolderOpen },
      { label: "Görevler", href: "/gorevler", icon: CheckSquare },
      { label: "Ozalit Hizmetleri", href: "/ozalit", icon: Printer },
    ],
  },
  {
    label: "FİNANS",
    items: [
      { label: "İşlemler", href: "/islemler", icon: Wallet },
      { label: "Raporlar", href: "/raporlar", icon: BarChart3 },
      { label: "Kasa", href: "/kasa", icon: Building2 },
    ],
  },
  {
    label: "DOKÜMANLAR",
    items: [
      { label: "Teklifler", href: "/teklifler", icon: FileText },
    ],
  },
  {
    label: "KİŞİLER",
    items: [
      { label: "Kişiler", href: "/kisiler", icon: Users },
    ],
  },
  {
    label: "ÖZEL",
    items: [
      { label: "Tufan Özel İşler", href: "/tufan", icon: Lock },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="flex h-screen w-60 flex-col bg-neutral-900 text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shrink-0">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">Fatisa Pro</p>
          <p className="text-xs text-neutral-400 truncate">Mimarlık Ofisi</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold tracking-widest text-neutral-500 px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Ayarlar (en altta gruptan ayrı) */}
        <div className="border-t border-neutral-800 pt-4">
          <Link
            href="/ayarlar"
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              pathname.startsWith("/ayarlar")
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="flex-1">Ayarlar</span>
            {pathname.startsWith("/ayarlar") && (
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            )}
          </Link>
        </div>
      </nav>

      {/* User / Logout */}
      <div className="border-t border-neutral-800 px-3 py-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 shrink-0">
            <span className="text-xs font-semibold text-white">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Açık Tema" : "Koyu Tema"}
            className="shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-yellow-400 hover:bg-neutral-800 transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={logOut}
            title="Çıkış Yap"
            className="shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
