import { Link, useLocation } from "react-router-dom";
import { Beaker, Home } from "lucide-react";

export const LabNav = () => {
  const { pathname } = useLocation();
  const links = [
    { to: "/", label: "Home" },
    { to: "/lab/volcano", label: "Volcano" },
    { to: "/lab/electricity", label: "Electricity" },
    { to: "/lab/gravity", label: "Gravity" },
    { to: "/lab/rocket", label: "Rocket" },
    { to: "/lab/dna", label: "DNA" },
    { to: "/lab/submarine", label: "Submarine" },
    { to: "/lab/quiz", label: "Quiz Arena" },
  ];
  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl bg-background/60 border-b border-primary/20">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition">
            <Beaker className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="font-display font-black text-lg leading-none">
            <div className="bg-gradient-primary bg-clip-text text-transparent">AI SCIENCE</div>
            <div className="text-[10px] tracking-[0.4em] text-muted-foreground">L A B</div>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-1.5 rounded-md text-sm font-display font-semibold tracking-wide transition ${
                  active
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "text-foreground/70 hover:text-primary hover:bg-primary/10"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <Link to="/" className="md:hidden text-primary"><Home className="h-5 w-5" /></Link>
      </nav>
    </header>
  );
};
