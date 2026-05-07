import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LabShell } from "@/components/lab/LabShell";
import { Slider } from "@/components/lab/Slider";
import { QuizBlock } from "@/components/lab/QuizBlock";
import { MissionTracker, type Mission } from "@/components/lab/MissionTracker";
import { Anchor, Waves, Gauge, Fish } from "lucide-react";

const facts = [
  { t: "Buoyancy (Archimedes)", d: "An object floats when it displaces water equal to its own weight. Submarines flood ballast tanks to sink, blow them with air to rise!" },
  { t: "Pressure increases", d: "Every 10 m of depth adds 1 atmosphere (~14.7 psi) of pressure. At 1000 m, water pressure is 100× sea-level air pressure." },
  { t: "Crush depth", d: "Each submarine has a maximum depth — beyond it, the hull collapses. Military subs reach ~600 m; the Trieste went to 10,911 m!" },
  { t: "Sonar", d: "Subs send sound pulses ('ping') and listen for echoes. Distance = (sound speed × time) / 2. Sound travels ~1,500 m/s in water." },
  { t: "Light fades fast", d: "Below ~200 m there's no sunlight. Below 1,000 m the ocean is black — bioluminescent fish make their own light." },
  { t: "Mariana Trench", d: "Deepest point on Earth at ~10,994 m. Pressure there could crush a tank like a soda can." },
];

const questions = [
  { q: "Which principle explains why submarines float or sink?", options: ["Newton's 1st law", "Archimedes' principle", "Ohm's law", "Doppler effect"], answer: 1, explain: "Buoyancy = weight of displaced water." },
  { q: "How much does pressure increase every 10 m of depth?", options: ["0.1 atm", "1 atm", "10 atm", "100 atm"], answer: 1 },
  { q: "How does sonar measure distance?", options: ["Magnets", "Heat", "Sound echo timing", "Light reflection"], answer: 2 },
  { q: "What lives in the deep sea where there's no sunlight?", options: ["Coral reefs", "Bioluminescent fish", "Seaweed", "Dolphins"], answer: 1, explain: "Many deep-sea creatures glow to attract prey or mates." },
  { q: "How do subs rise to the surface?", options: ["Flap fins", "Pump fuel", "Blow water out of ballast tanks with compressed air", "Run engines harder"], answer: 2 },
];

type Bubble = { id: number; x: number; y: number; size: number; speed: number };
type Ping = { id: number; r: number };
type SeaFish = { id: number; x: number; y: number; vx: number; species: number };

const ZONES = [
  { name: "Sunlight Zone", min: 0, max: 200, color: "#5eb8e8" },
  { name: "Twilight Zone", min: 200, max: 1000, color: "#1e5c8a" },
  { name: "Midnight Zone", min: 1000, max: 4000, color: "#0a2548" },
  { name: "Abyssal Zone", min: 4000, max: 6000, color: "#040d20" },
  { name: "Hadal Zone", min: 6000, max: 11000, color: "#01030d" },
];

