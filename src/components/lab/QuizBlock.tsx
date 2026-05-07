import { useState } from "react";
import { Check, X, Award, RotateCcw } from "lucide-react";

export type QuizQuestion = { q: string; options: string[]; answer: number; explain?: string };

export const QuizBlock = ({ questions, badge }: { questions: QuizQuestion[]; badge: string }) => {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[idx];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (idx + 1 >= questions.length) setDone(true);
    else { setIdx(idx + 1); setPicked(null); }
  };
  const reset = () => { setIdx(0); setPicked(null); setScore(0); setDone(false); };

  if (done) {
    const passed = score >= Math.ceil(questions.length * 0.6);
    return (
      <div className="glass-panel rounded-2xl p-8 text-center animate-scale-in">
        <Award className={`h-16 w-16 mx-auto mb-4 ${passed ? "text-primary animate-float-slow" : "text-muted-foreground"}`} />
        <h3 className="font-display font-black text-3xl mb-2">{passed ? "🎉 Badge Unlocked!" : "Try Again!"}</h3>
        {passed && <div className="inline-block px-4 py-2 rounded-full bg-gradient-primary text-primary-foreground font-display font-bold mb-4">{badge}</div>}
        <p className="text-muted-foreground mb-6">Score: {score} / {questions.length}</p>
        <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-secondary text-white font-display font-bold">
          <RotateCcw className="h-4 w-4" /> Replay
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-xs tracking-widest text-primary">QUESTION {idx + 1} / {questions.length}</span>
        <span className="font-mono text-xs text-accent">SCORE: {score}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-5">
        <div className="h-full bg-gradient-primary transition-all" style={{ width: `${((idx + (picked !== null ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      <h4 className="font-display font-bold text-xl mb-5">{q.q}</h4>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {q.options.map((opt, i) => {
          const isAns = i === q.answer;
          const isPicked = i === picked;
          let cls = "border-primary/30 hover:border-primary hover:bg-primary/10";
          if (picked !== null) {
            if (isAns) cls = "border-success bg-success/15 text-success";
            else if (isPicked) cls = "border-destructive bg-destructive/15 text-destructive";
            else cls = "border-muted opacity-50";
          }
          return (
            <button key={i} onClick={() => choose(i)} disabled={picked !== null} className={`p-3 rounded-xl border-2 text-left font-medium transition flex items-center justify-between ${cls}`}>
              <span>{opt}</span>
              {picked !== null && isAns && <Check className="h-5 w-5" />}
              {picked !== null && isPicked && !isAns && <X className="h-5 w-5" />}
            </button>
          );
        })}
      </div>
      {picked !== null && q.explain && <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 mb-4">💡 {q.explain}</p>}
      {picked !== null && (
        <button onClick={next} className="w-full py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-display font-bold">
          {idx + 1 >= questions.length ? "See Results" : "Next →"}
        </button>
      )}
    </div>
  );
};
