"use server";

import { assertAdmin } from "@/lib/auth/admin";
import type { ActionResult } from "@/lib/admin/types";

// Não exportado: num arquivo "use server" todo export precisa ser uma função
// async — uma constante exportada quebra o build.
const REPERTOIRE_BUCKET = "repertorio";

const MAX_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/**
 * Sobe uma imagem do editor de repertório e devolve a URL pública.
 *
 * Tipo e tamanho são validados aqui, não no `<input accept>`: o input é uma
 * conveniência do navegador e some com um FormData montado à mão.
 */
export async function uploadRepertoireImage(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  try {
    const { db } = await assertAdmin();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false, error: "Nenhum arquivo recebido." };
    }

    if (file.size === 0) {
      return { ok: false, error: "O arquivo está vazio." };
    }

    if (file.size > MAX_BYTES) {
      return { ok: false, error: "A imagem passa de 5 MB. Reduza o arquivo e tente de novo." };
    }

    // SVG fica de fora: é um documento executável, e o sanitizador do
    // `content_html` não alcança o conteúdo de um arquivo servido pelo Storage.
    const extension = EXTENSION_BY_TYPE[file.type];
    if (!extension || file.type === "image/svg+xml") {
      return { ok: false, error: "Formato não suportado. Use PNG, JPG, WEBP ou GIF." };
    }

    const path = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await db.storage
      .from(REPERTOIRE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      const hint = /not found/i.test(uploadError.message)
        ? ` Verifique se o bucket "${REPERTOIRE_BUCKET}" existe e é público no Supabase.`
        : "";
      return { ok: false, error: `${uploadError.message}.${hint}` };
    }

    const { data } = db.storage.from(REPERTOIRE_BUCKET).getPublicUrl(path);

    return { ok: true, data: { url: data.publicUrl } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
