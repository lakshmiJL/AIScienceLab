import { useState, useEffect, useRef } from "react";
import { LabShell } from "@/components/lab/LabShell";
import { Slider } from "@/components/lab/Slider";
import { QuizBlock } from "@/components/lab/QuizBlock";
import { Globe, RotateCcw } from "lucide-react";

const planets = {
  earth: { name: "Earth", g: 9.8, color: "#4a9eff" },
  moon: { name: "Moon", g: 1.62, color: "#cccccc" },
  mars: { name: "Mars", g: 3.71, color: "#ff6b3d" },
  jupiter: { name: "Jupiter", g: 24.79, color: "#d4a574" },
  zero: { name: "Zero-G", g: 0.05, color: "#a855f7" },
} as const;

const objects = [
  { id: "apple", emoji: "🍎", mass: 0.2 },
  { id: "feather", emoji: "🪶", mass: 0.005, drag: 0.6 },
  { id: "ball", emoji: "⚽", mass: 0.4 },
  { id: "hammer", emoji: "🔨", mass: 1.5 },
  { id: "car", emoji: "🚗", mass: 1500 },
  { id: "rock", emoji: "🪨", mass: 5 },
];

const questions = [
  { q: "Why do astronauts float in space?", options: ["No gravity", "They're falling around Earth", "They wear floating suits", "Magnets"], answer: 1, explain: "They're in continuous free-fall around Earth — that's orbit!" },
  { q: "Where would you jump highest?", options: ["Earth", "Moon", "Mars", "Jupiter"], answer: 1, explain: "The Moon's gravity is ~1/6 of Earth's." },
  { q: "Mass vs Weight: which changes on the Moon?", options: ["Mass", "Weight", "Both", "Neither"], answer: 1, explain: "Mass stays the same. Weight = mass × gravity, so it changes!" },
  { q: "In a vacuum, does a feather fall slower than a hammer?", options: ["Yes", "No, same speed", "Only on Earth", "Only on Moon"], answer: 1, explain: "Apollo 15 proved it on the Moon — both fell together!" },
];

const Gravity = () => {
  const [planet, setPlanet] = useState<keyof typeof planets>("earth");
  const [customG, setCustomG] = useState<number | null>(null);
  const [obj, setObj] = useState(objects[0]);
  const [y, setY] = useState(0);
  const [v, setV] = useState(0);
  const [dropping, setDropping] = useState(false);
  const reqRef = useRef<number>();

  const g = customG ?? planets[planet].g;

  const drop = () => { setY(0); setV(0); setDropping(true); };
  const reset = () => { setDropping(false); setY(0); setV(0); };

  useEffect(() => {
    if (!dropping) return;
    const tick = () => {
      setV((vv) => vv + g * 0.05);
      setY((yy) => {
        const next = yy + v * 0.5;
        if (next > 380) { setDropping(false); return 380; }
        return next;
      });
      reqRef.current = requestAnimationFrame(tick);
    };
    reqRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reqRef.current!);
  }, [dropping, v, g]);

  const weight = (obj.mass * g).toFixed(2);

  return (
    <LabShell title="GRAVITY CHAMBER" subtitle="Test gravity across planets. Drop objects. Discover physics." accent="secondary">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative min-h-[500px] overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute top-4 left-4 z-10 font-mono text-xs space-y-1">
            <div className="text-primary bg-background/60 backdrop-blur px-2 py-1 rounded border border-primary/30">PLANET: {customG !== null ? "CUSTOM" : planets[planet].name.toUpperCase()}</div>
            <div className="text-accent bg-background/60 backdrop-blur px-2 py-1 rounded border border-accent/30">g = {g.toFixed(2)} m/s²</div>
            <div className="text-secondary bg-background/60 backdrop-blur px-2 py-1 rounded border border-secondary/30">Weight: {weight} N</div>
            <div className="text-foreground bg-background/60 backdrop-blur px-2 py-1 rounded border border-border">Velocity: {v.toFixed(1)} m/s</div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute top-12 left-1/2 -translate-x-1/2 h-1 w-32 rounded-full bg-primary/40" />
            <div className="absolute text-6xl select-none transition-transform" style={{ top: 60 + y, left: "50%", transform: "translateX(-50%)" }}>{obj.emoji}</div>
            <div className="absolute bottom-8 inset-x-0 h-2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            <button onClick={drop} disabled={dropping} className="px-6 py-3 rounded-xl bg-gradient-gravity text-white font-display font-black tracking-wider hover:scale-105 transition disabled:opacity-50">DROP</button>
            <button onClick={reset} className="px-4 py-3 rounded-xl border border-primary/40 bg-background/60 backdrop-blur"><RotateCcw className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2"><Globe className="h-4 w-4 text-secondary" /> Planet Selector</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(planets).map(([k, p]) => (
                <button key={k} onClick={() => { setPlanet(k as keyof typeof planets); setCustomG(null); }} className={`p-2 rounded-lg text-xs font-bold ${planet === k && customG === null ? "bg-secondary text-secondary-foreground" : "bg-muted/50"}`}>
                  {p.name}<br /><span className="font-mono text-[10px] opacity-60">{p.g} m/s²</span>
                </button>
              ))}
            </div>
            <Slider label="Custom Gravity" value={customG ?? 9.8} onChange={(v) => setCustomG(v)} min={0} max={50} step={0.5} unit=" m/s²" color="accent" />
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="font-display font-bold text-lg mb-3">Choose Object</h3>
            <div className="grid grid-cols-3 gap-2">
              {objects.map((o) => (
                <button key={o.id} onClick={() => setObj(o)} className={`p-3 rounded-xl text-3xl ${obj.id === o.id ? "bg-primary/20 border border-primary" : "bg-muted/40 border border-transparent"}`}>{o.emoji}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="font-display font-bold text-2xl mb-3">🌍 Newton Basics</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20"><b className="text-secondary">Force</b> — push or pull on an object.</div>
            <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20"><b className="text-secondary">Motion</b> — objects keep moving unless something stops them.</div>
            <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20"><b className="text-secondary">Gravity</b> — every object with mass pulls on every other object.</div>
          </div>
        </div>
        <div><QuizBlock questions={questions} badge="Gravity Explorer" /></div>
      </div>
    </LabShell>
  );
};

export default Gravity;