const Submarine = () => {
  const [ballast, setBallast] = useState(50);   // 0 = empty (rises), 100 = full (sinks)
  const [thrust, setThrust] = useState(0);      // -100 reverse, 100 forward
  const [crushDepth, setCrushDepth] = useState(800); // m, hull rating
  const [depth, setDepth] = useState(0);        // m
  const [vSpeed, setVSpeed] = useState(0);      // m/s vertical
  const [hSpeed, setHSpeed] = useState(0);
  const [hPos, setHPos] = useState(50);         // % horizontal in tank
  const [crushed, setCrushed] = useState(false);
  const [sonarTarget, setSonarTarget] = useState<{ d: number; bearing: number } | null>(null);
  const [lastPingDistance, setLastPingDistance] = useState<number | null>(null);

  // ===== MISSIONS =====
  const [maxDepthReached, setMaxDepthReached] = useState(0);
  const [pingsUsed, setPingsUsed] = useState(0);
  const [creaturesSpotted, setCreaturesSpotted] = useState(0);
  const [surfaceTraveled, setSurfaceTraveled] = useState(0);
  const surfaceTraveledRef = useRef(0);
  const lastHPosRef = useRef(50);

  const missions: Mission[] = useMemo(() => [
    { id: "m1", title: "Watercraft Patrol", hint: "Stay on the surface (depth < 5 m) and travel 80 units horizontally", done: surfaceTraveled >= 80 },
    { id: "m2", title: "Twilight Dive", hint: "Reach the Twilight Zone (200 m+)", done: maxDepthReached >= 200 },
    { id: "m3", title: "Sonar Sweep", hint: "Use sonar 3 times to map the seafloor", done: pingsUsed >= 3 },
    { id: "m4", title: "Bioluminescent Hunter", hint: "Spot 5 deep-sea creatures (descend below 800 m)", done: creaturesSpotted >= 5 },
  ], [surfaceTraveled, maxDepthReached, pingsUsed, creaturesSpotted]);

  const bubblesRef = useRef<Bubble[]>([]);
  const pingsRef = useRef<Ping[]>([]);
  const fishRef = useRef<SeaFish[]>([]);
  const [, force] = useState(0);
  const idRef = useRef(0);
  const stateRef = useRef({ depth: 0, vSpeed: 0, hPos: 50, hSpeed: 0 });

  // Initialize fish
  useEffect(() => {
    fishRef.current = Array.from({ length: 14 }).map(() => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.3,
      species: Math.floor(Math.random() * 3),
    }));
  }, []);

  // Sonar ping
  const ping = () => {
    idRef.current++;
    pingsRef.current.push({ id: idRef.current, r: 0 });
    const d = 200 + Math.random() * 1500;
    setSonarTarget({ d, bearing: Math.random() * 360 });
    setTimeout(() => setLastPingDistance(d), Math.min(2000, (d / 1500) * 1000));
    setPingsUsed((p) => p + 1);
  };

  // Reset
  const surface = useCallback(() => {
    setBallast(0); setThrust(0);
  }, []);
  const reset = useCallback(() => {
    setCrushed(false); setDepth(0); setVSpeed(0); setHSpeed(0); setHPos(50);
    stateRef.current = { depth: 0, vSpeed: 0, hPos: 50, hSpeed: 0 };
  }, []);

  // Physics loop
  useEffect(() => {
    if (crushed) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(60, now - last) / 1000;
      last = now;
      const s = stateRef.current;

      // Buoyancy: weight - displaced water force
      // ballast 50% = neutral, <50 rises, >50 sinks
      const buoyancy = (50 - ballast) * 0.04; // m/s^2 (negative = down)
      const drag = -s.vSpeed * 0.5;
      s.vSpeed += (buoyancy + drag) * dt;
      s.depth = Math.max(0, s.depth - s.vSpeed * dt);

      // Horizontal
      const targetH = thrust * 0.06;
      s.hSpeed += (targetH - s.hSpeed) * dt * 1.5;
      s.hPos = Math.max(5, Math.min(95, s.hPos + s.hSpeed * dt * 5));

      // Bubbles when blowing ballast (rising fast)
      if (s.vSpeed > 0.3) {
        for (let i = 0; i < 3; i++) {
          idRef.current++;
          bubblesRef.current.push({
            id: idRef.current,
            x: s.hPos + (Math.random() - 0.5) * 6,
            y: 50 + (Math.random() - 0.5) * 4,
            size: 3 + Math.random() * 6,
            speed: 1 + Math.random() * 2,
          });
        }
      }

      // Update bubbles (rise toward surface)
      const bb = bubblesRef.current;
      for (let i = bb.length - 1; i >= 0; i--) {
        bb[i].y -= bb[i].speed * dt * 30;
        bb[i].x += (Math.random() - 0.5) * 0.4;
        if (bb[i].y < -5) bb.splice(i, 1);
      }
      if (bb.length > 80) bb.splice(0, bb.length - 80);

      // Sonar pings expand
      const pp = pingsRef.current;
      for (let i = pp.length - 1; i >= 0; i--) {
        pp[i].r += dt * 80;
        if (pp[i].r > 200) pp.splice(i, 1);
      }

      // Fish drift
      const ff = fishRef.current;
      for (const f of ff) {
        f.x += f.vx * dt * 10;
        if (f.x < -5) f.x = 105;
        if (f.x > 105) f.x = -5;
      }

      setDepth(s.depth);
      setVSpeed(s.vSpeed);
      setHSpeed(s.hSpeed);
      setHPos(s.hPos);

      // Mission tracking
      if (s.depth < 5) {
        const moved = Math.abs(s.hPos - lastHPosRef.current);
        if (moved < 5) surfaceTraveledRef.current += moved;
      }
      lastHPosRef.current = s.hPos;

      // Crush check
      if (s.depth > crushDepth) {
        setCrushed(true);
        return;
      }

      force((v) => v + 1);
      requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [crushed, ballast, thrust, crushDepth]);

  // Mission progress sync (sampled, not every frame)
  useEffect(() => {
    const id = setInterval(() => {
      setSurfaceTraveled((s) => Math.max(s, Math.floor(surfaceTraveledRef.current)));
      setMaxDepthReached((d) => Math.max(d, depth));
      if (depth > 800) setCreaturesSpotted((c) => Math.min(5, c + 1));
    }, 1500);
    return () => clearInterval(id);
  }, [depth]);

  // Determine zone
  const zone = ZONES.find((z) => depth >= z.min && depth < z.max) || ZONES[ZONES.length - 1];
  // Light level based on depth (0..1)
  const light = Math.max(0, 1 - depth / 800);
  const pressure = 1 + depth / 10; // atm

  // Background gradient based on depth
  const bg = `linear-gradient(to bottom,
    rgba(140, 210, 240, ${light}) 0%,
    rgba(60, 140, 200, ${light * 0.8}) 15%,
    rgba(30, 92, 138, ${0.4 + (1 - light) * 0.3}) 40%,
    rgba(10, 37, 72, 1) 70%,
    rgba(2, 8, 25, 1) 100%)`;

  return (
    <LabShell title="DEEP SEA LAB" subtitle="Pilot a submarine. Explore the abyss. Survive the crushing pressure." accent="primary">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tank */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-0 relative overflow-hidden min-h-[620px]">
          <div className="absolute inset-0" style={{ background: bg }} />

          {/* Sun rays from surface */}
          {light > 0.1 && (
            <>
              <div className="absolute top-0 left-1/4 w-16 h-1/3 opacity-30" style={{ background: "linear-gradient(to bottom, rgba(255,255,200,0.5), transparent)", transform: "skewX(-15deg)", filter: "blur(8px)" }} />
              <div className="absolute top-0 left-2/3 w-20 h-1/2 opacity-20" style={{ background: "linear-gradient(to bottom, rgba(255,255,200,0.5), transparent)", transform: "skewX(10deg)", filter: "blur(10px)" }} />
            </>
          )}

          {/* Surface waves */}
          <div className="absolute top-0 inset-x-0 h-6 overflow-hidden">
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="w-full h-full">
              <path d="M 0 4 Q 10 0 20 4 T 40 4 T 60 4 T 80 4 T 100 4 V 8 H 0 Z" fill="rgba(180,230,255,0.4)">
                <animate attributeName="d" dur="3s" repeatCount="indefinite"
                  values="M 0 4 Q 10 0 20 4 T 40 4 T 60 4 T 80 4 T 100 4 V 8 H 0 Z;
                          M 0 4 Q 10 8 20 4 T 40 4 T 60 4 T 80 4 T 100 4 V 8 H 0 Z;
                          M 0 4 Q 10 0 20 4 T 40 4 T 60 4 T 80 4 T 100 4 V 8 H 0 Z" />
              </path>
            </svg>
          </div>

          {/* Floating particles (marine snow) */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/20" style={{
              top: `${(i * 13 + (Date.now() / 100) % 100) % 100}%`,
              left: `${(i * 17) % 100}%`,
              width: 2, height: 2,
              animation: `marineSnow ${10 + i % 5}s linear infinite`,
            }} />
          ))}

          {/* Fish (only visible if light or near sub) */}
          {fishRef.current.map((f) => (
            <div key={f.id} className="absolute pointer-events-none transition-opacity"
              style={{
                left: `${f.x}%`, top: `${20 + (f.y / 100) * 60}%`,
                opacity: light > 0.2 ? 0.9 : 0.15,
                transform: `scaleX(${f.vx > 0 ? 1 : -1})`,
              }}>
              <span className="text-2xl drop-shadow" style={{ filter: light < 0.3 ? "brightness(0.4) hue-rotate(180deg)" : "none" }}>
                {f.species === 0 ? "🐟" : f.species === 1 ? "🐠" : "🦑"}
              </span>
            </div>
          ))}

          {/* Bioluminescent dots in deep zones */}
          {light < 0.3 && Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              left: `${(i * 31) % 100}%`,
              top: `${(i * 23 + 20) % 80}%`,
              width: 4, height: 4,
              background: i % 2 === 0 ? "#9efbff" : "#a4ff80",
              boxShadow: `0 0 12px ${i % 2 === 0 ? "#9efbff" : "#a4ff80"}`,
              animation: `bioGlow ${2 + i % 3}s ease-in-out infinite`,
            }} />
          ))}

          {/* Bubbles */}
          {bubblesRef.current.map((b) => (
            <div key={b.id} className="absolute rounded-full pointer-events-none"
              style={{
                left: `${b.x}%`, top: `${b.y}%`,
                width: b.size, height: b.size,
                background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(180,220,255,0.3))",
                border: "1px solid rgba(255,255,255,0.5)",
                transform: "translate(-50%, -50%)",
              }} />
          ))}

          {/* Sonar pings */}
          {pingsRef.current.map((p) => (
            <div key={p.id} className="absolute rounded-full border-2 border-success pointer-events-none"
              style={{
                left: `${hPos}%`, top: "50%",
                width: p.r * 2, height: p.r * 2,
                transform: "translate(-50%, -50%)",
                opacity: Math.max(0, 1 - p.r / 200),
              }} />
          ))}

          {/* SUBMARINE */}
          <div className="absolute pointer-events-none" style={{
            left: `${hPos}%`, top: "50%",
            transform: `translate(-50%, -50%) rotate(${vSpeed * -8}deg) scaleX(${hSpeed >= 0 ? 1 : -1})`,
            transition: "transform 0.2s",
          }}>
            <div className="relative" style={{ width: 130, height: 50 }}>
              {/* Main hull */}
              <div className="absolute inset-x-2 inset-y-2 rounded-full"
                style={{
                  background: "linear-gradient(to bottom, #fbd44a 0%, #f4a917 40%, #b06d05 100%)",
                  boxShadow: "inset 0 -6px 12px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.5)",
                }} />
              {/* Nose */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-8 rounded-l-full" style={{ background: "linear-gradient(to right, #b06d05, #f4a917)" }} />
              {/* Tail */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-6 rounded-r-full" style={{ background: "#a05a05" }} />
              {/* Conning tower */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-8 h-5 rounded-t-md"
                style={{ background: "linear-gradient(to bottom, #f4a917, #b06d05)" }} />
              {/* Periscope */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-0.5 h-3 bg-stone-700" />
              <div className="absolute left-1/2 -translate-x-1/2 -top-5 w-2 h-1 bg-stone-700 rounded-sm" />
              {/* Windows / portholes */}
              {[18, 38, 58, 78, 98].map((x) => (
                <div key={x} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style={{
                  left: x,
                  background: "radial-gradient(circle at 30% 30%, #cdf5ff, #2d6b96)",
                  border: "1.5px solid #5a3805",
                  boxShadow: depth > 200 ? "0 0 8px #cdf5ff" : "none",
                }} />
              ))}
              {/* Rear propeller */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-stone-600 border border-stone-800"
                style={{ animation: Math.abs(thrust) > 5 ? "spin 0.15s linear infinite" : "none" }}>
                <div className="absolute inset-0 flex items-center justify-center text-stone-300 text-[8px]">✦</div>
              </div>
              {/* Headlight beam */}
              {depth > 100 && (
                <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-24 h-16 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at right, rgba(255,250,180,0.5), transparent 70%)",
                    clipPath: "polygon(100% 30%, 100% 70%, 0 100%, 0 0)",
                  }} />
              )}
            </div>
          </div>

          {/* Sea floor at extreme depth */}
          {depth > 5000 && (
            <div className="absolute bottom-0 inset-x-0 h-20"
              style={{ background: "linear-gradient(to top, #1a1410, transparent)" }}>
              <div className="absolute bottom-0 inset-x-0 h-8 bg-stone-900" style={{ clipPath: "polygon(0 100%, 5% 60%, 15% 80%, 30% 50%, 45% 70%, 60% 55%, 75% 75%, 90% 60%, 100% 80%, 100% 100%)" }} />
            </div>
          )}

          {/* HUD */}
          <div className="absolute top-4 left-4 right-4 flex justify-between gap-2 z-20 pointer-events-none">
            <div className="space-y-1 font-mono text-xs">
              <div className="bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border border-primary/40 text-primary">
                <Gauge className="inline h-3 w-3 mr-1" /> DEPTH: <span className="text-white font-bold">{depth.toFixed(0)} m</span>
              </div>
              <div className="bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border border-accent/40 text-accent">
                PRESSURE: <span className="text-white font-bold">{pressure.toFixed(1)} atm</span>
              </div>
              <div className="bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border border-secondary/40 text-secondary">
                V-SPEED: <span className="text-white font-bold">{vSpeed.toFixed(1)} m/s</span>
              </div>
            </div>
            <div className="space-y-1 font-mono text-xs text-right">
              <div className="bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border border-primary/40">
                ZONE: <span className="text-white font-bold">{zone.name}</span>
              </div>
              <div className={`bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border ${depth > crushDepth * 0.85 ? "border-destructive text-destructive animate-pulse" : "border-warning/40 text-warning"}`}>
                HULL: <span className="font-bold">{((1 - depth / crushDepth) * 100).toFixed(0)}%</span>
              </div>
              {lastPingDistance != null && (
                <div className="bg-background/70 backdrop-blur px-2.5 py-1.5 rounded border border-success/40 text-success">
                  SONAR: target {lastPingDistance.toFixed(0)} m
                </div>
              )}
            </div>
          </div>

          {/* Crush overlay */}
          {crushed && (
            <div className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center animate-fade-in">
              <div className="text-center">
                <div className="text-7xl mb-3">💥</div>
                <div className="font-display font-black text-3xl text-destructive mb-2">HULL IMPLOSION</div>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">Pressure exceeded crush depth ({crushDepth} m). Upgrade hull rating!</p>
                <button onClick={reset} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-display font-bold">Restart</button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-bold text-lg flex items-center gap-2"><Anchor className="h-4 w-4 text-primary" /> Sub Controls</h3>
            <Slider label="Ballast (0=Air, 100=Water)" value={ballast} onChange={setBallast} min={0} max={100} unit="%" />
            <Slider label="Thrust" value={thrust} onChange={setThrust} min={-100} max={100} unit="%" color="accent" />
            <Slider label="Hull Rating (Crush Depth)" value={crushDepth} onChange={setCrushDepth} min={300} max={11000} step={100} unit=" m" color="secondary" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={ping} className="py-2 rounded-lg bg-success/20 border border-success/40 text-success font-display font-bold text-sm hover:bg-success/30 transition flex items-center justify-center gap-1">
                <Waves className="h-4 w-4" /> PING
              </button>
              <button onClick={surface} className="py-2 rounded-lg bg-primary/20 border border-primary/40 text-primary font-display font-bold text-sm hover:bg-primary/30 transition">
                ↑ SURFACE
              </button>
            </div>
          </div>

          <MissionTracker missions={missions} title="Sub & Watercraft Quests" badge="Deep Sea Captain" />
        </div>

        {/* Education */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="font-display font-bold text-2xl mb-4">🌊 Ocean Science</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {facts.map((f) => (
              <div key={f.t} className="p-3 rounded-xl border border-primary/20 bg-primary/5">
                <div className="font-display font-bold text-primary mb-1">{f.t}</div>
                <p className="text-sm text-foreground/80">{f.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div><QuizBlock questions={questions} badge="Deep Sea Captain" /></div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes marineSnow { 0% { transform: translateY(-20px); opacity: 0; } 10%,90% { opacity: 0.6; } 100% { transform: translateY(120vh); opacity: 0; } }
        @keyframes bioGlow { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
      `}</style>
    </LabShell>
  );
};

export default Submarine;
