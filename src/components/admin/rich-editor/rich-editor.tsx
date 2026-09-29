"use client";

import { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { toast } from "sonner";
import { uploadRepertoireImage } from "@/lib/actions/admin/uploads";
import { isPlainTextPaste, looksLikeHtmlSource, normalizeHtmlSource } from "./paste-html";
import { Toolbar } from "./toolbar";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichEditor({ content, onChange, placeholder }: Props) {
  const [uploading, setUploading] = useState(false);
  // `view.pasteHTML` reentra no `handlePaste` abaixo; sem a trava, o segundo
  // passe leria o mesmo clipboard e chamaria `pasteHTML` de novo, sem fim.
  const convertingPaste = useRef(false);

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
      // Código-fonte HTML colado como texto: sem isto o ProseMirror usa o
      // flavor `text/plain` e o mentorado acaba lendo as tags cruas na tela.
      //
      // Lemos `text/plain` mesmo quando existe `text/html` de propósito —
      // copiar de um editor de código traz um `text/html` de spans de
      // destaque de sintaxe, e a fonte de verdade é o texto puro.
      handlePaste(view, event) {
        if (convertingPaste.current) return false;
        if (isPlainTextPaste(view)) return false;
        // Dentro de um bloco de código o ProseMirror já insere texto puro;
        // converter ali destruiria justamente o uso do bloco.
        if (view.state.selection.$from.parent.type.spec.code) return false;

        const text = event.clipboardData?.getData("text/plain") ?? "";
        if (!looksLikeHtmlSource(text)) return false;

        convertingPaste.current = true;
        try {
          // Delegar ao `pasteHTML` em vez de montar o slice à mão: é ele que
          // normaliza os irmãos do topo, abre o slice para o texto fundir no
          // parágrafo atual e marca a transação como `paste` — meta que as
          // paste rules do TipTap (YouTube, link) verificam para rodar.
          //
          // Se o HTML normalizado ficar vazio ele devolve `false`, e o paste
          // original segue adiante como texto literal.
          return view.pasteHTML(normalizeHtmlSource(text), event);
        } finally {
          convertingPaste.current = false;
        }
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
