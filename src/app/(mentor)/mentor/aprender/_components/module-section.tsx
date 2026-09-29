interface Props {
  id: string;
  moduleNumber: number;
  title: string;
  intention: string | null;
  why: string | null;
  children: React.ReactNode;
}

export function ModuleSection({ id, moduleNumber, title, intention, why, children }: Props) {
  return (
    <section id={id} className="scroll-mt-24">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
        Módulo {moduleNumber}
      </p>
      <h2 className="text-xl font-semibold tracking-tight text-foreground leading-snug">{title}</h2>

      {intention && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
            Intenção
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">{intention}</p>
        </div>
      )}

      {why && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
            Por quê?
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{why}</p>
        </div>
      )}

      <div className="mt-8 space-y-10">{children}</div>
    </section>
  );
}
