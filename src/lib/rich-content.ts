/**
 * Conteúdo rico (repertório, instruções e perguntas de exercício) é gravado
 * como HTML do editor. Instruções e perguntas, porém, nasceram como texto puro
 * com uma convenção caseira (linha em branco = parágrafo, "- " = item de
 * lista), e as linhas antigas continuam assim no banco até alguém regravá-las.
 *
 * Estas funções rodam no servidor e no cliente — nada de `server-only` aqui.
 */

// HTML do editor sempre começa por uma tag de bloco. Aceitamos qualquer tag, e
// não só as do editor, porque o repertório legado tem HTML escrito à mão
// (`<h1>`, `<span>`…) que não pode passar a aparecer escapado.
const HTML_START = /^\s*<[a-z][a-z0-9]*[\s>/]/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.every((line) => line.startsWith("- "))) {
        const items = lines
          .map((line) => `<li><p>${escapeHtml(line.replace(/^-\s*/, ""))}</p></li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      return `<p>${escapeHtml(lines.join(" "))}</p>`;
    })
    .join("");
}

/**
 * Devolve HTML pronto para o editor e para a leitura: HTML do editor passa
 * direto, texto puro legado é escapado e convertido.
 */
export function toRichHtml(value: string | null | undefined): string {
  if (!value) return "";
  return HTML_START.test(value) ? value : plainTextToHtml(value);
}

/** O editor vazio produz `<p></p>`, que não é string vazia. */
export function isRichContentEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  if (/<(img|iframe)\b/i.test(html)) return false;
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length === 0
  );
}
