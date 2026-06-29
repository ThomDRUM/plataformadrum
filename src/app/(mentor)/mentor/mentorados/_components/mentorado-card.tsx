import Link from "next/link";

interface Props {
  id: string;
  fullName: string;
  studentType: string | null;
  modulesUnlocked: number;
  modulesTotal: number;
}

export function MentoradoCard({
  id, fullName, studentType, modulesUnlocked, modulesTotal,
}: Props) {
  const typeLabel = studentType === "successor" ? "Sucessor" : studentType === "succeeded" ? "Sucedido" : null;

  return (
    <div className="border border-border rounded-lg px-5 py-4 flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{fullName}</p>
          {typeLabel && (
            <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
              {typeLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {modulesUnlocked} de {modulesTotal} módulos liberados
        </p>
      </div>
      <Link
        href={`/mentor/mentorados/${id}`}
        className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors flex-shrink-0"
      >
        Ver detalhe
      </Link>
    </div>
  );
}
