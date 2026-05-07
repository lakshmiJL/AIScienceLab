import { useState, useEffect, useRef, useCallback } from "react";
import { LabShell } from "@/components/lab/LabShell";
import { Slider } from "@/components/lab/Slider";
import { QuizBlock } from "@/components/lab/QuizBlock";
import { Rocket as RocketIcon, RotateCcw, Gauge, Flame, BookOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const questions = [
  { q: "What gives a rocket its upward push?", options: ["Wind", "Thrust", "Gravity", "Drag"], answer: 1, explain: "Hot gases blast down → rocket pushes up. Newton's 3rd law!" },
  { q: "Escape velocity from Earth is about…", options: ["1 km/s", "11.2 km/s", "100 km/s", "300,000 km/s"], answer: 1 },
  { q: "Why do rockets have stages?", options: ["Look cool", "Drop empty fuel tanks to save weight", "Carry more astronauts", "Spin faster"], answer: 1, explain: "Lighter rocket = easier to accelerate." },
  { q: "What does a nose cone do?", options: ["Stores fuel", "Reduces air resistance", "Makes noise", "Holds engines"], answer: 1 },
];

type Smoke = { id: number; x: number; y: number; size: number; life: number };

const Rocket = () => {
  const [fuel, setFuel] = useState(70);          // tons
  const [engine, setEngine] = useState(75);      // engine power %
  const [boosters, setBoosters] = useState(2);
  const [payload, setPayload] = useState(20);    // tons (satellite, crew)

  const [phase, setPhase] = useState<"ready" | "countdown" | "ignition" | "flying" | "stage2" | "orbit" | "crashed">("ready");
  const [countdown, setCountdown] = useState(3);
  const [altitude, setAltitude] = useState(0);   // km
  const [velocity, setVelocity] = useState(0);   // m/s
  const [fuelLeft, setFuelLeft] = useState(100); // %
  const [throttle, setThrottle] = useState(100); // % live throttle
  const [stage, setStage] = useState<1 | 2>(1);
  const [maxQ, setMaxQ] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const smokeRef = useRef<Smoke[]>([]);
  const [, force] = useState(0);
  const idRef = useRef(0);
  const rafRef = useRef<number>();
  const stateRef = useRef({ alt: 0, vel: 0, fuel: 100, stage: 1 as 1 | 2 });

  // physics constants — STAGE 1 (with boosters & main fuel ~70% of total)
  const stage1Dry = 22 + boosters * 8;
  const stage2Dry = 8 + payload;
  const stage1Fuel = fuel * 0.7;
  const stage2Fuel = fuel * 0.3;
  const dryMass = stage1Dry + stage2Dry;                    // tons (full vehicle dry)
  const wetMass = dryMass + fuel;                            // tons at launch
  const maxThrust = (engine / 100) * 2200 + boosters * 800;  // kN (stage 1)
  const stage2Thrust = (engine / 100) * 900;                 // kN (vacuum-optimized)
  const burnRate = (engine / 100) * 0.9 + boosters * 0.35;   // %/s of stage fuel
  const twr = maxThrust / (wetMass * 9.81);                  // thrust-to-weight ratio at launch

  const reset = useCallback(() => {
    setPhase("ready");
    setAltitude(0);
    setVelocity(0);
    setFuelLeft(100);
    setThrottle(100);
    setCountdown(3);
    setStage(1);
    setMaxQ(false);
    smokeRef.current = [];
    stateRef.current = { alt: 0, vel: 0, fuel: 100, stage: 1 };
  }, []);

  const separateStage = () => {
    if (stage !== 1 || (phase !== "flying" && phase !== "ignition")) return;
    setStage(2);
    stateRef.current.stage = 2;
    stateRef.current.fuel = 100; // reset for stage 2 tank
    setFuelLeft(100);
    setPhase("stage2");
  };

  const launch = () => {
    if (phase !== "ready") return;
    reset();
    setPhase("countdown");
  };

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("ignition");
      setTimeout(() => setPhase("flying"), 700);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Physics loop
  useEffect(() => {
    if (phase !== "flying" && phase !== "stage2" && phase !== "ignition") return;

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(60, now - last) / 1000; // seconds
      last = now;

      const s = stateRef.current;

      if (phase === "ignition") {
        // pre-launch smoke billow, no movement
        for (let i = 0; i < 4; i++) {
          idRef.current++;
          smokeRef.current.push({
            id: idRef.current,
            x: 50 + (Math.random() - 0.5) * 12,
            y: 92 + (Math.random() - 0.5) * 4,
            size: 30 + Math.random() * 30,
            life: 0,
          });
        }
      } else {
        // throttle from state
        const throt = throttle / 100;
        const hasFuel = s.fuel > 0;

        // Stage-aware mass & thrust
        const isStage1 = s.stage === 1;
        const stageDry = isStage1 ? (stage1Dry + stage2Dry + stage2Fuel) : stage2Dry;
        const stageFuelTons = isStage1 ? stage1Fuel : stage2Fuel;
        const stageThrust = isStage1 ? maxThrust : stage2Thrust;
        const currentMass = stageDry + (s.fuel / 100) * stageFuelTons; // tons

        // gravity decreases with altitude (approx)
        const r = 6371 + s.alt;
        const g = 9.81 * Math.pow(6371 / r, 2);

        // air density (very rough exp atmosphere — negligible above ~80km)
        const rho = Math.exp(-s.alt / 10);
        const dynPressure = 0.5 * rho * s.vel * s.vel; // Pa-ish (arbitrary units)
        const drag = dynPressure * 0.0008; // m/s^2 deceleration

        // Detect Max-Q (peak dynamic pressure ~10–15 km)
        if (s.alt > 8 && s.alt < 16 && dynPressure > 8000 && !maxQ) setMaxQ(true);

        const thrustAccel = hasFuel ? (stageThrust * throt * 1000) / (currentMass * 1000) : 0; // m/s^2

        const accel = thrustAccel - g - Math.sign(s.vel) * drag;
        s.vel += accel * dt;
        s.alt += (s.vel * dt) / 1000; // km

        // burn fuel (rate depends on stage)
        const stageBurn = isStage1 ? burnRate : burnRate * 0.5;
        if (hasFuel) s.fuel = Math.max(0, s.fuel - stageBurn * throt * dt * 100 / 100);

        // emit exhaust smoke from nozzle while fuel + below 60km
        if (hasFuel && s.alt < 60) {
          const intensity = Math.ceil(throt * 5);
          for (let i = 0; i < intensity; i++) {
            idRef.current++;
            smokeRef.current.push({
              id: idRef.current,
              x: 50 + (Math.random() - 0.5) * 6,
              y: 92 + (Math.random() - 0.5) * 4,
              size: 14 + Math.random() * 18,
              life: 0,
            });
          }
        }

        setAltitude(s.alt);
        setVelocity(s.vel);
        setFuelLeft(s.fuel);

        // outcomes
        if (s.vel < -50 && s.alt < 1) {
          setPhase("crashed");
          return;
        }
        // Stage 1 ran out and not yet separated → suggest crash unless they staged
        if (!hasFuel && isStage1 && s.vel < 200 && s.alt < 100) {
          setPhase("crashed");
          return;
        }
        // Stage 2 ran out without orbit
        if (!hasFuel && !isStage1 && s.vel < 7800 && s.alt < 200) {
          setPhase("crashed");
          return;
        }
        if (s.alt > 200 && s.vel > 7800) {
          setPhase("orbit");
          return;
        }
      }

      // age smoke
      const sm = smokeRef.current;
      for (let i = sm.length - 1; i >= 0; i--) {
        sm[i].life += dt;
        sm[i].size += 30 * dt;
        sm[i].x += (Math.random() - 0.5) * 0.3;
        sm[i].y += 6 * dt; // smoke drifts down (relative to camera that follows rocket)
        if (sm[i].life > 1.5) sm.splice(i, 1);
      }
      if (sm.length > 200) sm.splice(0, sm.length - 200);

      force((v) => v + 1);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [phase, throttle, stage1Dry, stage2Dry, stage1Fuel, stage2Fuel, maxThrust, stage2Thrust, burnRate, maxQ]);

  // Camera Y offset (rocket stays centered, world scrolls)
  // Rocket on screen rises during early flight then locks to center
  const screenAlt = Math.min(altitude, 6); // first 6 km the rocket rises on screen
  const rocketBottomPct = 12 + (screenAlt / 6) * 50; // 12% -> 62%
  // After 6km, world starts to recede — fake by changing background gradient
  const skyT = Math.min(1, altitude / 80);

  return (
    <LabShell title="ROCKET LAUNCH BAY" subtitle="Engineer your rocket. Reach orbit. Don't crash." accent="accent">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-0 relative min-h-[620px] overflow-hidden">
          {/* Sky — transitions from blue → black as altitude rises */}
          <div className="absolute inset-0 transition-colors duration-300" style={{
            background: `linear-gradient(to bottom,
              rgba(${5 + (1 - skyT) * 10},${5 + (1 - skyT) * 30},${20 + (1 - skyT) * 60}, 1) 0%,
              rgba(${10 + (1 - skyT) * 30},${20 + (1 - skyT) * 60},${50 + (1 - skyT) * 120}, 1) 40%,
              rgba(${30 + (1 - skyT) * 100},${60 + (1 - skyT) * 80},${100 + (1 - skyT) * 100}, ${1 - skyT * 0.5}) 70%,
              rgba(${50 + (1 - skyT) * 80},${80 + (1 - skyT) * 60},${120 + (1 - skyT) * 60}, ${1 - skyT * 0.7}) 100%)`,
          }} />

          {/* Stars (visible at altitude) */}
          {Array.from({ length: 80 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              top: `${Math.random() * 80}%`, left: `${Math.random() * 100}%`,
              width: Math.random() < 0.8 ? 1 : 2,
              height: Math.random() < 0.8 ? 1 : 2,
              opacity: skyT * (0.4 + Math.random() * 0.6),
              transition: "opacity 0.4s",
            }} />
          ))}

          {/* Curvature of Earth at high altitude */}
          {altitude > 40 && (
            <div className="absolute -bottom-[60%] left-1/2 -translate-x-1/2 w-[200%] h-[120%] rounded-full"
              style={{
                background: "radial-gradient(circle at center, #4a8fd8 0%, #2a5a9a 40%, #1a3060 70%, transparent 75%)",
                opacity: Math.min(1, (altitude - 40) / 80),
                boxShadow: "inset 0 30px 80px rgba(180,220,255,0.4), 0 -20px 60px rgba(100,180,255,0.3)",
              }} />
          )}

          {/* Distant clouds */}
          {altitude < 30 && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/30 blur-2xl"
              style={{
                top: `${20 + i * 12}%`,
                left: `${(i * 23) % 100}%`,
                width: `${80 + i * 20}px`,
                height: `${30 + i * 10}px`,
                opacity: 0.5 - altitude / 60,
              }} />
          ))}

          {/* HUD */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between gap-2 pointer-events-none">
            <div className="space-y-1 font-mono text-xs">
              <div className="bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border border-primary/40 text-primary">
                <Gauge className="inline h-3 w-3 mr-1" /> ALT: <span className="text-white font-bold">{altitude.toFixed(1)} km</span>
              </div>
              <div className="bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border border-accent/40 text-accent">
                VEL: <span className="text-white font-bold">{Math.abs(velocity).toFixed(0)} m/s</span>
              </div>
              <div className="bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border border-warning/40 text-warning">
                <Flame className="inline h-3 w-3 mr-1" /> FUEL: <span className="text-white font-bold">{fuelLeft.toFixed(0)}%</span>
              </div>
            </div>
            <div className="space-y-1 font-mono text-xs text-right">
              <div className="bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border border-secondary/40 text-secondary">
                TWR: <span className={`font-bold ${twr > 1.3 ? "text-success" : twr > 1.1 ? "text-warning" : "text-destructive"}`}>{twr.toFixed(2)}</span>
              </div>
              <div className="bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border border-primary/40">
                MAX Δv: <span className="text-white font-bold">{(Math.log(wetMass / dryMass) * 3500).toFixed(0)} m/s</span>
              </div>
              <div className="bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border border-primary/40">
                STAGE <span className="text-accent font-bold">{stage}</span> · {phase.toUpperCase()}
              </div>
              {maxQ && altitude < 25 && (
                <div className="bg-destructive/30 backdrop-blur px-2.5 py-1.5 rounded border border-destructive text-destructive animate-pulse">
                  ⚠ MAX-Q
                </div>
              )}
            </div>
          </div>

          {/* Throttle slider (live during flight) */}
          {(phase === "flying" || phase === "ignition" || phase === "stage2") && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 bg-background/70 backdrop-blur p-3 rounded-xl border border-accent/40">
              <span className="text-[10px] font-mono text-accent">THROTTLE</span>
              <input
                type="range" min={0} max={100} value={throttle}
                onChange={(e) => setThrottle(Number(e.target.value))}
                className="h-32 accent-accent" style={{ writingMode: "vertical-lr" as any, direction: "rtl" as any }}
              />
              <span className="text-xs font-mono text-white font-bold">{throttle}%</span>
            </div>
          )}

          {/* Countdown overlay */}
          {phase === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/30">
              <div key={countdown} className="font-display font-black text-9xl text-accent neon-text-accent animate-scale-in">
                {countdown > 0 ? countdown : "GO!"}
              </div>
            </div>
          )}

          {phase === "orbit" && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 animate-fade-in">
              <div className="text-center">
                <div className="text-7xl mb-3 animate-float-slow">🛰️</div>
                <div className="font-display font-black text-4xl text-success neon-text mb-2">ORBIT ACHIEVED!</div>
                <p className="text-sm text-muted-foreground mb-4">Altitude: {altitude.toFixed(0)} km · Velocity: {velocity.toFixed(0)} m/s</p>
                <button onClick={reset} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-display font-bold">New Mission</button>
              </div>
            </div>
          )}

          {phase === "crashed" && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 animate-fade-in">
              <div className="text-center max-w-xs">
                <div className="text-7xl mb-3">💥</div>
                <div className="font-display font-black text-3xl text-destructive mb-2">MISSION FAILED</div>
                <p className="text-sm text-muted-foreground mb-4">
                  {twr < 1.1 ? "TWR too low — add boosters or reduce payload!" : stage === 1 ? "Stage 1 ran dry — try separating stages sooner!" : "Stage 2 ran out before orbit — add more fuel!"}
                </p>
                <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-muted text-foreground font-display font-bold">
                  <RotateCcw className="h-4 w-4" /> Retry
                </button>
              </div>
            </div>
          )}

          {/* Smoke billows around launch pad / rocket */}
          {smokeRef.current.map((s) => (
            <div key={s.id} className="absolute rounded-full pointer-events-none"
              style={{
                left: `${s.x}%`,
                bottom: `${rocketBottomPct - 2 + (s.y - 92) * 0.3}%`,
                width: s.size,
                height: s.size,
                background: `radial-gradient(circle, rgba(${230 - s.life * 50},${220 - s.life * 60},${210 - s.life * 80},${Math.max(0, 0.7 - s.life * 0.45)}) 0%, transparent 70%)`,
                transform: "translate(-50%, 50%)",
                filter: "blur(6px)",
              }} />
          ))}

          {/* Launch pad */}
          {altitude < 1 && (
            <>
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-stone-900 via-stone-800/80 to-transparent" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-12 w-40 h-3 bg-stone-700 rounded-sm border-t border-stone-500" />
              {/* Tower */}
              <div className="absolute bottom-12 left-[35%] w-1 h-32 bg-stone-600" />
              <div className="absolute bottom-40 left-[35%] w-8 h-1 bg-stone-600" />
              <div className="absolute bottom-32 left-[35%] w-6 h-1 bg-stone-600" />
              <div className="absolute bottom-24 left-[35%] w-6 h-1 bg-stone-600" />
            </>
          )}

          {/* ROCKET — detailed Falcon-style */}
          <div className="absolute left-1/2 -translate-x-1/2 z-10 transition-[bottom] duration-100"
            style={{ bottom: `${rocketBottomPct}%` }}>
            <div className="relative" style={{ width: 60, height: 200 }}>
              {/* Nose cone */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-4 h-12"
                style={{
                  background: "linear-gradient(to bottom, #f5f5f5, #c5c5c5)",
                  clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
                }} />
              {/* Payload fairing */}
              <div className="absolute left-1/2 -translate-x-1/2 top-12 w-6 h-10 rounded-t-md"
                style={{ background: "linear-gradient(to bottom, #e8e8e8, #b0b0b0)" }} />
              {/* Stage 2 */}
              <div className="absolute left-1/2 -translate-x-1/2 top-22 w-7 h-16"
                style={{ top: 56, background: "linear-gradient(to right, #888, #fafafa 30%, #fafafa 70%, #888)" }}>
                <div className="absolute inset-x-1 top-2 h-px bg-stone-400" />
                <div className="absolute inset-x-1 bottom-2 h-px bg-stone-400" />
              </div>
              {/* Inter-stage band */}
              <div className="absolute left-1/2 -translate-x-1/2 w-7 h-1.5 bg-stone-700" style={{ top: 72 }} />
              {/* Stage 1 (main body) — falls away on separation */}
              <motion.div
                animate={stage === 2 ? { y: 200, opacity: 0, rotate: 25 } : { y: 0, opacity: 1, rotate: 0 }}
                transition={{ duration: 1.2, ease: "easeIn" }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="absolute left-1/2 -translate-x-1/2 w-7 h-24"
                  style={{
                    top: 74,
                    background: "linear-gradient(to right, #777 0%, #fdfdfd 25%, #fff 50%, #fdfdfd 75%, #777 100%)",
                  }}>
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[6px] font-display font-black text-stone-700 leading-none">USA</div>
                  <div className="absolute top-7 left-1/2 -translate-x-1/2 w-4 h-2.5"
                    style={{ background: "linear-gradient(180deg, #b22 0%, #b22 33%, #fff 33%, #fff 66%, #2147a8 66%)" }} />
                  <div className="absolute inset-y-2 left-1 w-px bg-stone-400/60" />
                  <div className="absolute inset-y-2 right-1 w-px bg-stone-400/60" />
                  {stage === 1 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-20 bg-stone-800/40 rounded-full overflow-hidden">
                      <div className="absolute bottom-0 inset-x-0 bg-orange-400 transition-all" style={{ height: `${fuelLeft}%` }} />
                    </div>
                  )}
                </div>
                {/* Engine bell */}
                <div className="absolute left-1/2 -translate-x-1/2 w-9 h-4 rounded-b-md"
                  style={{ top: 98 + 74, background: "linear-gradient(to bottom, #555, #222)", clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)" }} />
                {/* Grid fins */}
                <div className="absolute w-2 h-3 bg-stone-600 border border-stone-400" style={{ top: 78, left: -2 }} />
                <div className="absolute w-2 h-3 bg-stone-600 border border-stone-400" style={{ top: 78, right: -2 }} />
                {/* Fins at base */}
                <div className="absolute" style={{ top: 160, left: -8, width: 12, height: 14, background: "linear-gradient(135deg, #999, #555)", clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
                <div className="absolute" style={{ top: 160, right: -8, width: 12, height: 14, background: "linear-gradient(225deg, #999, #555)", clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} />
              </motion.div>

              {/* Boosters — also drop on stage separation */}
              <motion.div
                animate={stage === 2 ? { y: 220, opacity: 0, rotate: -20 } : { y: 0, opacity: 1, rotate: 0 }}
                transition={{ duration: 1.4, ease: "easeIn" }}
                className="absolute inset-0 pointer-events-none"
              >
                {Array.from({ length: boosters }).map((_, i) => {
                  const side = i % 2 === 0 ? -1 : 1;
                  const stack = Math.floor(i / 2);
                  return (
                    <div key={i} className="absolute" style={{
                      top: 86 + stack * 4,
                      left: side === -1 ? -10 - stack * 3 : undefined,
                      right: side === 1 ? -10 - stack * 3 : undefined,
                      width: 8, height: 90,
                      background: "linear-gradient(to right, #888, #f0f0f0, #888)",
                      borderRadius: "4px 4px 2px 2px",
                    }}>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-3" style={{ background: "#ddd", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-2 rounded-b-sm" style={{ background: "linear-gradient(to bottom, #555, #222)" }} />
                      {stage === 1 && (phase === "flying" || phase === "ignition") && fuelLeft > 0 && (
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-2 h-6">
                          <div className="absolute inset-0 rounded-b-full" style={{
                            background: "linear-gradient(to bottom, #fff5b0 0%, #ffd24a 30%, #ff7a1a 60%, #c92500 100%)",
                            filter: "blur(0.5px)",
                            animation: "flameFlicker 0.08s infinite alternate",
                          }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>

              {/* MAIN ENGINE FLAME — Stage 1 (large) */}
              {stage === 1 && (phase === "flying" || phase === "ignition") && fuelLeft > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 174 }}>
                  <div className="absolute -inset-4 rounded-full blur-xl"
                    style={{ background: "radial-gradient(circle, rgba(255,150,30,0.7), transparent 60%)", animation: "flameGlow 0.15s infinite alternate" }} />
                  <div className="relative w-5 h-16 mx-auto"
                    style={{
                      background: "linear-gradient(to bottom, #aef0ff 0%, #fff5b0 15%, #ffd24a 35%, #ff7a1a 65%, #c92500 100%)",
                      borderRadius: "0 0 50% 50% / 0 0 100% 100%",
                      filter: "blur(0.5px)",
                      animation: "flameFlicker 0.07s infinite alternate",
                    }} />
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/80 blur-sm" />
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/60 blur-sm" />
                </div>
              )}

              {/* STAGE 2 ENGINE FLAME — smaller, vacuum-blue */}
              {stage === 2 && phase === "stage2" && fuelLeft > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 72 }}>
                  <div className="absolute -inset-3 rounded-full blur-lg"
                    style={{ background: "radial-gradient(circle, rgba(120,200,255,0.6), transparent 60%)", animation: "flameGlow 0.15s infinite alternate" }} />
                  <div className="relative w-3 h-10 mx-auto"
                    style={{
                      background: "linear-gradient(to bottom, #d4f5ff 0%, #aef0ff 30%, #5fb5ff 70%, #2055a8 100%)",
                      borderRadius: "0 0 50% 50% / 0 0 100% 100%",
                      animation: "flameFlicker 0.07s infinite alternate",
                    }} />
                </div>
              )}
            </div>
          </div>

          {/* Launch / Stage button */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {phase === "ready" && (
              <button onClick={launch} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-rocket text-white font-display font-black tracking-widest hover:scale-105 transition animate-pulse-glow text-lg shadow-2xl">
                <RocketIcon className="h-6 w-6" /> LAUNCH
              </button>
            )}
            {(phase === "flying" || phase === "ignition") && stage === 1 && (
              <button onClick={separateStage} className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-display font-black tracking-widest text-white transition shadow-2xl ${fuelLeft < 25 ? "bg-destructive animate-pulse" : "bg-accent hover:scale-105"}`}>
                ⚡ SEPARATE STAGE 1
              </button>
            )}
          </div>

          {!showTutorial && (
            <button onClick={() => { setShowTutorial(true); setTutorialStep(0); }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur border border-primary/40 text-primary text-xs font-display font-bold hover:bg-primary/20 transition">
              <BookOpen className="h-3 w-3" /> Staging Tutorial
            </button>
          )}

          <AnimatePresence>
            {showTutorial && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <motion.div
                  key={tutorialStep}
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="glass-panel rounded-2xl p-6 max-w-md relative border border-accent/40"
                >
                  <button onClick={() => setShowTutorial(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                  <div className="text-xs font-mono text-accent mb-2">STEP {tutorialStep + 1} / 4</div>
                  {tutorialStep === 0 && (<>
                    <h3 className="font-display font-black text-2xl mb-2 text-accent">🚀 Why Stage?</h3>
                    <p className="text-sm text-foreground/90 mb-3">Real rockets are <b>multi-stage</b>: once Stage 1's fuel is gone, the empty tank becomes dead weight. Dropping it makes Stage 2 lighter and easier to push to orbit.</p>
                    <p className="text-xs text-muted-foreground">Saturn V had 3 stages. Falcon 9 has 2.</p>
                  </>)}
                  {tutorialStep === 1 && (<>
                    <h3 className="font-display font-black text-2xl mb-2 text-accent">⚡ When to Separate?</h3>
                    <p className="text-sm text-foreground/90 mb-3">Wait until <b>Stage 1 fuel is nearly empty</b> (~20%) AND you're above ~60 km altitude. Stage too early — you waste fuel. Too late — you waste mass.</p>
                    <p className="text-xs text-muted-foreground">The button turns red when ready.</p>
                  </>)}
                  {tutorialStep === 2 && (<>
                    <h3 className="font-display font-black text-2xl mb-2 text-accent">🔥 Max-Q</h3>
                    <p className="text-sm text-foreground/90 mb-3">Around 10–15 km altitude, air resistance peaks. This is <b>Max-Q</b>. Real rockets <b>throttle down</b> here to avoid breaking apart!</p>
                    <p className="text-xs text-muted-foreground">Drop the throttle slider to ~70% during Max-Q.</p>
                  </>)}
                  {tutorialStep === 3 && (<>
                    <h3 className="font-display font-black text-2xl mb-2 text-accent">🛰️ Mission</h3>
                    <p className="text-sm text-foreground/90 mb-3">Reach <b>200 km altitude</b> at <b>7,800 m/s</b> for orbit. You'll need both stages and a TWR &gt; 1.3 at launch.</p>
                    <p className="text-xs text-muted-foreground">Good luck, Commander!</p>
                  </>)}
                  <div className="flex justify-between mt-5">
                    <button onClick={() => tutorialStep > 0 ? setTutorialStep(tutorialStep - 1) : setShowTutorial(false)}
                      className="px-4 py-2 rounded-lg bg-muted/40 text-muted-foreground text-sm font-display">
                      {tutorialStep === 0 ? "Skip" : "Back"}
                    </button>
                    <button onClick={() => tutorialStep < 3 ? setTutorialStep(tutorialStep + 1) : setShowTutorial(false)}
                      className="px-5 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-display font-bold">
                      {tutorialStep < 3 ? "Next →" : "Start Mission"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Build panel */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-bold text-lg">🛠 Build Rocket</h3>
            <Slider label="Fuel" value={fuel} onChange={setFuel} min={20} max={150} unit=" t" />
            <Slider label="Engine Power" value={engine} onChange={setEngine} min={30} max={100} unit="%" color="accent" />
            <Slider label="Boosters" value={boosters} onChange={setBoosters} min={0} max={4} unit="" color="secondary" />
            <Slider label="Payload" value={payload} onChange={setPayload} min={5} max={60} unit=" t" color="accent" />

            <div className="pt-3 border-t border-primary/20 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">Wet mass</span><span className="text-white">{wetMass.toFixed(0)} t</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Max thrust</span><span className="text-white">{maxThrust.toFixed(0)} kN</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">TWR</span>
                <span className={`font-bold ${twr > 1.3 ? "text-success" : twr > 1.1 ? "text-warning" : "text-destructive"}`}>{twr.toFixed(2)}</span>
              </div>
              <div className={`mt-2 p-2 rounded text-center font-display font-bold ${twr > 1.3 && fuel > 50 ? "bg-success/20 text-success" : twr > 1.1 ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"}`}>
                {twr < 1.1 ? "✗ Won't lift off" : twr > 1.3 && fuel > 50 ? "✓ Orbit-capable" : "⚠ Marginal"}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="font-display font-bold text-2xl mb-3">🚀 Rocket Science</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20"><b className="text-accent">TWR</b> (thrust-to-weight) must be &gt;1 to lift off. Aim for 1.3+.</div>
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20"><b className="text-accent">Δv (delta-v)</b> = total speed change you can produce. Need ~9,400 m/s for orbit.</div>
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20"><b className="text-accent">Tsiolkovsky equation:</b> Δv = Isp · g · ln(m_wet / m_dry).</div>
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20"><b className="text-accent">Mach diamonds</b> in the exhaust = supersonic shock waves!</div>
          </div>
        </div>
        <div><QuizBlock questions={questions} badge="Rocket Engineer" /></div>
      </div>

      <style>{`
        @keyframes flameFlicker { 0% { transform: scaleY(1) scaleX(1); } 100% { transform: scaleY(1.1) scaleX(0.92); } }
        @keyframes flameGlow { 0% { opacity: 0.7; } 100% { opacity: 1; } }
      `}</style>
    </LabShell>
  );
};

export default Rocket;
