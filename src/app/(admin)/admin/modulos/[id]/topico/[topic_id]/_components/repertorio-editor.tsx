"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRightIcon, Maximize2Icon } from "lucide-react";
import { saveRepertoire, deleteRepertoire } from "@/lib/actions/admin/topic-content";
import { RichEditor } from "@/components/admin/rich-editor/rich-editor";
import {
  HtmlDocumentFrame,
  STUDENT_READING_WIDTH,
} from "@/components/topic/html-document-frame";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  const [mode, setMode] = useState<Mode>(repertoire?.content_type === "html" ? "html" : "rich");
  // O TipTap só lê `content` na montagem: ao voltar do modo HTML, a chave nova
  // remonta o editor com o conteúdo atual.
  const [richKey, setRichKey] = useState(0);
  const [confirmRich, setConfirmRich] = useState(false);

  function handleModeChange(next: Mode) {
    if (next === mode) return;
    // HTML → visual: o TipTap descarta classes, estilos e o <head>. Com
    // conteúdo na tela, isso é perda silenciosa — pede confirmação antes.
    if (next === "rich" && html.trim()) {
      setConfirmRich(true);
      return;
    }
    setMode(next);
    setDirty(true);
  }

  function confirmSwitchToRich() {
    setMode("rich");
    setRichKey((k) => k + 1);
    setDirty(true);
    setConfirmRich(false);
  }

  // Repertório antigo gravado como vídeo: o conteúdo mora em `youtube_url`,
  // fora do editor. Salvar por aqui converteria o item para texto e perderia
  // o vídeo, então avisamos antes em vez de fazer isso em silêncio.
  const isLegacyVideo = repertoire?.content_type === "video";

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveRepertoire(topicId, moduleId, {
        title: title.trim(),
        contentHtml: html,
        mode,
      });

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
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="block text-xs font-medium text-foreground">Conteúdo</span>
              <Tabs value={mode} onValueChange={(value) => handleModeChange(value as Mode)}>
                <TabsList>
                  <TabsTrigger value="rich" className="px-2.5 text-xs">
                    Editor visual
                  </TabsTrigger>
                  <TabsTrigger value="html" className="px-2.5 text-xs">
                    HTML
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {mode === "rich" ? (
              <RichEditor
                key={richKey}
                content={html}
                onChange={(next) => {
                  setHtml(next);
                  setDirty(true);
                }}
              />
            ) : (
              <HtmlModeEditor
                value={html}
                onChange={(next) => {
                  setHtml(next);
                  setDirty(true);
                }}
              />
            )}
            <FormattingTips mode={mode} />
          </div>
        </div>
      </FramePanel>

      <Dialog open={confirmRich} onOpenChange={setConfirmRich}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voltar para o editor visual?</DialogTitle>
            <DialogDescription>
              O editor visual mantém só títulos, listas, negrito, links, imagens e vídeos. Estilos,
              cores, fontes e caixas do HTML serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRich(false)}>
              Continuar no HTML
            </Button>
            <Button onClick={confirmSwitchToRich}>Converter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

type Mode = "rich" | "html";

/**
 * Código à esquerda, leitura do mentorado à direita. A pré-visualização usa o
 * mesmo `HtmlDocumentFrame` das telas do aluno e do mentor, renderizado na
 * largura da coluna de leitura do aluno e reduzido para caber.
 */
