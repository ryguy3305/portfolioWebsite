"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
];

export default function SiteNav() {
  const pathname = usePathname();
  return (
    <nav className="h-12 border-b border-neutral-200 flex justify-center px-6">
      <div className="max-w-3xl w-full flex items-stretch gap-6 text-sm">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center border-b-2 -mb-px transition-colors ${
                active
                  ? "border-blue-500 text-neutral-900 font-medium"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
