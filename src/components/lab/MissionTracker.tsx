import { Check, Target, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type Mission = {
  id: string;
  title: string;
  hint: string;
  done: boolean;
};

export const MissionTracker = ({
  missions,
  title = "Quests",
  badge,
}: {
  missions: Mission[];
  title?: string;
  badge?: string;
}) => {
  const completed = missions.filter((m) => m.done).length;
  const allDone = completed === missions.length && missions.length > 0;

  return (
    <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display font-bold text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" /> {title}
        </h4>
        <span className="text-xs font-mono text-muted-foreground">
          {completed}/{missions.length}
        </span>
      </div>

      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${(completed / Math.max(1, missions.length)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <ul className="space-y-2">
        {missions.map((m) => (
          <li
            key={m.id}
            className={`flex items-start gap-2 text-xs transition ${
              m.done ? "opacity-60" : ""
            }`}
          >
            <span
              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                m.done
                  ? "bg-success border-success text-background"
                  : "border-primary/40 bg-background"
              }`}
            >
              {m.done && <Check className="h-3 w-3" />}
            </span>
            <div>
              <div className={`font-display font-semibold ${m.done ? "line-through" : "text-foreground"}`}>
                {m.title}
              </div>
              <div className="text-muted-foreground">{m.hint}</div>
            </div>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {allDone && badge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-xl bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/40 text-center"
          >
            <Trophy className="h-5 w-5 text-accent mx-auto mb-1" />
            <div className="font-display font-black text-sm text-accent">
              BADGE UNLOCKED
            </div>
            <div className="text-xs text-foreground">{badge}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
