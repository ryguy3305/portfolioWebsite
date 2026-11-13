import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Projects | Ryan Jackman",
  description: "Things Ryan Jackman has built",
};

const projects = [
  {
    title: "OLL Trainer",
    desc: "Anki-style spaced repetition for learning all 57 OLL cases on a Rubik's cube, with algorithms from SpeedCubeDB.",
    href: "/projects/oll-trainer",
  },
];

export default function Projects() {
  return (
    <main className="min-h-screen flex justify-center px-6">
      <div className="max-w-3xl w-full space-y-8 py-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Projects</h1>
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="block h-full rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-400 transition-colors"
              >
                <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{p.title}</h2>
                <p className="text-sm text-neutral-500 mt-1">{p.desc}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
