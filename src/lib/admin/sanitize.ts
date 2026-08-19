import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * O `content_html` do repertório é renderizado com `dangerouslySetInnerHTML`
 * no lado do aluno e do mentor. Hoje o único autor é o admin, mas o HTML
 * chega pela rede como qualquer outro campo de formulário — a allowlist é o
 * que separa "conteúdo escrito no editor" de "o que veio na requisição".
 *
 * Permite exatamente o que a barra de ferramentas do editor produz.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "s",
    "code",
    "pre",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "blockquote",
    "hr",
    "a",
    "img",
    "div",
    "iframe",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    // O nó de vídeo do TipTap é um <div data-youtube-video> envolvendo o iframe.
    div: ["data-youtube-video"],
    iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  // `data:` fica de fora de propósito: as imagens do editor sobem para o
  // Storage e entram como URL, então um data URI aqui só serviria para inflar
  // a linha do banco com um payload arbitrário.
  allowedSchemesByTag: { img: ["http", "https"] },
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"],
  transformTags: {
    // Link externo sem `rel` é um vazamento de referrer e um vetor de
    // tabnabbing; o editor não tem onde configurar isso.
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

export function sanitizeContentHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
