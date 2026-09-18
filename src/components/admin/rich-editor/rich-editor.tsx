"use client";

import { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { toast } from "sonner";
import { uploadRepertoireImage } from "@/lib/actions/admin/uploads";
import { toRichHtml } from "@/lib/rich-content";
import { cn } from "@/lib/utils";
import { Toolbar } from "./toolbar";

/**
 * `full` é o editor do repertório (títulos, imagem, vídeo). `compact` é o de
 * textos curtos — instruções e perguntas de exercício — sem títulos nem mídia;
 * o servidor aplica a allowlist correspondente (`sanitizeCompactHtml`).
 */
export type RichEditorVariant = "full" | "compact";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  variant?: RichEditorVariant;
  /**
   * Variação de contexto da leitura (cor, peso) espelhada no editor — passe o
   * mesmo `className` que o `RichContent` correspondente recebe.
   */
  contentClassName?: string;
}

export function RichEditor({
  content,
  onChange,
  placeholder,
  variant = "full",
  contentClassName,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const compact = variant === "compact";
  const minHeight = compact ? "min-h-20" : "min-h-64";

  const editor = useEditor({
    // O conteúdo é renderizado no servidor e hidratado no cliente; sem isto o
    // React acusa mismatch de hidratação no primeiro paint.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // `<h1>` é o título da página — o conteúdo começa em H2.
        heading: compact ? false : { levels: [2, 3] },
        // O StarterKit v3 já traz o Link; configuramos aqui em vez de somar
        // uma segunda instância da extensão, que o TipTap rejeita.
        link: { openOnClick: false, autolink: true },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Escreva o repertório deste tópico…",
      }),
      ...(compact
        ? []
        : [
            Image.configure({ inline: false }),
            Youtube.configure({ controls: true, nocookie: true, width: 640, height: 360 }),
          ]),
    ],
    // Texto puro legado (anterior ao editor rico) abre já convertido.
    content: toRichHtml(content),
    editorProps: {
      attributes: {
        // Mesma classe usada na leitura (`RichContent`): o que se vê editando
        // é o que aluno e mentor vão ver. O padding fica no wrapper, não aqui:
        // a folha fixa a medida da linha em `max-width`, e padding neste
        // elemento encolheria a linha só no editor.
        class: cn("tiptap-content focus:outline-none", minHeight, contentClassName),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const handlePickImage = useCallback(
    async (file: File) => {
      if (!editor) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadRepertoireImage(formData);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        editor.chain().focus().setImage({ src: result.data.url, alt: file.name }).run();
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  if (!editor) {
    return (
      <div className="rounded-lg border border-input">
        <div className="h-10 border-b border-border" />
        <div className={cn("px-4 py-3 text-base text-muted-foreground", minHeight)}>
          Carregando editor…
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 transition-colors">
      <Toolbar
        editor={editor}
        variant={variant}
        onPickImage={handlePickImage}
        uploading={uploading}
      />
      <EditorContent editor={editor} className="px-4 py-3" />
    </div>
  );
}
