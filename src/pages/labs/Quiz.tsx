import { useState } from "react";
import { LabShell } from "@/components/lab/LabShell";
import { QuizBlock } from "@/components/lab/QuizBlock";
import { Trophy, Flame, Clock, Skull, Shuffle } from "lucide-react";

const banks = {
  mixed: [
    { q: "Lava is molten rock that comes from where?", options: ["Sky", "Inside Earth", "Ocean", "Trees"], answer: 1 },
    { q: "Light bulbs need what to glow?", options: ["Water", "Electric current", "Magnets", "Air"], answer: 1 },
    { q: "On the Moon, gravity is about __ of Earth's.", options: ["Same", "1/6", "1/2", "Twice"], answer: 1 },
    { q: "Rockets launch by pushing __ downward.", options: ["Air", "Hot gases", "Water", "Sound"], answer: 1 },
    { q: "DNA is shaped like a…", options: ["Circle", "Double helix", "Square", "Star"], answer: 1 },
    { q: "Which is the largest planet?", options: ["Earth", "Mars", "Jupiter", "Venus"], answer: 2 },
    { q: "Plants make food using…", options: ["Photosynthesis", "Digestion", "Respiration", "Fermentation"], answer: 0 },
    { q: "Sound travels fastest through…", options: ["Air", "Water", "Solids", "Vacuum"], answer: 2 },
  ],
  volcano: [
    { q: "Inside Earth, molten rock is called…", options: ["Lava", "Magma", "Ash", "Soil"], answer: 1 },
    { q: "Most volcanoes form at…", options: ["Lakes", "Plate boundaries", "Beaches", "Mountains only"], answer: 1 },
    { q: "What gas mostly drives eruptions?", options: ["Oxygen", "Water vapor + CO₂", "Helium", "Nitrogen"], answer: 1 },
  ],
  electricity: [
    { q: "Voltage is measured in…", options: ["Amperes", "Volts", "Watts", "Ohms"], answer: 1 },
    { q: "A material that doesn't let electricity pass is…", options: ["Conductor", "Insulator", "Resistor", "Battery"], answer: 1 },
    { q: "Ohm's Law: V = ?", options: ["I + R", "I × R", "I − R", "I / R"], answer: 1 },
  ],
  gravity: [
    { q: "Weight depends on…", options: ["Only mass", "Mass × gravity", "Only gravity", "Color"], answer: 1 },
    { q: "Gravity on Mars is about…", options: ["Same as Earth", "About 1/3", "10× Earth", "Zero"], answer: 1 },
    { q: "Newton's first law is about…", options: ["Inertia", "Action-reaction", "Energy", "Friction"], answer: 0 },
  ],
};

const Quiz = () => {
  const [cat, setCat] = useState<keyof typeof banks>("mixed");
  const [mode, setMode] = useState<"solo" | "time" | "survival" | "boss">("solo");

  const modes = [
    { id: "solo" as const, icon: Trophy, label: "Solo", desc: "Take your time" },
    { id: "time" as const, icon: Clock, label: "Time Attack", desc: "Beat the clock" },
    { id: "survival" as const, icon: Skull, label: "Survival", desc: "One mistake = end" },
    { id: "boss" as const, icon: Flame, label: "Boss Battle", desc: "Hardest questions" },
  ];

  const leaderboard = [
    { name: "Nova_Bot", xp: 4820, badge: "🏆" },
    { name: "AtomSmasher", xp: 3950, badge: "🥈" },
    { name: "VoltQueen", xp: 3210, badge: "🥉" },
    { name: "RocketKid", xp: 2870 },
    { name: "DNA_Wiz", xp: 2540 },
  ];

  return (
    <LabShell title="QUIZ ARENA" subtitle="Battle through science. Earn XP, unlock badges, climb the leaderboard." accent="accent">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2"><Shuffle className="h-4 w-4 text-accent" /> Choose Category</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(banks).map((c) => (
                <button key={c} onClick={() => setCat(c as keyof typeof banks)} className={`px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider ${cat === c ? "bg-gradient-secondary text-white" : "bg-muted/50 text-muted-foreground"}`}>{c}</button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-3">
            {modes.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)} className={`glass-panel rounded-xl p-4 text-left transition hover:-translate-y-1 ${mode === m.id ? "border-accent border-2" : ""}`}>
                <m.icon className={`h-6 w-6 mb-2 ${mode === m.id ? "text-accent" : "text-primary"}`} />
                <div className="font-display font-bold text-sm">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.desc}</div>
              </button>
            ))}
          </div>

          <QuizBlock key={cat + mode} questions={banks[cat]} badge="Science Hero" />
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" /> Leaderboard</h3>
            <div className="space-y-2">
              {leaderboard.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground w-5">#{i + 1}</span>
                    <span className="font-display font-bold">{p.name}</span>
                    {p.badge && <span>{p.badge}</span>}
                  </div>
                  <span className="font-mono text-xs text-accent">{p.xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="font-display font-bold text-lg mb-3">🏅 Achievements</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {["Lab Rookie", "Science Hero", "Rocket Genius", "Earth Protector", "DNA Wizard", "Circuit Master"].map((b) => (
                <div key={b} className="p-2 rounded-lg bg-gradient-primary/10 border border-primary/30 text-center font-display font-bold">{b}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LabShell>
  );
};

export default Quiz;
