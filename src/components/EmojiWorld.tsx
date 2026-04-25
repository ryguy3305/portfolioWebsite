"use client";

import { useEffect, useState } from "react";

const GROUND_BACK = "🌱🌿🌱🌱🌱🌱🌱🌿🌱🌱🌱🌿🌱🌱🌱🌿🌱🌱🌱🌱🌱🌿";
const GROUND_FRONT = "🌱🌱🌿🌱🌱🌱🪨🌱🌱🌿🌱🌱🌱🌿🌱🪨🌱🌱🌱🌿🌱🌱🌱";

const QUIPS = [
  "I love leaves",
  "leaves!",
  "i'm tall",
  "hello",
  "go bucks",
  "The one piece is real",
  "mmm",
  "tasty",
  "Why am I here",
];

const MIN_X = -150;
const MAX_X = 0;
const SPEED_PX_PER_SEC = 30;
const MIN_MOVE_MS = 1800;
const FLIP_MS = 450;
const QUIP_MIN_GAP_MS = 6000;
const QUIP_MAX_GAP_MS = 14000;
const QUIP_VISIBLE_MS = 2800;

export default function EmojiWorld() {
  const [x, setX] = useState(MAX_X);
  const [moveMs, setMoveMs] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [quip, setQuip] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let current = MAX_X;
    let currentScale = 1;

    const step = () => {
      if (cancelled) return;

      let target: number;
      do {
        target = MIN_X + Math.random() * (MAX_X - MIN_X);
      } while (Math.abs(target - current) < 40);

      const dist = Math.abs(target - current);
      const moveDuration = Math.max(MIN_MOVE_MS, (dist / SPEED_PX_PER_SEC) * 1000);
      const restDuration = 1200 + Math.random() * 2400;
      const newScale = target > current ? -1 : 1;
      const needsFlip = newScale !== currentScale;

      current = target;
      currentScale = newScale;

      const startWalk = () => {
        if (cancelled) return;
        setMoveMs(moveDuration);
        setX(target);
        timeoutId = setTimeout(step, moveDuration + restDuration);
      };

      if (needsFlip) {
        setMoveMs(FLIP_MS);
        setScaleX(newScale);
        timeoutId = setTimeout(startWalk, FLIP_MS);
      } else {
        startWalk();
      }
    };

    timeoutId = setTimeout(step, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let showId: ReturnType<typeof setTimeout>;
    let hideId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const gap =
        QUIP_MIN_GAP_MS + Math.random() * (QUIP_MAX_GAP_MS - QUIP_MIN_GAP_MS);
      showId = setTimeout(() => {
        if (cancelled) return;
        setQuip(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
        hideId = setTimeout(() => {
          if (cancelled) return;
          setQuip(null);
          scheduleNext();
        }, QUIP_VISIBLE_MS);
      }, gap);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      clearTimeout(showId);
      clearTimeout(hideId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="hidden md:block absolute top-0 right-0 pointer-events-none w-[280px] h-[150px]"
    >
      <style>{`
        @keyframes ew-bob {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50%      { transform: rotate(3deg)  translateY(-2px); }
        }
        .ew-bob {
          animation: ew-bob 1.4s ease-in-out infinite;
          transform-origin: 50% 100%;
          display: inline-block;
        }
        @media (prefers-reduced-motion: reduce) {
          .ew-bob { animation: none; }
        }
      `}</style>

      <span
        className="absolute leading-none"
        style={{ fontSize: 64, right: 14, bottom: 14 }}
      >
        🌳
      </span>

      <span
        className="absolute leading-none"
        style={{
          fontSize: 60,
          right: 62,
          bottom: 12,
          transform: `translateX(${x}px) scaleX(${scaleX})`,
          transition: `transform ${moveMs}ms ease-in-out`,
        }}
      >
        <span className="ew-bob">🦒</span>
      </span>

      <span
        className="absolute"
        style={{
          right: 62,
          bottom: 12,
          width: 60,
          height: 60,
          transform: `translateX(${x}px)`,
          transition: `transform ${moveMs}ms ease-in-out`,
        }}
      >
        {quip && (
          <span
            className="absolute left-1/2 -translate-x-1/2 text-[11px] bg-white/95 border border-neutral-200 rounded-md px-2 py-0.5 shadow-sm whitespace-nowrap text-neutral-700"
            style={{ bottom: 64 }}
          >
            {quip}
          </span>
        )}
      </span>

      <div
        className="absolute left-0 right-0 leading-none overflow-hidden text-center whitespace-nowrap"
        style={{ fontSize: 18, letterSpacing: "-4px", bottom: 5 }}
      >
        {GROUND_BACK}
      </div>

      <div
        className="absolute left-0 right-0 leading-none overflow-hidden text-center whitespace-nowrap"
        style={{ fontSize: 18, letterSpacing: "-4px", bottom: 0 }}
      >
        {GROUND_FRONT}
      </div>
    </div>
  );
}
