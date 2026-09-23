import type { EditorView } from "@tiptap/pm/view";

/**
 * Colar código-fonte HTML como texto no editor de repertório.
 *
 * Sem isto, o ProseMirror lê o flavor `text/plain` do clipboard e insere a
 * marcação como texto literal — o autor cola `<h1>Título</h1>` e o mentorado
 * lê a tag na tela. Aqui a heurística decide se aquele texto é, na verdade,
 * marcação, e o normaliza para o vocabulário que o schema do editor entende.
 *
 * A detecção é deliberadamente conservadora: converter um texto que o autor
 * queria literal é pior do que deixar um caso raro passar direto.
 */

// Tags que caracterizam "isto é HTML", e não um texto com um sinal de menor.
const KNOWN_TAGS =
  "p|div|span|br|hr|h1|h2|h3|h4|h5|h6|ul|ol|li|dl|dt|dd|blockquote|pre|code|" +
  "strong|b|em|i|u|s|strike|del|ins|mark|sub|sup|small|a|img|figure|figcaption|" +
  "table|thead|tbody|tfoot|tr|th|td|caption|iframe|section|article|header|" +
  "footer|main|aside|nav";

const OPENING_TAG = new RegExp(`<(?:${KNOWN_TAGS})(?:\\s[^>]*)?/?>`, "i");
const CLOSING_TAG = new RegExp(`</(?:${KNOWN_TAGS})\\s*>`, "i");
const SINGLE_VOID_TAG = /^<(?:img|br|hr)(?:\s[^>]*)?\/?>$/i;

// Resposta de IA quase sempre vem cercada. Só a cerca *etiquetada* `html` é
// desembrulhada: uma cerca sem linguagem é mais provavelmente intencional.
const HTML_FENCE = /^```html?[^\S\r\n]*\r?\n([\s\S]*?)\r?\n?```$/i;

function unfence(raw: string): string {
  const match = HTML_FENCE.exec(raw.trim());
  return match ? match[1] : raw;
}

export function looksLikeHtmlSource(raw: string): boolean {
  const text = unfence(raw).trim();

  // O menor caso real é `<p>a</p>`.
  if (text.length < 8) return false;
  if (!text.startsWith("<") || !text.endsWith(">")) return false;
  if (!OPENING_TAG.test(text)) return false;

  // Exigir um fechamento é o que separa marcação de um `<p>` digitado por
  // engano. A exceção são as tags vazias coladas sozinhas.
  return CLOSING_TAG.test(text) || SINGLE_VOID_TAG.test(text);
}

// O schema do editor só tem H2 e H3 — `<h1>` é o título da página. Sem o
// remap, um `<h1>` colado cai como parágrafo: o texto sobrevive, a hierarquia
// não.
const HEADING_MAP: Record<string, string> = { H1: "h2", H4: "h3", H5: "h3", H6: "h3" };

const YOUTUBE_SRC = /^https?:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com|youtu\.be)\//i;

const DROPPED_TAGS = "script, style, noscript, link, meta, base, title";

function stripComments(doc: Document, body: HTMLElement) {
  // Comentários não têm regra no schema e o parser os ignora, mas tirá-los
  // aqui mantém o que serializamos igual ao que o autor vai ver.
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_COMMENT);
  const comments: Node[] = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  for (const node of comments) node.parentNode?.removeChild(node);
}

function stripActiveAttributes(body: HTMLElement) {
  for (const el of Array.from(body.querySelectorAll<HTMLElement>("*"))) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      const isJsUrl = (name === "href" || name === "src") && value.startsWith("javascript:");
      if (name.startsWith("on") || isJsUrl) el.removeAttribute(attr.name);
    }
  }
}

function remapHeadings(doc: Document, body: HTMLElement) {
  for (const el of Array.from(body.querySelectorAll("h1, h4, h5, h6"))) {
    const heading = doc.createElement(HEADING_MAP[el.tagName]);
    heading.append(...Array.from(el.childNodes));
    el.replaceWith(heading);
  }
}

function wrapYoutubeIframes(doc: Document, body: HTMLElement) {
  // A extensão do YouTube só reconhece `div[data-youtube-video] > iframe`. Um
  // `<iframe>` solto não casa com regra nenhuma e desapareceria em silêncio —
  // envolvê-lo é a diferença entre "sumiu" e "virou vídeo".
  for (const iframe of Array.from(body.querySelectorAll("iframe"))) {
    const src = iframe.getAttribute("src") ?? "";
    if (!YOUTUBE_SRC.test(src)) {
      // Qualquer outra origem seria barrada no servidor de qualquer forma.
      iframe.remove();
      continue;
    }
    if (iframe.parentElement?.hasAttribute("data-youtube-video")) continue;

    const wrapper = doc.createElement("div");
    wrapper.setAttribute("data-youtube-video", "");
    iframe.replaceWith(wrapper);
    wrapper.appendChild(iframe);
  }
}

function flattenTables(doc: Document, body: HTMLElement) {
  // Não há extensão de tabela. Sem tratamento, o parser do ProseMirror desce
  // nas células e o texto de todas elas escorre grudado para dentro de um
  // parágrafo só. Uma linha por parágrafo ao menos continua legível.
  for (const table of Array.from(body.querySelectorAll("table"))) {
    const rows = Array.from(table.querySelectorAll("tr"));
    const paragraphs = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll("th, td"))
          .map((cell) => (cell.textContent ?? "").trim())
          .filter(Boolean);
        if (cells.length === 0) return null;

        const p = doc.createElement("p");
        p.textContent = cells.join(" — ");
        return p;
      })
      .filter((p): p is HTMLParagraphElement => p !== null);

    table.replaceWith(...paragraphs);
  }
}

export function normalizeHtmlSource(raw: string): string {
  // `window.DOMParser` produz um documento inerte: não executa script nem
  // dispara requisição de imagem, ao contrário de `innerHTML` num nó vivo.
  const doc = new window.DOMParser().parseFromString(unfence(raw).trim(), "text/html");
  const { body } = doc;

  for (const el of Array.from(body.querySelectorAll(DROPPED_TAGS))) el.remove();
  stripComments(doc, body);
  stripActiveAttributes(body);
  remapHeadings(doc, body);
  wrapYoutubeIframes(doc, body);
  flattenTables(doc, body);

  return body.innerHTML;
}

/**
 * Colar sem formatação (Ctrl+Shift+V) é o pedido explícito de "quero o texto
 * literal" — e é a única saída para quem precisa mostrar as tags na tela.
 *
 * O evento de paste não carrega o modificador; o ProseMirror guarda a tecla em
 * `view.input`, que é interno, daí o acesso defensivo. O teste é o mesmo que
 * ele usa: `Shift+Insert` (keyCode 45) é colagem normal, não colagem sem
 * formatação. Se o campo sumir numa versão futura, o pior caso é a conversão
 * acontecer.
 */
export function isPlainTextPaste(view: EditorView): boolean {
  const { input } = view as unknown as {
    input?: { shiftKey?: unknown; lastKeyCode?: unknown };
  };
  return input?.shiftKey === true && input.lastKeyCode !== 45;
}
