export const Slider = ({ label, value, onChange, min, max, step = 1, unit = "", color = "primary" }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string; color?: string }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-display text-sm font-semibold tracking-wide">{label}</label>
        <span className={`font-mono text-sm text-${color}`}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-${color}`}
        style={{
          background: `linear-gradient(to right, hsl(var(--${color})) 0%, hsl(var(--${color})) ${((value - min) / (max - min)) * 100}%, hsl(var(--muted)) ${((value - min) / (max - min)) * 100}%, hsl(var(--muted)) 100%)`,
        }}
      />
    </div>
  );
};
