"use client";

// The trainer is a standalone static app in public/oll-trainer. Focus it on load
// so its keyboard shortcuts (Space timer, 1-4 ratings) work without a click.
export default function OllTrainerFrame() {
  return (
    <iframe
      src="/oll-trainer/index.html"
      title="OLL Trainer"
      className="block w-full h-[calc(100dvh-3rem)] border-0"
      onLoad={(e) => e.currentTarget.contentWindow?.focus()}
    />
  );
}
