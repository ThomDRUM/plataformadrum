"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveRepertoire, deleteRepertoire } from "@/lib/actions/admin/topic-content";
import { RichEditor } from "@/components/admin/rich-editor/rich-editor";
import { Field, TextField, FormError } from "@/components/admin/form-fields";
import { SectionTitle } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";

interface Props {
  topicId: string;
  moduleId: string;
  repertoire: {
    id: string;
    title: string;
    content_type: string;
    content_html: string | null;
    youtube_url: string | null;
  } | null;
}

export function RepertorioEditor({ topicId, moduleId, repertoire }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(repertoire?.title ?? "");
  const [html, setHtml] = useState(repertoire?.content_html ?? "");
  const [dirty, setDirty] = useState(false);

  // Repertório antigo gravado como vídeo: o conteúdo mora em `youtube_url`,
  // fora do editor. Salvar por aqui converteria o item para texto e perderia
  // o vídeo, então avisamos antes em vez de fazer isso em silêncio.
  const isLegacyVideo = repertoire?.content_type === "video";

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveRepertoire(topicId, moduleId, { title: title.trim(), contentHtml: html });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setDirty(false);
      toast.success("Repertório salvo.");
      router.refresh();
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <SectionTitle>Repertório</SectionTitle>
        {repertoire && (
          <DeleteButton
            itemName="o repertório deste tópico"
            warning="O conteúdo é removido. As imagens já enviadas continuam no armazenamento."
            action={async () => {
              const result = await deleteRepertoire(repertoire.id, topicId, moduleId);
              if (!result.ok) throw new Error(result.error);
              setTitle("");
              setHtml("");
              toast.success("Repertório excluído.");
              router.refresh();
            }}
          />
        )}
      </div>

      {isLegacyVideo && (
        <div className="mb-4 rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-xs text-foreground">
            Este repertório foi criado no formato antigo, como vídeo avulso
            {repertoire?.youtube_url ? ` (${repertoire.youtube_url})` : ""}. Ao salvar, ele
            passa a ser conteúdo de texto — insira o vídeo pelo botão do YouTube na barra de
            ferramentas para mantê-lo.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <FormError message={error} />

        <Field label="Título" hint="Uso interno — o mentorado vê o título do tópico.">
          <TextField
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            placeholder="Repertório"
            className="max-w-md"
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-foreground">Conteúdo</span>
          <RichEditor
            content={repertoire?.content_html ?? ""}
            onChange={(next) => {
              setHtml(next);
              setDirty(true);
            }}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Título, subtítulo, negrito, listas, citação, link, imagem e vídeo do YouTube. O
            que você vê aqui é como o mentorado vai ler.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="lg"
            onClick={handleSave}
            disabled={isPending || title.trim().length === 0}
          >
            {isPending ? "Salvando…" : "Salvar repertório"}
          </Button>
          {dirty && !isPending && (
            <span className="text-xs text-muted-foreground">Alterações não salvas.</span>
          )}
        </div>
      </div>
    </section>
  );
}
