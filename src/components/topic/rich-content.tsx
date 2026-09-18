import { cn } from "@/lib/utils";
import { toRichHtml } from "@/lib/rich-content";

/**
 * Único ponto de leitura de conteúdo rico. Usa a mesma classe
 * (`tiptap-content`) que o `RichEditor` aplica ao escrever, então o que o
 * autor vê é o que aluno e mentor leem.
 *
 * `className` serve para variação de contexto — cor, peso — e nunca para
 * tamanho de fonte: o tamanho é o da folha única em `globals.css`.
 */
export function RichContent({ html, className }: { html: string | null; className?: string }) {
  return (
    <div
      className={cn("tiptap-content", className)}
      dangerouslySetInnerHTML={{ __html: toRichHtml(html) }}
    />
  );
}
