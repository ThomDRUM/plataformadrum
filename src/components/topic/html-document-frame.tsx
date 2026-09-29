"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Largura da coluna de leitura do aluno (`max-w-4xl`). */
export const STUDENT_READING_WIDTH = 896;

const MESSAGE_TYPE = "drum-html-frame";

/**
 * Roda dentro do iframe: avisa a página de fora sobre a altura do documento
 * (o iframe não tem rolagem própria, cresce com o conteúdo) e sobre cliques em
 * âncoras internas — `#secao` rolaria só o iframe, que não rola, então quem
 * rola é a página de fora.
 */
const FRAME_SCRIPT = `<script>(function(){
function h(){var d=document.documentElement,b=document.body,s=b?getComputedStyle(b):null;
return Math.ceil(Math.max(d.getBoundingClientRect().height,b?b.scrollHeight+parseFloat(s.marginTop)+parseFloat(s.marginBottom):0));}
var last=0;function send(){var v=h();if(v!==last){last=v;parent.postMessage({type:"${MESSAGE_TYPE}",height:v},"*");}}
if(window.ResizeObserver){var ro=new ResizeObserver(send);ro.observe(document.documentElement);if(document.body)ro.observe(document.body);}
addEventListener("load",send);send();
document.addEventListener("click",function(e){var a=e.target&&e.target.closest?e.target.closest('a[href^="#"]'):null;if(!a)return;
var id=decodeURIComponent(a.getAttribute("href").slice(1));var el=id&&(document.getElementById(id)||document.getElementsByName(id)[0]);
e.preventDefault();if(el)parent.postMessage({type:"${MESSAGE_TYPE}",scrollTo:el.getBoundingClientRect().top+scrollY},"*");});
})();</script>`;

/**
 * Tipografia de leitura do aluno dentro do iframe, que não herda o CSS do app.
 * Espelha `.tiptap-content text-base text-foreground/80` (globals.css e
 * `RepertoireBlock`) — mudou lá, muda aqui. Cores copiadas do `:root`.
 *
 * Tudo em `:where()`: especificidade zero, então qualquer regra do `<style>`
 * do autor vence, mesmo um `p {}` simples. HTML sem estilo próprio lê como o
 * resto da plataforma; HTML com estilo próprio fica como foi escrito.
 *
 * Geist vem do Google Fonts, não do `next/font`: o iframe tem origem opaca e
 * os arquivos auto-hospedados não carregariam sem CORS.
 */
const BASE_HEAD = `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap">
<style data-drum-base>
:where(html,body){margin:0;padding:0;background:transparent}
:where(body){font-family:"Geist",ui-sans-serif,system-ui,sans-serif;font-size:16px;line-height:1.625;
color:oklch(0.18 0.008 255 / 0.8);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
font-feature-settings:"kern" 1,"liga" 1}
:where(*,*::before,*::after){box-sizing:border-box}
:where(p){margin:0 0 .75rem}
:where(h1,h2,h3,h4,h5,h6){font-size:inherit;font-weight:600;letter-spacing:-0.025em;margin:0}
:where(h1,h2){font-size:18px;line-height:28px;margin:1.5rem 0 .75rem}
:where(h3){font-size:16px;line-height:24px;margin:1rem 0 .5rem}
:where(ul,ol){margin:0 0 .75rem;padding-left:1.25rem}
:where(ul){list-style:disc}
:where(ol){list-style:decimal}
:where(li+li){margin-top:.25rem}
:where(blockquote){margin:0;border-left:2px solid oklch(0.91 0.005 106);padding-left:1rem;font-style:italic;color:oklch(0.52 0.012 255)}
:where(strong,b){font-weight:600}
:where(a){color:oklch(0.44 0.13 155);text-decoration:underline;text-underline-offset:2px}
:where(hr){margin:1.5rem 0;border:0;border-top:1px solid oklch(0.91 0.005 106)}
:where(code){border-radius:.25rem;background:oklch(0.955 0.005 106);padding:.125rem .25rem;font-size:.9em}
:where(pre){margin:0 0 .75rem;overflow-x:auto;border-radius:.625rem;background:oklch(0.955 0.005 106);padding:.75rem;font-size:.9em}
:where(pre code){background:transparent;padding:0}
:where(img){display:block;margin:1rem 0;height:auto;max-width:100%;border-radius:.625rem;border:1px solid oklch(0.91 0.005 106)}
:where(div[data-youtube-video]){margin:1rem 0}
:where(div[data-youtube-video] iframe){display:block;aspect-ratio:16/9;height:auto;width:100%;border-radius:.625rem;border:1px solid oklch(0.91 0.005 106);background:oklch(0.955 0.005 106)}
</style>`;

