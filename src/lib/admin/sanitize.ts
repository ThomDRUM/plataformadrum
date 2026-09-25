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
    // O StarterKit traz Underline por padrão e a regra de parse casa `<u>` e
    // `text-decoration: underline`. Sem `u` aqui, um sublinhado colado aparece
    // no editor e some no save, sem o autor entender por quê.
    "u",
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

/**
 * Repertório no modo HTML: um documento completo, com `<style>`, classes e
 * fontes próprias, escrito fora da plataforma e colado aqui. Ele é exibido
 * num iframe sem `allow-scripts` (ver `HtmlDocumentFrame`), então o CSS fica
 * isolado do app e o JS não roda de qualquer forma. A allowlist mantém tudo
 * que é apresentação e corta o que executa código ou navega sozinho.
 */
const DOCUMENT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "html",
    "head",
    "body",
    "title",
    "meta",
    "link",
    "style",
    "h1",
    "u",
    "s",
    "img",
    "picture",
    "source",
    "figure",
    "figcaption",
    "iframe",
  ]),
  // `style` está na lista de tags "vulneráveis" do sanitize-html; aqui o
  // documento roda sem scripts dentro de um iframe isolado, que é o que
  // torna o CSS livre aceitável.
  allowVulnerableTags: true,
  allowedAttributes: {
    "*": [
      "class",
      "style",
      "id",
      "title",
      "lang",
      "dir",
      "role",
      "aria-*",
      "data-*",
      "align",
      "width",
      "height",
      "colspan",
      "rowspan",
    ],
    a: ["href", "name", "target", "rel"],
    img: ["src", "srcset", "sizes", "alt", "loading"],
    source: ["srcset", "type", "media"],
    link: ["rel", "href", "media", "crossorigin"],
    meta: ["charset", "name", "content"],
    iframe: ["src", "allow", "allowfullscreen", "frameborder"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"], link: ["https"] },
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"],
  // Só `<link>` de folha de estilo (fontes do Google, por exemplo) e
  // `<meta>` inofensivos: `http-equiv="refresh"` redirecionaria o iframe.
  exclusiveFilter: (frame) =>
    (frame.tag === "link" && !/(^|\s)(stylesheet|preconnect)(\s|$)/i.test(frame.attribs.rel ?? "")) ||
    (frame.tag === "meta" && !("charset" in frame.attribs) && frame.attribs.name !== "viewport"),
  transformTags: {
    // Links externos abrem em outra aba; âncoras internas (`#secao`) ficam
    // como estão, o iframe cuida da rolagem.
    a: (tagName, attribs) =>
      /^https?:/i.test(attribs.href ?? "")
        ? { tagName, attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" } }
        : { tagName, attribs },
  },
};

export function sanitizeHtmlDocument(html: string): string {
  return sanitizeHtml(html, DOCUMENT_OPTIONS);
}
