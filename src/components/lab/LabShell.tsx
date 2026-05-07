import { ReactNode } from "react";
import { LabNav } from "./LabNav";
import { AIAssistant } from "./AIAssistant";
import { ParticleField } from "./ParticleField";

export const LabShell = ({ children, title, subtitle, accent = "primary" }: { children: ReactNode; title: string; subtitle: string; accent?: "primary" | "secondary" | "accent" }) => {
  const accentMap = {
    primary: "bg-primary/10 border-primary/40 text-primary",
    secondary: "bg-secondary/10 border-secondary/40 text-secondary",
    accent: "bg-accent/10 border-accent/40 text-accent",
  };
  return (
    <div className="min-h-screen relative">
      <LabNav />
      <ParticleField count={25} />
      <main className="relative pt-24 pb-20 px-4">
        <div className="container mx-auto">
          <div className="mb-8 animate-fade-in">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-mono tracking-widest mb-3 border ${accentMap[accent]}`}>
              ◉ LAB MODULE ACTIVE
            </div>
            <h1 className="font-display font-black text-4xl md:text-6xl neon-text bg-gradient-primary bg-clip-text text-transparent">{title}</h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
      <AIAssistant />
    </div>
  );
};
