import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mountain, Zap, Globe, Rocket, Dna, Trophy, Award, Wrench, Sparkles, ChevronRight, Play, Anchor } from "lucide-react";
import { Atom3D } from "@/components/lab/Atom3D";
import { LabNav } from "@/components/lab/LabNav";
import { AIAssistant } from "@/components/lab/AIAssistant";
import { ParticleField } from "@/components/lab/ParticleField";

const modules = [
  { to: "/lab/volcano", icon: Mountain, title: "Volcano Lab", desc: "Trigger eruptions, control magma pressure", gradient: "bg-gradient-volcano", color: "text-orange-400" },
  { to: "/lab/electricity", icon: Zap, title: "Electricity Lab", desc: "Build circuits, light bulbs, learn Ohm's Law", gradient: "bg-gradient-electric", color: "text-yellow-300" },
  { to: "/lab/gravity", icon: Globe, title: "Gravity Chamber", desc: "Test physics on Earth, Moon, Mars & beyond", gradient: "bg-gradient-gravity", color: "text-blue-300" },
  { to: "/lab/rocket", icon: Rocket, title: "Rocket Launch Bay", desc: "Engineer rockets, reach orbit, deliver payloads", gradient: "bg-gradient-rocket", color: "text-red-400" },
  { to: "/lab/dna", icon: Dna, title: "DNA Mixing Center", desc: "Splice traits, create alien species", gradient: "bg-gradient-dna", color: "text-emerald-300" },
  { to: "/lab/submarine", icon: Anchor, title: "Deep Sea Lab", desc: "Pilot a sub, dive the abyss, ping with sonar", gradient: "bg-gradient-gravity", color: "text-cyan-300" },
  { to: "/lab/quiz", icon: Trophy, title: "Quiz Arena", desc: "Boss battles, time attack, leaderboards", gradient: "bg-gradient-secondary", color: "text-fuchsia-300" },
  { to: "/lab/quiz", icon: Award, title: "Achievements", desc: "Earn badges, unlock skins & themes", gradient: "bg-gradient-primary", color: "text-cyan-300" },
  { to: "/lab/rocket", icon: Wrench, title: "Inventor Workshop", desc: "Daily science challenge — build & solve", gradient: "bg-gradient-secondary", color: "text-purple-300" },
];

const stats = [
  { v: "6", l: "Lab Modules" },
  { v: "120+", l: "Experiments" },
  { v: "∞", l: "Discoveries" },
];

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <LabNav />
      <ParticleField count={60} />

      {/* Animated grid backdrop */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* HERO */}
      <section className="relative pt-24 pb-12 px-4">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 mb-5">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="font-mono text-xs tracking-widest text-primary">SYSTEM ONLINE · v2.0.26</span>
            </div>
            <h1 className="font-display font-black text-5xl md:text-7xl leading-[0.95] mb-4">
              <span className="block bg-gradient-primary bg-clip-text text-transparent neon-text">WELCOME TO</span>
              <span className="block bg-gradient-secondary bg-clip-text text-transparent neon-text-accent">AI SCIENCE LAB</span>
            </h1>
            <p className="text-xl text-foreground/80 mb-2 max-w-xl">Run experiments. Discover science. Become an inventor.</p>
            <p className="text-base text-muted-foreground mb-8 max-w-xl">A futuristic digital laboratory where dangerous experiments become safe, fun, and addictively educational.</p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/lab/volcano" className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-display font-bold tracking-wide overflow-hidden animate-pulse-glow">
                <Play className="h-4 w-4 fill-current" />
                Start Experiments
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </Link>
              <Link to="/lab/quiz" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/50 bg-background/40 backdrop-blur text-primary font-display font-bold tracking-wide hover:bg-primary/10 transition">
                <Trophy className="h-4 w-4" /> Quiz Arena
              </Link>
              <a href="#modules" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-secondary/50 bg-background/40 backdrop-blur text-secondary font-display font-bold tracking-wide hover:bg-secondary/10 transition">
                Explore Topics
              </a>
            </div>

            <div className="flex gap-8">
              {stats.map((s) => (
                <div key={s.l}>
                  <div className="font-display font-black text-3xl bg-gradient-primary bg-clip-text text-transparent">{s.v}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 3D atom */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} className="relative h-[500px] lg:h-[600px]">
            <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 blur-3xl animate-pulse-glow" />
            <div className="relative h-full w-full">
              <Atom3D />
            </div>
            {/* HUD ring */}
            <div className="absolute inset-8 rounded-full border border-primary/20 pointer-events-none animate-float-slow" />
            <div className="absolute inset-16 rounded-full border border-secondary/20 pointer-events-none" />
            {/* Floating formulas */}
            {["E=mc²", "F=ma", "H₂O", "DNA", "πr²"].map((f, i) => (
              <div
                key={f}
                className="absolute font-mono text-primary/60 text-sm animate-float-slow"
                style={{
                  top: `${10 + i * 18}%`,
                  left: i % 2 === 0 ? "5%" : "85%",
                  animationDelay: `${i * 0.7}s`,
                }}
              >
                {f}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="relative py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-mono tracking-widest mb-3 border border-primary/40 bg-primary/10 text-primary">
              ◉ SELECT YOUR LAB
            </div>
            <h2 className="font-display font-black text-4xl md:text-5xl mb-3 bg-gradient-primary bg-clip-text text-transparent">MISSION CONTROL</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Pick a module to begin. Each lab is fully interactive with quizzes, badges, and AI guidance.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              >
                <Link to={m.to} className="group block">
                  <div className="glass-panel rounded-2xl p-5 h-full transition-all duration-300 hover:-translate-y-2 hover:border-primary/60 relative overflow-hidden">
                    <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full ${m.gradient} opacity-20 blur-2xl group-hover:opacity-40 transition`} />
                    <div className={`relative inline-flex h-12 w-12 items-center justify-center rounded-xl ${m.gradient} mb-4 group-hover:scale-110 transition`}>
                      <m.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-1 group-hover:text-primary transition">{m.title}</h3>
                    <p className="text-sm text-muted-foreground leading-snug">{m.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-mono text-primary opacity-0 group-hover:opacity-100 transition">
                      ENTER LAB <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="relative py-16 px-4">
        <div className="container mx-auto">
          <div className="glass-panel rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-10" />
            <Trophy className="relative h-12 w-12 mx-auto text-primary mb-4 animate-float-slow" />
            <h3 className="relative font-display font-black text-3xl md:text-4xl mb-3">Daily Science Challenge</h3>
            <p className="relative text-muted-foreground mb-6 max-w-lg mx-auto">"Build a rocket that reaches orbit using minimum fuel." Complete it to earn the <span className="text-primary font-semibold">Rocket Genius</span> badge.</p>
            <Link to="/lab/rocket" className="relative inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-secondary text-white font-display font-bold tracking-wide hover:scale-105 transition">
              Accept Challenge <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative py-8 text-center text-xs font-mono text-muted-foreground border-t border-primary/10">
        AI SCIENCE LAB · Built for curious minds aged 12–14 · ⚡ Powered by curiosity
      </footer>

      <AIAssistant />
    </div>
  );
};

export default Index;