function HtmlModeEditor({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  // Cada mudança recarrega o iframe inteiro; sem o intervalo a prévia pisca a
  // cada tecla.
  const [deferred, setDeferred] = useState(value);
  // Diagnóstico só no cliente (usa DOMParser); roda no mesmo intervalo da
  // prévia, inclusive na montagem.
  const [issues, setIssues] = useState<string[]>([]);
  useEffect(() => {
    const id = setTimeout(() => {
      setDeferred(value);
      setIssues(diagnoseHtml(value));
    }, 300);
    return () => clearTimeout(id);
  }, [value]);
  // `<script>` sai no save de qualquer forma; tirar aqui mantém a prévia fiel
  // ao que fica salvo.
  const preview = deferred.replace(/<script\b[\s\S]*?<\/script\s*>/gi, "");
  const [fullOpen, setFullOpen] = useState(false);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="min-w-0">
        <span className="mb-1.5 block text-xs text-muted-foreground">Código HTML</span>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder="Cole aqui o HTML completo do repertório…"
          className="h-[70vh] resize-none font-mono text-xs leading-relaxed [field-sizing:fixed] md:text-xs"
        />
      </div>

      <div className="min-w-0">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="block text-xs text-muted-foreground">Como o mentorado vê</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs text-muted-foreground"
            onClick={() => setFullOpen(true)}
            disabled={!preview.trim()}
          >
            <Maximize2Icon className="size-3" />
            Tamanho real
          </Button>
        </div>
        {issues.length > 0 && (
          <div className="mb-2 space-y-1 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <p className="font-medium">Parte do visual deste HTML não chega ao mentorado:</p>
            <ul className="list-disc space-y-0.5 pl-4">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="h-[70vh] overflow-y-auto rounded-lg border border-border bg-background p-4">
          {preview.trim() ? (
            <HtmlDocumentFrame html={preview} renderWidth={STUDENT_READING_WIDTH} />
          ) : (
            <p className="text-xs text-muted-foreground">
              A pré-visualização aparece aqui assim que houver conteúdo.
            </p>
          )}
        </div>
      </div>

      <Dialog open={fullOpen} onOpenChange={setFullOpen}>
        {/* Mesmo fundo e rótulo da tela do aluno (`RepertoireBlock`), não o
            branco padrão do diálogo. */}
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-background p-6 sm:max-w-[calc(896px+3rem)]">
          <DialogHeader>
            <DialogTitle className="sr-only">Como o mentorado vê</DialogTitle>
          </DialogHeader>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Repertório
            </p>
            <HtmlDocumentFrame html={preview} renderWidth={STUDENT_READING_WIDTH} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const isRemote = (url: string) => /^https:\/\//i.test(url.trim());

/**
 * Aponta o que faz o HTML parecer diferente do arquivo aberto no navegador:
 * tudo aqui é removido no save ou não existe no servidor, e sem o aviso a
 * prévia só mostra "texto formatado" sem explicar por quê.
 */
function diagnoseHtml(html: string): string[] {
  if (!html.trim()) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const issues: string[] = [];

  const scripts = doc.querySelectorAll("script");
  if (scripts.length > 0) {
    const cdn = Array.from(scripts).some((s) => /tailwind/i.test(s.getAttribute("src") ?? ""));
    issues.push(
      cdn
        ? "O estilo vem do Tailwind via <script>. Scripts são removidos por segurança: o HTML precisa trazer o CSS pronto num <style>."
        : `${scripts.length} <script> encontrado(s). Scripts são removidos por segurança; o que eles desenham ou estilizam não aparece.`
    );
  }

  doc.querySelectorAll('link[rel~="stylesheet"]').forEach((link) => {
    const href = link.getAttribute("href") ?? "";
    if (!isRemote(href)) {
      issues.push(
        `A folha de estilo "${href}" é um arquivo local. Copie o conteúdo dela para um <style> dentro do HTML.`
      );
    }
  });

  const localImages = Array.from(doc.querySelectorAll("img")).filter(
    (img) => !isRemote(img.getAttribute("src") ?? "")
  );
  if (localImages.length > 0) {
    issues.push(
      `${localImages.length} imagem(ns) com endereço local. Publique a imagem e use um link https.`
    );
  }

  const hasCss =
    doc.querySelector("style") ||
    doc.querySelector('link[rel~="stylesheet"]') ||
    doc.querySelector("[style]");
  if (!hasCss) {
    issues.push(
      "Este HTML não tem estilos próprios (nenhum <style>). Se ele veio do editor visual, a formatação original já se perdeu: cole de novo o arquivo HTML original."
    );
  }

  return issues;
}

/** Recolhido por padrão: útil na primeira vez, ruído em todas as outras. */
function FormattingTips({ mode }: { mode: Mode }) {
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
        {mode === "html" ? (
          <div className="space-y-1 pt-2 pl-4.5 text-xs text-muted-foreground">
            <p>
              Cole o arquivo HTML inteiro, com o &lt;style&gt; e os links de fonte: o mentorado vê
              exatamente o que aparece na pré-visualização.
            </p>
            <p>
              Ao salvar, scripts, formulários e iframes que não sejam do YouTube são removidos.
              Imagens precisam estar publicadas num endereço https.
            </p>
          </div>
        ) : (
          <div className="space-y-1 pt-2 pl-4.5 text-xs text-muted-foreground">
            <p>Título, subtítulo, negrito, listas, citação, link, imagem e vídeo do YouTube.</p>
            <p>
              Colar código HTML converte automaticamente em conteúdo formatado — para colar as
              tags como texto, use Ctrl+Shift+V. Tabelas viram parágrafos e cores não são
              suportadas. Imagem colada continua hospedada na origem: envie pelo botão de
              imagem para garantir que não suma.
            </p>
            <p>Para manter o visual de um HTML pronto (estilos, fontes, caixas), use o modo HTML.</p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