function buildSrcDoc(html: string): string {
  // O CSS base entra antes de tudo, logo depois do doctype: fica no `<head>`
  // (o parser junta o `<head>` do autor ao mesmo elemento) e antes do
  // `<style>` do autor na cascata.
  const doctypeMatch = html.match(/^\s*<!doctype[^>]*>/i);
  const doctype = doctypeMatch ? doctypeMatch[0] : "<!DOCTYPE html>";
  const rest = doctypeMatch ? html.slice(doctypeMatch[0].length) : html;
  // Script no fim: com `</body>` presente entra antes dele; sem, o parser do
  // navegador o coloca no body de qualquer forma.
  const withScript = /<\/body>/i.test(rest)
    ? rest.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${FRAME_SCRIPT}</body>`)
    : rest + FRAME_SCRIPT;
  return doctype + BASE_HEAD + withScript;
}

interface Props {
  html: string;
  /**
   * Renderiza o documento nesta largura e reduz para caber no container —
   * a pré-visualização do admin mostra o layout do aluno, não um layout
   * espremido pela coluna estreita.
   */
  renderWidth?: number;
  className?: string;
  title?: string;
}

/**
 * Exibe um repertório no modo HTML exatamente como foi escrito: o documento
 * vive num iframe, com CSS e fontes próprios, sem herdar nem vazar estilo do
 * app.
 *
 * Sandbox com `allow-scripts` mas sem `allow-same-origin`: o iframe roda numa
 * origem opaca, então nem o nosso script de altura nem qualquer coisa no
 * conteúdo alcança cookies, sessão ou o DOM da plataforma.
 */
export function HtmlDocumentFrame({ html, renderWidth, className, title = "Repertório" }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const srcDoc = useMemo(() => buildSrcDoc(html), [html]);
  const scale =
    renderWidth && containerWidth ? Math.min(1, containerWidth / renderWidth) : 1;

  useEffect(() => {
    if (!renderWidth || !wrapperRef.current) return;
    const el = wrapperRef.current;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [renderWidth]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { type?: string; height?: number; scrollTo?: number };
      if (data?.type !== MESSAGE_TYPE) return;

      if (typeof data.height === "number") setHeight(data.height);

      if (typeof data.scrollTo === "number" && iframeRef.current) {
        const frameTop = iframeRef.current.getBoundingClientRect().top;
        const target = frameTop + data.scrollTo * scale;
        const scroller = findScrollParent(wrapperRef.current);
        const offset = 24;
        if (scroller) {
          scroller.scrollBy({
            top: target - scroller.getBoundingClientRect().top - offset,
            behavior: "smooth",
          });
        } else {
          window.scrollBy({ top: target - offset, behavior: "smooth" });
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [scale]);

  return (
    <div
      ref={wrapperRef}
      className={cn("w-full overflow-hidden", className)}
      style={{ height: height ? height * scale : undefined }}
    >
      <iframe
        ref={iframeRef}
        title={title}
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        className="block border-0"
        style={{
          width: renderWidth ?? "100%",
          height: height || 200,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}
