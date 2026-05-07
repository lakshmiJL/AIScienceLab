import { useState } from "react";
import { LabShell } from "@/components/lab/LabShell";
import { QuizBlock } from "@/components/lab/QuizBlock";
import { Slider } from "@/components/lab/Slider";
import { Zap, Lightbulb, AlertTriangle, Plus, Minus } from "lucide-react";

const questions = [
  { q: "What unit measures electric current?", options: ["Volt", "Ampere", "Watt", "Ohm"], answer: 1, explain: "Amperes (A) measure how much current flows." },
  { q: "In a SERIES circuit, if one bulb breaks…", options: ["Others stay on", "All bulbs go off", "Battery dies", "Bulbs glow brighter"], answer: 1, explain: "Series = single path. Break it and current stops." },
  { q: "Ohm's Law says: V = ?", options: ["I × R", "I + R", "I − R", "I / R"], answer: 0, explain: "Voltage = Current × Resistance." },
  { q: "Which is an INSULATOR?", options: ["Copper wire", "Aluminum foil", "Rubber", "Salt water"], answer: 2 },
];

const Electricity = () => {
  const [voltage, setVoltage] = useState(6);
  const [bulbs, setBulbs] = useState(1);
  const [type, setType] = useState<"series" | "parallel">("series");
  const [on, setOn] = useState(false);

  const resistance = type === "series" ? bulbs * 2 : 2 / bulbs;
  const current = voltage / Math.max(resistance, 0.5);
  const brightnessPerBulb = type === "series" ? Math.min(1, current / 3) : Math.min(1, voltage / 12);
  const shortCircuit = on && voltage > 9 && bulbs === 1 && type === "parallel";
  const lit = on && !shortCircuit;

  return (
    <LabShell title="ELECTRICITY LAB" subtitle="Build circuits, light bulbs, and master Ohm's Law." accent="primary">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Circuit */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 min-h-[500px] relative">
          <div className="absolute top-4 left-4 right-4 flex justify-between font-mono text-xs z-10">
            <span className="text-primary bg-background/60 backdrop-blur px-2 py-1 rounded border border-primary/30">V = {voltage}V</span>
            <span className="text-accent bg-background/60 backdrop-blur px-2 py-1 rounded border border-accent/30">I = {current.toFixed(2)}A</span>
            <span className="text-secondary bg-background/60 backdrop-blur px-2 py-1 rounded border border-secondary/30">R = {resistance.toFixed(1)}Ω</span>
          </div>

          <svg viewBox="0 0 400 300" className="w-full h-[420px]">
            <defs>
              <linearGradient id="wireG" x1="0" x2="1">
                <stop offset="0" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#a855f7" />
              </linearGradient>
            </defs>

            {/* Battery */}
            <g transform="translate(40, 130)">
              <rect width="50" height="40" rx="6" fill="hsl(230 40% 15%)" stroke="hsl(188 100% 55%)" strokeWidth="2" />
              <text x="25" y="25" textAnchor="middle" fill="#22d3ee" fontSize="14" fontWeight="bold" fontFamily="monospace">{voltage}V</text>
              <rect x="-5" y="15" width="5" height="10" fill="hsl(188 100% 55%)" />
            </g>

            {/* Wires + bulbs */}
            {type === "series" ? (
              <>
                <path d={`M 90 150 L ${130 + bulbs * 60} 150 L ${130 + bulbs * 60} 230 L 90 230 L 90 170`} stroke={lit ? "url(#wireG)" : "#444"} strokeWidth="3" fill="none" strokeDasharray={lit ? "5 3" : "0"}>
                  {lit && <animate attributeName="stroke-dashoffset" values="0;-16" dur="0.4s" repeatCount="indefinite" />}
                </path>
                {Array.from({ length: bulbs }).map((_, i) => (
                  <g key={i} transform={`translate(${130 + i * 60}, 150)`}>
                    <circle cx="0" cy="0" r="14" fill={lit ? `hsl(50 100% ${50 + brightnessPerBulb * 30}%)` : "#222"} opacity={lit ? 0.3 + brightnessPerBulb * 0.7 : 1} />
                    {lit && <circle cx="0" cy="0" r={20 + brightnessPerBulb * 15} fill="hsl(50 100% 60%)" opacity={brightnessPerBulb * 0.4} filter="blur(8px)" />}
                    <circle cx="0" cy="0" r="10" fill={lit ? "#ffd700" : "#1a1a1a"} stroke="#666" strokeWidth="1" />
                    <rect x="-5" y="10" width="10" height="6" fill="#888" />
                  </g>
                ))}
              </>
            ) : (
              <>
                <path d="M 90 150 L 200 150 M 90 220 L 200 220" stroke={lit ? "url(#wireG)" : "#444"} strokeWidth="3" fill="none" strokeDasharray={lit ? "5 3" : "0"}>
                  {lit && <animate attributeName="stroke-dashoffset" values="0;-16" dur="0.4s" repeatCount="indefinite" />}
                </path>
                {Array.from({ length: bulbs }).map((_, i) => {
                  const x = 220 + i * 50;
                  return (
                    <g key={i}>
                      <line x1={x} y1="150" x2={x} y2="220" stroke={lit ? "#22d3ee" : "#444"} strokeWidth="2" />
                      <g transform={`translate(${x}, 185)`}>
                        <circle cx="0" cy="0" r="14" fill={lit ? `hsl(50 100% 70%)` : "#222"} opacity={lit ? 0.3 + brightnessPerBulb * 0.7 : 1} />
                        {lit && <circle cx="0" cy="0" r={25} fill="hsl(50 100% 60%)" opacity={brightnessPerBulb * 0.4} filter="blur(10px)" />}
                        <circle cx="0" cy="0" r="10" fill={lit ? "#ffd700" : "#1a1a1a"} stroke="#666" />
                      </g>
                    </g>
                  );
                })}
                <path d={`M ${220 + (bulbs - 1) * 50 + 30} 150 L 380 150 L 380 220 L ${220 + (bulbs - 1) * 50 + 30} 220`} stroke={lit ? "url(#wireG)" : "#444"} strokeWidth="3" fill="none" />
              </>
            )}

            {shortCircuit && (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <circle key={i} cx={100 + Math.random() * 250} cy={150 + Math.random() * 80} r={Math.random() * 4 + 2} fill="#fff" opacity={Math.random()}>
                    <animate attributeName="opacity" values="1;0;1" dur="0.2s" repeatCount="indefinite" />
                  </circle>
                ))}
              </>
            )}
          </svg>

          {shortCircuit && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/20 border border-destructive text-destructive font-bold animate-pulse">
              <AlertTriangle className="h-5 w-5" /> SHORT CIRCUIT!
            </div>
          )}

          <button onClick={() => setOn((o) => !o)} className={`absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-display font-black tracking-wider transition ${on ? "bg-gradient-electric text-background animate-pulse-glow" : "bg-muted text-foreground hover:bg-muted/70"}`}>
            <Zap className="h-5 w-5" /> {on ? "POWER ON" : "POWER OFF"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-bold text-lg">Circuit Builder</h3>
            <Slider label="Battery Voltage" value={voltage} onChange={setVoltage} min={1} max={12} unit="V" />
            <div>
              <label className="font-display text-sm font-semibold mb-1.5 block">Number of Bulbs</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setBulbs((b) => Math.max(1, b - 1))} className="h-10 w-10 rounded-lg bg-muted hover:bg-primary/20 flex items-center justify-center"><Minus className="h-4 w-4" /></button>
                <span className="font-display font-black text-2xl flex-1 text-center text-primary">{bulbs}</span>
                <button onClick={() => setBulbs((b) => Math.min(4, b + 1))} className="h-10 w-10 rounded-lg bg-muted hover:bg-primary/20 flex items-center justify-center"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
            <div>
              <label className="font-display text-sm font-semibold mb-1.5 block">Circuit Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["series", "parallel"] as const).map((t) => (
                  <button key={t} onClick={() => setType(t)} className={`py-2 rounded-lg text-xs font-bold uppercase ${type === t ? "bg-gradient-electric text-background" : "bg-muted/50"}`}>{t}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2"><Lightbulb className="h-4 w-4 text-primary" /><span className="font-display font-bold">Challenge</span></div>
            <p className="text-sm text-muted-foreground">Light all 4 bulbs brightly using a single 6V battery. Hint: try parallel!</p>
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="font-display font-bold text-2xl mb-3">⚡ The Science</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20"><b className="text-primary">Voltage (V)</b> — the "push" that moves electrons through wires.</div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20"><b className="text-primary">Current (I)</b> — how many electrons flow per second.</div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20"><b className="text-primary">Resistance (R)</b> — how much the wire "fights" the current.</div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20"><b className="text-primary">Ohm's Law</b> — V = I × R. The golden rule of circuits!</div>
          </div>
        </div>
        <div><QuizBlock questions={questions} badge="Circuit Master" /></div>
      </div>
    </LabShell>
  );
};

export default Electricity;
