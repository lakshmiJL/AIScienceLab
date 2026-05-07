import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Sparkles } from "lucide-react";

const facts = [
  "Did you know? Lightning is 5x hotter than the sun's surface!",
  "A bolt of lightning contains enough energy to toast 100,000 slices of bread.",
  "Volcanic lava can reach 1,250°C — hot enough to melt gold instantly.",
  "Your DNA, stretched out, would reach the sun and back ~600 times.",
  "On the Moon, you'd jump 6 times higher than on Earth.",
  "Rockets need to reach 11.2 km/s to escape Earth's gravity!",
];

export const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [factIdx, setFactIdx] = useState(0);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="glass-panel mb-4 w-80 rounded-2xl p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-display text-sm font-bold text-primary">NOVA · AI Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed mb-3">
              Hi scientist! 👋 I'm <span className="text-primary font-semibold">Nova</span>, your lab assistant.
            </p>
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 text-xs text-foreground/80">
              💡 {facts[factIdx]}
            </div>
            <button
              onClick={() => setFactIdx((i) => (i + 1) % facts.length)}
              className="mt-3 w-full rounded-lg bg-gradient-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition"
            >
              Next Fun Fact →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="relative h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow"
        style={{ boxShadow: "var(--glow-primary)" }}
      >
        <Bot className="h-8 w-8 text-primary-foreground" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
      </motion.button>
    </div>
  );
};
