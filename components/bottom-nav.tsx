"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Scale, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/checkin", label: "チェックイン", icon: Plus },
  { href: "/weight", label: "体重", icon: Scale },
  { href: "/training", label: "トレ", icon: Dumbbell },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 mx-auto w-full max-w-md border-t border-zinc-200 bg-white">
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-xs",
                  active ? "text-emerald-600" : "text-zinc-500",
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
