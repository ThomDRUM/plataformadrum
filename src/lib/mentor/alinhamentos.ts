export const TIPO_OPTIONS = [
  "Alinhamento dos sócios atuais",
  "Alinhamento da próxima geração",
  "Diálogo intergeracional — núcleo familiar",
  "Diálogo intergeracional — família empreendedora",
  "Harmonia familiar",
  "Diretrizes da Família Empreendedora",
  "Proteger o negócio",
] as const;

export type TipoAlinhamento = (typeof TIPO_OPTIONS)[number];

export const TIPO_TO_FASE: Record<string, 0 | 1 | 2> = {
  "Alinhamento dos sócios atuais": 0,
  "Alinhamento da próxima geração": 0,
  "Diálogo intergeracional — núcleo familiar": 1,
  "Diálogo intergeracional — família empreendedora": 1,
  "Harmonia familiar": 2,
  "Diretrizes da Família Empreendedora": 2,
  "Proteger o negócio": 2,
};

export const FASE_COLOR: Record<0 | 1 | 2, string> = {
  0: "#3B82F6",
  1: "#F97316",
  2: "#22C55E",
};

export const FASE_LABEL: Record<0 | 1 | 2, string> = {
  0: "Fase 0 — Conexão peer-to-peer",
  1: "Fase 1 — Diálogo intergeracional",
  2: "Fase 2 — Os três objetivos da governança",
};

export function colorForTipo(tipo: string | null): string | null {
  if (!tipo) return null;
  const fase = TIPO_TO_FASE[tipo];
  return fase !== undefined ? FASE_COLOR[fase] : null;
}
