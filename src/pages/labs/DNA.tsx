import { useState } from "react";
import { LabShell } from "@/components/lab/LabShell";
import { QuizBlock } from "@/components/lab/QuizBlock";
import { Dna as DnaIcon, Sparkles } from "lucide-react";

const traits = {
  eyeColor: { label: "Eye Color", options: ["🔵 Blue", "🟢 Green", "🟣 Violet", "🔴 Red"] },
  fur: { label: "Fur Color", options: ["⬜ White", "⬛ Black", "🟧 Orange", "🌈 Rainbow"] },
  size: { label: "Size", options: ["🐭 Tiny", "🐱 Small", "🐺 Medium", "🦣 Huge"] },
  power: { label: "Special Power", options: ["⚡ Lightning", "🔥 Fire breath", "💎 Invisible", "🪽 Wings"] },
  speed: { label: "Speed", options: ["🐢 Slow", "🚶 Normal", "🏃 Fast", "⚡ Hyper"] },
  glow: { label: "Glow Ability", options: ["❌ None", "✨ Soft", "🌟 Bright", "☀️ Blinding"] },
};

const questions = [
  { q: "What does DNA stand for?", options: ["Daily Nutrition Activity", "Deoxyribonucleic Acid", "Direct Neural Access", "Dynamic Number Array"], answer: 1 },
  { q: "Genes that always show up are called…", options: ["Recessive", "Dominant", "Mutant", "Sleepy"], answer: 1, explain: "Dominant genes win — recessive ones hide unless both parents pass them." },
  { q: "How many DNA strands form a double helix?", options: ["1", "2", "4", "8"], answer: 1 },
  { q: "Mutations are…", options: ["Always bad", "Random changes in DNA", "Only in movies", "Caused by Wi-Fi"], answer: 1, explain: "Some mutations are harmful, some helpful, most do nothing." },
];

const DNA = () => {
  const [parentA, setParentA] = useState<Record<string, number>>({ eyeColor: 0, fur: 0, size: 1, power: 0, speed: 1, glow: 0 });
  const [parentB, setParentB] = useState<Record<string, number>>({ eyeColor: 1, fur: 2, size: 2, power: 1, speed: 2, glow: 2 });
  const [child, setChild] = useState<Record<string, number> | null>(null);
  const [creating, setCreating] = useState(false);

  const breed = () => {
    setCreating(true);
    setTimeout(() => {
      const c: Record<string, number> = {};
      Object.keys(traits).forEach((k) => {
        // 60% chance of a parent's trait, 10% mutation
        const rand = Math.random();
        if (rand < 0.45) c[k] = parentA[k];
        else if (rand < 0.9) c[k] = parentB[k];
        else c[k] = Math.floor(Math.random() * 4); // mutation
      });
      setChild(c);
      setCreating(false);
    }, 1400);
  };

  const ParentEditor = ({ label, vals, set, color }: { label: string; vals: Record<string, number>; set: (v: Record<string, number>) => void; color: string }) => (
    <div className="glass-panel rounded-2xl p-5">
      <h3 className={`font-display font-bold text-lg mb-3 text-${color}`}>{label}</h3>
      <div className="space-y-2">
        {Object.entries(traits).map(([k, t]) => (
          <div key={k}>
            <div className="text-xs font-display font-semibold mb-1">{t.label}</div>
            <div className="grid grid-cols-4 gap-1">
              {t.options.map((opt, i) => (
                <button key={i} onClick={() => set({ ...vals, [k]: i })} className={`p-1.5 text-xs rounded-md ${vals[k] === i ? `bg-${color}/20 border border-${color}` : "bg-muted/40 border border-transparent"}`}>{opt}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <LabShell title="DNA MIXING CENTER" subtitle="Splice traits. Create new species. Discover inheritance.">
      <div className="grid lg:grid-cols-3 gap-6">
        <ParentEditor label="🧬 Parent A" vals={parentA} set={setParentA} color="primary" />
        <div className="glass-panel rounded-2xl p-5 flex flex-col items-center justify-center text-center min-h-[400px] relative overflow-hidden">
          {/* DNA helix */}
          <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full opacity-30">
            {Array.from({ length: 14 }).map((_, i) => {
              const y = i * 14 + 5;
              const x1 = 50 + Math.sin(i * 0.6) * 30;
              const x2 = 50 - Math.sin(i * 0.6) * 30;
              return (
                <g key={i}>
                  <line x1={x1} y1={y} x2={x2} y2={y} stroke="hsl(188 100% 55%)" strokeWidth="1" />
                  <circle cx={x1} cy={y} r="2.5" fill="hsl(188 100% 55%)" />
                  <circle cx={x2} cy={y} r="2.5" fill="hsl(270 90% 65%)" />
                </g>
              );
            })}
          </svg>
          <div className="relative z-10">
            {!child && !creating && (
              <>
                <DnaIcon className="h-16 w-16 mx-auto text-primary mb-3 animate-float-slow" />
                <p className="text-sm text-muted-foreground mb-4">Press SPLICE to combine DNA</p>
                <button onClick={breed} className="px-6 py-3 rounded-xl bg-gradient-dna text-white font-display font-black tracking-wider hover:scale-105 transition animate-pulse-glow">
                  <Sparkles className="h-4 w-4 inline mr-1" /> SPLICE DNA
                </button>
              </>
            )}
            {creating && (
              <div className="space-y-3">
                <DnaIcon className="h-16 w-16 mx-auto text-primary animate-spin" />
                <p className="font-mono text-sm text-primary">Sequencing genome…</p>
              </div>
            )}
            {child && !creating && (
              <div className="animate-scale-in">
                <div className="text-xs font-mono text-success mb-2">✓ NEW ORGANISM CREATED</div>
                <h4 className="font-display font-black text-2xl mb-3 bg-gradient-dna bg-clip-text text-transparent">Offspring</h4>
                <div className="space-y-1 text-sm text-left bg-background/60 backdrop-blur rounded-xl p-4 border border-primary/30 mb-3">
                  {Object.entries(traits).map(([k, t]) => (
                    <div key={k} className="flex justify-between"><span className="text-muted-foreground">{t.label}:</span><span className="font-semibold">{t.options[child[k]]}</span></div>
                  ))}
                </div>
                <button onClick={breed} className="px-4 py-2 rounded-lg bg-gradient-dna text-white font-display font-bold text-sm">Splice Again</button>
              </div>
            )}
          </div>
        </div>
        <ParentEditor label="🧬 Parent B" vals={parentB} set={setParentB} color="accent" />

        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="font-display font-bold text-2xl mb-3">🧬 Genetics 101</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20"><b className="text-primary">Genes</b> are instructions in your DNA that decide your traits.</div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20"><b className="text-primary">Dominant vs Recessive</b> — dominant genes show up; recessive ones hide.</div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20"><b className="text-primary">Inheritance</b> — you get half your DNA from each parent.</div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20"><b className="text-primary">Mutations</b> — random copy errors. Some are useful, most don't matter.</div>
          </div>
        </div>
        <div><QuizBlock questions={questions} badge="Genetics Genius" /></div>
      </div>
    </LabShell>
  );
};

export default DNA;
