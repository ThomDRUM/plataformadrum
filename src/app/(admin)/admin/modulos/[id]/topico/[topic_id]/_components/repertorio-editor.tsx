"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRightIcon } from "lucide-react";
import { saveRepertoire, deleteRepertoire } from "@/lib/actions/admin/topic-content";
import { RichEditor } from "@/components/admin/rich-editor/rich-editor";
import { Field, TextField, FormError } from "@/components/admin/form-fields";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SaveBar } from "./save-bar";

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
    <Frame spacing="sm">
      <FrameHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <FrameTitle>Repertório</FrameTitle>
          <FrameDescription>
            O texto que o mentorado lê neste tópico. O que você vê no editor é como ele vai ler.
          </FrameDescription>
        </div>
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
      </FrameHeader>

      {/* `overflow-visible`: o painel corta o conteúdo por padrão, o que
          impediria a barra de ferramentas do editor de ficar fixa ao rolar. */}
      <FramePanel className="overflow-visible">
        <div className="space-y-4">
          {isLegacyVideo && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs text-foreground">
                Este repertório foi criado no formato antigo, como vídeo avulso
                {repertoire?.youtube_url ? ` (${repertoire.youtube_url})` : ""}. Ao salvar, ele
                passa a ser conteúdo de texto — insira o vídeo pelo botão do YouTube na barra de
                ferramentas para mantê-lo.
              </p>
            </div>
          )}

          <FormError message={error} />

          <Field label="Título interno" hint="O mentorado vê o título do tópico, não este.">
            <TextField
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              placeholder="Repertório"
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
            <FormattingTips />
          </div>
        </div>
      </FramePanel>

      <FrameFooter>
        <SaveBar
          label="Salvar repertório"
          isPending={isPending}
          dirty={dirty}
          disabled={title.trim().length === 0}
          onSave={handleSave}
        />
      </FrameFooter>
    </Frame>
  );
}

/** Recolhido por padrão: útil na primeira vez, ruído em todas as outras. */
function FormattingTips() {
  return (
    <Collapsible className="mt-2">
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="group flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          />
        }
      >
        <ChevronRightIcon
          aria-hidden="true"
          className="size-3.5 shrink-0 transition-transform group-data-[panel-open]:rotate-90"
        />
        Dicas de formatação e colagem
      </CollapsibleTrigger>

      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
        <div className="space-y-1 pt-2 pl-4.5 text-xs text-muted-foreground">
          <p>Título, subtítulo, negrito, listas, citação, link, imagem e vídeo do YouTube.</p>
          <p>
            Colar código HTML converte automaticamente em conteúdo formatado — para colar as
            tags como texto, use Ctrl+Shift+V. Tabelas viram parágrafos e cores não são
            suportadas. Imagem colada continua hospedada na origem: envie pelo botão de
            imagem para garantir que não suma.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
