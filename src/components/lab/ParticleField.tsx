import { useMemo } from "react";

export const ParticleField = ({ count = 40 }: { count?: number }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 6,
        duration: Math.random() * 8 + 6,
        color: ["188 100% 55%", "270 90% 65%", "320 100% 60%"][Math.floor(Math.random() * 3)],
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-float-slow"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `hsl(${p.color})`,
            boxShadow: `0 0 ${p.size * 4}px hsl(${p.color} / 0.8)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
};
