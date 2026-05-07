import { useState, useEffect, useRef, useCallback } from "react";
import { LabShell } from "@/components/lab/LabShell";
import { Slider } from "@/components/lab/Slider";
import { QuizBlock } from "@/components/lab/QuizBlock";
import { Flame, Info, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const facts = [
  { t: "Magma vs Lava", d: "Molten rock UNDER the surface is magma. The moment it bursts out, we call it lava." },
  { t: "Why eruptions happen", d: "Trapped gases build pressure. When the volcano can't hold it anymore — BOOM!" },
  { t: "3 main types", d: "Shield (gentle), Stratovolcano (explosive cones), Cinder cone (small & steep)." },
  { t: "Plate tectonics", d: "Most volcanoes form where Earth's giant rocky plates meet, slide, or pull apart." },
  { t: "Pyroclastic flow", d: "A 700°C avalanche of gas + ash that races down at 700 km/h. The deadliest part of an eruption." },
  { t: "Famous ones", d: "Vesuvius (Italy), Krakatoa (Indonesia), Mauna Loa (Hawaii) — all very different beasts!" },
];

const questions = [
  { q: "What do we call molten rock once it leaves the volcano?", options: ["Magma", "Lava", "Ash", "Pumice"], answer: 1, explain: "Underground = magma. Above ground = lava!" },
  { q: "What is the main cause of explosive eruptions?", options: ["Cold water", "Trapped gas pressure", "Wind", "Earthquakes only"], answer: 1, explain: "Built-up gas under sticky magma triggers the biggest blasts." },
  { q: "Which volcano shape erupts most violently?", options: ["Shield", "Cinder cone", "Stratovolcano", "Lava dome"], answer: 2, explain: "Stratovolcanoes have thick magma that traps gas — leading to mega eruptions." },
  { q: "Where do most volcanoes form?", options: ["In deserts", "At plate boundaries", "In forests", "On rivers"], answer: 1 },
];

type Particle = {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  life: number;
  maxLife: number;
  type: "lava" | "ash" | "ember" | "rock";
  color: string;
  trail?: { x: number; y: number }[];
};

type Lightning = { id: number; x: number; y: number; life: number; segs: { x: number; y: number }[] };

const Volcano = () => {
  const [pressure, setPressure] = useState(60);
  const [gas, setGas] = useState(55);
  const [temp, setTemp] = useState(1100);
  const [crater, setCrater] = useState("medium");
  const [mode, setMode] = useState<"gentle" | "explosive" | "mega">("explosive");
  const [erupting, setErupting] = useState(false);
  const [shockwave, setShockwave] = useState(0);
  const [lavaFlow, setLavaFlow] = useState(0); // 0 -> 1 lava progressing down slopes
  const [smokeColumn, setSmokeColumn] = useState(0);
  const particlesRef = useRef<Particle[]>([]);
  const lightningRef = useRef<Lightning[]>([]);
  const [pyroFlow, setPyroFlow] = useState(0);   // 0..1 pyroclastic flow descending
  const [, force] = useState(0);
  const idRef = useRef(0);
  const rafRef = useRef<number>();
  const eruptStartRef = useRef<number>(0);

  const power = Math.min(100, Math.max(5, (pressure * 0.45 + gas * 0.45 + (temp - 700) / 12) + (mode === "mega" ? 20 : mode === "explosive" ? 5 : -25)));

  const craterWidth = crater === "small" ? 6 : crater === "large" ? 14 : 10;

  const spawnParticles = useCallback((t: number) => {
    const intensity = power / 100;
    const burst = mode === "mega" ? 14 : mode === "explosive" ? 9 : 4;
    for (let i = 0; i < burst; i++) {
      idRef.current++;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * (mode === "mega" ? 1.6 : 1.0);
      const speed = 2 + Math.random() * (4 + intensity * 8);
      const isAsh = Math.random() < 0.35;
      const isRock = Math.random() < 0.08 && mode !== "gentle";
      const lavaColors = ["#fff2a8", "#ffd24a", "#ff9a1f", "#ff5a1a", "#e02b00"];
      const ashColors = ["#3a3530", "#5a504a", "#2a2520", "#4a4035"];
      const type: Particle["type"] = isRock ? "rock" : isAsh ? "ash" : Math.random() < 0.4 ? "ember" : "lava";
      particlesRef.current.push({
        id: idRef.current,
        x: 50 + (Math.random() - 0.5) * craterWidth * 0.4,
        y: 34,
        vx: Math.cos(angle) * speed * 0.6,
        vy: Math.sin(angle) * speed,
        size: type === "rock" ? 4 + Math.random() * 5 : type === "ash" ? 6 + Math.random() * 10 : 2 + Math.random() * 4,
        life: 0,
        maxLife: type === "ash" ? 180 : type === "rock" ? 80 : 90,
        type,
        color: type === "ash" ? ashColors[Math.floor(Math.random() * ashColors.length)] : type === "rock" ? "#3a1408" : lavaColors[Math.floor(Math.random() * lavaColors.length)],
        trail: type === "rock" ? [] : undefined,
      });
    }
  }, [power, mode, craterWidth]);

  const erupt = () => {
    if (erupting) return;
    setErupting(true);
    setShockwave(0);
    setSmokeColumn(0);
    setLavaFlow(0);
    setPyroFlow(0);
    lightningRef.current = [];
    eruptStartRef.current = performance.now();
    setTimeout(() => setShockwave(1), 50);
    setTimeout(() => setShockwave(0), 1400);
  };

  // Animation loop
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(40, now - last) / 16.67;
      last = now;

      const elapsed = (now - eruptStartRef.current) / 1000;
      if (erupting) {
        setSmokeColumn(Math.min(1, elapsed / 3.5));
        setLavaFlow(Math.min(1, elapsed / 5));
        // pyroclastic flow starts ~1.5s in and races down for 5s
        if (elapsed > 1.5) setPyroFlow(Math.min(1, (elapsed - 1.5) / 4));
        if (elapsed < 3.2) spawnParticles(now);

        // Volcanic lightning in mega/explosive mode
        if ((mode === "mega" || mode === "explosive") && elapsed < 4 && Math.random() < (mode === "mega" ? 0.08 : 0.04)) {
          idRef.current++;
          const baseX = 50 + (Math.random() - 0.5) * 25;
          const baseY = 5 + Math.random() * 25;
          const segs: { x: number; y: number }[] = [{ x: baseX, y: baseY }];
          let cx = baseX, cy = baseY;
          for (let s = 0; s < 6; s++) {
            cx += (Math.random() - 0.5) * 6;
            cy += 3 + Math.random() * 4;
            segs.push({ x: cx, y: cy });
          }
          lightningRef.current.push({ id: idRef.current, x: baseX, y: baseY, life: 0, segs });
        }

        if (elapsed > 6) setErupting(false);
      } else {
        setSmokeColumn((s) => Math.max(0, s - 0.005 * dt));
        setLavaFlow((l) => Math.max(0, l - 0.002 * dt));
        setPyroFlow((p) => Math.max(0, p - 0.004 * dt));
      }

      // Lightning fade
      const lt = lightningRef.current;
      for (let i = lt.length - 1; i >= 0; i--) {
        lt[i].life += dt;
        if (lt[i].life > 6) lt.splice(i, 1);
      }

      // Particle physics
      const list = particlesRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life += dt;
        p.x += p.vx * 0.45 * dt;
        p.y += p.vy * 0.45 * dt;
        p.vy += (p.type === "ash" ? 0.04 : 0.18) * dt;
        p.vx *= p.type === "ash" ? 0.985 : 0.995;
        if (p.type === "ash") {
          p.size += 0.05 * dt;
          p.vx += (Math.random() - 0.5) * 0.05;
        }
        if (p.trail) {
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 8) p.trail.shift();
        }
        if (p.life > p.maxLife || p.y > 105 || p.x < -10 || p.x > 110) list.splice(i, 1);
      }
      force((v) => v + 1);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [erupting, spawnParticles, mode]);

  const particles = particlesRef.current;

  return (
    <LabShell title="VOLCANO LAB" subtitle="Control magma, gases, and pressure. Trigger eruptions safely.">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Simulation */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-0 relative overflow-hidden min-h-[560px]">
          <div className={`absolute inset-0 ${erupting ? "animate-shake" : ""}`}>
            {/* Sky gradient — shifts redder during eruption */}
            <div className="absolute inset-0 transition-colors duration-1000" style={{
              background: erupting
                ? "linear-gradient(to bottom, #1a0a14 0%, #3a0f0a 35%, #5a1a0a 60%, #2a1410 90%)"
                : "linear-gradient(to bottom, #0a0a1f 0%, #1a1530 40%, #3a2030 75%, #2a1a20 100%)"
            }} />

            {/* Distant moon */}
            <div className="absolute top-8 right-12 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-100 to-orange-200 opacity-70 blur-[1px]" style={{ boxShadow: "0 0 30px rgba(255,220,180,0.4)" }} />

            {/* Stars */}
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="absolute h-0.5 w-0.5 rounded-full bg-white" style={{
                top: `${Math.random() * 45}%`, left: `${Math.random() * 100}%`,
                opacity: erupting ? 0.2 : 0.5 + Math.random() * 0.5,
                transition: "opacity 1s",
              }} />
            ))}

            {/* Distant mountains silhouette */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="mtnFar" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#1a1525" />
                  <stop offset="1" stopColor="#0a0815" />
                </linearGradient>
                <linearGradient id="volcGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#3a2620" />
                  <stop offset="0.5" stopColor="#1f1410" />
                  <stop offset="1" stopColor="#0a0605" />
                </linearGradient>
                <linearGradient id="lavaSurface" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#fff5b0" />
                  <stop offset="0.3" stopColor="#ffae1f" />
                  <stop offset="1" stopColor="#c9180a" />
                </linearGradient>
                <radialGradient id="craterGlow">
                  <stop offset="0" stopColor="#fff5a0" stopOpacity="1" />
                  <stop offset="0.3" stopColor="#ff8a1a" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#ff2200" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="smokeGrad">
                  <stop offset="0" stopColor="#5a4a40" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#1a1410" stopOpacity="0" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="0.8" />
                </filter>
              </defs>

              {/* Far mountains */}
              <path d="M 0 78 L 12 72 L 22 76 L 30 70 L 42 75 L 55 71 L 70 76 L 82 72 L 100 78 L 100 100 L 0 100 Z" fill="url(#mtnFar)" />

              {/* Volcano body — layered for depth */}
              <path d={`M 18 95 Q 30 88 ${50 - craterWidth / 2} 36 L ${50 + craterWidth / 2} 36 Q 70 88 82 95 Z`} fill="url(#volcGrad)" />
              {/* Highlight ridge (lit by lava) */}
              {erupting && (
                <path d={`M ${50 - craterWidth / 2} 36 Q ${50 - craterWidth / 2 - 2} 55 ${50 - craterWidth / 2 - 6} 80`}
                  stroke="#ff6a1a" strokeWidth="0.4" fill="none" opacity="0.6" />
              )}

              {/* Lava flows down the slopes */}
              {lavaFlow > 0 && (
                <>
                  <path d={`M ${50 - 2} 37 Q ${48 - lavaFlow * 2} ${37 + lavaFlow * 30} ${44 - lavaFlow * 4} ${37 + lavaFlow * 55}`}
                    stroke="url(#lavaSurface)" strokeWidth={1.2 + lavaFlow * 1.2} fill="none" opacity={0.9} filter="url(#glow)" strokeLinecap="round" />
                  <path d={`M ${50 + 2} 37 Q ${52 + lavaFlow * 2} ${37 + lavaFlow * 28} ${56 + lavaFlow * 5} ${37 + lavaFlow * 58}`}
                    stroke="url(#lavaSurface)" strokeWidth={1 + lavaFlow * 1} fill="none" opacity={0.9} filter="url(#glow)" strokeLinecap="round" />
                  <path d={`M 50 37 Q 50 ${37 + lavaFlow * 25} ${49 + lavaFlow * 1} ${37 + lavaFlow * 60}`}
                    stroke="#ffcc4a" strokeWidth={0.4} fill="none" opacity={0.9} />
                </>
              )}

              {/* Crater glow — pulsing */}
              <ellipse cx="50" cy="36" rx={craterWidth * 0.7} ry="2.5"
                fill="url(#craterGlow)"
                opacity={erupting ? 1 : 0.5 + (power / 200)}>
                {erupting && <animate attributeName="rx" values={`${craterWidth * 0.7};${craterWidth * 1.2};${craterWidth * 0.7}`} dur="0.4s" repeatCount="indefinite" />}
              </ellipse>

              {/* Inner crater dark hole */}
              <ellipse cx="50" cy="36.5" rx={craterWidth * 0.35} ry="1.2" fill="#1a0805" opacity="0.6" />
            </svg>

            {/* Smoke column / mushroom cloud */}
            {smokeColumn > 0 && (
              <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ bottom: "62%" }}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const t = smokeColumn;
                  const scale = (0.6 + i * 0.3) * (0.5 + t * 1.5);
                  return (
                    <div key={i}
                      className="absolute rounded-full"
                      style={{
                        width: `${60 * scale}px`,
                        height: `${60 * scale}px`,
                        bottom: `${i * 35 * t}px`,
                        left: `${(Math.sin(i * 1.7) * 20 - 30) * t}px`,
                        background: `radial-gradient(circle, rgba(${80 + i * 5},${65 + i * 5},${55 + i * 5},${0.6 - i * 0.05}) 0%, transparent 70%)`,
                        filter: "blur(8px)",
                        opacity: t,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Lava bomb trails (rocks) — render first so particles appear on top */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {particles.filter((p) => p.trail && p.trail.length > 1).map((p) => (
                <polyline
                  key={`trail-${p.id}`}
                  points={p.trail!.map((t) => `${t.x},${t.y}`).join(" ")}
                  fill="none"
                  stroke="#ff7a1a"
                  strokeWidth="0.3"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              ))}
            </svg>

            {/* Volcanic lightning */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {lightningRef.current.map((l) => {
                const flash = Math.max(0, 1 - l.life / 6);
                return (
                  <polyline
                    key={l.id}
                    points={l.segs.map((s) => `${s.x},${s.y}`).join(" ")}
                    fill="none"
                    stroke="#e0f0ff"
                    strokeWidth={flash > 0.5 ? 0.5 : 0.25}
                    opacity={flash}
                    style={{ filter: `drop-shadow(0 0 2px #aaccff) drop-shadow(0 0 4px #88aaff)` }}
                  />
                );
              })}
            </svg>

            {/* Lightning sky flash */}
            {lightningRef.current.some((l) => l.life < 0.4) && (
              <div className="absolute inset-0 pointer-events-none bg-blue-100/10" />
            )}

            {/* Particles */}
            {particles.map((p) => {
              const lifeRatio = p.life / p.maxLife;
              const opacity = p.type === "ash" ? Math.max(0, 0.7 - lifeRatio * 0.5) : p.type === "ember" ? Math.max(0, 1 - lifeRatio) : 1 - lifeRatio * 0.4;
              const glow = p.type === "lava" || p.type === "ember" ? `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 6}px ${p.color}` : "none";
              return (
                <div key={p.id} className="absolute rounded-full pointer-events-none"
                  style={{
                    left: `${p.x}%`, top: `${p.y}%`,
                    width: p.size, height: p.size,
                    background: p.color,
                    boxShadow: glow,
                    transform: "translate(-50%, -50%)",
                    opacity,
                    filter: p.type === "ash" ? "blur(2px)" : "none",
                  }}
                />
              );
            })}

            {/* Pyroclastic flow — superheated avalanche descending volcano slopes */}
            {pyroFlow > 0 && (
              <>
                <div className="absolute pointer-events-none" style={{
                  left: `${50 - craterWidth / 2 - pyroFlow * 18}%`,
                  bottom: `${5 + (1 - pyroFlow) * 55}%`,
                  width: `${20 + pyroFlow * 25}%`,
                  height: `${15 + pyroFlow * 20}%`,
                  background: "radial-gradient(ellipse at top, rgba(180,140,110,0.85) 0%, rgba(120,80,60,0.6) 40%, rgba(60,40,30,0.2) 100%)",
                  filter: "blur(6px)",
                  opacity: pyroFlow,
                }} />
                <div className="absolute pointer-events-none" style={{
                  right: `${50 - craterWidth / 2 - pyroFlow * 18}%`,
                  bottom: `${5 + (1 - pyroFlow) * 55}%`,
                  width: `${20 + pyroFlow * 25}%`,
                  height: `${15 + pyroFlow * 20}%`,
                  background: "radial-gradient(ellipse at top, rgba(180,140,110,0.85) 0%, rgba(120,80,60,0.6) 40%, rgba(60,40,30,0.2) 100%)",
                  filter: "blur(6px)",
                  opacity: pyroFlow,
                }} />
              </>
            )}

            {/* Shockwave ring */}
            <AnimatePresence>
              {shockwave > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 6, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.3, ease: "easeOut" }}
                  className="absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-orange-300 pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Heat haze over volcano */}
            {erupting && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[5%] w-1/2 h-1/3 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at top, rgba(255,120,40,0.18), transparent 70%)" }} />
            )}

            {/* Foreground silhouette */}
            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black via-black/80 to-transparent" />
          </div>

          {/* HUD */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
            <div className="font-mono text-xs text-primary bg-background/70 backdrop-blur px-3 py-1.5 rounded-md border border-primary/30">
              ⚠ POWER: <span className="text-accent font-bold">{Math.round(power)}%</span> · {temp}°C
            </div>
            <div className="font-mono text-xs text-primary bg-background/70 backdrop-blur px-3 py-1.5 rounded-md border border-primary/30">
              MODE: {mode.toUpperCase()}
            </div>
          </div>

          <button onClick={erupt} disabled={erupting} className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-volcano text-white font-display font-black tracking-wider hover:scale-105 transition disabled:opacity-50 z-10 animate-pulse-glow shadow-lg">
            <Flame className="h-5 w-5" />
            {erupting ? "ERUPTING!" : "TRIGGER ERUPTION"}
          </button>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-bold text-lg flex items-center gap-2"><Play className="h-4 w-4 text-primary" /> Lab Controls</h3>
            <Slider label="Lava Pressure" value={pressure} onChange={setPressure} min={0} max={100} unit="%" />
            <Slider label="Gas Build-up" value={gas} onChange={setGas} min={0} max={100} unit="%" color="accent" />
            <Slider label="Magma Temperature" value={temp} onChange={setTemp} min={700} max={1300} unit="°C" color="secondary" />
            <div>
              <label className="font-display text-sm font-semibold mb-1.5 block">Crater Size</label>
              <div className="grid grid-cols-3 gap-2">
                {["small", "medium", "large"].map((c) => (
                  <button key={c} onClick={() => setCrater(c)} className={`py-1.5 rounded-lg text-xs font-bold uppercase ${crater === c ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-display text-sm font-semibold mb-1.5 block">Eruption Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(["gentle", "explosive", "mega"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`py-1.5 rounded-lg text-xs font-bold uppercase ${mode === m ? "bg-gradient-volcano text-white" : "bg-muted/50 text-muted-foreground"}`}>{m}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="font-display font-bold text-2xl mb-4 flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> Volcano Science</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {facts.map((f) => (
              <div key={f.t} className="p-3 rounded-xl border border-primary/20 bg-primary/5">
                <div className="font-display font-bold text-primary mb-1">{f.t}</div>
                <p className="text-sm text-foreground/80">{f.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <QuizBlock questions={questions} badge="Junior Volcanologist" />
        </div>
      </div>
    </LabShell>
  );
};

export default Volcano;
