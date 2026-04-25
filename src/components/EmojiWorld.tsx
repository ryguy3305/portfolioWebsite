"use client";

import { useEffect, useState } from "react";

const GROUND_BACK = "🌱🌿🌱🌱🌱🌱🌱🌿🌱🌱🌱🌿🌱🌱🌱🌿🌱🌱🌱🌱🌱🌿🌱🌱🌿🌱🌱";
const GROUND_FRONT = "🌱🌱🌿🌱🌱🌱🪨🌱🌱🌿🌱🌱🌱🌿🌱🪨🌱🌱🌱🌿🌱🌱🌱🌱🌿🌱🌱";

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
  "blackpink in your area",
];

const MIN_X = -210;
const MAX_X = 0;
const SPEED_PX_PER_SEC = 30;
const MIN_MOVE_MS = 1800;
const FLIP_MS = 450;
const QUIP_MIN_GAP_MS = 6000;
const QUIP_MAX_GAP_MS = 14000;
const QUIP_VISIBLE_MS = 2800;

const COLUMBUS_LAT = 39.96;
const COLUMBUS_LON = -82.99;
const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${COLUMBUS_LAT}&longitude=${COLUMBUS_LON}&current=weather_code,is_day&timezone=America%2FNew_York`;
const WEATHER_REFRESH_MS = 10 * 60 * 1000;

const MOONS = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
// 0:1900-01-01 reference; using a known new moon as the cycle anchor
const SYNODIC_MS = 29.530588853 * 24 * 60 * 60 * 1000;
const KNOWN_NEW_MOON_MS = Date.parse("2000-01-06T18:14:00Z");

function moonPhaseIndex(now = Date.now()): number {
  const phase = ((now - KNOWN_NEW_MOON_MS) % SYNODIC_MS) / SYNODIC_MS;
  return Math.floor(((phase + 1) % 1) * 8) % 8;
}

type Condition = "clear" | "partly" | "cloudy" | "rain" | "snow" | "fog" | "storm";
type Scene = { kind: Condition; isNight: boolean; moonIdx: number };

const CONDITION_LABEL: Record<Condition, string> = {
  clear: "Clear",
  partly: "Partly Cloudy",
  cloudy: "Cloudy",
  rain: "Rain",
  snow: "Snow",
  fog: "Fog",
  storm: "Thunderstorm",
};

function describeScene(scene: Scene): string {
  if (scene.kind === "clear" && !scene.isNight) return "Sunny";
  return CONDITION_LABEL[scene.kind];
}

function formatColumbusTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  });
}

function codeToCondition(code: number): Condition {
  if (code === 0 || code === 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code === 95 || code === 96 || code === 99) return "storm";
  return "clear";
}

type ScenePreset = {
  gradient: string;
  sun: boolean;
  moon: boolean;
  stars: boolean;
  cloudCount: 0 | 1 | 2 | 3;
  cloudFilter: string | null;
  particles: "rain" | "snow" | null;
  flash: boolean;
  fog: boolean;
};

const PRESETS: Record<string, ScenePreset> = {
  "clear-day": {
    gradient: "linear-gradient(to bottom, #9ed8ff 0%, #d4ecfb 100%)",
    sun: true, moon: false, stars: false,
    cloudCount: 1, cloudFilter: null,
    particles: null, flash: false, fog: false,
  },
  "clear-night": {
    gradient: "linear-gradient(to bottom, #0a1530 0%, #1f3a5f 100%)",
    sun: false, moon: true, stars: true,
    cloudCount: 0, cloudFilter: null,
    particles: null, flash: false, fog: false,
  },
  "partly-day": {
    gradient: "linear-gradient(to bottom, #a8cee0 0%, #cbe1ec 100%)",
    sun: true, moon: false, stars: false,
    cloudCount: 2, cloudFilter: null,
    particles: null, flash: false, fog: false,
  },
  "partly-night": {
    gradient: "linear-gradient(to bottom, #122035 0%, #2a3852 100%)",
    sun: false, moon: true, stars: true,
    cloudCount: 2, cloudFilter: "brightness(0.7)",
    particles: null, flash: false, fog: false,
  },
  "cloudy-day": {
    gradient: "linear-gradient(to bottom, #b8c4cf 0%, #dde4e8 100%)",
    sun: false, moon: false, stars: false,
    cloudCount: 3, cloudFilter: null,
    particles: null, flash: false, fog: false,
  },
  "cloudy-night": {
    gradient: "linear-gradient(to bottom, #1a2030 0%, #2a3346 100%)",
    sun: false, moon: false, stars: false,
    cloudCount: 3, cloudFilter: "brightness(0.6)",
    particles: null, flash: false, fog: false,
  },
  "rain-day": {
    gradient: "linear-gradient(to bottom, #5d6d7e 0%, #98a4ad 100%)",
    sun: false, moon: false, stars: false,
    cloudCount: 3, cloudFilter: "brightness(0.85)",
    particles: "rain", flash: false, fog: false,
  },
  "rain-night": {
    gradient: "linear-gradient(to bottom, #0d1726 0%, #2a3346 100%)",
    sun: false, moon: false, stars: false,
    cloudCount: 3, cloudFilter: "brightness(0.5)",
    particles: "rain", flash: false, fog: false,
  },
  "snow-day": {
    gradient: "linear-gradient(to bottom, #d4dde2 0%, #ecf0f3 100%)",
    sun: false, moon: false, stars: false,
    cloudCount: 3, cloudFilter: null,
    particles: "snow", flash: false, fog: false,
  },
  "snow-night": {
    gradient: "linear-gradient(to bottom, #1a2436 0%, #2c3a52 100%)",
    sun: false, moon: false, stars: false,
    cloudCount: 3, cloudFilter: "brightness(0.7)",
    particles: "snow", flash: false, fog: false,
  },
  "storm-day": {
    gradient: "linear-gradient(to bottom, #3a4452 0%, #5a6470 100%)",
    sun: false, moon: false, stars: false,
    cloudCount: 3, cloudFilter: "brightness(0.5)",
    particles: "rain", flash: true, fog: false,
  },
  "storm-night": {
    gradient: "linear-gradient(to bottom, #0a0e1a 0%, #1c2233 100%)",
    sun: false, moon: false, stars: false,
    cloudCount: 3, cloudFilter: "brightness(0.4)",
    particles: "rain", flash: true, fog: false,
  },
  "fog-day": {
    gradient: "linear-gradient(to bottom, #b9c2c8 0%, #d6dcdf 100%)",
    sun: false, moon: false, stars: false,
    cloudCount: 0, cloudFilter: null,
    particles: null, flash: false, fog: true,
  },
  "fog-night": {
    gradient: "linear-gradient(to bottom, #1f262e 0%, #353c44 100%)",
    sun: false, moon: false, stars: false,
    cloudCount: 0, cloudFilter: null,
    particles: null, flash: false, fog: true,
  },
};

const STAR_POSITIONS: { top: number; left: number; size: number; delay: string; glyph: string }[] = [
  { top: 12, left: 70,  size: 8, delay: "0s",    glyph: "✨" },
  { top: 26, left: 130, size: 7, delay: "-1.5s", glyph: "⭐" },
  { top: 8,  left: 200, size: 7, delay: "-3s",   glyph: "✨" },
  { top: 30, left: 250, size: 8, delay: "-2.2s", glyph: "⭐" },
  { top: 18, left: 310, size: 7, delay: "-0.8s", glyph: "✨" },
  { top: 36, left: 90,  size: 6, delay: "-1.1s", glyph: "✨" },
];

const PARTICLE_COLUMNS = [10, 55, 95, 140, 180, 225, 265, 310];

export default function EmojiWorld() {
  const [x, setX] = useState(MAX_X);
  const [moveMs, setMoveMs] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [quip, setQuip] = useState<string | null>(null);
  const [scene, setScene] = useState<Scene>(() => ({
    kind: "clear",
    isNight: false,
    moonIdx: moonPhaseIndex(),
  }));
  const [time, setTime] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const tick = () => setTime(formatColumbusTime());
    tick();
    const intervalId = window.setInterval(tick, 60_000);
    return () => clearInterval(intervalId);
  }, []);

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
        timeoutId = setTimeout(startWalk, FLIP_MS + 80);
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

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    const update = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      try {
        const res = await fetch(WEATHER_URL);
        if (res.ok) {
          const data: { current?: { weather_code?: number; is_day?: number } } =
            await res.json();
          const code = data.current?.weather_code;
          const is_day = data.current?.is_day;
          if (!cancelled && typeof code === "number" && typeof is_day === "number") {
            setScene({
              kind: codeToCondition(code),
              isNight: is_day === 0,
              moonIdx: moonPhaseIndex(),
            });
          }
        }
      } catch {
        // keep last known scene on failure
      }
      if (!cancelled) setLoaded(true);
    };

    update();
    intervalId = window.setInterval(update, WEATHER_REFRESH_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const preset =
    PRESETS[`${scene.kind}-${scene.isNight ? "night" : "day"}`] ?? PRESETS["clear-day"];

  return (
    <div
      aria-hidden="true"
      className="hidden md:block absolute top-0 right-0 pointer-events-none w-[370px] h-[150px]"
      style={{ opacity: loaded ? 1 : 0, transition: "opacity 500ms ease-out" }}
    >
      <div className="absolute inset-0 rounded-lg overflow-hidden">
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
          @keyframes ew-cloud-drift {
            from { transform: translateX(-50px); }
            to   { transform: translateX(390px); }
          }
          .ew-cloud-1 { animation: ew-cloud-drift 55s linear infinite; }
          .ew-cloud-2 { animation: ew-cloud-drift 75s linear infinite; animation-delay: -28s; }
          .ew-cloud-3 { animation: ew-cloud-drift 65s linear infinite; animation-delay: -50s; }
          @keyframes ew-rain-fall {
            0%   { transform: translate(0, -20px) rotate(12deg); opacity: 0; }
            10%  { opacity: 0.75; }
            90%  { opacity: 0.75; }
            100% { transform: translate(-15px, 160px) rotate(12deg); opacity: 0; }
          }
          .ew-rain { animation: ew-rain-fall 1.4s linear infinite; }
          @keyframes ew-snow-fall {
            0%   { transform: translate(0, -20px); opacity: 0; }
            10%  { opacity: 0.9; }
            50%  { transform: translate(8px, 75px); }
            90%  { opacity: 0.9; }
            100% { transform: translate(-2px, 165px); opacity: 0; }
          }
          .ew-snow { animation: ew-snow-fall 4.2s linear infinite; }
          @keyframes ew-flash {
            0%, 84%, 100% { opacity: 0; }
            85%, 86%      { opacity: 0.7; }
            88%           { opacity: 0; }
            89%, 90%      { opacity: 0.4; }
            91%           { opacity: 0; }
          }
          .ew-flash-a { animation: ew-flash 7s ease-out infinite; }
          .ew-flash-b { animation: ew-flash 11s ease-out infinite; animation-delay: -3s; }
          @keyframes ew-twinkle {
            0%, 100% { opacity: 0.35; }
            50%      { opacity: 1; }
          }
          .ew-twinkle { animation: ew-twinkle 2.6s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .ew-bob, .ew-cloud-1, .ew-cloud-2, .ew-cloud-3,
            .ew-rain, .ew-snow, .ew-flash-a, .ew-flash-b, .ew-twinkle {
              animation: none;
            }
          }
        `}</style>

        <div
          className="absolute inset-0"
          style={{ background: preset.gradient }}
        />

        {preset.sun && (
          <span
            className="absolute leading-none"
            style={{ fontSize: 28, top: 8, left: 16 }}
          >
            ☀️
          </span>
        )}

        {preset.moon && (
          <span
            className="absolute leading-none"
            style={{ fontSize: 26, top: 8, left: 24 }}
          >
            {MOONS[scene.moonIdx]}
          </span>
        )}

        {preset.stars && (
          <>
            {STAR_POSITIONS.map((s, i) => (
              <span
                key={i}
                className="ew-twinkle absolute leading-none"
                style={{
                  top: s.top,
                  left: s.left,
                  fontSize: s.size,
                  animationDelay: s.delay,
                }}
              >
                {s.glyph}
              </span>
            ))}
          </>
        )}

        <div
          className="absolute inset-0 overflow-hidden"
          style={{ filter: preset.cloudFilter ?? undefined }}
        >
          {preset.cloudCount >= 1 && (
            <span
              className="ew-cloud-1 absolute leading-none"
              style={{ fontSize: 26, top: 6, left: 0 }}
            >
              ☁️
            </span>
          )}
          {preset.cloudCount >= 2 && (
            <span
              className="ew-cloud-2 absolute leading-none"
              style={{ fontSize: 20, top: 30, left: 0 }}
            >
              ☁️
            </span>
          )}
          {preset.cloudCount >= 3 && (
            <span
              className="ew-cloud-3 absolute leading-none"
              style={{ fontSize: 30, top: 2, left: 0 }}
            >
              ☁️
            </span>
          )}
        </div>

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

        <div
          className="absolute left-0 right-0"
          style={{ bottom: 0, height: 9, background: "#6b4f2f" }}
        />

        <div
          className="absolute left-0 right-0 leading-none overflow-hidden text-center whitespace-nowrap"
          style={{ fontSize: 18, letterSpacing: "-4px", bottom: 5, transform: "translateX(3px)" }}
        >
          {GROUND_BACK}
        </div>

        <div
          className="absolute left-0 right-0 leading-none overflow-hidden text-center whitespace-nowrap"
          style={{ fontSize: 18, letterSpacing: "-4px", bottom: 0 }}
        >
          {GROUND_FRONT}
        </div>

        {preset.particles && (
          <div className="absolute inset-0 overflow-hidden">
            {PARTICLE_COLUMNS.map((leftPx, i) => (
              <span
                key={i}
                className={`absolute leading-none ${preset.particles === "rain" ? "ew-rain" : "ew-snow"}`}
                style={{
                  left: leftPx,
                  top: -10,
                  fontSize: preset.particles === "rain" ? 12 : 14,
                  animationDelay: `${(i * 0.31) % (preset.particles === "rain" ? 1.4 : 4.2)}s`,
                }}
              >
                {preset.particles === "rain" ? "💧" : "❄️"}
              </span>
            ))}
          </div>
        )}

        {preset.fog && (
          <div
            className="absolute inset-0"
            style={{
              background: scene.isNight
                ? "rgba(60,60,70,0.5)"
                : "rgba(240,240,240,0.55)",
            }}
          />
        )}

        {preset.flash && (
          <>
            <div
              className="ew-flash-a absolute inset-0"
              style={{ background: "white" }}
            />
            <div
              className="ew-flash-b absolute inset-0"
              style={{ background: "white" }}
            />
          </>
        )}
      </div>

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
        className="absolute left-0 right-0 text-center text-[10px] tracking-wide text-neutral-500"
        style={{ top: 156 }}
      >
        Columbus OH - {time ?? "—"} - {describeScene(scene)}
      </div>
    </div>
  );
}
