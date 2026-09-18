"use client";

import { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { toast } from "sonner";
import { uploadRepertoireImage } from "@/lib/actions/admin/uploads";
import { Toolbar } from "./toolbar";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichEditor({ content, onChange, placeholder }: Props) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    // O conteúdo é renderizado no servidor e hidratado no cliente; sem isto o
    // React acusa mismatch de hidratação no primeiro paint.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // `<h1>` é o título da página — o conteúdo começa em H2.
        heading: { levels: [2, 3] },
        // O StarterKit v3 já traz o Link; configuramos aqui em vez de somar
        // uma segunda instância da extensão, que o TipTap rejeita.
        link: { openOnClick: false, autolink: true },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Escreva o repertório deste tópico…",
      }),
      Image.configure({ inline: false }),
      Youtube.configure({ controls: true, nocookie: true, width: 640, height: 360 }),
    ],
    content,
    editorProps: {
      attributes: {
        // Mesma classe usada na leitura do aluno: o que se vê editando é o que
        // o aluno vai ver.
        class: "tiptap-content focus:outline-none min-h-64 px-4 py-3",
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
        <div className="min-h-64 px-4 py-3 text-sm text-muted-foreground">Carregando editor…</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 transition-colors">
      <Toolbar editor={editor} onPickImage={handlePickImage} uploading={uploading} />
      <EditorContent editor={editor} />
    </div>
  );
}
