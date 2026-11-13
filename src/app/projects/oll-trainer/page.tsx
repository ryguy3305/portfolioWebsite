import type { Metadata } from "next";
import OllTrainerFrame from "@/components/OllTrainerFrame";

export const metadata: Metadata = {
  title: "OLL Trainer | Ryan Jackman",
  description: "Anki-style spaced repetition trainer for the 57 OLL cases",
};

export default function OllPage() {
  return <OllTrainerFrame />;
}
