import { Button } from "@/components/ui/button";

interface Props {
  label: string;
  isPending: boolean;
  dirty: boolean;
  disabled?: boolean;
  onSave?: () => void;
  /** `submit` quando o botão vive dentro de um `<form>`. */
  type?: "button" | "submit";
}

/**
 * Rodapé dos blocos da tela de tópico: botão de salvar e o estado ao lado,
 * como no `DadosTab` da família — quem edita um repertório longo precisa saber,
 * sem rolar de volta, se o que escreveu já foi gravado.
 */
export function SaveBar({ label, isPending, dirty, disabled, onSave, type = "button" }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Button type={type} size="lg" onClick={onSave} disabled={isPending || disabled}>
        {label}
      </Button>
      <p className="text-xs text-muted-foreground">
        {isPending ? "Salvando…" : dirty ? "Alterações não salvas." : "Tudo salvo."}
      </p>
    </div>
  );
}
